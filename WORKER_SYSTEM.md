# Worker-Based Scraper System Documentation

## Overview

The EKO Lead Generator now uses a production-grade worker-based architecture for scraping. This system provides:

- ✅ **Scalable worker processes** - Run multiple workers in parallel
- ✅ **Database-backed job queue** - No Redis required
- ✅ **Automatic retries** - Failed jobs retry with exponential backoff
- ✅ **Health monitoring** - Real-time worker status and metrics
- ✅ **Auto-recovery** - Crashed workers automatically restart
- ✅ **Proxy rotation** - Manage proxy pool with health checks
- ✅ **Rate limiting** - Respect source rate limits
- ✅ **Structured logging** - Track all scraping activity

## Architecture

```
Dashboard (Next.js) → Database (Job Queue) → Worker Manager → Workers → External Sites
                              ↓                    ↓
                         Analytics             Proxy Pool
```

### Components

**1. Job Queue** (`src/workers/queue/job-queue.ts`)
- Fetches pending jobs from database
- Tracks job status (pending → running → completed/failed)
- Handles retries (max 3 attempts)
- Records logs and metrics

**2. Worker Manager** (`src/workers/manager.ts`)
- Spawns and manages worker processes
- Monitors worker health via heartbeat
- Auto-restarts crashed workers
- Handles graceful shutdown

**3. Scraper Worker** (`src/workers/scraper-worker.ts`)
- Polls for jobs every 5 seconds
- Executes configured scrapers
- Reports heartbeat every 30 seconds
- Saves leads to database

**4. Base Scraper** (`src/lib/scrapers/base-scraper.ts`)
- Abstract class all scrapers extend
- Provides rate limiting via p-queue
- Retry logic with exponential backoff
- Request metrics tracking
- Helper methods (extractEmail, extractPhone, etc.)

**5. Proxy Manager** (`src/workers/proxy/proxy-manager.ts`)
- Manages rotating proxy pool
- Health checks proxies periodically
- Tracks success rates
- Auto-disables failed proxies

## Getting Started

### 1. Start Workers

```bash
# Development (auto-restarts on code changes)
npm run workers:dev

# Production
npm run workers:start

# Single worker (for testing)
npm run worker:single
```

### 2. Configure Workers

Set environment variables:

```bash
# Number of worker processes (default: 3)
export NUM_WORKERS=5

# Enable auto-restart (default: true)
export AUTO_RESTART=true
```

### 3. Create Scraping Job

Use the dashboard at `/scraping` or via API:

```typescript
// POST /api/scraping/trigger
{
  "location": "Georgia"
}
```

### 4. Monitor Workers

Visit `/workers` dashboard to see:
- Active worker count
- Jobs processed
- Error rates
- Per-source metrics
- Proxy pool status

## Creating a New Scraper

### 1. Extend BaseScraper

```typescript
// src/workers/scrapers/reddit.scraper.ts
import { BaseScraper } from '@/lib/scrapers/base-scraper';
import { ScrapedLead, ScraperConfig } from '@/lib/scraper-config';

export class RedditScraper extends BaseScraper {
  constructor(config?: Partial<ScraperConfig>) {
    super('Reddit', config);
  }

  async scrape(location: string): Promise<ScrapedLead[]> {
    const leads: ScrapedLead[] = [];

    // Your scraping logic here
    // Use this.makeRequest() for rate-limited HTTP requests
    const html = await this.makeRequest<string>('https://reddit.com/r/solar');

    // Parse and return leads
    return leads;
  }
}
```

### 2. Register Scraper

Add to `src/workers/scraper-worker.ts`:

```typescript
private initializeScrapers(): Map<string, BaseScraper> {
  const scrapers = new Map<string, BaseScraper>();

  scrapers.set('permits', new PermitsScraper());
  scrapers.set('reddit', new RedditScraper()); // ← Add here

  return scrapers;
}
```

### 3. Test Scraper

```typescript
// Test standalone
const scraper = new RedditScraper();
const result = await scraper.execute('Georgia');
console.log(`Found ${result.totalLeads} leads`);
```

