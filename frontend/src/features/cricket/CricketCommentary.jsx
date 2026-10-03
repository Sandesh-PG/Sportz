import CricketEvent from './CricketEvent.jsx';

export default function CricketCommentary({ events }) {
  return (
    <section className="commentary-panel detail-card cricket-commentary">
      <div className="detail-section-heading"><div><p className="section-kicker cricket-kicker">Ball tracker</p><h2>Ball-by-ball commentary</h2></div><span className="event-count">32.4 overs</span></div>
      <div className="cricket-events">{events.map((event) => <CricketEvent event={event} key={event.ball} />)}</div>
    </section>
  );
}
