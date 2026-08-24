# Coverage Contract Matrix

| Repo | WP4R command produced coverage? | Native artifact(s) | CLI Istanbul JSON possible? | Target modification? | Current model compatible? |
|---|---|---|---|---|---|
| h3 | NO — v8 provider silent, zero files created | None | NO — `@vitest/coverage-istanbul` not installed; `--coverage.reporter=json` accepted but no output | TARGET DEPENDENCY CHANGE REQUIRED (needs `@vitest/coverage-istanbul`) | NO — no artifact exists at any path |
| hono | YES — `coverage/raw/default/coverage-final.json` (1.52 MB, 159 files, valid Istanbul JSON) | `coverage/raw/default/coverage-final.json` (Istanbul JSON), HTML reports | YES — `--coverage.reportsDirectory=coverage` writes to prototype-expected path | TEMPORARY CLI OPTION ONLY (`--coverage.reportsDirectory=coverage`) | NO (default config writes to `coverage/raw/default/`, not `coverage/`); YES with CLI override |
