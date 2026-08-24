# WP4R — Real-Repository Usefulness Validation Rerun

## Status

**CURRENT**

## Purpose

Repeat the original WP4 usefulness experiment now that the evidence-acquisition
pipeline has been corrected and verified.

The question remains:

> Does changed-function CRAP evidence, interpreted through the current advisory
> rule, provide useful signal on real TypeScript code changes?

WP4R must test that question without changing production behavior.

## Critical Constraint

**Freeze the implementation for the duration of WP4R.**

Do not modify `src/`, threshold defaults, rule semantics, evidence acquisition,
or output semantics to improve experimental results.

If a repository exposes a limitation, record it.

Do not fix it during WP4R unless execution is impossible because of an obvious
test-harness/setup mistake unrelated to production behavior, and only after
human approval.

## Current Subject Under Test

The frozen tool uses:

```text
Git
+
@barney-media/crap-typescript-core@0.5.0
+
existing coverage/coverage-final.json if present
+
deterministic coverage attribution
+
CRAP arithmetic
+
changed-function-high-crap rule
```

Default CRAP threshold:

```text
30
```

Sensitivity threshold:

```text
15
```

Rule semantics:

```text
crap == null       -> NOT_EVALUATED
crap <= threshold  -> PASS
crap > threshold   -> WARN
```

Status model:

```text
analysisStatus: SUCCESS | UNSUPPORTED | FAILED
gate: PASS | WARN | null
completeness: COMPLETE | INCOMPLETE | NOT_APPLICABLE
```

## Repository Selection

Select **3 public repositories** before running the prototype.

This time, repository suitability must be verified more carefully than in WP4.

Each selected repository must:

- contain actual TypeScript implementation source (`.ts` / `.tsx`), not only
  declaration files;
- have accessible Git history;
- be realistically buildable/clonable locally;
- be licensed for public inspection;
- contain non-trivial functions;
- represent a different project shape where practical.

Preferred diversity:

```text
A — small TypeScript library/tool
B — medium TypeScript library/application
C — structurally different TypeScript project/monorepo
```

Do not select based on expected CRAP scores.

Do not select because the repository is already known to produce warnings.

Record selection before tool execution.

## Coverage Mix

The rerun must include both:

### Coverage-present cases

At least one repository/case where a valid existing Istanbul:

```text
coverage/coverage-final.json
```

is available before running the tool.

The prototype must only consume it.

The WP4R harness/user may generate the artifact using the repository's own
documented command **before** running the prototype, because generation is part
of preparing the experiment, not prototype behavior.

Record the exact command used to generate the artifact.

### Coverage-absent cases

At least one repository/case must intentionally have no coverage artifact.

The expected tool behavior is:

```text
coverage null
CRAP null
NOT_EVALUATED
SUCCESS / PASS / INCOMPLETE
```

This allows us to evaluate whether incomplete-but-honest output is itself useful.

## Historical Change Selection

For each repository, target approximately **3 real historical changes**:

```text
1 small
1 moderate
1 non-trivial logic change
```

Aim for approximately 9 cases total.

Each case must pin:

- repository URL
- base SHA
- target SHA
- changed TypeScript files
- coverage artifact state
- setup commands

Do not synthesize risky code merely to generate a warning.

## Execution Procedure

For each case:

1. checkout the target revision;
2. confirm clean working tree;
3. prepare coverage artifact state according to the case;
4. run threshold 30;
5. preserve JSON/stdout/stderr/exit code;
6. run threshold 15;
7. preserve JSON/stdout/stderr/exit code;
8. record runtime and setup friction.

Commands conceptually:

```bash
tool check --base <base-sha> --crap-threshold 30 --json
tool check --base <base-sha> --crap-threshold 15 --json
```

Do not use `crap-typescript` CLI results as the policy verdict.

## Data to Record Per Run

Capture:

```text
repository
case
base SHA
target SHA
changed TS files
analysisStatus
gate
completeness
changedFunctions count
PASS count
WARN count
NOT_EVALUATED count
maximum CRAP
maximum CC
coverage artifact present?
coverage attributable?
runtime
exit code
errors
setup friction
```

## Completeness Metrics

For successful applicable runs:

```text
evaluated = PASS + WARN
total = PASS + WARN + NOT_EVALUATED
evaluationRate = evaluated / total
```

If total is zero, record `N/A`.

Also record:

```text
coverageAvailabilityRate =
functions with numeric coverage / changedFunctions
```

Do not exclude NOT_EVALUATED functions from aggregate reporting.

## Human Usefulness Classification

For every WARN, inspect the actual changed function and classify:

```text
USEFUL
PLAUSIBLE
NOISY
UNDETERMINED
```

### USEFUL

The warning points to a changed function whose complexity/coverage combination
clearly deserves review attention.

### PLAUSIBLE

