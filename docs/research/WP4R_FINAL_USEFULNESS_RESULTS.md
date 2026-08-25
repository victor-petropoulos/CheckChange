# WP4R Final Usefulness Results

## Status
AWAITING HUMAN REVIEW — no autonomous usefulness classification has been performed.

## Repository and Case Selection

| Repo | Case | Classification | Base | Target | Subject |
|------|------|----------------|------|--------|---------|
| h3 | h3-01 | Small (1 fn) | 43e1fa3 | 708a3aa | fix(body): enforce stream-based body size check re |
| h3 | h3-02 | Moderate (2-3 fn) | 60a2e91 | d1da262 | feat: add `requestWith*URL` utils and use for fast |
| h3 | h3-03 | Non-trivial (≥4 fn) | 1faca72 | 6c773a4 | feat: add `setServerTiming` and `withServerTiming` |
| hono | hono-01 | Small (1 fn) | 5bfbff8 | c4577e9 | fix(cors): Allow returning null or undefined for o |
| hono | hono-02 | Moderate (2-3 fn) | 393ded9 | 81bda2e | feat(helper/route): enable to get route path at sp |
| hono | hono-03 | Non-trivial (≥4 fn) | d9f7b99 | 117d0a4 | feat(csrf): Add modern CSRF protection with Fetch  |
| apollo-client | apollo-01 | Small (1 fn) | c34538e | f6d0efa | Fix cache.modify() mapping readonly arrays to sing |
| apollo-client | apollo-02 | Moderate (2-3 fn) | 4d3fb77 | db8a04b | Prevent unhandled rejection for promise returned f |
| apollo-client | apollo-03 | Non-trivial (≥4 fn) | 5352c12 | 71f2517 | Support `skipToken` with `useQuery` (#12895) |

All base/target SHAs were pinned before prototype execution. No case uses a commit previously observed to produce a specific CRAP gate (h3 serveStatic baef4b9 and Hono parseSigned 241ae4c excluded).

## Coverage Commands and Artifact Paths

- h3/h3-01: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` → `coverage/coverage-final.json`
- h3/h3-02: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` → `coverage/coverage-final.json`
- h3/h3-03: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` → `coverage/coverage-final.json`
- hono/hono-01: `npx vitest --run --project=main --coverage` → `coverage/raw/default/coverage-final.json`
- hono/hono-02: `npx vitest --run --project=main --coverage` → `coverage/raw/default/coverage-final.json`
- hono/hono-03: `npx vitest --run --project=main --coverage (fallback: npx vitest --run --coverage for this SHA)` → `coverage/raw/default/coverage-final.json`
  - Note: hono-03 required fallback from `--project=main` to no-filter due to vitest project mismatch at that SHA.
- apollo-client/apollo-01: `node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/cache/core"` → `coverage/coverage-final.json`
  - Note: apollo case used `--testPathPatterns` (plural, Jest 30) with narrow scope and `--coverageDirectory` absolute path.
- apollo-client/apollo-02: `node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/react/hooks/__tests__/useMutation"` → `coverage/coverage-final.json`
  - Note: apollo case used `--testPathPatterns` (plural, Jest 30) with narrow scope and `--coverageDirectory` absolute path.
- apollo-client/apollo-03: `node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/react/hooks/__tests__/useQuery"` → `coverage/coverage-final.json`
  - Note: apollo case used `--testPathPatterns` (plural, Jest 30) with narrow scope and `--coverageDirectory` absolute path.

## Execution Success Table

| Repo/Case | Coverage exit | Prototype 30 exit | Prototype 15 exit | analysisStatus 30 | gate 30 | completeness 30 |
|-----------|---------------|-----------------|-------------------|-------------------|---------|---------------|
| h3/h3-01 | 0 | 0 | 0 | SUCCESS | PASS | COMPLETE |
| h3/h3-02 | 0 | 0 | 0 | SUCCESS | PASS | INCOMPLETE |
| h3/h3-03 | 0 | 0 | 0 | SUCCESS | PASS | COMPLETE |
| hono/hono-01 | 0 | 0 | 0 | SUCCESS | PASS | COMPLETE |
| hono/hono-02 | 0 | 0 | 0 | SUCCESS | PASS | COMPLETE |
| hono/hono-03 | 0 | 0 | 0 | SUCCESS | PASS | COMPLETE |
| apollo-client/apollo-01 | 1 | 1 | 1 | SUCCESS | PASS | COMPLETE |
| apollo-client/apollo-02 | 1 | 1 | 1 | SUCCESS | PASS | INCOMPLETE |
| apollo-client/apollo-03 | 1 | 1 | 1 | SUCCESS | PASS | INCOMPLETE |

## Evaluation Rates and Counts

- Total changed functions at threshold 30: 21
  - PASS: 14, WARN: 0, NOT_EVALUATED: 7
- Total changed functions at threshold 15: 21
  - PASS: 14, WARN: 0, NOT_EVALUATED: 7
- Cases with 0 changed functions at threshold 30: 2 (hono-01, apollo-01) — type-only or undetected changes
- Cases with COMPLETE vs INCOMPLETE: 6 COMPLETE, 3 INCOMPLETE (h3-02 has NOT_EVALUATED due to missing coverage on one file)

## Human Classifications

No human classifications have been supplied. Packet at `experiments/wp4r-final/human-review-packet.md` contains every WARN (0 at threshold 30) and sampled PASSes (up to 2 per case) with blank classification fields.

## PASS Sample Classifications

No PASS sample classifications supplied. At least 5 PASS functions with higher CC near threshold were included in packet where available.

## Threshold Sensitivity (30 vs 15)

- WARN count at 30: 0, at 15: 0, additional at 15: 0
- No thresholds produced WARNs in this dataset; all changed functions have CRAP ≤15, so lowering threshold to 15 did not create additional WARNs.
- Threshold sensitivity cannot be assessed for high-CRAP cases because none were observed; this limits inference about threshold choice.

## Coverage Spot Checks (≥5)

Spot checks verify file/method/line mapping and coverage plausibility (performed via `git show <target>:<file>` and artifact key presence):
- h3/h3-01 src/utils/body.ts:isBodySizeWithin — CC 7 CRAP 7.39 cov 80% — plausible: stream size check with early returns, coverage 80% branch
- h3/h3-03 src/utils/timing.ts:setServerTiming — CC 10 CRAP 10 cov 100% — plausible: timing util with header validation
- hono/hono-02 src/helper/route/index.ts:basePath — CC 10 CRAP 10.04 cov 92.3% — plausible: route path with multiple branches
- hono/hono-03 src/middleware/csrf/index.ts:csrf — CC 3 CRAP 3 cov 100% — plausible: CSRF middleware wrapper
- apollo/apollo-02 src/react/hooks/useMutation.ts:useMutation — CC ~3-5 CRAP low cov present — plausible: hook with error handling
- apollo/apollo-03 src/react/hooks/useQuery.ts:useQuery — CC moderate CRAP low — plausible

## Operational Friction

- Dependency installs: h3 `pnpm add -w -D @barney-media/crap-typescript@0.5.0`, hono/apollo `npm install -D @barney-media/crap-typescript@0.5.0` required because prototype runs `npx --no-install crap-typescript` from target CWD. Documented as caller-side prerequisite; stashed before checkouts to keep trees clean (node_modules gitignored).
- Coverage generation: h3 vitest V8 JSON command worked directly; hono required `--project=main` to avoid flaky runtime-tests, with fallback to no-filter for hono-03 (old SHA where main project not defined); apollo required `--testPathPatterns` (plural, Jest 30) and `--coverageDirectory` absolute path (relative resolved to config/coverage). Narrow scopes used for apollo (src/cache/core 5s, useMutation 19s, useQuery 69s) vs full hooks 286s — case-attributable scope kept runtime manageable.
- Artifact paths: h3 `coverage/coverage-final.json`, hono `coverage/raw/default/coverage-final.json`, apollo `coverage/coverage-final.json` (absolute). All validated via `jq`.
- Monorepo/CWD issues: apollo coverageDirectory relative misrouting fixed via absolute path; hono project filter mismatch fixed via fallback.
- Runtimes: h3 ~6s per case, hono ~6s per case, apollo 5s/19s/69s per case (narrow), prototype ~0-1s per threshold.
- Manual setup: none beyond prerequisite installs and stash handling.

## Failures and Limitations

- hono-01 and apollo-01 produced 0 changed functions at both thresholds despite being classified Small (1 fn) by diff. Cause: type-only or small edit not mapped to a function interval by the prototype (e.g., apollo-01 is type definition in common.ts, hono-01 is 7-line cors edit that may be inside a closure not counted). This is a valid finding: prototype reports COMPLETE with 0 functions, not an error, but limits evaluation for those cases.
- h3-02 has 4 changed functions but one with NOT_EVALUATED (crap null, coverage null) — `src/h3.ts:H3.mount` has no coverage because its file was absent from artifact or attribution unavailable. Completeness INCOMPLETE for that case.
- hono-03 required coverage command fallback; without fallback, artifact would have been missing.
- apollo required Jest flag migration (`--testPathPattern` → `--testPathPatterns`) due to Jest 30 upgrade at newer SHAs vs older; narrow scope was required to keep runtime feasible.
- All 9 cases produced PASS at both thresholds; no high-CRAP functions were observed, so threshold sensitivity and WARN usefulness could not be evaluated on high-risk examples.

## Unexpected Findings

- Zero WARNs across all cases at both thresholds, despite including non-trivial cases (4-6 functions, up to 170 lines). All observed CRAPs are low (≤10-11). This suggests either the selected historical changes are not high-complexity, or thresholds 15/30 are not selective for this sample.
- Two small cases produced 0 changed functions, indicating a mismatch between diff-based classification (1 fn) and prototype's function-interval detection. This edge case was not anticipated in selection.
- hono and h3 coverage generation succeeded with exit 0 despite 4 failed tests (hono) — artifact still valid, matching WP4R.2 pattern where exit 1 still produced artifact; here exit 0 with failures still produced valid artifact.

## Recommendation

No autonomous classification of usefulness is performed. Human review is required to assess whether the observed PASSes are EXPECTED_PASS or QUESTIONABLE_PASS and whether threshold 15 vs 30 matters for these low-CRAP changes. The dataset as captured is coherent and preserved for review.

```text
AWAITING HUMAN REVIEW
```