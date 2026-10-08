import { useEffect, useRef, useState } from 'react';
import './CricketCommentary.css';
import CricketEvent from './CricketEvent.jsx';

function getEventKey(event, index = 0) {
  return String(event.id ?? `${event.minute ?? ''}-${event.sequence ?? index}-${event.eventType ?? ''}`);
}

export default function CricketCommentary({ events = [], score }) {
  const battingSide = score?.battingSide ?? 'home';
  const overs = score?.[battingSide]?.overs ?? '0.0';

  const [recentEventKey, setRecentEventKey] = useState(null);
  const initializedRef = useRef(false);
  const recentTimerRef = useRef(null);

  const orderedEvents = [...events].sort((a, b) => {
    const aSequence = Number(a.sequence ?? 0);
    const bSequence = Number(b.sequence ?? 0);
    return bSequence - aSequence;
  });

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
        {orderedEvents.map((event, index) => {
          const eventKey = getEventKey(event, index);
          const isLatest = index === 0;

          return (
            <CricketEvent
              event={event}
              isLatest={isLatest}
              isRecent={eventKey === recentEventKey}
              key={eventKey}
            />
          );
        })}
      </div>
    </section>
  );
}
