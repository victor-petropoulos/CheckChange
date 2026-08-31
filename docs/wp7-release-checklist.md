# WP7 Release Checklist

## Contract
- [x] schemaVersion 0.2 frozen, docs/contracts/evidence-contract.md, INV-01..04 preserved

## Packaging
- [x] package.json version 0.2.0, bin checkchange→dist/cli.js (alias: code-risk→dist/cli.js), prepare→npm run build, declaration:true

## Install / Build
- [x] npm ci --dry-run ok
- [x] npm run build → tsc clean
- [x] npm pack --dry-run → 4.2M tarball, 1251 files

## CLI
- [x] checkchange check --help shows --verbose
- [x] check --base HEAD~1 --json → 0.2 JSON, gate PASS
- [x] check --base HEAD~1 --verbose → stderr diagnostics
- [x] exit codes per contract

## Tests
- [x] npx tsc --noEmit 0
- [x] npx vitest run --no-coverage 149/149
- [x] integration run-proof.sh PASS

## Security
- [x] src/coverage.ts path.relative boundary
- [x] git validate, no injection
- [x] malformed coverage → FAILED, no crash
- [x] no secrets

## Perf
- [x] perf-baseline.md recorded

## Docs
- [x] WP7_RESULTS.md
- [x] human-review-packet.md ends AWAITING HUMAN REVIEW

AWAITING HUMAN REVIEW
