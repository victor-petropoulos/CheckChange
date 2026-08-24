# h3 Real Artifact Verification Metadata

## Experiment Date
2026-08-24

## Repository
- **URL**: https://github.com/unjs/h3
- **Clone**: /tmp/wp4r1-h3
- **Target SHA**: baef4b94af47c3c71024807824657db9336ae9ca
- **Base SHA**: bd5cd6a7fd10028277786608065a90280f2fe2e0
- **Change**: fix(static): refuse a non-canonical pathname instead of resolving it
- **Changed Function**: serveStatic (src/utils/static.ts, lines 101-266)

## Coverage Generation
- **Command**: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure`
- **Exit Code**: 1 (2 known unrelated test failures, artifact produced)
- **Artifact Path**: coverage/coverage-final.json
- **Artifact Size**: 824,826 bytes
- **Format**: Istanbul JSON

## Prototype Invocation
- **Prototype Commit**: 633f717e58af6e5eec1541c9492f9a97097dc73a
- **Tool**: node dist/cli.js check
- **Args**: --base bd5cd6a7fd10028277786608065a90280f2fe2e0 --coverage-file coverage/coverage-final.json --crap-threshold 30 --json
- **CWD**: /tmp/wp4r1-h3
- **crap-typescript**: Installed via pnpm add -D @barney-media/crap-typescript@0.5.0 -w

## Results
- **analysisStatus**: SUCCESS
- **changedFunctions.length**: 1
- **Function**: serveStatic
- **Coverage**: 90.77% (branch)
- **CRAP**: 39.14
- **CC**: 38
- **Rule Triggered**: changed-function-high-crap (WARN)
- **Gate**: WARN
- **Completeness**: COMPLETE
