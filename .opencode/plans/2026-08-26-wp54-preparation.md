# WP5.4 Preparation — Planning Artifacts

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION

**Date:** 2026-08-26

**Model:** mtplx/mtplx-qwen36-35b-a3b-optimized-balance

**Scope:** Read-only planning. No `src/` production code modified. No tests modified.

---

## Source Files Verified (STEP 0)

All required source paths verified via `ls`:

| Path | Status |
|------|--------|
| `experiments/wp5/wp5.2/WP5_2_RESULTS.md` | EXISTS |
| `experiments/wp5/wp5.2/defect-reproduction-results.md` | EXISTS |
| `experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.md` | EXISTS |
| `experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.json` | EXISTS |
| `experiments/wp5/wp5.2/cli-diagnostics/fm-g06-evidence.md` | EXISTS |
| `experiments/wp5/wp5.2/cli-diagnostics/fm-g06-evidence.json` | EXISTS |
| `experiments/wp5/wp5.2/defect-repro.spec.ts` | EXISTS |
| `experiments/wp5/wp5.2/regression-anchors.spec.ts` | EXISTS |
| `experiments/wp5/wp5.3/WP5_3_RESULTS.md` | EXISTS |
| `experiments/wp5/wp5.3/WP5_3_DOCUMENTATION_RECONCILIATION.md` | EXISTS |
| `experiments/wp5/wp5.3/source-discovery-decision.md` | EXISTS |
| `experiments/wp5/wp5.3/defect-fix-record.md` | EXISTS |
| `experiments/wp5/wp5.3/attribution-invariants.md` | EXISTS |
| `experiments/wp5/planning/WP5_4_SPEC_PROVISIONAL.md` | EXISTS |
| `experiments/wp5/planning/WP5_4_FAILURE_SEMANTICS_DIAGNOSTICS_SPEC.md` | EXISTS |
| `experiments/wp5/planning/OPENCODE_WP5_4_PROMPT.md` | EXISTS |
| `experiments/wp5/planning/WP5_4_DECISION_LOG_PREPARATION.md` | EXISTS |
| `experiments/wp5/planning/WP5_4_TRACEABILITY_PREPARATION.md` | EXISTS |
| `experiments/wp5/planning/WP5_4_TAXONOMY_RECONCILIATION_TEMPLATE.md` | EXISTS |
| `src/cli.ts` | EXISTS |
| `src/evidence.ts` | EXISTS |
| `src/git.ts` | EXISTS |
| `src/attribution.ts` | EXISTS |
| `src/complexity.ts` | EXISTS |
| `src/coverage.ts` | EXISTS |
| `src/execute.ts` | EXISTS |
| `src/rules.ts` | EXISTS |
| `experiments/wp5/wp5.2/cli-diagnostics/` | EXISTS (directory) |

`src/types.ts` does not exist — types are defined inline in `src/evidence.ts`, `src/coverage.ts`, `src/git.ts`, `src/complexity.ts`, `src/rules.ts`.

---

## Artifact 1: wp5_4_taxonomy_reconciliation.md

