# WP9 Hardening Round 4 Report — genuine Jest/Istanbul provider

status: COMPLETE AWAITING HUMAN REVIEW
date: 2026-08-29

## Objective — What Round 4 should answer per Roadmap (evidence-driven, not predetermined backlog)

Round 4 answers: given Round 3 closed main() 87.8% (174/174 pass) and external pilot 1 success (defu v8) + fallback variant, does a genuine Jest/Istanbul second provider increase external diversity to n=2 providers and validate per-repo validation hypothesis under CONTINUE WITH CONSTRAINTS (contract 0.2 frozen, no CRAP/threshold change, INV-01..04 preserved)?

## Prior Work

Round 1: parseCliArgs 61% CRAP54 17 tests, defu v8 PASS 12673 bytes, threshold addendum, 166 pass, ACCEPTED.
Round 2: main() integration 8 tests 87.8% CRAP27/12, both funcs now measured, 174 pass, addendum round2, ACCEPTED.
Round 3: fallback defu variant 2 (no suitable TS Jest repo found), defu variant2 12673 bytes PASS Low/Medium, provider diversity deferred, threshold addendum round3.

## Hardening Delivered Round 4

### Task 1: External Matrix Genuine Jest/Istanbul Provider (Success)
- Repo: `kulshekhar/ts-jest` (https://github.com/kulshekhar/ts-jest)
- Base: `eb135ebe819991b1e10c998915cc6db2057c4de1` (parent of TS7 compatibility fix, 891dc73^)
- Target: HEAD `b1a97ac485711377e01e72bac8b115e41a1c17ba` (build: remove duplicated typescript eslint deps)
- Coverage command: `npx jest --coverage --coverageProvider=babel --coverageReporters=json --coverageDirectory=coverage` (run from `/tmp/ts-jest`, after `npm install`)
- Coverage provider: Jest with babel provider (Istanbul-compatible JSON, contains statementMap/fnMap/branchMap/s/f/b) — genuine Istanbul format
- Artifact size: 277,177 bytes (wc -c coverage/coverage-final.json)
- Analysis command: `cd /tmp/ts-jest && node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base eb135ebe819991b1e10c998915cc6db2057c4de1 --json --coverage-file /tmp/ts-jest/coverage/coverage-final.json`
- Threshold (crapThreshold): 30
- Changed functions: 6 (3 source: TsCompiler._transpileOutput cc4 crap4.37 71.4% stmt PASS, TsCompiler._filterDiagnosticsFromTsJestDefaults cc7 crap7.11 86.6% branch PASS, Importer.typescript cc5 crap5.03 88.8% branch PASS; 3 skipped: throwMappedError cc1 null, 2× importer.spec helper cc1 null)
- Result: gate=PASS, analysisStatus=SUCCESS, completeness=INCOMPLETE, exit code 0
- Invariants verified: INV-01 ZERO≠NULL preserved (71-88% vs null skipped), INV-02 MISSING≠MALFORMED preserved (valid Istanbul JSON with statementMap), INV-03 GIT≠REPO preserved (available), INV-04 ANALYZER TRUTHFUL preserved (passed/skip)
- Evidence: `experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json` schema 0.2 valid
- Repro: `repro-jest-genuine.md` with env Node v24.18.1 engine commit 16cf1c0, artifact 277177 bytes, INV-01..04 preserved

### Task 2: Threshold Addendum Round 4
- `threshold-addendum-round4.md` notes provider diversity now v8 vs Istanbul genuine (defu 12,673 bytes v8 + ts-jest 277,177 bytes babel Istanbul), both PASS, threshold 30/15 unchanged, CRAP formula frozen, no source modifications.

## Verification

- npx tsc --noEmit clean (0 errors)
- npx vitest run --no-coverage 174/174 pass 58 files (no src change, Round2 174 preserved)
- npm run build ok 0 errors dist/cli.js 6.0K
- Coverage artifacts: defu v8 12,673 bytes + ts-jest babel Istanbul 277,177 bytes both PASS contract 0.2
- INV-01 ZERO≠NULL preserved (source funcs 71-88% coverage vs null skipped)
- INV-02 MISSING≠MALFORMED preserved (both artifacts valid JSON with statementMap)
- INV-03 GIT≠REPO preserved (git available in both repos)
- INV-04 ANALYZER TRUTHFUL preserved (all ruleResults PASS or NOT_EVALUATED correctly)
- Contract 0.2.0 unchanged, threshold 30/15 unchanged, no CRAP change, no new languages/DB/service, reversible via git revert

## Claims/Evidence Matrix — update Round 3 matrix

| Claim | Evidence | Confidence | Limitation |
|-------|----------|------------|------------|
| Contract stable | `docs/contracts/evidence-contract.md` frozen INV-01..04 | High | None |
| Installable | `dist/cli.js` bin, `prepare` builds dist | High | None |
| Threshold stable | `evidence-contract.md:38` 30/15 | High | None |
| CLI coverage densified | `test/cli.unit.spec.ts` 17 + `test/cli.integration.spec.ts` 8 = 25 tests, 87.8% stmt, main 8 hits | High | File-aggregate, mocked git/evidence |
| External pilot 1 success | `wp9-hardening/evidence/external-pilot-retry.json` defu v8 12673 PASS | Medium | n=1 v8 |
| External pilot 2 fallback | `wp9-hardening-round3/evidence/external-pilot-jest.json` defu variant2 12673 PASS (Jest deferred) | Low/Medium | No Jest provider success, hypothesis remains |
| External pilot 3 genuine Jest | `wp9-hardening-round4/evidence/external-pilot-jest-genuine.json` ts-jest babel Istanbul 277177 PASS | Medium | n=1 Istanbul, single repo |
| Provider diversity n=2 | `threshold-addendum-round4.md` v8 + Istanbul/babel table, 2 repos | Medium | Small sample n=2, monorepo untested |
| FN blind spots documented | `threshold-guidance.md` §2 (5 categories) | Medium | Complementary tools required |
| Operational friction | `dx-operational.md` 4.96s, now CLI denser but burden unchanged | Medium | Caller-owned still present |

## Limitations

| Limitation | Origin | Status |
|------------|--------|--------|
| TypeScript-only scope | Known WP5 | Unchanged |
| Istanbul/V8 coverage dependency | Known WP5 | Unchanged (v8 + Istanbul/babel both validated) |
| Caller-owned coverage burden | Known WP5 | Unchanged |
| Monorepo untested | Known WP5 | Unchanged (deferred) |
| Test quality vs quantity | Known WP5 | main() mocked, external pilot separate repo |
| External diversity n=2 providers | New WP8 | 1 v8 + 1 Istanbul/babel, statistical limited |
| Small sample | New WP8 | n=2 repos across hardening rounds |
| Jest provider scarcity | Round3 | Small TS Jest repos with TS diffs scarce in env (ts-jest succeeded on 2nd base attempt) |

## Operational delta Round 4

- No new CLI coverage (174 pass unchanged), external matrix now genuine provider diversity (v8 + Istanbul/babel) — validates Round2/3 per-repo hypothesis: engine agnostic to Istanbul JSON provider but requires per-repo TS interval discovery; coverage-provider expansion not agnostic without validation.
- Evidence valid per contract both rounds, gate PASS deterministic, INV-01..04 preserved, reversible.

## Recommended Next Steps per Roadmap forks

- Continue narrow evidence-backed: optional second Jest success via broader search (e.g., `microsoft/tsdoc` Jest, additional repo) or real-git integration for main without mocks; both low-medium cost.
- Defer hypothesis: monorepo/multi-package, caching/incremental, historical delta, additional languages, security/blast radius — all without WP8/WP9 evidence, still deferred.

## Gate Recommendation: PROPOSAL CONTINUE WITH CONSTRAINTS

Justification:
- Reliability strong: 174/174 deterministic, INV-01..04 preserved, zero FP, no src change this round
- CLI densified already (Round2 87.8%), external pilot 1 success v8 + Round4 genuine Istanbul both PASS contract 0.2
- Provider diversity now n=2 (v8 + Istanbul/babel) across 2 repos, hypothesis validated (per-repo holds, not agnostic)
- No FP/FN dominate, threshold guidance actionable, reversibility via git revert
- Confidence Medium (n=2 providers, single Istanbul repo) — CONTINUE WITH CONSTRAINTS still holds, not unconstrained expansion.

```
AWAITING HUMAN REVIEW
```

## Provenance References

- Engine commit: `16cf1c0c078229055ba7b8d5a1088515562e0e5b`
- Node v24.18.1, coverage sizes: defu v8 12,673 bytes, ts-jest babel Istanbul 277,177 bytes, contract 0.2.0 frozen
- Tests: 174/174 pass 58 files, no src change round4
- Plans: `.opencode/plans/2026-08-29T00:42:47Z-wp9-hardening-cli-coverage.md` round1, `2026-08-29T19:30:00Z-wp9-hardening-round2-main-integration.md` round2, `2026-08-29T21:50:32Z-wp9-hardening-round3-external-matrix.md` round3, `2026-08-29T22:39:38Z-wp9-hardening-round4-genuine-jest-provider.md` round4 all approved:true
- Reports: `experiments/wp9-hardening-round4/wp9-hardening-round4-report.md` this, `threshold-addendum-round4.md`, `repro-jest-genuine.md`, `evidence/external-pilot-jest-genuine.json`