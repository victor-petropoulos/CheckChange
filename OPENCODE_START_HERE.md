# OpenCode Start Here

## Current Status

WP4R: INCONCLUSIVE — COVERAGE CONTRACT BLOCKED EVALUATION  
WP4R.1: COMPLETE — EXPLICIT PATH STRONGLY SUPPORTED  
WP4R.1a: COMPLETE — **V8 JSON CONFIRMED**  
WP4R.2: **CURRENT — EXPLICIT ISTANBUL PATH**  
WP4R rerun: BLOCKED

## Read First

1. `docs/research/WP4R.1a_V8_REPORTER_RESOLUTION_RESULTS.md`
2. `docs/research/WP4R.1a_DECISION_SUMMARY.md`
3. `docs/implementation/WP4R.2_EXPLICIT_COVERAGE_PATH_IMPLEMENTATION.md`
4. `docs/implementation/WP4R.2_EXECUTION_PLAYBOOK.md`

## Current Assignment

Execute **WP4R.2 only**.

Add one optional CLI input:

```text
--coverage-file <path>
```

The prototype must consume the exact caller-supplied Istanbul JSON path.

Do not run tests, generate coverage, discover artifacts, parse LCOV, or configure
Vitest/Jest inside the prototype.

Retain the default:

```text
coverage/coverage-final.json
```

when the flag is omitted.

Create:

`docs/research/WP4R.2_IMPLEMENTATION_RESULTS.md`

End with exactly one:

- `READY FOR WP4R RERUN`
- `READY WITH CONSTRAINTS`
- `STOP`

Then stop for human review.
