#!/usr/bin/env bash
set -e

# Provenance: WP14 environment pin for fresh per-commit coverage under Node 20.9
# This script demonstrates the Node 20.9 environment for TSDoc/Rush repo.

# Load nvm if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  \. "$NVM_DIR/nvm.sh"
elif [ -s "/opt/homebrew/opt/nvm/nvm.sh" ]; then
  \. "/opt/homebrew/opt/nvm/nvm.sh"
else
  echo "Warning: nvm.sh not found in typical locations. Assuming nvm is in PATH."
fi

# Use Node 20.10.0 (as per .nvmrc)
nvm use 20.10.0

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
# Note: Rush/Heft versions are not printed here to avoid requiring rush install in this script.
# In the actual workflow, after running this script, one would run: heft test
echo "To run heft test for TSDoc/Rush repo, execute: heft test"
