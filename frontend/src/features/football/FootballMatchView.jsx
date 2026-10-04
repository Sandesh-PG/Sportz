import MatchStatus from '../../components/MatchStatus.jsx';
import FootballCommentary from './FootballCommentary.jsx';
import FootballScoreboard from './FootballScoreboard.jsx';

export default function FootballMatchView({ match, events = [], onBack }) {
  return (
    <main className="detail-page football-detail">
      <div className="detail-topbar">
        <button className="back-link" onClick={onBack} type="button">
          ← Back to matches
        </button>
        <div className="detail-sport-badge football-badge">
          <span>⚽</span> Football <MatchStatus status={match.status} />
        </div>
      </div>

      <header className="detail-heading">
        <p className="eyebrow"><span className="eyebrow-line" /> Match schedule</p>
        <h1>{match.homeTeam} <span>vs</span> {match.awayTeam}</h1>
      </header>

      <FootballScoreboard match={match} events={events} />
      <FootballCommentary events={events} />
    </main>
  );
}
