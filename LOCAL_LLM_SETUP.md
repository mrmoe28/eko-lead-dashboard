# Local LLM Integration Guide

## Overview

The EKO Lead Dashboard now integrates with your local LLM server for intelligent lead processing. This eliminates the need to pay for external API tokens while providing:

- ✅ **Lead Scoring** - AI-powered lead quality scoring (0-100)
- ✅ **Intent Analysis** - Understand what the lead wants
- ✅ **Lead Enrichment** - Extract structured data from unstructured text
- ✅ **Auto-Response Generation** - Generate personalized responses
- ✅ **Source Quality Analysis** - Rate lead source reliability
- ✅ **Sentiment Analysis** - Determine lead urgency (hot/warm/cold)
- ✅ **Zero Cost** - Use your local LLM for free

## Architecture

```
Scraper → Leads Saved → LLM Analysis → Enhanced Leads → Dashboard
                              ↓
                     Your Local LLM Server
                     (OpenAI-Compatible API)
```

## Prerequisites

Your local LLM server must:
1. Be OpenAI API-compatible (support `/v1/chat/completions` endpoint)
2. Provide API keys for authentication
3. Be accessible from your dashboard server

## Setup Instructions

### Step 1: Get Your LLM API Details

From your local LLM chat interface:

1. **Generate API Key**
   - Go to your LLM settings/API section
   - Create a new API key (like OpenAI format)
   - Copy the key (e.g., `sk-xxxxxxxxxxxxxxxxxx`)

2. **Get Base URL**
   - Find your LLM server URL (e.g., `http://localhost:3001` or your Vercel deployment)
   - The API endpoint should be: `{BASE_URL}/v1/chat/completions`

3. **Get Model Name**
   - Find what model name to use (e.g., `gpt-4`, `llama-3`, `your-custom-model`)

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your LLM configuration:

```bash
# LLM Configuration
LLM_PROVIDER="local"                                    # Keep as "local"
LLM_BASE_URL="https://your-llm-server.vercel.app/v1"  # Your LLM endpoint
LLM_API_KEY="sk-your-api-key-here"                     # Your API key
LLM_MODEL="gpt-4"                                       # Your model name
LLM_MAX_TOKENS="1000"                                   # Max tokens per request
LLM_TEMPERATURE="0.7"                                   # 0-1 (creativity)
LLM_ENABLED="true"                                      # Enable LLM features
```

**Example configurations:**

**Local Server:**
```bash
LLM_BASE_URL="http://localhost:3001/v1"
LLM_API_KEY="local-dev-key"
LLM_MODEL="llama-3-70b"
```

**Vercel Deployment:**
```bash
LLM_BASE_URL="https://my-llm.vercel.app/v1"
LLM_API_KEY="sk-proj-abc123xyz..."
LLM_MODEL="gpt-4"
```

### Step 3: Test LLM Connection

Create a test script:

```typescript
// test-llm.ts
import { getLLM } from './src/lib/llm/llm-service';

async function testLLM() {
  const llm = getLLM();

  console.log('Testing LLM connection...');

  const response = await llm.complete('Say hello!');

  console.log('LLM Response:', response);
  console.log('✅ LLM is working!');
}

testLLM().catch(console.error);
```

Run test:
```bash
tsx test-llm.ts
```

Expected output:
```
Testing LLM connection...
LLM Response: Hello! How can I help you today?
✅ LLM is working!
```

### Step 4: Restart Workers

Restart the worker processes to load new environment variables:

```bash
# Stop workers (Ctrl+C)
# Then restart
npm run workers:dev
```

You should see LLM analysis in the logs:
```
[LLM] [INFO] Analyzing 15 leads with AI...
[LLM] [INFO] AI analysis complete: 15 analyzed, 12 enriched
```

## Usage

### Automatic Analysis (Recommended)

Leads are automatically analyzed when scraped if `LLM_ENABLED=true`.

