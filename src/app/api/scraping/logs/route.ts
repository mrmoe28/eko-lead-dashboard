import { db } from "@/lib/db";
import { scrapingLogs } from "@/lib/db/schema";
import { NextResponse } from "next/server";

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
