# WP5.4 --- Failure Semantics and Diagnostics

## DEPENDENCY / REVALIDATE

Reconcile against all approved WP5.1--WP5.3 findings.

## Objective

Ensure incomplete, unsupported, ambiguous, or malformed conditions
produce deterministic and truthful machine/human-readable semantics.

For each approved failure-mode ID validate: per-function state, analysis
status, completeness, gate, process exit, reason/diagnostic, JSON shape,
CLI stdout/stderr, and ordering.

Explicitly resolve distinctions such as: - missing evidence vs actual 0%
coverage; - NOT_EVALUATED vs hard failure; - INCOMPLETE vs analysis
failure; - advisory WARN vs error exit; - attribution ambiguity vs
source absence; - missing default coverage vs missing explicitly
supplied coverage.

Diagnostics should be deterministic, concise, specific, stable enough
for CI, and non-speculative. Prefer stable reason codes plus readable
messages if compatible with existing architecture; do not introduce an
elaborate framework without need.

## Deliverables

-   `experiments/wp5/wp5.4/failure-semantics-contract.md`
-   `diagnostic-matrix.md`
-   `WP5_4_RESULTS.md`
-   regression tests/documentation and approved minimal fixes.

## Acceptance

All approved IDs map to explicit semantics;
exit/status/completeness/gate are not conflated; missing evidence never
masquerades as zero; ambiguity never masquerades as numeric confidence;
diagnostics deterministic; boundaries preserved.

STOP before WP5 Final.
