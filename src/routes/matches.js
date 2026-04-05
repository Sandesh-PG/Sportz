import { Router } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { getMatchStatus } from '../utils/matches-status.js';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';

export const matchesRouter = Router();

const matchLimit = 50;

matchesRouter.get('/',async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }

    const limit = Math.min(parsed.data.limit ?? 50, matchLimit); 
    try {
        const data = await db.select().from(matches).orderBy(desc(matches.createdAt)).limit(limit);
        res.json({ data});
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

matchesRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
    }
    const {
        startTime,
        endTime,
        homeScore,
        awayScore,
    } = parsed.data;

    try{
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore || 0,
            awayScore: awayScore || 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        if(res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        };
        
        res.status(201).json({ data: event });

    }catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

