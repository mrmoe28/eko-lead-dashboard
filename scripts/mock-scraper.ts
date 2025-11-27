/**
 * Mock Scraper - Simulates the external scraper process
 *
 * This script demonstrates how an external scraper would work:
 * 1. Polls database for pending jobs
 * 2. Starts scraping (simulated with delays)
 * 3. Reports progress via API calls
 * 4. Updates session status
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || 'test-scraper-key-12345';
const DATABASE_URL = process.env.DATABASE_URL!;

// Import required modules
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { scrapingSessions, scrapingLogs, leads } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const queryClient = postgres(DATABASE_URL);
const db = drizzle(queryClient);

const SCRAPING_SOURCES = [
  { id: 'permits', name: 'Building Permits' },
  { id: 'incentives', name: 'Incentives' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'craigslist', name: 'Craigslist' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'yelp', name: 'Yelp' },
  { id: 'quora', name: 'Quora' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'nextdoor', name: 'Nextdoor' },
];

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to generate random lead data
function generateMockLead(location: string, source: string) {
  const names = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson'];
  const priorities = ['urgent', 'high', 'medium'];
  const scores = [85, 78, 92, 65, 88, 75, 95];

  return {
    name: names[Math.floor(Math.random() * names.length)],
    location,
    score: scores[Math.floor(Math.random() * scores.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)] as 'urgent' | 'high' | 'medium',
    source,
    phone: `(555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    email: null,
    request: `Solar installation inquiry from ${source}`,
    whyHot: `Found on ${source} - active interest in solar`,
    actionRequired: 'Follow up within 24 hours',
    postedTime: '1 hour ago',
    revenueMin: 15000,
    revenueMax: 35000,
    autoSubmitted: 0,
  };
}

// Add log entry
async function addLog(sessionId: number, source: string, message: string, leadCount: number, status: 'processing' | 'success' | 'error') {
  try {
    await db.insert(scrapingLogs).values({
      sessionId,
      source,
      message,
      leadCount,
      status,
    });
    console.log(`[${source}] ${message}`);
  } catch (error) {
    console.error('Error adding log:', error);
  }
}

// Scrape a single source (simulated)
async function scrapeSource(sessionId: number, location: string, source: typeof SCRAPING_SOURCES[0]) {
  // Starting
  await addLog(sessionId, source.name, `Starting to scrape ${source.name}...`, 0, 'processing');
  await sleep(2000);

  // Scraping
  await addLog(sessionId, source.name, `Searching ${source.name} for leads in ${location}...`, 0, 'processing');
  await sleep(3000);

  // Generate random number of leads (0-5)
  const leadCount = Math.floor(Math.random() * 6);

  if (leadCount > 0) {
    // Save leads to database
    const mockLeads = Array.from({ length: leadCount }, () => generateMockLead(location, source.name));

    try {
      await db.insert(leads).values(mockLeads);
      await addLog(sessionId, source.name, `Found ${leadCount} leads on ${source.name}`, leadCount, 'success');
    } catch (error) {
      await addLog(sessionId, source.name, `Error saving leads: ${error}`, 0, 'error');
    }
  } else {
    await addLog(sessionId, source.name, `No leads found on ${source.name}`, 0, 'success');
  }

  await sleep(1000);
  return leadCount;
}

// Main scraping function
async function runScraper(sessionId: number, location: string) {
  console.log(`\n🚀 Starting scraper for session #${sessionId} - Location: ${location}`);

  // Update session status to 'running'
  await db
    .update(scrapingSessions)
    .set({ status: 'running' })
    .where(eq(scrapingSessions.id, sessionId));

  let totalLeads = 0;
  const sourcesScraped: string[] = [];

  // Scrape each source
  for (const source of SCRAPING_SOURCES) {
    const leadsFound = await scrapeSource(sessionId, location, source);
    totalLeads += leadsFound;
    sourcesScraped.push(source.name);

    // Update session with current progress
    await db
      .update(scrapingSessions)
      .set({
        totalLeadsFound: totalLeads,
        sourcesScraped,
      })
      .where(eq(scrapingSessions.id, sessionId));
  }

  // Complete session
  await db
    .update(scrapingSessions)
    .set({
      status: 'completed',
      completedAt: new Date(),
      totalLeadsFound: totalLeads,
    })
    .where(eq(scrapingSessions.id, sessionId));

  console.log(`\n✅ Scraper completed! Total leads found: ${totalLeads}`);
}

// Poll for pending jobs
async function pollForJobs() {
  console.log('🔍 Polling for pending scraping jobs...');

  try {
    const pendingJobs = await db
      .select()
      .from(scrapingSessions)
      .where(eq(scrapingSessions.status, 'pending'))
      .limit(1);

    if (pendingJobs.length > 0) {
      const job = pendingJobs[0];
      console.log(`\n📋 Found pending job #${job.id} for ${job.location}`);
      await runScraper(job.id, job.location);
    }
  } catch (error) {
    console.error('Error polling for jobs:', error);
  }
}

// Main loop
async function main() {
  console.log('🤖 Mock Scraper Started');
  console.log('   Watching for pending scraping jobs...');
  console.log(`   API: ${API_BASE_URL}`);
  console.log(`   Database: Connected\n`);

  // Poll every 5 seconds
  setInterval(pollForJobs, 5000);

  // Initial poll
  await pollForJobs();
}

// Start the scraper
main().catch(console.error);
