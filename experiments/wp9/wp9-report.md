# WP9 Evidence-Driven Evolution Report

status: COMPLETE AWAITING HUMAN REVIEW
date: 2026-08-28

## Objective — What WP9 should answer per Roadmap (evidence-driven evolution, not predetermined backlog)

WP9's objective per Roadmap is to evolve the code-risk capability based strictly on evidence from WP8, treating any unproven hypotheses as deferred items. WP9 answers: "Given WP8's empirical findings (reliability strong, external diversity limited, FN blind spots documented, operational friction quantified), what specific, evidence-backed evolution should be pursued without violating CONTINUE WITH CONSTRAINTS?"

## Prioritization Summary — table from prioritization.md highlighting SELECTED vs DEFERRED (hypothesis), with prioritization model columns condensed.

| Candidate | User Value | Evidence | Cost | Risk | Validation | Strategic Fit | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. CLI Attribution & Entrypoint Gap Fix** | High | WP8 report (CLI functions skipped/null CRAP) | Low | Low | Unit tests verifying non-null CRAP on CLI parser | High (fixes core engine ingestion bug) | **SELECTED** |
| **2. External Real-Repo Validation Pilot** | High | WP8 report (limited external diversity n=4) | Medium | Low | Run engine against small external TS library | High (validates external applicability) | **SELECTED** |
| **3. Threshold Sensitivity & Blind-Spot Guidance** | Medium | fp-fn-analysis.md (5 FN blind spots documented) | Low | Low | Documentation artifact in experiments/wp9/threshold-guidance.md | High (explains limits without code bloat) | **SELECTED** |
| **4. Coverage Generation Friction Reduction (Caching)** | Medium | dx-operational.md (~4.96s test overhead) | Medium | Medium | Benchmark runtimes before/after caching | Medium (optional DX polish) | **DEFERRED (Hypothesis)** |
| **5. Monorepo / Multi-Package Coverage Aggregation** | Low-Medium | WP8 report (untested in monorepo layouts) | High | Medium | Multi-package workspace test suite | Low (unproven immediate demand) | **DEFERRED (Hypothesis)** |
| **6. Historical Risk Delta / Trend Analysis** | Low | None in WP8 | High | High | Time-series metrics storage | Low (adds storage/DB complexity) | **DEFERRED (Hypothesis)** |
| **7. Additional Language Support / DB Adapters** | Low | None in WP8 | High | High | Cross-language parser test suites | Low (violates single-purpose constraint) | **DEFERRED (Hypothesis)** |

## Evolution Delivered
- **Task 2 diagnosis**: CLI gap is correct per INV-01 (no unit test covers src/cli.ts), suffix match works, fix is docs not code hack, no src change, invariants preserved, reversible. Cite threshold-guidance.md §3.2 and repro.md diagnosis.
- **Task 3 external pilot**: Two external attempts (nanoid bnt, clsx JS/uvu) deferred due to coverage tooling mismatch, fallback local prototype hardening case valid (same 3 funcs as WP8 case 1, gate PASS, artifact 157230). Cite repro.md and external-pilot.json.
- **Task 4 threshold guidance**: Threshold sensitivity + 5 FN blind spots + operational friction documented, limitations carried forward.

## Verification
- npx tsc --noEmit clean (0 errors)
- npx vitest run --no-coverage 149/149 pass (56 test files)
- npm run build ok (0 errors)
- Contract 0.2.0 frozen, INV-01..04 preserved
- No new languages/DB/service, no CRAP change, no silent methodology change

## Claims/Evidence Matrix — update WP8 matrix with WP9 evidence:
Columns: Claim | Evidence | Confidence | Limitation
Rows:
- Contract stable: docs/contracts/evidence-contract.md (frozen, invariants INV-01..04 preserved) | High | None
- Installable: files:dist includes CLI binary; prepare script builds dist; installs via npm install (dx-operational.md §18) | High | None
- Threshold stable: docs/contracts/evidence-contract.md:38, src/rules.js default 30 | High | None
- Pilot executed: experiments/wp9/evidence/external-pilot.json (valid per contract 0.2.0), repro.md | Medium | External pilot fallback due to adapter mismatch
- FN blind spots documented: experiments/wp9/threshold-guidance.md §2 (5 categories with mitigations) | Medium | Complementary tools required, not implemented in engine
- Operational friction quantified: experiments/wp9/threshold-guidance.md §3 (caller-owned coverage burden ~4.96s, attribution gap details) | Medium | Burden still present, attribution gap fix in progress
- Usefulness: Still Low/Medium due to external pilot fallback (same limitation as WP8) | Low/Medium | External diversity still limited (fallback proves adapter mismatch, not broad usefulness)

