# WP5.3 Documentation Correction & Reconciliation Pass

## Status
WP5.3 implementation evidence: PASS  
WP5.3 closure: HOLD pending documentation reconciliation  
Production-code changes: NOT AUTHORIZED

## Purpose
Correct the WP5.3 research record so it accurately reflects the accepted WP5.2 taxonomy and the evidence in `WP5_3_RESULTS.md`.

This is a documentation-only pass. Do not change production code or alter the WP5.3 implementation.

## Required Corrections

### 1. Date
Correct the WP5.3 result date from `2025-08-26` to `2026-08-26`.

### 2. Failure-mode taxonomy
Do not reuse or redefine FM IDs without evidence from the authoritative WP5.2 record.

The current WP5.3 result incorrectly describes:
- FM-V01 as version/commit metadata attribution
- FM-D10 as diff-based attribution
- FM-G06 as git blame attribution
- FM-G07 as git log attribution

Resolve the discrepancy by consulting the authoritative WP5.2 defect-reproduction/results and decision/traceability records in the repository.

If the authoritative record confirms the earlier WP5.2 meanings, update WP5.3 accordingly. Do not invent replacement IDs.

### 3. WP5.4 routing
Correct the WP5.4 section so it routes the actual WP5.2-confirmed findings by their authoritative FM IDs.

If a routing item cannot be reconciled from repository evidence, mark it `UNRESOLVED — taxonomy reconciliation required` rather than guessing.

### 4. Untracked TypeScript limitation
The current result calls the `git ls-files` limitation acceptable.

Change that wording. Record:
- current behavior: only tracked TS files are added by the Git-based expansion;
- untracked/new TS files may remain outside the expanded discovery set;
- this is an unresolved product/analysis-contract question;
- no fix is authorized in this pass.

Do not assert that users should `git add` files as a product requirement unless explicitly supported by an authoritative project decision.

### 5. Preserve implementation evidence
Keep intact the successful evidence for FM-A08, FM-A07, FM-C03, the WP5.2 regression anchors, the WP5.3 adversarial tests, and the two-file production scope.

## Required Deliverables
Update the existing WP5.3 artifacts:
- `experiments/wp5/wp5.3/WP5_3_RESULTS.md`
- `experiments/wp5/wp5.3/defect-fix-record.md`
- `experiments/wp5/wp5.3/source-discovery-decision.md`
- `experiments/wp5/wp5.3/adversarial-case-matrix.md`
- `experiments/wp5/wp5.3/attribution-invariants.md`

Update the active WP5 decision log and traceability matrix.

Add:
`experiments/wp5/wp5.3/WP5_3_DOCUMENTATION_RECONCILIATION.md`

## Acceptance
- Date is correct.
- Every FM ID used in WP5.3 matches authoritative WP5.2 meaning.
- WP5.4 routing contains no invented/reused meanings.
- Untracked TS behavior is explicitly unresolved.
- WP5.3 implementation evidence remains intact.
- No production source files changed.
- No WP5.4 implementation begins.

## Stop Gate
After documentation reconciliation, STOP. Return the reconciled FM mapping, files changed, confirmation production code was untouched, and whether WP5.3 can now be formally closed.
