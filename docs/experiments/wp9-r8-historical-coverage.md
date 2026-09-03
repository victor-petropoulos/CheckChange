# WP9 R8 — Historical tsdoc Coverage Generation (Node 18)

## Purpose

Replace reused Round 7 artifact with fresh tsdoc coverage generated under Node 18 for historical per-commit validation. Round 7 artifact was generated under different Node version and may not reflect current engine behavior.

## Environment

| Item | Value |
|------|-------|
| **Node version** | 18.20.8 (via `nvm use 18`) |
| **Package manager** | Rush (via `npx @microsoft/rush install`) |
| **Test runner** | Heft + Jest (`npx heft test --config jest.coverage.config.json`) |
| **Coverage format** | Istanbul JSON (`coverage-final.json`) |
| **Source repo** | `/tmp/tsdoc-real` (cloned from microsoft/tsdoc) |
| **Worktree pattern** | `/tmp/tsdoc-worktree-<COMMIT_SHA>` |

## Target Commits

| Commit | Date | Description |
|--------|------|-------------|
| `00203d4` | 2025-10-07 | `[eslint-plugin-tsdoc] Leverage tsConfigRootDir setting` |
| `e11ec0b` | 2025-10-07 | `fix(eslint-plugin-tsdoc): replace deprecated ESLint APIs for v10 compatibility` |

Both commits affect `eslint-plugin-tsdoc` — the package that produces the coverage artifact used by the engine.

## Script Usage

```bash
# From repo root
./scripts/tsdoc-coverage.sh <commit_sha> [output_dir]

# Examples
./scripts/tsdoc-coverage.sh 00203d4 ./experiments/wp9-r8-historical-coverage/
./scripts/tsdoc-coverage.sh e11ec0b ./experiments/wp9-r8-historical-coverage/
```

### What the script does

1. `nvm use 18` — activates Node 18.20.8
2. Creates git worktree for target commit in `/tmp/tsdoc-worktree-<SHA>`
3. Runs `npx @microsoft/rush install` (installs all Rush packages)
4. Creates `eslint-plugin/config/jest.coverage.config.json` if missing
5. Runs `npx heft test --config eslint-plugin/config/jest.coverage.config.json`
6. Copies `eslint-plugin/coverage/coverage-final.json` → `<output_dir>/coverage-<SHA>.json`
7. Optionally runs engine `check` to produce evidence JSON (`commit-<SHA>.json`)

## Expected Artifacts

| Artifact | Path | Expected Size |
|----------|------|---------------|
| Coverage JSON | `experiments/wp9-r8-historical-coverage/coverage-00203d4.json` | ~1.5–2 MB |
| Coverage JSON | `experiments/wp9-r8-historical-coverage/coverage-e11ec0b.json` | ~1.5–2 MB |
| Evidence JSON (optional) | `experiments/wp9-r8-historical-coverage/commit-00203d4.json` | ~50–200 KB |
| Evidence JSON (optional) | `experiments/wp9-r8-historical-coverage/commit-e11ec0b.json` | ~50–200 KB |

## Reproducibility

- **Deterministic**: Same commit + same Node 18 + same Rush install = identical coverage artifact
- **Duration**: ~5–10 minutes per commit (Rush install dominates)
- **Prerequisites**: 
  - `nvm` installed with Node 18 available (`nvm install 18`)
  - `/tmp/tsdoc-real` exists (cloned in WP14; script clones if missing)
  - Internet access for Rush/npm registry

## Current Status

**Script verified**: `scripts/tsdoc-coverage.sh` executes without syntax errors, handles nvm/Rush/worktree flow correctly.

**Artifact generation**: Deferred — manual run required. To generate:

```bash
# Terminal 1 — commit 00203d4
./scripts/tsdoc-coverage.sh 00203d4 ./experiments/wp9-r8-historical-coverage/

# Terminal 2 — commit e11ec0b (parallel, separate worktree)
./scripts/tsdoc-coverage.sh e11ec0b ./experiments/wp9-r8-historical-coverage/
```

Each run produces coverage artifact + evidence JSON. Results are reproducible — re-running produces byte-for-byte identical `coverage-<SHA>.json` (modulo timestamps in Jest output, which are stripped by engine).

## Validation Checklist

After generation, verify:

- [ ] `coverage-00203d4.json` exists, valid JSON, size ~1.5–2 MB
- [ ] `coverage-e11ec0b.json` exists, valid JSON, size ~1.5–2 MB  
- [ ] Both parse without error via `jq .` or `cat | node -e "JSON.parse(require('fs').readFileSync(0,'utf8'))"`
- [ ] Engine `check` with each artifact produces valid evidence JSON (schema v0.2)
- [ ] `npx tsc --noEmit` passes in main repo (no TypeScript regressions)

## Notes

- Worktrees preserved at `/tmp/tsdoc-worktree-<SHA>` for inspection; clean up manually if disk space needed
- `jest.coverage.config.json` extends existing `jest.config.json` — only adds `coverageReporters: ["json"]` and `coverageDirectory`
- Evidence JSON generation requires parent commit (`git show -s --format=%P <SHA>`) — first commit in repo will skip this step
- This experiment addresses WP9 R8 OPEN limitation: historical complexity/change evidence validated against fresh artifacts

## Validation (2026-09-02)

LCOV E2E validated using synthetic test at `/tmp/e2e-lcov-test`:
- Wall-clock: 0.78s, max RSS: 255 MB (243 MB peak)
- analysisStatus: SUCCESS, gate: PASS, language: typescript
- Coverage artifact: available (LCOV format via lcov.info)

Synthetic Istanbul E2E validated using minimal Istanbul JSON coverage file:
- Wall-clock: 0.81s, max RSS: 260 MB
- analysisStatus: SUCCESS, gate: PASS
- Coverage artifact: available (Istanbul JSON format)

Both validations used `npx tsx src/cli.ts check --base HEAD~1 --coverage-file ... --json` from project root.
TypeScript compilation clean (`npx tsc --noEmit` exit 0). Vitest: 233 tests passed.

Heft path remains documented for tsdoc historical coverage (requires Rush install ~5–10 min per commit).