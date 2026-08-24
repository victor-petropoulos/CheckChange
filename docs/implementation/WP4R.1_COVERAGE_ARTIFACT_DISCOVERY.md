# WP4R.1 — Coverage Artifact Discovery Research

## Status

**CURRENT — RESEARCH ONLY**

## Purpose

Determine why WP4R's coverage-present-intent cases failed to yield `coverage/coverage-final.json`, and identify the smallest practical coverage artifact contract that preserves the prototype architecture.

**No production code changes are authorized.**

## Governing Question

> Can ordinary TypeScript projects provide deterministic function coverage in a form this prototype can consume without the prototype owning test execution or coverage generation?

## Immediate Scope

Investigate **h3** and **hono** first. WP4R attempted `vitest --run --coverage` for both but did not find the expected artifact.

Do not investigate nx until h3 and hono establish whether the problem is output location, reporter configuration, artifact format, command/config mismatch, version behavior, or genuinely absent coverage.

## Architecture Constraint

```text
Git
+
crap-typescript-core
+
externally produced coverage evidence
+
deterministic attribution
+
CRAP
+
existing advisory rule
```

The prototype must not run tests or generate coverage. WP4R.1 may run target-project coverage commands externally as an experiment.

## Research Questions

For each repository determine:

1. Exact Vitest version.
2. Coverage provider and provider version.
3. Configured coverage reporters.
4. Coverage-related project configuration.
5. Exact WP4R command and cwd.
6. Whether it completed successfully.
7. Whether tests actually ran.
8. Whether stdout/stderr reported coverage.
9. What files/directories were created or changed.

### Artifact Inventory

After coverage execution, inventory the complete relevant output tree. Search for at least:

```text
coverage-final.json
coverage.json
coverage-summary.json
lcov.info
lcov-report/
clover.xml
cobertura*.xml
*.lcov
*.json
```

Do not assume the output directory is `coverage`.

For plausible artifacts record:

```text
path
size
format
producer
per-file data?
statement locations?
hit counts?
branch data?
function data?
sufficient for deterministic attribution?
```

Do not implement parsers.

### Can Istanbul JSON Be Requested Externally?

Determine whether existing tooling can be instructed, without source/config modification, to emit Istanbul JSON suitable for the prototype.

Preferred pattern:

```text
user/CI runs repository coverage command with reporter option
        ↓
Istanbul JSON artifact exists
        ↓
prototype consumes artifact
```

Record exact working commands.

### Target Modification Classification

Classify each viable approach:

```text
NO TARGET MODIFICATION
TEMPORARY CLI OPTION ONLY
TARGET CONFIGURATION CHANGE REQUIRED
TARGET DEPENDENCY CHANGE REQUIRED
NOT VIABLE
```

### Artifact Location

If usable Istanbul JSON is generated, determine whether:

1. it can reliably be written to `coverage/coverage-final.json`;
2. it appears elsewhere deterministically;
3. output directory can be controlled externally;
4. artifact discovery is actually necessary.

Do not implement discovery.

## Controlled Experiments

### Experiment 1 — Reproduce WP4R

Re-run the exact WP4R command. Capture command, cwd, exit code, stdout, stderr, and before/after filesystem inventory.

### Experiment 2 — Inspect Native Configuration

Inspect package scripts and Vitest/Vite/test configuration. Record provider, reporters, output directory and relevant versions. Do not edit configuration.

### Experiment 3 — Native/Documented Coverage Command

If the repo defines its own coverage script or documented command, run it unchanged and capture the same evidence.

### Experiment 4 — Reporter Override

Using only documented CLI options supported by the installed version, attempt to request Istanbul JSON.

Do not edit repository files or add dependencies. If a required provider dependency is absent, record that fact rather than installing it.

### Experiment 5 — Artifact Inspection

Inspect any resulting JSON coverage artifact enough to determine whether it matches or is compatible with the Istanbul file coverage model required by current attribution code.

Do not modify production code.

## Candidate Coverage Contracts

Evaluate from smallest to broadest:

### Contract A — Exact artifact

```text
User provides coverage/coverage-final.json
```

### Contract B — Explicit Istanbul JSON path

```text
tool check --coverage-file <path>
```

Removes the location assumption without adding a new parser.

### Contract C — Deterministic Istanbul discovery

Search a small explicit set of locations for Istanbul-compatible JSON.

### Contract D — Multiple formats

Support LCOV/other formats. This is a materially larger scope increase and should be recommended only if A-C are demonstrably inadequate.

For each assess implementation complexity, portability, user setup burden, determinism, ambiguity risk, dependency burden, and consistency with the "consume analysis" principle.

## Explicitly Out of Scope

Do not:

- change `src/`;
- add an LCOV parser;
- add artifact discovery;
- add `--coverage-file`;
- add test execution;
- add coverage generation;
- install coverage dependencies into target repos;
- change thresholds;
- add CC-only warnings;
- add new rules;
- add JavaScript;
- add baseline/delta;
- add provider/plugin architecture;
- add CI integration;
- add LLMs;
- modify h3/hono source or committed config.

## Required Artifacts

```text
experiments/wp4r.1/
  h3/
    environment.md
    filesystem-before.txt
    filesystem-after-wp4r-command.txt
    filesystem-after-native-command.txt
    filesystem-after-reporter-override.txt
    stdout-*.txt
    stderr-*.txt
    artifact-inventory.md
  hono/
    ...
  coverage-contract-matrix.md

docs/research/WP4R.1_COVERAGE_ARTIFACT_DISCOVERY_RESULTS.md
```

## Results Report Requirements

Include:

1. exact reproduction of WP4R coverage failure;
2. installed Vitest/coverage-provider versions;
3. native coverage configuration;
4. complete relevant artifact inventory;
5. exact commands tested;
6. exit codes;
7. whether tests actually ran;
8. formats produced;
9. whether CLI-only Istanbul JSON generation works;
10. whether target modification is required;
11. whether current attribution can consume the result;
12. comparison of Contracts A-D;
13. smallest recommended contract;
14. operational implications;
15. unanswered questions;
16. next-milestone recommendation.

## Exit Decision

End with exactly one:

```text
KEEP EXACT ARTIFACT CONTRACT
ADD EXPLICIT ISTANBUL PATH
ADD ISTANBUL DISCOVERY
RESEARCH MULTIPLE FORMATS
STOP
```

Then stop for human review. Do not implement the decision.
