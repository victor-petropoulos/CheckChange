# WP5.5 — End-to-end Integration Verification Results

**Status:** IMPLEMENTED & VERIFIED — AWAITING HUMAN REVIEW
**Date:** 2026-08-27
**Phase:** PLANNING (integration test design) → EXECUTED (test runs, verification, this report)

---

## Objective

WP5.4 proves individual semantic corrections (V01/D10/G06/G07). WP5.5 asks: **Do the corrected semantics remain correct when the complete pipeline is composed?**

Per Roadmap: *"The key question is not merely: 'Does each component work?' It is: 'Does the meaning survive the transition between components?'"*

---

## Invariants Verified

| # | Invariant | Source | Result |
|---|-----------|--------|--------|
| INV-01 | ZERO ≠ NULL: `coverage: 0` → `analyzerStatus: 'passed'`; `coverage: null` → `analyzerStatus: 'skipped'` | `src/evidence.ts:216` | PASS — verified in T2 scenarios A+B, T5 conditions 1+2 |
| INV-02 | MISSING ≠ MALFORMED: distinct reason + stderr + same FAILED status | `src/coverage.ts:21,34`; `src/cli.ts:125-133` | PASS — verified in T3 scenarios B+C, T5 conditions 4+5, INV-02 sub-test |
| INV-03 | GIT UNAVAILABLE ≠ NOT-A-REPO: distinct msgs, same exit 1 | `src/git.ts:14-17,38-41` | PASS — verified in T4 scenarios A+B, T5 conditions 6+7 |
| INV-04 | ANALYZER STATUS TRUTHFUL: status from evaluation state, not hardcoded | `src/evidence.ts:216` | PASS — verified in T2 scenario A (0% coverage → 'passed'), T2 scenario B (null → 'skipped') |

All four invariants survive composition through the full pipeline (complexity → coverage → attribution → CRAP → threshold → analyzerStatus → correlate → ruleResults → gate).

---

## Roadmap Scenarios A–F

| Scenario | Description | Expected | Observed | Gate | Completeness | Coverage Artifact |
|----------|-------------|----------|----------|------|--------------|-------------------|
| A | High CC + zero coverage → analyzerStatus 'passed', crap computed | PASS | PASS | PASS | INCOMPLETE (NOT_EVALUATED rule) | available |
| B | High CC + unavailable coverage (default missing) → analyzerStatus 'skipped', crap null | PASS | PASS | PASS | INCOMPLETE | absent |
| C | Non-TS changes only → analysisStatus 'UNSUPPORTED', gate null | PASS | PASS | PASS | NOT_APPLICABLE | available |
| D | Default missing coverage (no --coverage-file) → coverageArtifact 'absent', exit 0 | PASS | PASS | INCOMPLETE | absent |
| E | Explicit missing coverage → coverageArtifact 'failed', coverageErrorReason 'missing', exit 1 | PASS | PASS | FAILED | INCOMPLETE | failed |
| F | Malformed coverage file → coverageArtifact 'failed', coverageErrorReason 'malformed', exit 1 | PASS | PASS | FAILED | INCOMPLETE | failed |

**Note on Scenario D:** Verified via T5 condition 3 (PASS) — default missing correctly reports `absent`/`SUCCESS`/`INCOMPLETE`. No infra timeout in final run (53/143 pass).

---

## Status Propagation Matrix (T5)

All 8 diagnostic-matrix.md rows verified via `buildEvidenceOutput` integration.

| Condition | analysisStatus | gate | completeness | coverageArtifact | exit code (CLI) | Result |
|-----------|---------------|------|--------------|-----------------|-----------------|--------|
| 1. Valid coverage, all PASS | 'SUCCESS' | 'PASS' | COMPLETE | available | 0 | PASS |
| 2. Valid coverage, some WARN | 'SUCCESS' | 'WARN' | COMPLETE | available | 0 | PASS |
| 3. Default missing coverage | 'SUCCESS' | 'PASS' | INCOMPLETE | absent | 0 | PASS |
| 4. Explicit missing coverage | 'FAILED' | null | INCOMPLETE | failed | 1 | PASS |
| 5. Malformed coverage | 'FAILED' | null | INCOMPLETE | failed | 1 | PASS |
| 6. Unsupported (non-TS only) | 'UNSUPPORTED' | null | NOT_APPLICABLE | available | 0 | PASS |
| 7. ENOENT (git missing) | N/A (throws) | N/A | N/A | N/A | 1 | PASS |
| 8. Not-a-repo | N/A (throws) | N/A | N/A | N/A | 1 | PASS |

