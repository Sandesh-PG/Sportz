import MatchStatus from '../../components/MatchStatus.jsx';

export default function CricketScoreboard({ match }) {
  const startTime = new Date(match.startTime).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const endTime = new Date(match.endTime).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const score = match.score ?? {};

  const battingSide = score.battingSide ?? 'home';
  const batting = score[battingSide] ?? {};

  const homeScore = score.home ?? {};
  const awayScore = score.away ?? {};

  const target = score.target;
  const crr = score.crr;
  const rrr = score.rrr;

  return (
    <section className="cricket-scoreboard detail-card">
      <div className="scoreboard-meta">
        <span className="competition-label">
          {match.competition ?? 'Cricket'}
        </span>

        <MatchStatus status={match.status} />
      </div>

      <div className="cricket-main-score">
        <span className="cricket-team-label">
          {match.homeTeam.toUpperCase()}
        </span>

        <strong>
          {homeScore.runs ?? match.homeScore ?? 0}
          {homeScore.wickets != null ? `/${homeScore.wickets}` : ''}
        </strong>

        <span className="overs-label">
          {match.status === 'live'
            ? `${homeScore.overs ?? '0.0'} overs`
            : startTime}
        </span>
      </div>

      <div className="cricket-supporting-score">
        <span>{match.awayTeam}</span>

        <strong>
          {awayScore.runs ?? match.awayScore ?? 0}
          {awayScore.wickets != null ? `/${awayScore.wickets}` : ''}
        </strong>
      </div>

      <div className="scoreboard-window">
        Start {startTime}
        <span> · </span>
        End {endTime}
      </div>

      <div className="cricket-stats-grid">
        <div>
          <span>Current run rate</span>
          <strong>{crr != null ? crr.toFixed(2) : '—'}</strong>
        </div>

        <div>
          <span>Required rate</span>
          <strong>{rrr != null ? rrr.toFixed(2) : '—'}</strong>
        </div>

        <div>
          <span>Target</span>
          <strong>{target ?? '—'}</strong>
        </div>
      </div>
    </section>
  );
}