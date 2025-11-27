import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Run the migration SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "lead_source_analytics" (
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
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "lead_sources" (
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
    `);

    return NextResponse.json({ success: true, message: 'Migration completed' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed', details: String(error) }, { status: 500 });
  }
}
