#!/usr/bin/env bash
set -euo pipefail

# Script to generate requests coverage and evidence for corpus.
# Usage: ./run-python-corpus.sh <commit_sha> <output_dir>
# Example: ./run-python-corpus.sh <requests_commit> ./experiments/wp5/wp5.6/

# Source nvm to manage Node versions (for the engine)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Use Node 18 (as used in the monorepo script)
nvm use 18
echo "Using Node $(node --version)"

# Defaults
REQUESTS_REPO="${REQUESTS_REPO:-/tmp/requests-real}"
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

# Temporary directory for output
TEMP_OUTPUT_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_OUTPUT_DIR"' EXIT

# Clone or update the requests repo
if [ -d "$REQUESTS_REPO" ]; then
  echo "Updating existing requests repo at $REQUESTS_REPO"
  cd "$REQUESTS_REPO"
  git fetch origin
else
  echo "Cloning requests repo to $REQUESTS_REPO"
  git clone https://github.com/psf/requests.git "$REQUESTS_REPO"
fi

# Checkout the commit
cd "$REQUESTS_REPO"
git checkout "$COMMIT_SHA"

# Install test dependencies (pytest and coverage.py)
echo "Installing test dependencies..."
pip install pytest pytest-cov coverage

# Generate coverage using pytest-cov and output LCOV
echo "Running tests with coverage to generate LCOV..."
# We'll run pytest with coverage and generate an LCOV file
# Note: we use coverage run to get branch coverage if available, but we'll keep it simple
coverage run -m pytest
coverage lcov --directory . --output-file coverage.lcov

# Find the coverage artifact generated
COVERAGE_ARTIFACT="$REQUESTS_REPO/coverage.lcov"
if [[ ! -f "$COVERAGE_ARTIFACT" ]]; then
  echo "Error: No coverage artifact found at $COVERAGE_ARTIFACT"
  exit 1
fi

# Copy the coverage artifact to the output directory with a predictable name
COVERAGE_DEST="$OUTPUT_DIR/requests-coverage-${COMMIT_SHA}.lcov"
cp "$COVERAGE_ARTIFACT" "$COVERAGE_DEST"
echo "Coverage artifact copied to $COVERAGE_DEST"

# Generate evidence using the engine CLI
if [ -d "$(dirname "$0")/../src" ]; then
  echo "Running engine check to generate evidence JSON..."
  # Determine base commit (parent of the commit) for the check
  # We'll get the parent SHA via git show in the requests repo
  PARENT_SHA=$(git show -s --format=%P "$COMMIT_SHA" | awk '{print $1}')
  if [ -z "$PARENT_SHA" ]; then
    # If no parent (initial commit), we'll skip the check
    echo "Warning: Could not determine parent commit for $COMMIT_SHA, skipping evidence generation."
  else
    EVIDENCE_DEST="$OUTPUT_DIR/requests-evidence-${COMMIT_SHA}.json"
    npx tsx "$(dirname "$0")/../src/cli.ts" check --base "$PARENT_SHA" --coverage-file "$COVERAGE_DEST" --json > "$EVIDENCE_DEST"
    echo "Evidence JSON saved to $EVIDENCE_DEST"
  fi
else
  echo "Warning: Could not locate original repo, skipping evidence generation."
fi

echo "Requests corpus processing successful for commit $COMMIT_SHA"
echo "Coverage artifact: $COVERAGE_DEST"
echo "Evidence JSON: $EVIDENCE_DEST (if generated)"