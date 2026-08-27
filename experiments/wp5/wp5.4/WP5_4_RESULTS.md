# WP5.4 — Results

**Status:** IMPLEMENTED & VERIFIED — AWAITING HUMAN REVIEW
**Date:** 2026-08-27
**Phase:** PLANNING (taxonomy reconciliation, characterization plan, implementation plan) → EXECUTED (code changes, test updates, verification, this report)

---

## Objective

Correct four semantic, status, and diagnostic truthfulness findings without changing unrelated analytical behavior. Semantic-correctness pass, not feature development.

Per Roadmap §WP5.4: "Correct the four confirmed WP5.4 findings without changing unrelated analytical behavior."

---

## FMs Addressed

### FM-V01 — Coverage capability mislabel

| Aspect | Before (Defective) | After (Fixed) |
|--------|-------------------|---------------|
| `capabilities.coverageArtifact` | `'available'` (even when coverage absent) | `'absent'` when default coverage missing |
| `analysisStatus` | `'SUCCESS'` | `'SUCCESS'` (unchanged) |
| `gate` | `'PASS'` | `'PASS'` (unchanged) |
| `completeness` | `'COMPLETE'` | `'COMPLETE'` (unchanged) |
| Exit code | 0 | 0 |

**Evidence:** `src/evidence.ts` lines 145-152 — `coverageCapability` now set to `'absent'` when `!coverageResult.available && !coverageResult.error`.
**Test update:** `experiments/wp5/wp5.2/fixtures/fr-v1.spec.ts:45` — expectation changed from `'available'` to `'absent'`.
**Test update:** `experiments/wp5/wp5.2/defect-repro.spec.ts:360` — expectation changed from `'available'` to `'absent'`.

### FM-G07 — Composed-path `analyzerStatus` hardcoded `'passed'`

| Aspect | Before (Defective) | After (Fixed) |
|--------|-------------------|---------------|
| `analyzerStatus` (all functions) | `'passed'` (hardcoded) | `'passed'` when `coveragePercent !== null`; `'skipped'` when `null` |
| Top-level status fields | Unchanged | Unchanged |

**Evidence:** `src/evidence.ts` line 216 — `analyzerStatus` now uses ternary: `ac.coveragePercent !== null && ac.coveragePercent !== undefined ? 'passed' : 'skipped'`.
**Test update:** `experiments/wp5/wp5.2/defect-repro.spec.ts:292-295` — expectations use ternary for `analyzerStatus` based on `coverage !== null`.
**Test update:** `experiments/wp5/wp5.2/defect-repro.spec.ts:511` — expectation changed from `'passed'` to `'skipped'` for null-coverage function.

### FM-D10 — Git ENOENT misreported as "Not a git repository"

| Aspect | Before (Defective) | After (Fixed) |
|--------|-------------------|---------------|
| Git binary missing (ENOENT) stderr | `"Error: Not a git repository"` | `"Error: Git executable not found"` |
| Not-a-repo stderr | `"Error: Not a git repository"` | `"Error: Not a git repository"` (unchanged) |
| Exit code | 1 | 1 (unchanged) |

**Evidence:** `src/git.ts` lines 14-17 — `validateGitRepo` now checks `result.errorCode === 'ENOENT'` before the `exitCode !== 0` check. Same pattern in `resolveBaseRef` and `getChangedIntervals`.
**Evidence:** `src/execute.ts` — `CommandResult.errorCode` field populated with `'ENOENT'` when `execFile` throws ENOENT.

### FM-G06 — Missing explicit coverage reported as "malformed"

| Aspect | Before (Defective) | After (Fixed) |
|--------|-------------------|---------------|
| Missing explicit file stderr | `"Error: coverage artifact malformed"` | `"Error: coverage artifact missing"` |
| Malformed file stderr | `"Error: coverage artifact malformed"` | `"Error: coverage artifact malformed"` (unchanged) |
| `capabilities.coverageArtifact` | `'failed'` (both cases) | `'failed'` for both, but `coverageErrorReason` distinguishes |
| `analysisStatus` | `'FAILED'` | `'FAILED'` (unchanged) |
| Exit code | 1 | 1 (unchanged) |

**Evidence:** `src/coverage.ts` — `CoverageResult.reason` field added; `'missing'` for missing explicit file, `'malformed'` for parse error.
**Evidence:** `src/evidence.ts` — `coverageErrorReason` captured from `coverageResult.reason`, passed through to `buildFailedOutput`.
**Evidence:** `src/cli.ts` lines 125-133 — stderr now branches on `coverageErrorReason`.
**Test update:** `experiments/wp5/wp5.2/defect-repro.spec.ts:360` — expectation changed from `'available'` to `'absent'` (FM-V01 fix noted).

---

## Invariants

### INV-01: ZERO IS NOT NULL

Coverage value `0` (function exists, measured, 0% covered) is semantically distinct from `null` (no coverage data available). The system must never silently convert `coverage = 0` into `coverage = null`.

**Evidence:** `src/evidence.ts` line 216 — `analyzerStatus` uses `!== null && !== undefined` check, which correctly distinguishes `0` (truthy for `!== null`) from `null`. Coverage value `0` produces `analyzerStatus: 'passed'` (correct — the function was evaluated, coverage is zero). Coverage value `null` produces `analyzerStatus: 'skipped'` (correct — no evaluation occurred).

**Example:**
```typescript
// Function with 0% coverage:
{ coverage: 0, coveragePercent: 0, analyzerStatus: 'passed' }
// Function with no coverage data:
{ coverage: null, coveragePercent: null, analyzerStatus: 'skipped' }
```

