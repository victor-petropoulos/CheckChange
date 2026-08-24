# OpenCode Start Here

## Current Status

WP0: COMPLETE — GO WITH CONSTRAINTS  
WP1: COMPLETE — GO  
WP1.1: COMPLETE — VERIFIED  
WP2: COMPLETE — VERIFIED  
WP2.1: COMPLETE — VERIFIED  
WP3: COMPLETE — GO  
WP4: COMPLETE — **INCONCLUSIVE**  
WP4.1: **CURRENT — RESEARCH/DECISION**

## Read First

1. `docs/research/WP4_USEFULNESS_VALIDATION_RESULTS.md`
2. `docs/research/WP4_DECISION_SUMMARY.md`
3. `docs/implementation/WP4.1_EVIDENCE_ACQUISITION_INVESTIGATION.md`
4. `docs/implementation/WP4.1_EXECUTION_PLAYBOOK.md`
5. `docs/research/WP4.1_FAILURE_SEMANTICS_QUESTIONS.md`

## Current Assignment

Execute WP4.1 research and controlled experiments only.

**Do not modify production source.**

Investigate:

- the current crap-typescript evidence boundary;
- externally generated coverage artifacts;
- existing deterministic function-level complexity providers;
- the smallest viable composition of existing evidence;
- correct failure semantics.

Create:

- `docs/research/WP4.1_EVIDENCE_ACQUISITION_FINDINGS.md`
- `docs/research/WP4.1_FAILURE_SEMANTICS_DECISION.md`
- `docs/research/WP4.1_EVIDENCE_BOUNDARY_DECISION.md`

The final decision must be exactly one of:

- `RETAIN CURRENT PROVIDER`
- `ADAPT PROVIDER BOUNDARY`
- `COMPOSE EXISTING PROVIDERS`
- `STOP`

Then stop for human review.

> This project consumes analysis. It does not perform analysis.
