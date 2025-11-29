#!/bin/bash

# LLM Studio Tunnel Setup Script
# This script helps expose your local LM Studio to the internet so Vercel can reach it

echo "🔧 LLM Studio Tunnel Setup"
echo "=========================="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo ""
    echo "Install options:"
    echo "  1. Homebrew: brew install ngrok/ngrok/ngrok"
    echo "  2. Download: https://ngrok.com/download"
    echo ""
    read -p "Press Enter after installing ngrok..."
fi

# Check if authenticated
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok is not authenticated"
    echo ""
    echo "Steps:"
    echo "  1. Sign up at https://dashboard.ngrok.com/signup"
    echo "  2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "  3. Run: ngrok config add-authtoken YOUR_TOKEN_HERE"
    echo ""
    read -p "Press Enter after authenticating..."
fi

echo ""
echo "🚀 Starting tunnel to LM Studio (http://192.168.1.197:1234)..."
echo ""
echo "This will:"
echo "  1. Create a public URL for your LM Studio"
echo "  2. Show you the URL to copy"
echo "  3. You'll need to add this URL to your Vercel env vars"
echo ""
echo "Leave this terminal window open to keep the tunnel running!"
echo ""

# Start the tunnel
ngrok http 192.168.1.197:1234 --log=stdout
