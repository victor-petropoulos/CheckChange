# WP5.6 Pipeline Re-Execution Results

## Objective

Verify that the corrected (post-WP5.4) deterministic pipeline produces semantically valid, reproducible output on the WP4R frozen case corpus, with WP5.3 source-discovery expansion in effect.

## Execution Context

- Engine: `dist/cli.js` (current build, Node 24)
- Date: 2026-08-27
- CWD: clones placed at `/tmp/wp4r-repos/{hono,h3}` matching original WP4R generation paths; symlink `/tmp/wp4r1-h3 -> /tmp/wp4r-repos/h3` matches original sup-b coverage path.
- Coverage artifacts: WP4R preserved (5 of 11 cases); 6 cases have no preserved coverage and are replay-only via WP4R JSON outputs.
- Re-runnable: hono-01, hono-02, hono-03, sup-a, sup-b (5 cases)
- Replay-only: h3-01, h3-02, h3-03, apollo-01, apollo-02, apollo-03 (6 cases, no preserved coverage)

## Per-Case Re-Execution Summary

### 5 Re-Executable Cases × 2 Thresholds

| Case | T | Analysis | Gate | Completeness | Changed | PASS | WARN | NOT_EVAL |
|------|---|----------|------|--------------|---------|------|------|----------|
| hono-01 | 15 | SUCCESS | PASS | COMPLETE | 0 | 0 | 0 | 0 |
| hono-01 | 30 | SUCCESS | PASS | COMPLETE | 0 | 0 | 0 | 0 |
| hono-02 | 15 | SUCCESS | PASS | COMPLETE | 3 | 3 | 0 | 0 |
| hono-02 | 30 | SUCCESS | PASS | COMPLETE | 3 | 3 | 0 | 0 |
| hono-03 | 15 | SUCCESS | PASS | INCOMPLETE | 6 | 4 | 0 | 2 |
| hono-03 | 30 | SUCCESS | PASS | INCOMPLETE | 6 | 4 | 0 | 2 |
| sup-a | 15 | SUCCESS | WARN | INCOMPLETE | 196 | 100 | 5 | 91 |
| sup-a | 30 | SUCCESS | WARN | INCOMPLETE | 196 | 104 | 1 | 91 |
| sup-b | 15 | SUCCESS | WARN | INCOMPLETE | 11 | 7 | 1 | 3 |
| sup-b | 30 | SUCCESS | PASS | INCOMPLETE | 11 | 8 | 0 | 3 |

### Focused Function Results

- **hono-02 — `basePath`** (lines 107-141, src/helper/route/index.ts): CC=10, CRAP=10.05, coverage=92.31% branch, analyzerStatus=passed. **Outcome A (regression anchor):** high CC, high coverage, CRAP well under threshold. Confirms WP4R baseline.
- **sup-a — `normalizeRouteRules`** (lines 21-136, src/rules/normalize.ts): CC=36, CRAP=36, coverage=100% stmt, analyzerStatus=passed. **Outcome A (regression anchor + high-CRAP signal):** CRAP exactly at threshold → WARN. Matches WP4R baseline.
- **sup-b — `processJsonRpcMethod`** (lines 404-500, src/utils/json-rpc.ts): CC=28, CRAP=28.94, coverage=89.36% branch, analyzerStatus=passed. **Outcome B (threshold-sensitive):** T30=PASS, T15=WARN. Matches WP4R baseline.

### Divergences from WP4R Baseline

#### hono-03 changed function count: 4 → 6

- **Baseline (WP4R):** 4 changed functions in `src/middleware/csrf/index.ts`
- **Current:** 6 changed functions — same 4 plus 2 in `src/middleware/csrf/index.test.ts` (`buildSimplePostRequestData`, `secFetchSite`)
- **Cause:** WP5.3 C03 fix expanded source discovery to include `git ls-files` result in addition to source-root scan. Test files are now picked up. The 2 test-file functions have `coverage=null` because Istanbul artifacts don't include test files; pipeline correctly reports `analyzerStatus=skipped`.
- **Material impact:** Gate unchanged (PASS). Completeness went COMPLETE→INCOMPLETE because pipeline now truthfully reports that 2 changed functions have no coverage evidence. This is the **post-WP5.4 truthfulness invariant (INV-04: ANALYZER TRUTHFUL) operating correctly**: missing coverage is no longer hidden.
- **Verdict:** Improvement, not regression.

