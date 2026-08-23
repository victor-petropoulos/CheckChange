# WP1 — Changed-Function Evidence Vertical Slice

## Status

WP0 outcome: **GO WITH CONSTRAINTS**

This is the first implementation increment.

## Objective

Build only:

```text
full crap-typescript JSON
        +
git diff --unified=0 against an explicit base
        ↓
changed-function evidence JSON
```

No risk rules yet. No human-facing verdict yet.

## Governing Principle

> **This project consumes analysis. It does not perform analysis.**

WP0 proved that `@barney-media/crap-typescript@0.5.0` already provides the function-level facts we need:

- `method`
- `src`
- `lineStart`
- `lineEnd`
- `cc`
- `cov`
- `covKind`
- `crap`
- `status`

WP0 also demonstrated that changed-function attribution can be done with integer line-range intersection against Git zero-context hunks. Do not add AST parsing.

## Constraints From WP0

1. Run **full** `crap-typescript` analysis. Do not rely on `--changed` for function attribution.
2. Require an explicit `--base <git-ref>` in WP1.
3. Preserve unavailable coverage as unavailable (`cov:null`, `covKind:"N/A"`, `status:"skipped"`).
4. Do not reconstruct deleted-function metrics.
5. Support/pin `@barney-media/crap-typescript@0.5.0`.
6. Correlate primarily by source file + line interval, not method name.
7. Do not evaluate CRAP thresholds in WP1.

## Required Command

```bash
tool check --base <git-ref> --json
```

## Execution Flow

### 1. Validate Git

Confirm:

- current directory is in a Git repo,
- base ref resolves,
- diff command can execute.

### 2. Parse Current-Side Changed Intervals

Run Git without shell interpolation:

```bash
git diff --unified=0 <base>
```

Parse hunk headers only.

Example:

```text
@@ -10,2 +12,5 @@
```

becomes current-side interval:

```text
12..16
```

Single-line form must also work.

Do not parse TypeScript source.

### 3. Run Full crap-typescript JSON

Invoke the pinned analyzer in JSON mode.

Capture stdout/stderr/exit code/duration.

WP0 verified that exit code `2` can mean a valid threshold breach with valid JSON. Treat it as analyzable output when JSON is valid.

### 4. Normalize Only Required Fields

Target internal record:

```ts
interface MethodEvidence {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  crap: number;
  coverage: number | null;
  coverageKind: string;
  analyzerStatus: "passed" | "failed" | "skipped";
}
```

Do not invent fields unsupported by the analyzer.

### 5. Correlate Methods to Changed Intervals

A method is changed when:

```text
same file
AND
methodStart <= changeEnd
AND
changeStart <= methodEnd
```

No AST. No symbol parser. No name matching.

### 6. Emit JSON Only

Target shape:

```json
{
  "schemaVersion": "0.1",
  "analysis": {
    "base": "main",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "crapTypescript": "available"
  },
  "changedFunctions": [
    {
      "file": "src/example.ts",
      "method": "calculateFinalPrice",
      "lineStart": 19,
      "lineEnd": 31,
      "cc": 7,
      "crap": 24.7,
      "coverage": 61,
      "coverageKind": "stmt",
      "analyzerStatus": "failed",
      "source": {
        "tool": "@barney-media/crap-typescript",
        "version": "0.5.0"
      }
    }
  ]
}
```

Actual values must come from real tool output.

## Required Capability/Error States

Distinguish:

- Git unavailable
- invalid base ref
- crap-typescript unavailable
- analyzer execution failure
- invalid analyzer JSON
- coverage unavailable in otherwise valid evidence
- no changed methods matched

`no changed methods matched` is not automatically an error.

## Expected Source Shape

Keep it small:

```text
src/
  cli.ts
  execute.ts
  git.ts
  crap.ts
  evidence.ts
```

Do not add generalized provider/plugin abstractions.

## Required Tests

Add focused tests for:

1. Git hunk parsing
2. interval intersection
3. parsing representative WP0 crap-typescript JSON
4. analyzer exit code 2 with valid JSON
5. unavailable coverage
6. no-match behavior

## Explicitly Forbidden in WP1

Do not:

- implement risk rules
- calculate CRAP
- calculate complexity
- parse coverage reports
- run ESLint/typecheck/tests as separate evidence sources
- add LLMs
- add Engram
- add MCP
- add security scanning
- add multiple languages
- add provider registries
- add plugin systems
- add a database
- add telemetry
- build a dashboard

## Deliverables

Create:

```text
src/...
test/...
experiments/wp1/...
docs/research/WP1_VERTICAL_SLICE_RESULTS.md
```

The results report must contain:

- implementation size
- commands used
- actual sample JSON
- supported cases
- unsupported cases
- observed correlation behavior against the WP0 fixture
- any deviations from this plan
- whether any custom source analysis was introduced

## Exit Decision

End `WP1_VERTICAL_SLICE_RESULTS.md` with exactly one:

```text
GO
GO WITH CONSTRAINTS
STOP
```

Then stop for human review. Do not proceed to WP2.
