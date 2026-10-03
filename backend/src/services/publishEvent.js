import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { applyEvent, getInitialScore } from '../utils/scoring.js';

export async function publishEvent(event, { broadcastScore, broadcastCommentary }) {
  const updated = await db.transaction(async (tx) => {
    const [m] = await tx.select().from(matches)
      .where(eq(matches.id, event.matchId)).for('update');

    const current = Object.keys(m.score ?? {}).length ? m.score : getInitialScore(m.sport);
    const score = applyEvent(m.sport, current, event);

    const [u] = await tx.update(matches)
      .set({ score, currentSequence: event.sequence })
      .where(eq(matches.id, m.id)).returning();
    return u;
  });

  // everyone gets the lightweight score, only subscribers get commentary
  broadcastScore({ matchId: updated.id, score: updated.score });
  broadcastCommentary(updated.id, event);
}