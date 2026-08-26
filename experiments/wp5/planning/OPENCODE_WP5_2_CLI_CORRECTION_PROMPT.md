# OpenCode Prompt — WP5.2 Correction Pass for CLI Diagnostics

## Status
WP5.2 characterization is nearly complete. This pass is narrowly scoped to `FM-D10` and `FM-G06`.

Do not begin WP5.3. Do not modify production code.

## Why
The current defect results classify FM-D10/FM-G06 as CONFIRMED, but the cited evidence only proves lower-level `analysisStatus: FAILED` behavior. That does not prove the claimed user-facing CLI message defects.

## Objective
Reproduce both claims at the actual CLI boundary, capture exact output, and correct WP5.2 classifications.

## FM-D10
Exercise the actual CLI in a deterministic environment where the `git` executable is unavailable or the exact ENOENT path is triggered.

Capture:
- command
- exit code
- stdout
- stderr
- JSON if applicable
- exact message

Classify:
- `CONFIRMED` if the misleading message is reproduced
- `REFUTED` if CLI messaging is accurate
- `UNRESOLVED` if deterministic reproduction is not possible

Do not substitute lower-level function calls for a CLI claim.

## FM-G06
Invoke the actual CLI with an explicitly supplied coverage path that does not exist.

Capture the same evidence and determine whether the CLI says “coverage artifact malformed”, accurately reports a missing file, or says something else.

Use the same classification rules.

## Required Updates
Update:
- `experiments/wp5/wp5.2/defect-reproduction-results.md`
- `experiments/wp5/wp5.2/WP5_2_RESULTS.md`
- active WP5 traceability matrix
- active WP5 decision log

Preserve CLI evidence under:
`experiments/wp5/wp5.2/cli-diagnostics/`

Correct overall confirmed/refuted/unresolved defect counts. Do not leave `6/6 confirmed` unless the CLI evidence truly supports that.

## Production Freeze
Do not modify CLI implementation, evidence builder, schema, thresholds, attribution, complexity, coverage ingestion, or other production logic.

Characterization tests and experiment evidence are allowed.

## Stop
STOP after correcting WP5.2 evidence. Return:
1. FM-D10 classification + exact CLI evidence
2. FM-G06 classification + exact CLI evidence
3. corrected defect counts
4. files updated
5. production-code status
6. whether WP5.2 is ready for closure/review
7. confirmation WP5.3 has not started
