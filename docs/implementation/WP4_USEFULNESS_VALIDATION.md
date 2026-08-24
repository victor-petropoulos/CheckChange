# WP4 — Real-Repository Usefulness Validation

## Purpose

Determine whether the existing WP3 prototype is useful on real TypeScript changes before adding more features.

WP4 is an experiment, not a product-development work package.

## Core Question

> Does changed-function CRAP evidence, interpreted through the current advisory rule, tell a developer something useful enough to justify continuing this project?

## Critical Constraint

**Do not change production behavior during WP4.**

The subject under test is the WP3 tool exactly as it exists now.

If a repository exposes a limitation, record the limitation. Do not immediately engineer around it.

## What WP4 Is Testing

WP4 evaluates:

1. **Applicability** — can the tool run successfully on ordinary TypeScript repositories?
2. **Coverage/completeness** — how often are changed functions actually evaluable?
3. **Signal quality** — do WARN findings identify code that appears worthy of attention?
4. **Noise** — do warnings feel arbitrary or unhelpful?
5. **Interpretability** — can a developer understand the finding from CRAP, CC, coverage, and threshold?
6. **Change focus** — does limiting analysis to changed functions keep output manageable?
7. **Operational friction** — how much project-specific setup is required?

## Repository Selection

Use a small, deliberately varied sample.

Target **3 repositories** initially.

Prefer repositories that:

- are public and open source;
- are primarily TypeScript;
- use npm-compatible installation;
- contain automated tests and coverage-capable tooling;
- have enough non-trivial functions to exercise the analyzer;
- have accessible Git history;
- are small/medium enough to run locally without special infrastructure.

Avoid selecting three nearly identical repositories.

Suggested diversity:

```text
Repository A — small library/package
Repository B — medium application/tool
Repository C — structurally different TypeScript project
```

Do not select repositories because they are expected to produce high CRAP scores.

Selection must happen before observing WP4 results.

Record exact repository URL, commit, license, install command, and why it was selected.

## Change Selection

For each repository, evaluate **3 historical changes** if practical:

```text
1 relatively small change
1 moderate change
1 change touching visibly non-trivial logic
```

Target approximately **9 change cases total**.

Prefer real historical commits/PR-sized changes rather than synthetic mutations.

For each case:

- pin the base commit;
- pin the target commit;
- record commit IDs;
- record changed TypeScript files;
- do not alter the change merely to provoke a warning.

If the current CLI only evaluates the working tree/current checkout, reproduce the historical target locally using Git without modifying production code.

## Required Run

For every case run the existing WP3 command with the default threshold:

```bash
tool check --base <base> --json
```

Also run a threshold-sensitivity comparison where practical:

```bash
tool check --base <base> --crap-threshold 15 --json
tool check --base <base> --crap-threshold 30 --json
```

Threshold 15 is experimental comparison data only. It is not a proposed new default.

Do not use the analyzer's own pass/fail status as the WP4 policy result.

## Data to Capture Per Case

Preserve raw JSON and record:

```text
repository
base commit
target commit
changed TS files
changed functions emitted
PASS count
WARN count
NOT_EVALUATED count
gate
completeness
maximum CRAP
maximum CC
coverage availability
runtime
setup steps
errors/limitations
```

For each WARN, record:

```text
file
method
CRAP
CC
coverage
threshold
```

## Human Usefulness Review

Machine metrics alone cannot answer whether the output is useful.

For each WARN, inspect the changed function and classify the finding:

```text
USEFUL
PLAUSIBLE
NOISY
UNDETERMINED
```

Definitions:

### USEFUL

The finding clearly highlights a changed function whose complexity/coverage combination deserves attention.

### PLAUSIBLE

The finding is understandable and potentially relevant, but not compelling enough to call clearly useful.

### NOISY

The warning appears misleading, redundant, or unlikely to change developer behavior.

### UNDETERMINED

The evaluator lacks enough domain/project context to judge.

Do **not** ask an LLM to make this classification autonomously.

The human evaluator owns the judgment. An LLM may later help summarize already-recorded observations, but it must not manufacture the usefulness verdict.

## Review Questions Per Warning

Record short answers:

1. Did the finding point to the function you expected from the Git change?
2. Is the CRAP value explainable from the shown CC and coverage?
3. Would you inspect this function during review after seeing the warning?
4. Does the warning reveal something not obvious from the diff alone?
5. Would this warning become annoying if shown repeatedly?
6. Is missing coverage responsible for NOT_EVALUATED instead of a finding?

## Completeness Analysis

For each case calculate:

```text
evaluated = PASS + WARN
total = PASS + WARN + NOT_EVALUATED

evaluationRate = evaluated / total
```

If total is zero, record `N/A`.

Do not silently exclude NOT_EVALUATED functions.

Completeness is a central WP4 outcome.

## Threshold Sensitivity

Compare threshold 30 with 15.

Record:

- additional warnings at 15;
- whether those additional warnings look useful or noisy;
- whether 30 misses obviously interesting changed functions;
- whether 30 appears appropriately conservative for an advisory prototype.

Do not tune the threshold per repository during WP4.

## Success Criteria

WP4 should recommend continuing only if the evidence supports it.

A strong result would look approximately like:

- tool runs on most selected repositories without production changes;
- a meaningful portion of changed functions are evaluable;
- warnings are mostly USEFUL or PLAUSIBLE;
- output remains small enough to inspect;
- default threshold 30 produces limited noise;
- missing evidence is understandable rather than misleading.

These are evaluation guides, not hard numeric gates.

## Stop/Concern Signals

Record serious concern if:

- most changed functions become NOT_EVALUATED;
- analyzer/project setup is frequently incompatible;
- warnings are mostly NOISY;
- warnings merely restate obvious complexity without adding value;
- results depend heavily on repository-specific hacks;
- function correlation fails on realistic code;
- threshold 30 almost never produces a signal;
- threshold sensitivity shows no defensible operating range.

Do not solve these issues during WP4.

## Required Artifacts

Create:

```text
experiments/wp4/
  repository-selection.md
  <repo-a>/
    case-01/
      metadata.md
      output-threshold-30.json
      output-threshold-15.json
      review.md
    ...
  <repo-b>/
  <repo-c>/
  aggregate-results.json

docs/research/WP4_USEFULNESS_VALIDATION_RESULTS.md
```

## Aggregate Report

The WP4 report must include:

- repository selection and rationale;
- exact pinned revisions;
- case-selection methodology;
- execution success/failure table;
- aggregate PASS/WARN/NOT_EVALUATED counts;
- evaluation/completeness rates;
- warning usefulness classifications;
- threshold 15 vs 30 comparison;
- operational friction observed;
- limitations;
- unexpected findings;
- recommendation for the next experiment.

## WP4 Exit Decision

End with exactly one:

```text
CONTINUE
CONTINUE WITH CONSTRAINTS
STOP
```

### CONTINUE

The existing prototype produces enough useful signal to justify another experiment.

### CONTINUE WITH CONSTRAINTS

The idea appears useful, but important limitations must shape the next step.

### STOP

The current proposition does not produce enough useful signal to justify expanding it.

## Completion Rule

Stop after WP4.

Do not implement baseline/delta ratcheting.

Do not add test/lint/security evidence.

Do not change threshold defaults.

Do not add language support.

Do not fix compatibility limitations unless required merely to execute the documented WP3 behavior and explicitly approved by the human.
