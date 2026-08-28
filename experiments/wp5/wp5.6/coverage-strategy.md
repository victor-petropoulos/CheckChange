# WP5.6 Coverage Strategy

Per Roadmap WP5.6 §COVERAGE STRATEGY (two-tier approach).

## Tier 1 — Full-Suite Coverage (where practical)

The original WP4R 9 cases were executed with scoped coverage for apollo-client (unavoidable — full suite would not complete in the experimental window) and full coverage for h3 and Hono (v8 provider via vitest, full project). Tier 1 targets **at least one case per repo with full suite**.

| Case | Repo | Scope | Provider | Command (preserved from WP4R metadata) | Artifact |
|------|------|-------|----------|------------------------------------------|----------|
| h3-01 | h3 | full suite | v8 (vitest) | `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` | NOT PRESERVED (cleaned) |
| hono-02 | Hono | full suite | v8 (vitest, project=main) | `npx vitest --run --project=main --coverage` | `coverage/raw/default/coverage-final.json` (sha256: `de60bd82...`) |
| apollo-02 | apollo-client | scoped (impractical for full suite) | Jest Istanbul | `node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/react/hooks/__tests__/useMutation"` | NOT PRESERVED (cleaned, also blocked by Jest reporter failure) |

**WP5.6 reality:** Only **hono-02** has a preserved full-suite coverage artifact in WP4R. h3-01 and apollo-02 coverage artifacts were cleaned post-WP4R.

## Tier 2 — Scoped Coverage (acknowledged limitation)

The remaining cases used scoped or generated coverage. Scoped coverage can miss cross-package interactions.

| Case | Repo | Scope | Provider | Artifact Status |
|------|------|-------|----------|-----------------|
| h3-02 | h3 | full (at time of WP4R) | v8 (vitest) | NOT PRESERVED |
| h3-03 | h3 | full (at time of WP4R) | v8 (vitest) | NOT PRESERVED |
| hono-01 | Hono | full (at time of WP4R) | v8 (vitest) | PRESERVED |
| hono-03 | Hono | full (at time of WP4R) | v8 (vitest) | PRESERVED |
| apollo-01 | apollo-client | scoped: `src/cache/core` | Jest Istanbul | NOT PRESERVED |
| apollo-03 | apollo-client | scoped: `src/react/hooks/__tests__/useQuery` | Jest Istanbul | NOT PRESERVED |
| SUP-A | h3 | generated for the commit | Istanbul | PRESERVED |
| SUP-B | h3 | generated for the commit | Istanbul | PRESERVED |

## Per-Case Coverage Replay Plan for WP5.6

### Re-Executable (preserved artifact + post-WP5.4 prototype re-run)

- **hono-01, hono-02, hono-03** — re-run prototype on preserved coverage artifacts. Verifies INV-01..04 (ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL) on real TypeScript coverage.
- **SUP-A, SUP-B** — re-run on preserved Istanbul artifacts. Verifies high-CRAP WARN/PASS outcomes survive post-WP5.4 semantics.

### Replay-Only (no preserved coverage; original JSON output re-interpreted)

- **h3-01, h3-02, h3-03** — original `output-threshold-{15,30}.json` preserved. Re-validate semantic correctness through JSON inspection. No new pipeline run.
- **apollo-01, apollo-02, apollo-03** — original `output-threshold-{15,30}.json` preserved. Re-validate through JSON inspection. Note: apollo cases had zero or near-zero coverage attribution due to Jest reporter failure — re-validation confirms the system **truthfully reports** INCOMPLETE/UNSUPPORTED rather than manufacturing PASS.

## Scoping Discipline

Per Roadmap §NO CLAIM WITHOUT A TRACEABLE BASIS:

- This document never claims "full-suite" for apollo-* cases.
- This document never claims "scoped" for hono-* cases.
- WP4R baseline metadata is authoritative for what scope was used.
- The WP5.6 replay preserves the same scope; no re-cloning attempts in this work package.

## Reproducibility Artifact Hashes

| Case | Coverage Artifact SHA-256 |
|------|---------------------------|
| hono-01 | `adfe229b75eb6915fb2b80740d12343734e71a46ea8fb48d4a2678a1d837cdae` |
| hono-02 | `de60bd82a31383863e1ca9b02b426e54a771025dd8ed882beb507d4cb39ec93f` |
| hono-03 | `fc7b05e0557c40b6fa5b2fbc2cd014b43cc854bc285fda4e99bd4c169b0c1339` |
| SUP-A | `c57f8a240538e5886deb1f8da64e1075025b9833822705c40e349f2b8d05e839` |
| SUP-B | `338e0e0a32dd1b93c5f2d8f82ddb64f3e5d27954f4beb5c2cb249a11f9f45584` |

## Open Items

1. **h3 / apollo coverage regeneration:** deferred to a future WP if h3/apollo coverage generation can be re-attempted with the corrected post-WP5.4 pipeline. WP5.6 does not re-clone.
2. **Apollo Jest reporter failure:** unresolved per WP4R §Known Limitations. The deterministic evidence model treats this as a coverage-generation failure, not a prototype failure. The prototype correctly reports FAILED with `coverageErrorReason: 'malformed'` or `absent` for the apollo cases.
