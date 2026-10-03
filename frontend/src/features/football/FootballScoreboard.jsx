import MatchStatus from '../../components/MatchStatus.jsx';

export default function FootballScoreboard({ match }) {
  const startTime = new Date(match.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  const endTime = new Date(match.endTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <section className="football-scoreboard detail-card">
      <div className="scoreboard-meta">
        <span className="competition-label">Premier League · Matchday 28</span>
        <MatchStatus status={match.status} />
      </div>
      <div className="football-scoreline">
        <div className="score-team score-team-home">
          <span className="team-crest football-crest">A</span>
          <strong>{match.homeTeam}</strong>
        </div>
        <div className="football-score-center">
          <div className="football-score-values"><span>{match.homeScore}</span><b>:</b><span>{match.awayScore}</span></div>
          <span className="match-minute">{match.status === 'live' ? 'LIVE' : startTime}</span>
        </div>
        <div className="score-team score-team-away">
          <span className="team-crest football-crest">L</span>
          <strong>{match.awayTeam}</strong>
        </div>
      </div>
      <div className="scoreboard-window">Start {startTime} <span>·</span> End {endTime}</div>
    </section>
  );
}
