# CheckChange Master Plan — Living Document

> **Stable path:** `docs/Project Master Plans/checkchange-master-plan.md` — updated across sessions, never renamed.
> **Reference plan:** `.opencode/plans/2026-09-12T18-34-32-checkchange-trust-layer.md` (approved: false, 11 tasks)
> **Baseline:** CheckChange v0.4.1, Evidence Contract schema 0.4 FROZEN

---

## Purpose & How to Use

This is the **single source of truth** for CheckChange evolution across sessions. Every session starts here.

| Action | When |
|--------|------|
| **Read this first** | Every session — orient on baseline, decisions, roadmap, resume checklist |
| **Update Session Log** | End of each session — append row with date, agent, work done, blockers, next steps |
| **Append decisions** | When new Q&A resolves ambiguity — add to Decisions table with rationale |
| **Mark phase complete** | When acceptance criteria met — tick phase in Roadmap, note evidence |
| **Never rename/move** | This file stays at `docs/Project Master Plans/checkchange-master-plan.md`; reference plans stay timestamped |

---

## Baseline + Architecture Map

### Verified Baseline (v0.4.1)
- **Schema:** 0.4 FROZEN (`docs/contracts/evidence-contract.md:3,97`; `src/evidence.ts:174,400,423`)
- **Default threshold:** 30 (`src/cli.ts:13`; no `15` in `src/` — `rg NO_15_IN_SRC` verified)
- **CLI:** single command `check` only (`src/cli.ts:80-84` gate; `@ts-nocheck` at `src/cli.ts:2`)
- **Output:** `--json` (full EvidenceOutput) vs human summary (`src/cli.ts:110-114`)
- **Exit codes:** FAILED→1, SUCCESS+WARN→1, UNSUPPORTED+NOT_APPLICABLE→0 (`src/cli.ts:125-145`)

### Pipeline (file:line)
| Stage | File:line | Function | Notes |
|-------|-----------|----------|-------|
| Git validate | `src/git.ts:10-17` | `validateGitRepo` | `execute('git',['rev-parse','--git-dir'])` |
| Git resolve base | `src/git.ts:24-33` | `resolveBaseRef` | `git rev-parse --verify ${base}^{commit}` |
| Git diff→intervals | `src/git.ts:97-124` | `parseChangedIntervals` | Parses `@@ -a,b +c,d @@` headers |
| Git orchestration | `src/git.ts:131-147` | `getChangedIntervals` | validate→resolve→diff `--unified=0` |
| Complexity collect | `src/complexity.ts:34-74` | `collectComplexity` | Full scan: `findAllTypeScriptFilesUnderSourceRoots` ∪ `git ls-files` |
| Providers dispatch | `src/evidence.ts:12-26` | provider Map | TS (`.ts/.tsx/.js/.jsx/.mjs/.cjs`) + Python (`.py`) |
| Python complexity | `src/complexity-providers/pythonASTComplexityProvider.ts:14-180` | `spawnSync('python3',['-c',script,file])` | AST CC: `If/For/While/With/IfExp + ExceptHandler + Assert + BoolOp` |
| Coverage read | `src/coverage.ts:353-411` | `readCoverage` | Explicit `--coverage-file` else auto-detect precedence |
| Coverage LCOV | `src/coverage-providers/lcovProvider.ts:7-78` | | `MAX_SIZE 100MB`, `MAX_LINES 1M`, `isWithinCwd` guard |
| Coverage Istanbul | `src/coverage.ts:474-496` | `parseCoverageReport` + `normalizeCoveragePaths` | Suffix rebase via `segments.slice` + `fs.existsSync` |
| Attribution | `src/attribution.ts:30-165` | `attachCoverage` | Case-insensitive suffix match (fix 8885796) |
| CRAP calc | `src/crapCalc.ts:1-7` | `calculateCrap` | Pure: `cc*cc*(1-fraction)^3+cc` |
| Correlation | `src/evidence.ts:36-80` | `correlate` | Integer overlap `evidence.lineStart <= interval.end` |
| Rule engine | `src/rules.ts:20-55` | `evaluateHighCrap` | Single rule `changed-function-high-crap` |
| Evidence assembly | `src/evidence.ts:116-441` | `buildEvidenceOutput` | Sets capabilities, early returns, gate/completeness |
| Trace seam | `src/execute.ts:18-67` | `execute()` | `child_process.execFile` wrapper — **hook point for tracing** |

