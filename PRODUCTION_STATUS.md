# Production Status & Testing Guide

## ✅ What's Working Now

### Local Development
- ✅ Workers running (3 processes active)
- ✅ Dev server running on `http://localhost:3001`
- ✅ Database connected (Neon Postgres)
- ✅ UI accessible at `/scraping` page
- ✅ Building Permits scraper implemented

### Production-Ready Features
- ✅ Vercel Cron configuration added
- ✅ Serverless scraping endpoint created (`/api/cron/scrape`)
- ✅ Automatic lead saving
- ✅ Session tracking
- ✅ Real-time UI updates (local)

---

## 🧪 How to Test Right Now (Local)

### 1. Access the UI
Open your browser to: **`http://localhost:3001/scraping`**
(Note: Port 3001, not 3000!)

### 2. Start a Scraping Job
1. Enter a location: "Georgia" (or any US state)
2. Click **"Start Scraping"** button
3. Watch the console output in real-time
4. Workers will pick up the job within 5 seconds

### 3. Monitor Progress
- **Console Output**: Live logs from scrapers
- **Progress Bars**: Visual progress for each source
- **Session Status**: Current job details
- **Recent Sessions**: Historical job list

### 4. View Results
After scraping completes:
- Go to `/leads` page to see all leads
- Check lead details, scores, and priorities
- Filter by source, location, priority

---

## 🚀 How It Will Work in Production

### Current Limitation
**❌ Workers cannot run on Vercel** because it's serverless

### Solution Implemented
**✅ Vercel Cron Jobs** - Automatic scraping every 6 hours

### What Happens in Production:
1. **Automatic Scraping** (every 6 hours)
   - Vercel triggers `/api/cron/scrape`
   - Scrapes one location (rotates: GA, FL, CA, TX)
   - Saves leads automatically
   - No manual intervention needed

2. **Manual Scraping** (via UI)
   - User clicks "Start Scraping"
   - Creates a "pending" job in database
   - **Job will be processed** by next cron run OR
   - You can trigger immediately via API call

### Cron Schedule
```
"0 */6 * * *" = Every 6 hours
```

Times (EST): 12am, 6am, 12pm, 6pm

---

## 🔧 What You Need to Do for Production

### Step 1: Set Environment Variables in Vercel
1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these:
   ```
   CRON_SECRET=<generate-a-secure-random-key>
   DATABASE_URL=<your-neon-postgres-url>
   LLM_ENABLED=false
   ```

### Step 2: Generate CRON_SECRET
```bash
# Run this to generate a secure key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Deploy
```bash
git add .
git commit -m "Add production scraping via Vercel Cron"
git push origin main
```

### Step 4: Verify Cron Job
1. Go to Vercel Dashboard
2. Your Project → Settings → Cron Jobs
3. Should see: `/api/cron/scrape` - Every 6 hours

---

## 🎯 Testing in Production

### Test Automatic Scraping
Wait for next cron execution (every 6 hours), or trigger manually:

```bash
curl -X GET https://your-app.vercel.app/api/cron/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response:**
```json
{
  "success": true,
  "sessionId": 123,
  "location": "Georgia",
  "leadsFound": 45,
  "source": "Building Permits"
}
```

### Test Manual Scraping via UI
1. Go to `https://your-app.vercel.app/scraping`
2. Enter location
3. Click "Start Scraping"
4. Job created as "pending"
5. Next cron run will process it

---

## 📊 Monitoring Production Scraping

### View Results in UI
- **URL**: `https://your-app.vercel.app/scraping`
- Check "Recent Sessions" for completed jobs
- View lead count per session

### View Leads
- **URL**: `https://your-app.vercel.app/leads`
- All scraped leads display here
- Filter by date, source, priority

### View Function Logs (Vercel)
1. Vercel Dashboard → Your Project
2. Click "Functions" tab
3. Find `/api/cron/scrape`
4. View execution history and logs

### View Database (Neon)
1. Neon Console → Your Database
2. Tables → `scraping_sessions` (job history)
3. Tables → `leads` (scraped leads)

---

## 🐛 Troubleshooting

### Local: No Activity
**Problem**: Workers running but no scraping happens

