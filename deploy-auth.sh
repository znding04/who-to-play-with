#!/bin/bash
# Deploy script for 找谁玩 auth setup
# Run: bash deploy-auth.sh

set -e

echo "=== Step 1: Check wrangler auth ==="
npx wrangler whoami || { echo "❌ Run 'npx wrangler login' first"; exit 1; }

echo ""
echo "=== Step 2: Create D1 database ==="
DB_OUTPUT=$(npx wrangler d1 create who-to-hang-with-db 2>&1) || {
  if echo "$DB_OUTPUT" | grep -q "already exists"; then
    echo "Database already exists, continuing..."
    DB_OUTPUT=$(npx wrangler d1 list 2>&1)
  else
    echo "$DB_OUTPUT"
    echo "❌ Failed to create database"
    exit 1
  fi
}
echo "$DB_OUTPUT"

# Extract database_id
DB_ID=$(echo "$DB_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
if [ -z "$DB_ID" ]; then
  echo "❌ Could not extract database_id. Please update wrangler.toml manually."
  exit 1
fi
echo "✅ Database ID: $DB_ID"

# Update wrangler.toml
sed -i '' "s/database_id = \".*\"/database_id = \"$DB_ID\"/" wrangler.toml
echo "✅ Updated wrangler.toml with database_id"

echo ""
echo "=== Step 3: Run migrations ==="
npx wrangler d1 execute who-to-hang-with-db --file=./schema.sql --remote
echo "✅ Migrations complete"

echo ""
echo "=== Step 4: Set secrets ==="
JWT=$(openssl rand -base64 32)
echo "$JWT" | npx wrangler secret put JWT_SECRET
echo "https://hangwith.ljding.app" | npx wrangler secret put APP_BASE_URL
echo "✅ Secrets set"

echo ""
echo "=== Step 5: Build frontend ==="
npm run build
echo "✅ Frontend built"

echo ""
echo "=== Step 6: Deploy ==="
npx wrangler deploy
echo "✅ Deployed!"

echo ""
echo "=== Done! ==="
echo "Visit: https://hangwith.ljding.app/#/login"
echo ""
echo "Next: Set up OAuth (optional for email/password auth):"
echo "  GitHub: https://github.com/settings/developers → New OAuth App"
echo "  Google: https://console.cloud.google.com/ → Credentials → OAuth 2.0"
echo "  Then: npx wrangler secret put GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET"
echo "  Then: npx wrangler secret put GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET"
