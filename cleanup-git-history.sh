#!/bin/bash

# Git History Cleanup Script
# Removes node_modules from git history if accidentally committed

set -e

echo "🧹 Git History Cleanup Script"
echo "=============================="
echo ""
echo "⚠️  WARNING: This script will rewrite git history!"
echo "This is necessary to remove large node_modules from the repository."
echo ""
echo "Before proceeding:"
echo "1. Ensure you have a backup of your work"
echo "2. Coordinate with team members (if any)"
echo "3. Understand this will force-push to remote"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Check if node_modules is in history..."

if git log --all --full-history -- "**/node_modules/**" | grep -q "commit"; then
    echo "✓ Found node_modules in git history"

    echo ""
    echo "Step 2: Removing node_modules from history..."
    echo "This may take a few minutes..."

    # Use git filter-repo if available (recommended)
    if command -v git-filter-repo &> /dev/null; then
        echo "Using git-filter-repo (recommended method)..."
        git filter-repo --path node_modules --invert-paths --force
    else
        echo "git-filter-repo not found, using git filter-branch..."
        echo "For better performance, install git-filter-repo:"
        echo "  pip install git-filter-repo"
        echo ""

        # Fallback to filter-branch
        git filter-branch --force --index-filter \
            'git rm -r --cached --ignore-unmatch "**/node_modules" || true' \
            --prune-empty --tag-name-filter cat -- --all

        # Clean up
        rm -rf .git/refs/original/
        git reflog expire --expire=now --all
        git gc --prune=now --aggressive
    fi

    echo "✓ node_modules removed from history"

    echo ""
    echo "Step 3: Update remote repository..."
    echo "⚠️  This will FORCE PUSH to remote!"
    read -p "Force push to remote? (yes/no): " push_confirm

    if [ "$push_confirm" == "yes" ]; then
        # Get current branch
        CURRENT_BRANCH=$(git branch --show-current)

        git push origin --force --all
        git push origin --force --tags

        echo "✓ Remote repository updated"
        echo ""
        echo "✅ Cleanup complete!"
        echo ""
        echo "Next steps for team members:"
        echo "1. Delete their local repository"
        echo "2. Fresh clone: git clone <repo-url>"
        echo "3. Or rebase local changes onto new history"
    else
        echo "Skipped push. You can manually push with:"
        echo "  git push origin --force --all"
    fi
else
    echo "✓ No node_modules found in git history"
    echo "Your repository is clean!"
fi

echo ""
echo "Step 4: Verify cleanup..."
REPO_SIZE=$(du -sh .git | cut -f1)
echo "Repository size: $REPO_SIZE"

echo ""
echo "Step 5: Check current status..."
git status

echo ""
echo "=============================="
echo "Cleanup script complete!"
echo ""
echo "Tips to prevent this in the future:"
echo "1. Ensure .gitignore has 'node_modules' (without leading /)"
echo "2. Run 'git status' before committing to verify files"
echo "3. The MCP server has been updated with safety checks"
echo "4. Use 'git diff --cached' to see what will be committed"
