# WP4.1 — Evidence Acquisition and Failure Semantics Investigation

## Status

**CURRENT — RESEARCH/EXPERIMENT ONLY**

No production changes are authorized.

## Purpose

Determine the smallest reliable deterministic evidence boundary for real TypeScript repositories after WP4 showed that the current end-to-end analyzer integration is not portable enough to test usefulness.

## Primary Question

> What is the smallest reliable way to obtain function-level complexity and coverage evidence from real TypeScript projects without this project becoming responsible for understanding and orchestrating every project's test environment?

## Secondary Question

> How must the prototype represent evidence-acquisition failure so that a broken or unsupported analysis can never resemble a clean PASS?

## Governing Principle

> This project consumes analysis. It does not perform source-code analysis unless a tiny deterministic calculation is demonstrably the simpler and safer boundary.

A CRAP arithmetic calculation from already-established CC and coverage values is not automatically considered a source analyzer. WP4.1 must still justify any such boundary before implementation.

## WP4 Evidence That Motivates This Work

WP4 found:

- target repositories do not necessarily have `@barney-media/crap-typescript` installed;
- the current `--no-install` approach requires manual analyzer installation;
- `crap-typescript` coverage execution failed on zod and zustand;
- p-limit was unsuitable because implementation changes were JavaScript rather than TypeScript;
- zero functions were evaluated across all nine cases;
- analyzer failure could still coexist with `gate: PASS` and `completeness: COMPLETE`.

WP4.1 must investigate these issues rather than patching them one at a time.

## Investigation Tracks

### Track A — Current crap-typescript Boundary

Document exactly what `@barney-media/crap-typescript@0.5.0` owns.

Determine from source/documentation and controlled experiments:

- how it obtains function boundaries;
- how it obtains cyclomatic complexity;
- how it obtains coverage;
- which coverage formats it consumes internally;
- whether coverage collection can be disabled;
- whether an existing coverage artifact can be supplied;
- whether it can emit CC/CRAP when coverage is unavailable;
- why coverage-command failure becomes analyzer failure rather than unavailable coverage;
- what assumptions it makes about package managers/test runners;
- whether invoking a pinned package outside the target repo is viable without modifying the target.

Do not modify our production integration during this track.

### Track B — External Coverage Artifact

Investigate whether function-level evidence can be built from a coverage artifact the target project already knows how to generate.

Research common deterministic artifacts, especially:

```text
LCOV
Istanbul/nyc JSON
coverage-final.json
Vitest/Istanbul-compatible JSON
```

Determine:

- whether line/statement coverage can be mapped reliably to analyzer-provided function ranges;
- whether this can be done without parsing TypeScript source;
- whether branch/function coverage is necessary for the CRAP formula we use;
- what happens when coverage exists only for some lines/functions;
- whether common tools already expose the required function-level mapping.

The project must not start inventing a new coverage engine.

### Track C — Independent Complexity + Coverage Inputs

Investigate a composition such as:

```text
Git
  -> changed intervals

existing deterministic complexity provider
  -> function range + CC

existing coverage artifact/provider
  -> coverage

tiny deterministic arithmetic
  -> CRAP
```

The CRAP calculation itself is:

```text
CRAP = CC^2 * (1 - coverage)^3 + CC
```

where coverage is represented as a fraction for the calculation.

Investigate existing tools/libraries capable of producing function-level CC and source ranges for TypeScript/JavaScript.

Prefer mature, deterministic, machine-readable outputs.

Do not implement a TypeScript parser, AST walker, complexity algorithm, or coverage algorithm.

### Track D — Failure Semantics

Design a state model that distinguishes at least:

```text
ANALYZED
NO_RELEVANT_FUNCTIONS
PARTIAL_EVIDENCE
UNSUPPORTED
PROVIDER_FAILED
```

The exact names may change.

The model must answer:

