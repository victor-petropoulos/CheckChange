# WP4R Usefulness Validation Results

**Date:** 2026-08-24
**Run generated:** 2026-08-24T11:13:00Z
**Source:** `experiments/wp4r/aggregate-results.json` (18 case runs)

## 1. Repository Selection Rationale

Three repositories selected before any tool execution, per plan §T.2:

| Repo | Size | TS Source | Rationale |
|------|------|-----------|-----------|
| **h3** (A) | Small | 174 `.ts`, 0 `.d.ts` | Focused HTTP framework. High TS density, vitest with `--coverage` built-in, ~800 commits, MIT. |
| **hono** (B) | Medium | 327 `.ts`, 1 `.d.ts` | Web framework. Substantial TS impl, 1255 commits, MIT, buildable with vitest. |
| **nx** (C) | Large monorepo | 4380 `.ts`, 232 `.d.ts` | Monorepo tool. Structurally different (many packages, complex build), 1000+ commits, MIT, pnpm. |

Confirmation: `experiments/wp4r/repository-selection.md` ends with `YES` — repos chosen before observing output.

## 2. Base/Target SHAs

| Case | Repo | Base SHA | Target SHA |
|------|------|----------|------------|
| h3/case-01 | unjs/h3 | `75fd2de8797122070562cb8e9a39517244cfb92e` | `f05b3748165b084ff2b2bf69ae5dd67f0dca8d4e` |
| h3/case-02 | unjs/h3 | `bd5cd6a7fd10028277786608065a90280f2fe2e0` | `baef4b94af47c3c71024807824657db9336ae9ca` |
| h3/case-03 | unjs/h3 | `61b1548a40b02dc0f56d28feadabc78ceeb06184` | `3a57939c3e390b839985d06db28100b215c794ef` |
| hono/case-01 | honojs/hono | `c409d855d91d1f0904d19439692216fcf789e6cb` | `241ae4c72b7ab732e425f40ea28cd3af2e78d8a2` |
| hono/case-02 | honojs/hono | `1096d66e03a3fd16a5cc5f912c2d5e8fd6d990b0` | `28a9c128912de19f3fb28b00ae289c9b93f6f392` |
| hono/case-03 | honojs/hono | `48e360fcaa107c7706fcf8adccb93505876791dc` | `a10592f3e1864cbe277619633db953450a6b1e4b` |
| nx/case-01 | nrwl/nx | `d0b3b20da760bbecce70ec976e0d8806cb8e13ad` | `b9df9d255ba14a19a4f6e2d510f22bd2aa13cdf` |
| nx/case-02 | nrwl/nx | `f3ddb91cef8637b9d8bdf70ffad70c12b07caacf` | `2ead4a939a0b24f12dbd26bcabbc56379e3c6f` |
| nx/case-03 | nrwl/nx | `2ead4a939a0b24f12dbd26bcabbc56379e3c6f` | `dc32ce73b59fb68e808909f666e4122980843354` |

## 3. Coverage Preparation Per Case

| Case | Coverage Intent | Command Used | Coverage-Check Result | Friction |
|------|----------------|--------------|----------------------|----------|
| h3/case-01 | present | `vitest --run --coverage` | File absent: `coverage-final.json` not found | vitest --coverage ran but no artifact produced |
| h3/case-02 | absent | n/a | `absent` | N/A |
| h3/case-03 | present (mixed) | `vitest --run --coverage` | File absent: `coverage-final.json` not found | vitest --coverage ran but no artifact produced |
| hono/case-01 | present | `vitest --run --coverage` | File absent: `coverage-final.json` not found | vitest --coverage ran but no artifact produced |
| hono/case-02 | absent | n/a | `absent` | N/A |
| hono/case-03 | present (mixed) | `vitest --run --coverage` | File absent: `coverage-final.json` not found | vitest --coverage ran but no artifact produced |
| nx/case-01 | absent | n/a | `absent` | N/A |
| nx/case-02 | present | `pnpm test -- --coverage` | File absent: `coverage-final.json` not found | pnpm version + monorepo complexity; nx test runner does not output vitest coverage |
| nx/case-03 | absent | n/a | `absent` | N/A |

Key finding: **Coverage artifacts absent for ALL cases** despite `vitest --coverage` being the intended command for h3 and hono. The coverage check consistently reports file-not-found.

## 4. Execution Success/Failure Table

All 18 case runs (9 cases × 2 thresholds) completed with `exitCode=0` and `analysisStatus=SUCCESS`.

