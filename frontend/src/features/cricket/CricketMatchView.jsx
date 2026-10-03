import MatchStatus from '../../components/MatchStatus.jsx';
import CricketCommentary from './CricketCommentary.jsx';
import CricketScoreboard from './CricketScoreboard.jsx';

const cricketEvents = [
  { ball: '32.4', eventType: 'six', actor: 'Hardik Pandya', message: 'Smashed straight down the ground for six.' },
  { ball: '32.3', eventType: 'four', actor: 'Shubman Gill', message: 'Cracking cover drive for four.' },
  { ball: '32.2', eventType: 'dot', message: 'Good length delivery.' },
  { ball: '32.1', eventType: 'single', actor: 'Hardik Pandya', message: 'Quick single taken.' },
  { ball: '31.6', eventType: 'wicket', actor: 'Ravindra Jadeja', message: 'Edges it behind and departs.' },
];

export default function CricketMatchView({ match, onBack }) {
  return (
    <main className="detail-page cricket-detail">
      <div className="detail-topbar">
        <button className="back-link" onClick={onBack} type="button">← Back to matches</button>
        <div className="detail-sport-badge cricket-badge"><span>🏏</span> Cricket <MatchStatus status={match.status} /></div>
      </div>
      <header className="detail-heading">
        <p className="eyebrow"><span className="eyebrow-line cricket-line" /> Match schedule</p>
        <h1>{match.homeTeam} <span>vs</span> {match.awayTeam}</h1>
      </header>
      <CricketScoreboard match={match} />
      <div className="cricket-detail-grid">
        <section className="batting-panel detail-card">
          <div className="detail-section-heading"><div><p className="section-kicker cricket-kicker">At the crease</p><h2>Current batters</h2></div></div>
          <div className="player-row"><strong>Shubman Gill</strong><span>82 <small>(67)</small></span></div>
          <div className="player-row"><strong>Hardik Pandya</strong><span>34 <small>(28)</small></span></div>
          <div className="bowler-block"><p>Current bowler</p><div className="player-row"><strong>Josh Hazlewood</strong><span>6.4 - 0 - 42 - 2</span></div></div>
          <div className="last-over"><p>Last over</p><div className="over-balls"><span>1</span><span>•</span><span>4</span><span>0</span><span>2</span><span className="over-highlight">6</span></div></div>
        </section>
        <CricketCommentary events={cricketEvents} />
      </div>
    </main>
  );
}
