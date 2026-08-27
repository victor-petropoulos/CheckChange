# OpenCode Prompt — Prepare WP5.4, Do Not Execute

## Mission

Prepare the WP5.4 implementation plan and test matrix while WP5.3 documentation reconciliation is still in progress.

**Do not modify production code.**

This is a planning/inspection pass only.

## Read First

Read:

1. authoritative WP5.2 results and defect-reproduction artifacts;
2. WP5.2 decision log and traceability matrix;
3. current WP5.3 results;
4. WP5.3 documentation reconciliation artifacts when present;
5. active WP5 decision log and traceability matrix;
6. `WP5_4_SPEC_PROVISIONAL.md`.

## Gate 1 — Taxonomy Reconciliation

Before assigning any FM ID to WP5.4, verify its meaning from the authoritative WP5.2/WP5.3 records.

Build:

`experiments/wp5/wp5.4/wp5_4_taxonomy_reconciliation.md`

Use:

| FM ID | Authoritative meaning | Evidence artifact | WP5.4 scope | Status |
|---|---|---|---|---|

If any FM ID cannot be reconciled, mark it `BLOCKED` and do not guess.

## Gate 2 — Inspect Current Implementation

For each reconciled WP5.4 finding:

- identify current production path;
- identify public/CLI boundary;
- identify existing tests;
- identify current internal status;
- identify current exit-code behavior;
- identify current diagnostic text/JSON;
- identify caller expectations.

Do not change code.

## Gate 3 — Characterization Plan

Create:

`experiments/wp5/wp5.4/characterization-plan.md`

For every finding define:
- reproduction command/input;
- expected current behavior;
- observed behavior;
- exact evidence to capture;
- proposed regression fixture;
- contract question, if any.

## Gate 4 — Status Contract

Create:

`experiments/wp5/wp5.4/status-contract.md`

Do not invent semantics. Reconcile existing status values from source/tests/schema.

Explicitly distinguish:
- success;
- warning;
- incomplete;
- failure;
- unsupported;
- missing evidence where applicable.

## Gate 5 — CLI Contract

Create:

`experiments/wp5/wp5.4/cli-contract.md`

Document the relationship between:
- internal status;
- JSON status;
- human-readable diagnostic;
- exit code.

Identify contradictions without fixing them.

## Gate 6 — Implementation Plan

Create:

`experiments/wp5/wp5.4/implementation-plan.md`

For each authorized finding:
- smallest likely code location;
- tests required;
- regression risk;
- non-goals;
- acceptance criteria.

Do not implement.

## Hard Constraints

Do not:
- modify production source;
- modify tests to make them pass;
- change thresholds;
- change CRAP arithmetic;
- change attribution/source discovery;
- add providers/formats/languages;
- add LLM judgment;
- start WP5.4 implementation;
- start WP6.

## Output

Return:
1. reconciled FM mapping;
2. files inspected;
3. current behavior for each finding;
4. characterization plan;
5. unresolved contract questions;
6. proposed implementation scope;
7. confirmation that no production code changed.

STOP.
