# WP4R Final — Real-Repository Usefulness Rerun

## Status
**CURRENT**

## Purpose

Answer the question previous WP4 attempts could not:

> Does changed-function CRAP provide useful, understandable, appropriately selective signal on real TypeScript changes?

## Frozen Subject Under Test

```text
Git
+
crap-typescript-core
+
externally generated Istanbul JSON
+
--coverage-file <path>
+
coverage attribution
+
CRAP arithmetic
+
changed-function-high-crap advisory rule
```

Thresholds:
- default: 30
- sensitivity: 15

No production changes are authorized.

## Repository Set

Use three public TypeScript repositories. Prefer reusing h3, Hono, and nx because they were selected before prior results and represent different project shapes.

Replace a repo only if it cannot provide a usable Istanbul artifact without unreasonable target modification. If replaced, document why and select the replacement before observing prototype output.

## Coverage

Coverage is generated outside the prototype.

### h3
Use the proven V8 JSON command:

```bash
npx vitest --run   --coverage.enabled   --coverage.provider=v8   --coverage.reporter=json   --coverage.reportsDirectory=coverage   --coverage.reportOnFailure
```

### Hono
Use its native coverage command and native artifact path:

```text
coverage/raw/default/coverage-final.json
```

### nx
Use the repository's own test/coverage tooling. If no usable Istanbul artifact is available without target modification, record that limitation rather than modifying the prototype.

## Historical Changes

Use approximately three real historical changes per repository:

```text
1 small
1 moderate
1 non-trivial logic change
```

Pin base and target SHAs before prototype execution.

Do not select changes based on CRAP output.

## Execution

For every case:

1. checkout target;
2. confirm clean target tree;
3. generate coverage externally;
4. confirm artifact path;
5. run threshold 30;
6. run threshold 15;
7. preserve JSON/stdout/stderr/exit code;
8. record runtime.

Example:

```bash
tool check   --base <base-sha>   --coverage-file <artifact-path>   --crap-threshold 30   --json
```

## Data to Capture

Per run:

```text
repository
case
base SHA
target SHA
coverage command
coverage artifact path
coverage generation exit code
prototype exit code
analysisStatus
gate
completeness
changedFunctions count
PASS count
WARN count
NOT_EVALUATED count
maximum CRAP
maximum CC
coverage availability rate
runtime
```

For each changed function preserve:

```text
file
method
line range
CC
coverage
CRAP
rule result
threshold
```

## Human Review Required

OpenCode/LLM must not classify its own findings as useful.

### Every WARN

Human chooses:

```text
USEFUL
PLAUSIBLE
NOISY
UNDETERMINED
```

Questions:
1. Is the function genuinely part of the change?
2. Does CC look plausible?
3. Does coverage look plausible?
4. Is CRAP understandable from CC + coverage?
5. Would the warning cause closer review?
6. Does it reveal something not obvious from the diff?
7. Would repeated warnings like this become annoying?
8. Does threshold 15 improve or worsen the signal?

### PASS Sampling

Review at least five PASS functions if available, preferably near threshold or with higher CC.

Human chooses:

```text
EXPECTED_PASS
QUESTIONABLE_PASS
UNDETERMINED
```

Question:

> Does threshold 30 appear to miss something obviously risky?

## Threshold Sensitivity

Compare 30 vs 15:

```text
WARN count at each threshold
additional WARNs at 15
PASS -> WARN transitions
human classification of additional WARNs
```

Do not tune thresholds per repo.

## Coverage Spot Checks

For at least five numeric findings, verify source file/function mapping and whether the coverage number appears credible.

## NOT_EVALUATED Review

Classify causes:

```text
artifact missing
file absent from artifact
attribution unavailable
other
```

## Operational Friction

Record:
- dependency install effort;
- coverage-generation complexity;
- artifact-path burden;
- monorepo/cwd issues;
- coverage runtime;
- prototype runtime;
- manual setup required.

## Required Artifacts

```text
experiments/wp4r-final/
  repository-selection.md
  <repo>/<case>/
    metadata.md
    coverage-generation-stdout.txt
    coverage-generation-stderr.txt
    output-threshold-30.json
    output-threshold-15.json
    prototype-stderr-30.txt
    prototype-stderr-15.txt
    review.md
  aggregate-results.json
  human-review-packet.md

docs/research/WP4R_FINAL_USEFULNESS_RESULTS.md
```

## Human Review Packet

For each WARN include:

```text
repo
case
file
function
CC
coverage
CRAP
threshold
relevant change/diff reference
blank classification
review questions
```

Also include selected PASS samples.

Do not fill in usefulness classifications.

## Final Report

Must include:
- repo/case selection;
- SHAs;
- coverage commands and paths;
- execution success table;
- evaluation rates;
- PASS/WARN/NOT_EVALUATED counts;
- human classifications;
- PASS sample classifications;
- threshold sensitivity;
- coverage spot checks;
- operational friction;
- failures;
- limitations;
- unexpected findings;
- recommendation.

If human review is not complete, end exactly:

```text
AWAITING HUMAN REVIEW
```

After human review, end with exactly one:

```text
CONTINUE
CONTINUE WITH CONSTRAINTS
STOP
```

## Scope Freeze

Do not add baseline/delta, new rules, discovery, new coverage formats, CC-only warnings, threshold changes, CI, plugins, or LLM analysis.
