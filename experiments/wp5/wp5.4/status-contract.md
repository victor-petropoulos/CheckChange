# WP5.4 — Status Contract Reconciliation

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION

Reconcile existing status values from source/tests/schema. Distinguish: success, warning, incomplete, failure, unsupported, missing evidence. List actual values found. Do not invent semantics. Cite sources.

---

## Status Values Found in Source

### Top-Level `analysisStatus` (string)

| Value | Source Location | Semantic (from code) |
|-------|----------------|---------------------|
| `'SUCCESS'` | `src/evidence.ts` line 158 (default), line 254 (kept) | Analysis completed successfully. No provider failures. |
| `'FAILED'` | `src/evidence.ts` line 192, 205, `buildFailedOutput` line 300 | Provider failure (coverage parse error, attachment error). |
| `'UNSUPPORTED'` | `src/evidence.ts` lines 138, 165 | Non-TS-only changes, or complexity provider failure. |

### Top-Level `gate` (string or null)

| Value | Source Location | Semantic |
|-------|----------------|----------|
| `'PASS'` | `src/evidence.ts` line 244 (when no WARN) | All evaluated functions meet CRAP threshold. |
| `'WARN'` | `src/evidence.ts` line 244 (when any WARN) | At least one function exceeds CRAP threshold. |
| `null` | `src/evidence.ts` lines 139, 166, 193, 206, `buildFailedOutput` line 301 | No gate applicable (FAILED, UNSUPPORTED, or incomplete). |

### Top-Level `completeness` (string)

| Value | Source Location | Semantic |
|-------|----------------|----------|
| `'COMPLETE'` | `src/evidence.ts` line 160, line 246 (when no NOT_EVALUATED) | All changed functions were evaluated. |
| `'INCOMPLETE'` | `src/evidence.ts` lines 194, 207, `buildFailedOutput` line 302, line 246 (when any NOT_EVALUATED) | Some functions could not be evaluated (NOT_EVALUATED present). |
| `'NOT_APPLICABLE'` | `src/evidence.ts` lines 140, 167, `buildFailedOutput` line 302 (for UNSUPPORTED) | No evaluation attempted (non-TS or provider failure). |

### Per-Function `analyzerStatus` (string)

| Value | Source Location | Semantic |
|-------|----------------|----------|
| `'passed'` | `src/evidence.ts` line 216 (hardcoded) | Currently hardcoded for ALL functions. |
| `'failed'` | Type definition at `src/evidence.ts` line 17 | Not currently used. Reserved for evaluation failure. |
| `'skipped'` | Type definition at `src/evidence.ts` line 17 | Not currently used. Reserved for skipped evaluation. |

### Per-Function `coverageKind` (string or null)

| Value | Source Location | Semantic |
|-------|----------------|----------|
| `'stmt'` | `src/attribution.ts` lines 127, 131 | Statement coverage is the limiting factor. |
| `'branch'` | `src/attribution.ts` line 122 | Branch coverage is the limiting factor. |
| `null` | `src/attribution.ts` lines 37, 92, 139, 144, 149, 159 | No coverage data available. |

### Per-Function `coverage` (number or null)

| Value | Semantic |
|-------|----------|
| `number` (0-100) | Coverage percentage obtained and attributed. |
| `null` | No coverage data available (missing coverage, attribution failure, etc.). |

### Per-Function `crap` (number or null)

| Value | Semantic |
|-------|----------|
| `number` | CRAP score computed from cc and coverage. |
| `null` | CRAP not computed (coverage is null). |

### Rule Result `result` (string)

| Value | Source Location | Semantic |
|-------|----------------|----------|
| `'PASS'` | `src/rules.ts` line 33 | CRAP ≤ threshold. |
| `'WARN'` | `src/rules.ts` line 44 | CRAP > threshold. |
| `'NOT_EVALUATED'` | `src/rules.ts` line 24 | CRAP is null (coverage missing). |

### Capability `coverageArtifact` (string)

| Value | Source Location | Semantic |
|-------|----------------|----------|
| `'available'` | `src/evidence.ts` line 145 (initial), line 270 | **Defective:** Used even when coverage is absent (FM-V01). |
| `'failed'` | `src/evidence.ts` line 150, 270 | Coverage provider failed (parse error, missing explicit file). |
| `'absent'` | **Not currently used.** Desired for FM-V01 fix. | Coverage is absent (default missing, no file on disk). |
| `'unsupported'` | **Not currently used.** Noted in WP5.4 Spec Provisional §5. | Coverage provider not supported. |

---

## Contradictions Identified

### C1: `coverageArtifact: 'available'` when coverage is absent (FM-V01)
- **Location:** `src/evidence.ts` line 270
- **Issue:** `coverageCapability` is initialized to `'available'` at line 145. When default coverage is missing, `readCoverage` returns `{ available: false, error: false }` but the code never updates `coverageCapability` from `'available'`.
- **Impact:** Consumers believe coverage is available when it is not.

### C2: `analyzerStatus: 'passed'` when coverage is null (FM-G07)
- **Location:** `src/evidence.ts` line 216
- **Issue:** All functions get `'passed'` regardless of whether coverage was actually evaluated.
- **Impact:** Consumers cannot distinguish evaluated functions from unevaluated ones.

### C3: `analysisStatus: 'FAILED'` with `completeness: 'INCOMPLETE'` when coverage is missing explicit file
- **Location:** `src/evidence.ts` line 192-195, `buildFailedOutput`
- **Issue:** Missing explicit coverage file produces the same internal status as malformed coverage. The distinction is lost.
- **Impact:** Consumers cannot distinguish missing file from parse error.

### C4: `coverageArtifact: 'failed'` when file is missing (not malformed)
- **Location:** `src/evidence.ts` line 150, `buildFailedOutput` line 293
- **Issue:** `readCoverage` returns `error: true` for missing explicit file, which maps to `coverageCapability = 'failed'`. But "failed" implies the provider tried and failed, not that the file was missing.
- **Impact:** Consumers cannot distinguish missing file from parse error.

---

## Unresolved Questions

1. **Should `coverageArtifact` have a new value for "absent" (default missing)?** Current code has no such value. Desired: `'absent'` when default coverage is missing.

2. **Should `analyzerStatus` distinguish between "evaluated with valid coverage" and "not evaluated"?** Current code hardcodes `'passed'`. Desired: `'passed'` for evaluated, `'skipped'` for not evaluated.

3. **Should missing explicit coverage and malformed coverage produce different statuses?** Current code: both produce `error: true` → `coverageCapability = 'failed'`. Desired: distinguish missing from malformed.

4. **Should `exitCode` differ for ENOENT (git missing) vs repo-state error?** Current code: both produce exit 1. WP5.4 Spec Provisional §2.2 says "preserve the underlying cause."

5. **What is the intended semantic contract for `analyzerStatus`?** The type allows `'passed' | 'failed' | 'skipped'` but only `'passed'` is used. Need to establish when each value should be set.
