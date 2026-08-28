#!/usr/bin/env bash
set -euo pipefail

echo "=== Minimal CI Proof for Code Risk Prototype ==="
echo

# Environment
echo "Environment:"
echo "  Node version: $(node --version)"
echo "  NPM version: $(npm --version)"
echo "  Git commit HEAD: $(git rev-parse HEAD)"
echo "  Vitest version: $(npx vitest --version)"
echo

# Determine project root and proof directory
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PROOF_DIR="$PROJECT_ROOT/experiments/wp6/minimal-ci-proof"
echo "Project root: $PROJECT_ROOT"
echo "Proof directory: $PROOF_DIR"
echo

# Base commit (parent of HEAD)
BASE=$(git rev-parse HEAD~1)
echo "Base commit: $BASE"
echo

# Build check (in project root)
echo "Running TypeScript build check..."
cd "$PROJECT_ROOT"
npx tsc --noEmit
echo "Build check passed."
echo

# Generate coverage artifact
echo "Generating coverage artifact with vitest..."
COVERAGE_DIR="$PROJECT_ROOT/coverage"
rm -rf "$COVERAGE_DIR"
# Run vitest with coverage (default output directory is ./coverage)
npx vitest run --coverage
echo "Coverage artifact generated at $COVERAGE_DIR/coverage-final.json"
# Copy the coverage-final.json to our proof directory for easy access
cp "$COVERAGE_DIR/coverage-final.json" "$PROOF_DIR/coverage-final.json"
echo "Copied coverage-final.json to proof directory"
echo

# Run the CLI check (from project root)
echo "Running code-risk CLI check..."
CLI_OUTPUT=$(node ./dist/cli.js check --base "$BASE" --json --coverage-file "$PROOF_DIR/coverage-final.json" 2>&1)
CLI_EXIT=$?
echo "CLI exit code: $CLI_EXIT"
echo "CLI output:"
echo "$CLI_OUTPUT"
echo

# Save JSON output to proof directory
echo "$CLI_OUTPUT" > "$PROOF_DIR/sample-output.json"
echo "JSON output saved to $PROOF_DIR/sample-output.json"
echo

# Evaluate gate
# Parse the JSON to get gate and analysisStatus
# We'll use jq if available, otherwise grep
if command -v jq >/dev/null 2>&1; then
  GATE=$(echo "$CLI_OUTPUT" | jq -r '.gate // empty')
  ANALYSIS_STATUS=$(echo "$CLI_OUTPUT" | jq -r '.analysisStatus // empty')
else
  # Fallback to grep (less reliable)
  GATE=$(echo "$CLI_OUTPUT" | grep -o '"gate":"[^"]*"' | cut -d'"' -f4)
  ANALYSIS_STATUS=$(echo "$CLI_OUTPUT" | grep -o '"analysisStatus":"[^"]*"' | cut -d'"' -f4)
fi

echo "Analysis status: $ANALYSIS_STATUS"
echo "Gate: $GATE"

if [[ "$GATE" == "PASS" ]]; then
  echo "CI would PASS"
elif [[ "$GATE" == "WARN" ]]; then
  echo "CI would WARN"
else
  echo "CI would BLOCK or gate not PASS/WARN"
fi

echo
echo "=== Proof complete ==="