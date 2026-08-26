# WP5 Master Plan --- Robustness and Failure-Mode Validation

## Status

**WP4R:** COMPLETE / ACCEPTED\
**WP5:** PLANNED --- not yet executed.

## Purpose

Validate that the deterministic TypeScript changed-function CRAP
pipeline behaves safely, predictably, and explainably when source
structure or evidence is incomplete, ambiguous, malformed, or difficult
to attribute.

## Core principle

The goal is not to make every function evaluable. The prototype must
never silently convert missing, ambiguous, unsupported, or malformed
evidence into a trustworthy-looking CRAP result.

## Frozen boundaries

Caller/CI owns test execution and coverage generation. WP5 does not add
automatic coverage discovery, provider orchestration, LCOV, target
configuration mutation, cross-language support, or LLM judgment in the
deterministic pipeline.

## Work packages

### WP5.1 --- Failure-Mode Inventory and Specification

Inspect current implementation/tests and define the failure-mode
taxonomy, behavior matrix, fixture requirements, and unresolved
questions. No production changes.

### WP5.2 --- Deterministic Fixture Suite

Build controlled fixtures for the approved WP5.1 contracts. Synthetic
fixtures are appropriate because this stage validates mechanics, not
usefulness.

### WP5.3 --- Coverage Attribution Correctness

Adversarially prove that attributed coverage belongs to the same
function whose complexity is measured, or explicitly decline evaluation
when ambiguous.

### WP5.4 --- Failure Semantics and Diagnostics

Verify NOT_EVALUATED, INCOMPLETE, hard-failure, gate, exit-code, and
diagnostic behavior is deterministic and truthful.

### WP5 Final --- Integrated Verification and Closure

Run the approved fixture/regression suite, preserve evidence, assess
acceptance criteria, and freeze WP5.

## Sequencing rule

Later documents were drafted before earlier findings exist. Before each
later stage, reconcile its assumptions against all approved prior
results. If findings materially change the plan, update that stage and
stop for approval.

## Non-goals

No threshold tuning, language expansion, test orchestration, coverage
framework expansion, or "make everything evaluable" mandate.
