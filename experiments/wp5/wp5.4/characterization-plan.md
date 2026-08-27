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

---