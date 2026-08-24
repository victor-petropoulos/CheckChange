# OpenCode Start Here

WP0: COMPLETE — GO WITH CONSTRAINTS  
WP1: COMPLETE — GO  
WP1.1: COMPLETE — VERIFIED  
WP2: COMPLETE — VERIFIED  
WP2.1: COMPLETE — VERIFIED  
WP3: COMPLETE — GO  
WP4: INCONCLUSIVE — FUNCTION DETECTION FAILURE  
WP4.1: COMPLETE — COMPOSE EXISTING PROVIDERS  
WP4.2: IMPLEMENTED  
WP4.2.1: COMPLETE — VERIFIED  
WP4R: INCONCLUSIVE — COVERAGE CONTRACT FAILED  
WP4R.1: **CURRENT**

## Read First

1. `docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md`
2. `docs/research/WP4R_DECISION_SUMMARY.md`
3. `docs/implementation/WP4R.1_COVERAGE_ARTIFACT_DISCOVERY.md`
4. `docs/implementation/WP4R.1_EXECUTION_PLAYBOOK.md`

## Current Assignment

Execute **WP4R.1 only**.

Research h3 and hono coverage artifact production. Do not change production code. Do not implement artifact discovery, new parsers, `--coverage-file`, test execution, or coverage generation.

Determine what the external coverage commands actually produce and identify the smallest viable Istanbul coverage contract.

Create `docs/research/WP4R.1_COVERAGE_ARTIFACT_DISCOVERY_RESULTS.md`.

End with exactly one:

- `KEEP EXACT ARTIFACT CONTRACT`
- `ADD EXPLICIT ISTANBUL PATH`
- `ADD ISTANBUL DISCOVERY`
- `RESEARCH MULTIPLE FORMATS`
- `STOP`

Then stop for human review.
