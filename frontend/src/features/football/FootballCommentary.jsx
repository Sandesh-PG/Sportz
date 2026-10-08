import { useEffect, useRef, useState } from 'react';
import './FootballCommentary.css';
import FootballEvent from './FootballEvent.jsx';

function getEventKey(event, index = 0) {
  return String(event.id ?? `${event.sequence ?? index}-${event.minute ?? ''}-${event.eventType ?? ''}`);
}

export default function FootballCommentary({ events = [] }) {
  const orderedEvents = [...events].sort((a, b) => {
    const aSequence = Number(a.sequence ?? 0);
    const bSequence = Number(b.sequence ?? 0);
    return bSequence - aSequence;
  });

  const [recentEventKey, setRecentEventKey] = useState(null);
  const initializedRef = useRef(false);
  const recentTimerRef = useRef(null);

  useEffect(() => {
    if (!orderedEvents.length) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    const latestKey = getEventKey(orderedEvents[0]);

    setRecentEventKey(latestKey);

    clearTimeout(recentTimerRef.current);
    recentTimerRef.current = setTimeout(() => {
      setRecentEventKey(null);
    }, 2500);

    return () => clearTimeout(recentTimerRef.current);
  }, [events]);

  useEffect(() => {
    return () => clearTimeout(recentTimerRef.current);
  }, []);

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
          orderedEvents.map((event, index) => {
            const eventKey = getEventKey(event, index);
            const isLatest = index === 0;

            return (
              <FootballEvent
                event={event}
                isLatest={isLatest}
                isRecent={eventKey === recentEventKey}
                key={eventKey}
              />
            );
          })
        ) : (
          <div className="empty-events">No match events yet.</div>
        )}
      </div>
    </section>
  );
}
