# WP12 Results

## Timings

| Stage               | P1 (seconds) | P2 (seconds) |
|---------------------|--------------|--------------|
| Vitest --coverage   | 3.681        | 3.679        |
| CLI check           | 0.271        | 0.276        |

## JSON Outputs

### P1 (default)

```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "8bd543d751d208c09083626ac1780cce0a68e9b3",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [],
  "ruleResults": [],
  "policy": {
    "crapThreshold": 30
  },
  "analysisStatus": "UNSUPPORTED",
  "gate": null,
  "completeness": "NOT_APPLICABLE"
}
```

### P2 (explicit)

```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "8bd543d751d208c09083626ac1780cce0a68e9b3",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [],
  "ruleResults": [],
  "policy": {
    "crapThreshold": 15
  },
  "analysisStatus": "UNSUPPORTED",
  "gate": null,
  "completeness": "NOT_APPLICABLE"
}
```

## Reproducibility

- P1: two runs of the CLI check produced identical JSON (exit code 0 both times).
- P2: two runs of the CLI check produced identical JSON (exit code 0 both times).

## Failure Modes

### Missing base ref

Command: `node dist/cli.js check --base nonexistent --json`

Exit code: 1

Output:
```
Error: Cannot resolve base reference: nonexistent
```

### Malformed coverage file

Command: `node dist/cli.js check --base HEAD~1 --coverage-file /tmp/bad.json --crap-threshold 15 --json`

Exit code: 0

Output:
```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "8bd543d751d208c09083626ac1780cce0a68e9b3",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [],
  "ruleResults": [],
  "policy": {
    "crapThreshold": 15
  },
  "analysisStatus": "UNSUPPORTED",
  "gate": null,
  "completeness": "NOT_APPLICABLE"
}
```

## Note on changed functions

During the runs, there were no changed functions in the src/ tree between base HEAD~1 and current, hence the engine returned analysisStatus: UNSUPPORTED and gate: null, completeness: NOT_APPLICABLE.

> Note: This test had no changed TS functions (intervals contained only non-TS files or was empty), so `isUnsupportedIntervals` returned true and coverage file was never read. Result correctly matches "Non-TS changes only" contract row (UNSUPPORTED, exit 0), not "Malformed coverage" row. Scenario (b) — malformed coverage with non-empty TS intervals — would correctly return FAILED/exit1 and remains untested in WP12 (gap documented).

