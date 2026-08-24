# WP4R.2 — Explicit Istanbul Coverage Path

## Status

**CURRENT IMPLEMENTATION TASK**

## Objective

Add one small deterministic input to the prototype:

```text
--coverage-file <path>
```

This lets the caller tell the prototype where an already-generated
Istanbul-compatible JSON coverage artifact exists.

No coverage execution, discovery, conversion, or parsing expansion is authorized.

## Governing Contract

> The caller produces Istanbul-compatible JSON. The prototype consumes it.

The prototype does not own:

- test execution;
- coverage generation;
- test-runner configuration;
- coverage-provider selection;
- package-manager behavior;
- coverage reporter configuration.

## Existing Default

The current default behavior remains valid:

```text
coverage/coverage-final.json
```

If the user does not supply `--coverage-file`, the prototype continues to look
at exactly that default path.

No other automatic locations are searched.

## CLI

Add:

```bash
tool check   --base <git-ref>   --coverage-file <path>   --json
```

`--coverage-file` is optional.

### Path Semantics

If supplied:

- accept a relative or absolute filesystem path;
- resolve a relative path against the target repository cwd;
- use that exact resolved path;
- do not fall back to the default if the explicit path is invalid;
- do not search other directories.

If omitted:

- use `<cwd>/coverage/coverage-final.json`.

## Coverage Input States

### A — Explicit path supplied and valid

```text
coverageArtifact: available
```

Consume the artifact through the existing Istanbul parser and attribution logic.

### B — Explicit path supplied but file does not exist

This is a caller/configuration error, not ordinary missing optional evidence.

Required:

```text
analysisStatus: FAILED
gate: null
completeness: INCOMPLETE
```

Process exit: non-zero.

Reason must clearly identify the requested path.

Do not silently fall back to the default path.

### C — Explicit path supplied but malformed/incompatible

Required:

```text
analysisStatus: FAILED
gate: null
completeness: INCOMPLETE
```

Process exit: non-zero.

Preserve useful parse/incompatibility detail.

### D — No explicit path; default artifact exists

Behavior remains unchanged.

Use:

```text
<cwd>/coverage/coverage-final.json
```

### E — No explicit path; default artifact absent

This remains ordinary unavailable optional evidence.

For applicable changed TypeScript functions:

```text
coverage: null
crap: null
ruleResult: NOT_EVALUATED
analysisStatus: SUCCESS
gate: PASS
completeness: INCOMPLETE
```

Do not change this into FAILED merely because the default optional artifact is absent.

## Important Distinction

These two cases are intentionally different:

```text
no --coverage-file
default artifact absent
    -> optional evidence unavailable
    -> SUCCESS / PASS / INCOMPLETE

--coverage-file ./foo.json
./foo.json absent
    -> caller explicitly requested evidence that cannot be read
    -> FAILED / null / INCOMPLETE
```

## Internal API

Prefer the smallest possible change.

A reasonable direction is to allow the current coverage reader to accept an
optional path parameter:

```ts
readCoverage(cwd, coverageFile?)
```

or an equivalent minimal signature.

Do not build a coverage provider abstraction.

Do not add discovery logic.

Do not generalize to multiple formats.

## Schema

Do not bump the schema version unless the output structure changes.

Adding a CLI input alone does not require a schema change.

If useful for provenance, the existing output may record the resolved coverage
artifact path only if that can be done without materially expanding the schema.

Do not add a generic evidence-source registry.

## Provenance

Coverage-derived evidence should continue to be distinguishable from complexity
evidence.

If the resolved coverage path is recorded, it must be factual and normalized
consistently.

Do not expose machine-specific temporary absolute paths in stable fixture
expectations unless required for the test.

## Required Tests

At minimum:

1. no flag + default artifact present -> existing successful behavior;
2. no flag + default artifact absent -> SUCCESS/PASS/INCOMPLETE;
3. explicit relative valid path -> artifact consumed;
4. explicit absolute valid path -> artifact consumed;
5. explicit valid non-default Hono-style path
   (`coverage/raw/default/coverage-final.json`) -> artifact consumed;
6. explicit missing path -> FAILED/null/INCOMPLETE;
7. explicit malformed artifact -> FAILED/null/INCOMPLETE;
8. explicit path must not fall back to default;
9. relative path resolves from target repo cwd;
10. measured coverage 0 remains 0;
11. measured coverage 100 remains 100;
12. existing PASS fixture remains PASS;
13. existing WARN fixture remains WARN;
14. existing NOT_EVALUATED behavior remains unchanged when no explicit artifact
    exists;
15. existing unsupported semantics remain unchanged;
16. Git correlation regression suite still passes;
17. threshold override still works.

## CLI Exit Verification

Add/retain tests or controlled checks proving:

```text
explicit valid artifact      -> exit 0
default artifact absent      -> exit 0
explicit missing artifact    -> non-zero
explicit malformed artifact  -> non-zero
```

## Controlled Compatibility Checks

Before declaring WP4R.2 complete, run controlled checks against:

### h3

Use the artifact generated externally during WP4R.1a, or regenerate it outside
the prototype using the proven h3 command.

Then invoke the prototype with:

```text
--coverage-file <actual h3 coverage-final.json path>
```

Confirm at least one changed function can receive numeric coverage/CRAP where
the artifact contains relevant coverage.

### Hono

Use the repository's native artifact:

```text
coverage/raw/default/coverage-final.json
```

Invoke the prototype with:

```text
--coverage-file coverage/raw/default/coverage-final.json
```

Confirm that no file movement or target config change is required.

These are implementation compatibility checks, not the WP4R usefulness rerun.

## Explicitly Forbidden

Do not:

- run tests from inside prototype code;
- generate coverage from prototype code;
- invoke Vitest/Jest/nyc;
- pass reporter flags to target tooling;
- search for artifacts;
- recursively scan coverage directories;
- add LCOV support;
- add Cobertura/Clover support;
- add format detection framework;
- add JavaScript support;
- add baseline/delta;
- add CC-only warnings;
- add new rules;
- change threshold defaults;
- add package-manager orchestration;
- add provider/plugin abstraction;
- add SARIF;
- add CI integration;
- add LLMs;
- add Engram integration.

## Required Deliverables

Create:

```text
experiments/wp4r.2/
docs/research/WP4R.2_IMPLEMENTATION_RESULTS.md
```

The result must include:

1. production files changed;
2. LOC added/removed;
3. CLI change;
4. internal coverage-reader change;
5. exact path-resolution semantics;
6. default-path backward-compatibility proof;
7. explicit missing-path failure proof;
8. explicit malformed-artifact failure proof;
9. h3 compatibility result;
10. Hono compatibility result;
11. complete test command/results;
12. TypeScript compile result;
13. confirmation that no target tests/coverage are invoked by the prototype;
14. deviations from this plan.

## Exit Decision

End with exactly one:

```text
READY FOR WP4R RERUN
READY WITH CONSTRAINTS
STOP
```

Use `READY FOR WP4R RERUN` only if:

- all required tests pass;
- explicit Hono-style path works;
- explicit h3 path works when a compatible artifact exists;
- no production coverage generation/execution was added;
- default missing-artifact semantics remain unchanged.

Then stop for human review.

Do not begin the real-repository usefulness rerun automatically.
