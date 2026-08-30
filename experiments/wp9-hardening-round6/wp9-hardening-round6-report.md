# WP9 Hardening Round 6 Report — microsoft/tsdoc genuine Jest/v8 provider n=2→n=3

**Date**: 2026-08-30  
**Status**: ADDENDUM to Round 5 Contract 0.2 frozen

## Summary
- tests: 178 pass preserved
- typecheck: clean (0 errors)
- build: ok (dist/cli.js exists)
- provider diversity: now n=3 (defu v8 12KB + ts-jest babel Istanbul 277KB + tsdoc eslint-plugin Jest v8 29210 bytes)

## Evidence Matrix
| Provider | Repo | Coverage cmd | Artifact size | Changed funcs | Result | Gate |
|----------|------|--------------|---------------|---------------|--------|------|
| defu v8 (vitest) | github.com/defu-cxx/defu | vitest --coverage.provider=v8 | 12,673 bytes | variant2 diff | PASS | PASS |
| ts-jest babel Istanbul | kulshekhar/ts-jest | npx jest --coverage --coverageProvider=babel --coverageReporters=json | 277,177 bytes | 6 funcs (3 passed, 3 skipped) | PASS | PASS |
| tsdoc eslint-plugin Jest v8 | microsoft/tsdoc | heft test --jest:config./jest.custom.json | 29210 bytes | 2 funcs: getRootDirectoryFromContext (cc12 crap116 cov10 WARN) + plugin.rules.syntax.create (cc6 crap18 cov30 PASS) | WARN | WARN |

## Schema 0.2 Contract Verification
```json
{
  "schemaVersion": "0.2",
  "analysisStatus": "SUCCESS",
  "gate": "WARN",
  "completeness": "COMPLETE",
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "exitCode": 1
}
```
*Note: exit 1 for WARN per INV-04.*

## Operational Delta Table
| Aspect | Round 5 | Round 6 |
|--------|---------|---------|
| CLI coverage | 87.8% | 87.8% (unchanged) |
| Provider diversity | n=2 | n=3 |
| Test count | 178 | 178 (preserved) |
| Schema version | 0.2 | 0.2 (frozen) |

## Threshold Addendum
See `threshold-addendum-round6.md` for details. No action required. Threshold 30/15.

## Limitations
1. Provider diversity still small (n=3): 2 v8 variants + 1 babel variant.
2. Sample size limited (only three providers evaluated).
3. Monorepo Rush/Heft required custom jest json override to generate Istanbul-compatible JSON.
4. Coverage artifact only covers eslint-plugin subset, not full tsdoc repo.

## Gate Recommendation
**PROPOSAL: CONTINUE WITH CONSTRAINTS**  
Confidence: Medium/High  
Next steps deferred: monorepo full history, multi-language support.

## Provenance References
- Engine commit: 2972e5ea82b89e9840345062c043acc9e1bac4b6
- Node version: v24.x (as per .nvmrc)
- Artifact sizes: as listed in Evidence Matrix
- Plan file path: `.opencode/plans/2026-08-30T04:00:00Z-wp9-hardening-round6-tsdoc-provider.md`
- Reports path: `experiments/wp9-hardening-round6/`

---
```text
AWAITING HUMAN REVIEW
```