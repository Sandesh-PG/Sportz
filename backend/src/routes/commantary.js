import { Router } from 'express';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { commentary, matches } from '../db/schema.js';
import { matchIdParamSchema } from '../validation/matches.js';
import { createCommentarySchema, listCommentaryQuerySchema } from '../validation/commentary.js';

export const commentaryRouter = Router({ mergeParams: true });
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;

function getNonZeroScoreDelta(value) {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const delta = Number(value);
    return Number.isInteger(delta) && delta !== 0 ? delta : null;
}

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
        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, paramsResult.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        return res.status(200).json({ data });
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

    try {
        const { minutes, ...rest } = bodyResult.data;
        const scoreDelta = bodyResult.data.metadata?.scoreDelta;
        const homeDelta = getNonZeroScoreDelta(scoreDelta?.home);
        const awayDelta = getNonZeroScoreDelta(scoreDelta?.away);
        let result;

        await db.transaction(async (tx) => {
            const scoreUpdates = {};
            if (homeDelta !== null) {
                scoreUpdates.homeScore = sql`${matches.homeScore} + ${homeDelta}`;
            }
            if (awayDelta !== null) {
                scoreUpdates.awayScore = sql`${matches.awayScore} + ${awayDelta}`;
            }

            if (Object.keys(scoreUpdates).length > 0) {
                await tx
                    .update(matches)
                    .set(scoreUpdates)
                    .where(eq(matches.id, paramsResult.data.id));
            }

            [result] = await tx
                .insert(commentary)
                .values({
                    matchId: paramsResult.data.id,
                    minute: minutes,
                    ...rest,
                })
                .returning();
        });

            if(res.app.locals.broadcastCommantary) {    
                res.app.locals.broadcastCommantary(result.matchId, result);
            }

        return res.status(201).json({ data: result });
    } catch (error) {
        console.error('Failed to create commentary:', error);
        return res.status(500).json({ error: 'Failed to create commentary.' });
    }
});