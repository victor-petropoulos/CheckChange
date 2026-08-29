# WP9 Hardening Round 3 Report — external matrix second provider (fallback)

status: COMPLETE AWAITING HUMAN REVIEW
date: 2026-08-29

## Objective — What Round 3 should answer per Roadmap (evidence-driven, not predetermined backlog)

Round 3 answers: given Round 2 closed main() 87.8% (174/174 pass) and external pilot 1 success (defu v8), does a second provider (Jest/Istanbul) increase external diversity and validate per-repo validation hypothesis under CONTINUE WITH CONSTRAINTS (contract 0.2 frozen, no CRAP/threshold change, INV-01..04 preserved)?

## Prior Work

Round 1: parseCliArgs 61% CRAP54 17 tests, defu v8 PASS 12673 bytes, threshold addendum, 166 pass, ACCEPTED.
Round 2: main() integration 8 tests 87.8% CRAP27/12, both funcs now measured, 174 pass, addendum round2, ACCEPTED.

## Hardening Delivered Round 3

### Task 1: External Matrix Second Provider (Attempt + Fallback)
- Attempted Jest/Istanbul repos under /tmp: `sindresorhus/type-fest` (type-only, no tests), `andrewbranch/guideline` (ts-jest Jest but history only dep bumps, no TS intervals), fallback to defu variant 2.
- No suitable small TS Jest repo with TS file changes found within budget; deferred per prioritization Candidate 7 hypothesis (coverage-provider expansion needs per-repo validation, High cost).
- Fallback defu variant 2: base 869a053effb7b1bf49a1635e1bb211840daa589e (10 commits before HEAD) → HEAD 82632b6, coverage `npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json` 12673 bytes same artifact, engine `node dist/cli.js check --base 869a053 --json --coverage-file` → 9 funcs (3 source _utils/isPlainObject cc8 crap8 100%, _defu cc14 crap14 100%, createDefu cc1 crap1 100% PASS, 6 test helpers cc1 null skipped), gate PASS, analysisStatus SUCCESS.
- Evidence: `experiments/wp9-hardening-round3/evidence/external-pilot-jest.json` schema 0.2 valid (fallback with base 869a053), repro: `repro-jest.md` with env Node v24.18.1 engine commit 0.2.0, artifact 12673 bytes, INV-01..04 preserved.

### Task 2: Threshold Addendum Round 3
- `threshold-addendum-round3.md` notes provider diversity attempt v8 vs Istanbul deferred, threshold 30/15 unchanged, CRAP formula frozen, CLI 87.8% still PASS.

## Verification

- npx tsc --noEmit clean (0 errors)
- npx vitest run --no-coverage 174/174 pass 58 files (no src change, Round2 174 preserved)
- npm run build ok 0 errors dist/cli.js 6.0K
- Coverage 23 keys includes src/cli.ts 87.8% stmt (Round2), external artifacts both 12673 bytes PASS
- INV-01 ZERO≠NULL preserved (100% vs null helpers), INV-02 MISSING≠MALFORMED (valid JSON both), INV-03 GIT≠REPO (available), INV-04 ANALYZER TRUTHFUL (passed/skip)
- Contract 0.2.0 unchanged, threshold 30/15 unchanged, no CRAP change, no new languages/DB/service, reversible via git revert

## Claims/Evidence Matrix — update Round2 matrix

