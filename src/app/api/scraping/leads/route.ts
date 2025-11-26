import { db } from "@/lib/db";
import { leads, scrapingSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, lead, apiKey } = body;

    // Validate API key
    if (apiKey !== process.env.SCRAPER_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!sessionId || !lead) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Map scraper lead format to database format
    const dbLead = {
      name: lead.name || "Unknown",
      location: lead.location || "Unknown",
      score: lead.score || 0,
      priority: lead.priority?.toLowerCase() || "medium",
      source: lead.source || "Unknown",
      phone: lead.phone || null,
      email: lead.email || null,
      request: lead.message || lead.request || "No message provided",
      whyHot: lead.whyHot || null,
      actionRequired: lead.actionRequired || null,
      postedTime: lead.timestamp || lead.postedTime || null,
      profileUrl: lead.profileUrl || null,
      originalPostUrl: lead.postUrl || lead.originalPostUrl || null,
      revenueMin: lead.revenueMin || null,
      revenueMax: lead.revenueMax || null,
      sessionId,
      address: lead.address || null,
      systemSize: lead.systemSize || null,
      permitNumber: lead.permitNumber || null,
      message: lead.message || null,
      intent: lead.intent || null,
      scrapedAt: new Date(),
    };

    // Insert lead
    await db.insert(leads).values(dbLead);

    // Update session total leads count
    await db
      .update(scrapingSessions)
      .set({
        totalLeadsFound: db.$count(leads, eq(leads.sessionId, sessionId)) as any,
      })
      .where(eq(scrapingSessions.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
}
