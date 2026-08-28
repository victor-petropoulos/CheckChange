# WP9 Evolution Prioritization

## Overview
WP8 achieved strong reliability (zero false positives, 100% deterministic test-to-engine core), but identified limitations:
- **External diversity limited:** n=4 internal small modules plus local prototype fallback (`wp8-report.md`).
- **False Negative blind spots:** 5 distinct categories identified (`fp-fn-analysis.md`: security, blast radius, API boundaries, async concurrency, fragile logic).
- **Operational friction:** ~4.96s test run overhead per evaluation (`dx-operational.md`).
- **Attribution gap:** CLI parser functions (`parseCliArgs`, `main` in `src/cli.ts`) returned `crap:null` due to path normalization/coverage mapping mismatches.

Per Roadmap WP9 guidelines, any evolution without empirical WP8 evidence is treated as an unproven hypothesis and deferred.

---

## Prioritization Matrix

| Candidate | User Value | Evidence | Cost | Risk | Validation | Strategic Fit | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. CLI Attribution & Entrypoint Gap Fix** | High | `wp8-report.md` (CLI functions skipped/null CRAP) | Low | Low | Unit tests verifying non-null CRAP on CLI parser | High (fixes core engine ingestion bug) | **SELECTED** |
| **2. External Real-Repo Validation Pilot** | High | `wp8-report.md` (limited external diversity n=4) | Medium | Low | Run engine against small external TS library | High (validates external applicability) | **SELECTED** |
| **3. Threshold Sensitivity & Blind-Spot Guidance** | Medium | `fp-fn-analysis.md` (5 FN blind spots documented) | Low | Low | Documentation artifact in `experiments/wp9/threshold-guidance.md` | High (explains limits without code bloat) | **SELECTED** |
| **4. Coverage Generation Friction Reduction (Caching)** | Medium | `dx-operational.md` (~4.96s test overhead) | Medium | Medium | Benchmark runtimes before/after caching | Medium (optional DX polish) | **DEFERRED (Hypothesis)** |
| **5. Monorepo / Multi-Package Coverage Aggregation** | Low-Medium | `wp8-report.md` (untested in monorepo layouts) | High | Medium | Multi-package workspace test suite | Low (unproven immediate demand) | **DEFERRED (Hypothesis)** |
| **6. Historical Risk Delta / Trend Analysis** | Low | None in WP8 | High | High | Time-series metrics storage | Low (adds storage/DB complexity) | **DEFERRED (Hypothesis)** |
| **7. Additional Language Support / DB Adapters** | Low | None in WP8 | High | High | Cross-language parser test suites | Low (violates single-purpose constraint) | **DEFERRED (Hypothesis)** |

---

## Conclusion & Scope Summary
Selected items for WP9 execution:
1. Fix CLI attribution gap (`src/cli.ts` / `src/evidence.ts`).
2. External pilot repository validation.
3. Threshold sensitivity and FN blind-spot documentation guidance.
All other items are deferred as hypotheses lacking direct WP8 operational necessity.
