ALTER TABLE "commentary" ADD COLUMN "offset_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "competition" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "venue" text;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "meta" jsonb DEFAULT '{}'::jsonb NOT NULL;