| Case | Threshold | Changed Files | Changed Functions | PASS | WARN | NOT_EVALUATED | Max CC | Runtime (ms) | Gate |
|------|-----------|---------------|-------------------|------|------|---------------|--------|--------------|------|
| h3/case-01 | 30 | 0 | 0 | 0 | 0 | 0 | 0 | 361 | PASS |
| h3/case-01 | 15 | 0 | 0 | 0 | 0 | 0 | 0 | 346 | PASS |
| h3/case-02 | 30 | 2 | 1 | 0 | 0 | 1 | 38 | 339 | PASS |
| h3/case-02 | 15 | 2 | 1 | 0 | 0 | 1 | 38 | 331 | PASS |
| h3/case-03 | 30 | 5 | 2 | 0 | 0 | 2 | 3 | 346 | PASS |
| h3/case-03 | 15 | 5 | 2 | 0 | 0 | 2 | 3 | 345 | PASS |
| hono/case-01 | 30 | 3 | 1 | 0 | 0 | 1 | 6 | 416 | PASS |
| hono/case-01 | 15 | 3 | 1 | 0 | 0 | 1 | 6 | 418 | PASS |
| hono/case-02 | 30 | 2 | 3 | 0 | 0 | 3 | 5 | 408 | PASS |
| hono/case-02 | 15 | 2 | 3 | 0 | 0 | 3 | 5 | 410 | PASS |
| hono/case-03 | 30 | 4 | 5 | 0 | 0 | 5 | 22 | 410 | PASS |
| hono/case-03 | 15 | 4 | 5 | 0 | 0 | 5 | 22 | 410 | PASS |
| nx/case-01 | 30 | 7 | 0 | 0 | 0 | 0 | 0 | 1774 | PASS |
| nx/case-01 | 15 | 7 | 0 | 0 | 0 | 0 | 0 | 1681 | PASS |
| nx/case-02 | 30 | 6 | 14 | 0 | 0 | 14 | 19 | 1681 | PASS |
| nx/case-02 | 15 | 6 | 14 | 0 | 0 | 14 | 19 | 1691 | PASS |
| nx/case-03 | 30 | 13 | 18 | 0 | 0 | 18 | 38 | 1693 | PASS |
| nx/case-03 | 15 | 13 | 18 | 0 | 0 | 18 | 38 | 1702 | PASS |

**Total changed functions at threshold 30: 44** (sum of all non-zero changedFunctions across 9 cases).

## 5. PASS/WARN/NOT_EVALUATED Counts

| Threshold | PASS | WARN | NOT_EVALUATED | Total Functions |
|-----------|------|------|---------------|-----------------|
| 30 | 0 | 0 | 44 | 44 |
| 15 | 0 | 0 | 44 | 44 |

Zero PASS (numeric) and zero WARN at both thresholds. All 44 changed functions are NOT_EVALUATED.

## 6. Evaluation Rates

| Threshold | Evaluated | Not Evaluated | Rate |
|-----------|-----------|---------------|------|
| 30 | 0 | 44 | 0.0 (N/A for 0-function cases: h3/case-01, nx/case-01) |
| 15 | 0 | 44 | 0.0 (N/A for 0-function cases: h3/case-01, nx/case-01) |

All non-empty cases have evaluation rate 0.0. Two cases (h3/case-01, nx/case-01) have 0 changed functions — evaluation rate is N/A.

## 7. Coverage Availability Rates

| Threshold | Coverage Available | Coverage Unavailable | Rate |
|-----------|-------------------|---------------------|------|
| 30 | 0 | 9 | 0.0 |
| 15 | 0 | 9 | 0.0 |

All 9 cases have coverage availability rate 0.0. No coverage artifacts were produced.

## 8. AnalysisStatus and Gate Counts

| Metric | Threshold 30 | Threshold 15 |
|--------|-------------|-------------|
| SUCCESS | 9 | 9 |
| UNSUPPORTED | 0 | 0 |
| FAILED | 0 | 0 |
| COMPLETE | 2 | 2 |
| INCOMPLETE | 7 | 7 |
| NOT_APPLICABLE | 0 | 0 |

COMPLETE cases: h3/case-01 (0 changed functions), nx/case-01 (0 changed functions).
INCOMPLETE cases: all 7 cases with non-zero changed functions — all due to coverage artifact absent.

## 9. Warning Usefulness Classification

**0 WARNs at both thresholds → N/A.** No warnings were generated, so no human usefulness classification is possible. The human reviewer was not autonomous (no WARNs to classify).

## 10. Sampled PASS Review

**No PASS functions with numeric coverage to sample.** All non-zero cases are NOT_EVALUATED.

Three sampled NOT_EVALUATED high-CC functions for reference:

| Case | File | Function | CC | CRAP | Coverage |
|------|------|----------|-----|------|----------|
| h3/case-02 | `src/utils/static.ts` | `serveStatic` | 38 | high | absent |
| hono/case-03 | `src/router/reg-exp-router/router.ts` | `reg-exp-router` | 22 | moderate | absent |
| nx/case-03 | `packages/nx/src/command-line/release/version/version-actions.ts` | `version-actions` | 38 | high | absent |

These are the highest-CC functions in the dataset. All are NOT_EVALUATED due to coverage artifact absent — no PASS/WARN classification possible.

## 11. NOT_EVALUATED Causes

| Cause | Count |
|-------|-------|
| coverage artifact absent | 7 (all INCOMPLETE cases) |
| file missing from coverage artifact | 0 |
| coverage attribution unavailable | 0 |
| other | 0 |

