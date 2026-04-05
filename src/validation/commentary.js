import { z } from 'zod';

export const listCommentarySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listCommentaryQuerySchema = listCommentarySchema;

export const createCommentarySchema = z.object({
  minutes: z.coerce.number().int().nonnegative(),
  sequence: z.coerce.number().int().nonnegative(),
  period: z.string().trim().min(1, 'period is required'),
  eventType: z.string().trim().min(1, 'eventType is required'),
  actor: z.string().trim().min(1, 'actor is required').optional(),
  team: z.string().trim().min(1, 'team is required').optional(),
  message: z.string().trim().min(1, 'message is required'),
  metadata: z.record(z.string(),z.any()).optional(),
  tags: z.array(z.string()).optional(),
});
 