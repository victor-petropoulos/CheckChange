# WP8 False Positive and False Negative Analysis

## 1. Introduction
This document analyzes the false positive (FP) and false negative (FN) characteristics of the code risk engine evaluated in WP8 across five historical cases (`experiments/wp8/evidence/case-1.json` through `case-5.json`). 

Reviewer notes (`experiments/wp8/reviewer-notes.md`) confirm that all empirical cases evaluate correctly with no active false positives or false negatives flagged. This analysis examines the underlying root causes for correct passes, explores hypothetical false positive scenarios, catalogs engine blind spots (false negatives), and distinguishes known limitations from new operational frictions.

---

## 2. False Positive (FP) Analysis & Hypothetical Scenarios

### Empirical Observation
In Cases 1 through 4, all evaluated functions (`normalizeCoveragePaths`, `readCoverage`) returned passing gate results (`CRAP < 30`). Unmeasured CLI functions (`parseCliArgs`, `main`) reported `crap: null` with `analyzerStatus: skipped`, correctly respecting **INV-01 (ZERO≠NULL)** and avoiding false alarms on uninstrumented/uncovered paths.

### Hypothetical False Positive Scenario: Complexity by Design
Consider `parseCliArgs` (`src/cli.ts`), which exhibits a high cyclomatic complexity (CC = 23). 
- **The Scenario**: If `parseCliArgs` had coverage data mapped but maintained low test coverage (e.g., 20%), its CRAP score would spike to approximately **123** ($CC^2 \times (1 - cov)^3 + CC = 23^2 \times (0.8)^3 + 23 = 529 \times 0.512 + 23 \approx 293$), heavily violating the default threshold of 30.
- **Why it could be an FP**: If `parseCliArgs` is an extensive configuration parser with inherently high branching logic that is thoroughly tested via integration smoke tests rather than direct unit tests, a strict CRAP threshold of 30 would trigger a build failure (FP) despite robust functional validation.
- **Mitigation**: Threshold tuning (raising threshold or applying supplemental rules) or ensuring unit-level coverage mapping closes the attribution gap.

---

## 3. False Negative (FN) Analysis: Engine Blind Spots

Per the Roadmap WP8 False Negatives section, static complexity and coverage metrics are structurally blind to several categories of engineering risk:

1. **Security Vulnerabilities & Input Sanitization**:
   - The engine does not inspect AST patterns for SQL injection, path traversal, or unvalidated user inputs. A function can achieve CC=1 and 100% coverage while introducing a severe security flaw.
2. **Dependency Blast Radius**:
   - Upgrading or modifying shared internal utility modules without changing function-level complexity does not increase the CRAP score of callers, hiding downstream breaking changes or integration fragility.
3. **API Exposure & Breaking Changes**:
   - Public contract modifications (e.g., altering exported function signatures or removing optional parameters) are invisible to code coverage and complexity metrics.
4. **Data Sensitivity & Concurrency Flaws**:
   - Race conditions, memory leaks, and insecure data storage are completely orthogonal to cyclomatic complexity and statement/branch coverage.
5. **Historical Defects & Fragile Logic**:
   - A function with low CC (e.g., CC=2) can contain notoriously brittle business logic that fails under edge-case inputs not captured by test suites.

---

## 4. Limitation Classification: Known vs. New

| Limitation / Friction | Classification | Description & Impact |
| :--- | :--- | :--- |
| **TypeScript-Only Scope** | Known limitation | Engine parser targets TypeScript ASTs; cannot evaluate polyglot repositories or non-TS files. |
| **Istanbul / V8 Coverage Dependency** | Known limitation | Relies entirely on external coverage artifacts. Missing or malformed coverage reports halt execution (**INV-02**). |
| **Monorepo / Multi-Package Topologies** | Known limitation | Evaluated primarily on single-package structures; cross-package dependency tracking remains out of scope. |
| **Caller-Owned Coverage Burden** | Known limitation | Downstream users must generate and supply coverage files; the engine does not execute test suites directly. |
| **Test Quality vs. Quantity** | Known limitation | 100% statement/branch coverage guarantees execution, not assertion rigor or edge-case validation. |
| **Skipped CLI Functions (Attribution Gap)** | **New operational friction** | CLI entrypoints (`parseCliArgs`, `main`) show `crap: null` due to coverage mapping gaps between execution bundles and source files. Not a code defect, but requires operator comprehension. |

---

## 5. Summary Matrix: Case | Flag | Root Cause | Limitation Type | Mitigation |
| Case | Flag | Root Cause | Limitation Type | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Case 1** (`298e1bef`) | None (PASS) | Low CC (8) and adequate branch coverage (75%) yield CRAP = 9 (< 30). CLI functions correctly skipped. | Known (Coverage dependency / TS-only) | None required; deterministic pass. |
| **Case 2** (`21daa57`) | None (PASS) | Complete test coverage (100%) on `readCoverage` (CC=10) yields CRAP = 10. | Known (Test quality vs quantity) | Maintain high test standards; supplement with manual review. |
| **Case 3** (`7ab2301`) | None (PASS) | Metric stability across historical commits; deterministic engine output. | Known (Deterministic execution) | None required. |
| **Case 4** (`6c690a7`) | None (PASS) | Consistent metric reporting across revision deltas. | Known (Deterministic execution) | None required. |
| **Case 5** (Missing Artifact) | None (FAILED) | Missing coverage file correctly triggers `coverageErrorReason: "missing"` and exit code 1 (**INV-02**). | Known (Caller-owned coverage) | Ensure CI pipelines supply valid coverage artifacts before analysis. |

---

## 6. Conclusion
The evaluation confirms that the risk engine operates predictably and truthfully. While structural blind spots (security, dependency impact, API contracts) require complementary code reviews and linters, the engine successfully enforces CRAP thresholds without generating false positives on uninstrumented paths or false negatives on missing data.
