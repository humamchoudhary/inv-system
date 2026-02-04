#!/bin/bash
set -e

echo "📦 Checking for updates..."
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "🔄 Changes detected! Pulling latest code..."
  git pull origin main
  
  echo "🔨 Rebuilding Docker image..."
  docker compose down
  docker compose build
  docker compose up -d
  
  echo "✨ Rebuild complete!"
else
  echo "✅ Already up to date. Starting containers..."
  docker compose up -d
fi

echo "🚀 Application running on port 6003"
