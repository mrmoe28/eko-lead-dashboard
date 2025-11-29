#!/bin/bash

# EKO Lead Generator - Cron Job Setup
# Automates scraping every X hours

SCRIPT_DIR="$HOME/Desktop/ekoleadgenerator"
CRON_FILE="$HOME/.eko-cron-jobs"

echo "🕐 EKO LEAD GENERATOR - CRON AUTOMATION SETUP"
echo "================================================"
echo ""

# Function to add cron job
add_cron_job() {
    local schedule="$1"
    local description="$2"
    local command="$3"
    
    echo "⏰ Adding $description..."
    echo "   Schedule: $schedule"
    echo "   Command: $command"
    echo ""
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$schedule $command") | crontab -
}

echo "Choose automation schedule:"
echo ""
echo "1) Every 2 hours (High frequency)"
echo "2) Every 4 hours (Recommended)"
echo "3) Every 6 hours (Medium)"
echo "4) Twice daily (Morning & Evening)"
echo "5) Daily (Once per day)"
echo "6) Custom schedule"
echo ""

read -p "Enter choice (1-6): " -r choice

case $choice in
    1)
        SCHEDULE="0 */2 * * *"
        DESC="Every 2 hours"
        ;;
    2)
        SCHEDULE="0 */4 * * *"
        DESC="Every 4 hours"
        ;;
    3)
        SCHEDULE="0 */6 * * *"
        DESC="Every 6 hours"
        ;;
    4)
        SCHEDULE="0 8,18 * * *"
        DESC="Twice daily (8AM & 6PM)"
        ;;
    5)
        SCHEDULE="0 9 * * *"
        DESC="Daily at 9AM"
        ;;
    6)
        echo ""
        read -p "Enter cron schedule (e.g., '0 */4 * * *' for every 4 hours): " -r SCHEDULE
        read -p "Enter description: " -r DESC
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🔧 Setting up automation..."
echo ""

# Main automation command
AUTOMATION_CMD="cd $SCRIPT_DIR && ./fully-automated-workflow.sh >> /tmp/eko-automation.log 2>&1"

# Add cron job
add_cron_job "$SCHEDULE" "$DESC" "$AUTOMATION_CMD"

# Add log rotation (weekly)
add_cron_job "0 0 * * 0" "Log rotation" "rm -f /tmp/eko-automation.log.* && mv /tmp/eko-automation.log /tmp/eko-automation.log.\$(date +\%Y\%m\%d) 2>/dev/null || true"

echo ""
echo "✅ Cron automation setup complete!"
echo ""
echo "📊 Current cron jobs:"
crontab -l | grep -E "(eko-automation|fully-automated-workflow)" || echo "   No jobs found"
echo ""
echo "📁 Automation logs: /tmp/eko-automation.log"
echo ""
echo "🛑 To stop automation:"
echo "   crontab -e  # Then remove the EKO lines"
echo ""
echo "🔍 To test automation:"
echo "   cd $SCRIPT_DIR && ./fully-automated-workflow.sh"
echo ""

read -p "Run a test automation now? (y/N): " -r run_now

if [[ $run_now =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Running test automation..."
    cd "$SCRIPT_DIR"
    ./fully-automated-workflow.sh
fi

echo ""
echo "🎉 Setup complete! Your lead generation is now automated."
echo ""