# WP9 Hardening Round 7 Report — monorepo boundary full Rush union vs subset

**Date**: 2026-08-30  
**Status**: ADDENDUM to Round 6 Contract 0.2 frozen  
**Constraint**: CONTINUE WITH CONSTRAINTS — threshold 30/15 frozen, schema 0.2 frozen, no src change, reversible

## Summary
- tests: 178 pass preserved
- typecheck: clean (0 errors)
- build: ok (dist/cli.js 6.0K)
- monorepo boundary: validated full union 1.62M 64 entries vs subset 29K 3 entries — same gate, same funcs, attribution correct at scale
- provider diversity: stays n=3 (defu v8 12KB + ts-jest babel Istanbul 277KB + tsdoc Jest v8 subset+full), no new provider
- src change: none

## Evidence Matrix

| Artifact | Repo | Coverage cmd | Size | Entries | Changed funcs | Result | Gate |
|----------|------|--------------|------|---------|---------------|--------|------|
| subset (R6) | microsoft/tsdoc eslint-plugin only | heft test --jest:config jest.custom.json (single package) | 29210 bytes | 3 | 2 funcs: getRootDirectoryFromContext cc12 crap116 cov10 WARN + plugin.rules.syntax.create cc6 crap18 cov30 PASS | WARN | WARN |
| full union (R7) | microsoft/tsdoc full Rush monorepo (tsdoc 1.2M + tsdoc-config 90K + eslint-plugin 29K) | heft test --jest:config per package + python union | 1621110 bytes | 64 | same 2 funcs, same CRAP/coverage, same WARN/PASS | WARN | WARN |
| defu v8 (R1) | defu | vitest --coverage.provider=v8 | 12673 bytes | variant2 | diff | PASS | PASS |
| ts-jest Istanbul (R4) | kulshekhar/ts-jest | jest --coverageProvider=babel --coverageReporters=json | 277177 bytes | 6 funcs | 3 passed 3 skipped | PASS | PASS |

## Schema 0.2 Contract Verification
```json
{
  "schemaVersion": "0.2",
  "analysisStatus": "SUCCESS",
  "gate": "WARN",
  "completeness": "COMPLETE",
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": 2
}
```
Both subset and full union produce identical schema 0.2 SUCCESS/WARN/COMPLETE. INV-01..04 preserved.

## Operational Delta Table

| Aspect | Round 6 (subset) | Round 7 (full union) | Delta |
|--------|------------------|----------------------|-------|
| Coverage artifact size | 29210 bytes, 3 entries | 1621110 bytes, 64 entries | 55x larger |
| Coverage entries | 3 (eslint-plugin only) | 64 (tsdoc 59 + tsdoc-config 2 + eslint-plugin 3) | +61 files |
| Packages covered | 1 (eslint-plugin-tsdoc) | 3 with data + 1 empty + 2 no-file (build-rig/spec) | +2 packages with data |
| Changed file | eslint-plugin/src/index.ts | same | — |
| Changed funcs | 2 | 2 | — |
| CRAP values | 116.97 / 18.34 | 116.97 / 18.34 (identical) | — |
| Gate | WARN | WARN | — |
| Attribution matches | 1 per changed file (endsWith) | 1 per changed file (endsWith among 64) — no ambiguous, no wrong-file | validates scale |
| normalizeCoveragePaths | rebases 3 absolute keys | rebases 64 absolute keys | works at scale |
| CLI coverage | 87.8% | 87.8% unchanged | — |
| Tests | 178 pass | 178 pass preserved | — |
| Schema | 0.2 frozen | 0.2 frozen | — |
| Threshold | 30/15 frozen | 30/15 frozen | — |

## Monorepo Boundary Findings

- **Attribution at scale works**: endsWith suffix matching correctly isolates `eslint-plugin/src/index.ts` among 64 coverage entries without picking wrong file. Ambiguous-match decline not triggered (only one suffix match per changed file). WP5.3 FM-A08 fix (exact match first → fallback → ambiguous decline) holds at scale.
- **normalizeCoveragePaths at scale works**: rebases 64 absolute paths (/private/tmp/... ) onto cwd, preserves attribution. F-03 fix validated for 1.6MB artifact.
- **Rush default is not Istanbul JSON**: rig's jest.config uses `coverageReporters: ["cobertura","html"]` only. Full monorepo Istanbul JSON requires per-package `jest.custom.json` override. This is caller-side burden, not engine bug. Documented in repro.md — caller must configure Jest to emit json if they want engine to consume union.
- **Empty projects expected**: api-demo 3 bytes {} and playground no file are not failures — they have no TS coverage to report. Engine correctly ignores empty entries.
- **No src change needed**: evidence valid per contract 0.2, gate deterministic, reversible.

## Limitations

1. Provider diversity still n=3 (2 v8 variants + 1 babel) — not increased in this round (same repo/provider, just scale). Statistical small still.
2. Sample size: one monorepo (tsdoc), one base diff (1 file, 2 funcs). Larger diffs (4+ funcs, multi-file) at monorepo scale not yet tested.
3. Full union required manual merge (python dict union). Rush has no built-in Istanbul JSON union — caller must merge per-package artifacts if they want repo-wide view. Engine consumes whatever file is passed via --coverage-file.
4. Monorepo with nested packages having same suffix `src/index.ts` could still trigger ambiguous decline — not observed here but remains theoretical per FM-A08. Needs dedicated collision test at scale (future).
5. Coverage generation caller-owned burden persists (~5s heft per package).

## Gate Recommendation

**PROPOSAL: CONTINUE WITH CONSTRAINTS**
Confidence: Medium/High
- Reliability strong: 178/178 deterministic, INV-01..04 preserved, zero FP, no src change
- Monorepo boundary now validated for Jest/v8 Rush variant at 1.6M scale — cheap proof that engine is not single-package-only
- Provider diversity n=3 unchanged, threshold guidance actionable, reversible via git revert

If CONTINUE, next narrow hardening should validate history/delta or additional language — monorepo subset vs full now closed.

## Provenance References
- Engine commit: 2972e5ea82b89e9840345062c043acc9e1bac4b6 (plus uncommitted Round6 docs)
- Node: v24.18.1
- Base: cc1dbc6, HEAD e11ec0b
- Subset artifact: /tmp/tsdoc/eslint-plugin/coverage/coverage-final.json 29210 bytes
- Full union: experiments/wp9-hardening-round7/evidence/full-union-coverage.json 1621110 bytes 64 entries (from 3 per-package files)
- Plan: .opencode/plans/2026-08-30T03:06:43Z-wp9-hardening-round7-monorepo-boundary.md approved:true
- Reports: experiments/wp9-hardening-round7/

---
```text
AWAITING HUMAN REVIEW
```
