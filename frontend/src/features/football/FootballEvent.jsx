import './FootballEvent.css';

const EVENT_CONFIG = {
  goal: { label: 'GOAL', icon: '⚽', className: 'event-goal' },
  yellow_card: { label: 'YELLOW CARD', icon: '🟨', className: 'event-yellow-card' },
  red_card: { label: 'RED CARD', icon: '🟥', className: 'event-red-card' },
  card: { label: 'CARD', icon: '🟨', className: 'event-yellow-card' },
  substitution: { label: 'SUBSTITUTION', icon: '↕', className: 'event-substitution' },
  half_time: { label: 'HALF-TIME', icon: '⏸', className: 'event-half-time' },
  full_time: { label: 'FULL-TIME', icon: '✓', className: 'event-full-time' },
  save: { label: 'SAVE', icon: '🧤', className: 'event-save' },
  shot: { label: 'SHOT', icon: '◉', className: 'event-shot' },
  corner: { label: 'CORNER', icon: '↗', className: 'event-corner' },
};

function getConfig(event) {
  if (EVENT_CONFIG[event.eventType]) return EVENT_CONFIG[event.eventType];

  if (event.eventType === 'card') {
    const cardType = String(event.metadata?.cardType ?? '').toLowerCase();
    if (cardType.includes('red')) return EVENT_CONFIG.red_card;
  }

  return {
    label: String(event.eventType ?? 'UPDATE').replaceAll('_', ' ').toUpperCase(),
    icon: '•',
    className: 'event-default',
  };
}

function formatMinute(event) {
  if (event.minute == null) return '';
  const minute = String(event.minute);
  return minute.endsWith("'") ? minute : `${minute}'`;
}

export default function FootballEvent({ event, isLatest = false, isRecent = false }) {
  const config = getConfig(event);
  const isSubstitution = event.eventType === 'substitution';
  const playerOut = event.metadata?.playerOut ?? event.playerOut;

  const eventClassName = [
    'timeline-event',
    config.className,
    isLatest ? 'is-latest' : '',
    isRecent ? 'is-recent' : '',
  ].filter(Boolean).join(' ');

  return (
    <article className={eventClassName}>
      <time className="event-time">{formatMinute(event)}</time>
      <div className="event-marker" aria-hidden="true">{config.icon}</div>
      <div className="event-copy">
        <div className="event-title">
          <strong>{config.label}</strong>
          {event.team ? <span>{event.team}</span> : null}
          {isLatest && <span className="latest-event-label">LATEST</span>}
        </div>

        {isSubstitution && playerOut ? (
          <p className="substitution-copy">
            <span className="player-in">↑ {event.actor || 'Player in'}</span>
            <span className="player-out">↓ {playerOut}</span>
          </p>
        ) : event.actor ? (
          <p className="event-player">{event.actor}</p>
        ) : null}

        {event.message ? <p>{event.message}</p> : null}
      </div>
    </article>
  );
}
