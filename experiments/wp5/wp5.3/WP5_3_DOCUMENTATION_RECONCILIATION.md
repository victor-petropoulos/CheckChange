# WP5.3 Documentation Reconciliation Record

**Date:** 2026-08-26  
**Spec:** `WP5_3_DOCUMENTATION_RECONCILIATION_SPEC.md`  
**Author:** documenter (OpenCode)  
**Type:** Documentation-only. No `src/` changes.

---

## Purpose and Status

WP5.3 implementation **PASS** — all 10 adversarial tests pass, 36/36 WP5.2 regression anchors intact, 46/46 total tests green.

Documentation closure was **held** during reconciliation because the WP5.4 routing section of `WP5_3_RESULTS.md` contained FM descriptions for V01/D10/G06/G07 that conflicted with the authoritative WP5.2 taxonomy. This reconciliation corrects those descriptions by inheriting meanings from WP5.2 authoritative sources, then releases WP5.3 closure.

**Status: RECONCILED. WP5.3 closure released.**

---

## Reconciliation Table

| FM ID | Current WP5.3 Meaning (before fix) | Authoritative WP5.2 Meaning | Action | Artifact |
|-------|-----------------------------------|----------------------------|--------|----------|
| FM-V01 | "Coverage capability mislabel — `capabilities.coverageArtifact` reports 'available' when default coverage missing (`available: false`)" | "Coverage capability mislabel: default coverage absent sets `available: false` but capabilities envelope reports `coverageArtifact: 'available'`." | Restore authoritative meaning | `defect-reproduction-results.md` FM-V01 row + `WP5_2_RESULTS.md` Defect Classifications `expect(output.capabilities.coverageArtifact).toBe('available')` + `fr-v1.spec.ts` |
| FM-D10 | "CLI reports 'Not a git repository' when git binary missing (ENOENT), not repo state" | "CLI reports 'Not a git repository' when git binary missing (ENOENT)." | Restore authoritative meaning | `cli-diagnostics/fm-d10-evidence.md` (verbatim CLI: `env -i PATH=/Users/victorpetropoulos/.nvm/versions/node/v24.18.1/bin HOME=/Users/victorpetropoulos USER=victorpetropoulos node dist/cli.js check --base HEAD` → stderr: `Error: Not a git repository`) + `defect-reproduction-results.md` FM-D10/FM-G06 row |
| FM-G06 | "CLI reports 'coverage artifact malformed' when explicit coverage file missing — requires TS change to activate coverage path" | "CLI reports 'coverage artifact malformed' when coverage file missing, requires TS change to activate coverage path." | Restore authoritative meaning | `cli-diagnostics/fm-g06-evidence.md` (verbatim CLI: `node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-coverage-xyz123.json` with TS change → stderr: `Error: coverage artifact malformed`) + `defect-reproduction-results.md` FM-D10/FM-G06 row |
| FM-G07 | "Composed-path `analyzerStatus` hardcoded 'passed' regardless of null coverage" | "Composed-path `analyzerStatus` hardcoded `'passed'` regardless of whether function actually evaluated / received null coverage." | Restore authoritative meaning | `defect-reproduction-results.md` FM-G07 row + `defect-repro.spec.ts` FM-G07 test `expect(func.analyzerStatus).toBe('passed')` |
| FM-A07 | "Container-method attribution key mismatch" | "Container-method attribution key mismatch (`containerName.functionName` vs raw `functionName`) causes class and object methods to lose coverage → null CRAP / NOT_EVALUATED." | Preserve (already correct) | `defect-reproduction-results.md` FM-A07 row + `fr-a6.spec.ts` (P0 fixture) |
| FM-A08 | "Suffix-Collision Wrong-File Attribution" | "Suffix-collision path attribution: bidirectional `endsWith` matching with first-entry-wins can misattribute coverage between files sharing relative path suffixes." | Preserve (already correct) | `defect-reproduction-results.md` FM-A08 row + `fr-a7.spec.ts` (P0 fixture) |
| FM-C03 | "Silent Source-Root Blind Spot" | "Source-root blind spot: `findAllTypeScriptFilesUnderSourceRoots` restricts scanning to paths containing a `src` segment — changed TS files outside `src` (e.g. `tools/`) invisible." | Preserve (already correct) | `defect-reproduction-results.md` FM-C03 row + `fr-c3.spec.ts` (P0 fixture) |