**Solution**:
1. Make sure you're on `http://localhost:3001` (not 3000)
2. Create a job by clicking "Start Scraping"
3. Check terminal with workers - should see activity within 5s
4. Verify database connection in `.env.local`

### Local: Workers Not Starting
**Problem**: `npm run workers:start` fails

**Solution**:
```bash
# Check if database is accessible
psql $DATABASE_URL -c "SELECT 1;"

# Restart workers
pkill -f "scraper-worker"
npm run workers:start
```

### Production: Cron Not Running
**Problem**: No automatic scraping happening

**Solution**:
1. Check Vercel Dashboard → Cron Jobs tab
2. Verify execution history
3. Check function logs for errors
4. Confirm `CRON_SECRET` is set
5. Free tier allows 100 executions/day (6h schedule = 4/day)

### Production: Manual Jobs Stay "Pending"
**Problem**: UI creates job but it never processes

**Expected Behavior**: 
- Manual jobs in production will process on next cron run (up to 6 hours wait)
- For immediate processing, trigger cron endpoint manually

**Workaround**:
```bash
# Manually trigger processing
curl -X GET https://your-app.vercel.app/api/cron/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🎨 UI Features Available

### Scraping Page (`/scraping`)
- ✅ Start/Stop scraping
- ✅ Real-time console logs (local only)
- ✅ Progress tracking per source
- ✅ Session history
- ✅ Live connection indicator
- ✅ Source configuration (enable/disable)

### Leads Page (`/leads`)
- ✅ Grid and table views
- ✅ Lead scoring and priority
- ✅ Detail modal with full information
- ✅ Filtering and search
- ✅ Export capabilities

### Workers Page (`/workers`)
- ✅ Worker health monitoring (local only)
- ✅ Job queue status
- ✅ Performance metrics

---

## 📈 What's Next

### Immediate (Can Test Now)
1. ✅ Test local scraping with workers
2. ✅ Verify leads appear in UI
3. ✅ Check session tracking

### Before Production Deploy
1. 🔲 Set up environment variables in Vercel
2. 🔲 Generate and save `CRON_SECRET`
3. 🔲 Test cron endpoint locally
4. 🔲 Deploy to Vercel

### Future Enhancements
1. 🔲 Add more scrapers (Reddit, Yelp, Craigslist)
2. 🔲 Implement LLM lead analysis
3. 🔲 Add email notifications for hot leads
4. 🔲 Create lead export functionality
5. 🔲 Add analytics dashboard

---

## 🆘 Quick Reference

### Local URLs
- Dev Server: `http://localhost:3001`
- Scraping Page: `http://localhost:3001/scraping`
- Leads Page: `http://localhost:3001/leads`
- Workers Page: `http://localhost:3001/workers`

### Important Commands
```bash
# Start development
npm run dev

# Start workers (separate terminal)
npm run workers:start

# Watch workers with auto-restart
npm run workers:dev

# Build for production
npm run build

# Check database
psql $DATABASE_URL
```

### Key Files
- `src/workers/scraper-worker.ts` - Worker implementation
- `src/workers/scrapers/permits.scraper.ts` - Permits scraper
- `src/app/api/cron/scrape/route.ts` - Production cron endpoint
- `vercel.json` - Cron job configuration
- `DEPLOYMENT_GUIDE.md` - Full deployment documentation

---

## 💡 Pro Tips

1. **Local Development**: Always run workers in a separate terminal to see real-time logs
2. **Database**: Use Neon's query editor to inspect data directly
3. **Debugging**: Check both worker logs AND API logs for issues
4. **Production**: Set up Vercel notifications for cron failures
5. **Testing**: Use different locations to avoid hitting same sources repeatedly

---

## ✨ Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Local Workers | ✅ Running | 3 workers active |
| Dev Server | ✅ Running | Port 3001 |
| Database | ✅ Connected | Neon Postgres |
| Permits Scraper | ✅ Working | Implemented |
| UI | ✅ Working | Full features |
| Vercel Cron | ⏳ Ready | Needs deployment |
| Production | ⏳ Pending | Needs env vars |

**Next Action**: Test local scraping at `http://localhost:3001/scraping` 🚀

