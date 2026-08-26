# WP5.1 --- Failure-Mode Inventory and Specification

## Objective

Discover and specify actual current behavior at source/evidence
boundaries before implementing anything.

## Candidate taxonomy

Investigate, without presuming defects:

-   changed executable lines but zero detected functions;
-   type/declaration-only changes;
-   added/deleted/renamed functions/files;
-   multiline declarations, arrows, methods, anonymous/nested functions,
    same-name functions;
-   complexity unavailable or range disagreement;
-   missing default/explicit coverage file;
-   malformed/non-Istanbul/empty coverage;
-   source absent from coverage;
-   path mismatch;
-   function absent from Istanbul fnMap;
-   zero/partial coverage;
-   exact, containment, overlapping, nested, adjacent, and ambiguous
    attribution;
-   mixed evaluable/NOT_EVALUATED functions;
-   analysisStatus vs completeness vs gate vs process exit;
-   deterministic ordering and diagnostics.

## Behavior matrix

For every approved mode record: stable ID, layer, exact condition,
current behavior, desired behavior, result class, gate impact, exit
semantics, diagnostic, existing test, fixture requirement, change
needed, and evidence.

Candidate result classes: `EVALUATED`, `NOT_EVALUATED`, `INCOMPLETE`,
`HARD_FAILURE`. WP5.1 must first determine how these concepts already
exist in code.

## Deliverables

Create under `experiments/wp5/wp5.1/`: -
`current-behavior-inventory.md` - `failure-mode-matrix.md` -
`fixture-requirements.md` - `WP5_1_FINDINGS.md`

## Acceptance

Implementation/tests inspected; WP4R observations reconciled; stable IDs
assigned; current vs desired behavior separated; fixture requirements
traceable; unresolved questions explicit; no production changes or WP5.2
fixtures.

## Stop

Human approval required before WP5.2.
