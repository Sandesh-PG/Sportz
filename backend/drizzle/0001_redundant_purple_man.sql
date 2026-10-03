ALTER TABLE "matches" ADD COLUMN "score" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "current_sequence" integer DEFAULT 0 NOT NULL;