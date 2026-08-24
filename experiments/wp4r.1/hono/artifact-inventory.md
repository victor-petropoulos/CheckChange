# WP4R.1 Hono — Artifact Inventory

## Coverage Artifacts Found

### Primary Artifact
- **Path**: `coverage/raw/default/coverage-final.json`
- **Size**: 1,593,373 bytes (1.52 MB)
- **Format**: Istanbul JSON
- **Producer**: `@vitest/coverage-v8` v4.1.11
- **Files in map**: 159
- **Total statements**: 6,602
- **Total functions**: 1,130
- **Total branches**: 2,074

### Format Verification
All 159 entries contain required Istanbul keys: `path`, `s` (statements), `f` (functions), `b` (branches), `fnMap`, `branchMap`. Zero entries missing required keys.

### Consumability by Prototype
`src/coverage.ts` calls `parseCoverageReport(join(cwd, 'coverage/coverage-final.json'), cwd)`.

**Problem**: Default config writes to `coverage/raw/default/coverage-final.json`, NOT `coverage/coverage-final.json`. The prototype's hardcoded path `coverage/coverage-final.json` does not match.

**Fix**: `--coverage.reportsDirectory=coverage` CLI override writes `coverage/coverage-final.json` at the expected path. This is a CLI-only option — no repo modification needed.

### HTML Reports (supplementary)
- `coverage/raw/default/index.html` — full HTML report
- `coverage/raw/default/src/**/*.html` — per-file HTML reports
- `coverage/raw/default/build/**/*.html` — build tool HTML reports

### No Other Coverage Formats
No `lcov.info`, `clover.xml`, `cobertura*.xml` found. Config specifies only `['json', 'text', 'html']`.

## Comparison with h3

| Aspect | h3 | hono |
|--------|-----|------|
| Vitest version | 4.1.11 | 4.1.11 |
| Coverage provider | `@vitest/coverage-v8` | `@vitest/coverage-v8` |
| Config: reportsDirectory | default (`coverage/`) | `./coverage/raw/default` |
| Config: reporters | default | `['json', 'text', 'html']` |
| v8 produces output? | **NO** (silent) | **YES** (1.52 MB JSON) |
| Istanbul JSON produced? | NO | YES |
| Prototype path match? | N/A (no output) | No (writes to `coverage/raw/default/`) |
| CLI override fixes path? | N/A | YES (`--coverage.reportsDirectory=coverage`) |
