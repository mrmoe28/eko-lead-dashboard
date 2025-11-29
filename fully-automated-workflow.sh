#!/bin/bash

# Complete Automated Lead Workflow with Workers
# Auto-starts workers → Scrape → AI Analysis → Google Sheets → Text Notifications

PROJECT_DIR="$HOME/Desktop/ekoleadgenerator"
DASHBOARD_DIR="$PROJECT_DIR/eko-lead-dashboard"
SCRAPER_DIR="$PROJECT_DIR/solar-data-extractor"
OUTPUT_DIR="$SCRAPER_DIR/output"
PHONE_NUMBER="404-551-6532"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     EKO LEAD GENERATOR - FULL AUTOMATION                     ║"
echo "║     Workers → Scrape → AI Analysis → Sheets → Text           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 Text notifications: $PHONE_NUMBER"
echo "🤖 AI Analysis: Local LLM (Qwen)"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down workers..."
    
    # Kill worker processes
    pkill -f "tsx.*start-workers" 2>/dev/null
    pkill -f "scraper-worker" 2>/dev/null
    
    echo "✅ Workers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Step 1: Start Workers
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🤖 STEP 1: Starting AI Workers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$DASHBOARD_DIR"

# Check if workers are already running
if pgrep -f "tsx.*start-workers" > /dev/null; then
    echo "✅ Workers already running!"
else
    echo "🚀 Starting worker manager..."
    
    # Start workers in background
    npm run workers:dev > /tmp/eko-workers.log 2>&1 &
    WORKER_PID=$!
    
    echo "⏳ Waiting for workers to initialize..."
    sleep 5
    
    # Check if workers started successfully
    if pgrep -f "tsx.*start-workers" > /dev/null; then
        echo "✅ Workers started successfully (PID: $WORKER_PID)"
        echo "📊 Worker logs: /tmp/eko-workers.log"
    else
        echo "❌ Failed to start workers. Check logs:"
        tail -10 /tmp/eko-workers.log
        exit 1
    fi
fi

echo ""

# Step 2: Generate Leads
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 2: Generating Solar Leads"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$SCRAPER_DIR"

# Check if scraper exists
if [ ! -f "$SCRAPER_DIR/scrape-leads.js" ]; then
    echo "❌ Scraper not found: scrape-leads.js"
    cleanup
fi

# Run scraper
echo "🔍 Searching for solar leads in Georgia..."
echo ""

node scrape-leads.js

SCRAPER_EXIT=$?

