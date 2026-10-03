const eventDetails = {
  six: { label: 'SIX', className: 'ball-six' },
  four: { label: 'FOUR', className: 'ball-four' },
  dot: { label: '•', className: 'ball-dot' },
  single: { label: '1 RUN', className: 'ball-single' },
  double: { label: '2 RUNS', className: 'ball-double' },
  wicket: { label: 'WICKET', className: 'ball-wicket' },
  wide: { label: 'WIDE', className: 'ball-wide' },
  noBall: { label: 'NO BALL', className: 'ball-wide' },
};

export default function CricketEvent({ event }) {
  const details = eventDetails[event.eventType] ?? eventDetails.dot;

  return (
    <article className="cricket-event">
      <span className="ball-number">{event.ball}</span>
      <span className={`ball-result ${details.className}`}>{details.label}</span>
      <div className="cricket-event-copy">
        {event.actor && <strong>{event.actor}</strong>}
        <span>{event.message}</span>
      </div>
    </article>
  );
}
