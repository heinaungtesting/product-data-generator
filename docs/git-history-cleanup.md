# Git History Cleanup Guide

## What happened?
The MCP helper that auto-commits bundle updates ran inside the repository
without a restrictive `.gitignore`. When it staged everything with `git add -A`
it also picked up `node_modules/`, producing a massive commit (`fe5a561`) that
ballooned the history and slowed down clones.

## What did we fix?
- Updated `.gitignore` so any directory named `node_modules/` is ignored,
  including nested ones created by MCP integrations.
- Replaced the auto-commit helper (`mcp-server-local/index.js`) with a guarded
  version that refuses to commit when disallowed paths (like `node_modules`) are
  present.
- Added `cleanup-git-history.sh`, a script that removes the accidental
  node_modules commit(s) with `git filter-repo`.
- Removed the tracked `node_modules/` directories and recommitted a clean tree.

## How to clean the existing history
1. Ensure `git-filter-repo` is installed (e.g., `pip install git-filter-repo`).
2. Make a backup clone (history rewriting is destructive).
3. Run:
   ```bash
   ./cleanup-git-history.sh
   git push --force-with-lease origin <branch>
   ```
   Repeat the force push for every branch that still contains the bloated
   commit.

## Prevention tips
- Never commit `node_modules/` (the updated `.gitignore` enforces this).
- Run MCP tasks from a clean working tree so their commits remain minimal.
- Keep the new guard in `mcp-server-local/index.js`; it blocks risky commits.
- Consider periodic backups or protected branches before running cleanup
  scripts.
