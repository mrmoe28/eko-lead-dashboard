# 🚀 Complete Automation Guide

## Overview

Your EKO Lead Generator now includes **complete automation** - no manual intervention required! The system will automatically:

1. **Start AI workers** for lead analysis
2. **Run scraping** across multiple platforms  
3. **Analyze leads** with your local Qwen LLM
4. **Sync to Google Sheets** (optional)
5. **Send text notifications** for hot leads
6. **Display enriched leads** in dashboard

## 🎯 Quick Start Options

### Option 1: Full Automation (Recommended)
```bash
./fully-automated-workflow.sh
```
**Complete hands-free operation:**
- Auto-starts workers
- Runs full scraping workflow
- AI analysis happens automatically
- Opens dashboard with enriched leads

### Option 2: Worker Service Manager
```bash
./workers-service.sh start    # Start workers in background
./workers-service.sh stop     # Stop workers
./workers-service.sh status    # Check status
./workers-service.sh logs     # View logs
```

### Option 3: Scheduled Automation
```bash
./setup-cron-automation.sh
```
**Choose schedule:**
- Every 2, 4, 6 hours
- Twice daily (8AM & 6PM) 
- Daily at 9AM
- Custom schedule

### Option 4: Auto-Start on Scrape
```bash
cd solar-data-extractor && npm run scrape
```
**Automatically starts workers if not running**

## 🔧 Configuration

### Environment Variables
```bash
# Database (NeonDB)
DATABASE_URL="postgresql://..."

# LLM Configuration  
LLM_PROVIDER="local"
LLM_BASE_URL="https://llm-chat-app-six.vercel.app/api/v1"
LLM_API_KEY="your-api-key"
LLM_MODEL="qwen/qwen3-vl-4b"
LLM_ENABLED="true"

# Workers
NUM_WORKERS="3"
AUTO_RESTART="true"
```

### Google Sheets (Optional)
```bash
cd solar-data-extractor
./setup-google-sheets-api.sh
```

## 📊 Automation Features

### ✅ AI-Powered Lead Analysis
- **Lead Scoring**: 0-100 based on urgency and intent
- **Priority Classification**: urgent/high/medium/low
- **Sentiment Analysis**: hot/warm/cold leads
- **Budget Assessment**: high/medium/low
- **Revenue Estimation**: Projected deal value
- **Action Recommendations**: Next steps for each lead

### ✅ Worker System
- **Database-backed job queue** (no Redis required)
- **Auto-recovery** for crashed workers
- **Health monitoring** with heartbeat checks
- **Graceful shutdown** handling
- **Proxy rotation** support

### ✅ Real-Time Dashboard
- **Live scraping updates** via Server-Sent Events
- **Enriched lead data** with AI analysis
- **Advanced filtering** by priority, source, score
- **Analytics and metrics** tracking

## 🕐 Automation Schedules

### High Frequency (Every 2 Hours)
- Best for competitive markets
- Captures time-sensitive leads
- Higher resource usage

### Recommended (Every 4 Hours)  
- Good balance of coverage vs resources
- Captures most leads while they're fresh
- Sustainable long-term

### Medium (Every 6 Hours)
- Lower resource usage
- Still captures most valuable leads
- Good for overnight automation

### Twice Daily (8AM & 6PM)
- Targets peak activity times
- Minimal resource usage
- Easy to monitor

## 📱 Notifications

### Hot Lead Alerts
- **Instant text messages** for urgent leads (70+ score)
- **Email notifications** for high-priority leads
- **Dashboard alerts** for real-time monitoring

### Customization
```bash
# Edit notification settings
NOTIFICATION_PHONE="404-551-6532"
HOT_LEAD_THRESHOLD="70"
```

## 🔍 Monitoring

### Worker Logs
```bash
# Follow live logs
./workers-service.sh logs

# Or check log file directly
tail -f /tmp/eko-workers.log
```

### Automation Logs
```bash
# Cron automation logs
tail -f /tmp/eko-automation.log
```

### Dashboard Monitoring
- **Worker status** at `/workers`
- **Live scraping** at `/scraping`  
- **Lead library** at `/leads`
- **Analytics** at `/analytics`

## 🛠 Troubleshooting

### Workers Not Starting
```bash
# Check environment variables
cd eko-lead-dashboard && node -e "console.log('DB:', !!process.env.DATABASE_URL)"

# Test database connection
npx drizzle-kit studio

# Manual worker start
npm run workers:dev
```

### LLM Not Working
```bash
# Test LLM connection
npx tsx test-llm.ts

# Check LLM server status
curl https://llm-chat-app-six.vercel.app/api/v1/models
```

### Automation Not Running
```bash
# Check cron jobs
crontab -l | grep eko

# Test automation manually
./fully-automated-workflow.sh
```

## 🎉 Success Indicators

Your automation is working when you see:

✅ **Workers running**: 3 processes active  
✅ **Leads generated**: CSV files in output/  
✅ **AI analysis**: Enriched data in dashboard  
✅ **Google Sheets synced**: New rows added  
✅ **Text notifications**: Hot lead alerts received  
✅ **Dashboard updated**: Real-time lead data  

## 📚 Additional Resources

- **Main Documentation**: `../CLAUDE.md`
- **Integration Guide**: `../INTEGRATION-GUIDE.md`  
- **Worker System**: `WORKER_SYSTEM.md`
- **LLM Setup**: `LOCAL_LLM_SETUP.md`

---

🎉 **Your solar lead generation is now completely automated!** 

Just run `./fully-automated-workflow.sh` or set up cron automation, and the system will handle everything else automatically.