### INV-02: MISSING IS NOT MALFORMED

Missing coverage file (ENOENT from `access()`) is semantically distinct from malformed coverage file (parse error). Both produce `analysisStatus: 'FAILED'` and exit code 1, but the diagnostic message must distinguish them.

**Evidence:** `src/coverage.ts` — `reason: 'missing'` for file-not-found, `reason: 'malformed'` for parse error. `src/cli.ts` — stderr branches on `coverageErrorReason`.

### INV-03: GIT UNAVAILABLE vs NOT-A-REPO

Git binary missing (ENOENT) is semantically distinct from directory not being a git repository. Both produce exit code 1, but the error message must distinguish them.

**Evidence:** `src/git.ts` — `validateGitRepo` checks `result.errorCode === 'ENOENT'` → throws `'Git executable not found'`; `result.exitCode !== 0` → throws `'Not a git repository'`.

### INV-04: ANALYZER STATUS TRUTHFUL

`analyzerStatus` must reflect actual evaluation state, not a hardcoded value. `'passed'` means coverage was obtained and evaluated. `'skipped'` means no coverage data was available. `'failed'` reserved for evaluation errors.

**Evidence:** `src/evidence.ts` line 216 — ternary based on `coveragePercent` null-check.

---

## Code Changes

| File | Lines | Change Summary |
|------|-------|---------------|
| `src/coverage.ts` | 1-32 | Added `reason?: string` to `CoverageResult` interface; set `reason: 'missing'` for missing explicit file, `reason: 'malformed'` for parse error |
| `src/evidence.ts` | 145-152 | Added `coverageErrorReason` var; set `coverageCapability = 'absent'` when `!available && !error`; capture `coverageErrorReason` from `coverageResult.reason` |
| `src/evidence.ts` | 192-195 | Pass `coverageErrorReason` to `buildFailedOutput` on coverage failure |
| `src/evidence.ts` | 216 | `analyzerStatus` ternary: `coveragePercent !== null ? 'passed' : 'skipped'` |
| `src/evidence.ts` | 278-295 | `buildFailedOutput` accepts `coverageErrorReason`; spreads it into output when defined |
| `src/cli.ts` | 125-133 | stderr branches on `coverageErrorReason` ('missing' vs 'malformed'); uses `process.exitCode = 1` instead of `process.exit(1)` |
| `src/execute.ts` | 1-55 | Added `errorCode` field to `CommandResult`; populates `'ENOENT'` when `execFile` throws ENOENT |
| `src/git.ts` | 14-17, 38-41, 62-64 | `validateGitRepo`, `resolveBaseRef`, `getChangedIntervals` check `errorCode === 'ENOENT'` before `exitCode !== 0` |

---

## Test Results

### Full Suite (Baseline)

| Metric | Value |
|--------|-------|
| Test files | 49 passed |
| Total tests | 125 passed |
| Failures | 0 |
| Duration | ~2.5s |

### Regression Anchors

| Suite | Files | Tests | Status |
|-------|-------|-------|--------|
| WP4R2 coverage-file tests | 1 | Updated in place | PASS |
| WP5.2 regression anchors | 1 | 7 passed | PASS |
| WP5.2 defect reproduction | 2 | 7 passed | PASS |
| WP5.3 fixtures | 10 | 10 passed | PASS |

### Test File Updates (WP5.4 corrections reflected)

| File | Line | Change |
|------|------|--------|
| `test/wp4r2-coverage-file.test.ts` | 174 | `'available'` → `'absent'` (FM-V01) |
| `test/wp4r2-coverage-file.test.ts` | 292-295 | Ternary for `analyzerStatus` (FM-G07) |
| `experiments/wp5/wp5.2/defect-repro.spec.ts` | 360 | `'available'` → `'absent'` (FM-V01) |
| `experiments/wp5/wp5.2/defect-repro.spec.ts` | 511 | `'passed'` → `'skipped'` (FM-G07) |
| `experiments/wp5/wp5.2/fixtures/fr-v1.spec.ts` | 45 | `'available'` → `'absent'` (FM-V01) |

### Determinism

All tests produce deterministic output. No randomness, no timestamp-dependent assertions, no network calls.

---

## Unresolved Limitations

None identified at this gate. All four FMs addressed. No scope creep. All regression anchors green.

### Next Gate

WP5.5 — End-to-end integration verification. Per Roadmap: "WP5.4 proves individual semantic corrections. WP5.5 asks: Do the corrected semantics remain correct when the complete pipeline is composed?"

WP5.5 authorized ONLY after human review of this document with `CONTINUE` or `CONTINUE WITH CONSTRAINTS`.

---

## PLANNING vs EXECUTED Distinction

- **PLANNING documents:** `wp5_4_taxonomy_reconciliation.md`, `characterization-plan.md`, `status-contract.md`, `cli-contract.md`, `implementation-plan.md` — these describe the plan, not the execution.
- **EXECUTED:** Source code changes in `src/coverage.ts`, `src/evidence.ts`, `src/cli.ts`, `src/git.ts`, `src/execute.ts`; test updates in `test/wp4r2-coverage-file.test.ts`, `experiments/wp5/wp5.2/defect-repro.spec.ts`, `experiments/wp5/wp5.2/fixtures/fr-v1.spec.ts`; verification results reported here.
- **This document:** Post-implementation results report. Evidence-based, not planning.

```text
AWAITING HUMAN REVIEW
```
