# WP4R.1a — V8 Reporter Resolution — Artifact Inventory

| Artifact                  | Baseline | Report-on-failure | Explicit v8 JSON | Passing subset |
|---------------------------|----------|-------------------|------------------|----------------|
| coverage-final.json       | ✗        | ✓ (`/tmp/wp4r1-h3/coverage/coverage-final.json`, 826067 bytes) | ✓ (`/tmp/wp4r1-h3/coverage/coverage-final.json`, 826067 bytes) | ✓ (`/tmp/wp4r1-h3/coverage/coverage-final.json`, 819492 bytes) |
| coverage.json             | ✗        | ✗                 | ✗                | ✗              |
| coverage-summary.json     | ✗        | ✗                 | ✗                | ✗              |
| lcov.info                 | ✗        | ✗                 | ✗                | ✗              |
| lcov-report/              | ✗        | ✗                 | ✗                | ✗              |
| clover.xml                | ✗        | ✗                 | ✗                | ✗              |
| cobertura*.xml            | ✗        | ✗                 | ✗                | ✗              |
| *.lcov                    | ✗        | ✗                 | ✗                | ✗              |

All experiments were run with a clean `coverage` directory before each run.

## Notes
- Only `coverage-final.json` was produced, and only when coverage collection was triggered via `--coverage` plus either explicit JSON reporter or the combination that includes `reportOnFailure`.
- The `coverage-final.json` files are valid Istanbul JSON objects containing the required keys: `path`, `s` (statementMap), `f` (fnMap), `b` (branchMap), `fnMap`, `branchMap`, and `meta`.
- No other artifact types were generated in any experiment.