```markdown
# WP5.4 — Taxonomy Reconciliation

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION
**Date:** 2026-08-26
**Gate:** All rows resolved from authoritative WP5.2/WP5.3 evidence before WP5.4 implementation begins.

## Reconciliation Table

| FM ID | Authoritative Meaning | Evidence Artifact | WP5.3 Disposition | WP5.4 Scope | Status |
|-------|----------------------|-------------------|-------------------|-------------|--------|
| FM-V01 | Coverage capability mislabel: default coverage absent sets `available: false` but `capabilities.coverageArtifact` reports `'available'`. Internal `coverageCapability` stays `'available'` because `readCoverage` returns `{available:false, error:false}` which does not trigger the `coverageCapability = 'failed'` branch. | `defect-reproduction-results.md` line 12, `WP5_2_RESULTS.md` line 21 (`expect(output.capabilities.coverageArtifact).toBe('available')`), `fr-v1.spec.ts`, `src/evidence.ts` line 145 (initial `coverageCapability = 'available'`), `src/coverage.ts` lines 28-30 (default-missing path) | Deferred → WP5.4 | Correct `capabilities.coverageArtifact` to reflect actual availability. When default coverage missing (`available:false, error:false`), set `coverageCapability` to `'absent'` or equivalent. | CONFIRMED |
| FM-D10 | CLI reports "Not a git repository" when git binary is missing (ENOENT), not a repo-state issue. `validateGitRepo` throws `Error('Not a git repository')` because `execute` returns `exitCode: null` for ENOENT, and `null !== 0` is true. | `cli-diagnostics/fm-d10-evidence.md` (verbatim: `env -i PATH=... node dist/cli.js check --base HEAD` → exit 1, stderr `"Error: Not a git repository"`), `cli-diagnostics/fm-d10-evidence.json`, `src/git.ts` line 16, `src/execute.ts` lines 50-54 (ENOENT → exitCode null) | Deferred → WP5.4 | Clarify CLI message to indicate git binary missing (ENOENT) vs actual "not a git repository" repo state. Distinguish ENOENT from `git rev-parse --git-dir` failure. | CONFIRMED |
| FM-G06 | CLI reports "coverage artifact malformed" when explicit coverage file is missing. Requires TS change to activate coverage path. `readCoverage` returns `{available:true, error:true}` for missing explicit file → `coverageCapability = 'failed'` → CLI prints "malformed". | `cli-diagnostics/fm-g06-evidence.md` (verbatim: `node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-xyz.json` with TS change → exit 1, stderr `"Error: coverage artifact malformed"`), `cli-diagnostics/fm-g06-evidence.json`, `src/coverage.ts` lines 25-27 (explicit-missing path), `src/cli.ts` line 125 | Deferred → WP5.4 | Clarify CLI message for missing coverage file vs "malformed artifact". Distinguish file-not-found from parse-error. | CONFIRMED |
| FM-G07 | Composed-path `analyzerStatus` hardcoded `'passed'` regardless of whether function actually evaluated or received null coverage. Every function gets `analyzerStatus: 'passed'` at line 216 of `src/evidence.ts`. | `defect-reproduction-results.md` line 14, `defect-repro.spec.ts` line 511 (`expect(func.analyzerStatus).toBe('passed')`), `src/evidence.ts` line 216 (`analyzerStatus: 'passed'`) | Deferred → WP5.4 | Set `analyzerStatus` based on actual evaluation result / coverage validity. Functions with null coverage should not report `'passed'`. | CONFIRMED |

## Closed FMs (for context — NOT in WP5.4 scope)

| FM ID | Authoritative Meaning | WP5.3 Disposition | WP5.4 Scope | Status |
|-------|----------------------|-------------------|-------------|--------|
| FM-A07 | Container-method attribution key mismatch (`containerName.functionName` vs raw `functionName`) causes class/object methods to lose coverage → null CRAP / NOT_EVALUATED. | Fixed in WP5.3: `src/attribution.ts` line 101 now uses `{containerName}.{functionName}:{startLine}` key format. | Not in scope — CLOSED | CLOSED |
| FM-A08 | Suffix-collision path attribution: bidirectional `endsWith` matching with first-entry-wins misattributes coverage between files sharing relative path suffixes. | Fixed in WP5.3: `src/attribution.ts` lines 55-70 now uses exact path match first, `endsWith` fallback only, ambiguous → decline. | Not in scope — CLOSED | CLOSED |
| FM-C03 | Source-root blind spot: `findAllTypeScriptFilesUnderSourceRoots` restricts scanning to paths containing `src` segment. | Fixed in WP5.3: `src/complexity.ts` adds `getGitTrackedTsFiles()` + union logic. | Not in scope — CLOSED | CLOSED |

## Gate Statement

All 4 WP5.4 FMs (V01, D10, G06, G07) are CONFIRMED and reconciled against authoritative WP5.2/WP5.3 evidence. No FM is BLOCKED. WP5.4 implementation may proceed upon approval.

## Hard Constraints (echoed from WP5.4 Spec Provisional)

- No threshold changes
- No CRAP formula changes
- No source attribution changes (already fixed in WP5.3)
- No source discovery changes (already fixed in WP5.3)
- No coverage provider implementation changes
- No language expansion
- No LLM-based classification
- All WP5.1–WP5.3 regression anchors must remain green
```

