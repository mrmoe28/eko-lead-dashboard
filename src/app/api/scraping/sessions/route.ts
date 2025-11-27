import { db } from "@/lib/db";
import { scrapingSessions, scrapingLogs, leads } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sessions = await db
      .select({
        id: scrapingSessions.id,
        location: scrapingSessions.location,
        status: scrapingSessions.status,
        totalLeadsFound: scrapingSessions.totalLeadsFound,
        sourcesScraped: scrapingSessions.sourcesScraped,
        startedAt: scrapingSessions.startedAt,
        completedAt: scrapingSessions.completedAt,
        errorMessage: scrapingSessions.errorMessage,
      })
      .from(scrapingSessions)
      .orderBy(desc(scrapingSessions.startedAt))
      .limit(50);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// Update session status (complete or fail)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, status, errorMessage, apiKey } = body;

    // Validate API key
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update session
    await db
      .update(scrapingSessions)
      .set({
        status,
        completedAt: new Date(),
        errorMessage: errorMessage || null,
      })
      .where(eq(scrapingSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
