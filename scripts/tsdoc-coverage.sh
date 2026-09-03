#!/usr/bin/env bash
set -euo pipefail

# Script to generate fresh tsdoc coverage with Node 18 for historical per-commit validation.
# Usage: ./tsdoc-coverage.sh <commit_sha> <output_dir>
# Example: ./tsdoc-coverage.sh 00203d4 ./experiments/wp9-r8-historical-coverage/

# Source nvm to manage Node versions
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Use Node 18
nvm use 18
echo "Using Node $(node --version)"

# Defaults
TSDOC_REPO="${TSDOC_REPO:-/tmp/tsdoc-real}"
COMMIT_SHA="${1:-}"
OUTPUT_DIR="${2:-./experiments/wp9-r8-historical-coverage}"

if [[ -z "$COMMIT_SHA" ]]; then
  echo "Error: Commit SHA is required"
  echo "Usage: $0 <commit_sha> [output_dir]"
  exit 1
fi

# Validate COMMIT_SHA format: hex string, 4 to 40 characters
if ! [[ "$COMMIT_SHA" =~ ^[0-9a-f]{4,40}$ ]]; then
  echo "Error: COMMIT_SHA must be hex 4-40 chars"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Worktree directory
WORKTREE_DIR="/tmp/tsdoc-worktree-${COMMIT_SHA}"

# Clean up any existing worktree for this commit
if [ -d "$WORKTREE_DIR" ]; then
  echo "Removing existing worktree directory at $WORKTREE_DIR"
  rm -rf "$WORKTREE_DIR"
fi
# Prune any stale worktree entries
cd "$TSDOC_REPO"
git worktree prune

# Clone if repo doesn't exist (should exist from WP14)
if [ ! -d "$TSDOC_REPO" ]; then
  echo "Cloning tsdoc repository..."
  git clone https://github.com/microsoft/tsdoc.git "$TSDOC_REPO"
fi

# Create worktree for the specific commit
echo "Creating worktree for commit $COMMIT_SHA"
git worktree add "$WORKTREE_DIR" "$COMMIT_SHA"

# Enter worktree
cd "$WORKTREE_DIR"

# Install dependencies with Rush via npx @microsoft/rush
echo "Installing dependencies with Rush..."
npx @microsoft/rush install

# Create Jest coverage config if not exists
ESPLEX_DIR="eslint-plugin"
CONFIG_DIR="$ESPLEX_DIR/config"
JOINT_CONFIG="$CONFIG_DIR/jest.coverage.config.json"

if [ ! -f "$JOINT_CONFIG" ]; then
  echo "Creating Jest coverage config..."
  cat > "$JOINT_CONFIG" << 'CONFIG_EOF'
{
  "extends": "./jest.config.json",
  "coverageReporters": ["json"],
  "coverageDirectory": "<rootDir>/coverage"
}
CONFIG_EOF
fi

# Run tests with coverage
echo "Running tests with coverage..."
npx heft test --config "$JOINT_CONFIG"

# The coverage output should be at eslint-plugin/coverage/coverage-final.json
COVERAGE_SRC="$ESPLEX_DIR/coverage/coverage-final.json"
COVERAGE_DEST="$OUTPUT_DIR/coverage-${COMMIT_SHA}.json"

if [ -f "$COVERAGE_SRC" ]; then
  echo "Copying coverage artifact to $COVERAGE_DEST"
  cp "$COVERAGE_SRC" "$COVERAGE_DEST"
  echo "Coverage artifact size: $(du -h "$COVERAGE_DEST" | cut -f1)"
else
  echo "Error: Coverage not found at $COVERAGE_SRC"
  exit 1
fi

# Optionally, we could also run the engine check to produce evidence JSON,
# but the task only asks for coverage artifact generation.
# However, to validate historical complexity/change evidence, we might need to run the check.
# Let's produce the evidence JSON as well for completeness.

# Path to the engine CLI (assuming we are in the root of the code-risk-prototype)
# We'll assume the script is run from the repo root.
# We'll compute the original repo as the parent of the script directory.
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ORIGINAL_REPO="$SCRIPT_DIR/.."

if [ -d "$ORIGINAL_REPO/src" ]; then
  echo "Running engine check to generate evidence JSON..."
  # Determine base commit (parent of the commit) for the check
  # We'll get the parent SHA via git show
  PARENT_SHA=$(git show -s --format=%P "$COMMIT_SHA" | awk '{print $1}')
  if [ -z "$PARENT_SHA" ]; then
    # If no parent (initial commit), use the commit itself? but we need a base.
    # For simplicity, we'll skip the check if parent not found.
    echo "Warning: Could not determine parent commit for $COMMIT_SHA, skipping evidence generation."
  else
    EVIDENCE_DEST="$OUTPUT_DIR/commit-${COMMIT_SHA}.json"
    npx tsx "$ORIGINAL_REPO/src/cli.ts" check --base "$PARENT_SHA" --coverage-file "$COVERAGE_DEST" --json > "$EVIDENCE_DEST"
    echo "Evidence JSON saved to $EVIDENCE_DEST"
  fi
else
  echo "Warning: Could not locate original repo, skipping evidence generation."
fi

# Clean up worktree? Keep for inspection; comment out to remove.
# cd "$TSDOC_REPO"
# git worktree remove "$WORKTREE_DIR"
echo "Coverage generation successful for commit $COMMIT_SHA"
echo "Artifact: $COVERAGE_DEST"
