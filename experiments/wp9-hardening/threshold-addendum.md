# WP9 Hardening Threshold Addendum — CLI Participation Update

**Date:** 2026-08-29
**Status:** ADDENDUM to `experiments/wp9/threshold-guidance.md` §3.2
**Contract:** 0.2.0 frozen — no CRAP formula or threshold change

## CLI Attribution Gap — Before / After

| State | Function | CC | Coverage | CRAP | CoverageKind | AnalyzerStatus | Tests |
|-------|----------|----|----------|------|--------------|----------------|-------|
| Before (WP9) | `src/cli.ts:parseCliArgs` | 23 | null (0% participation) | null (skipped) | N/A | skipped | 0 tests |
| Before (WP9) | `src/cli.ts:main` | 12 | null | null (skipped) | N/A | skipped | 0 tests |
| After (hardening) | `src/cli.ts:parseCliArgs` | 23 | 61.2% (Statements 60/98 covered (61.2%)) | 54 | statement | passed | 17 tests in `test/cli.unit.spec.ts` |
| After (hardening) | `src/cli.ts:main` | 12 | 0% (not exercised directly) | 156* | statement | passed | 0 direct (integration via CLI invocation) |

* `main` CRAP 156 = 12²×1³+12 (coverage 0). High due to CC12 + zero coverage — demonstrates threshold sensitivity; `main` is entrypoint wrapper, not pure logic.

CRAP formula (frozen `src/crapCalc.ts`): `CRAP = CC² × (1 - coverage/100)³ + CC`. Coverage measured via `vitest --coverage --coverage.provider=v8`.

## Threshold Policy Unchanged

| Threshold | Purpose | Source |
|-----------|---------|--------|
| 30 | Default gate (`changed-function-high-crap`) | `docs/contracts/evidence-contract.md:38`, `src/rules.js` |
| 15 | Supplemental stricter mode | `docs/contracts/evidence-contract.md:38` |

Gate logic `src/evidence.ts:248`: any `WARN` → overall `WARN`, all `PASS` → `PASS`.

At current 61.2% coverage, `parseCliArgs` CRAP 54 → **WARN** at threshold 30 (and WARN at 15). This is evidence-backed, not threshold tuning.

Before hardening, `crap:null` produced `NOT_EVALUATED` / `skipped` — correct per **INV-01 ZERO≠NULL** (unmeasured ≠ zero). Now measured coverage yields actionable CRAP.

## INV-01 Preserved

- **Before:** `null` correctly signaled unmeasured (not zero risk). Fix was not a path hack but adding unit tests.
- **After:** `parseCliArgs` now has measured coverage → `crap` number, `coverage` number. Functions still without coverage (e.g., `main`, test-file helpers) still correctly `null`/`skipped`. Zero vs null distinction preserved per `experiments/wp5/wp5.5/wp55-coverage-distinction.spec.ts`.
- **Export/guard change** (`src/cli.ts:9 export parseCliArgs`, `:110 export main`, `:160 guard`) is reversible via `git revert`, does not change CLI behavior when run as `node dist/cli.js check`.

## Verification

- `npx tsc --noEmit` clean
- `npx vitest run test/cli.unit.spec.ts --no-coverage` 17/17 pass
- `npx vitest run --no-coverage` 166/166 pass (57 files, was 149/149)
- `npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json` total keys 23, `src/cli.ts` key present with statementMap, artifact `coverage/coverage-final.json`
- `npm run build` ok, `dist/cli.js` 6.0K

## References

- `test/cli.unit.spec.ts` (17 tests)
- `src/cli.ts:9-106 parseCliArgs`, `:110-159 main`, `:160 guard`
- `experiments/wp9/threshold-guidance.md` §1.4 hypothetical CC23 table vs now measured
- `experiments/wp9/repro.md` §Task2 diagnosis (correct skipped per INV-01)
- `docs/contracts/evidence-contract.md` v0.2.0 invariants INV-01..04
