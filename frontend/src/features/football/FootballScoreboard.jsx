import { useEffect, useMemo, useState } from 'react';

import MatchStatus from '../../components/MatchStatus.jsx';

function formatFootballClock(match, now) {
  if (match.status === 'finished') return 'FULL TIME';
  if (match.status !== 'live') return 'UPCOMING';

  const start = new Date(match.startTime).getTime();
  const end = new Date(match.endTime).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    const minute = Number(match.score?.minute);
    return Number.isFinite(minute) ? `${Math.max(0, Math.floor(minute))}'` : 'LIVE';
  }

  const fraction = Math.min(1, Math.max(0, (now - start) / (end - start)));
  const elapsed = Math.floor(fraction * 95);

  if (elapsed <= 0) return "0'";
  if (elapsed <= 90) return `${elapsed}'`;
  return `90+${elapsed - 90}'`;
}

function formatEventMinute(event) {
  if (event?.minute == null) return '';
  const minute = String(event.minute);
  return minute.endsWith("'") ? minute : `${minute}'`;
}

function GoalScorers({ events, team }) {
  const goals = events
    .filter((event) => event.eventType === 'goal' && event.team === team)
    .sort((a, b) => Number(b.minute) - Number(a.minute));

  if (!goals.length) return null;

  return (
    <div className="football-scorers">
      {goals.map((goal) => (
        <span className="football-scorer" key={`${goal.id ?? goal.sequence ?? goal.minute}-${goal.actor}`}>
          <span aria-hidden="true">⚽</span>
          {goal.actor || 'Goal'} {formatEventMinute(goal)}
        </span>
      ))}
    </div>
  );
}

export default function FootballScoreboard({ match, events = [] }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (match.status !== 'live') return undefined;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [match.status]);

  const startTime = new Date(match.startTime).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const endTime = new Date(match.endTime).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const clock = useMemo(
    () => formatFootballClock(match, now),
    [match, now],
  );

  const homeScore = match.homeScore ?? match.score?.home ?? 0;
  const awayScore = match.awayScore ?? match.score?.away ?? 0;

  return (
    <section className="football-scoreboard detail-card">
      <div className="scoreboard-meta">
        <span className="competition-label">
          {match.competition ?? 'Football'}
        </span>
        <MatchStatus status={match.status} />
      </div>

      <div className="football-scoreline">
        <div className="score-team score-team-home">
          <span className="team-crest football-crest">{match.homeTeam?.slice(0, 1)}</span>
          <div className="score-team-copy">
            <strong>{match.homeTeam}</strong>
            <GoalScorers events={events} team={match.homeTeam} />
          </div>
        </div>

        <div className="football-score-center">
          <div className="football-score-values">
            <span>{homeScore}</span>
            <b>:</b>
            <span>{awayScore}</span>
          </div>
          <span className={`match-minute ${match.status === 'live' ? 'is-live' : ''}`}>
            {clock}
          </span>
        </div>

        <div className="score-team score-team-away">
          <span className="team-crest football-crest">{match.awayTeam?.slice(0, 1)}</span>
          <div className="score-team-copy">
            <strong>{match.awayTeam}</strong>
            <GoalScorers events={events} team={match.awayTeam} />
          </div>
        </div>
      </div>

      <div className="scoreboard-window">
        Start {startTime} <span>·</span> End {endTime}
      </div>
    </section>
  );
}
