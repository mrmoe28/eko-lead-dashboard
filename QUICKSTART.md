# Worker System - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Dashboard

```bash
npm run dev
```

Dashboard will be available at `http://localhost:3000`

### Step 2: Start the Workers (New Terminal)

```bash
npm run workers:dev
```

You should see:
```
==================================================
EKO LEAD GENERATOR - WORKER MANAGER
==================================================

Starting with configuration:
  - Workers: 3
  - Auto-restart: true

[Manager] Starting worker manager...
[Manager] Spawning worker #0...
[Manager] Spawning worker #1...
[Manager] Spawning worker #2...
[Manager] Started with 3 workers

Worker manager is running!
Press Ctrl+C to stop
```

### Step 3: Create a Scraping Job

Navigate to `http://localhost:3000/scraping` and:

1. Enter a location (e.g., "Georgia")
2. Click "Start Scraping"
3. Watch the console output stream in real-time!

### Step 4: Monitor Workers

Navigate to `http://localhost:3000/workers` to see:

- Worker health status
- Jobs processed
- Performance metrics
- Proxy pool stats

## ✅ What You Just Built

### Before (Issues)
- ❌ No actual scraping implementation
- ❌ Jobs stuck in "pending" forever
- ❌ No worker process to execute jobs
- ❌ No retry logic or error handling
- ❌ No rate limiting or proxy support

### After (Production-Ready)
- ✅ **Worker-based architecture** - Scalable to 10+ workers
- ✅ **Database job queue** - No Redis required
- ✅ **Automatic retries** - Failed jobs retry 3 times with exponential backoff
- ✅ **Health monitoring** - Real-time worker status and metrics
- ✅ **Auto-recovery** - Crashed workers automatically restart
- ✅ **Proxy rotation** - Manage proxy pool with health checks
- ✅ **Rate limiting** - Respect source rate limits (2s between requests)
- ✅ **Structured logging** - Track all scraping activity
- ✅ **Production scraper** - Building Permits scraper included

## 📊 Architecture

```
Dashboard → Database Queue → Worker Manager → 3 Workers → External Sites
                                                   ↓
                                              Proxy Pool
```

## 🎯 Quick Test

### Test 1: Create a Job

```bash
# API
curl -X POST http://localhost:3000/api/scraping/trigger \
  -H "Content-Type: application/json" \
  -d '{"location": "Georgia"}'

# Response
{
  "success": true,
  "sessionId": 42,
  "message": "Scraping job created for Georgia. Waiting for scraper to pick it up..."
}
```

### Test 2: Watch Worker Pick It Up

Check the worker terminal - you should see:
```
[Worker worker-abc123] Processing job #42 for Georgia
[Building Permits] [INFO] Starting scrape for location: Georgia
[Building Permits] [INFO] Searching building permits in Georgia
[Building Permits] [INFO] Found 15 permit leads in Georgia
[Worker worker-abc123] Job #42 completed: 15 total leads from 1 sources
```

### Test 3: Check Results

Visit `/scraping` or query database:
```sql
SELECT * FROM leads WHERE session_id = 42;
```

## 🔧 Configuration

### Change Number of Workers

```bash
# 5 workers instead of 3
NUM_WORKERS=5 npm run workers:dev
```

### Adjust Scraper Rate Limit

Edit `src/lib/scraper-config.ts`:
```typescript
rateLimit: 3000,  // 3 seconds between requests (default: 2000)
```

### Enable Proxy Rotation

```typescript
const scraper = new PermitsScraper({
  useProxy: true,
  proxyRotation: true,
});
```

## 📚 Next Steps

1. **Add More Scrapers** - See `WORKER_SYSTEM.md` → "Creating a New Scraper"
2. **Add Proxies** - For production, add paid proxies to avoid rate limits
3. **Deploy to Production** - Use PM2, systemd, or Docker (see `WORKER_SYSTEM.md`)
4. **Monitor Performance** - Check `/workers` dashboard regularly
5. **Scale Up** - Add more workers as job volume increases

## 🐛 Troubleshooting

### Workers Not Starting?

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Node version (need 18+)
node --version
```

### Jobs Not Processing?

```bash
# Check worker status
http://localhost:3000/api/workers/health

# Check database
psql $DATABASE_URL -c "SELECT * FROM worker_instances;"
```

### Slow Scraping?

- Reduce `rateLimit` (but respect rate limits!)
- Increase `maxConcurrent` for parallel requests
- Add more workers: `NUM_WORKERS=5`

## 🎉 You're Ready!

The worker system is now:
- ✅ Running
- ✅ Processing jobs
- ✅ Monitored
- ✅ Auto-recovering

For full documentation, see `WORKER_SYSTEM.md`

---

**Need Help?**
- Check logs in worker terminal
- Visit `/workers` dashboard
- Review `WORKER_SYSTEM.md`
- Check database for stuck jobs
