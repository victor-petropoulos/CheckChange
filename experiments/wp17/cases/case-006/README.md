# case-006 — AI-generated change (local var rename + comment)

- **Branch:** wp17-pilot-ai-006 (deleted)
- **Edit:** src/git.ts — renamed `candidates` → `fallbackRefs` + added `// AI-generated: wp17 case-006` comment
- **CLI:** `node dist/cli.js check --verbose` → exit 1 WARN gate, changedFunctions=1
- **Reproducibility:** 2 runs, 0-line diff