---

## Artifact 2: characterization-plan.md

```markdown
# WP5.4 — Characterization Plan

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION

For each WP5.4 finding: reproduction, expected current behavior, observed behavior, evidence to capture, proposed regression fixture, contract questions, and GT2 inspection summary.

---

## FM-V01: Coverage Capability Mislabel

### Reproduction
- **Input:** Run `buildEvidenceOutput` in a repo with no coverage file at all (no `coverage/coverage-final.json`).
- **Command (CLI):** `node dist/cli.js check --base HEAD` (no `--coverage-file`, no coverage on disk).
- **Expected current behavior (defective):** `capabilities.coverageArtifact` = `'available'` even though coverage is absent. Internal `coverageResult = { available: false, coverageMap: null, error: false }`.
- **Observed behavior:** Same as expected current — `coverageCapability` initialized to `'available'` at `src/evidence.ts` line 145, never updated when `coverageResult.available === false && coverageResult.error === false`.
- **Exact evidence to capture:**
  - JSON output: `capabilities.coverageArtifact` field value
  - Internal: `coverageResult.available` (should be `false`)
  - Internal: `coverageCapability` variable value (should NOT be `'available'`)
  - Changed functions: all should have `coverage: null`, `coverageKind: null`
  - Gate: `'PASS'` (per WP5.2 default-missing policy)
- **Proposed regression fixture:** `experiments/wp5/wp5.4/fixtures/fr-v01-default-missing-capability.spec.ts`
  - Assert `capabilities.coverageArtifact !== 'available'` when default coverage missing
  - Assert `capabilities.coverageArtifact === 'absent'` (or new appropriate value)
- **Contract question:** What value should `coverageArtifact` report when coverage is absent? `'absent'`, `'missing'`, or a different value? WP5.2 evidence says the desired behavior is `'absent'` or equivalent.

### GT2 Inspection Summary (FM-V01)
| Aspect | Detail |
|--------|--------|
| Production path | `src/coverage.ts` `readCoverage()` → `src/evidence.ts` `buildEvidenceOutput()` line 145-152 → `capabilities.coverageArtifact` at line 269-270 |
| Public/CLI boundary | `--json` output: `capabilities.coverageArtifact` field |
| Existing tests | `regression-anchors.spec.ts` Anchor 2 (explicit vs default missing coverage), `defect-repro.spec.ts` FM-V01 test |
| Internal status | `coverageCapability = 'available'` (line 145), never set to `'absent'` or `'failed'` when default coverage missing |
| Exit code | 0 (PASS per WP5.2 default-missing policy) |
| Diagnostic text/JSON | JSON: `coverageArtifact: 'available'` (incorrect). No stderr. |
| Caller expectations | Consumers of `capabilities.coverageArtifact` assume `'available'` means coverage data is present and usable |

---

## FM-D10: Git Binary Missing (ENOENT) Misreported as "Not a git repository"

### Reproduction
- **Input:** Run CLI in environment where `git` binary is not in PATH (simulated via `env -i PATH=...`).
- **Command (CLI):** `env -i PATH=/some/path/without/git node dist/cli.js check --base HEAD`
- **Expected current behavior (defective):** Exit 1, stderr `"Error: Not a git repository"`. The message says "not a git repository" but the actual cause is ENOENT (git binary missing).
- **Observed behavior:** Same as expected current — `validateGitRepo` at `src/git.ts` line 14 calls `execute('git', ['rev-parse', '--git-dir'])`, `execute` returns `exitCode: null` for ENOENT (line 50-54 of `src/execute.ts`), `validateGitRepo` line 15 checks `result.exitCode !== 0` → `null !== 0` is true → throws `Error('Not a git repository')`.
- **Exact evidence to capture:**
  - Exit code: 1
  - stderr: `"Error: Not a git repository"` (misleading)
  - Internal: `execute` result has `exitCode: null` and `error.code === 'ENOENT'`
  - No stdout
- **Proposed regression fixture:** `experiments/wp5/wp5.4/fixtures/fr-d10-git-bmissing.spec.ts`
  - Simulate ENOENT by mocking `execute` or using environment isolation
  - Assert stderr contains reference to missing git binary, not "not a git repository"
- **Contract question:** Should the CLI distinguish between "git binary missing" and "not a git repository" at the exit-code level, or only at the diagnostic-message level? WP5.4 Spec Provisional §2.2 says "preserve the underlying cause" and "distinguish environmental/tooling failure from analysis failure."

### GT2 Inspection Summary (FM-D10)
| Aspect | Detail |
|--------|--------|
| Production path | `src/cli.ts` line 109 `validateGitRepo()` → `src/git.ts` line 14 `execute('git', ['rev-parse', '--git-dir'])` → `src/execute.ts` line 31 `execFile` → ENOENT → `exitCode: null` → `validateGitRepo` line 15 throws `Error('Not a git repository')` → `src/cli.ts` line 132 `console.error(\`Error: ${error.message}\`)` |
| Public/CLI boundary | CLI stderr: `"Error: Not a git repository"` |
| Existing tests | `src/git.test.ts` (git validation tests), `regression-anchors.spec.ts` (uses real git repo) |
| Internal status | `execute` returns `exitCode: null` for ENOENT, `error.code === 'ENOENT'` |
| Exit code | 1 |
| Diagnostic text/JSON | stderr: `"Error: Not a git repository"` (misleading). No JSON output (CLI exits before reaching `buildEvidenceOutput`). |
| Caller expectations | Consumers expect "Not a git repository" to mean the directory exists but is not a git repo, not that git is missing |

---

## FM-G06: Missing Explicit Coverage File Reported as "Malformed Artifact"

### Reproduction
- **Input:** Run CLI with `--coverage-file /tmp/nonexistent-coverage-xyz123.json` AND a TypeScript change (to activate the coverage path).
- **Command (CLI):** `node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-coverage-xyz123.json` (with TS change present).
- **Expected current behavior (defective):** Exit 1, stderr `"Error: coverage artifact malformed"`. The file is missing, not malformed.
- **Observed behavior:** Same as expected current — `readCoverage` at `src/coverage.ts` line 25-27 returns `{ available: true, coverageMap: null, error: true }` for missing explicit file. `buildEvidenceOutput` line 154-156 sets `coverageCapability = 'failed'`. `buildEvidenceOutput` line 195 calls `buildFailedOutput()`. CLI line 124-127 checks `analysisStatus === 'FAILED'` and prints `"Error: coverage artifact malformed"`.
- **Exact evidence to capture:**
  - Exit code: 1
  - stderr: `"Error: coverage artifact malformed"` (misleading)
  - JSON output (with `--json`): `analysisStatus: "FAILED"`, `coverageArtifact: "failed"`, `completeness: "INCOMPLETE"`
  - Internal: `readCoverage` returns `error: true` for missing file (not parse error)
  - Precondition: TS file must be changed (coverage path only active with TS changes)
- **Proposed regression fixture:** `experiments/wp5/wp5.4/fixtures/fr-g06-missing-explicit-coverage.spec.ts`
  - Assert stderr says "missing" not "malformed"
  - Assert JSON `coverageArtifact` reflects missing vs failed-parse
  - Assert exit code 1 (failure is correct, message is wrong)
- **Contract question:** Should missing explicit coverage produce a different exit code from malformed coverage? WP5.2 evidence shows both produce exit 1. WP5.4 Spec Provisional §2.3 says "preserve deterministic failure classification" — so exit code may stay 1, but the message must distinguish missing from malformed.

### GT2 Inspection Summary (FM-G06)
| Aspect | Detail |
|--------|--------|
| Production path | `src/cli.ts` line 115 `buildEvidenceOutput(..., coverageFile)` → `src/evidence.ts` line 147 `readCoverage(cwd, coverageFile)` → `src/coverage.ts` lines 25-27 (explicit-missing path) → `src/evidence.ts` line 154-156 (sets `coverageCapability = 'failed'`) → `src/evidence.ts` line 195 (`buildFailedOutput`) → `src/cli.ts` line 124-127 (prints "malformed") |
| Public/CLI boundary | CLI stderr: `"Error: coverage artifact malformed"`; JSON: `coverageArtifact: "failed"`, `analysisStatus: "FAILED"` |
| Existing tests | `regression-anchors.spec.ts` Anchor 2 (explicit missing → FAILED), `defect-repro.spec.ts` FM-D10/FM-G06 test |
| Internal status | `readCoverage` returns `error: true` for missing explicit file; `coverageCapability = 'failed'`; `analysisStatus = 'FAILED'` |
| Exit code | 1 |
| Diagnostic text/JSON | stderr: `"Error: coverage artifact malformed"` (misleading). JSON: `coverageArtifact: "failed"`, `analysisStatus: "FAILED"`, `completeness: "INCOMPLETE"` |
| Caller expectations | Consumers expect "malformed" to mean the file exists but has invalid JSON, not that the file is missing |
| Precondition | TS file must be changed (otherwise CLI returns UNSUPPORTED at `src/evidence.ts` line 121-142, never reaches coverage path) |

---

## FM-G07: Composed-Path `analyzerStatus` Hardcoded 'passed'

### Reproduction
- **Input:** Run `buildEvidenceOutput` with a scenario where a function has null coverage (e.g., class method with attribution mismatch, or default-missing coverage).
- **Command (API):** Call `buildEvidenceOutput(base, intervals, cwd, threshold, coverageFile)` and inspect `changedFunctions[].analyzerStatus`.
- **Expected current behavior (defective):** All functions get `analyzerStatus: 'passed'` even when coverage is null / NOT_EVALUATED.
- **Observed behavior:** Same as expected current — `src/evidence.ts` line 216 hardcodes `analyzerStatus: 'passed'` for every function in the `crappedComplexity` mapping.
- **Exact evidence to capture:**
  - Per-function: `analyzerStatus` field value (should differ from `'passed'` when coverage is null)
  - Per-function: `coverage` field (null when coverage missing)
  - Per-function: `coverageKind` field (null when coverage missing)
  - Top-level: `analysisStatus` (may be `'SUCCESS'` even when functions have null coverage)
- **Proposed regression fixture:** `experiments/wp5/wp5.4/fixtures/fr-g07-analyzer-status-semantics.spec.ts`
  - Assert `analyzerStatus !== 'passed'` for functions with null coverage
  - Assert `analyzerStatus === 'skipped'` (or new appropriate value) for functions with null coverage
  - Assert `analyzerStatus === 'passed'` only for functions with valid numeric coverage
- **Contract question:** What `analyzerStatus` value should a function have when it has null coverage? `'skipped'` is the existing type option (`'passed' | 'failed' | 'skipped'`). `'failed'` would imply an error occurred. `'skipped'` seems most appropriate for "coverage not available."

### GT2 Inspection Summary (FM-G07)
| Aspect | Detail |
|--------|--------|
| Production path | `src/evidence.ts` line 211-221 `crappedComplexity` mapping — line 216 hardcodes `analyzerStatus: 'passed'` |
| Public/CLI boundary | JSON output: each `changedFunctions[].analyzerStatus` field |
| Existing tests | `defect-repro.spec.ts` FM-G07 test (line 511: `expect(func.analyzerStatus).toBe('passed')` — documents observed behavior) |
| Internal status | Hardcoded `'passed'` for all functions, regardless of coverage validity |
| Exit code | N/A (per-function field, not top-level) |
| Diagnostic text/JSON | JSON: `analyzerStatus: "passed"` for all functions (misleading when coverage is null) |
| Caller expectations | Consumers of `analyzerStatus` assume `'passed'` means the function was successfully evaluated with valid coverage |

---

## GT2 Cross-Finding Summary

| Finding | Production Path | CLI/JSON Boundary | Existing Tests | Internal Status | Exit Code | Diagnostic |
|---------|----------------|-------------------|----------------|-----------------|-----------|------------|
| FM-V01 | `coverage.ts` → `evidence.ts` line 145 | `capabilities.coverageArtifact` | regression-anchors Anchor 2, fr-v1.spec.ts | `coverageCapability = 'available'` never updated | 0 (PASS) | JSON: `coverageArtifact: 'available'` |
| FM-D10 | `cli.ts` → `git.ts` → `execute.ts` | CLI stderr | git.test.ts | `exitCode: null` for ENOENT | 1 | stderr: `"Error: Not a git repository"` |
| FM-G06 | `cli.ts` → `evidence.ts` → `coverage.ts` | CLI stderr + JSON | regression-anchors Anchor 2, defect-repro FM-G06 | `coverageCapability = 'failed'`, `error: true` | 1 | stderr: `"Error: coverage artifact malformed"` |
| FM-G07 | `evidence.ts` line 216 | JSON per-function `analyzerStatus` | defect-repro FM-G07 | Hardcoded `'passed'` | N/A | JSON: `analyzerStatus: "passed"` |
```

---

## Artifact 3: status-contract.md

```markdown
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
```

---

## Artifact 4: cli-contract.md

```markdown
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
```

---

## Artifact 5: implementation-plan.md

```markdown
# WP5.4 — Implementation Plan

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION

For each authorized WP5.4 finding: code location, tests required, regression risk, non-goals, acceptance criteria. Overall sequencing, hard constraints, stop gate.

---

## Hard Constraints (echoed from WP5.4 Spec Provisional §6)

The WP5.4 implementation MUST preserve:
- WP4R frozen behavior
- WP5.1 baseline behavior
- WP5.2 regression suite (25 files, 36 tests, all green)
- WP5.3 attribution fixes (10 adversarial tests, all green)
- Deterministic output ordering
- Existing supported coverage formats/providers

WP5.4 MUST NOT change:
- Threshold values
- CRAP arithmetic
- Source attribution logic (FM-A07, FM-A08 already fixed)
- Source discovery logic (FM-C03 already fixed)
- Coverage provider implementation
- Language support
- LLM-based classification

---

## Finding V01: Coverage Capability Mislabel

### Code Location
- **File:** `src/evidence.ts`
- **Lines:** 145-152 (coverage capability determination)
- **Change:** When `coverageResult.available === false && coverageResult.error === false` (default missing), set `coverageCapability = 'absent'` instead of keeping `'available'`.

### Tests Required
1. **Characterization test:** `experiments/wp5/wp5.4/fixtures/fr-v01-default-missing-capability.spec.ts`
   - Assert `capabilities.coverageArtifact === 'absent'` when default coverage missing
   - Assert gate is `'PASS'` (policy unchanged)
2. **Regression test:** Existing WP5.2 regression anchors must still pass (Anchor 2 tests explicit vs default missing).

### Regression Risk
- **Low:** Only changes the value of `capabilities.coverageArtifact` from `'available'` to `'absent'` when default coverage is missing. Does not change gate, analysisStatus, completeness, or exit code.
- **Risk:** If any caller depends on `coverageArtifact === 'available'` to mean "coverage may or may not be present," this is a breaking change. But the current behavior is a defect (misleading).

### Non-Goals
- Do not change gate behavior for default missing coverage (stays PASS per WP5.2 policy).
- Do not change analysisStatus (stays SUCCESS).
- Do not change completeness (stays COMPLETE).

### Acceptance Criteria
- `capabilities.coverageArtifact === 'absent'` when default coverage is missing
- `capabilities.coverageArtifact === 'available'` when coverage file exists and is valid
- `capabilities.coverageArtifact === 'failed'` when coverage file is malformed or explicitly missing
- All WP5.1–WP5.3 regression anchors remain green

---

## Finding D10: Git Binary Missing (ENOENT) Misreported

### Code Location
- **File:** `src/git.ts`
- **Lines:** 13-17 (`validateGitRepo`)
- **Change:** Check for ENOENT condition before throwing. When `execute` returns `exitCode: null && error.code === 'ENOENT'`, throw `Error('Git executable not found')` instead of `Error('Not a git repository')`.

### Tests Required
1. **Characterization test:** `experiments/wp5/wp5.4/fixtures/fr-d10-git-bmissing.spec.ts`
   - Mock `execute` to return ENOENT
   - Assert thrown error message contains "not found" or "executable not found"
   - Assert message does NOT say "Not a git repository"
2. **Regression test:** Existing git tests in `src/git.test.ts` must still pass for valid repo scenarios.

### Regression Risk
- **Low:** Only changes the error message thrown by `validateGitRepo`. Does not change exit code (still 1 via CLI catch block). Does not change behavior for valid repos or non-repo directories.
- **Risk:** Minimal — error message improvement only.

### Non-Goals
- Do not change exit code for ENOENT (stays 1).
- Do not add new CLI flags or options.
- Do not change behavior for valid repos or non-repo directories.

### Acceptance Criteria
- When git binary is missing (ENOENT), stderr contains reference to missing executable
- When directory is not a git repo, stderr still says "Not a git repository"
- All WP5.1–WP5.3 regression anchors remain green

---

## Finding G06: Missing Explicit Coverage Reported as "Malformed"

### Code Location
- **File:** `src/coverage.ts`
- **Lines:** 21-32 (`readCoverage`)
- **Change:** Distinguish between file-not-found (ENOENT from `access()`) and parse-error. Return a reason field or separate error type.
- **File:** `src/cli.ts`
- **Lines:** 124-127
- **Change:** Print different messages based on the type of coverage error (missing vs malformed).

### Tests Required
1. **Characterization test:** `experiments/wp5/wp5.4/fixtures/fr-g06-missing-explicit-coverage.spec.ts`
   - Assert stderr says "missing" not "malformed" when file does not exist
   - Assert JSON `coverageArtifact` reflects missing vs failed-parse
   - Assert exit code 1 (failure is correct, message is wrong)
2. **Regression test:** Existing WP5.2 regression anchors must still pass (Anchor 2 explicit missing → FAILED).

### Regression Risk
- **Low-Medium:** Changes error message and potentially JSON `coverageArtifact` value for missing explicit coverage. Exit code stays 1.
- **Risk:** If callers depend on `coverageArtifact === 'failed'` for missing files, this could break them. But the current behavior is a defect (misleading).

### Non-Goals
- Do not change exit code (stays 1 for any coverage failure).
- Do not change `analysisStatus` (stays FAILED).
- Do not change `completeness` (stays INCOMPLETE).

### Acceptance Criteria
- When explicit coverage file is missing, stderr says "missing" not "malformed"
- When explicit coverage file is malformed, stderr says "malformed"
- JSON distinguishes missing vs malformed (via `coverageArtifact` or new field)
- All WP5.1–WP5.3 regression anchors remain green

---

## Finding G07: Composed-Path `analyzerStatus` Hardcoded 'passed'

### Code Location
- **File:** `src/evidence.ts`
- **Lines:** 211-221 (crappedComplexity mapping)
- **Change:** Replace hardcoded `analyzerStatus: 'passed'` with logic based on coverage validity:
  - `coveragePercent !== null` → `'passed'`
  - `coveragePercent === null` → `'skipped'`

### Tests Required
1. **Characterization test:** `experiments/wp5/wp5.4/fixtures/fr-g07-analyzer-status-semantics.spec.ts`
   - Assert `analyzerStatus === 'passed'` for functions with valid numeric coverage
   - Assert `analyzerStatus === 'skipped'` for functions with null coverage
2. **Regression test:** Existing WP5.2 regression anchors must still pass.

### Regression Risk
- **Low:** Only changes the per-function `analyzerStatus` field. Does not change top-level `analysisStatus`, `gate`, `completeness`, or exit code.
- **Risk:** If callers depend on `analyzerStatus === 'passed'` for all functions, this is a breaking change. But the current behavior is a defect (misleading).

### Non-Goals
- Do not change top-level `analysisStatus`.
- Do not change `gate` or `completeness`.
- Do not change exit code.

### Acceptance Criteria
- `analyzerStatus === 'passed'` for functions with valid numeric coverage
- `analyzerStatus === 'skipped'` for functions with null coverage
- All WP5.1–WP5.3 regression anchors remain green

---

## Overall Sequencing

1. **Phase 1: Characterization tests** — Write characterization tests for all 4 findings (V01, D10, G06, G07) that document current defective behavior. These tests should FAIL initially (they assert desired behavior).
2. **Phase 2: Fixes** — Implement minimal fixes for each finding, one at a time.
3. **Phase 3: Regression verification** — Run all WP5.1–WP5.3 regression anchors after each fix. Ensure no regressions.
4. **Phase 4: Final verification** — Run full test suite. All tests must pass.

### Recommended Order
1. V01 (capability label) — lowest risk, isolated change
2. G07 (analyzerStatus) — low risk, isolated change
3. D10 (git ENOENT) — low risk, isolated change
4. G06 (coverage diagnostic) — medium risk, touches coverage path

---

## Stop Gate

WP5.4 execution must stop after implementation and verification.

Do not automatically proceed to WP5 Final or WP6.

---

## Acceptance Criteria (Overall)

- Each authorized finding has executable reproduction evidence
- Each correction has an explicit invariant
- CLI diagnostics accurately represent the observed condition
- Machine-readable and human-readable results agree
- Analyzer status semantics are explicit and tested
- Exit codes are deterministic and contractually justified
- All WP5.1–WP5.3 regression anchors remain green
- Production changes are minimal and traceable
- No unrelated behavior was changed
```

---

## Verification

After writing, the following commands verify the artifacts:

```bash
ls -R experiments/wp5/wp5.4/
head -5 experiments/wp5/wp5.4/wp5_4_taxonomy_reconciliation.md
head -5 experiments/wp5/wp5.4/characterization-plan.md
head -5 experiments/wp5/wp5.4/status-contract.md
head -5 experiments/wp5/wp5.4/cli-contract.md
head -5 experiments/wp5/wp5.4/implementation-plan.md
```

## Summary of Files Created

| # | File | Description |
|---|------|-------------|
| 1 | `experiments/wp5/wp5.4/wp5_4_taxonomy_reconciliation.md` | FM ID reconciliation table with authoritative WP5.2/WP5.3 evidence, dispositions, and gate statement |
| 2 | `experiments/wp5/wp5.4/characterization-plan.md` | Per-finding characterization: reproduction, evidence, regression fixtures, GT2 inspection summaries |
| 3 | `experiments/wp5/wp5.4/status-contract.md` | Reconciled status values from source/schema, contradictions identified, unresolved questions |
| 4 | `experiments/wp5/wp5.4/cli-contract.md` | Condition matrix mapping internal status → JSON → CLI → exit code, contradictions identified |
| 5 | `experiments/wp5/wp5.4/implementation-plan.md` | Per-finding code locations, tests, regression risk, non-goals, acceptance criteria, sequencing, stop gate |

**All artifacts are PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION.**

**No `src/` production code was modified.**
**No tests were modified.**
**No implementation was performed.**