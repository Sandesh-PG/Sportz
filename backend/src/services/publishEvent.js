import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/matches-status.js';
import { withOccurredAt } from '../utils/events.js';
import {
  applyEvent,
  getInitialScore,
  scoreSignature,
  toTotals,
} from '../utils/scoring.js';

const hasScore = (s) => s && Object.keys(s).length > 0;

/**
 * The ONE place commentary events become visible. All events must belong to one match
 * and be passed in sequence order. A batch is applied in a single transaction
 * (used to catch up after a restart).
 *
 *  - score_update      -> everyone, only when the score changed
 *  - commentary_update -> subscribers of that match
 */
export async function publishEvents(events, hooks = {}) {
  if (events.length === 0) return null;

  const { broadcastScore, broadcastCommentary } = hooks;
  const matchId = events[0].matchId;

  const { updated, scoreChanged } = await db.transaction(async (tx) => {
    const [match] = await tx
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .for('update');

    if (!match) throw new Error(`Match ${matchId} not found`);

    const before = hasScore(match.score) ? match.score : getInitialScore(match.sport);
    let after = before;
    for (const ev of events) {
      after = applyEvent(match, after, ev);
    }

    const [row] = await tx
      .update(matches)
      .set({
        score: after,
        ...toTotals(match.sport, after),
        currentSequence: Math.max(match.currentSequence, ...events.map((e) => e.sequence)),
      })
      .where(eq(matches.id, match.id))
      .returning();

    return {
      updated: row,
      scoreChanged:
        scoreSignature(match.sport, before) !== scoreSignature(match.sport, after),
    };
  });

  if (scoreChanged) {
    broadcastScore?.({
      matchId: updated.id,
      sport: updated.sport,
      status: getMatchStatus(updated.startTime, updated.endTime),
      homeScore: updated.homeScore,
      awayScore: updated.awayScore,
      score: updated.score,
    });
  }

  if (broadcastCommentary) {
    for (const ev of events) {
      broadcastCommentary(updated.id, { ...withOccurredAt(ev, updated), score: updated.score });
    }
  }

  return updated;
}

export const publishEvent = (event, hooks) => publishEvents([event], hooks);