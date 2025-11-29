#!/bin/bash

# Update Vercel Environment Variable with Tunnel URL
# Run this after starting the ngrok tunnel

echo "🔧 Update Vercel LLM Tunnel URL"
echo "==============================="
echo ""

# Get the tunnel URL from user
read -p "Enter your ngrok URL (e.g., https://abc123.ngrok.io): " TUNNEL_URL

# Remove trailing slash if present
TUNNEL_URL="${TUNNEL_URL%/}"

# Add /v1 to match LM Studio API format
FULL_URL="${TUNNEL_URL}/v1"

echo ""
echo "Setting LM_STUDIO_API_URL to: $FULL_URL"
echo ""

# Navigate to the llm-chat-app directory
if [ -d "/tmp/llm-chat-app" ]; then
    cd /tmp/llm-chat-app
else
    echo "❌ llm-chat-app directory not found at /tmp/llm-chat-app"
    echo "Please provide the correct path to your llm-chat-app project"
    read -p "Path: " PROJECT_PATH
    cd "$PROJECT_PATH"
fi

# Set the environment variable in Vercel
echo "Updating Vercel environment variable..."
vercel env rm LM_STUDIO_API_URL production -y 2>/dev/null || true
vercel env add LM_STUDIO_API_URL production <<EOF
$FULL_URL
EOF

echo ""
echo "✅ Environment variable updated!"
echo ""
echo "Now triggering a new deployment to apply changes..."
vercel --prod

echo ""
echo "🎉 Done! Your Vercel app should now be able to reach your LM Studio"
echo ""
echo "Test with:"
echo "  curl -X POST https://llm-chat-app-six.vercel.app/v1/chat/completions \\"
echo "    -H \"Authorization: Bearer sk-proj-IvGhdag1bng19tRvzJnL_spOHl5CXC9k9l08O5eK4ik\" \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"model\":\"qwen/qwen3-vl-4b\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'"
