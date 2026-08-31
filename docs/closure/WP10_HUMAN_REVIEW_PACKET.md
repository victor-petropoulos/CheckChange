# WP10 Human Review Packet

## 1. Header
**Date:** 2026-08-30  
**Status:** WP10 CAPABILITY DEFINITION COMPLETE — AWAITING HUMAN REVIEW  
**Engine baseline commit:** bd6bb3e + prior 2972e5e/efe2fd7  
**Test results:** 178/178 pass (59 files)  
**Schema:** 0.2 frozen  
**Threshold:** 30/15 frozen  
**Invariants:** INV-01..04 preserved  
**Node version:** 24.18.1  
**Source tree:** src/ clean  

## 2. What WP10 Delivered
Reference: `docs/10_WP10_CAPABILITY_DEFINITION.md` (269 lines, 9 sections, doc-only, no src change)

**§1 Problem Statement (lines 1-15):** Change-risk triage at review/CI time. Engine consumes caller-provided evidence (git diff, complexity via crap-typescript, Istanbul JSON coverage) and produces function-level CRAP scores with PASS/WARN gate outcomes. Separates deterministic evidence from judgment. Makes no autonomous risk judgment, no defect prediction, does not replace human review.

**§2 Target User / Use Case (lines 16-45):** 
- Solo developer: Local pre-push check ("did I introduce high-CRAP changes?")
- Team reviewer: PR review aid (prioritize functions with high CC + low coverage)
- CI gate operator: Automated gate (exit 1 on WARN, exit 0 on PASS, machine-readable JSON)
- Engram auditor: Independent deterministic evidence to cross-check LLM reasoning
Smallest workflow: PR → git diff → run tests → generate Istanbul JSON coverage → deterministic engine → JSON/CLI output → CI gate + reviewer report → human/LLM interprets evidence

**§3 Evidence Consumed vs Produced + Refusals (lines 46-85):**
Consumed: Git change intervals, cyclomatic complexity, Istanbul JSON coverage, file paths, provenance (base/target SHAs), config (crapThreshold)
Produced: Changed functions (file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, source), rule results, gate (PASS|WARN|null), completeness, analysis status, provenance
Explicit refusals: Defect prediction, autonomous risk judgment, replacement of human review, universal language support, universal coverage-provider compatibility, universal monorepo support, historical per-commit coverage claim, overall project-risk score, real-time IDE integration, auto test generation, LLM classification, ML prediction, dashboards, cloud hosting, telemetry

**§4 Supported-Claim Matrix C1–C24 (lines 86-135):** Narrowed from WP9 to product-scoped claims (TS, Istanbul JSON, Node 24.18.1, schema 0.2, threshold 30/15). Examples: 
- C1: Deterministic changed-function detection (git diff → intervals) - TS, git CLI, Node 24.18.1
- C3: Complexity measurement (CC via crap-typescript) - TS-only
- C4: Coverage ingestion (Istanbul JSON caller-owned) - Caller emits json; Rush needs jest.custom.json
- C19: Monorepo behavior - 1 monorepo (tsdoc Rush), 1 diff
- C22: Language diversity - TS-only throughout

**§5 Non-Goals (lines 136-140):** Universal language support, every coverage provider, every CI provider, every monorepo architecture, full historical analysis (per-commit coverage), real-time IDE integration, automated test generation, LLM-based risk classification, machine-learning risk prediction, overall project-risk score, enterprise dashboards, cloud-hosted analysis, telemetry.

**§6 Success Metrics (lines 141-155):** Integration cost (setup steps, path handling), developer experience (comprehension, trust), review usefulness (WARN prioritization vs manual review), runtime cost (engine execution time), operational reliability (failure modes, reproducibility), reproducibility (same inputs → same outputs), explainability (shows ingredients: CC, coverage, CRAP, threshold).

**§7 Product-Shape Decision A/B/C (lines 156-185):**
A. Standalone deterministic risk engine: Pros (simple boundary, independently useful), Cons (may become isolated tool)
B. Engram capability: Pros (strong evidence/interpretation separation), Cons (couples to Engram, premature)
C. Both: Standalone with Engram adapter: Pros (deterministic component testable), Cons (maintaining two interfaces)
Recommendation: Prefer C long-term, A as immediate next. Evidence: Provider n=3 validates standalone; monorepo 55× works; integration burden (4.96s caller-owned coverage) is immediate UX blocker.