The worker will:
1. Scrape leads from sources
2. Save leads to database
3. **Automatically analyze with LLM** ← New!
4. Update leads with:
   - AI-generated score (0-100)
   - Priority level (urgent/high/medium/low)
   - Intent analysis
   - Action recommendations
   - Revenue estimates

### Manual Analysis

Analyze a specific lead via API:

```bash
# Analyze lead
curl -X POST http://localhost:3000/api/leads/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": 42,
    "action": "analyze"
  }'

# Enrich lead
curl -X POST http://localhost:3000/api/leads/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": 42,
    "action": "enrich"
  }'

# Generate response
curl -X POST http://localhost:3000/api/leads/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": 42,
    "action": "generate_response"
  }'
```

### Programmatic Usage

```typescript
import { analyzeLead, enrichLead, generateResponse } from '@/lib/llm/lead-intelligence';

// Analyze a lead
const analysis = await analyzeLead({
  name: "John Smith",
  location: "Atlanta, GA",
  request: "Need 10kW solar system for my home",
  message: "Looking to reduce my $300/month electric bill",
  phone: "404-555-1234"
});

console.log(`Score: ${analysis.score}`);
console.log(`Priority: ${analysis.priority}`);
console.log(`Intent: ${analysis.intent}`);
console.log(`Action: ${analysis.actionRequired}`);

// Enrich lead data
const enriched = await enrichLead(lead);
console.log(`System Size: ${enriched.systemSize}`);
console.log(`Timeline: ${enriched.timeline}`);

// Generate response
const response = await generateResponse(lead);
console.log(`Response: ${response}`);
```

## What Gets Analyzed

### Lead Scoring (0-100)

The LLM analyzes:
- Contact info completeness (phone, email)
- Request specificity
- Budget indicators
- Timeline urgency
- Decision-making authority
- Property ownership

**Example:**
```
Input: "Need 8kW solar for my house, budget $20k, want install ASAP"
Output: Score: 92, Priority: urgent
Reasoning: High intent, clear budget, urgent timeline, specific requirements
```

### Intent Analysis

Extracts what the lead actually wants:
- System size (e.g., "10kW residential installation")
- Timeline (e.g., "Install within 2 months")
- Budget range (e.g., "$15,000-$25,000")
- Specific concerns (e.g., "Worried about roof condition")

### Lead Enrichment

Extracts structured data:
```typescript
{
  systemSize: "8kW",
  roofType: "asphalt shingle",
  currentUtilityBill: 300,
  timeline: "2 months",
  homeOwnership: "owner",
  propertyType: "residential",
  decisionMaker: true
}
```

### Sentiment & Urgency

- **Hot** - Ready to buy, urgent timeline
- **Warm** - Interested, researching options
- **Cold** - Just browsing, no timeline

## Cost Savings

### Before (External APIs)
```
OpenAI GPT-4:
- $0.03 per 1K prompt tokens
- $0.06 per 1K completion tokens
- ~$0.10 per lead analysis
- 1000 leads/month = $100/month
```

### After (Local LLM)
```
Your Local LLM:
- $0 per request
- Unlimited usage
- 1000 leads/month = $0
- ∞ leads/month = $0
```

**Annual Savings:** $1,200+ per year!

## Performance Tips

### 1. Adjust Token Limits

For faster responses:
```bash
LLM_MAX_TOKENS="500"  # Faster, shorter responses
```

For more detailed analysis:
```bash
LLM_MAX_TOKENS="2000"  # Slower, more detailed
```

### 2. Adjust Temperature

For consistent scoring (recommended):
```bash
LLM_TEMPERATURE="0.3"  # More deterministic
```

For creative responses:
```bash
LLM_TEMPERATURE="0.9"  # More varied
```

### 3. Batch Processing

The worker automatically processes leads in batches of 10 to avoid overwhelming your LLM server.

To adjust batch size, edit `src/workers/scraper-worker.ts:285`:
```typescript
const leadsToProcess = leadsData.slice(0, 20); // Process 20 instead of 10
```

