import { Router } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/matches-status.js';
import { scoreFromTotals, toTotals } from '../utils/scoring.js';
import {
  createMatchSchema,
  listMatchesQuerySchema,
  matchIdParamSchema,
} from '../validation/matches.js';

export const matchesRouter = Router();
const matchLimit = 50;

const withStatus = (match) => ({
  ...match,
  status: getMatchStatus(match.startTime, match.endTime),
});

matchesRouter.get('/', async (req, res) => {
  const parsed = listMatchesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const limit = Math.min(parsed.data.limit ?? 50, matchLimit);

  try {
    const rows = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
    res.json({ data: rows.map(withStatus) });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

matchesRouter.get('/:id', async (req, res) => {
  const parsed = matchIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  try {
    const [match] = await db.select().from(matches).where(eq(matches.id, parsed.data.id)).limit(1);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ data: withStatus(match) });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

matchesRouter.post('/', async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }

  const { startTime, endTime, homeScore, awayScore, ...rest } = parsed.data;
  const score = scoreFromTotals(rest.sport, homeScore ?? 0, awayScore ?? 0);

  try {
    const [event] = await db
      .insert(matches)
      .values({
        ...rest,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        score,
        ...toTotals(rest.sport, score),
        currentSequence: 0,
        status: getMatchStatus(startTime, endTime),
      })
      .returning();

    res.app.locals.broadcastMatchCreated?.(event);

    res.status(201).json({ data: event });
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});