1. When is `gate: PASS` legitimate?
2. When may completeness be `COMPLETE`?
3. What should happen when the evidence provider fails?
4. What should happen when changed TypeScript exists but no functions are emitted?
5. What should happen for unsupported JavaScript changes in a TypeScript-only prototype?
6. Should provider failure produce JSON evidence plus a non-zero process exit?
7. Should a run have a separate `analysisStatus` independent of `gate` and `completeness`?

Preferred direction to evaluate:

```json
{
  "analysisStatus": "FAILED",
  "gate": null,
  "completeness": "INCOMPLETE"
}
```

rather than:

```json
{
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

when the analyzer did not run successfully.

Do not adopt the preferred shape without evaluating compatibility with the current envelope.

## Required Comparative Matrix

Create a matrix comparing at least:

| Approach | Owns test execution? | Requires target install? | Function CC | Function ranges | Coverage input | Portable | Custom analysis required | Main risk |
|---|---|---|---|---|---|---|---|---|
| A. crap-typescript current | | | | | | | | |
| B. crap-typescript + external coverage | | | | | | | | |
| C. independent deterministic providers | | | | | | | | |

Add alternatives only when research shows they are credible.

## Controlled Experiments

WP4.1 may create disposable experiments under:

`experiments/wp4.1/`

Experiments may:

- inspect analyzer output;
- generate/read existing standard coverage artifacts;
- invoke candidate deterministic tools;
- test whether candidate outputs contain required fields;
- use small fixtures;
- use one or more real repositories for compatibility checks.

Experiments must not modify production source under `src/`.

## Repository Selection for Experiments

Do not choose only repositories known to work with crap-typescript.

For focused technical experiments, it is acceptable to reuse zod/zustand because their failures are known and reproducible.

If another repository is needed, verify that it contains actual TypeScript implementation source before selection.

## Required Decision Criteria

A viable evidence boundary should:

1. remain deterministic;
2. avoid LLM participation;
3. avoid custom source analysis;
4. avoid requiring this project to understand every test runner;
5. work from machine-readable evidence;
6. preserve unavailable evidence honestly;
7. be practical to bundle/distribute;
8. require little or no modification of target repositories;
9. support reproducible local/CI execution;
10. remain small enough for the project's research/prototype intent.

## Explicit Non-Goals

Do not:

- implement a replacement analyzer;
- add multi-language support;
- add JavaScript support merely because p-limit was unsuitable;
- add lint/typecheck/security/test evidence;
- implement baseline/delta;
- change CRAP thresholds;
- add CI integrations;
- add plugin/provider architecture;
- modify WP3 rule behavior;
- select repositories merely to make the prototype look successful.

## Required Deliverables

Create:

```text
experiments/wp4.1/
  README.md
  raw/
  notes/

docs/research/
  WP4.1_EVIDENCE_ACQUISITION_FINDINGS.md
  WP4.1_FAILURE_SEMANTICS_DECISION.md
  WP4.1_EVIDENCE_BOUNDARY_DECISION.md
```

## Final Decision

`WP4.1_EVIDENCE_BOUNDARY_DECISION.md` must end with exactly one:

```text
RETAIN CURRENT PROVIDER
ADAPT PROVIDER BOUNDARY
COMPOSE EXISTING PROVIDERS
STOP
```

Meaning:

### RETAIN CURRENT PROVIDER

`crap-typescript` can remain the end-to-end evidence provider with only deployment/configuration changes.

### ADAPT PROVIDER BOUNDARY

`crap-typescript` remains important, but its responsibility should be narrowed, for example by consuming externally generated coverage or by using only part of its output.

### COMPOSE EXISTING PROVIDERS

The cleaner solution is to combine existing deterministic complexity and coverage evidence and perform only the small CRAP arithmetic ourselves.

### STOP

No sufficiently small, portable deterministic evidence boundary was found.

Then stop for human review.

No production implementation is authorized by WP4.1.
