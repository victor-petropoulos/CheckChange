# Deliberately Ugly Prototype — OpenCode Project Plan

## Working Status

Project phase: WP0 / prototype validation  
Project type: standalone research utility  
Relationship to Engram: none at implementation time  
LLM dependency: none  
Cloud dependency: none  

## North Star

> **This project consumes analysis. It does not perform analysis.**

Do not build a static-analysis engine.

The prototype should use existing deterministic developer tools, correlate their outputs against the current Git change, apply a very small set of deterministic rules, and report PASS / WARN / FAIL.

The purpose is to determine whether a small, free, local-first correlator is useful enough to justify further work.

---

# 1. Basic Technical Stack

## Runtime

**Node.js 24 LTS**

Rationale:
- mature LTS runtime,
- cross-platform,
- matches the TypeScript-first target,
- provides the built-in APIs needed for file access, child processes, CLI parsing, hashing, and Git invocation,
- avoids unnecessary runtime dependencies.

Do not require Bun, Deno, Python, Java, or Docker.

## Language

**TypeScript 6.x**

Use strict TypeScript.

Recommended compiler settings:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmitOnError": true,
    "outDir": "dist"
  }
}
```

Do not introduce advanced type gymnastics. Prefer obvious types.

## Module System

**ESM**

Use:

```json
{
  "type": "module"
}
```

## Package Manager

**npm**

Rationale:
- lowest adoption burden for a casual public TypeScript utility,
- universally available with Node,
- no requirement for users to install pnpm/yarn/bun.

The tool may later detect npm/pnpm/yarn in target repositories, but its own development package manager is npm.

## CLI Parsing

Use Node's built-in `node:util` `parseArgs`.

Do not add Commander, Yargs, Oclif, or another CLI framework for the prototype.

## Process Execution

Use `child_process.execFile` or its promisified equivalent.

Do not use shell `exec` for normal tool execution.

Every command execution must support:
- executable + argument array,
- working directory,
- timeout,
- captured stdout,
- captured stderr,
- exit code,
- maximum output size if easily implemented.

## Tests

**Vitest**

Use Vitest for the prototype's own test suite.

Test:
- Git parsing,
- command result handling,
- evidence parsing,
- rule evaluation,
- failure/unavailable states.

Do not build a giant test matrix before WP0 succeeds.

## Lint

**ESLint**

Use it only for this project's own source quality.

Do not add large stylistic rule sets.

## Formatting

No formatter dependency is required for WP0.

If formatting becomes irritating, add Prettier later.

## Primary External Analysis Tool

**`@barney-media/crap-typescript`**

Use its CLI/machine-readable output rather than implementing:
- TypeScript AST analysis,
- cyclomatic complexity,
- function coverage attribution,
- CRAP calculation.

For WP0, prefer invoking:

```bash
npx --no-install crap-typescript --format json
```

when the tool is available.

Do not automatically install it into the target project.

WP0 must determine whether the tool's JSON output exposes sufficient stable fields for our needs.

## Existing Project Tools

Where available:
- project test runner,
- existing coverage output,
- `tsc`,
- ESLint.

Do not assume every repository has all of them.

Missing evidence is a supported state.

---

# 2. Prototype Architecture

Keep the source structure intentionally small:

```text
src/
├── cli.ts
├── git.ts
├── execute.ts
├── discover.ts
├── crap.ts
├── project-checks.ts
├── evidence.ts
├── rules.ts
└── report.ts
```

This is a guideline, not a requirement.

Do not create provider, adapter, plugin, registry, factory, service, repository, domain, application, or infrastructure layers unless WP0/WP1 produces a concrete need.

---

# 3. Core Data Types

Use minimal typed objects.

## CommandResult

```ts
interface CommandResult {
  command: string;
  args: string[];
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}
```

## Capability

```ts
type CapabilityState =
  | "available"
  | "unavailable"
  | "failed"
  | "unsupported";

interface Capability {
  name: string;
  state: CapabilityState;
  detail?: string;
}
```

## FunctionRiskEvidence

Do not finalize this type until WP0 has inspected real `crap-typescript` JSON.

Target shape:

```ts
interface FunctionRiskEvidence {
  file: string;
  functionName: string;
  complexity?: number;
  crap?: number;
  coverage?: number;
  source: string;
}
```

Do not invent fields that the upstream tool cannot reliably provide.

## Finding

```ts
type Severity = "info" | "warn" | "high";