The warning is understandable and potentially useful, but not compelling.

### NOISY

The warning is misleading, redundant, obvious, or unlikely to change reviewer
behavior.

### UNDETERMINED

Insufficient project/domain context to judge.

The human evaluator owns this classification.

OpenCode/LLM must not classify its own warnings autonomously.

## Human Review Questions

For each WARN record:

1. Did the tool identify the function actually affected by the change?
2. Is CC plausible from inspection?
3. Is coverage evidence believable?
4. Is the resulting CRAP understandable?
5. Would the warning cause you to inspect the function more closely?
6. Does the warning reveal information not obvious from the diff?
7. Would repeated warnings at this threshold become annoying?
8. Would threshold 15 materially improve or worsen usefulness?

## PASS Review Sample

WARN-only review can hide false negatives.

Select at least **3 PASS functions** across the corpus, preferably functions with
higher CRAP values that remain below 30.

Review them manually and record:

```text
EXPECTED PASS
QUESTIONABLE PASS
UNDETERMINED
```

Ask:

> Did the default threshold 30 miss something that appears obviously risky?

This is not a full false-negative study, but it prevents us from evaluating only
the warnings the tool chooses to show.

## NOT_EVALUATED Review

For a sample of NOT_EVALUATED functions record why evidence was unavailable:

```text
coverage artifact absent
file missing from coverage artifact
coverage attribution unavailable
other
```

Assess whether the explanation is understandable to a user.

## Threshold Sensitivity

Compare 30 and 15.

Record:

- WARN count at each threshold;
- additional WARNs at 15;
- usefulness classification of additional WARNs;
- whether 30 appears too quiet;
- whether 15 creates obvious noise.

Do not tune thresholds per repository.

## Analysis Status Review

Explicitly count:

```text
SUCCESS
UNSUPPORTED
FAILED
```

Any FAILED result must be investigated and documented as an experimental outcome.

Do not silently retry with modified production code.

## Operational Friction

Record:

- dependency installation burden;
- need to generate coverage manually;
- coverage-generation command difficulty;
- working-directory sensitivity;
- monorepo/package selection issues;
- runtime;
- any need for target-specific preparation.

The experiment must evaluate whether the tool remains "small and usable" from a
developer perspective, not just whether its calculations are correct.

## Success Indicators

Evidence favoring continuation would include:

- most selected TypeScript cases reach SUCCESS;
- changed functions are actually emitted;
- numeric CRAP is obtained in coverage-present cases;
- NOT_EVALUATED states are honest/understandable where coverage is absent;
- WARNs are mostly USEFUL or PLAUSIBLE;
- threshold 30 produces limited noise;
- threshold 15 provides useful sensitivity information;
- operational setup is tolerable;
- output remains concise enough for code review.

These are guidance, not predeclared numeric pass/fail gates.

## Concern Indicators

Strong concerns include:

- many applicable cases still emit zero changed functions;
- coverage attribution frequently fails despite valid artifacts;
- most warnings are NOISY;
- threshold 30 almost never produces findings across non-trivial changes;
- threshold 15 is either equally silent or overwhelmingly noisy;
- manual setup overwhelms the value of the result;
- frequent FAILED analyses;
- PASS samples reveal obvious high-risk code the metric misses;
- NOT_EVALUATED dominates even when coverage artifacts exist.

## Required Artifacts

Create:

```text
experiments/wp4r/
  repository-selection.md
  <repo-a>/
    case-01/
      metadata.md
      output-threshold-30.json
      output-threshold-15.json
      stderr-threshold-30.txt
      stderr-threshold-15.txt
      review.md
    case-02/
    case-03/
  <repo-b>/
  <repo-c>/
  aggregate-results.json

docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md
```

## Aggregate Report Requirements

The final report must include:

- repository selection rationale;
- confirmation that repos were chosen before observing tool output;
- exact base/target SHAs;
- coverage preparation per case;
- execution success/failure table;
- changed-function counts;
- PASS/WARN/NOT_EVALUATED counts;
- evaluation rates;
- coverage availability rates;
- analysisStatus counts;
- warning usefulness classifications;
- sampled PASS review;
- NOT_EVALUATED causes;
- threshold 30 vs 15 comparison;
- operational friction;
- limitations;
- unexpected findings;
- recommendation.

## Final Decision

End with exactly one:

```text
CONTINUE
CONTINUE WITH CONSTRAINTS
STOP
```

### CONTINUE

The prototype now produces enough useful real-repository signal to justify the
next research milestone.

### CONTINUE WITH CONSTRAINTS

The signal is promising but limitations must shape the next design.

### STOP

The real-repository evidence does not justify further expansion.

## Completion Rule

Stop after WP4R.

Do not implement baseline/delta.

Do not add analyzers or rules.

Do not modify production behavior.

Return the results for human review.
