import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { getMatches } from '../services/api.js';
import useMatchesWebSocket from '../hooks/useMatchesWebSocket.js';
import useNow from '../hooks/useNow.js';
import './Matches.css';

const supportedSports = new Set(['football', 'cricket']);

const statusFilters = [
  { key: 'all', label: 'All matches' },
  { key: 'live', label: 'Live now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'finished', label: 'Finished' },
];

const STATUS_LABEL = {
  football: { live: 'LIVE', finished: 'FULL TIME', upcoming: 'UPCOMING' },
  cricket: { live: 'LIVE', finished: 'COMPLETED', upcoming: 'UPCOMING' },
};

function normalizeStatus(status) {
  if (status === 'scheduled') return 'upcoming';
  return status?.toLowerCase() ?? 'unknown';
}

function getInitials(teamName = '') {
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function formatPosterDate(value) {
  if (!value) return 'Time TBC';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBC';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatKickoff(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time TBC';

  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  return isToday
    ? `Today, ${time}`
    : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

/* ------------------------------ clocks & labels ------------------------------ */

// Football match minute derived from the wall clock, so it keeps ticking between events.
// (The backend spreads a 95' match across the live window, so this lines up with the events.)
function footballClock(match, now) {
  const start = new Date(match.startTime).getTime();
  const end = new Date(match.endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return match.score?.minute != null ? `${match.score.minute}'` : 'Live';
  }

  const fraction = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const minute = Math.floor(fraction * 95);

  if (minute === 45) return 'HT';
  if (minute > 90) return `90+${minute - 90}'`;
  return `${Math.max(1, minute)}'`;
}

function startsLabel(match, now) {
  const diff = new Date(match.startTime).getTime() - now;
  if (Number.isNaN(diff)) return 'Time TBC';
  if (diff <= 0) return 'Starting…';
  if (diff > 60 * 60 * 1000) return formatPosterDate(match.startTime);

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `in ${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getCricketSideScore(match, side) {
  const score = match.score?.[side];
  if (score && typeof score === 'object') {
    return {
      runs: score.runs ?? 0,
      wickets: score.wickets ?? 0,
      overs: score.overs ?? null,
      balls: score.balls ?? null,
    };
  }

  return {
    runs: match[side === 'home' ? 'homeScore' : 'awayScore'] ?? 0,
    wickets: 0,
    overs: null,
    balls: null,
  };
}

function cricketNote(match, status) {
  const score = match.score ?? {};

  if (status === 'finished') return score.result ?? null;
  if (status !== 'live' || !score.battingSide) return null;

  const team = score.battingSide === 'away' ? match.awayTeam : match.homeTeam;

  if (score.innings === 2 && score.runsNeeded != null) {
    return score.runsNeeded > 0
      ? `${team} need ${score.runsNeeded} off ${score.ballsLeft} balls`
      : `${team} have reached the target`;
  }

  return score.crr
    ? `${team} batting · run rate ${Number(score.crr).toFixed(2)}`
    : `${team} batting`;
}

function footballNote(match, status) {
  const home = match.homeScore ?? match.score?.home ?? 0;
  const away = match.awayScore ?? match.score?.away ?? 0;

  if (status === 'live') {
    if (home === away) return home === 0 ? 'Goalless so far' : 'Scores level';
    return `${home > away ? match.homeTeam : match.awayTeam} lead by ${Math.abs(home - away)}`;
  }

  if (status === 'finished') {
    if (home === away) return 'Match drawn';
    return `${home > away ? match.homeTeam : match.awayTeam} won`;
  }

  return null;
}

/* -------------------------------- poster pieces ------------------------------- */

// Remounts when the value changes, which replays the CSS pop animation.
function ScorePop({ value }) {
  return (
    <span key={value} className="score-pop">
      {value}
    </span>
  );
}

const FOOTBALL_LOGOS = {
  Arsenal: '/team-logos/football/arsenal.png',
  Liverpool: '/team-logos/football/liverpool.png',
  'Real Madrid': '/team-logos/football/real-madrid.png',
  Barcelona: '/team-logos/football/barcelona.png',
  'Manchester City': '/team-logos/football/manchester-city.png',
  Chelsea: '/team-logos/football/chelsea.png',
  Tottenham: '/team-logos/football/tottenham.png',
  'AC Milan': '/team-logos/football/ac-milan.png',
};

function getTeamLogo(name, sport) {
  return sport === 'football' ? FOOTBALL_LOGOS[name] : null;
}

function TeamColumn({ name, crest, sport, className = '', children }) {
  const logo = getTeamLogo(name, sport);

  return (
    <div className={`poster-team ${className}`}>
      <div className={`poster-crest ${crest}`}>
        {logo ? (
          <img src={logo} alt="" aria-hidden="true" />
        ) : (
          getInitials(name)
        )}
      </div>
      <strong>{name}</strong>
      {children}
    </div>
  );
}

function PosterFrame({ match, sport, status, note, children }) {
  const footer =
    status === 'upcoming'
      ? [formatKickoff(match.startTime), match.venue].filter(Boolean).join(' · ')
      : match.venue ?? '';

  return (
    <Link
      to={`/matches/${match.id}`}
      className={`match-poster match-poster-${sport} poster-${status}`}
    >
      <article>
        <div className="poster-topline">
          <span className="poster-sport">
            <span aria-hidden="true">{sport === 'football' ? '⚽' : '🏏'}</span>
            {sport === 'football' ? 'Football' : 'Cricket'}
          </span>
          <span className={`poster-status poster-status-${status}`}>
            {STATUS_LABEL[sport]?.[status] ?? status.toUpperCase()}
          </span>
        </div>

        {match.competition ? <div className="poster-meta">{match.competition}</div> : null}

        {children}

        {note ? <div className="poster-note">{note}</div> : null}

        <div className="poster-bottomline">
          <span>{footer}</span>
          <span className="poster-arrow">↗</span>
        </div>
      </article>
    </Link>
  );
}

function FootballPoster({ match, status, now }) {
  const homeScore = match.homeScore ?? match.score?.home ?? 0;
  const awayScore = match.awayScore ?? match.score?.away ?? 0;

  return (
<PosterFrame match={match} sport="football" status={status} note={footballNote(match, status)}>
      <div className="poster-matchup">
        <TeamColumn name={match.homeTeam} sport="football" crest="football-crest" />

        <div className="poster-center">
          {status === 'upcoming' ? (
            <>
              <span className="poster-vs-label">VS</span>
              <span className="poster-sub">{startsLabel(match, now)}</span>
            </>
          ) : (
            <>
              <div className="poster-scoreline">
                <ScorePop value={homeScore} />
                <span className="poster-colon">:</span>
                <ScorePop value={awayScore} />
              </div>
              <span className="poster-sub">
                {status === 'live' ? footballClock(match, now) : 'Full time'}
              </span>
            </>
          )}
        </div>

        <TeamColumn name={match.awayTeam} sport="football" crest="football-crest" />
      </div>
    </PosterFrame>
  );
}

function CricketPoster({ match, status, now }) {
  const score = match.score ?? {};
  const battingSide = status === 'live' ? score.battingSide : null;
  const showScores = status !== 'upcoming';

  const renderSide = (side, team) => {
    const s = getCricketSideScore(match, side);
    const yetToBat = status === 'live' && s.balls === 0;

    return (
      <TeamColumn
        name={team}
        crest="cricket-crest"
        className={battingSide === side ? 'is-batting' : ''}
      >
        {showScores ? (
          <div className="poster-cricket-score">
            {yetToBat ? (
              <em>Yet to bat</em>
            ) : (
              <>
                <b>
                  <ScorePop value={`${s.runs}/${s.wickets}`} />
                </b>
                {s.overs != null ? <small>{s.overs} ov</small> : null}
              </>
            )}
          </div>
        ) : null}
      </TeamColumn>
    );
  };

  return (
    <PosterFrame match={match} sport="cricket" status={status} note={cricketNote(match, status)}>
      <div className="poster-matchup cricket-matchup">
        {renderSide('home', match.homeTeam)}

        <div className="poster-center">
          <span className="poster-vs-label">VS</span>
          <span className="poster-sub">
            {status === 'upcoming'
              ? startsLabel(match, now)
              : status === 'live'
                ? `Innings ${score.innings ?? 1}`
                : 'Final'}
          </span>
        </div>

        {renderSide('away', match.awayTeam)}
      </div>
    </PosterFrame>
  );
}

function renderMatchPoster(match, now) {
  const status = normalizeStatus(match.status);
  const Poster = match.sport?.toLowerCase() === 'football' ? FootballPoster : CricketPoster;
  return <Poster key={match.id} match={match} status={status} now={now} />;
}

/* ------------------------------------ page ------------------------------------ */

function sortMatches(matches) {
  return [...matches].sort((a, b) => {
    const statusOrder = { live: 0, upcoming: 1, finished: 2 };
    const statusDiff =
      (statusOrder[normalizeStatus(a.status)] ?? 3) -
      (statusOrder[normalizeStatus(b.status)] ?? 3);

    if (statusDiff !== 0) return statusDiff;

    const aTime = new Date(a.startTime).getTime();
    const bTime = new Date(b.startTime).getTime();

    return normalizeStatus(a.status) === 'finished'
      ? bTime - aTime
      : aTime - bTime;
  });
}

export default function Matches() {
  const [activeSport, setActiveSport] = useState('All');
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const now = useNow(1000);

  useEffect(() => {
    let isCurrent = true;

    setLoading(true);
    setError(null);

    getMatches()
      .then((data) => {
        if (!isCurrent) return;
        setMatches(
          data.filter((match) =>
            supportedSports.has(match.sport?.toLowerCase()),
          ),
        );
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [retryKey]);

  useMatchesWebSocket((message) => {
    if (message?.type === 'score_update') {
      const updated = message.data;
      if (!updated) return;

      setMatches((current) =>
        current.map((match) =>
          match.id === updated.matchId
            ? {
                ...match,
                homeScore: updated.homeScore,
                awayScore: updated.awayScore,
                score: updated.score,
                status: updated.status,
              }
            : match,
        ),
      );
      return;
    }

    if (message?.type === 'match_updated') {
      const updated = message.data;
      if (!updated) return;

      setMatches((current) =>
        current.map((match) => (match.id === updated.id ? updated : match)),
      );
    }
  });

  const filteredMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortMatches(
      matches.filter((match) => {
        const sportMatches =
          activeSport === 'All' ||
          match.sport?.toLowerCase() === activeSport.toLowerCase();

        const statusMatches =
          activeStatus === 'all' ||
          normalizeStatus(match.status) === activeStatus;

        const searchMatches =
          !query ||
          match.homeTeam?.toLowerCase().includes(query) ||
          match.awayTeam?.toLowerCase().includes(query);

        return sportMatches && statusMatches && searchMatches;
      }),
    );
  }, [activeSport, activeStatus, matches, searchQuery]);

  const groupedMatches = useMemo(
    () => ({
      live: filteredMatches.filter((m) => normalizeStatus(m.status) === 'live'),
      upcoming: filteredMatches.filter((m) => normalizeStatus(m.status) === 'upcoming'),
      finished: filteredMatches.filter((m) => normalizeStatus(m.status) === 'finished'),
    }),
    [filteredMatches],
  );

  const liveCount = matches.filter(
    (match) => normalizeStatus(match.status) === 'live',
  ).length;

  const renderSection = (key, title, kicker, sectionMatches) => {
    if (sectionMatches.length === 0) return null;

    return (
      <section className={`match-section match-section-${key}`} aria-labelledby={`${key}-heading`}>
        <div className="match-section-heading">
          <div>
            <p className="section-kicker">{kicker}</p>
            <h2 id={`${key}-heading`}>{title}</h2>
          </div>
          <span className="match-section-count">
            {sectionMatches.length} {sectionMatches.length === 1 ? 'match' : 'matches'}
          </span>
        </div>

        <div className="match-grid matches-grid">
          {sectionMatches.map((match) => renderMatchPoster(match, now))}
        </div>
      </section>
    );
  };

  return (
    <div className="app-shell" id="matches">
      <Navbar activeSport={activeSport} onSportChange={setActiveSport} />

      <main className="page-content matches-page">
        <section className="matches-header">
          <p className="eyebrow">
            <span className="eyebrow-line" /> Full fixture list
          </p>

          <div className="matches-title-row">
            <div>
              <h1>
                All Matches<span className="accent-dot">.</span>
              </h1>
              <p className="hero-description">
                Find live scores, upcoming fixtures, and completed matches in one place.
              </p>
            </div>

            <div className="live-summary" aria-label={`${liveCount} live matches`}>
              <strong>{liveCount}</strong>
              <span>live now</span>
            </div>
          </div>
        </section>

        {!loading && !error ? (
          <section className="matches-toolbar" aria-label="Match filters">
            <div className="matches-search">
              <label htmlFor="match-search">Search matches</label>
              <div className="search-input-wrap">
                <span aria-hidden="true">⌕</span>
                <input
                  id="match-search"
                  type="search"
                  placeholder="Search team..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                {searchQuery ? (
                  <button
                    className="clear-search"
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>

            <div className="status-filters" role="tablist" aria-label="Filter by match status">
              {statusFilters.map((filter) => (
                <button
                  key={filter.key}
                  className={`status-filter ${activeStatus === filter.key ? 'selected' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={activeStatus === filter.key}
                  onClick={() => setActiveStatus(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {loading ? <p className="page-state">Loading matches...</p> : null}

        {error ? (
          <div className="page-state error-state">
            <strong>Unable to load matches</strong>
            <button
              className="retry-button"
              onClick={() => setRetryKey((value) => value + 1)}
              type="button"
            >
              Retry
            </button>
          </div>
        ) : null}

        {!loading && !error ? (
          <>
            <div className="content-heading matches-result-heading" id="matches-list">
              <div>
                <p className="section-kicker">Your scoreboard</p>
                <h2>
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : activeStatus === 'all'
                      ? 'Matches'
                      : statusFilters.find((item) => item.key === activeStatus)?.label}
                </h2>
              </div>
              <span className="match-count">
                {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {filteredMatches.length > 0 ? (
              <div className="match-sections">
                {renderSection('live', 'Live now', 'The action is on', groupedMatches.live)}
                {renderSection('upcoming', 'Upcoming', 'Mark your calendar', groupedMatches.upcoming)}
                {renderSection('finished', 'Finished', 'Recently completed', groupedMatches.finished)}
              </div>
            ) : (
              <div className="matches-empty">
                <div className="matches-empty-icon" aria-hidden="true">⌕</div>
                <h2>No matches found</h2>
                <p>Try a different team name or clear one of the filters.</p>
                <button
                  className="retry-button"
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveSport('All');
                    setActiveStatus('all');
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        ) : null}
      </main>

      <footer className="footer">
        SPORTZ <span>Live scores. Real moments.</span>
      </footer>
    </div>
  );
}