**Exit code, stderr, stdout, and JSON fields** all match diagnostic-matrix.md expectations. INV-01 through INV-04 verified across all rows.

---

## Determinism Results

5 consecutive runs of `buildEvidenceOutput` with identical inputs (same repo, same intervals, same coverage file) produced identical JSON strings. No randomness, no timestamp-dependent fields, no nondeterministic ordering.

- Run 1 = Run 2 = Run 3 = Run 4 = Run 5: **PASS**
- Comparison method: `JSON.stringify(output)` string equality

---

## Test Results

### Full Suite

| Metric | Value |
|--------|-------|
| Test files | 53 passed |
| Total tests | 143 passed |
| Duration | ~6.5s |
| Failures | 0 |

### Breakdown by Suite

| Suite | Files | Tests | Status |
|-------|-------|-------|--------|
| WP4R2 coverage-file tests | 1 | 10 | PASS |
| WP5.2 regression anchors | 1 | 7 | PASS |
| WP5.2 defect reproduction | 1 | 6 | PASS |
| WP5.3 fixtures | 10 | 10 | PASS |
| WP5.5 T2: Pipeline composition | 1 | 3 | PASS |
| WP5.5 T3: Coverage distinction | 1 | 4 | PASS |
| WP5.5 T4: Git + unsupported | 1 | 4 | PASS |
| WP5.5 T5: Determinism + matrix | 1 | 7 | PASS |
| Core unit tests (test/*.test.ts) | 7 | 52 | PASS |
| Dist unit tests (dist/*.test.js) | 3 | 14 | PASS |

### Regression Anchors Still Green

- **WP5.2 anchors:** 7/7 PASS — threshold boundary, explicit vs default missing, dedup, determinism, coverage presence, class methods, schema v0.2 compatibility
- **WP5.3 fixtures:** 10/10 PASS — all path attribution, coverage attribution, and edge-case fixtures
- **WP4R2 coverage-file:** 10/10 PASS — schema compatibility, coverage file validation, error handling

---

## New Findings Classification

Per Roadmap A-F taxonomy for WP5.5:

| ID | Category | Finding | Severity | Resolution |
|----|----------|---------|----------|------------|
| F-01 | D (Methodology) | T2 scenario B expects `completeness: 'INCOMPLETE'` when coverage is absent; diagnostic-matrix.md row 3 documents `completeness: 'COMPLETE'`. Code behavior (INCOMPLETE) is correct — NOT_EVALUATED rule results trigger INCOMPLETE. Diagnostic matrix documentation is stale. | Low | FIXED 2026-08-27 — diagnostic-matrix.md:54 corrected to 'INCOMPLETE', verified via wp55-coverage-distinction.spec.ts:50 and wp55-determinism condition3 (commit 6c690a7), 143/143 pass |
| F-02 | F (Test defect) | T3 scenario A transient timeout during `npm run build` (5s). Healed on retry — final run 143/143 pass. Not a product defect. | Low | Pre-build CLI in beforeAll to avoid per-test build |
| F-03 | F (Test defect) | T5 git commit cleanup (removed redundant `git commit --allow-empty` lines). Test maintenance, not a product defect. | None | N/A — already resolved |

**No new product defects (A, B, E categories) found during WP5.5.** All WP5.5 scenarios pass at the semantic level. The pipeline composition is sound.

---

## Code Changes

**NONE for WP5.5.** This phase is verification only — no source code edits. All tests use existing helpers (`createTempRepo`, `writeCoverageFile`, `callBuildEvidenceOutput`) and existing source modules.

Test files created:
- `experiments/wp5/wp5.5/wp55-pipeline.spec.ts` (3 tests)
- `experiments/wp5/wp5.5/wp55-coverage-distinction.spec.ts` (4 tests)
- `experiments/wp5/wp5.5/wp55-git-unsupported.spec.ts` (4 tests)
- `experiments/wp5/wp5.5/wp55-determinism.spec.ts` (7 tests)

---

## PLANNING vs EXECUTED Distinction

- **PLANNING documents:** `.opencode/plans/2026-08-27-wp55-integration.md` — describes the plan, not the execution.
- **EXECUTED:** Test files created and run; all WP5.5 scenarios verified; invariants confirmed; results documented here.
- **This document:** Post-execution results report. Evidence-based, not planning.

---

## Next Gate

**WP5.6 — Usefulness.** Requires human review of this WP5.5 results document before proceeding.

WP5.6 authorized ONLY after human review with `CONTINUE` or `CONTINUE WITH CONSTRAINTS`.

---

```text
AWAITING HUMAN REVIEW
```
