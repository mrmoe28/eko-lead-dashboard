# Deployment Guide - Local vs Production

This guide explains how the scraping system works differently in local development vs production deployment.

## 🏠 Local Development (Current Setup)

### Architecture
- **Background Workers**: Run continuously via `npm run workers:start`
- **Job Queue**: Workers poll database every 5 seconds for pending jobs
- **Real-time Processing**: Jobs are picked up and processed immediately

### How It Works
```
User creates job → Database (pending) → Worker polls → Worker processes → Database (completed)
```

### Starting Workers Locally
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start workers
npm run workers:start

# Terminal 3 (optional): Watch workers
npm run workers:dev
```

### Advantages
- ✅ Immediate job processing
- ✅ Multiple workers for parallel scraping
- ✅ Real-time progress monitoring
- ✅ Auto-restart on failure

### Limitations
- ❌ Requires processes to run continuously
- ❌ Only works on your local machine
- ❌ **Does NOT work on Vercel** (serverless platform)

---

## ☁️ Production Deployment (Vercel)

### Why Workers Don't Work on Vercel
Vercel is a **serverless platform**:
- Functions run on-demand, not continuously
- No support for long-running background processes
- Each API request is isolated
- Processes terminate after response

### Solution: Vercel Cron Jobs

We've configured automatic scraping using **Vercel Cron Jobs** instead of workers.

#### Configuration (`vercel.json`)
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

**Schedule**: `0 */6 * * *` = Every 6 hours

#### How It Works in Production
```
Vercel Cron (every 6 hours) → /api/cron/scrape → Execute scraper → Save leads
```

### Endpoints

#### 1. **Automatic Scraping** (Cron)
- **URL**: `/api/cron/scrape`
- **Triggered by**: Vercel Cron (every 6 hours)
- **Locations**: Rotates through: Georgia, Florida, California, Texas
- **Security**: Requires `CRON_SECRET` environment variable

#### 2. **Manual Scraping** (UI)
- **URL**: `/api/scraping/trigger`
- **Triggered by**: User clicking "Start Scraping" button
- **Locations**: User-specified
- **Note**: Creates "pending" job that needs manual processing

### Environment Variables (Add to Vercel)
```env
CRON_SECRET=your-secret-key-here
DATABASE_URL=your-neon-database-url
LLM_ENABLED=false  # Set to true if you want AI analysis
```

---

## 📋 Deployment Options Comparison

| Feature | Local (Workers) | Production (Vercel Cron) |
|---------|----------------|--------------------------|
| **Job Processing** | Real-time (5s) | Scheduled (6 hours) |
| **Trigger Method** | UI + Workers | UI creates pending job, Cron processes |
| **Parallelization** | Multiple workers | Single serverless function |
| **Cost** | Free (local) | Free tier: 100 executions/day |
| **Reliability** | Requires running | Automatic by Vercel |
| **Monitoring** | Real-time logs | Function logs in Vercel dashboard |

---

## 🚀 Deployment Steps

### Step 1: Update Environment Variables in Vercel
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - `CRON_SECRET` = Generate a random secure key
   - `DATABASE_URL` = Your Neon Postgres connection string
   - `LLM_ENABLED` = `false` (or `true` if using LLM)

### Step 2: Deploy Updated Code
```bash
git add .
git commit -m "Add Vercel Cron support for scraping"
git push origin main
```

### Step 3: Verify Cron Job in Vercel
1. Go to Vercel Dashboard → Your Project
2. Settings → Cron Jobs
3. You should see: `/api/cron/scrape` scheduled for every 6 hours

### Step 4: Test Manual Trigger
```bash
# Test the cron endpoint (with your CRON_SECRET)
curl -X GET https://your-app.vercel.app/api/cron/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🔄 Hybrid Approach (Recommended)

### For Best Results:
1. **Local Development**: Use workers for real-time testing
   ```bash
   npm run dev         # Terminal 1
   npm run workers:start  # Terminal 2
   ```

2. **Production**: Use Vercel Cron for automated scraping
   - Runs every 6 hours automatically
   - No server maintenance required

3. **Manual Scraping**: Use UI to create jobs
   - Local: Workers pick up immediately
   - Production: Next cron run will process pending jobs

---

## 📊 Monitoring in Production

### View Scraping Sessions
1. Go to: `https://your-app.vercel.app/scraping`
2. Check "Recent Sessions" section
3. See completed jobs and lead counts

### View Function Logs
1. Vercel Dashboard → Your Project → Functions
2. Click on `/api/cron/scrape`
3. View execution logs and errors

### Database Monitoring
1. Go to Neon Console
2. Check `scraping_sessions` table
3. Check `leads` table for new entries

---

## ⚡ Alternative: Deploy Workers Separately

If you need real-time processing in production:

### Option A: Railway.app / Render.com
Deploy workers as a separate service:
```bash
# Dockerfile for workers
FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "workers:start"]
```

### Option B: AWS EC2 / DigitalOcean
Run workers on a VPS:
```bash
# Setup on server
git clone your-repo
cd eko-lead-dashboard
npm install
npm run workers:start &
```

### Option C: Docker Compose (Self-hosted)
```yaml
# docker-compose.yml
services:
  web:
    build: .
    ports:
      - "3000:3000"
    command: npm run start
  
  workers:
    build: .
    command: npm run workers:start
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

---

## 🆘 Troubleshooting

### Local: "No activity in workers"
- ✅ Workers are running: Check terminal output
- ❌ No jobs created: Create a job via UI at `http://localhost:3001/scraping`
- ❌ Database connection: Check `.env.local` has correct `DATABASE_URL`

### Production: "Cron not running"
- Check Vercel Dashboard → Cron Jobs tab
- Verify `CRON_SECRET` is set
- Check function logs for errors
- Free tier limit: 100 executions/day

### Both: "Scraper finding no leads"
- Only Building Permits scraper is implemented
- Some locations may have no recent permits
- Check scraper logs for specific errors

---

## 📝 Next Steps

1. **Test locally**: 
   - Start workers
   - Create a job
   - Verify leads appear

2. **Deploy to Vercel**:
   - Push code
   - Set environment variables
   - Test cron endpoint

3. **Monitor**:
   - Check Vercel logs
   - Verify leads in database
   - Review scraping sessions

4. **Expand**:
   - Implement more scrapers (Reddit, Yelp, etc.)
   - Adjust cron schedule if needed
   - Add LLM analysis in production

---

## 🔗 Related Documentation
- [WORKER_SYSTEM.md](./WORKER_SYSTEM.md) - Worker architecture details
- [QUICKSTART.md](./QUICKSTART.md) - Getting started guide
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) - Official documentation

