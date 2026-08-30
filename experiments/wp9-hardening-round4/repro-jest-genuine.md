# WP9 Hardening Round 4 Repro — Genuine Jest/Istanbul External Pilot

## Environment
- Node version: v24.18.1
- Engine (@barney-media/crap-typescript) version: 0.5.0 (commit 16cf1c0c078229055ba7b8d5a1088515562e0e5b)
- Package manager: npm 10.x (ts-jest repo) / pnpm 10.33.4 (engine repo)
- Engine commit: 16cf1c0c078229055ba7b8d5a1088515562e0e5b
- Coverage artifact: 277177 bytes (coverage/coverage-final.json via `npx jest --coverage --coverageProvider=babel --coverageReporters=json --coverageDirectory=coverage`)
- Evidence contract: 0.2.0 frozen

## External Repo — Genuine Jest/Istanbul (Success)
- URL: https://github.com/kulshekhar/ts-jest
- Base: eb135ebe819991b1e10c998915cc6db2057c4de1 (891dc73^, parent of TS7 compatibility fix)
- Target: HEAD b1a97ac485711377e01e72bac8b115e41a1c17ba (build: remove duplicated typescript eslint deps)
- Coverage command: npx jest --coverage --coverageProvider=babel --coverageReporters=json --coverageDirectory=coverage (run from /tmp/ts-jest, after npm install)
- Coverage provider: Jest with babel provider (Istanbul-compatible JSON, contains statementMap/fnMap/branchMap/s/f/b)
- Artifact size: 277177 bytes (wc -c coverage/coverage-final.json)
- Analysis command: cd /tmp/ts-jest && node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base eb135ebe819991b1e10c998915cc6db2057c4de1 --json --coverage-file /tmp/ts-jest/coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed functions: 6 (3 source TsCompiler._transpileOutput cc4 crap4.37 71.4% PASS, TsCompiler._filterDiagnosticsFromTsJestDefaults cc7 crap7.11 86.6% PASS, Importer.typescript cc5 crap5.03 88.8% PASS; plus 3 skipped: throwMappedError cc1 null, 2x importer.spec helper cc1 null)
- Result: gate=PASS, analysisStatus=SUCCESS, completeness=INCOMPLETE, exit code 0
- Invariants: INV-01 ZERO≠NULL preserved (71-88% vs null skipped), INV-02 MISSING≠MALFORMED preserved (valid Istanbul JSON with statementMap), INV-03 GIT≠REPO preserved (available), INV-04 ANALYZER TRUTHFUL preserved (passed/skip)

## Prior Attempts This Round
- microsoft/tsdoc: not yet tried (deferred, ts-jest succeeded first)
- kulshekhar/ts-jest initial base d82e0f0→b1a97ac had only dep bumps, no TS intervals → UNSUPPORTED (0 funcs), corrected to eb135eb→b1a97ac with TS diffs
- typestack/class-validator: not needed (ts-jest genuine success)

## Summary
- Genuine Jest/Istanbul provider success validates per-repo validation hypothesis: engine agnostic to provider (Istanbul JSON via babel vs v8) but requires per-repo TS interval discovery; vitest v8 defu 12673 bytes PASS + ts-jest babel 277177 bytes PASS both contract 0.2 valid.
- External diversity now n=2 providers (v8 + Istanbul/babel) across 2 repos, up from n=1 v8 + fallback variant.
- Evidence valid per contract 0.2.0, reversible via git revert, no src change, tsc clean, 174/174 pass.

## References
- Evidence JSON: experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json
- Prior repros: experiments/wp9-hardening/repro-retry.md (defu v8), experiments/wp9-hardening-round3/repro-jest.md (defu variant2 fallback)
- Contract: docs/contracts/evidence-contract.md
