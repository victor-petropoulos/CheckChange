# WP5.4 — Taxonomy Reconciliation

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION
**Date:** 2026-08-26
**Gate:** All rows resolved from authoritative WP5.2/WP5.3 evidence before WP5.4 implementation begins.

## Reconciliation Table

| FM ID | Authoritative Meaning | Evidence Artifact | WP5.3 Disposition | WP5.4 Scope | Status |
|-------|----------------------|-------------------|-------------------|-------------|--------|
| FM-V01 | Coverage capability mislabel: default coverage absent sets `available: false` but `capabilities.coverageArtifact` reports `'available'`. Internal `coverageCapability` stays `'available'` because `readCoverage` returns `{available:false, error:false}` which does not trigger the `coverageCapability = 'failed'` branch. | `defect-reproduction-results.md` line 12, `WP5_2_RESULTS.md` line 21 (`expect(output.capabilities.coverageArtifact).toBe('available')`), `fr-v1.spec.ts`, `src/evidence.ts` line 145 (initial `coverageCapability = 'available'`), `src/coverage.ts` lines 28-30 (default-missing path) | Deferred → WP5.4 | Correct `capabilities.coverageArtifact` to reflect actual availability. When default coverage missing (`available:false, error:false`), set `coverageCapability` to `'absent'` or equivalent. | CONFIRMED |
| FM-D10 | CLI reports "Not a git repository" when git binary is missing (ENOENT), not a repo-state issue. `validateGitRepo` throws `Error('Not a git repository')` because `execute` returns `exitCode: null` for ENOENT, and `null !== 0` is true. | `cli-diagnostics/fm-d10-evidence.md` (verbatim: `env -i PATH=... node dist/cli.js check --base HEAD` → exit 1, stderr `"Error: Not a git repository"`), `cli-diagnostics/fm-d10-evidence.json`, `src/git.ts` line 16, `src/execute.ts` lines 50-54 (ENOENT → exitCode null) | Deferred → WP5.4 | Clarify CLI message to indicate git binary missing (ENOENT) vs actual "not a git repository" repo state. Distinguish ENOENT from `git rev-parse --git-dir` failure. | CONFIRMED |
| FM-G06 | CLI reports "coverage artifact malformed" when explicit coverage file is missing. Requires TS change to activate coverage path. `readCoverage` returns `{available:true, error:true}` for missing explicit file → `coverageCapability = 'failed'` → CLI prints "malformed". | `cli-diagnostics/fm-g06-evidence.md` (verbatim: `node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-xyz.json` with TS change → exit 1, stderr `"Error: coverage artifact malformed"`), `cli-diagnostics/fm-g06-evidence.json`, `src/coverage.ts` lines 25-27 (explicit-missing path), `src/cli.ts` line 125 | Deferred → WP5.4 | Clarify CLI message for missing coverage file vs "malformed artifact". Distinguish file-not-found from parse-error. | CONFIRMED |
| FM-G07 | Composed-path `analyzerStatus` hardcoded `'passed'` regardless of whether function actually evaluated or received null coverage. Every function gets `analyzerStatus: 'passed'` at line 216 of `src/evidence.ts`. | `defect-reproduction-results.md` line 14, `defect-repro.spec.ts` line 511 (`expect(func.analyzerStatus).toBe('passed')`), `src/evidence.ts` line 216 (`analyzerStatus: 'passed'`) | Deferred → WP5.4 | Set `analyzerStatus` based on actual evaluation result / coverage validity. Functions with null coverage should not report `'passed'`. | CONFIRMED |

## Closed FMs (for context — NOT in WP5.4 scope)

| FM ID | Authoritative Meaning | WP5.3 Disposition | WP5.4 Scope | Status |
|-------|----------------------|-------------------|-------------|--------|
| FM-A07 | Container-method attribution key mismatch (`containerName.functionName` vs raw `functionName`) causes class/object methods to lose coverage → null CRAP / NOT_EVALUATED. | Fixed in WP5.3: `src/attribution.ts` line 101 now uses `{containerName}.{functionName}:{startLine}` key format. | Not in scope — CLOSED | CLOSED |
| FM-A08 | Suffix-collision path attribution: bidirectional `endsWith` matching with first-entry-wins misattributes coverage between files sharing relative path suffixes. | Fixed in WP5.3: `src/attribution.ts` lines 55-70 now uses exact path match first, `endsWith` fallback only, ambiguous → decline. | Not in scope — CLOSED | CLOSED |
| FM-C03 | Source-root blind spot: `findAllTypeScriptFilesUnderSourceRoots` restricts scanning to paths containing `src` segment. | Fixed in WP5.3: `src/complexity.ts` adds `getGitTrackedTsFiles()` + union logic. | Not in scope — CLOSED | CLOSED |

## Gate Statement

All 4 WP5.4 FMs (V01, D10, G06, G07) are CONFIRMED and reconciled against authoritative WP5.2/WP5.3 evidence. No FM is BLOCKED. WP5.4 implementation may proceed upon approval.

## Hard Constraints (echoed from WP5.4 Spec Provisional)

- No threshold changes
- No CRAP formula changes
- No source attribution changes (already fixed in WP5.3)
- No source discovery changes (already fixed in WP5.3)
- No coverage provider implementation changes
- No language expansion
- No LLM-based classification
- All WP5.1–WP5.3 regression anchors must remain green
