# case-007 — AI-generated change (unused stub function)

- **Branch:** wp17-pilot-ai-007 (deleted)
- **Edit:** src/evidence.ts — added `unusedPilotFunction(a) { return a + 1; }` stub + comment block
- **CLI:** `node dist/cli.js check --verbose` → exit 0 PASS gate, changedFunctions=2
- **Reproducibility:** single run (change not repeated to avoid contamination), evidence captured
