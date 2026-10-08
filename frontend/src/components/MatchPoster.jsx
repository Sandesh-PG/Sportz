import { useState } from 'react';
import { Link } from 'react-router-dom';
import './MatchPoster.css';

/* One match card, used by both Home and Matches.
   All class names start with "mp-" so they cannot collide with the old .poster-* rules in styles.css. */

const STATUS_LABEL = {
  football: { live: 'LIVE', finished: 'FULL TIME', upcoming: 'UPCOMING' },
  cricket: { live: 'LIVE', finished: 'COMPLETED', upcoming: 'UPCOMING' },
};

// Files live in frontend/public/team-logos/football/. A missing file falls back to initials.
const FOOTBALL_LOGOS = {
  Arsenal: '/team-logos/football/arsenal.png',
  Liverpool: '/team-logos/football/liverpool.png',
  'Real Madrid': '/team-logos/football/real-madrid.png',
  Barcelona: '/team-logos/football/barcelona.png',
  'Manchester City': '/team-logos/football/manchester-city.png',
  Chelsea: '/team-logos/football/chelsea.png',
  Tottenham: '/team-logos/football/tottenham.png',
  'AC Milan': '/team-logos/football/ac-milan.png',
  'Inter Milan': '/team-logos/football/inter-milan.png',
};

export function normalizeStatus(status) {
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

// Football minute derived from the wall clock so it keeps ticking between events.
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

/* -------------------------------- card pieces -------------------------------- */

// Remounts when the value changes, which replays the CSS pop animation.
function ScorePop({ value }) {
  return (
    <span key={value} className="mp-pop">
      {value}
    </span>
  );
}

function TeamColumn({ name, sport, className = '', children }) {
  const logo = sport === 'football' ? FOOTBALL_LOGOS[name] : null;
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className={`mp-team ${className}`}>
      <div className={`mp-crest mp-crest-${sport}`}>
        {logo && !logoFailed ? (
          <img src={logo} alt="" aria-hidden="true" onError={() => setLogoFailed(true)} />
        ) : (
          getInitials(name)
        )}
      </div>
      <strong className="mp-name">{name}</strong>
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
    <Link to={`/matches/${match.id}`} className={`mp mp-${sport} mp-${status}`}>
      <article className="mp-card">
        <div className="mp-top">
          <span className="mp-sport">
            <span aria-hidden="true">{sport === 'football' ? '⚽' : '🏏'}</span>
            {sport === 'football' ? 'Football' : 'Cricket'}
          </span>
          <span className={`mp-status mp-status-${status}`}>
            {STATUS_LABEL[sport]?.[status] ?? status.toUpperCase()}
          </span>
        </div>

        {match.competition ? <div className="mp-meta">{match.competition}</div> : null}

        {children}

        {note ? <div className="mp-note">{note}</div> : null}

        <div className="mp-footer">
          <span>{footer}</span>
          <span className="mp-arrow">↗</span>
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
      <div className="mp-matchup">
        <TeamColumn name={match.homeTeam} sport="football" />

        <div className="mp-center">
          {status === 'upcoming' ? (
            <>
              <span className="mp-vs">VS</span>
              <span className="mp-sub">{startsLabel(match, now)}</span>
            </>
          ) : (
            <>
              <div className="mp-scoreline">
                <ScorePop value={homeScore} />
                <span className="mp-colon">:</span>
                <ScorePop value={awayScore} />
              </div>
              <span className="mp-sub">
                {status === 'live' ? footballClock(match, now) : 'Full time'}
              </span>
            </>
          )}
        </div>

        <TeamColumn name={match.awayTeam} sport="football" />
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
      <TeamColumn name={team} sport="cricket" className={battingSide === side ? 'is-batting' : ''}>
        {showScores ? (
          <div className="mp-cricket-score">
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
      <div className="mp-matchup mp-matchup-cricket">
        {renderSide('home', match.homeTeam)}

        <div className="mp-center">
          <span className="mp-vs">VS</span>
          <span className="mp-sub">
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

export default function MatchPoster({ match, now }) {
  const status = normalizeStatus(match.status);
  const Poster = match.sport?.toLowerCase() === 'football' ? FootballPoster : CricketPoster;
  return <Poster match={match} status={status} now={now} />;
}