# WP5 Robustness Validation Plan

## Status

**WP4R:** COMPLETE / ACCEPTED  
**WP5:** PLANNED — execution begins with WP5.1 after human approval.

## Purpose

WP5 validates the robustness of the current deterministic TypeScript changed-function CRAP pipeline at its source-structure, evidence, attribution, and failure-semantics boundaries.

WP4R established that the signal can produce sensible PASS/WARN outcomes on real changes within documented limits. WP5 asks a different question:

> Can the surrounding deterministic machinery be trusted when source structures and evidence become difficult, incomplete, ambiguous, or malformed?

The objective is not to make every function evaluable. The objective is to ensure the prototype never silently converts missing, ambiguous, unsupported, or malformed evidence into a trustworthy-looking CRAP result.

## Scope

WP5 remains focused on the current TypeScript prototype.

Cross-language generalization is deferred until after WP5 closure.

WP5 does not revisit the CRAP formula or default advisory threshold merely because different policy choices are possible. The current default threshold remains **30**.

## Architectural Boundaries Carried Forward from WP4R

Caller/CI remains responsible for producing compatible test/coverage evidence.

WP5 does not add:

- target-project test orchestration;
- automatic coverage discovery;
- coverage-provider abstraction;
- LCOV ingestion;
- target-project configuration mutation;
- LLM judgment inside deterministic evidence/rule decisions.

The prototype consumes evidence; it does not own evidence production.

## Work Packages

### WP5.1 — Failure-Mode Inventory and Specification

Inspect the actual implementation and tests, reconcile observed behavior with WP4R findings, and define:

- failure-mode taxonomy;
- current-behavior inventory;
- deterministic expected-behavior matrix;
- fixture requirements;
- unresolved questions.

No production implementation changes are authorized in WP5.1.

### WP5.2 — Deterministic Fixture Suite

Create minimal controlled fixtures covering the approved WP5.1 behavior contracts.

Synthetic fixtures are appropriate here because WP5.2 validates deterministic mechanics rather than real-world usefulness.

The fixture suite should make expected source, diff, complexity, coverage, CRAP, completeness, gate, exit behavior, and diagnostic outcomes inspectable and repeatable.

### WP5.3 — Coverage Attribution Correctness

Adversarially validate the highest-risk technical seam:

> Does the coverage attributed to a changed function actually belong to the same logical function whose complexity is being measured?

Expected areas include nested functions, callbacks, arrow functions, methods, same-name functions, adjacent/overlapping ranges, range mismatches, and ambiguous Istanbul candidates.

Ambiguous attribution must not silently become numeric confidence.

### WP5.4 — Failure Semantics and Diagnostics

Validate that incomplete, unsupported, ambiguous, and malformed situations produce deterministic and truthful semantics.

This includes clear distinctions among:

- EVALUATED vs NOT_EVALUATED;
- INCOMPLETE vs analysis failure;
- gate PASS/WARN vs process failure;
- missing evidence vs measured 0% coverage;
- attribution ambiguity vs source absence;
- default-path absence vs explicitly supplied invalid input.

Diagnostics should be stable enough for automation and specific enough for human investigation.

### WP5 Final — Integrated Robustness Verification and Closure

Run the approved WP5 fixture and regression suites as an integrated system, preserve evidence, assess acceptance criteria, and freeze the WP5 record.

## Acceptance Philosophy

WP5 should close only when:

- supported cases evaluate deterministically;
- unsupported or ambiguous cases decline safely;
- missing evidence is never synthesized;
- ambiguous coverage attribution cannot silently produce numeric CRAP;
- function complexity and coverage identity are trustworthy within supported scope;
- failure/completeness/gate/exit semantics are consistent and regression-tested;
- accepted defects have deterministic fixtures/tests;
- unresolved limitations are explicit;
- WP4R architectural boundaries remain preserved unless an explicit approved exception exists.

## Sequencing and Approval Gates

Each work package stops for human review.

Later work-package planning documents are intentionally prepared in advance, but they must be reconciled against earlier findings before execution.

If WP5.1 or later findings materially change assumptions in a downstream plan, update the downstream plan before proceeding.

## Deferred Work

Not part of WP5:

- Python/Java/C#/other language support;
- generalized multi-language parser architecture;
- test-runner orchestration;
- coverage generation;
- new coverage formats/providers;
- universal threshold optimization;
- LLM-based evidence repair or attribution.

## Evidence Location

Durable project/research rationale belongs under `docs/`.

Execution plans, fixtures, raw evidence, and work-package results belong under:

`experiments/wp5/`

## Expected Closure Artifacts

At completion, WP5 should produce:

- work-package specifications and findings;
- deterministic fixture manifest/results;
- attribution invariants/results;
- failure-semantics contract/results;
- `WP5_FINAL_RESULTS.md`;
- `WP5_CLOSURE.md`;
- `WP5_EVIDENCE_MANIFEST.md`.

Anything discovered after closure should become new work rather than silently rewriting the frozen WP5 evidence record.
