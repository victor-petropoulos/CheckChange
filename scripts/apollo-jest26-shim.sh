#!/usr/bin/env bash
set -euo pipefail

# Script to generate apollo-client coverage with Jest 26 for D-APOLLO issue.
# Usage: ./apollo-jest26-shim.sh <commit_sha> <output_dir>
# Example: ./apollo-jest26-shim.sh f6d0efac4d99375c67255aee6d9b2981753b6f55 ./experiments/wp5/wp5.6/

# Source nvm to manage Node versions
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Use Node 18 (compatible with Jest 26)
nvm use 18
echo "Using Node $(node --version)"

# Defaults
APOLLO_REPO="${APOLLO_REPO:-/tmp/apollo-client-repo}"
COMMIT_SHA="${1:-}"
OUTPUT_DIR="${2:-./experiments/wp5/wp5.6}"

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
WORKTREE_DIR="/tmp/apollo-worktree-${COMMIT_SHA}"

# Clean up any existing worktree for this commit
if [ -d "$WORKTREE_DIR" ]; then
  echo "Removing existing worktree directory at $WORKTREE_DIR"
  rm -rf "$WORKTREE_DIR"
fi
# Prune any stale worktree entries
cd "$APOLLO_REPO"
git worktree prune

# Clone if repo doesn't exist
if [ ! -d "$APOLLO_REPO" ]; then
  echo "Cloning apollo-client repository..."
  git clone https://github.com/apollographql/apollo-client.git "$APOLLO_REPO"
fi

# Create worktree for the specific commit
echo "Creating worktree for commit $COMMIT_SHA"
git worktree add "$WORKTREE_DIR" "$COMMIT_SHA"

# Enter worktree
cd "$WORKTREE_DIR"

# Install dependencies
echo "Installing dependencies..."
npm ci

# Install Jest 26 specifically to ensure toBeCalled alias works
echo "Installing Jest 26..."
npm install --save-dev jest@26

# Create Jest config if needed to ensure coverage is generated
# Check if jest.config.js exists, if not create a basic one
if [ ! -f "jest.config.js" ] && [ ! -f "jest.config.json" ] && [ ! -f "jest.config.ts" ]; then
  echo "Creating basic Jest config for coverage..."
  cat > jest.config.js << 'CONFIG_EOF'
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageReporters: ['json'],
  coverageDirectory: '<rootDir>/coverage',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)']
};
CONFIG_EOF
fi

# Run tests with coverage using Jest 26
echo "Running tests with coverage using Jest 26..."
npx jest --coverage

# The coverage output should be at coverage/coverage-final.json
COVERAGE_SRC="coverage/coverage-final.json"
COVERAGE_DEST="$OUTPUT_DIR/apollo-coverage-${COMMIT_SHA}.json"

if [ -f "$COVERAGE_SRC" ]; then
  echo "Copying coverage artifact to $COVERAGE_DEST"
  cp "$COVERAGE_SRC" "$COVERAGE_DEST"
  echo "Coverage artifact size: $(du -h "$COVERAGE_DEST" | cut -f1)"
else
  echo "Error: Coverage not found at $COVERAGE_SRC"
  # List what's in the coverage directory for debugging
  if [ -d "coverage" ]; then
    echo "Contents of coverage directory:"
    ls -la coverage/
  fi
  exit 1
fi

# Optionally, run the engine check to produce evidence JSON
# Path to the engine CLI (assuming we are in the root of the code-risk-prototype)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ORIGINAL_REPO="$SCRIPT_DIR/.."

if [ -d "$ORIGINAL_REPO/src" ]; then
  echo "Running engine check to generate evidence JSON..."
  # Determine base commit (parent of the commit) for the check
  # We'll get the parent SHA via git show
  PARENT_SHA=$(git show -s --format=%P "$COMMIT_SHA" | awk '{print $1}')
  if [ -z "$PARENT_SHA" ]; then
    # If no parent (initial commit), we'll skip the check
    echo "Warning: Could not determine parent commit for $COMMIT_SHA, skipping evidence generation."
  else
    EVIDENCE_DEST="$OUTPUT_DIR/apollo-evidence-${COMMIT_SHA}.json"
    npx tsx "$ORIGINAL_REPO/src/cli.ts" check --base "$PARENT_SHA" --coverage-file "$COVERAGE_DEST" --json > "$EVIDENCE_DEST"
    echo "Evidence JSON saved to $EVIDENCE_DEST"
  fi
else
  echo "Warning: Could not locate original repo, skipping evidence generation."
fi

# Clean up worktree? Keep for inspection; comment out to remove.
# cd "$APOLLO_REPO"
# git worktree remove "$WORKTREE_DIR"
echo "Apollo-client coverage generation successful for commit $COMMIT_SHA"
echo "Coverage artifact: $COVERAGE_DEST"