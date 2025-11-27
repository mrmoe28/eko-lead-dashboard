CREATE TABLE "lead_source_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"leads_generated" integer DEFAULT 0 NOT NULL,
	"hot_leads" integer DEFAULT 0 NOT NULL,
	"warm_leads" integer DEFAULT 0 NOT NULL,
	"cold_leads" integer DEFAULT 0 NOT NULL,
	"avg_response_time" integer,
	"conversion_count" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"file_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"total_leads" integer DEFAULT 0 NOT NULL,
	"quality_score" integer DEFAULT 0,
	"conversion_rate" integer DEFAULT 0,
	"avg_lead_score" integer DEFAULT 0,
	"last_tested_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