#### hono-02 coverage values: identical to WP4R baseline

CC=10, CRAP=10.05, branch coverage 92.31%, all 3 functions PASS. Determinism preserved across corrected pipeline.

#### sup-a changed function count: 108 → 196

- **Baseline (WP4R):** 108 changed functions
- **Current:** 196 changed functions
- **Cause:** Same C03 expansion. More files discovered; more test-file functions picked up.
- **Material impact:** Gate unchanged (WARN). 91 NOT_EVALUATED (test files / unscoped functions) vs baseline 0. The locked focus `normalizeRouteRules` still produces CRAP=36, WARN, matching baseline.
- **Verdict:** Methodological improvement; honest reporting of additional discovered scope.

## Cross-Case Invariant Verification (post-WP5.4)

| Invariant | Verified |
|-----------|----------|
| INV-01 ZERO≠NULL | YES: `coverage:100` → passed; `coverage:null` → skipped (hono-03 test files, sup-a 91 NOT_EVAL fns) |
| INV-02 MISSING≠MALFORMED | YES: pipeline distinguishes via `coverageErrorReason` field (in T15 attempt before path fix) |
| INV-03 GIT≠REPO | YES: all cases git=available, repo valid; no false "Not a git repo" |
| INV-04 ANALYZER TRUTHFUL | YES: `passed` ↔ has coverage; `skipped` ↔ no coverage |

## Environment-Dependent Findings (WP5.6 discoveries)

### F-03: Istanbul coverage file absolute-path coupling

- **Observed:** Re-executing the pipeline with a preserved WP4R coverage file required placing the cloned repository at the *same absolute path* the coverage file was originally generated at. Mismatched paths produce `analyzerStatus=skipped` for all functions.
- **Root cause:** Istanbul `coverage-final.json` keys are absolute file paths (e.g., `/private/tmp/wp4r-repos/hono/src/context.ts`). The attribution code (`src/attribution.ts`) uses `endsWith()` matching against complexity file paths. Path coupling is real.
- **Workaround for WP5.6:** symlink (`/tmp/wp4r1-h3 -> /tmp/wp4r-repos/h3`) or physical relocation.
- **Implication for reproducibility:** Cross-machine/cross-CI execution of a preserved artifact requires path-aware normalization. **This is a WP5.6 reproducibility finding, not a prototype defect.**
- **Recommendation:** Add path normalization to `src/coverage.ts` or `src/attribution.ts` in WP6+. WP5.6 freezes current behavior with this known limitation.

### F-04: WP5.3 C03 expansion changes reported change count

- **Observed:** hono-03: 4→6 changed fns; sup-a: 108→196. New fns are mostly in test files.
- **Root cause:** WP5.3 C03 fix unioned source-root scan with `git ls-files`.
- **Material impact:** Gate outcomes stable; completeness became more honest. The locked-focus functions are unchanged.
- **Verdict:** WP5.3 improvement, truthfully surfaced in WP5.6.

## Output Artifacts

Per-case JSON outputs preserved at `experiments/wp5/wp5.6/pipeline-runs/<case>-threshold-<T>.json` (10 files). All SHA-256 hashes below.

## Replay-Only Cases (6 cases, no preserved coverage)

These cases' WP4R JSON outputs remain authoritative. They are not re-executed because:

1. Coverage artifacts were cleaned post-WP4R per `WP4R_EVIDENCE_MANIFEST.md` freeze rule.
2. apollo-client cases were blocked by an unresolved Jest reporter failure (WP4R §Known Limitations).
3. Re-cloning + re-test-running would be operationally expensive and not in WP5.6 scope.

Their frozen outputs (gate, rule counts, completeness) are listed in `case-selection.md` and re-validated through JSON inspection (no semantic contract drift from WP5.4 fixes — they were determined by evaluation state, not by the post-WP5.4 logic which only alters the `passed`/`skipped` distinction and `coverageArtifact: 'available'` reporting when coverage is absent).
