import CricketEvent from './CricketEvent.jsx';

export default function CricketCommentary({ events = [], score }) {
  const battingSide = score?.battingSide ?? 'home';
  const overs = score?.[battingSide]?.overs ?? '0.0';

  return (
    <section className="commentary-panel detail-card cricket-commentary">
      <div className="detail-section-heading">
        <div>
          <p className="section-kicker cricket-kicker">
            Ball tracker
          </p>

          <h2>Ball-by-ball commentary</h2>
        </div>

        <span className="event-count">
          {overs} overs
        </span>
      </div>

      <div className="cricket-events">
        {events.map((event) => (
          <CricketEvent
            event={event}
            key={event.id ?? `${event.minute}-${event.sequence}`}
          />
        ))}
      </div>
    </section>
  );
}