**Summary:** 4 FMs restored to authoritative WP5.2 meaning (V01, D10, G06, G07). 3 FMs already correct (A07, A08, C03).

---

## Date Correction

**Before:** `2025-08-26` (incorrect year in `WP5_3_RESULTS.md` header)  
**After:** `2026-08-26`

**Artifact:** `WP5_3_RESULTS.md` header line — corrected from `**Date:** 2025-08-26` to `**Date:** 2026-08-26`. Also confirmed by `WP5_3_DOCUMENTATION_RECONCILIATION_SPEC.md` §1 which specifies date as 2026-08-26.

---

## C03 Contract Wording Change

**Before (defective):**  
> "acceptable, user should git add" — implied that untracked TS files could be resolved by having the user run `git add`, treating the limitation as an acceptable trade-off.

**After (corrected):**  
> "tracked-only expansion; new/untracked TS files may remain undiscovered; unresolved product/analysis-contract question" — explicitly records that `git ls-files` only expands tracked TS files, and that untracked TS files may remain undiscovered. This is an unresolved product/analysis-contract question; no fix authorized in this pass. No product requirement to `git add` is prescribed.

**Artifacts:**
- `source-discovery-decision.md` — "Unresolved contract question: New or untracked TS files may remain undiscovered by the Git-based expansion. This is an unresolved product/analysis-contract question; no fix authorized in this pass."
- `WP5_3_RESULTS.md` — Unresolved Limitations §1: "Untracked TS files: `git ls-files` only returns tracked files. Newly added but uncommitted TS files (not yet `git add`ed) will not be enumerated. Current behavior: only tracked TS files are added by Git-based expansion; new or untracked TS files may remain undiscovered by the Git-based expansion. This is an unresolved product/analysis-contract question; no fix authorized in this pass. Do not prescribe `git add` as product requirement."

---

## Verification Checklist

| Check | Status |
|-------|--------|
| All A08/A07/C03 before/after evidence preserved in `WP5_3_RESULTS.md` | ✅ |
| Test results: 25/25 WP5.2 files, 36/36 WP5.2 tests PASS | ✅ |
| Test results: 10/10 WP5.3 adversarial tests PASS | ✅ |
| Production scope: `src/attribution.ts` (lines 55-70, 97, 103) + `src/complexity.ts` (new helper) — no other `src/` files changed | ✅ |
| WP5.4 Untouched Confirmation: V01, D10, G06, G07 explicitly listed as untouched → WP5.4 | ✅ |
| WP5.4 routing uses correct FM IDs with authoritative meanings | ✅ |
| Date corrected: 2025 → 2026 | ✅ |
| C03 contract wording: "acceptable" → "unresolved contract question" | ✅ |
| No `src/` code changes | ✅ |
| No WP5.4 implementation | ✅ |

---

## Closure Recommendation

**WP5.3 is RECONCILED and CLOSED.**

- Implementation: PASS (46/46 tests, zero regressions)
- Documentation: Taxonomy reconciled with WP5.2 authoritative sources
- Contract: Untracked TS discovery explicitly recorded as unresolved
- Code: 2 `src/` files changed, no other production code touched
- WP5.4 scope: Orthogonal to WP5.3; ready for authorization

**Recommendation:** Proceed to WP5.4 authorization. WP5.3 provides a clean attribution foundation (correct file identity, correct method naming, complete source enumeration) that WP5.4 can build on for version/diff/blame attribution.
