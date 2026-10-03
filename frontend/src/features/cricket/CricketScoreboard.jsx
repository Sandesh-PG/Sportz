import MatchStatus from '../../components/MatchStatus.jsx';

export default function CricketScoreboard({ match }) {
  const startTime = new Date(match.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const endTime = new Date(match.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <section className="cricket-scoreboard detail-card">
      <div className="scoreboard-meta"><span className="competition-label">ICC Champions Trophy · Group A</span><MatchStatus status={match.status} /></div>
      <div className="cricket-main-score">
        <span className="cricket-team-label">{match.homeTeam.toUpperCase()}</span>
        <strong>{match.homeScore ?? '-'} </strong>
        <span className="overs-label">{match.status === 'live' ? 'Live innings' : startTime}</span>
      </div>
      <div className="cricket-supporting-score"><span>{match.awayTeam}</span><strong>{match.awayScore ?? '-'}</strong></div>
      <div className="scoreboard-window">Start {startTime} <span>·</span> End {endTime}</div>
      <div className="cricket-stats-grid">
        <div><span>Current run rate</span><strong>5.63</strong></div>
        <div><span>Required rate</span><strong>6.12</strong></div>
        <div><span>Target</span><strong>288</strong></div>
      </div>
    </section>
  );
}
