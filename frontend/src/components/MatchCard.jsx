import MatchStatus from './MatchStatus.jsx';
import { Link } from 'react-router-dom';

const sportDetails = {
  football: { icon: '⚽', label: 'Football' },
  cricket: { icon: '🏏', label: 'Cricket' },
};

function formatMatchTime(match) {
  if (match.status === 'live') return 'Live now';
  if (!match.startTime) return '';

  const date = new Date(match.startTime);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function MatchCard({ match }) {
  const sport = sportDetails[match.sport?.toLowerCase()] ?? {
    icon: '•',
    label: match.sport ?? 'Sport',
  };

  return (
    <article
      className={`match-card sport-${match.sport}`}
      aria-label={`${match.homeTeam} versus ${match.awayTeam}`}
    >
      <div className="match-card-topline">
        <div className="sport-label">
          <span className="sport-icon" aria-hidden="true">{sport.icon}</span>
          <span>{sport.label}</span>
        </div>
        <MatchStatus status={match.status} />
      </div>

      <div className="match-card-body">
        <div className="teams">
          <div className="team-row">
            <span className="team-name">{match.homeTeam}</span>
            <strong className="team-score">{match.homeScore ?? '-'}</strong>
          </div>
          <div className="team-row">
            <span className="team-name">{match.awayTeam}</span>
            <strong className="team-score">{match.awayScore ?? '-'}</strong>
          </div>
        </div>
      </div>

      <div className="match-card-footer">
        <span className="match-time">{formatMatchTime(match)}</span>
        <Link className="view-match" to={`/matches/${match.id}`}>
          View Match <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
