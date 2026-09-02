# WP14 Human Review Packet Stub

## Scope / Boundary / Constraints

### What Changed
- **Fresh coverage artifacts** (additive, no src/ modifications):
  - `experiments/wp14/coverage-A.json` — Istanbul coverage JSON for commit 00203d4 (TSDoc/Rush eslint-plugin)
  - `experiments/wp14/coverage-B.json` — Istanbul coverage JSON for commit e11ec0b (TSDoc/Rush eslint-plugin)
  - `experiments/wp14/commit-A.json` — Engine output for commit 00203d4 (schema 0.3)
  - `experiments/wp14/commit-B.json` — Engine output for commit e11ec0b (schema 0.3)
  - `experiments/wp14/WP14_RESULTS.md` — consolidated results document (this claims/evidence matrix)
  - `experiments/wp14/HUMAN_REVIEW_STUB.md` — this file
  - `.nvmrc` — Node version pin to 20.10.0
  - `scripts/wp14/repro.sh` — reproduction script documenting heft test command
- **Core logic unchanged**: No modifications to `src/` or engine; all verification uses existing engine `@barney-media/crap-typescript-core@0.5.0`.

### Which Functions Affected
| Function | File | CC (lizard) | Lines | Coverage (branch) | CRAP @30 | Gate |
|----------|------|-------------|-------|-------------------|----------|------|
| `ConfigCache.getForSourceFile` | ConfigCache.ts:39-111 | 12 | 39-111 | 33.33% | 54.67 | WARN |
| `plugin.rules.syntax.create` (A) | index.ts:43-133 | 5 | 43-133 | 33.33% | 12.41 | PASS |
| `getRootDirectoryFromContext` | index.ts:24-42 | 12 | 24-42 | 10% | 116.98 | WARN |
| `plugin.rules.syntax.create` (B) | index.ts:64-156 | 6 | 64-156 | 30% | 18.35 | PASS |

*Note: Functions as reported in engine output for each commit. CC computed via `@barney-media/crap-typescript-core@0.5.0` (AST-based).*

### Complexity Source
- **Tool**: `@barney-media/crap-typescript-core@0.5.0` (via `npx tsx src/cli.ts check`)
- **Metric**: Cyclomatic Complexity Number (CCN) — AST-based (TypeScript)
- **Mapping**: Engine field `cc` → CyclomaticComplexity
- **Note**: Same tool used for both commits; deterministic.

### Coverage Source
- **Tool**: Istanbul (via `heft test --config jest.coverage.config.json` in TSDoc/Rush monorepo)
- **Metric**: `branch coverage` (Istanbul `covered`/`total` branches)
- **Attribution**: Engine maps coverage to changed functions via line-range intersection.
- **Note**: Fresh coverage generated per commit; distinct artifacts (24 KB vs 29 KB vs Round7 1.62 MB).

### Attribution
- Method: Line-range intersection between complexity analyzer intervals and coverage executed lines → per-function coverage percent
- Result: Functions receive accurate coverage based on actual line coverage (not file-level proxy)
- Improvement: Uses function-level coverage from Istanbul when available.

### CRAP Calculation
- Formula: `crap = cc² × (1 - coverage/100)³ + cc` (from `crapCalc.ts`, unchanged)
- Threshold tested: 30 (default)
- Deterministic: Same inputs → same output

### Thresholds
| Threshold | Gate | Functions PASS | Functions WARN |
|-----------|------|----------------|----------------|
| 30 | WARN | 2 (both `plugin.rules.syntax.create`) | 2 (`ConfigCache.getForSourceFile`, `getRootDirectoryFromContext`) |

