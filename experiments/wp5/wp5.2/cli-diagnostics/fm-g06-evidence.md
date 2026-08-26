# FM-G06 CLI Diagnostic Evidence

## Precondition
The CLI's execution path for checking coverage artifact is only reached when at least one TypeScript file is changed (i.e., the analysis includes TS-only intervals). If no TypeScript files are changed, the CLI returns `UNSUPPORTED` early (exit code 0) and does not reach the coverage artifact validation.

## Evidence with TypeScript Change (Primary)
To reproduce the defect claim, a TypeScript file must be changed. We temporarily modified `src/cli.ts` to satisfy this precondition.

### Command
```bash
node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-coverage-xyz123.json
```

### Exit Code
1

### Stdout
```
Analysis complete. Base: bbbb30a7ff02f5e8e4ac12a3cc47f3247d85f7b3, Changed functions: 0
```

### Stderr
```
Error: coverage artifact malformed
```

### JSON Output (with `--json`)
```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "bbbb30a7ff02f5e8e4ac12a3cc47f3247d85f7b3",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "failed"
  },
  "changedFunctions": [],
  "policy": {
    "crapThreshold": 30
  },
  "ruleResults": [],
  "analysisStatus": "FAILED",
  "gate": null,
  "completeness": "INCOMPLETE"
}
```

## Evidence without TypeScript Change (Secondary)
When no TypeScript files are changed (current state after reverting the temporary change), the CLI exits early with `UNSUPPORTED`.

### Command
```bash
node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-coverage-xyz123.json
```

### Exit Code
0

### Stdout
```
Analysis complete. Base: bbbb30a7ff02f5e8e4ac12a3cc47f3247d85f7b3, Changed functions: 0
```

### Stderr
```
(empty)
```

### JSON Output (with `--json`)
```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "bbbb30a7ff02f5e8e4ac12a3cc47f3247d85f7b3",
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

## Classification
CONFIRMED

## Notes
The defect claim is confirmed because when a TypeScript file is changed (making the coverage path active), the CLI reports "coverage artifact malformed" for a missing coverage file, which is misleading—the file is missing, not malformed. Without a TypeScript change, the CLI returns UNSUPPORTED, which is correct behavior and does not match the defect claim.