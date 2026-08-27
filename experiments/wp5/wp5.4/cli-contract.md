# WP5.4 — CLI Contract: Status, JSON, Diagnostics, Exit Codes

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION

Document relationship between internal status, JSON status, human-readable diagnostics, and exit code. Identify contradictions without fixing. Cite evidence.

---

## Condition Matrix

| Condition | Internal Status | JSON `analysisStatus` | JSON `coverageArtifact` | JSON `gate` | JSON `completeness` | Exit Code | Stderr Diagnostic | Stdout |
|-----------|----------------|----------------------|------------------------|-------------|---------------------|-----------|-------------------|--------|
| **Valid coverage, all PASS** | SUCCESS | SUCCESS | available | PASS | COMPLETE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: N` |
| **Valid coverage, some WARN** | SUCCESS | SUCCESS | available | WARN | COMPLETE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: N` |
| **Default missing coverage** (no file on disk) | SUCCESS | SUCCESS | **available (defective: FM-V01)** | PASS | COMPLETE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: N` |
| **Explicit missing coverage** (file path provided, file not found) | FAILED | FAILED | failed | null | INCOMPLETE | 1 | `Error: coverage artifact malformed` (defective: FM-G06) | (none) |
| **Malformed coverage file** (file exists, invalid JSON) | FAILED | FAILED | failed | null | INCOMPLETE | 1 | `Error: coverage artifact malformed` | (none) |
| **Unsupported** (non-TS changes only) | UNSUPPORTED | UNSUPPORTED | available | null | NOT_APPLICABLE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: 0` |
| **Git ENOENT** (git binary missing) | N/A (throws before evidence) | N/A | N/A | N/A | N/A | 1 | `Error: Not a git repository` (defective: FM-D10) | (none) |
| **Git repo not found** (git exists, not a repo) | N/A (throws before evidence) | N/A | N/A | N/A | N/A | 1 | `Error: Not a git repository` | (none) |
| **Complexity provider failure** | UNSUPPORTED | UNSUPPORTED | available | null | NOT_APPLICABLE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: 0` |
| **Coverage attachment failure** | FAILED | FAILED | failed | null | INCOMPLETE | 1 | `Error: coverage artifact malformed` | (none) |
| **Analyzer passed** (all functions evaluated with coverage) | SUCCESS | SUCCESS | available | PASS/WARN | COMPLETE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: N` |
| **Analyzer incomplete** (some functions NOT_EVALUATED) | SUCCESS | SUCCESS | available | PASS | INCOMPLETE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: N` |
| **Analyzer warning** (some functions exceed CRAP threshold) | SUCCESS | SUCCESS | available | WARN | COMPLETE | 0 | (none) | `Analysis complete. Base: ..., Changed functions: N` |
| **Analyzer failed** (provider failure) | FAILED | FAILED | failed | null | INCOMPLETE | 1 | `Error: coverage artifact malformed` | (none) |

---

## Contradictions Identified

### D1: Default missing coverage → `coverageArtifact: 'available'` (FM-V01)
- **Condition:** Default missing coverage (no file on disk, no `--coverage-file`)
- **JSON:** `coverageArtifact: 'available'`
- **Reality:** Coverage is absent. No file exists.
- **Contradiction:** `'available'` implies coverage data is present and usable. It is not.
- **Evidence:** `src/evidence.ts` line 145 (`coverageCapability = 'available'`), line 270 (passed through to output). `src/coverage.ts` lines 28-30 returns `{ available: false, error: false }` but this does not update `coverageCapability`.

### D2: Missing explicit coverage → stderr "malformed" (FM-G06)
- **Condition:** Explicit `--coverage-file` path provided, file does not exist, TS change present
- **Stderr:** `Error: coverage artifact malformed`
- **Reality:** File is missing (ENOENT from `access()`), not malformed.
- **Contradiction:** "malformed" implies the file exists but has invalid content. The file does not exist.
- **Evidence:** `src/coverage.ts` lines 25-27 (missing explicit file → `error: true`), `src/cli.ts` line 125 (always prints "malformed" when `analysisStatus === 'FAILED'`).

### D3: Git ENOENT → "Not a git repository" (FM-D10)
- **Condition:** Git binary not in PATH (ENOENT)
- **Stderr:** `Error: Not a git repository`
- **Reality:** Git binary is missing (ENOENT), not that the directory is not a repo.
- **Contradiction:** Same message for two different root causes (missing binary vs not a repo).
- **Evidence:** `src/execute.ts` lines 50-54 (ENOENT → `exitCode: null`), `src/git.ts` line 16 (throws "Not a git repository" for any non-zero exit code, including null).

### D4: Missing explicit coverage and malformed coverage → identical JSON and stderr
- **Condition:** Both missing file and malformed file
- **JSON:** Both produce `coverageArtifact: 'failed'`, `analysisStatus: 'FAILED'`, `completeness: 'INCOMPLETE'`
- **Stderr:** Both produce `Error: coverage artifact malformed`
- **Reality:** Missing file is different from malformed file.
- **Contradiction:** No distinction in output between the two conditions.
- **Evidence:** `src/coverage.ts` lines 25-27 (missing → `error: true`), lines 37-39 (malformed → `error: true`). Both paths produce identical `CoverageResult`.

### D5: `analyzerStatus: 'passed'` for all functions regardless of coverage (FM-G07)
- **Condition:** All functions
- **JSON per-function:** `analyzerStatus: 'passed'`
- **Reality:** Some functions have null coverage (not evaluated).
- **Contradiction:** `'passed'` implies successful evaluation. Functions with null coverage were not evaluated.
- **Evidence:** `src/evidence.ts` line 216 (hardcoded).

---

## Exit Code Summary

| Exit Code | Conditions | Consistency Issue |
|-----------|-----------|-------------------|
| 0 | SUCCESS (valid coverage), UNSUPPORTED (non-TS), default missing coverage | Consistent — no error |
| 1 | FAILED (coverage error), ENOENT (git missing), repo-state error | **Inconsistent:** ENOENT and repo-state produce same exit code + same message (FM-D10) |

---

## JSON Schema Consistency

| Field | Type | Values Used | Values Defined in Type | Issue |
|-------|------|------------|----------------------|-------|
| `analysisStatus` | string | `'SUCCESS'`, `'FAILED'`, `'UNSUPPORTED'` | Not explicitly typed | OK |
| `gate` | string or null | `'PASS'`, `'WARN'`, `null` | Not explicitly typed | OK |
| `completeness` | string | `'COMPLETE'`, `'INCOMPLETE'`, `'NOT_APPLICABLE'` | Not explicitly typed | OK |
| `capabilities.coverageArtifact` | string | `'available'`, `'failed'` | Not explicitly typed | Missing `'absent'` for FM-V01 |
| `analyzerStatus` | `'passed' \| 'failed' \| 'skipped'` | `'passed'` only | `'passed'`, `'failed'`, `'skipped'` | `'failed'` and `'skipped'` unused (FM-G07) |