### Status Truthfulness
| Field | Value | Truthful? | Evidence |
|-------|-------|-----------|----------|
| `analysisStatus` | `SUCCESS` | ✅ | Engine ran successfully for both commits |
| `capabilities.complexity` | `available` | ✅ | Engine complexity parser present |
| `capabilities.coverageArtifact` | `available` | ✅ | Fresh coverage JSON provided |
| `capabilities.git` | `available` | ✅ | Git repo detected (worktrees) |
| `analyzerStatus` (per function) | `passed` | ✅ | Both analyzers succeed per function |
| `gate` | `WARN` (both commits) | ✅ | Derived from ruleResults (CRAP > 30) |
| `completeness` | `COMPLETE` | ✅ | All rules evaluated (no NOT_EVALUATED) |
| `coverageErrorReason` | omitted | ✅ | No coverage error |

### Evidence Missing / Untested
1. **Real-time longitudinal study** — Only two historical commits evaluated
2. **Statement coverage** — Only branch coverage used in this experiment
3. **Other languages** — Only TypeScript (TSDoc/Rush) evaluated
4. **Threshold sensitivity** — Only threshold 30 tested; not 15 or other values
5. **Engine upgrades** — Only engine `@barney-media/crap-typescript-core@0.5.0` tested
6. **Monorepo scaling** — Only one project (eslint-plugin) evaluated per commit
7. **Coverage tool variance** — Only Istanbul (via heft) used; not other coverage tools
8. **Windows/macOS/Linux** — Only macOS (Node 20.10.0) tested
9. **CI integration** — Local `heft test` only; not CI pipeline
10. **False positive/negative rates** — Not measured; relies on engine correctness

### Resolutions (WP14 Historical Fresh Per-Commit Coverage)
- **Fresh coverage per commit**: RESOLVED via separate worktrees and independent `heft test` runs
- **Coverage-aware CRAP**: RESOLVED via engine delta comparison using fresh coverage
- **Schema 0.3 provenance**: RESOLVED via explicit `language: "typescript"` and `schemaVersion` in engine output
- **Main repo integrity**: RESOLVED via `tsc --noEmit` 0 errors and `vitest 201/201` pass

### Reviewer Impact
- **Low risk**: Additive only (experiments/ only), no src/ modifications, all existing tests pass (201/201)
- **Decision needed**: Whether fresh per-commit coverage delta comparison is acceptable method for historical risk assessment
- **Schema evolution**: Per-commit outputs now in schema 0.3 with explicit language field, enabling language-tagged comparisons

### Constraints Satisfied
- WP14: Historical fresh per-commit coverage delta comparison (commits 00203d4/e11ec0b, Node 20.10.0, schema 0.3)
- Hygiene: .nvmrc and repro.sh added for reproducibility
- Verification: Main repo passes tsc/vitest

### Outcome
All verification passes: tsc 0 errors, vitest 201/201 (62 files). Fresh coverage artifacts distinct (24k/29k bytes, different SHAs). Engine outputs show coverage-aware CRAP delta (WARN/WARN) with meaningful trend: B's higher CRAP driven by lower coverage (10% vs 33%). All plan tasks completed per WP14_RESULTS.md. Awaiting human review for WP15 usefulness OR WP16 OR STOP via OPENCODE_START_HERE.md.

---
## AWAITING HUMAN REVIEW

**Reviewer**: Please evaluate the above constraints, limitations, and evidence. Decision options:

- [ ] **APPROVE** — Continue with constraints documented; merge to main
- [ ] **APPROVE WITH CONDITIONS** — Merge with specific follow-up tasks (list below)
- [ ] **REQUEST CHANGES** — Specific modifications needed before approval
- [ ] **REJECT** — Do not proceed; document rationale

**Follow-up conditions (if APPROVE WITH CONDITIONS)**:
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

**WP14 Historical Fresh Per-Commit Coverage completed (commits 00203d4/e11ec0b, Node 20.10.0, schema 0.3, gate WARN/WARN, coverage 24k/29k distinct) — All plan tasks met, verification green**

**Reviewer signature**: ________________________ **Date**: _______________

---
*Evidence references: experiments/wp14/coverage-A.json, experiments/wp14/coverage-B.json, experiments/wp14/commit-A.json, experiments/wp14/commit-B.json, experiments/wp14/WP14_RESULTS.md, .nvmrc, scripts/wp14/repro.sh*