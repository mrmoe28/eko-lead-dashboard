CREATE TABLE "contacted_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"comment_id" text NOT NULL,
	"lead_name" text,
	"priority" text,
	"intent" text,
	"reply_text" text NOT NULL,
	"video_url" text,
	"contacted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacted_leads_comment_id_unique" UNIQUE("comment_id")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "youtube_reply_text" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "youtube_reply_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "youtube_posted_at" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "youtube_comment_id" text;