### 4. Disable for Testing

To disable LLM during development:
```bash
LLM_ENABLED="false"
```

Leads will still be scraped, but won't be analyzed.

## Monitoring

### Check LLM Usage

The LLM service tracks usage metrics:

```typescript
import { getLLM } from '@/lib/llm/llm-service';

const llm = getLLM();

// Get metrics
const metrics = llm.getUsageMetrics();
console.log(`Total requests: ${metrics.length}`);
console.log(`Total tokens: ${llm.getTotalTokens()}`);
console.log(`Total cost: $${llm.getTotalCost()}`); // Always $0 for local!
```

### Monitor Worker Logs

Watch for LLM analysis in worker logs:
```
[Worker worker-abc123] Processing job #42 for Georgia
[Building Permits] [INFO] Found 15 permit leads
[LLM] [INFO] Analyzing 15 leads with AI...
[LLM] [INFO] AI analysis complete: 15 analyzed, 12 enriched
```

## Troubleshooting

### LLM Connection Failed

**Error:** `LLM request failed: connect ECONNREFUSED`

**Solutions:**
1. Check `LLM_BASE_URL` is correct
2. Ensure your LLM server is running
3. Test URL in browser: `https://your-llm-server.vercel.app/v1/chat/completions`
4. Check firewall settings

### Invalid API Key

**Error:** `401 Unauthorized`

**Solutions:**
1. Regenerate API key in your LLM interface
2. Copy new key to `.env.local`
3. Restart workers: `npm run workers:dev`

### Slow Responses

**Solutions:**
1. Reduce `LLM_MAX_TOKENS` (e.g., 500 instead of 1000)
2. Reduce batch size in worker
3. Check your LLM server resources
4. Use a faster model if available

### JSON Parse Errors

**Error:** `Failed to extract structured data from LLM response`

**Solutions:**
1. Your LLM might not follow JSON format well
2. Lower `LLM_TEMPERATURE` to 0.2 for more consistent formatting
3. Add system prompt emphasis: "Return ONLY valid JSON, no markdown"
4. Try a different model that handles structured output better

### No Analysis Happening

**Checklist:**
- [ ] `LLM_ENABLED="true"` in `.env.local`
- [ ] Workers restarted after env changes
- [ ] LLM server is accessible
- [ ] API key is valid
- [ ] Check worker logs for LLM messages

## Advanced Usage

### Using Different Models

If your LLM server supports multiple models:

```bash
# Use faster model for enrichment
LLM_MODEL="llama-3-8b"  # Fast, good for data extraction

# Use larger model for analysis
LLM_MODEL="llama-3-70b"  # Slower, better reasoning
```

### Custom Prompts

Edit prompts in `src/lib/llm/lead-intelligence.ts`:

```typescript
const prompt = `Your custom prompt here...`;
```

### Switch to External LLM

To use OpenAI instead:

```bash
LLM_PROVIDER="openai"
LLM_BASE_URL="https://api.openai.com/v1"
LLM_API_KEY="sk-your-openai-key"
LLM_MODEL="gpt-4"
```

Cost will be calculated automatically.

## API Reference

See `src/lib/llm/lead-intelligence.ts` for full API documentation.

**Main functions:**
- `analyzeLead(lead)` - Score and analyze lead
- `enrichLead(lead)` - Extract structured data
- `generateResponse(lead, context?)` - Generate response
- `classifySource(source, samples)` - Rate source quality
- `batchAnalyzeLeads(leads, max)` - Analyze multiple leads

## Support

For issues:
1. Check this documentation
2. Verify `.env.local` configuration
3. Test LLM connection with test script
4. Check worker logs for errors
5. Ensure LLM server is running

## Next Steps

1. ✅ Set up `.env.local` with your LLM details
2. ✅ Test connection with test script
3. ✅ Restart workers
4. ✅ Create a scraping job
5. ✅ Watch leads get automatically analyzed!

Your local LLM is now powering intelligent lead generation - for free! 🎉