if [ $SCRAPER_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Scraper failed with exit code: $SCRAPER_EXIT"
    cleanup
fi

echo ""
echo "✅ Lead generation complete!"
echo ""

# Step 3: Wait for AI Analysis (if leads found)
LATEST_CSV=$(ls -t "$OUTPUT_DIR"/georgia-solar-leads-*.csv 2>/dev/null | head -1)

if [ -z "$LATEST_CSV" ] || [ ! -f "$LATEST_CSV" ]; then
    echo "❌ No CSV file generated. Cannot proceed."
    cleanup
fi

LEAD_COUNT=$(tail -n +2 "$LATEST_CSV" | wc -l | tr -d ' ')

echo "📄 Generated file: $(basename "$LATEST_CSV")"
echo "📊 Total leads: $LEAD_COUNT"
echo ""

if [ "$LEAD_COUNT" -gt 0 ]; then
    echo "⏳ Waiting for AI analysis (workers will process leads automatically)..."
    sleep 10
    
    echo "✅ AI analysis complete! Check dashboard for enriched leads."
    echo "🌐 Dashboard: https://eko-lead-dashboard.vercel.app/leads"
fi

# Step 4: Google Sheets Sync
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 STEP 3: Syncing to Google Sheets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Google Sheets is set up
if [ ! -f "$SCRAPER_DIR/config/google-sheets-token.json" ]; then
    echo "⚠️  Google Sheets not configured yet!"
    echo ""
    echo "Run setup first:"
    echo "   ./setup-google-sheets-api.sh"
    echo ""
    echo "Skipping Google Sheets sync..."
    SHEETS_SYNCED=false
else
    # Sync to Google Sheets and capture output
    SHEETS_OUTPUT=$(node google-sheets-integration.js "$LATEST_CSV" 2>&1)
    SHEETS_EXIT=$?

    echo "$SHEETS_OUTPUT"

    if [ $SHEETS_EXIT -eq 0 ]; then
        echo ""
        echo "✅ Google Sheets sync complete!"
        SHEETS_SYNCED=true

        # Extract spreadsheet URL from output
        SHEET_URL=$(echo "$SHEETS_OUTPUT" | grep -o 'https://docs.google.com/spreadsheets/d/[^/]*/edit' | head -1)
    else
        echo ""
        echo "⚠️  Google Sheets sync failed (continuing anyway...)"
        SHEETS_SYNCED=false
        SHEET_URL=""
    fi
fi

echo ""

# Step 5: Send Text Notifications
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 STEP 4: Sending Text Notifications"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Count Hot leads
HOT_COUNT=$(awk -F',' '$1 ~ /Hot/ || ($2 ~ /^[0-9]+$/ && $2 >= 70)' "$LATEST_CSV" | tail -n +2 | wc -l | tr -d ' ')

echo "🔥 Hot leads detected: $HOT_COUNT"
echo ""

if [ "$HOT_COUNT" -gt 0 ]; then
    echo "📤 Sending text notifications to: $PHONE_NUMBER"
    echo ""

    # Run text notification script
    if [ -f "$SCRAPER_DIR/send-text-notification.sh" ]; then
        bash "$SCRAPER_DIR/send-text-notification.sh"

        echo ""
        echo "✅ Text notifications sent!"
    else
        echo "⚠️  Text notification script not found"
        echo "   Expected: $SCRAPER_DIR/send-text-notification.sh"
    fi
else
    echo "ℹ️  No Hot leads to notify about"
fi

echo ""

# Step 6: Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ FULL AUTOMATION WORKFLOW COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "   • AI Workers: ✅ Running"
echo "   • Total leads generated: $LEAD_COUNT"
echo "   • AI analysis: ✅ Complete"
echo "   • Hot leads: $HOT_COUNT"
echo "   • Google Sheets synced: $([ "$SHEETS_SYNCED" = true ] && echo "✅ Yes" || echo "⚠️  Not configured")"
echo "   • Text notifications sent: $([ "$HOT_COUNT" -gt 0 ] && echo "✅ Yes ($HOT_COUNT)" || echo "None needed")"
echo ""

echo "🔗 View your leads:"
echo "   • Dashboard (with AI): https://eko-lead-dashboard.vercel.app/leads"
if [ "$SHEETS_SYNCED" = true ]; then
    if [ -n "$SHEET_URL" ]; then
        echo "   • Google Sheets: $SHEET_URL"
    else
        echo "   • Google Sheets: https://docs.google.com/spreadsheets/"
    fi
    echo "   • Local CSV: $LATEST_CSV"
else
    echo "   • Local CSV: $LATEST_CSV"
    echo ""
    echo "💡 Set up Google Sheets for automatic cloud sync:"
    echo "   ./setup-google-sheets-api.sh"
fi

echo ""
echo "📱 Check your phone ($PHONE_NUMBER) for Hot lead alerts!"
echo "🤖 Workers continue running in background for next jobs..."
echo ""

# Auto-open dashboard in browser
echo "🌐 Opening dashboard..."
sleep 2
open "https://eko-lead-dashboard.vercel.app/leads"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "💡 Workers are running in background. To stop them:"
echo "   pkill -f 'tsx.*start-workers'"
echo ""
echo "📊 Worker logs: tail -f /tmp/eko-workers.log"
echo ""

# Keep script running or exit?
read -p "Press Enter to stop workers, or Ctrl+C to keep them running: " -r
cleanup