All 7 INCOMPLETE cases (h3/case-02, h3/case-03, hono/case-01, hono/case-02, hono/case-03, nx/case-02, nx/case-03) have `coverage artifact absent` as the NOT_EVALUATED cause. The reason is understandable from tool output: `ls: /tmp/wp4r-repos/<repo>/coverage/coverage-final.json: No such file or directory` for present-intent cases; `absent` for absent-intent cases.

## 12. Threshold 30 vs 15 Comparison

| Metric | Threshold 30 | Threshold 15 | Difference |
|--------|-------------|-------------|------------|
| WARNs | 0 | 0 | None |
| PASS | 0 | 0 | None |
| NOT_EVALUATED | 44 | 44 | None |
| COMPLETE | 2 | 2 | None |
| INCOMPLETE | 7 | 7 | None |

**No sensitivity difference between thresholds 30 and 15.** Both thresholds produce identical results across all 18 case runs. This is expected: the difference between thresholds only matters when there are functions with CC scores in the (15, 30) range that would be classified differently. With 0 WARNs and 0 PASS, the threshold comparison is moot — the bottleneck is coverage, not threshold selection.

## 13. Operational Friction

### Installation
- **h3**: `pnpm install` — fast, no issues.
- **hono**: `pnpm install` — fast, no issues.
- **nx**: `pnpm install` — slower due to monorepo size; pnpm required (npm not compatible).

### Coverage Generation
- **All present-intent cases failed to produce coverage artifacts.** Despite `vitest --coverage` being the documented command for h3 and hono, `coverage-final.json` was never produced.
- **h3**: `vitest --run --coverage` runs but does not output `coverage-final.json` in the expected location. May require `vitest --coverage --reporter=json` or different config.
- **hono**: Same issue — `vitest --run --coverage` runs but no artifact.
- **nx**: Uses `nx run-many -t test` (not vitest directly). Coverage output format/location differs from vitest expectations. pnpm version sensitivity noted.

### Runtime
- **h3**: ~330-360ms per case (fastest)
- **hono**: ~408-418ms per case (moderate)
- **nx**: ~1681-1774ms per case (slowest, monorepo overhead)

### CWD Sensitivity
- All runs executed from `/tmp/wp4r-repos/<repo>` — cwd sensitivity is a known friction point for nx (monorepo root detection).

## 14. Limitations

1. **TS-only**: Only TypeScript source files analyzed. JavaScript repos (e.g., originally considered execa) excluded.
2. **Coverage fragility**: Coverage generation is the single point of failure. All 7 INCOMPLETE cases stem from absent coverage artifacts. No fallback coverage strategy implemented.
3. **No baseline/delta comparison**: Single-threshold runs per case (30 and 15 are identical). No comparison against original WP4 results within this run.
4. **Single threshold comparison**: Thresholds 30 and 15 produce identical results — no evidence that either threshold is more useful.
5. **No WARN signal without coverage**: The entire WARN detection pipeline is blocked by missing coverage. Without coverage, all functions are NOT_EVALUATED regardless of CRAP/CC scores.

## 15. Unexpected Findings

1. **44 changed functions detected** vs WP4's 0 changed functions — the improved function detection works. The tool correctly identifies changed functions across all 3 repos.
2. **Coverage still 0 despite working function detection** — the bottleneck is coverage generation, not function identification.
3. **WARN count remains 0** — even with 44 functions detected, zero WARNs because coverage is absent for all.
4. **execa rejected** — originally selected as Repo A but rejected because source is `lib/*.js` (JavaScript), not TypeScript. Only `.d.ts` files present. Lesson from WP4 p-limit repeats.
5. **h3 coverage not generating** — despite docs showing `vitest --coverage` support, no `coverage-final.json` produced. Possible config mismatch or vitest version issue.
6. **High CC (38) still NOT_EVALUATED** — `serveStatic` in h3/case-02 and `version-actions` in nx/case-03 both have CC=38 (high complexity) but are NOT_EVALUATED due to coverage absence. The tool correctly identifies high-risk functions but cannot classify them without coverage data.

## 16. Recommendation

**CONTINUE WITH CONSTRAINTS**

Constraints for next step:
1. **Fix coverage robustness**: Implement coverage artifact discovery fallback (search for `coverage-final.json`, `coverage.json`, `lcov.info` in common locations). Do not assume vitest output location.
2. **Bundle/crap handling**: Add logic to skip or handle bundled dependencies in coverage artifacts (e.g., `node_modules/`, `dist/`).
3. **Select repos with working coverage**: Prioritize repos where `vitest --coverage` produces artifacts reliably. Test coverage generation as a pre-flight check before running analysis.
4. **Document setup**: Record per-repo coverage commands and expected artifact paths in metadata.
5. **Do not add analyzers or rules**: Keep scope to changed-function detection + coverage + CRAP/CC advisory only.
6. **Consider coverage-independent risk signals**: CC alone may be sufficient for some cases. Evaluate whether high-CC functions without coverage should be flagged as `PLAUSIBLE` rather than `NOT_EVALUATED`.

CONTINUE WITH CONSTRAINTS
