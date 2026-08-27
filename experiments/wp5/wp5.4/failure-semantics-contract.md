# Failure Semantics Contract

**Status:** EXECUTED — validated against implementation and tests
**Date:** 2026-08-27
**Source:** `src/evidence.ts`, `src/cli.ts`, `src/coverage.ts`, `src/git.ts`, `src/execute.ts`

---

## Purpose

Document the validated status taxonomy for the code-risk evidence engine. Distinguishes conditions by `analysisStatus`, `gate`, `completeness`, `coverageArtifact`, and per-function `analyzerStatus`. Each row specifies the condition, the output fields, and the conditions under which it applies.

**PLANNING vs EXECUTED:** This document reflects the post-implementation semantics as they exist in the code. It is a contract, not a plan.

---

## Top-Level Status

### `analysisStatus`

| Value | Condition | When Set |
|-------|-----------|----------|
| `'SUCCESS'` | Analysis completed, all providers functional | Default (line 158 evidence.ts) |
| `'FAILED'` | Provider failure (coverage parse error, attachment error) | `coverageCapability === 'failed'` (line 192) |
| `'UNSUPPORTED'` | Non-TS changes only, or complexity provider failure | `isUnsupportedIntervals()` (line 138) or `complexityCapability === 'failed'` (line 189) |

### `gate`

| Value | Condition | When Set |
|-------|-----------|----------|
| `'PASS'` | All evaluated functions meet CRAP threshold | `ruleResults` has no `'WARN'` (line 243) |
| `'WARN'` | At least one function exceeds CRAP threshold | `ruleResults` has any `'WARN'` (line 243) |
| `null` | No gate applicable | `FAILED`, `UNSUPPORTED`, or provider failure |

### `completeness`

| Value | Condition | When Set |
|-------|-----------|----------|
| `'COMPLETE'` | All changed functions were evaluated | No `'NOT_EVALUATED'` in ruleResults (line 245) |
| `'INCOMPLETE'` | Some functions could not be evaluated | Any `'NOT_EVALUATED'` in ruleResults (line 245) |
| `'NOT_APPLICABLE'` | No evaluation attempted | `UNSUPPORTED` analysisStatus |

### `capabilities.coverageArtifact`

| Value | Condition | When Set |
|-------|-----------|----------|
| `'available'` | Coverage file exists and parsed successfully | `coverageResult.available && !coverageResult.error` (line 145, default) |
| `'absent'` | Default coverage file missing (no `--coverage-file`, no file on disk) | `!coverageResult.available && !coverageResult.error` (line 150) |
| `'failed'` | Coverage file malformed, missing explicit file, or attachment error | `coverageResult.error` (line 148) |

**Key distinction:** `'absent'` means the system looked for default coverage and found nothing. `'available'` means coverage data was obtained and usable. `'failed'` means an error occurred during coverage acquisition or parsing.

---

## Per-Function Status

### `analyzerStatus`

| Value | Condition | When Set |
|-------|-----------|----------|
| `'passed'` | Function has valid numeric coverage (including 0) | `coveragePercent !== null && coveragePercent !== undefined` (line 216) |
| `'skipped'` | Function has no coverage data | `coveragePercent === null` (line 216) |
| `'failed'` | Reserved for evaluation errors | Not currently used |

**Zero is not null:** A function with `coverage: 0` (measured, 0% covered) gets `analyzerStatus: 'passed'`. A function with `coverage: null` (no data) gets `analyzerStatus: 'skipped'`.

### `coverageKind`

| Value | Condition |
|-------|-----------|
| `'stmt'` | Statement coverage is the limiting factor |
| `'branch'` | Branch coverage is the limiting factor |
| `null` | No coverage data available |

### `ruleResults[].result`

| Value | Condition |
|-------|-----------|
| `'PASS'` | CRAP ≤ threshold |
| `'WARN'` | CRAP > threshold |
| `'NOT_EVALUATED'` | CRAP is null (coverage missing) |

---

## CLI Exit Behavior

| Condition | Exit Code | Stderr | JSON `analysisStatus` |
|-----------|-----------|--------|----------------------|
| SUCCESS (valid coverage, all PASS) | 0 | (none) | `'SUCCESS'` |
| SUCCESS (valid coverage, some WARN) | 0 | (none) | `'SUCCESS'` |
| Default missing coverage | 0 | (none) | `'SUCCESS'` |
| Explicit missing coverage | 1 | `Error: coverage artifact missing` | `'FAILED'` |
| Malformed coverage file | 1 | `Error: coverage artifact malformed` | `'FAILED'` |
| Unsupported (non-TS only) | 0 | (none) | `'UNSUPPORTED'` |
| Git ENOENT (binary missing) | 1 | `Error: Git executable not found` | N/A (throws before evidence) |
| Not a git repo | 1 | `Error: Not a git repository` | N/A (throws before evidence) |

---

## Coverage Error Reason

When `analysisStatus === 'FAILED'`, the output may include `coverageErrorReason`:

| Value | Condition |
|-------|-----------|
| `'missing'` | Explicit `--coverage-file` path provided, file does not exist |
| `'malformed'` | Coverage file exists but failed to parse |
| (undefined) | Other failure paths (attachment error, etc.) |

---

## PLANNING vs EXECUTED Distinction

This document describes the semantics as implemented in the codebase. It was derived from the source code after WP5.4 fixes were applied. It serves as a reference contract for consumers of the output JSON and CLI behavior.

No planning assumptions remain — all values are verified against the actual implementation.
