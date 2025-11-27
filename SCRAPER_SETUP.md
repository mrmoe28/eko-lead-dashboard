# Scraper Setup Guide

## Overview

The lead dashboard works with an **external scraper process** that:
1. Polls the database for pending scraping jobs
2. Scrapes various sources for solar leads
3. Reports progress and logs back to the dashboard
4. Saves leads to the database

## Architecture

```
Dashboard (Next.js)          External Scraper
       │                            │
       │ 1. Create pending job      │
       ├───────────────────────────>│
       │                            │
       │                   2. Poll for jobs
       │                            │
       │                   3. Start scraping
       │                            │
       │<────── 4. Add logs ─────────┤
       │<────── 5. Update status ────┤
       │<────── 6. Save leads ───────┤
```

## Mock Scraper (For Testing)

A mock scraper (`scripts/mock-scraper.ts`) has been created to test the progress bars and scraping functionality.

### How It Works

The mock scraper:
- Polls the database every 5 seconds for pending jobs
- Simulates scraping 9 different sources (Reddit, Facebook, Nextdoor, etc.)
- Generates random mock lead data
- Reports progress in real-time via database logs
- Updates session status and progress bars

### Running the Mock Scraper

1. **Start the dev server** (in Terminal 1):
   ```bash
   npm run dev
   ```

2. **Start the mock scraper** (in Terminal 2):
   ```bash
   npm run scraper
   ```

3. **Go to the dashboard**: http://localhost:3000/scraping

4. **Click "Start Scraping"** and watch the progress bars!

### What You'll See

- ✅ Progress bars for each source (Building Permits, Reddit, Facebook, etc.)
- ✅ Real-time logs in the console
- ✅ Lead count updates
- ✅ Session status changes (pending → running → completed)
- ✅ Animated progress indicators with gradients
- ✅ Mock leads appearing in the Leads Library

## Real Scraper Implementation

For production, you need an actual scraper that:

### 1. Connects to Your Database

```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const DATABASE_URL = process.env.DATABASE_URL;
const client = postgres(DATABASE_URL);
const db = drizzle(client);
```

### 2. Polls for Pending Jobs

```typescript
const pendingJobs = await db
  .select()
  .from(scrapingSessions)
  .where(eq(scrapingSessions.status, 'pending'))
  .limit(1);
```

### 3. Updates Session Status

```typescript
// Mark as running
await db
  .update(scrapingSessions)
  .set({ status: 'running' })
  .where(eq(scrapingSessions.id, sessionId));
```

### 4. Adds Logs for Progress

```typescript
await db.insert(scrapingLogs).values({
  sessionId,
  source: 'Reddit',
  message: 'Searching Reddit for leads...',
  leadCount: 0,
  status: 'processing',
});
```

### 5. Saves Leads

```typescript
await db.insert(leads).values({
  name: 'John Smith',
  location: 'Georgia',
  score: 85,
  priority: 'high',
  source: 'Reddit',
  // ... other fields
});
```

### 6. Completes Session

```typescript
await db
  .update(scrapingSessions)
  .set({
    status: 'completed',
    completedAt: new Date(),
    totalLeadsFound: totalLeads,
  })
  .where(eq(scrapingSessions.id, sessionId));
```

## Environment Variables

Add to `.env.local`:
```env
DATABASE_URL=your_postgres_connection_string
```

Optional (for API-based scraper):
```env
SCRAPER_API_KEY=your_secret_key_here
```

## Troubleshooting

### Progress Bars Not Showing

**Problem**: Clicked "Start Scraping" but progress bars don't appear

**Solution**:
- Make sure the scraper is running: `npm run scraper`
- Check the browser console for errors
- Verify DATABASE_URL is set correctly

### Job Stays in "Pending" State

**Problem**: Session card shows "Waiting for job watcher..."

**Solution**:
- The scraper isn't running
- Start it with: `npm run scraper`

### No Leads Appearing

**Problem**: Scraping completes but no leads in Leads Library

**Solution**:
- The mock scraper generates random leads (0-5 per source)
- Try running multiple scraping sessions
- Check database connection

## Next Steps

1. **Test with mock scraper** to verify everything works
2. **Build real scraper** using the architecture above
3. **Connect to real data sources** (Reddit API, Facebook Graph API, etc.)
4. **Deploy scraper** as a separate service or background job

## Files Modified

- `scripts/mock-scraper.ts` - Mock scraper implementation
- `package.json` - Added `scraper` script
- Added dependencies: `postgres`, `tsx`
