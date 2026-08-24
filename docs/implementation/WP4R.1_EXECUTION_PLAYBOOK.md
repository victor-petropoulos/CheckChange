# WP4R.1 Execution Playbook

1. **Freeze** — do not modify production code; record current commit/status.
2. **Reproduce h3** — use the same revision/environment and exact WP4R coverage command; inventory everything created.
3. **Investigate h3** — inspect Vitest/provider versions, package scripts and configuration; run native documented coverage command if different; then test a documented CLI-only reporter override if supported. No config edits or dependency installs.
4. **Reproduce and investigate hono** — repeat exactly.
5. **Inspect artifacts** — identify format, location and suitability. Determine whether current attribution can consume any Istanbul JSON without changing its data model.
6. **Compare contracts** — A exact artifact, B explicit Istanbul path, C deterministic Istanbul discovery, D multiple formats. Prefer the smallest evidence-supported contract.
7. **Report** — create `docs/research/WP4R.1_COVERAGE_ARTIFACT_DISCOVERY_RESULTS.md`.

End with exactly one:

```text
KEEP EXACT ARTIFACT CONTRACT
ADD EXPLICIT ISTANBUL PATH
ADD ISTANBUL DISCOVERY
RESEARCH MULTIPLE FORMATS
STOP
```

Then stop. No implementation.
