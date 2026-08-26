# OpenCode Execution Prompt — WP5.2
## Revised after WP5.1 approval

## Mission
Execute WP5.2 as an evidence-building/characterization pass against the frozen WP5.1 production baseline.

Read the approved WP5.1 inventory, matrix, fixture requirements, findings, repo-documentation audit, revised WP5.2 spec, decision log, and traceability matrix.

## Critical amendment
Do not follow the WP5.1 recommendation to `test.skip` P0 fixtures FR-A6, FR-A7, FR-V1, and FR-G3. All must execute as characterization tests asserting current behavior while separately recording desired behavior.

## Phase 1 — Revalidate
Verify WP5.1 artifacts, fixture count/IDs, and unchanged production baseline. If a material contradiction affects scope, document it and STOP.

## Phase 2 — Build fixtures
Implement all 23 approved fixtures, preserving IDs/priorities and FM traceability. Use minimal deterministic synthetic TypeScript/Istanbul evidence where appropriate. Do not invoke external target suites merely to manufacture fixture evidence.

## Phase 3 — Defect reproduction
Provide executable evidence for FM-A07, FM-C03, FM-A08, FM-V01, FM-D10/FM-G06, and FM-G07. Classify each CONFIRMED, REFUTED, or UNRESOLVED. Do not fix them.

## Phase 4 — Open questions
Resolve OQ-1, OQ-2, and OQ-7 with deterministic evidence where possible. Leave OQ-3, OQ-4, and OQ-6 as human decisions. Reconcile OQ-5 only from preserved evidence; do not rerun Apollo or reopen WP4R.

## Phase 5 — Regression anchors
Pin confirmed WP5.1 contracts, especially threshold equality, explicit/default missing coverage, UNSUPPORTED/no-function behavior, schema compatibility, threshold 30 default, ordering, and coverage dedup.

## Phase 6 — Outputs
Create under `experiments/wp5/wp5.2/`:
- fixture corpus/tests
- `fixture-manifest.md`
- `coverage-matrix.md`
- `open-question-results.md`
- `defect-reproduction-results.md`
- `WP5_2_RESULTS.md`

Update decision log and traceability matrix.

## Hard constraints
No production fixes, skipped P0s, threshold changes, cross-language work, orchestration/provider abstraction, new coverage formats, LLM judgment, WP4R reopening, or WP5.3 work.

## Stop
STOP after characterization evidence. Return fixture counts/status, P0 status, defect classifications, OQ results, contract contradictions, files changed, confirmation production untouched, and recommended WP5.3/WP5.4 authorization scope.
