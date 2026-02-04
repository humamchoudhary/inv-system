#!/bin/bash
set -e

echo "📦 Pulling latest code..."
git fetch origin

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u})

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "🔄 Changes detected. Pulling & rebuilding..."
  git pull
  docker compose build
else
  echo "✅ No changes detected. Skipping build."
fi

echo "🚀 Starting containers..."
docker compose up -d

