#!/bin/bash

# sync-bundle.sh - Sync bundle from MCP server to MyApp
# Run this after adding/updating products via MCP

set -e  # Exit on error

echo "🔄 Syncing bundle from MCP to MyApp..."
echo ""

# Step 1: Build bundle from database
echo "📦 Step 1: Building bundle from database..."
cd mcp-server
node build-bundle-direct.js
cd ..
echo "✅ Bundle built: dist/bundle.json.gz"
echo ""

# Step 2: Copy bundle to MyApp
echo "📋 Step 2: Copying bundle to MyApp..."
cp dist/bundle.json.gz myapp/public/bundle.json.gz
echo "✅ Bundle copied to myapp/public/bundle.json.gz"
echo ""

# Step 3: Show bundle contents
echo "📊 Step 3: Bundle contents:"
gunzip -c myapp/public/bundle.json.gz | jq -r '.products[] | .texts[] | select(.language == "ja") | "  - " + .name' | head -10
echo ""

# Step 4: Check if changes should be committed
echo "💾 Step 4: Git status:"
git status --short myapp/public/bundle.json.gz dist/bundle.json.gz prisma/dev.db
echo ""

# Step 5: Prompt for commit
read -p "Commit and push changes? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    # Commit changes
    git add myapp/public/bundle.json.gz dist/bundle.json.gz dist/etag.txt prisma/dev.db data/meta.json

    PRODUCT_COUNT=$(gunzip -c myapp/public/bundle.json.gz | jq -r '.productCount')

    git commit -m "chore: Update bundle with latest products

- Product count: $PRODUCT_COUNT
- Updated: $(date -Iseconds)
- Source: Local MCP database
- Ready for Vercel deployment"

    echo ""
    echo "✅ Changes committed!"
    echo ""

    # Prompt for push
    read -p "Push to GitHub? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        BRANCH=$(git branch --show-current)
        git push -u origin "$BRANCH"
        echo ""
        echo "✅ Pushed to GitHub!"
        echo ""
        echo "🚀 Next steps:"
        echo "   1. Vercel will auto-deploy (if connected)"
        echo "   2. Or manually deploy: cd myapp && vercel --prod"
        echo "   3. Then sync in MyApp to see new products"
    else
        echo "⏭️  Skipped push. Run manually: git push"
    fi
else
    echo "⏭️  Skipped commit. Changes are staged locally."
    echo ""
    echo "To commit manually:"
    echo "  git add myapp/public/bundle.json.gz dist/bundle.json.gz prisma/dev.db"
    echo "  git commit -m 'chore: Update bundle with latest products'"
    echo "  git push"
fi

echo ""
echo "✨ Done! Bundle synced from MCP database to MyApp."
