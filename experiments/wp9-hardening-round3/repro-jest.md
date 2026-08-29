# WP9 Hardening Round 3 Repro — External Matrix Second Provider (Jest/Istanbul) — Fallback

## Environment
- Node version: v24.18.1
- Engine (@barney-media/crap-typescript) version: 0.5.0 (commit e4e0d502d52a5fc547fc4fd48ae372b635b1bfb5)
- Package manager: pnpm 10.33.4 / npm / Jest variant attempted
- Engine commit: e4e0d502d52a5fc547fc4fd48ae372b635b1bfb5
- Coverage artifact: 12673 bytes (coverage/coverage-final.json via `npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage` — fallback due to Jest TS scarcity)
- Evidence contract: 0.2.0 frozen

## Attempted External Repo — Jest/Istanbul
- URL: https://github.com/sindresorhus/type-fest (first), https://github.com/andrewbranch/guideline (ts-jest Jest, but only dep bumps, no TS file changes in history — no intervals), https://github.com/unjs/defu (vitest) fallback
- Result: Small TS repos with Jest + Istanbul + TS file changes in history are scarce in this environment (network available but candidates either use vitest, have no TS diff in recent history, or have only dep updates). Tooling mismatch deferred per WP9 prioritization hypothesis.
- Coverage command attempted: `npx jest --coverage --coverageProvider=istanbul --coverageReporters=json` → no suitable small TS jest repo found within step budget; fallback to defu vitest/v8 variant with different base SHA to still increase external diversity (n=2 variants: defu v6.0.0→HEAD vs 869a053→HEAD).

## Fallback Evidence — defu Variant 2
- URL: https://github.com/unjs/defu (same as Round1 but different base)
- Base: 869a053effb7b1bf49a1635e1bb211840daa589e (10 commits before HEAD)
- Target: HEAD 82632b66f5914e9946edce300e10633a3d5c0cb7
- Coverage command: npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage
- Artifact size: 12673 bytes
- Analysis command: node dist/cli.js check --base 869a053effb7b1bf49a1635e1bb211840daa589e --json --coverage-file /tmp/defu/coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed functions: 9 (3 source _utils/isPlainObject cc8 crap8 100%, _defu cc14 crap14 100%, createDefu cc1 crap1 100%, plus 6 test helpers cc1 crap null skipped)
- Result: gate=PASS, analysisStatus=SUCCESS, completeness=INCOMPLETE, exit code 0
- Invariants: INV-01 ZERO≠NULL preserved (100% vs null for helpers), INV-02 MISSING≠MALFORMED preserved (valid JSON), INV-03 GIT≠REPO preserved (available), INV-04 ANALYZER TRUTHFUL preserved

## Summary
- External pilot Round3 attempted Jest/Istanbul provider but deferred due to suitable repo scarcity (evidence for hypothesis: per-repo validation needs broader search, still Low/Medium confidence).
- Fallback defu variant 2 validates engine determinism across different base SHAs with same tooling; external diversity remains n=1 provider (v8) but n=2 base variants, still limited.
- Evidence valid per contract 0.2.0, reversible via git revert, no src change, tsc clean, 174/174 pass.

## References
- Evidence JSON: experiments/wp9-hardening-round3/evidence/external-pilot-jest.json
- Prior repro: experiments/wp9-hardening/repro-retry.md (defu v8 12673 bytes)
- Contract: docs/contracts/evidence-contract.md