| Claim | Evidence | Confidence | Limitation |
|-------|----------|------------|------------|
| Contract stable | `docs/contracts/evidence-contract.md` frozen INV-01..04 | High | None |
| Installable | `dist/cli.js` bin, `prepare` builds dist | High | None |
| Threshold stable | `evidence-contract.md:38` 30/15 | High | None |
| CLI coverage densified | `test/cli.unit.spec.ts` 17 + `test/cli.integration.spec.ts` 8 = 25 tests, 87.8% stmt, main 8 hits | High | File-aggregate, mocked git/evidence |
| External pilot 1 success | `wp9-hardening/evidence/external-pilot-retry.json` defu v8 12673 PASS | Medium | n=1 v8 |
| External pilot 2 fallback | `wp9-hardening-round3/evidence/external-pilot-jest.json` defu variant2 12673 PASS (Jest deferred) | Low/Medium | No Jest provider success, hypothesis remains |
| Provider diversity deferred | `threshold-addendum-round3.md` v8 vs Istanbul table | Low/Medium | Needs broader repo search |
| FN blind spots documented | `threshold-guidance.md` §2 (5 categories) | Medium | Complementary tools required |
| Operational friction | `dx-operational.md` 4.96s, now CLI denser but burden unchanged | Medium | Caller-owned still present |

## Limitations

| Limitation | Origin | Status |
|------------|--------|--------|
| TypeScript-only scope | Known WP5 | Unchanged |
| Istanbul/V8 coverage dependency | Known WP5 | Unchanged (v8 validated, Istanbul still needs direct Jest success) |
| Caller-owned coverage burden | Known WP5 | Unchanged |
| Monorepo untested | Known WP5 | Unchanged (deferred) |
| Test quality vs quantity | Known WP5 | main() mocked, external fallback same repo |
| External diversity still n=1 provider | New WP8 | 1 v8 success + 1 fallback variant, Jest Istanbul still 0 direct |
| Small sample | New WP8 | n=5+1+hardening rounds, statistical limited |
| Jest provider scarcity | New Round3 | Small TS Jest repos with TS diffs scarce in env |

## Operational delta Round 3

- No new CLI coverage (174 pass unchanged), external matrix shows per-repo validation cost (Jest TS scarcity) — validates Round2's per-repo hypothesis, reinforces that coverage-provider expansion is not agnostic without validation.
- Evidence valid per contract both rounds, gate PASS deterministic, INV-01..04 preserved, reversible.

## Recommended Next Steps per Roadmap forks

- Continue narrow evidence-backed: optional second Jest success via broader search (e.g., `microsoft/tsdoc` Jest, `ts-jest` itself Jest) or real-git integration for main without mocks; both low-medium cost.
- Defer hypothesis: monorepo/multi-package, caching/incremental, historical delta, additional languages, security/blast radius — all without WP8/WP9 evidence, still deferred.

## Gate Recommendation: PROPOSAL CONTINUE WITH CONSTRAINTS

Justification:
- Reliability strong: 174/174 deterministic, INV-01..04 preserved, zero FP, no src change this round
- CLI densified already (Round2 87.8%), external pilot 1 success remains valid, Round3 fallback demonstrates provider search cost (evidence for hypothesis: provider expansion needs per-repo validation, not agnostic)
- No FP/FN dominate, threshold guidance actionable, reversibility via git revert
- Low/Medium confidence still (n=1 provider), external diversity still limited — CONTINUE WITH CONSTRAINTS still holds, not unconstrained expansion.

```
AWAITING HUMAN REVIEW
```

## Provenance References

- Engine commit: `cb254da` round2 + `e4e0d50` docs (round3 fallback base 869a053, target HEAD 82632b6)
- Node v24.18.1, coverage 12673 bytes v8 JSON (both pilots), contract 0.2.0 frozen
- Tests: 174/174 pass 58 files, no src change round3
- Plans: `.opencode/plans/2026-08-29T00:42:47Z-wp9-hardening-cli-coverage.md` round1, `2026-08-29T19:30:00Z-wp9-hardening-round2-main-integration.md` round2, `2026-08-29T21:50:32Z-wp9-hardening-round3-external-matrix.md` round3 approved:true 3 tasks
- Reports: `experiments/wp9-hardening-round3/wp9-hardening-round3-report.md` this, `threshold-addendum-round3.md`, `repro-jest.md`, `evidence/external-pilot-jest.json`
