import { integer, jsonb, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

export const matches = pgTable('matches', {
	id: serial('id').primaryKey(),
	sport: text('sport').notNull(),
	homeTeam: text('home_team').notNull(),
	awayTeam: text('away_team').notNull(),
	// NEW
	competition: text('competition'),
	venue: text('venue'),
	status: matchStatus('status').notNull().default('scheduled'),
	startTime: timestamp('start_time', { withTimezone: true }).notNull(),
	endTime: timestamp('end_time', { withTimezone: true }),
	// Plain totals (goals / runs) so list cards stay simple.
	homeScore: integer('home_score').notNull().default(0),
	awayScore: integer('away_score').notNull().default(0),
	// Sport-specific live state (shapes in utils/scoring.js)
	score: jsonb('score').notNull().default({}),
	currentSequence: integer('current_sequence').notNull().default(0),
	// NEW: scheduling info for seeded demo matches { slug, slot, slots, liveMinutes, maxOvers }
	meta: jsonb('meta').notNull().default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const commentary = pgTable('commentary', {
	id: serial('id').primaryKey(),
	matchId: integer('match_id')
		.notNull()
		.references(() => matches.id, { onDelete: 'cascade' }),
	minute: integer('minute').notNull(),
	sequence: integer('sequence').notNull(),
	// NEW: seconds after match start at which this event becomes visible
	offsetSeconds: integer('offset_seconds').notNull().default(0),
	period: text('period').notNull(),
	eventType: text('event_type').notNull(),
	actor: text('actor'),
	team: text('team'),
	message: text('message').notNull(),
	metadata: jsonb('metadata').notNull().default({}),
	tags: text('tags').array(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});