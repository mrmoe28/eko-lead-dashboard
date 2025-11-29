# Solutions & Error Fixes

This document contains solutions to errors we've encountered in this project for quick reference.

## TypeScript: Private Property Conflict in Class Inheritance

**Error:**
```
Type error: Class 'MockLLMService' incorrectly extends base class 'LLMService'.
Types have separate declarations of a private property 'recordUsage'.
```

**Problem:**
When a child class extends a parent class, and both classes have a `private` property/method with the same name, TypeScript will throw an error. Private members are scoped to the specific class where they're declared, so having duplicate private members with the same name creates a conflict.

**Solution:**
1. Change the `private` method in the base class to `protected` to allow child classes to access/override it
2. Remove the duplicate private declaration from the child class

**Files Changed:**
- `src/lib/llm/llm-service.ts`: Changed `private recordUsage()` to `protected recordUsage()`
- `src/lib/llm/mock-llm-service.ts`: Removed the duplicate `private recordUsage()` method

**Date Fixed:** 2025-11-29

---

## Next.js Build: Out of Memory Error

**Error:**
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Problem:**
Large Next.js projects with many TypeScript files can exceed Node.js's default heap memory limit during the build process, especially during TypeScript type checking.

**Solution:**
Increase Node.js heap memory allocation using the `NODE_OPTIONS` environment variable:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Permanent Fix:**
Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

**Date Fixed:** 2025-11-29

---

## Workers Running But No Activity in UI

**Error:**
"The scraper is running but there is no activity"

**Problem:**
The background workers are running locally and polling for jobs, but:
1. No scraping jobs have been created yet
2. Workers only process jobs that exist in the database with status "pending"
3. In production (Vercel), background workers cannot run at all due to serverless architecture

**Solution - Local Development:**
1. Access the scraping UI at `http://localhost:3001/scraping` (check your actual port)
2. Enter a location (e.g., "Georgia")
3. Click "Start Scraping" button
4. Workers will pick up the job within 5 seconds and begin processing
5. Watch real-time logs in the console output section

**Solution - Production (Vercel):**
Workers cannot run on Vercel (serverless platform). Use Vercel Cron Jobs instead:

1. **Configure Cron Job** in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

2. **Create Cron Endpoint** at `src/app/api/cron/scrape/route.ts`
3. **Set Environment Variables** in Vercel:
   - `CRON_SECRET` - Random secure key for authentication
   - `DATABASE_URL` - Neon Postgres connection string

4. **Deploy** - Cron will automatically run every 6 hours

**Files Created/Modified:**
- `vercel.json` - Added cron configuration
- `src/app/api/cron/scrape/route.ts` - Serverless scraping endpoint
- `DEPLOYMENT_GUIDE.md` - Full documentation on local vs production
- `PRODUCTION_STATUS.md` - Testing and monitoring guide

**Key Concept:**
- **Local**: Workers poll continuously → immediate processing
- **Production**: Cron jobs run on schedule → batch processing every 6 hours

**Date Fixed:** 2025-11-29

---

## Drizzle ORM: Incorrect WHERE Clause Syntax

**Error:**
```
Type error: Property 'eq' does not exist on type 'PgColumn<{ name: "id"; tableName: "scraping_sessions"...
```

**Problem:**
Using incorrect Drizzle ORM syntax for WHERE clauses. The `.eq()` method doesn't exist on columns.

**Incorrect Code:**
```typescript
.where(scrapingSessions.id.eq(session.id))
```

**Solution:**
Import and use the `eq` function from `drizzle-orm`:

```typescript
import { eq } from 'drizzle-orm';

.where(eq(scrapingSessions.id, session.id))
```

**Files Changed:**
- `src/app/api/cron/scrape/route.ts`: Added `eq` import and fixed WHERE clause

**Key Concept:**
Drizzle ORM uses helper functions (`eq`, `gt`, `lt`, `and`, `or`, etc.) rather than methods on columns.

**Date Fixed:** 2025-11-29

---
