import { and, asc, eq, gt, lte } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary, matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/matches-status.js';
import { computeWindow } from '../utils/schedule.js';
import { getInitialScore, toTotals } from '../utils/scoring.js';
import { publishEvents } from './publishEvent.js';

// Keeps seeded demo matches on their rolling schedule. When a fixture's cycle rolls over
// it is "re-armed": new start/end time, zeroed score, commentary hidden again.
export async function syncSchedule(hooks = {}, nowMs = Date.now()) {
  const rows = await db.select().from(matches);

  for (const m of rows) {
    if (m.meta?.slot === undefined) continue; // matches created through the API are left alone

    const { startTime, endTime } = computeWindow(m.meta, nowMs);
    const status = getMatchStatus(startTime, endTime, new Date(nowMs));
    const rolled = m.startTime.getTime() !== startTime.getTime();

    if (!rolled && m.status === status) continue;

    const patch = { startTime, endTime, status };
    if (rolled) {
      const score = getInitialScore(m.sport);
      Object.assign(patch, { score, ...toTotals(m.sport, score), currentSequence: 0 });
    }

    const [updated] = await db.update(matches).set(patch).where(eq(matches.id, m.id)).returning();
    hooks.broadcastMatchUpdated?.(updated);
  }
}

// Reveal every event whose offset has passed since the match started.
export async function revealDue(match, hooks = {}, nowMs = Date.now()) {
  const elapsed = Math.floor((nowMs - new Date(match.startTime).getTime()) / 1000);
  if (elapsed < 0) return 0;

  const due = await db
    .select()
    .from(commentary)
    .where(
      and(
        eq(commentary.matchId, match.id),
        gt(commentary.sequence, match.currentSequence),
        lte(commentary.offsetSeconds, elapsed),
      ),
    )
    .orderBy(asc(commentary.sequence));

  if (due.length === 0) return 0;

  const updated = await publishEvents(due, hooks);
  const last = due[due.length - 1];

  console.log(
    due.length === 1
      ? `📣 ${match.homeTeam} ${updated.homeScore}-${updated.awayScore} ${match.awayTeam} | ${last.message}`
      : `⏩ ${match.homeTeam} v ${match.awayTeam}: caught up ${due.length} events (${updated.homeScore}-${updated.awayScore})`,
  );

  return due.length;
}

export async function tick(hooks = {}, nowMs = Date.now()) {
  await syncSchedule(hooks, nowMs);

  const started = await db
    .select()
    .from(matches)
    .where(lte(matches.startTime, new Date(nowMs)));

  for (const m of started) {
    await revealDue(m, hooks, nowMs);
  }
}