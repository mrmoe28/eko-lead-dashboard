import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingSessions, scrapingLogs, leads as leadsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PermitsScraper } from "@/workers/scrapers/permits.scraper";
import { RedditScraper } from "@/workers/scrapers/reddit.scraper";
import { CraigslistScraper } from "@/workers/scrapers/craigslist.scraper";
import { IncentivesScraper } from "@/workers/scrapers/incentives.scraper";
import { YelpScraper } from "@/workers/scrapers/yelp.scraper";
import { BaseScraper } from "@/lib/scrapers/base-scraper";

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

    // Create a running scraping session
    const [session] = await db
      .insert(scrapingSessions)
      .values({
        location,
        status: "running",
        totalLeadsFound: 0,
        sourcesScraped: [],
      })
      .returning();

    console.log(`[Trigger] Starting scrape for session #${session.id} - ${location}`);

    // Run scrapers asynchronously (don't wait for completion)
    runScrapersAsync(session.id, location);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      message: `Scraping started for ${location}`,
    });
  } catch (error) {
    console.error("Error creating scraping job:", error);
    return NextResponse.json(
      { error: "Failed to create scraping job" },
      { status: 500 }
    );
  }
}

// Run scrapers in background (non-blocking)
async function runScrapersAsync(sessionId: number, location: string) {
  const scrapers: Map<string, BaseScraper> = new Map([
    ['permits', new PermitsScraper()],
    ['reddit', new RedditScraper()],
    ['craigslist', new CraigslistScraper()],
    ['incentives', new IncentivesScraper()],
    ['yelp', new YelpScraper()],
  ]);

  const allLeads: any[] = [];
  const sourcesScraped: string[] = [];

  try {
    for (const [key, scraper] of scrapers) {
      try {
        console.log(`[Trigger] Running ${key} scraper for session #${sessionId}...`);
        
        // Log start
        await db.insert(scrapingLogs).values({
          sessionId,
          source: key.charAt(0).toUpperCase() + key.slice(1),
          message: 'Starting scraper...',
          status: 'processing',
          leadCount: 0,
        });

        const result = await scraper.execute(location);

        // Save leads
        if (result.leads.length > 0) {
          await db.insert(leadsTable).values(
            result.leads.map(lead => ({
              name: lead.name,
              location: lead.location,
              score: lead.score,
              priority: lead.priority,
              source: lead.source,
              phone: lead.phone,
              email: lead.email,
              request: lead.request,
              whyHot: lead.whyHot,
              actionRequired: lead.actionRequired,
              postedTime: lead.postedTime,
              profileUrl: lead.profileUrl,
              originalPostUrl: lead.originalPostUrl,
              revenueMin: lead.revenueMin,
              revenueMax: lead.revenueMax,
              address: lead.address,
              systemSize: lead.systemSize,
              permitNumber: lead.permitNumber,
              message: lead.message,
              intent: lead.intent,
              sessionId,
            }))
          );
          allLeads.push(...result.leads);
        }

        // Log success
        await db.insert(scrapingLogs).values({
          sessionId,
          source: result.source,
          message: `Completed: ${result.totalLeads} leads found`,
          status: 'success',
          leadCount: result.totalLeads,
        });

        sourcesScraped.push(result.source);
        console.log(`[Trigger] ${key}: ${result.totalLeads} leads found`);
      } catch (error: any) {
        console.error(`[Trigger] ${key} scraper failed:`, error.message);
        
        // Log error
        await db.insert(scrapingLogs).values({
          sessionId,
          source: key.charAt(0).toUpperCase() + key.slice(1),
          message: `Error: ${error.message}`,
          status: 'error',
          leadCount: 0,
        });
      }
    }

    // Update session as completed
    await db
      .update(scrapingSessions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        totalLeadsFound: allLeads.length,
        sourcesScraped,
      })
      .where(eq(scrapingSessions.id, sessionId));

    console.log(`[Trigger] Session #${sessionId} completed: ${allLeads.length} total leads from ${sourcesScraped.length} sources`);
  } catch (error: any) {
    console.error(`[Trigger] Session #${sessionId} failed:`, error.message);
    
    // Mark session as failed
    await db
      .update(scrapingSessions)
      .set({
        status: 'failed',
        completedAt: new Date(),
      })
      .where(eq(scrapingSessions.id, sessionId));
  }
}
