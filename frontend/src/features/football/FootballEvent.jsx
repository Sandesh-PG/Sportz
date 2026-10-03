const eventDetails = {
  goal: { icon: '⚽', label: 'GOAL', className: 'event-goal' },
  card: { icon: '🟨', label: 'YELLOW CARD', className: 'event-card' },
  save: { icon: '🧤', label: 'SAVE', className: 'event-save' },
  substitution: { icon: '🔄', label: 'SUBSTITUTION', className: 'event-substitution' },
};

export default function FootballEvent({ event }) {
  const details = eventDetails[event.eventType] ?? eventDetails.save;

  return (
    <article className={`timeline-event ${details.className}`}>
      <div className="event-time">{event.minute}'</div>
      <div className="event-marker">{details.icon}</div>
      <div className="event-copy">
        <div className="event-title"><strong>{details.label}</strong><span>{event.team}</span></div>
        <p>{event.message}</p>
      </div>
    </article>
  );
}