## Limitations — Known (TS-only, Istanbul/V8, caller-owned coverage, monorepo untested, test quality vs quantity) vs New (external pilot fallback due to adapter mismatch — evidence that coverage-provider expansion needs per-repo validation)
| Limitation | Origin | Status |
|------------|--------|--------|
| TypeScript-only scope | Known (WP5) | Unchanged |
| Istanbul/V8 coverage dependency | Known (WP5) | Unchanged |
| Caller-owned coverage burden | Known (WP5) | Unchanged |
| Monorepo untested | Known (WP5) | Unchanged |
| Test quality vs. quantity | Known (WP5) | Unchanged |
| External repo validation deferred | New (WP8) | Pilot planned (WP9 Task 3) - fallback used due to coverage tooling mismatch |
| Small sample (n=4+1 from single repo) | New (WP8) | Statistical power limited |
| Skipped CLI functions (attribution gap) | New (WP8) | Fix planned (WP9 Task 2) - correct behavior per INV-01, requires unit test addition |

## Operational + DX delta from WP9 (threshold guidance reduces comprehension friction, but coverage burden still present)
- **Comprehension improved**: Threshold sensitivity analysis (threshold-guidance.md §1) enables operators to understand gate flips near boundary (e.g., CRAP 29→30 flip). FN blind spots table (threshold-guidance.md §2) sets clear expectations for required complementary tooling.
- **Coverage burden unchanged**: Caller still must generate coverage artifacts (~4.96s wall-clock per dx-operational.md). Attribution gap fix (once unit tests added) will improve CLI function participation but not reduce generation cost.
- **Actionability maintained**: Gate logic unchanged; PASS/WARN/null semantics preserved. Attribution gap fix increases signal density for CLI functions when unit tests exist.

## Recommended Next Steps — per Roadmap forks, evidence-backed, with hypothesis labeled:
- **CONTINUE WITH CONSTRAINTS still holds**: Reliability strong (zero false positives), deterministic behavior preserved, invariants maintained. Evidence-backed items executed without silent methodology changes.
- **Narrow next steps (evidence-backed)**:
  1. Add CLI unit tests to close attribution gap (fixes correct skipped behavior per INV-01, increases signal density)
  2. Attempt external pilot with vitest-native TS repo (e.g., tiny TS lib with explicit json reporter) to address coverage-tooling mismatch hypothesis
  3. Consider complementary tooling for FN blind spots (don't add to engine) - e.g., recommend Semgrep for security blind spot in docs
- **Defer (hypothesis without WP8/WP9 evidence)**:
  - Monorepo/multi-package coverage aggregation
  - Coverage generation caching / incremental coverage  
  - Historical delta analysis (CRAP trend over time)
  - Additional language support (JS, Python, Go)
  - Security/AST-pattern detection integrated into engine
  - Dependency blast radius quantification

## Gate Recommendation — PROPOSAL: CONTINUE WITH CONSTRAINTS (or STOP if evidence weak?) — justify: reliability strong, external diversity still limited (fallback proves adapter mismatch, not broad usefulness), no FP/FN dominate, threshold guidance reduces friction. Label as PROPOSAL awaiting human review.
**PROPOSAL: CONTINUE WITH CONSTRAINTS**
Justification:
- **Reliability strong**: Zero false positives observed across WP8/WP9, deterministic pass/fail behavior, all invariants INV-01..04 preserved
- **External diversity still limited**: External pilot attempts deferred due to coverage tooling mismatch, fallback to local prototype validates engine behavior but not broad applicability (evidence for hypothesis: coverage-provider expansion needs per-repo validation)
- **No FP/FN dominate**: WP8 showed zero false positives; FN blind spots documented and mitigated via complementary tools recommendation
- **Threshold guidance reduces friction**: Documentation enables operators to understand threshold sensitivity and make informed tuning decisions without code changes
- **Reversibility maintained**: All changes reversible via git revert (prioritization matrix, threshold guidance, repro log, evidence JSON - no src code modifications)

End with ```
AWAITING HUMAN REVIEW
```

## Provenance References — engine commit, Node, coverage artifact size, evidence contract, repro.md, prioritization.md, threshold-guidance.md, external-pilot.json
- Engine commit: ca7af83 feat(wp9): add prioritization matrix for evolution candidates
- Node version: v24.18.1
- Coverage artifact size: 157230 bytes (from external-pilot.json)
- Evidence contract: docs/contracts/evidence-contract.md (version 0.2.0, frozen)
- Reproducibility log: experiments/wp9/repro.md
- Prioritization matrix: experiments/wp9/prioritization.md
- Threshold guidance: experiments/wp9/threshold-guidance.md
- External pilot evidence: experiments/wp9/evidence/external-pilot.json

```
AWAITING HUMAN REVIEW
```