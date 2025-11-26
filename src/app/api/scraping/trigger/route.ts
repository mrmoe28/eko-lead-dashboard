import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingSessions } from "@/lib/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { location } = body;

    if (!location) {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // Create a pending scraping job
    const [session] = await db
      .insert(scrapingSessions)
      .values({
        location,
        status: "pending",
        totalLeadsFound: 0,
      })
      .returning();

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: `Scraping job created for ${location}. Waiting for scraper to pick it up...`,
    });
  } catch (error) {
    console.error("Error creating scraping job:", error);
    return NextResponse.json(
      { error: "Failed to create scraping job" },
      { status: 500 }
    );
  }
}
