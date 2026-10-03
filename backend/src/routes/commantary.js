import { Router } from 'express';
import { and, desc, eq, lte } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary, matches } from '../db/schema.js';
import { publishEvent } from '../services/publishEvent.js';
import { withOccurredAt } from '../utils/events.js';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';

export const commentaryRouter = Router({ mergeParams: true });
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

async function findMatch(id) {
  const [match] = await db
    .select({
      id: matches.id,
      startTime: matches.startTime,
      currentSequence: matches.currentSequence,
    })
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);
  return match;
}

// Only revealed events are served. Upcoming matches have currentSequence = 0 -> [].
commentaryRouter.get('/', async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: paramsResult.error.issues });
  }

  const queryResult = listCommentaryQuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    return res.status(400).json({ error: queryResult.error.issues });
  }

  const limit = Math.min(queryResult.data.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

  try {
    const match = await findMatch(paramsResult.data.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const rows = await db
      .select()
      .from(commentary)
      .where(
        and(
          eq(commentary.matchId, match.id),
          lte(commentary.sequence, match.currentSequence),
        ),
      )
      .orderBy(desc(commentary.sequence))
      .limit(limit);

    return res.status(200).json({ data: rows.map((r) => withOccurredAt(r, match)) });
  } catch (error) {
    console.error('Failed to fetch commentary:', error);
    return res.status(500).json({ error: 'Failed to fetch commentary.' });
  }
});

commentaryRouter.post('/', async (req, res) => {
  const paramsResult = matchIdParamSchema.safeParse(req.params);
  if (!paramsResult.success) {
    return res.status(400).json({ error: paramsResult.error.issues });
  }

  const bodyResult = createCommentarySchema.safeParse(req.body);
  if (!bodyResult.success) {
    return res.status(400).json({ error: bodyResult.error.issues });
  }

  const matchId = paramsResult.data.id;
  const { minutes, ...rest } = bodyResult.data;

  try {
    const match = await findMatch(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const offsetSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(match.startTime).getTime()) / 1000),
    );

    const [row] = await db
      .insert(commentary)
      .values({ matchId, minute: minutes, offsetSeconds, ...rest })
      .returning();

    await publishEvent(row, {
      broadcastScore: res.app.locals.broadcastScore,
      broadcastCommentary: res.app.locals.broadcastCommantary,
    });

    return res.status(201).json({ data: withOccurredAt(row, match) });
  } catch (error) {
    console.error('Failed to create commentary:', error);
    return res.status(500).json({ error: 'Failed to create commentary.' });
  }
});