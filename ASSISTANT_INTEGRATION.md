# AI Assistant Integration Guide

## Overview

The EKO Lead Dashboard now includes a dedicated AI Assistant page that provides real-time access to your scraper data and can perform tasks on your behalf.

## Features

✅ **Real-time System Access** - The assistant has access to:
- Lead statistics and analytics
- Scraping session status
- Recent activity
- Lead search and analysis

✅ **Action Capabilities** - The assistant can:
- Start new scraping jobs
- Analyze leads with AI
- Search for specific leads
- Get comprehensive analytics
- Monitor system performance

✅ **Context-Aware** - The assistant understands:
- Current lead counts and scores
- Active scraping sessions
- Recent activity
- System performance metrics

## Access

Navigate to **Assistant** in the sidebar to access the AI Assistant page.

## Usage Examples

### Get Statistics
- "Show me lead stats"
- "How many leads do I have?"
- "What's my average lead score?"

### Start Scraping
- "Start scraping for Atlanta, GA"
- "Scrape Miami, FL"
- "Begin scraping in New York"

### Analyze Leads
- "Analyze lead #42"
- "Analyze lead ID 15"
- "What's the score for lead 10?"

### Search Leads
- "Search for leads in Atlanta"
- "Find leads about solar"
- "Show me urgent leads"

### Get Analytics
- "Show me analytics"
- "What's my performance?"
- "Which sources are performing best?"

### Recent Activity
- "What's been happening recently?"
- "Show me recent activity"
- "What leads came in today?"

## Technical Details

### API Endpoint
- **Route**: `/api/assistant`
- **Method**: POST
- **Functions Available**:
  - `get_lead_stats` - Get lead statistics
  - `get_scraping_sessions` - Get scraping session info
  - `start_scraping` - Start a new scraping job
  - `search_leads` - Search for leads
  - `analyze_lead` - Analyze a lead with AI
  - `get_analytics` - Get comprehensive analytics
  - `get_recent_activity` - Get recent system activity

### LLM Integration

The assistant uses your configured LLM (from `.env.local`):
- `LLM_BASE_URL` - Your LLM server URL
- `LLM_API_KEY` - Your API key
- `LLM_MODEL` - Model name

If your LLM chat app is on Vercel, set:
- `LLM_CHAT_URL` - Your Vercel LLM app URL (optional fallback)

### Function Execution

The assistant automatically detects when you want to perform an action and executes the appropriate function. For example:
- "Start scraping for Atlanta" → Executes `start_scraping` function
- "Analyze lead #42" → Executes `analyze_lead` function
- "Show me stats" → Executes `get_lead_stats` function

## Configuration

No additional configuration needed! The assistant uses your existing LLM configuration from `.env.local`.

If you want to use a separate Vercel LLM chat app, add to `.env.local`:

```bash
LLM_CHAT_URL=https://your-llm-chat-app.vercel.app
LLM_CHAT_API_KEY=your-api-key-if-needed
```

## Architecture

```
User Message → Assistant API → Function Detection → Execute Function → Format Response → Display
```

The assistant:
1. Receives your message
2. Detects if you want to perform an action
3. Executes the appropriate system function
4. Formats the result in a user-friendly way
5. Displays the response

## Security

- All database queries use parameterized queries
- Function execution is limited to predefined safe operations
- No arbitrary code execution
- All actions are logged

## Troubleshooting

### Assistant not responding
1. Check your LLM configuration in `.env.local`
2. Verify `LLM_BASE_URL` is correct
3. Test LLM connection with: `npm run test-llm` (if available)

### Functions not working
1. Check database connection
2. Verify you have leads/scraping sessions in the database
3. Check browser console for errors

### Slow responses
1. Check your LLM server performance
2. Reduce `LLM_MAX_TOKENS` in `.env.local`
3. Check database query performance

## Next Steps

1. ✅ Navigate to `/assistant` page
2. ✅ Try asking: "Show me lead stats"
3. ✅ Try: "Start scraping for [your location]"
4. ✅ Explore all available functions

Your AI assistant is ready to help you manage your lead generation system! 🚀

