import './FootballCommentary.css';
import FootballEvent from './FootballEvent.jsx';

export default function FootballCommentary({ events = [] }) {
  const orderedEvents = [...events].sort((a, b) => {
    const aSequence = Number(a.sequence ?? 0);
    const bSequence = Number(b.sequence ?? 0);
    return bSequence - aSequence;
  });

  return (
    <section className="commentary-panel detail-card">
      <div className="detail-section-heading">
        <div>
          <p className="section-kicker">Match feed</p>
          <h2>Match events</h2>
        </div>
        <span className="event-count">{orderedEvents.length} events</span>
      </div>

      <div className="event-timeline">
        {orderedEvents.length ? (
          orderedEvents.map((event, index) => (
            <FootballEvent
              event={event}
              key={event.id ?? `${event.sequence ?? index}-${event.minute}-${event.eventType}`}
            />
          ))
        ) : (
          <div className="empty-events">No match events yet.</div>
        )}
      </div>
    </section>
  );
}
