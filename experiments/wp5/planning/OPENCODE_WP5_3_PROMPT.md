# OpenCode Prompt --- WP5.3

Read approved WP5.1/WP5.2 results. If they materially change this
draft's assumptions, revise WP5.3 and STOP for approval.

Formalize approved attribution invariants and adversarially test nested,
arrow, anonymous, method, same-name, adjacent, overlapping,
range-mismatch, ambiguous, and map-order cases as applicable.

Prove correct attribution or explicit refusal to evaluate. Preserve
failing evidence before fixes. Make only narrowly justified fixes with
regression tests.

Do not add coverage formats/provider abstraction, run target tests
inside the prototype, use LLM judgment, or silently choose among
ambiguous candidates.

Produce `attribution-invariants.md`, `adversarial-case-matrix.md`,
`WP5_3_RESULTS.md`, tests, and approved minimal fixes.

STOP at WP5.3 review gate.
