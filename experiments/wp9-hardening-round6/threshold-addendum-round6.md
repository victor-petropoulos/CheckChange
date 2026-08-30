# Threshold Addendum Round 6

**Date**: 2026-08-30  
**Reference**: Round 5 threshold 30/15 contract 0.2 frozen.

## Decision Table

| Parameter             | Round 5 | Round 6 Decision |
|-----------------------|---------|------------------|
| CRAP threshold        | 30      | 30 (unchanged, frozen) |
| Coverage threshold    | 15%     | 15% (unchanged, frozen) |
| Schema version        | 0.2     | 0.2 (frozen contract) |

## Rationale
- No source changes in Round 6 — only added external evidence/repro/report.
- tsdoc eslint-plugin WARN validates existing threshold policy (116 triggers WARN, 18 PASS).
- Contract frozen; reversible.

## Verification
- tsc: 0 errors
- vitest: 178/178 pass (59 files)
- npm run build: dist/cli.js exists
- INV-01..04 preserved (as evidenced by tsdoc engine output showing analysisStatus SUCCESS and gate WARN/PASS as appropriate).

## Conclusion
No action required. Threshold 30/15 remains.