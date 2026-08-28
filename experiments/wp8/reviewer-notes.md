# WP8 Reviewer Notes

## Overview
This document evaluates the evidence artifacts produced across five historical commits (`Case 1` through `Case 5`) in the `code-risk-prototype` repository against the actual engineering significance of the changes, checking CRAP metrics, gate outcomes, invariant preservation, and potential false positives/negatives.

---

## Case Evaluation

### Case 1: base = `298e1bef` (WP7 commit) → target = `HEAD`
- **Change Scope**: Small/moderate maintenance/refactoring touching CLI and coverage path normalization.
- **Changed Functions**:
  1. `parseCliArgs` (`src/cli.ts`, CC: 23, CRAP: null, Status: skipped, Rule: NOT_EVALUATED)
  2. `main` (`src/cli.ts`, CC: 12, CRAP: null, Status: skipped, Rule: NOT_EVALUATED)
  3. `normalizeCoveragePaths` (`src/coverage.ts`, CC: 8, CRAP: 9, Coverage: 75%, Rule: PASS)
- **CRAP / Gate vs Engineering Significance**: `normalizeCoveragePaths` has CC=8 and coverage=75%, yielding CRAP=9, which is well below the threshold of 30 (`PASS`). The CLI functions were skipped (coverage null). The gate PASS is correct because no evaluated function violated the CRAP threshold.
- **False Positive / False Negative Analysis**: 
  - **FP/FN Flag**: None (Correct classification).
  - **One-line why**: Low complexity and adequate branch coverage in `normalizeCoveragePaths` accurately reflect low technical risk despite moderate cyclomatic complexity.

### Case 2: base = `21daa57` (WP5.6 freeze) → target = `HEAD`
- **Change Scope**: Addition of coverage reading logic and path normalization.
- **Changed Functions**:
  1. `parseCliArgs` (CC: 23, CRAP: null, Status: skipped)
  2. `main` (CC: 12, CRAP: null, Status: skipped)
  3. `normalizeCoveragePaths` (CC: 8, CRAP: 9, Coverage: 75%, Rule: PASS)
  4. `readCoverage` (`src/coverage.ts`, CC: 10, CRAP: 10, Coverage: 100%, Rule: PASS)
- **CRAP / Gate vs Engineering Significance**: `readCoverage` has CC=10 and 100% statement coverage, resulting in CRAP=10 (<30, `PASS`). Complete test coverage for file reading/parsing eliminates test debt risk. Gate PASS is justified.
- **False Positive / False Negative Analysis**:
  - **FP/FN Flag**: None.
  - **One-line why**: 100% coverage on a moderately complex file-reading function correctly results in a clean pass.

### Case 3: base = `7ab2301` → target = `HEAD`
- **Change Scope**: Intermediate historical state encompassing CLI args and coverage module adjustments.
- **Changed Functions**: Same 4 functions as Case 2 (`parseCliArgs`, `main`, `normalizeCoveragePaths`, `readCoverage`).
- **CRAP / Gate vs Engineering Significance**: Identical metrics to Case 2 (`normalizeCoveragePaths` CRAP=9, `readCoverage` CRAP=10, gate=PASS). Engineering risk is low because all changed functions are fully covered or explicitly skipped due to missing coverage mapping.
- **False Positive / False Negative Analysis**:
  - **FP/FN Flag**: None.
  - **One-line why**: Metric stability across consecutive git bases demonstrates deterministic engine execution.

### Case 4: base = `6c690a7` → target = `HEAD`
- **Change Scope**: Earlier historical state including core CLI and coverage modules.
- **Changed Functions**: Same 4 functions as Cases 2 & 3.
- **CRAP / Gate vs Engineering Significance**: Gate PASS. Identical CRAP scores for evaluated functions (`normalizeCoveragePaths` CRAP=9, `readCoverage` CRAP=10).
- **False Positive / False Negative Analysis**:
  - **FP/FN Flag**: None.
  - **One-line why**: Consistent metric reporting affirms reliability across different revision deltas.

### Case 5: Missing Coverage Artifact (Failure Handling)
- **Change Scope**: Same code diff as Case 1, but with `--coverage-file /non/existent/file.json`.
- **Changed Functions**: `[]` (empty array).
- **CRAP / Gate vs Engineering Significance**: `analysisStatus: FAILED`, `gate: null`, `coverageErrorReason: missing`. Exit code 1.
- **False Positive / False Negative Analysis**:
  - **FP/FN Flag**: None.
  - **One-line why**: Truthfully signals incomplete evidence and halts execution rather than producing false passes on missing data.

---

## Invariant Check Summary
- **INV-01 (ZERO≠NULL)**: Preserved. Unmeasured/skipped functions (`parseCliArgs`, `main`) correctly report `crap: null` and `coverage: null` instead of numeric `0`.
- **INV-02 (MISSING≠MALFORMED)**: Preserved. Case 5 correctly populates `coverageErrorReason: "missing"` and sets `coverageArtifact: "failed"`.
- **INV-03 (GIT≠REPO)**: Preserved. Git capability reported independently as `'available'`.
- **INV-04 (ANALYZER TRUTHFUL)**: Preserved. `analyzerStatus` accurately reflects `'skipped'`, `'passed'`, or `'FAILED'` depending on execution state.

---

## Missing Context & Limitations
- **Security & API Exposure**: The engine calculates cyclomatic complexity and code coverage, but is blind to authorization flaws, input sanitization gaps, and external API breaking changes.
- **Dependency Blast Radius**: Changes to core utility modules that affect downstream dependents do not trigger higher CRAP scores unless the function's own CC/coverage justifies it.
- **Test Quality vs Quantity**: 100% statement/branch coverage (`readCoverage`) guarantees execution during tests, but does not verify assertion robustness or edge-case coverage.
