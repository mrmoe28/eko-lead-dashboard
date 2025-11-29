import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scrapingSessions, scrapingLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PermitsScraper } from '@/workers/scrapers/permits.scraper';
import { RedditScraper } from '@/workers/scrapers/reddit.scraper';
import { CraigslistScraper } from '@/workers/scrapers/craigslist.scraper';
import { IncentivesScraper } from '@/workers/scrapers/incentives.scraper';
import { YelpScraper } from '@/workers/scrapers/yelp.scraper';
import { BaseScraper } from '@/lib/scrapers/base-scraper';

/**
 * Vercel Cron Job Endpoint
 * Automatically triggers scraping on a schedule
 * 
 * This endpoint is called by Vercel Cron (configured in vercel.json)
 * It runs the scraping directly without needing background workers
 */
export async function GET(request: Request) {
  try {
    // Verify this is from Vercel Cron (security check)
    const authHeader = request.headers.get('authorization');
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Starting scheduled scraping job...');

    // Default locations to scrape (you can make this configurable)
    const locations = ['Georgia', 'Florida', 'California', 'Texas'];
    
    // Pick a location (rotate through them)
    const locationIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % locations.length;
    const location = locations[locationIndex];

    console.log(`[Cron] Scraping location: ${location}`);

    // Create scraping session
    const [session] = await db
      .insert(scrapingSessions)
      .values({
        location,
        status: 'running',
        totalLeadsFound: 0,
        sourcesScraped: [],
      })
      .returning();

    // Initialize all scrapers
    const scrapers: Map<string, BaseScraper> = new Map([
      ['permits', new PermitsScraper()],
      ['reddit', new RedditScraper()],
      ['craigslist', new CraigslistScraper()],
      ['incentives', new IncentivesScraper()],
      ['yelp', new YelpScraper()],
    ]);

    const allLeads: any[] = [];
    const sourcesScraped: string[] = [];
    const { leads: leadsTable } = await import('@/lib/db/schema');

    // Run each scraper
    for (const [key, scraper] of scrapers) {
      try {
        console.log(`[Cron] Running ${key} scraper...`);
        
        // Log start
        await db.insert(scrapingLogs).values({
          sessionId: session.id,
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
              sessionId: session.id,
            }))
          );
          allLeads.push(...result.leads);
        }

        // Log success
        await db.insert(scrapingLogs).values({
          sessionId: session.id,
          source: result.source,
          message: `Completed: ${result.totalLeads} leads found`,
          status: 'success',
          leadCount: result.totalLeads,
        });

        sourcesScraped.push(result.source);
        console.log(`[Cron] ${key}: ${result.totalLeads} leads found`);
      } catch (error: any) {
        console.error(`[Cron] ${key} scraper failed:`, error.message);
        
        // Log error
        await db.insert(scrapingLogs).values({
          sessionId: session.id,
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
      .where(eq(scrapingSessions.id, session.id));

    console.log(`[Cron] Completed: ${allLeads.length} total leads from ${sourcesScraped.length} sources`);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      location,
      leadsFound: allLeads.length,
      sources: sourcesScraped,
    });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: 'Scraping failed', message: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: Request) {
  return GET(request);
}

