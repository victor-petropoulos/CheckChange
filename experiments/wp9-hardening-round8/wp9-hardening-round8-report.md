# WP9 Hardening Round 8 Report

## Delta Table: 00203d4 vs e11ec0b

| Commit   | Base          | Changed func                           | cc  | coverage | CRAP     | result | gate     |
|----------|---------------|----------------------------------------|-----|----------|----------|--------|----------|
| 00203d4  | c908cc8       | plugin.rules.syntax.create             | 5   | 25       | 15.54    | PASS   | PASS     |
| e11ec0b  | cc1dbc6       | getRootDirectoryFromContext            | 12  | 10       | 116.97   | WARN   | WARN     |
| e11ec0b  | cc1dbc6       | plugin.rules.syntax.create             | 6   | 30       | 18.34    | PASS   |          |

*Note: For 00203d4, there are 11 total changed functions (many skipped due to missing configs), completeness INCOMPLETE. For e11ec0b, there are 2 total changed functions, completeness COMPLETE.*

## Gate Comparison
- Base c908cc8 (for 00203d4): Gate status = PASS
- Base cc1dbc6 (for e11ec0b): Gate status = WARN
- Change: Gate changed from PASS to WARN due to new high-risk function.

## Verification
- TypeScript Check (`npx tsc --noEmit`): 0 errors
- Unit Tests (`npx vitest run --no-coverage`): 178 tests passed
- Build (`npm run build`): Success
- Invariants INV-01..04 preserved
- Schema version 0.2 frozen
- Threshold 30/15 frozen

## Limitations
- Coverage generation blocked by Rush Node version (v24.18.1 not in allowed range 16/18/20).
- Fallback full-union coverage from Round7 (1621110 bytes, 64 entries) reused for both commits, so coverage delta is not per-commit real.
- Complexity delta is real and reflects actual code changes.
- Monorepo-aware analysis.
- All changes are reversible (no source modifications).

## Gate PROPOSAL
CONTINUE WITH CONSTRAINTS

```text
AWAITING HUMAN REVIEW
```