## Using Proxies

### Add Proxies

```typescript
import { ProxyManager } from '@/workers/proxy/proxy-manager';

const pm = new ProxyManager();

// Add single proxy
await pm.addProxy('http://user:pass@proxy.example.com:8080');

// Start health checks (every 5 minutes)
pm.startHealthChecks(300000);
```

### Enable in Scraper

```typescript
const scraper = new PermitsScraper({
  useProxy: true,
  proxyRotation: true,
  proxyHealthCheck: true,
});
```

## Configuration

### Scraper Config

Located in `src/lib/scraper-config.ts`:

```typescript
const config: ScraperConfig = {
  rateLimit: 2000,        // Min 2s between requests
  maxConcurrent: 3,       // Max 3 parallel requests
  maxRetries: 3,          // Retry failed requests 3 times
  retryDelay: 1000,       // Start with 1s delay
  retryBackoff: 2,        // Double delay each retry
  timeout: 30000,         // 30s request timeout
  jobTimeout: 600000,     // 10 minute job timeout
  respectRobotsTxt: true, // Always true!
  useProxy: false,        // Enable proxy rotation
  logLevel: 'info',       // debug | info | warn | error
};
```

### Worker Config

```typescript
const manager = new WorkerManager({
  numWorkers: 3,              // Number of worker processes
  healthCheckInterval: 60000, // Health check every 60s
  workerTimeout: 120000,      // Mark worker crashed after 2min
  autoRestart: true,          // Auto-restart crashed workers
});
```

## Database Schema

### Worker Tables

```sql
-- Worker instances
CREATE TABLE worker_instances (
  id SERIAL PRIMARY KEY,
  worker_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,           -- 'running' | 'idle' | 'crashed' | 'stopped'
  last_heartbeat TIMESTAMP,
  jobs_processed INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  current_job_id INT,
  started_at TIMESTAMP DEFAULT NOW(),
  stopped_at TIMESTAMP
);

-- Proxy pool
CREATE TABLE proxy_pool (
  id SERIAL PRIMARY KEY,
  proxy_url TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,           -- 'active' | 'failed' | 'testing'
  success_rate FLOAT DEFAULT 0,   -- 0-100
  avg_response_time INT,          -- milliseconds
  last_used TIMESTAMP,
  last_health_check TIMESTAMP,
  failures_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scraper metrics (time-series)
CREATE TABLE scraper_metrics (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  requests_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  avg_response_time INT,
  leads_found INT DEFAULT 0
);
```

### Enhanced Session Tracking

```sql
ALTER TABLE scraping_sessions
  ADD COLUMN worker_id TEXT,
  ADD COLUMN proxy_used TEXT,
  ADD COLUMN retry_count INT DEFAULT 0,
  ADD COLUMN timeout_at TIMESTAMP;
```

## Monitoring & Debugging

### View Worker Logs

```bash
# Workers log to stdout
npm run workers:start

# Output includes:
# [2025-01-28T10:30:00.000Z] [Worker worker-abc123] Processing job #42 for Georgia
# [2025-01-28T10:30:05.000Z] [Building Permits] [INFO] Searching building permits in Georgia
# [2025-01-28T10:30:12.000Z] [Building Permits] [INFO] Found 15 permit leads in Georgia
```

### Health Dashboard

Navigate to `/workers` to see:
- Worker status (running, idle, crashed)
- Last heartbeat timestamp
- Jobs processed per worker
- Error counts
- Success rates by source
- Proxy pool health

### Database Queries

```sql
-- Active workers
SELECT * FROM worker_instances WHERE status IN ('running', 'idle');

-- Recent metrics (last hour)
SELECT source, SUM(leads_found) as total_leads
FROM scraper_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY source;

-- Proxy health
SELECT status, COUNT(*) FROM proxy_pool GROUP BY status;
```

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem.config.js
module.exports = {
  apps: [{
    name: 'scraper-workers',
    script: 'npm',
    args: 'run workers:start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      NUM_WORKERS: 5,
    }
  }]
};

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs scraper-workers

