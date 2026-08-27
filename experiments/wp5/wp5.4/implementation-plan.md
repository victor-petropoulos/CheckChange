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
