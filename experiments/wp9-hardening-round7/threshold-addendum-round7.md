# Threshold Addendum Round 7

**Date**: 2026-08-30  
**Reference**: Round 6 threshold 30/15 contract 0.2 frozen.

## Decision Table

| Parameter             | Round 6 | Round 7 Decision |
|-----------------------|---------|------------------|
| CRAP threshold        | 30      | 30 (unchanged, frozen) |
| Coverage threshold    | 15%     | 15% (unchanged, frozen) |
| Schema version        | 0.2     | 0.2 (frozen contract) |

## Rationale
- No source changes in Round 7 — only added full monorepo union evidence (1.62M, 64 entries) vs subset (29K, 3 entries).
- Same repo (microsoft/tsdoc), same provider Jest v8 via heft-web-rig, same base cc1dbc6..e11ec0b, same changed file `eslint-plugin/src/index.ts`.
- Full union proves attribution at scale: endsWith matching correctly isolates changed file among 64 coverage entries, no ambiguous matches, no wrong-file attribution. normalizeCoveragePaths works for 1.6MB artifact.
- Threshold policy unchanged: WARN triggers on cc12 crap116 cov10, PASS on cc6 crap18 cov30 — identical for subset and full union, validates scale does not alter threshold behavior.
- Contract frozen; reversible via git revert of evidence dir.

## Verification
- tsc: 0 errors
- vitest: 178/178 pass (59 files)
- npm run build: dist/cli.js exists (6.0K)
- INV-01..04 preserved (both subset and full union show SUCCESS/WARN with valid coverage)
- Gate: WARN for both (high CRAP triggers WARN per policy 30)

## Conclusion
No action required. Threshold 30/15 remains.
