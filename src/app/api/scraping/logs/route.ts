import { db } from "@/lib/db";
import { scrapingLogs } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

// GET /api/scraping/logs?sessionId=123 - Fetch logs for a session
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const logs = await db
      .select()
      .from(scrapingLogs)
      .where(eq(scrapingLogs.sessionId, parseInt(sessionId)))
      .orderBy(desc(scrapingLogs.timestamp))
      .limit(100);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching scraping logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// POST /api/scraping/logs - Create a new log entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, source, message, leadCount, status, apiKey } = body;

    // Validate API key
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!sessionId || !source || !message || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert log entry
    await db.insert(scrapingLogs).values({
      sessionId,
      source,
      message,
      leadCount: leadCount || 0,
      status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating scraping log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
