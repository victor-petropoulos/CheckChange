# Hono Real Artifact Verification Metadata

## Experiment Date
2026-08-24

## Repository
- **URL**: https://github.com/honojs/hono
- **Clone**: /tmp/wp4r-repos/hono
- **Target SHA**: 241ae4c72b7ab732e425f40ea28cd3af2e78d8a2
- **Base SHA**: c409d855d91d1f0904d19439692216fcf789e6cb
- **Change**: fix(cookie): allow parsing signed cookies with empty string values (#5246)
- **Changed Function**: parseSigned (src/utils/cookie.ts, lines 146-171)

## Coverage Generation
- **Command**: `npm run coverage` (native config: vitest --run --coverage)
- **Exit Code**: 0 (all 4931 tests passed, 44 skipped)
- **Artifact Path**: coverage/raw/default/coverage-final.json
- **Artifact Size**: 1,594,620 bytes
- **Format**: Istanbul JSON

## Prototype Invocation
- **Prototype Commit**: 633f717e58af6e5eec1541c9492f9a97097dc73a
- **Tool**: node dist/cli.js check
- **Args**: --base c409d855d91d1f0904d19439692216fcf789e6cb --coverage-file coverage/raw/default/coverage-final.json --crap-threshold 30 --json
- **CWD**: /tmp/wp4r-repos/hono
- **crap-typescript**: Installed via npm install -D @barney-media/crap-typescript@0.5.0

## Results
- **analysisStatus**: SUCCESS
- **changedFunctions.length**: 1
- **Function**: parseSigned
- **Coverage**: 100% (stmt)
- **CRAP**: 6.0
- **CC**: 6
- **Rule Triggered**: changed-function-high-crap (PASS)
- **Gate**: PASS
- **Completeness**: COMPLETE
