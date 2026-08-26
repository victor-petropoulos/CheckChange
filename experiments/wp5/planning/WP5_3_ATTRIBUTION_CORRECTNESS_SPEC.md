# WP5.3 --- Coverage Attribution Correctness

## DEPENDENCY / REVALIDATE

Reconcile with approved WP5.1/WP5.2 results before execution.

## Objective

Prove that coverage attributed to a changed function belongs to the same
logical function whose complexity is measured, or explicitly decline
evaluation when attribution is ambiguous.

## Candidate invariants

Refine from prior findings: 1. attribution deterministic; 2. stronger
identity/range evidence outranks weaker containment; 3. nested functions
do not inherit parent/child coverage incorrectly; 4. same-name functions
in different scopes remain distinguishable; 5. ambiguity never silently
selects an arbitrary candidate; 6. path normalization cannot map another
source file; 7. coverage absence is not treated as measured 0%; 8.
complexity and coverage refer to the same function identity; 9. Istanbul
map ordering cannot change attribution.

## Adversarial cases

Nested named/arrow/anonymous functions; class/object methods; same-name
scopes; adjacent functions; overlapping/off-by-one ranges; multiline
signatures; declaration-only changes; multiple Istanbul candidates;
reordered fnMap entries, as supported by prior findings.

## Deliverables

-   `experiments/wp5/wp5.3/attribution-invariants.md`
-   `adversarial-case-matrix.md`
-   `WP5_3_RESULTS.md`
-   regression tests and narrowly approved fixes if defects are
    confirmed.

## Acceptance

All approved invariants tested; ambiguity cannot yield arbitrary numeric
CRAP; nested/same-name/order independence covered; fixes trace to
failing cases; no provider/test orchestration.

STOP before WP5.4.
