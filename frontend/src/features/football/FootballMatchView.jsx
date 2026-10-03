import MatchStatus from '../../components/MatchStatus.jsx';
import FootballCommentary from './FootballCommentary.jsx';
import FootballScoreboard from './FootballScoreboard.jsx';

const footballEvents = [
  { minute: 67, eventType: 'goal', team: 'Arsenal FC', message: 'Goal! A composed finish from close range.' },
  { minute: 61, eventType: 'card', team: 'Liverpool FC', message: 'Booked for a rash tackle.' },
  { minute: 54, eventType: 'save', team: 'Liverpool FC', message: 'Goalkeeper makes a strong save.' },
  { minute: 48, eventType: 'substitution', team: 'Arsenal FC', message: 'Martinelli comes on for Trossard.' },
];

export default function FootballMatchView({ match, onBack }) {
  return (
    <main className="detail-page football-detail">
      <div className="detail-topbar">
        <button className="back-link" onClick={onBack} type="button">← Back to matches</button>
        <div className="detail-sport-badge football-badge"><span>⚽</span> Football <MatchStatus status={match.status} /></div>
      </div>
      <header className="detail-heading">
        <p className="eyebrow"><span className="eyebrow-line" /> Match schedule</p>
        <h1>{match.homeTeam} <span>vs</span> {match.awayTeam}</h1>
      </header>
      <FootballScoreboard match={match} />
      <FootballCommentary events={footballEvents} />
    </main>
  );
}