### Terminology Drift (verified absent in `src/`)
| Proposed (prompt) | Actual code | Contract |
|-------------------|-------------|----------|
| `DIRECT/ATTRIBUTED/HISTORICAL/UNAVAILABLE` | **0 hits in `src/`** | — |
| `NATIVE/PROVIDER/FALLBACK/UNAVAILABLE` | **0 hits in `src/`** | — |
| Coverage capability | `'available'|'failed'|'absent'` (`src/evidence.ts:211`) | `'available'|'unavailable'|'failed'` |
| Analyzer status | `'passed'|'failed'|'skipped'` (`src/evidence.ts:39`) | `'SUCCESS'|'FAILED'|'UNSUPPORTED'` |

---

## 10 Improvements — Current Support, Hook Point, Contract Impact, Risks

| # | Improvement | Current Support | Hook Point | Contract Impact | Risks (§20-21) |
|---|-------------|-----------------|------------|-----------------|----------------|
| 1 | **Lineage / provenance** | Partial — `analysis.{base,target}`, `source{tool,version}` only | `src/evidence.ts:400-417` output; `src/execute.ts:18` invocations | Additive `diagnostics.lineage[]` or sidecar; must not mutate existing fields | `INV-04` if lineage lies; non-determinism if timestamps/paths leak; major bump if field removal/type-change |
| 2 | **Completeness / quality** | Partial — `completeness` enum, `capabilities`, `coverageErrorReason` | `src/evidence.ts:197-268` capability branching; `src/coverage.ts:353-411` | `diagnostics.quality{}` additive; existing binary fields unchanged | `INV-01` if 0%→null; `'absent'` vs `'unavailable'` drift at `src/evidence.ts:211` |
| 3 | **Structured tracing** | Absent — only `console.warn/error` | `src/execute.ts:18` `execute()` seam; pipeline stages | Sidecar `diagnostics.trace[]` or separate file; NO timing in main JSON | `durationMs`/`pid` leakage breaks determinism (`evidence-contract.md:341`); temp files embed `pid` (`src/coverage.ts:94`) |
| 4 | **Fingerprints** | Absent — no hashing | `src/git.ts:97` diff hash; `src/complexity.ts:46-62` file enum; `src/attribution.ts:30` coverage keys | Additive `changedFunctions[].fingerprint` or `diagnostics.fingerprints{}` | Hash algo change = breaking; fingerprint failure must not downgrade coverage 0→null (`INV-01/02`) |
| 5 | **Incremental / caching** | Absent — full re-scan every run | `src/complexity.ts:34` collect; `src/coverage.ts:92` convert; `src/evidence.ts:138-145` dispatch | Sidecar cache (disk) — output deterministic per contract | Stale cache violates determinism; invalidation on `cwd/base/threshold/engine commit/coverage mtime`; temp cleanup fragile |
| 6 | **Doctor** | Absent — no subcommand | `src/cli.ts:88` `main()` new branch; `src/execute.ts:18` probes | CLI mode only (diagnostics), NOT EvidenceOutput | Parser refactor needed (`@ts-nocheck`, hand-rolled); must not pollute schema |
| 7 | **Explain** | Absent — no per-rule rationale | `src/rules.ts:20` `evaluateHighCrap`; `src/evidence.ts:301` ruleResults | Optional `ruleResults[].explanation` additive OR CLI-only re-read | Required field = breaking; verbosity bloat if non-deterministic paths embedded |
| 8 | **Function-level presentation** | Partial — `changedFunctions[]` already fn-level | `src/cli.ts:112-114` output branch; `src/evidence.ts:390` map | CLI formatting only (no schema change) | Safe if presentation stays outside JSON; grouped view → sidecar or new optional field |
| 9 | **Baseline / delta** | Manual only — single-base engine | `src/git.ts:131` `getChangedIntervals(base)`; `src/evidence.ts:401-402` `target:'current'` | Additive `delta` top-level OR separate `delta` command output | `INV-03` if delta misattributes repo; non-determinism if provenance not recorded (ties to #1) |
| 10 | **CI / PR presentation** | Absent — only `--json`/summary | `src/cli.ts:110-114` output branch | Sidecar formatter (GitHub annotations/JUnit/SARIF) over JSON | Must not change `gate/completeness`; annotations must use relative paths (like `src/complexity.ts:56`) |

---

## 4 Experiments — Bundling Verdict & Dependency Chain

| Experiment | Proposed Bundle | Dependencies | Verdict |
|------------|-----------------|--------------|---------|
| **A Trust** (lineage + completeness + fingerprints) | Bundle together | Lineage before fingerprints (hash needs lineage inputs); completeness orthogonal but shares `diagnostics` plumbing | **Valid bundle** — all additive schema/diagnostics; ship as minor 0.4→0.5 |
| **B Observability** (tracing + fingerprints overlap) | Partial risk | Tracing is cross-cutting (wraps `execute.ts:18`); fingerprints need Trust lineage | **Separate tracing** from Trust — tracing = infrastructure; ship tracing sidecar first, then fingerprints on top |
| **C Performance** (incremental/caching) | Depends on B | Requires lineage (#1) + fingerprints (#4) + tracing (#3) for correct invalidation | **Must NOT bundle with B** — cache without lineage/fingerprints = poison; ship A→B→C sequentially |
| **D Reviewer UX** (doctor + explain + presentation + baseline/delta + CI/PR) | Mixed | doctor/explain/presentation need Trust (#2) + lineage (#1); baseline/delta needs lineage; CI/PR = formatter | **Split D:** D1 (doctor/explain) rides with A (same diagnostics); D2 (baseline/delta) after A; D3 (CI/PR) standalone sidecar anytime |

### Dependency Chain (must-separate vs can-bundle)
```
A (Trust: lineage + completeness) 
  → B (Tracing sidecar) 
    → fingerprints (needs A+B) 
      → C (Incremental — needs fingerprints)
        → D2 (Baseline/delta — needs A)
D1 (doctor/explain) bundles with A (same diagnostics plumbing)
D3 (CI/PR formatters) — standalone sidecar, ship anytime
```

---

## Accepted Decisions (Q1-Q6)

| ID | Decision | Rationale | Source |
|----|----------|-----------|--------|
| Q1 | **Experiment A = additive only** (lineage + completeness + fingerprints in `diagnostics` object); minor bump 0.4→0.5 when stable | Keeps EvidenceOutput deterministic; sidecar for tracing; no breaking changes | User accept |
| Q2 | **Diagnostics = additive optional object** at top-level; all fields optional; `schemaVersion` bump only after A complete | Follows §21 versioning (additive optional only); `INV-05 DIAGNOSTICS TRUTHFUL` new invariant | User accept |
| Q3 | **Terminology reconciliation = prerequisite doc first** before any Trust/UX code | Code terms (`available/absent/failed`, `passed/failed/skipped`, `SUCCESS/FAILED/UNSUPPORTED`) diverge from proposed taxonomy; must resolve drift | User accept |
| Q4 | **CLI subcommand dispatcher rewrite = prerequisite** with sidecar outputs (doctor/explain/trace NOT EvidenceOutput) | Current hand-rolled parser + `@ts-nocheck` + single-command gate blocks clean subcommands | User accept |
| Q5 | **Measure-first: no cache without lineage+fingerprints+tracing + before/after metrics** | Caching without provenance = determinism poison; baseline metrics required per §21 | User accept |
| Q6 | **D = formatters only**; delta = evidence diff (not score diff); no gate changes | Keeps CI/PR simple; baseline/delta as evidence comparison; gate semantics frozen | User accept |
| DOC-LOCATION-2026-09-12 | **All project docs in-repo** — timestamped phase plans under `.opencode/plans/`, canonical living docs under `docs/Project Master Plans/`; no Desktop/outside paths are source of truth; phase plan `.opencode/plans/2026-09-12T18-34-32-checkchange-trust-layer.md` stays at current in-repo path, to be committed, not moved | Eliminates path drift; prior session created candidate plan at `docs/Project Master Plans/CheckChange_Candidate_Improvements_Plan.md` (25840 bytes, pre-existing Sep 11) | This session |

---

## Contract / Regression / Perf / Security Requirements (§17-21)

### Experiment Plan Contents (§17)
Each experiment doc must define:
- **Scope** — exact improvements included/excluded
- **Success criteria** — all tasks green, determinism verified (same inputs → identical JSON excluding timestamps/durations)
- **Rollback plan** — `git revert` to pre-experiment commit
- **Out-of-scope** — explicit deferral with dependency ordering

### Regression Baseline (§21)
Every task must verify before claiming complete:
```bash
npx tsc --noEmit        # typecheck
npm test                # unit tests
npm run build           # production build
npm pack --dry-run      # package integrity
```
Baseline metrics recorded in task notes.

### Performance Metrics
- **Before/after** for each phase: cold run time, warm run time, memory, output size
- Caching (C) requires measured speedup >20% with zero determinism regression
- No performance claims without evidence

### Security Guards (§20) — Preserve in All New Paths
| Guard | Location | Must Preserve |
|-------|----------|---------------|
| LCOV `MAX_SIZE 100MB` | `src/coverage-providers/lcovProvider.ts:12` | Any new LCOV read path |
| LCOV `MAX_LINES 1M` | `src/coverage-providers/lcovProvider.ts:13` | Any new LCOV read path |
| `isWithinCwd` path traversal | `src/coverage.ts:44` | Any new file read |
| Temp file cleanup | `src/coverage.ts:482-492` | Error paths + new conversion paths |
| No absolute paths in diagnostics | — | All new diagnostics fields |

### Sidecar-Before-Extension Order
1. Sidecar diagnostics/trace/formatters (no schema change)
2. Additive optional fields in `diagnostics` (minor bump)
3. Never: required fields, field removal, type changes (major only)

---

## Phase Roadmap

| Phase | Tasks | Depends On | Status |
|-------|-------|------------|--------|
| **P0: Terminology** | Create `docs/decisions/terminology-reconciliation.md` with binding table mapping every code term → canonical term | — | ☐ Pending |
| **P1: Diagnostics Schema** | Design `diagnostics{lineage[], quality{}, fingerprints{}}` in `docs/decisions/diagnostics-schema-design.md`; amend `evidence-contract.md` with `INV-05` | P0 | ☐ Pending |
| **P2: Lineage** | Implement per-stage provenance in 7 pipeline stages; emit `diagnostics.lineage[]` | P1 | ☐ Pending |
| **P3: Completeness/Quality** | Numeric quality score 0-100; per-stage completeness; `uncoveredFunctions[]` | P2 | ☐ Pending |
| **P4: Fingerprints** | SHA-256 of normalized signature+body AST; stable cross-platform; `diagnostics.fingerprints{}` | P3 | ☐ Pending |
| **P5: CLI Dispatcher** | Replace hand-rolled parser with subcommand dispatcher (`check|doctor|explain|trace|delta`); remove `@ts-nocheck`; sidecar outputs | P0 | ☐ Pending |
| **P6: Tracing Seam** | Wrap `execute()` at `src/execute.ts:18`; correlation ID propagation; `diagnostics.trace[]` sidecar | P5 | ☐ Pending |
| **P7: D1 Doctor/Explain** | `doctor` probes git/python/coverage tools; `explain <ruleId>` prints derivation; both emit diagnostics sidecar | P1, P5 | ☐ Pending |
| **P8: D2 Baseline/Delta** | `delta` subcommand compares two EvidenceOutput runs; evidence diff (not score); requires lineage | P2, P4 | ☐ Pending |
| **P9: D3 CI/PR Formatters** | `--format github|junit|sarif` sidecar formatters over JSON; GitHub annotations, PR comments | — (anytime) | ☐ Pending |
| **P10: C Incremental/Caching** | Disk cache keyed by fingerprints; invalidation on cwd/base/threshold/engine commit/coverage mtime | P2, P4, P6 | ☐ Pending |

**Gate:** Each phase requires regression baseline (tsc/test/build/pack) + contract audit + security audit before next phase.

---

## Session Log

| Date | Agent | Work Done | Blockers | Next Steps |
|------|-------|-----------|----------|------------|
| 2026-09-12 | Documenter | Research + grill + created trust-layer plan (approved:false) + created this master plan | None | Approve trust-layer plan; begin P0 Terminology reconciliation |
| 2026-09-12 | Documenter | Master plan moved to `docs/Project Master Plans/`, OPENCODE_START_HERE.md rewired with Living Plans block, DOC-LOCATION-2026-09-12 decision recorded, candidate improvements plan confirmed pre-existing at `docs/Project Master Plans/CheckChange_Candidate_Improvements_Plan.md` | None | Approve trust-layer plan; begin P0 Terminology reconciliation |
| 2026-09-12 | Documenter | Experiment A executed: tasks 1-11 done with commits 48b8ce9, 0248b31, 18975ce, c78cc50, a318c4c, 5171853, 6ed428a, 10fac9f; baseline tsc 0 / 79 files / 297 tests / pack 40 files / determinism diff-identical; review gates GO (one FIX-LIST cleared on INV-05 false citation); audit reruns after OOM: contract PASS with legacy-0.1 flag REJECTED (src/evidence.ts:250 intentional legacy buildOutput, test/evidence.test.ts:193 asserts it), security PASS; user-agreed next (new session): schema 0.5 bump first, then D3 CI formatters, then B/C/D. | None | Update §Next-Session Resume Checklist to: read bridge + master log, do 0.5 bump, then D3.

---

## Next-Session Resume Checklist

- [ ] Read bridge (`OPENCODE_START_HERE.md` §Last/Next Session) + master §Session Log
- [ ] Verify clean tree at commit 10fac9f (`git status --porcelain` empty, `git log --oneline -1`)
- [ ] Confirm baseline still green: `npx tsc --noEmit && npm test` (expect 0 / 297)
- [ ] Start schema 0.5 bump (user-agreed first work), then D3 CI formatters sidecar
- [ ] Update Session Log with new entry

---

*End of Master Plan*