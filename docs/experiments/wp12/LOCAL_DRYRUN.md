# WP12 Local Dry-run Harness Documentation

## Pipelines

### P1: Default (threshold 30)
```bash
vitest run --coverage && node dist/cli.js check --base HEAD~1 --json
```

### P2: Explicit (threshold 15 override)
```bash
vitest run --coverage && node dist/cli.js check --base HEAD~1 --coverage-file coverage/coverage-final.json --crap-threshold 15 --json
```

## Expected JSON Output (Schema 0.2)

The JSON output includes the following top-level fields:

- `gate`: boolean, indicates whether the check passes (true) or fails (false)
- `completeness`: number between 0 and 100, representing the percentage of changes covered by tests
- `policy`: object containing policy details
  - `crapThreshold`: number, the CRAP score threshold used (30 for P1, 15 for P2)
- `schemaVersion`: string, should be "0.2"
- `provenance`: object containing information about the run
  - `command`: string, the command that was run
  - `timestamp`: string, ISO timestamp of the run
  - `baseRef`: string, the base ref used (e.g., "HEAD~1")
  - `headRef`: string, the head ref used (e.g., "HEAD")

## Exit Code Matrix

The exit code of the `node dist/cli.js check` command is determined as follows:

| Condition                     | Exit Code |
|-------------------------------|-----------|
| Gate passes (gate: true)      | 0         |
| Gate fails (gate: false)      | 1         |
| Error in execution (e.g., missing base ref) | 1         |

Note: The vitest command must succeed (exit code 0) for the check to run. If vitest fails, the overall command fails due to the `&&`.

## F-03 Path Rebasing Verification

The `normalizeCoveragePaths` feature (F-03) ensures that coverage paths are rebased correctly when comparing different base refs. This is verified by checking that the coverage report uses paths relative to the repository root, regardless of the base ref.

## Common Failure Mode Recovery Steps

### Missing Base Ref
- If the base ref (e.g., HEAD~1) does not exist, the command will fail with an error from git.
- Recovery: Ensure you have fetched the necessary refs or use an existing base ref (e.g., main or a specific commit).

### Missing Coverage File
- If the coverage file (coverage/coverage-final.json) is not found after vitest run, the check will fail.
- Recovery: Ensure vitest runs successfully and generates the coverage report. Check the vitest configuration for coverage output.

### Malformed JSON
- If the coverage file or the output of the check command is not valid JSON, the command will fail.
- Recovery: Validate the JSON format of the coverage file and the output of the check command.

### ENOENT Git
- If the git command fails because the repository is not found or the path is incorrect, the command will fail.
- Recovery: Ensure you are running the command from the root of the git repository.

## Frozen Contract Reference

- Schema version: 0.2
- Default CRAP threshold: 30 (can be overridden via --crap-threshold)
- Explicit override in P2: 15
- Invariants covered: INV-01, INV-02, INV-03, INV-04 (refer to SPEC.md for details)