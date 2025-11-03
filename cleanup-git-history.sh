#!/usr/bin/env bash

# Cleanup script for removing accidentally committed node_modules directories
# from the git history. Designed to be run from the repository root.

set -euo pipefail

if ! command -v git &>/dev/null; then
  echo "Error: git is not installed or not in PATH." >&2
  exit 1
fi

if ! command -v git-filter-repo &>/dev/null; then
  cat <<'EOF' >&2
Error: git-filter-repo is required but not installed.
Install it first, for example:
  pip install --user git-filter-repo
Then re-run this script.
EOF
  exit 1
fi

read -r -p "This will rewrite history. Have you created a backup/clone? (yes/no) " answer
if [[ "${answer}" != "yes" ]]; then
  echo "Aborting. Please backup the repository before proceeding."
  exit 1
fi

git filter-repo --path node_modules --invert-paths \
  --path mcp-server/node_modules --invert-paths \
  --path mcp-server-local/node_modules --invert-paths

echo "History cleaned. Force-push your branches to update remotes:"
echo "  git push --force-with-lease origin <branch>"