**§8 Prioritized Research Questions RQ1–RQ6 (lines 186-215):**
RQ1: Can CI reliably feed evidence? (Integration burden 4.96s, path rebasing, jest.custom.json)
RQ2: Is TS sufficient for target users? (Language breadth strategic value)
RQ3: Is historical per-commit coverage required? (R8 partial - complexity real, coverage reused)
RQ4: Do reviewers value WARN signal? (No independent human-usefulness evidence)
RQ5: Does monorepo attribution generalize? (1 Rush repo, 1 diff)
RQ6: Can provider format expand beyond Istanbul JSON? (Contract is Istanbul JSON)

**§9 Provisional Next Branch (lines 216-269):** Highest-priority next: WP11/12 — Integration Validation. Rationale: Immediate UX blocker is caller-owned coverage burden (4.96s, path rebasing via F-03, jest.custom.json friction). WP9 demonstrated engine works deterministically; gap is whether CI systems can reliably feed it evidence and consume output. Decision tree: WP9 CLOSED → WP10 Definition → Integration biggest gap? → WP11/12 (production contract + real integration validation).

## 3. Verification Evidence (observed 2026-08-30)
- `tsc --noEmit`: 0 errors
- `npm run build`: ok, dist/cli.js produced
- `vitest`: 178/178 pass (59 files), 3.49s
- `git diff src/`: clean (no changes)

## 4. Frozen Contract Reaffirmed
- Schema: 0.2 (docs/contracts/evidence-contract.md)
- Threshold: 30/15 (evidence-contract.md:38 + src/rules.ts)
- INV-01: ZERO≠NULL (evidence.ts/coverage.ts)
- INV-02: MISSING≠MALFORMED (coverageErrorReason distinct)
- INV-03: GIT≠REPO (capabilities truthful)
- INV-04: ANALYZER TRUTHFUL (analyzerStatus passed/skipped/failed per function)
- CRAP formula: CC²×(1-cov)³+CC unchanged
- No new language/provider/schema introduced

## 5. Known Limitations Carried from WP9 (7 items)
1. Historical per-commit coverage not validated (R8 reuse 1.62M)
2. Single monorepo Rush 1 diff
3. Provider n=3 Istanbul-family only
4. TS-only
5. Caller burden 4.96s (threshold-guidance.md §3)
6. Small sample n=3
7. Performance upper bound not probed beyond 1.62M

## 6. What is NOT Proven by WP10
- Doc-only, no new implementation validation
- Integration cost, DX, review usefulness, FP/FN still unmeasured
- Engram coupling unvalidated
- Historical coverage requires Node 20.9 fresh experiment
- Language expansion requires adapter prototype

## 7. Open Decisions for Human (cite Roadmap forks)
- Fork A: WP11/12 integration
- Fork B: WP14 historical/delta
- Fork C: WP13 language
- Fork D: WP15 usefulness study
- Fork E: Narrow/stop
WP10 recommends WP11/12 but DEFERS to human per EXECUTION GUIDANCE: "When next step depends on strategic choice: STOP AT GATE AND ASK."

## 8. Next Gate Definition
HUMAN REVIEW must return one of:
- CONTINUE (proceed WP11/12 as recommended)
- CONTINUE WITH CONSTRAINTS (proceed with modified scope/constraints)
- STOP (halt/narrow)
No code changes authorized until gate.

## 9. Reproducibility
**Docs to read for human:**
- WP10 doc: docs/10_WP10_CAPABILITY_DEFINITION.md
- WP9 closure record: experiments/wp9-hardening-round8/WP9_CLOSURE_RECORD.md
- WP9 cumulative assessment: experiments/wp9-hardening-round8/wp9-cumulative-closure-assessment-through-round8.md
- Threshold guidance: docs/threshold-guidance.md
- DX operational: docs/dx-operational.md
- History delta: experiments/wp9-hardening-round8/repro-history-delta.md

**Commands to re-verify:**
- `tsc --noEmit` (0 errors)
- `npm run build` (success)
- `vitest` (178/178 pass)
- `git diff src/` (clean)

```text
AWAITING HUMAN REVIEW
```