# Restart
pm2 restart scraper-workers

# Stop
pm2 stop scraper-workers
```

### Option 2: Systemd Service

```bash
# Create service file: /etc/systemd/system/scraper-workers.service
[Unit]
Description=EKO Lead Scraper Workers
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/project
Environment="NODE_ENV=production"
Environment="NUM_WORKERS=5"
ExecStart=/usr/bin/npm run workers:start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable scraper-workers
sudo systemctl start scraper-workers

# Status
sudo systemctl status scraper-workers

# Logs
sudo journalctl -u scraper-workers -f
```

### Option 3: Docker

```dockerfile
# Dockerfile.workers
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production

COPY . .

ENV NUM_WORKERS=5
ENV AUTO_RESTART=true

CMD ["npm", "run", "workers:start"]
```

```bash
# Build
docker build -f Dockerfile.workers -t scraper-workers .

# Run
docker run -d \
  --name scraper-workers \
  --restart unless-stopped \
  -e DATABASE_URL=$DATABASE_URL \
  -e NUM_WORKERS=5 \
  scraper-workers

# Logs
docker logs -f scraper-workers
```

## Scaling

### Horizontal Scaling

Run multiple worker manager instances across different machines:

```bash
# Machine 1
NUM_WORKERS=5 npm run workers:start

# Machine 2
NUM_WORKERS=5 npm run workers:start

# Total: 10 workers processing jobs
```

Workers coordinate via database job queue - no additional setup needed!

### Vertical Scaling

Increase workers per machine:

```bash
# 10 workers on single machine
NUM_WORKERS=10 npm run workers:start
```

**Recommended:** 1-2 workers per CPU core.

## Troubleshooting

### Workers Not Starting

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check for port conflicts
lsof -ti:3000

# Check permissions
chmod +x scripts/start-workers.ts
```

### Workers Crashing

Check logs for errors:
```bash
pm2 logs scraper-workers --err
```

Common causes:
- Out of memory → Reduce NUM_WORKERS or increase RAM
- Database connection lost → Check DATABASE_URL
- Unhandled errors in scraper → Add try/catch blocks

### Jobs Not Processing

```sql
-- Check pending jobs
SELECT * FROM scraping_sessions WHERE status = 'pending';

-- Check worker status
SELECT * FROM worker_instances WHERE status IN ('running', 'idle');

-- Check for stuck jobs
SELECT * FROM scraping_sessions
WHERE status = 'running' AND started_at < NOW() - INTERVAL '10 minutes';
```

### Slow Scraping

- Reduce `rateLimit` in scraper config (but respect rate limits!)
- Increase `maxConcurrent` for parallel requests
- Add more workers
- Enable proxy rotation to avoid IP bans

## Best Practices

### 1. Respect Rate Limits
```typescript
const config = {
  rateLimit: 2000,  // Min 2s between requests
  maxConcurrent: 3, // Max 3 parallel requests
};
```

### 2. Always Check robots.txt
```typescript
const config = {
  respectRobotsTxt: true,  // Always true!
  checkRobotsTxt: true,
};
```

### 3. Handle Errors Gracefully
```typescript
try {
  const html = await this.makeRequest(url);
  // Process html
} catch (error) {
  this.logError(`Failed to fetch ${url}: ${error.message}`);
  // Continue with next URL
}
```

### 4. Clean Data Before Saving
```typescript
const lead: ScrapedLead = {
  name: this.cleanText(rawName),
  email: this.extractEmail(rawText),
  phone: this.extractPhone(rawText),
  request: this.cleanText(rawRequest),
  // ...
};
```

### 5. Monitor Performance
- Check `/workers` dashboard regularly
- Set up alerts for high error rates
- Review scraper metrics weekly

## Support

For issues or questions:
- Check logs first
- Review this documentation
- Check database for stuck jobs
- Restart workers if needed

## Changelog

### v1.0.0 (2025-01-28)
- Initial worker-based architecture
- Database-backed job queue
- Proxy rotation support
- Health monitoring dashboard
- Auto-recovery for crashed workers
- Building Permits scraper implementation
