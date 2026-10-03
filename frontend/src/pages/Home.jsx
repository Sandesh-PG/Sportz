import { useEffect, useMemo, useState } from 'react';
import MatchCard from '../components/MatchCard.jsx';
import Navbar from '../components/Navbar.jsx';
import { getMatches } from '../services/api.js';

const supportedSports = new Set(['football', 'cricket']);

function isUpcoming(match) {
  return match.status === 'scheduled' || match.status === 'upcoming';
}

function MatchGrid({ matches }) {
  if (matches.length === 0) {
    return <p className="empty-state">No matches found for this sport.</p>;
  }

  return (
    <div className="match-grid">
      {matches.map((match) => <MatchCard key={match.id} match={match} />)}
    </div>
  );
}

export default function Home() {
  const [activeSport, setActiveSport] = useState('All');
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
        if (isCurrent) {
          setMatches(data.filter((match) => supportedSports.has(match.sport?.toLowerCase())));
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [retryKey]);

  const liveMatches = useMemo(
    () => matches.filter((match) => match.status === 'live' && (activeSport === 'All' || match.sport === activeSport.toLowerCase())),
    [activeSport, matches],
  );
  const upcomingMatches = useMemo(
    () => matches.filter((match) => isUpcoming(match) && (activeSport === 'All' || match.sport === activeSport.toLowerCase())),
    [activeSport, matches],
  );

  return (
    <div className="app-shell" id="home">
      <Navbar activeSport={activeSport} onSportChange={setActiveSport} />

      <main className="page-content">
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> Your front row seat</p>
            <h1>Live Sports<span className="accent-dot">.</span></h1>
            <p className="hero-description">Follow matches in real time, catch every turning point, and never miss the moment.</p>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-number">{liveMatches.length}</span>
            <span className="hero-stat-label">matches live now</span>
          </div>
        </section>

        {loading ? <p className="page-state">Loading matches...</p> : null}
        {error ? (
          <div className="page-state error-state">
            <strong>Unable to load matches</strong>
            <button className="retry-button" onClick={() => setRetryKey((value) => value + 1)} type="button">Retry</button>
          </div>
        ) : null}

        {!loading && !error ? <div className="content-heading" id="matches">
          <div>
            <p className="section-kicker">The action is on</p>
            <h2>Live now</h2>
          </div>
          <span className="match-count">{liveMatches.length} live matches</span>
        </div> : null}
        {!loading && !error && liveMatches.length > 0 ? <MatchGrid matches={liveMatches} /> : null}
        {!loading && !error && liveMatches.length === 0 ? <p className="empty-state">No live matches</p> : null}

        {!loading && !error ? <div className="content-heading upcoming-heading">
          <div>
            <p className="section-kicker">Mark your calendar</p>
            <h2>Upcoming</h2>
          </div>
        </div> : null}
        {!loading && !error ? <MatchGrid matches={upcomingMatches} /> : null}
      </main>

      <footer className="footer">SPORTZ <span>Live scores. Real moments.</span></footer>
    </div>
  );
}
