import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from 'drizzle-orm/pg-core';

export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull(),
		email: text('email').notNull(),
		passwordHash: text('password_hash').notNull(),
		role: text('role').notNull().default('user'),
		isVerified: boolean('is_verified').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [uniqueIndex('users_email_unique').on(table.email)],
);

export const sessions = pgTable(
	'sessions',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		refreshTokenHash: text('refresh_token_hash').notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		revokedAt: timestamp('revoked_at', { withTimezone: true }),
		userAgent: text('user_agent'),
		ipAddress: text('ip_address'),
	},
	(table) => [
		uniqueIndex('sessions_refresh_token_hash_unique').on(table.refreshTokenHash),
		index('sessions_user_id_idx').on(table.userId),
		index('sessions_expires_at_idx').on(table.expiresAt),
	],
);

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
