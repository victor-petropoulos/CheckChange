# OpenCode Prompt --- WP5.1

Perform WP5.1 discovery/specification only.

Inspect production code, tests, CLI/output schemas, changed-function
detection, complexity integration, coverage ingestion/attribution, CRAP
calculation, gate/completeness semantics, and relevant frozen WP4R
evidence.

Map current behavior before specifying desired behavior. Build stable
failure-mode IDs. Separate confirmed behavior, existing contracts,
genuine gaps, apparent defects, and unresolved cases.

Create under `experiments/wp5/wp5.1/`: -
`current-behavior-inventory.md` - `failure-mode-matrix.md` -
`fixture-requirements.md` - `WP5_1_FINDINGS.md`

Do not change production code, create WP5.2 fixtures, change thresholds,
expand languages, add orchestration, or use LLM inference to fill
missing evidence.

STOP at the WP5.1 approval gate. Report files, failure-mode count,
defects, contract gaps, unresolved questions, proposed fixture count,
and confirmation production code was untouched.

## Repository-Level Documentation Audit
Follow `WP5_REPO_LEVEL_DOCUMENTATION_INTEGRATION.md`. Inspect authoritative higher-level roadmap/status, architecture, experiment index, decision-history, README, and agent-guidance files.

Create `experiments/wp5/wp5.1/repo-documentation-audit.md`.

Do not invent duplicate authoritative documents. Make only unambiguous documentation-only transition updates; otherwise propose exact changes for approval. Verify appropriate durable documentation reflects WP4R closure, WP5 activation, the evidence-production boundary, and retention of threshold 30 as default.
