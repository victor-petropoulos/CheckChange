# OpenCode Prompt --- WP5.4

Read/reconcile all approved WP5.1--WP5.3 artifacts. If this draft
conflicts materially with established semantics, revise the WP5.4 plan
and STOP for approval.

For every approved failure-mode ID verify per-function state, analysis
status, completeness, gate, exit code, diagnostic, and JSON/CLI
behavior.

Add regression tests for missing evidence vs 0%, NOT_EVALUATED vs hard
failure, INCOMPLETE vs failure, WARN vs error exit, and ambiguity vs
source absence.

Make minimal production changes only where prior approved contracts
establish a defect.

Produce `failure-semantics-contract.md`, `diagnostic-matrix.md`,
`WP5_4_RESULTS.md`, tests/docs, and approved fixes.

STOP at WP5.4 review gate. Do not begin final closure automatically.