interface Finding {
  ruleId: string;
  severity: Severity;
  subject?: string;
  message: string;
  evidence: Record<string, unknown>;
}
```

## Gate

```ts
type GateResult = "pass" | "warn" | "fail";
```

Keep `schemaVersion: "0.1"` in JSON output.

---

# 4. CLI v0

Initial command:

```bash
tool check --base <git-ref>
```

Optional:

```bash
tool check --base main --json
```

Do not add subcommands beyond `check` during WP0-WP4 unless absolutely required.

## Exit Codes

Proposed:

```text
0  analysis completed; gate PASS
1  tool/runtime/configuration failure
2  analysis completed; gate WARN
3  analysis completed; gate FAIL
```

Review this convention during WP4 before considering it stable.

---

# 5. Work Package WP0 — Evidence Feasibility Spike

## Objective

Answer:

> Can existing TypeScript tools provide the minimum deterministic facts needed by the prototype without us writing an analyzer?

WP0 is a spike.

Do not optimize for production architecture.

## Deliverables

Create:

```text
docs/research/WP0_EVIDENCE_FEASIBILITY.md
experiments/wp0/
├── fixture/
├── raw/
└── notes/
```

## Step 0.1 — Create Controlled Fixture

Create a tiny TypeScript project containing:
- baseline function,
- modified function,
- tests,
- coverage configuration,
- ESLint,
- TypeScript configuration.

The changed version should introduce enough branching to materially increase CRAP while tests still pass.

Commit the baseline.

Create the changed version as the current working tree or a second commit.

## Step 0.2 — Inspect crap-typescript Manually

Install `@barney-media/crap-typescript` only in the WP0 fixture if required.

Run:

```bash
npx crap-typescript --format json
```

and:

```bash
npx crap-typescript --changed --format json
```

Save raw output without modification under `experiments/wp0/raw/`.

Determine:
- exact JSON schema,
- function identifier,
- file path representation,
- complexity field,
- coverage field,
- CRAP field,
- threshold/result fields,
- errors,
- unavailable coverage representation,
- new-function behavior,
- changed-function behavior.

Document findings.

## Step 0.3 — Inspect Test/Coverage Output

Run the fixture's normal test and coverage commands.

Do not build our own coverage parser yet.

Determine whether:
1. `crap-typescript` already gives us enough coverage information,
2. direct coverage parsing adds information required by our rule,
3. or direct coverage ingestion should be deferred.

Prefer the simplest option.

## Step 0.4 — Inspect Typecheck

Run:

```bash
npx tsc --noEmit
```

For WP0 we initially need only PASS / FAIL / UNAVAILABLE.

Do not parse every TypeScript diagnostic unless a concrete need appears.

## Step 0.5 — Inspect ESLint

Use machine-readable ESLint output if configured.

For WP0 determine whether we need PASS / FAIL only, or whether simple finding counts provide meaningful additional value.

Do not normalize individual lint rules unless necessary.

## Step 0.6 — Git Change Correlation Experiment

Use Git to determine changed files.

Try to correlate `crap-typescript --changed` output to those changes.

Test at least:
1. modified function,
2. new function,
3. renamed function if easy,
4. deleted function if easy.

Important:

If reliable function correlation requires custom AST parsing, STOP and document the limitation.

Do not implement AST parsing.

## WP0 Decision

`docs/research/WP0_EVIDENCE_FEASIBILITY.md` must end with exactly one recommendation:

```text
GO
GO WITH CONSTRAINTS
STOP
```

### GO

Existing tools expose enough reliable machine-readable data and correlation is small/simple.

### GO WITH CONSTRAINTS

Useful only under clearly documented project/tool configurations.

This is an acceptable prototype outcome.

### STOP

Useful correlation requires substantial custom analysis or glue.

Do not proceed merely because the project plan exists.

---

# 6. WP1 — Minimal Change Correlation

Only begin after WP0 GO / GO WITH CONSTRAINTS.

Objective:

```text
Git changed code
+
crap-typescript function results
=
changed function risk records
```

Implement only the correlation demonstrated viable in WP0.

No general source-code parser.

Do not add rule evaluation yet.

---

# 7. WP2 — Minimal Evidence Object

Create the smallest stable data shape needed by the prototype.

Required concepts:
- analysis metadata,
- capability states,
- checks,
- changed function risk evidence,
- findings,
- gate.

Represent failures distinctly. Never use an empty result to mean unavailable.

---

# 8. WP3 — Three Rules

Implement only these.

## R1 — Test Failure

```text
IF test status == failed
THEN severity HIGH
AND gate FAIL
```

## R2 — Changed Function High CRAP

Prototype default threshold should initially follow the upstream tool's documented/default guidance rather than inventing a new scientific threshold.

The threshold must be visible and configurable in one simple place.

```text
IF changed function CRAP > threshold
THEN finding
```

## R3 — Changed Function High Risk + Inadequate Coverage

Only implement this if WP0 confirms a reliable coverage value.

```text
IF function changed
AND CRAP > threshold
AND coverage < coverageThreshold
THEN HIGH
AND gate FAIL
```

Do not let the tool produce subjective prose. It should report deterministic facts and thresholds.

---

# 9. WP4 — CLI

Make it pleasant enough to run manually.

Desired UX:

```text
$ tool check --base main

