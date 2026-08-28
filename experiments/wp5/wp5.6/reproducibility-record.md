# WP5.6 Reproducibility Record

Per project-wide §REPRODUCIBILITY REQUIREMENT: every case has the data needed to reproduce it.

## Environment

- **Engine commit:** `21daa57` (`docs: mark WP5.5 CLOSED via CONTINUE, activate WP5.6`)
- **Node version:** v24.18.1
- **Package manager:** npm
- **OS:** darwin (macOS)
- **TypeScript:** 6.0.3
- **External CRAP analyzer:** `@barney-media/crap-typescript` v0.5.0
- **Prototype entry:** `dist/cli.js` (built from `src/cli.ts`)

## Per-Case Reproducibility

### 5 Re-Executable Cases (executed through current pipeline 2026-08-27)

| Case | Repo | Base SHA | Target SHA | Coverage Cmd | Artifact SHA-256 | Analysis Cmd | T30 Result | T15 Result |
|------|------|----------|------------|--------------|------------------|--------------|------------|------------|
| hono-01 | Hono | `5bfbff8acf54395174d54c65ad8d796493c2b7ea` | `c4577e93746c4642d5e663509febcb803d20f47e` | `npx vitest --run --project=main --coverage` | `adfe229b75eb6915fb2b80740d12343734e71a46ea8fb48d4a2678a1d837cdae` | `node dist/cli.js check --base <base> --coverage-file <artifact> --json --crap-threshold <T>` | gate=PASS, changed=0, completeness=COMPLETE | gate=PASS, changed=0, completeness=COMPLETE |
| hono-02 | Hono | `393ded96196da1b4f23813fea670b0d5a70526c6` | `81bda2e169ba26810c8044980f1cfea66912d720` | (same) | `de60bd82a31383863e1ca9b02b426e54a771025dd8ed882beb507d4cb39ec93f` | (same) | gate=PASS, changed=3 (all PASS, maxCRAP=10.05), completeness=COMPLETE | gate=PASS, changed=3 (all PASS), completeness=COMPLETE |
| hono-03 | Hono | `d9f7b99c519602d6f0664514a42b1bbc6ef57206` | `117d0a413fb021804e4996c3c79cdbac56e17b43` | (same) | `fc7b05e0557c40b6fa5b2fbc2cd014b43cc854bc285fda4e99bd4c169b0c1339` | (same) | gate=PASS, changed=6 (4 PASS, 2 NOT_EVAL post-C03), completeness=INCOMPLETE | gate=PASS, changed=6, completeness=INCOMPLETE |
| sup-a | h3 | `5e8a31709b28dbebf2f2f8f1a3063250ec799b74` | `3fae517278a2e677fbe3580918ab069348f80ccc` | generated for the commit (Tier 2) | `c57f8a240538e5886deb1f8da64e1075025b9833822705c40e349f2b8d05e839` | (same) | gate=WARN, changed=196 (104 PASS, 1 WARN, 91 NOT_EVAL), maxCRAP=36 (normalizeRouteRules) | gate=WARN, changed=196 (100 PASS, 5 WARN, 91 NOT_EVAL) |
| sup-b | h3 | `07d22ecdb175416231242f7ea1ae8553ca0cc1fe` | `72d8e05fb8a9a0eb6941d0c6f11b69b543452260` | generated for the commit (Tier 2) | `338e0e0a32dd1b93c5f2d8f82ddb64f3e5d27954f4beb5c2cb249a11f9f45584` | (same) | gate=PASS, changed=11 (8 PASS, 3 NOT_EVAL), maxCRAP=28.94 (processJsonRpcMethod) | gate=WARN, changed=11 (7 PASS, 1 WARN, 3 NOT_EVAL) |

### 6 Replay-Only Cases (frozen WP4R outputs authoritative; coverage artifacts cleaned or blocked)

