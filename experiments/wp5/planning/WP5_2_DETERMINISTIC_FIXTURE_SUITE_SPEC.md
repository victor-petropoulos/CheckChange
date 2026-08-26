# WP5.2 — Deterministic Fixture Suite
## Revised after WP5.1 approval

**WP5.1:** ACCEPTED  
**WP5.2:** READY FOR EXECUTION  
**Production fixes:** NOT AUTHORIZED

## Basis
WP5.1 catalogued 37 failure modes, 6 apparent defect candidates, 12 diagnostic/truthfulness gaps, 7 unresolved questions, and 23 proposed fixtures (4 P0, 9 P1, 10 P2).

## Governing amendment
Do **not** put P0 fixtures behind `test.skip`.

All 23 approved fixtures must execute. For suspected defects, create characterization/defect-reproduction tests that assert actual current behavior while separately recording desired behavior. A test may therefore pass by accurately reproducing a defect. WP5.3/WP5.4 may later change expectations after fixes are authorized.

## Apparent defects to reproduce
- FM-A07 — container-method attribution key mismatch — CRITICAL
- FM-C03 — source-root blind spot — HIGH
- FM-A08 — suffix-collision path attribution — MEDIUM
- FM-V01 — coverage capability mislabel — LOW
- FM-D10 / FM-G06 — CLI message inaccuracies — LOW
- FM-G07 — analyzerStatus hardcoded `passed` — LOW

Classify each `CONFIRMED`, `REFUTED`, or `UNRESOLVED` from executable evidence.

## P0 fixtures
FR-A6, FR-A7, FR-V1, and FR-G3 must execute. Record linked FM ID, suspected defect, current expectation, desired expectation, actual result, and defect status.

## Open questions
Resolve empirically where possible:
- OQ-1 container/function naming behavior;
- OQ-2 anonymous arrow/IIFE/default-export naming;
- OQ-7 source-root/tsconfig behavior.

Keep as human policy/schema decisions:
- OQ-3 UNSUPPORTED exit semantics;
- OQ-4 diagnostic policy;
- OQ-6 coverageArtifact contract when default coverage is absent.

OQ-5 is historical reconciliation. Investigate only from preserved evidence; do not rerun Apollo or reopen WP4R.

## Regression anchors
Preserve approved WP5.1 contracts including threshold equality PASS, explicit-missing vs default-missing coverage semantics, UNSUPPORTED/no-function semantics, schema compatibility, threshold 30 default, deterministic ordering, and coverage dedup.

## Deliverables
Under `experiments/wp5/wp5.2/` create:
- fixture corpus and automated tests
- `fixture-manifest.md`
- `coverage-matrix.md`
- `open-question-results.md`
- `defect-reproduction-results.md`
- `WP5_2_RESULTS.md`

Update the WP5 decision log and traceability matrix.

## Production-code freeze
Do not fix production behavior in WP5.2. Test/fixture code and evidence documents are authorized. If a fixture requires a production change merely to execute, document the blocker rather than fixing the product.

## Acceptance
All 23 fixtures implemented or specifically blocked; P0s execute; suspected defects classified; empirical questions answered where evidence permits; policy questions remain explicit; contracts regression-anchored; traceability complete; production code untouched.

## Stop
STOP after WP5.2 evidence. Do not fix defects or begin WP5.3.
