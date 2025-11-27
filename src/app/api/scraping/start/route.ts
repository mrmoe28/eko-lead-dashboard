import { db } from "@/lib/db";
import { scrapingSessions } from "@/lib/db/schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location, apiKey } = body;

    // Validate API key (simple authentication)
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Create new scraping session
    const [session] = await db
      .insert(scrapingSessions)
      .values({
        location,
        status: "running",
        totalLeadsFound: 0,
        sourcesScraped: [],
      })
      .returning();

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: "Scraping session started"
    });
  } catch (error) {
    console.error("Error starting scraping session:", error);
    return NextResponse.json(
      { error: "Failed to start scraping session" },
      { status: 500 }
    );
  }
}