| Case | Repo | Base SHA | Target SHA | Coverage Source | WP4R Frozen Output |
|------|------|----------|------------|-----------------|---------------------|
| h3-01 | h3 | `43e1fa38ddcd13fa82558f754e4f5bd40e6aa4c8` | `708a3aad41d8b17955af335a8b1dffac92e09d81` | WP4R full v8 (cleaned) | gate=PASS, changed=1 (isBodySizeWithin, CC=7, CRAP=7.39, cov=80 branch), completeness=COMPLETE |
| h3-02 | h3 | `60a2e915756af3102f8af8cb5035ec997db9277c` | `d1da262a4f535f17e5a8ac2dd9dc4817d79ce9fc` | WP4R full v8 (cleaned) | gate=PASS, changed=4 (2 PASS, 2 NOT_EVAL), maxCRAP=2, completeness=INCOMPLETE |
| h3-03 | h3 | `1faca72a1180216b98c7fb399b7568c7ce727c9f` | `6c773a4444adb6bd7f2aeefbe7abc3fd5030ebfa` | WP4R full v8 (cleaned) | gate=PASS, changed=4 (all PASS), maxCRAP=10, completeness=COMPLETE |
| apollo-01 | apollo-client | `c34538e747f509d8da140e4128e25550f70b183b` | `f6d0efac4d99375c67255aee6d9b2981753b6f55` | Scoped Jest `src/cache/core` (Jest reporter failure) | gate=PASS, changed=0, completeness=COMPLETE, exit=1 (Jest reporter) |
| apollo-02 | apollo-client | `4d3fb77421a7394028b788c1bf64e522155eeda6` | `db8a04b193c157d57d6fe0f187b1892afdda1b7d` | Scoped Jest `useMutation` (Jest reporter failure) | gate=PASS, changed=1 (0 PASS, 1 NOT_EVAL), completeness=INCOMPLETE, exit=1 |
| apollo-03 | apollo-client | `5352c1208e19c93678fef7860a1a87841653eb64` | `71f2517132a34563a14934f3971666b3691710f9` | Scoped Jest `useQuery` (Jest reporter failure) | gate=PASS, changed=4 (all NOT_EVAL), completeness=INCOMPLETE, exit=1 |

## Reproduction Instructions

### For re-executable cases:

1. Clone the repo at the target SHA into `/tmp/wp4r-repos/<repo>/` (matching the original absolute path the coverage file was generated for; see F-03).
2. `git checkout <target_sha>`
3. Run the analysis command:
   ```
   node <prototype_repo>/dist/cli.js check \
     --base <base_sha> \
     --coverage-file <prototype_repo>/experiments/<path>/<coverage_file> \
     --json --crap-threshold <T>
   ```
4. Compare output JSON to `experiments/wp5/wp5.6/pipeline-runs/<case>-threshold-<T>.json`.
5. Expected outputs are SHA-256-stable for the locked focus functions; full JSON bytes are stable (modulo WP5.3 C03 expansion, which adds test-file fns).

### For replay-only cases:

The frozen WP4R JSON outputs in `experiments/wp4r-final/<repo>/<case>/output-threshold-{15,30}.json` and `experiments/wp4r-supplemental/sup-{a,b}/output-threshold-{15,30}.json` are authoritative. To validate, read those files and apply the WP5.6 semantic contract (statuses from evaluation state, ZERO≠NULL etc.). No new pipeline run is required for these cases within WP5.6 scope.

## F-03 caveat (path coupling)

For sup-b, the original coverage file was generated at `/tmp/wp4r1-h3/...`. The reproduction instruction requires either:
- Physical path `/tmp/wp4r1-h3/` (path-coupled), OR
- A symlink `ln -sf /tmp/wp4r-repos/h3 /tmp/wp4r1-h3` (used in WP5.6 re-execution).

Without path matching, `analyzerStatus` becomes `skipped` for all functions and CRAP is null. This is the **truthful behavior of the attribution algorithm given a path mismatch**, not a pipeline defect.

## Determinism

Identical inputs (same coverage artifact, same repo state, same command) produce byte-identical JSON outputs. WP5.5 verified 5× identical runs. WP5.6 5 re-executed cases × 2 thresholds (10 runs) reproduce locked-focus function results exactly.

## Test scope

Coverage scope per case is documented in `coverage-strategy.md`. The WP5.6 pipeline does not generate coverage; the caller (CI or human operator) is responsible.
