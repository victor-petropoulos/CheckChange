# OpenCode Execution Prompt — WP5.3
## Revised after WP5.2 acceptance

## Mission
Fix only:
1. FM-A08 — suffix-collision wrong-file attribution
2. FM-A07 — container-method attribution mismatch
3. FM-C03 — silent source-root blind spot

Treat FM-A08 as highest priority.

## Read first
Approved WP5.1/WP5.2 artifacts, defect results, open-question results, decision log, traceability matrix, and revised WP5.3 spec.

## Phase 1
Re-run relevant characterization fixtures and preserve baseline defective behavior before edits.

## Phase 2
Create `experiments/wp5/wp5.3/attribution-invariants.md` covering same-function identity, wrong-file prohibition, ambiguity refusal, order independence, deterministic container identity, and explicit missing/unsupported discovery.

## Phase 3 — FM-A08
Extend FR-A7 for:
- colliding suffix paths
- reversed coverage-map order
- exact-path control

Implement the smallest fix that guarantees correct source identity or explicit non-attribution.

## Phase 4 — FM-A07
Using OQ-1 evidence, test:
- class method
- object method
- same raw method name in different containers
- top-level function

Implement the smallest identity fix satisfying all cases.

## Phase 5 — FM-C03
Create `source-discovery-decision.md`. Compare expand, detect/surface, and hybrid approaches with deterministic fixtures for `src/` and non-`src` changed TS. Select the narrowest safe contract, then implement it.

## Phase 6 — Regression
Run all WP5.2 fixtures, all new WP5.3 adversarial tests, and relevant existing regressions.

## Outputs
Create:
- `attribution-invariants.md`
- `adversarial-case-matrix.md`
- `source-discovery-decision.md`
- `defect-fix-record.md`
- `WP5_3_RESULTS.md`

Update decision log and traceability matrix.

## Hard constraints
Do not modify FM-V01, FM-D10, FM-G06, or FM-G07. No threshold, CRAP, provider, orchestration, language, or LLM changes.

## Stop
STOP after WP5.3. Report before/after evidence for A08/A07, chosen C03 contract, code/files changed, regression counts, unresolved limitations, confirmation WP5.4-only issues untouched, and recommended WP5.4 scope.
