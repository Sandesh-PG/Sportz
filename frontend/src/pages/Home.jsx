import { useMemo, useState } from 'react';
import MatchPoster from '../components/MatchPoster.jsx';
import Navbar from '../components/Navbar.jsx';
import useLiveMatches from '../hooks/useLiveMatches.js';
import useNow from '../hooks/useNow.js';

function isUpcoming(match) {
  return match.status === 'scheduled' || match.status === 'upcoming';
}

const byStartTime = (a, b) => new Date(a.startTime) - new Date(b.startTime);

function MatchGrid({ matches, now }) {
  if (matches.length === 0) {
    return <p className="empty-state">No matches found for this sport.</p>;
  }

  return (
    <div className="mp-grid">
      {matches.map((match) => (
        <MatchPoster key={match.id} match={match} now={now} />
      ))}
    </div>
  );
}

export default function Home() {
  const [activeSport, setActiveSport] = useState('All');
  const { matches, loading, error, retry } = useLiveMatches();
  const now = useNow(1000);

  const inSport = (match) =>
    activeSport === 'All' || match.sport?.toLowerCase() === activeSport.toLowerCase();

  const liveMatches = useMemo(
    () => matches.filter((match) => match.status === 'live' && inSport(match)).sort(byStartTime),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSport, matches],
  );
  const upcomingMatches = useMemo(
    () => matches.filter((match) => isUpcoming(match) && inSport(match)).sort(byStartTime),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <button className="retry-button" onClick={retry} type="button">Retry</button>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="content-heading" id="matches">
            <div>
              <p className="section-kicker">The action is on</p>
              <h2>Live now</h2>
            </div>
            <span className="match-count">{liveMatches.length} live matches</span>
          </div>
        ) : null}
        {!loading && !error && liveMatches.length > 0 ? <MatchGrid matches={liveMatches} now={now} /> : null}
        {!loading && !error && liveMatches.length === 0 ? <p className="empty-state">No live matches</p> : null}

        {!loading && !error ? (
          <div className="content-heading upcoming-heading">
            <div>
              <p className="section-kicker">Mark your calendar</p>
              <h2>Upcoming</h2>
            </div>
            <span className="match-count">{upcomingMatches.length} upcoming</span>
          </div>
        ) : null}
        {!loading && !error ? <MatchGrid matches={upcomingMatches} now={now} /> : null}
      </main>

      <footer className="footer">SPORTZ <span>Live scores. Real moments.</span></footer>
    </div>
  );
}