Analyzing main...HEAD

Capabilities
  ✓ Git
  ✓ crap-typescript
  ✓ tests
  ✓ coverage
  ✓ tsc
  ✓ ESLint

Checks
  ✓ tests
  ✓ typecheck
  ✓ lint

Findings

HIGH  calculateFinalPrice
      CRAP              24.7
      Complexity        18
      Coverage          61%

      Rule: changed-high-risk-low-coverage

Gate: FAIL
```

Do not add colors until basic output works.

JSON output should contain the same facts without decorative formatting.

---

# 10. WP5 — Real Repository Reality Check

Test against a small set of real TypeScript repositories.

Do not benchmark against Sonar/Codacy/CodeScene.

The purpose is to expose rough edges.

Try to include some combination of:
- npm,
- pnpm,
- yarn,
- Jest,
- Vitest,
- coverage present,
- coverage absent,
- ESLint configured,
- ESLint absent,
- TypeScript monorepo if convenient.

Record:
- setup steps,
- execution time,
- capabilities detected,
- failures,
- incorrect correlations,
- usefulness of findings,
- required hacks.

Create `docs/research/WP5_REALITY_CHECK.md`.

---

# 11. WP6 — Explicit Decision

Choose one outcome.

## STOP

The experiment was educational but not useful enough.

## PERSONAL UTILITY

Keep it small and useful for personal projects.

## CASUAL OPEN SOURCE

Add a good README, install instructions, examples, known limitations, permissive license after dependency review, and basic CI.

## CAREFUL EXPANSION

Only if actual use demonstrates a concrete additional need.

---

# 12. Implementation Rules for OpenCode

1. Do not implement source-code quality analysis.
2. Do not write an AST parser.
3. Do not implement cyclomatic complexity.
4. Do not implement coverage instrumentation.
5. Do not implement CRAP analysis if `crap-typescript` provides it.
6. Do not automatically install tools into a target repository.
7. Do not add an LLM.
8. Do not add MCP.
9. Do not reference or import Engram.
10. Do not introduce a provider/plugin framework.
11. Prefer Node built-ins over new dependencies.
12. Add a dependency only when it removes substantially more code/complexity than it introduces.
13. Expose missing or failed evidence explicitly.
14. Preserve raw analyzer output during WP0.
15. Do not silently compensate for unsupported cases.
16. Do not broaden language support.
17. Do not continue to the next work package until the current package's research question is answered.

---

# 13. Initial Repository Structure

After WP0 proves viability:

```text
project/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── eslint.config.js
├── src/
│   ├── cli.ts
│   ├── execute.ts
│   ├── git.ts
│   ├── discover.ts
│   ├── crap.ts
│   ├── project-checks.ts
│   ├── evidence.ts
│   ├── rules.ts
│   └── report.ts
├── test/
├── docs/
│   └── research/
└── experiments/
    └── wp0/
```

Do not create this entire structure before it is needed.

---

# 14. First OpenCode Task

Use this plan as the controlling document.

Give OpenCode this instruction:

```text
Read this entire project plan before doing anything.

Execute WP0 — Evidence Feasibility Spike only.

Do not scaffold the production application.
Do not design generalized abstractions.
Do not proceed to WP1.

Your job is to determine empirically whether existing TypeScript tooling,
especially @barney-media/crap-typescript, exposes enough stable machine-readable
information for this prototype to remain a small correlator rather than an
analysis engine.

Preserve raw tool outputs and write
docs/research/WP0_EVIDENCE_FEASIBILITY.md.

End the report with exactly one recommendation:

GO
GO WITH CONSTRAINTS
STOP

Support that recommendation with evidence from the spike.
```

After WP0, stop and review the results with a human before continuing.

---

# 15. Technology Decisions Summary

| Concern | Decision |
|---|---|
| Runtime | Node.js 24 LTS |
| Language | TypeScript 6.x |
| Module system | ESM / NodeNext |
| Package manager | npm |
| CLI parsing | Node `util.parseArgs` |
| Process execution | Node `child_process.execFile` |
| Prototype tests | Vitest |
| Project lint | ESLint |
| Formatting | None initially |
| CRAP/complexity analysis | `@barney-media/crap-typescript` |
| Coverage | Prefer upstream/project existing output |
| Git | System Git CLI |
| Typecheck | Existing `tsc` |
| Target-project lint | Existing ESLint if configured |
| JSON schema library | None initially |
| LLM | None |
| Engram | None |
| Database | None |
| Cloud | None |
| Docker | None |

---

# 16. Final Constraint

If the prototype begins requiring substantial custom code to understand TypeScript semantics, calculate quality measurements, or normalize many analyzer formats, stop.

The project should remain a small deterministic composition layer.

If it cannot remain small, the research question has answered itself.
