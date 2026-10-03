import { useEffect, useMemo, useState } from 'react';
import MatchCard from '../components/MatchCard.jsx';
import Navbar from '../components/Navbar.jsx';
import { getMatches } from '../services/api.js';
import useMatchesWebSocket from '../hooks/useMatchesWebSocket.js';
import './Matches.css';

const supportedSports = new Set(['football', 'cricket']);

const statusFilters = [
  { key: 'all', label: 'All matches' },
  { key: 'live', label: 'Live now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'finished', label: 'Finished' },
];

function normalizeStatus(status) {
  if (status === 'scheduled') return 'upcoming';
  return status?.toLowerCase() ?? 'unknown';
}

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
      current.map((match) =>
        match.id === updated.id
          ? updated
          : match,
      ),
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
      live: filteredMatches.filter(
        (match) => normalizeStatus(match.status) === 'live',
      ),
      upcoming: filteredMatches.filter(
        (match) => normalizeStatus(match.status) === 'upcoming',
      ),
      finished: filteredMatches.filter(
        (match) => normalizeStatus(match.status) === 'finished',
      ),
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
          {sectionMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
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
