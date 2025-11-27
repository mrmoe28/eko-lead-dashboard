# YouTube Lead Reply System

## Overview
Complete system for reviewing YouTube leads and posting AI-generated replies directly to YouTube comments.

## Features
- Automatically loads Hot/Warm YouTube leads from scraper CSV
- AI-powered reply generation using Gemini 2.0 Flash
- Direct posting to YouTube via OAuth
- Track contacted leads in database
- Edit replies before posting
- Skip or regenerate replies as needed

## Setup Complete

### 1. Database Schema
Added to `/src/lib/db/schema.ts`:
- `youtubeReplyText` - Stores generated reply
- `youtubeReplyStatus` - Tracks status (pending/approved/posted/skipped)
- `youtubePostedAt` - Timestamp of posting
- `youtubeCommentId` - Comment ID for tracking
- `contactedLeads` table - Records all YouTube contacts

### 2. Environment Variables
Added to `.env.local`:
```
GEMINI_API_KEY=AIzaSyAHtd6twlkIYBRg5i8FYl3r8PmdS5R8bMw
YOUTUBE_API_KEY=AIzaSyDmwxM6pJr18phjCLJos8sWzgHZuOu-XoE
SCRAPER_OUTPUT_PATH=/Users/ekodevapps/Desktop/ekoleadgenerator/solar-data-extractor/output
```

### 3. OAuth Credentials
Copied from scraper:
- `youtube-oauth.json` - OAuth client credentials
- `youtube-token.json` - Access/refresh tokens

### 4. API Routes

**GET `/api/leads/youtube`**
- Loads YouTube leads from latest CSV
- Filters for Hot/Warm priorities
- Returns formatted lead data

**POST `/api/leads/youtube/generate`**
- Generates AI reply using Gemini 2.0 Flash
- Personalized to lead's specific issue
- Includes contact info naturally
- Max 150 words

**POST `/api/leads/youtube/post`**
- Posts reply to YouTube comment
- Saves to contacted_leads table
- Returns YouTube URL

### 5. UI Page

**Location:** `/leads/youtube`

**Features:**
- Shows all Hot/Warm YouTube leads
- One-click AI reply generation
- Editable reply textarea
- Approve & Post button
- Skip and Regenerate options
- Real-time status updates
- Success confirmation with YouTube link

**Navigation:** Added "YouTube Replies" to sidebar with YouTube icon

## Usage

1. Start the dashboard: `npm run dev`
2. Navigate to "YouTube Replies" in sidebar
3. Click "Generate AI Reply" for a lead
4. Review and edit the reply if needed
5. Click "Approve & Post to YouTube"
6. View your reply on YouTube!

## Contact Info Template
All replies include:
- Name: Moe
- Company: EKO SOLAR
- Phone: 404-551-6532
- Email: ekosolarize@gmail.com
- Website: www.ekosolarpros.com

## Files Created

### API Routes
- `/src/app/api/leads/youtube/route.ts` - Fetch leads
- `/src/app/api/leads/youtube/generate/route.ts` - AI generation
- `/src/app/api/leads/youtube/post/route.ts` - Post to YouTube

### UI
- `/src/app/leads/youtube/page.tsx` - Main page component

### Database
- `/src/lib/db/schema.ts` - Updated schema
- Migration: `drizzle/0001_white_angel.sql`

### Config
- Updated `/src/components/sidebar-layout.tsx` - Added navigation link

## Testing

```bash
# Test fetching leads
curl http://localhost:3000/api/leads/youtube

# Test AI generation
curl -X POST http://localhost:3000/api/leads/youtube/generate \
  -H "Content-Type: application/json" \
  -d '{"leadMessage":"Need help with solar", "leadName":"John"}'
```

## Notes

- Uses Gemini 2.0 Flash (latest model)
- Reads from latest `georgia-solar-leads-*.csv`
- Automatically filters YouTube source
- Only shows Hot/Warm priority leads
- Tracks posted leads to prevent duplicates
- OAuth credentials persist between sessions

## Next Steps

You can now:
1. Review and post YouTube replies
2. Track which leads have been contacted
3. Monitor conversion rates
4. Generate professional, helpful responses at scale
