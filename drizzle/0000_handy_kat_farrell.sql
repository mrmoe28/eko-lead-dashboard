CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"score" integer NOT NULL,
	"priority" text NOT NULL,
	"source" text NOT NULL,
	"phone" text,
	"email" text,
	"request" text NOT NULL,
	"why_hot" text,
	"action_required" text,
	"posted_time" text,
	"profile_url" text,
	"original_post_url" text,
	"revenue_min" integer,
	"revenue_max" integer,
	"auto_submitted" integer DEFAULT 0,
	"session_id" integer,
	"address" text,
	"system_size" text,
	"permit_number" text,
	"message" text,
	"intent" text,
	"scraped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraping_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"lead_count" integer DEFAULT 0 NOT NULL,
	"status" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scraping_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"location" text NOT NULL,
	"status" text NOT NULL,
	"total_leads_found" integer DEFAULT 0 NOT NULL,
	"sources_scraped" text[],
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
