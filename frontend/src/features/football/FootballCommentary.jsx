import FootballEvent from './FootballEvent.jsx';

export default function FootballCommentary({ events }) {
  return (
    <section className="commentary-panel detail-card">
      <div className="detail-section-heading">
        <div><p className="section-kicker">Match feed</p><h2>Match events</h2></div>
        <span className="event-count">{events.length} events</span>
      </div>
      <div className="event-timeline">
        {events.map((event) => <FootballEvent event={event} key={`${event.minute}-${event.eventType}`} />)}
      </div>
    </section>
  );
}
