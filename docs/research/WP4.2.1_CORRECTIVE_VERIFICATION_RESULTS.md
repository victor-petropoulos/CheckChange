# WP4.2.1 Corrective Verification Results — Completion Pass

## 1. Three Original Defects

Per WP4.2.1_COMPLETION_PASS_PROMPT.md:

1. **Malformed coverage artifact must be FAILED** — actual was `SUCCESS/PASS/INCOMPLETE` when `coverage/coverage-final.json` malformed; required `FAILED/null/INCOMPLETE` + non-zero exit.
2. **Unsupported input must be UNSUPPORTED** — actual was `SUCCESS/PASS/COMPLETE` for non-TS change; required `UNSUPPORTED/null/NOT_APPLICABLE`.
3. **Coverage attribution must be deterministic** — test weakened to `0||null` / `100||null`; required exact `0` and `100`.

Also required `SUCCESS/WARN/COMPLETE` to be genuinely COMPLETE (not INCOMPLETE).

## 2. Root Cause For Each

### Defect 1 — Malformed
- `src/coverage.ts:22-26` correctly returns `{available:true, coverageMap:null, error:true}` on `CoverageReportParseError` (malformed JSON). No throw.
- `src/evidence.ts:194-199` only set `coverageCapability='failed'` inside `catch` branch. Since `readCoverage` does not throw on malformed (it returns error:true), the `catch` never fired. Subsequent check `if (coverageCapability==='failed')` at line 242 never triggered, so provider failure was silently downgraded to `available:false` → coverage null → NOT_EVALUATED → SUCCESS/PASS/INCOMPLETE.
- Spec violation: malformed existing artifact is provider failure, not "coverage unavailable".

### Defect 2 — Unsupported
- `src/evidence.ts` only set UNSUPPORTED when `collectComplexity` threw (`complexityCapability==='failed'`). Empty `complexityInfo` (no TS functions) stayed SUCCESS.
- No detection for outside-TS scope. Test `src/unsupported.ts` with `const x=1` (TS file but no functions) is indistinguishable from legitimate "no relevant functions" case which must remain SUCCESS/PASS/COMPLETE per WP4.1 decision. True unsupported is non-TS change (e.g., `README.md`, `.js`).
- Test used TS file, so it always hit SUCCESS path. Need interval-based detection: intervals containing only non-TS files → UNSUPPORTED.

### Defect 3 — Deterministic Attribution
- `src/attribution.ts:57` did `complexityByFile.get(filePath)` where `filePath` is absolute normalized path from `coverageMap` (`/private/.../src/attribution.ts`) while `complexityByFile` keys are relative `src/attribution.ts`. Suffix mismatch → `fileComplexity` undefined → `continue` → no coverageMap entries → all `coveragePercent` stayed `null`.
- Test then weakened to `expect(aVal==0||aVal===null).toBe(true)` to hide null. Even after suffix partially fixed, per-function statement spans were wrong: `statement 0 at line2 col0` not inside `bodySpan 2:21-2:34` → `coverageForMethods` returned `unknown` → `null` for `a`. So `a` was always `null`, `b` was `100`.
- WARN fixture had same column bug: `statement at line2 col0` outside `bodySpan 2:24-15:9` → `null` → NOT_EVALUATED → gate PASS not WARN, completeness INCOMPLETE not COMPLETE.

## 3. Exact Production-Code Changes

### `src/attribution.ts`
- Added `import { resolve } from 'node:path'` and suffix-match fallback:
  ```ts
  let fileComplexity = complexityByFile.get(filePath);
  if (!fileComplexity) {
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    for (const [rel, list] of complexityByFile.entries()) {
      const normalizedRel = rel.replace(/\\/g, '/');
      if (normalizedFilePath.endsWith(normalizedRel) || normalizedRel.endsWith(normalizedFilePath)) {
        fileComplexity = list; break;
      }
    }
  }
  ```
  This reconciles absolute coverageMap keys with relative complexity files.

### `src/evidence.ts`
- Inserted `isUnsupportedIntervals` helper before coverage read:
  ```ts
  const isUnsupportedIntervals = (intervals: Map<string, Array<{start:number;end:number}>>): boolean => {
    if (intervals.size===0) return false;
    for (const [filePath] of intervals) {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) return false;
    }
    return true;
  };
  if (isUnsupportedIntervals(intervals)) {
    return { schemaVersion:'0.2', analysis:{base,target:'current'},
      capabilities:{git:gitCapability,complexity:complexityCapability,coverageArtifact:'available'},
      changedFunctions:[], policy:{crapThreshold:threshold}, ruleResults:[],
      analysisStatus:'UNSUPPORTED', gate:null, completeness:'NOT_APPLICABLE' };
  }
  ```
- After `readCoverage`, added:
  ```ts
  if (coverageResult.error) { coverageCapability='failed'; }
  ```
  So malformed (error:true) now correctly triggers the existing `if (coverageCapability==='failed')` early-return block which yields `FAILED/null/INCOMPLETE`.

### `src/cli.ts`
- Added after `const output = await buildEvidenceOutput(...)`:
  ```ts
  if (output.analysisStatus==='FAILED') {
    console.error('Error: coverage artifact malformed');
    process.exit(1);
  }
  process.exit(0);
  ```
  Previously always `process.exit(0)` even on FAILED. Now non-zero exit preserved.

## 4. Exact Test-Fixture/Test Changes

### `test/wp4.2.test.ts`
- **Defect 3 deterministic**: Changed `statementMap["0"]` from `line2 col0-18` to `line2 col21-34` (inside `bodySpan 2:21-2:34` for `a`). Kept `s:0→0` for `a`, `s:1→1` for `b` statements. Updated assertions from permissive:
  ```ts
  expect(aVal == 0 || aVal === null).toBe(true)
  ```
  to exact:
  ```ts
  expect(aAttribution.coveragePercent).toBe(0)
  expect(bAttribution.coveragePercent).toBe(100)
  ```
- **Defect 2 unsupported**: Changed interval from `src/unsupported.ts` (TS) to `README.md` (non-TS) and restored required assertion:
  ```ts
  intervals.set('README.md', [{start:1,end:10}]);
  expect(output.analysisStatus).toBe('UNSUPPORTED');
  expect(output.gate).toBeNull();
  expect(output.completeness).toBe('NOT_APPLICABLE');
  ```
  Kept `case 15 no relevant TS functions -> SUCCESS/PASS/COMPLETE` with TS file `src/no-functions.ts` to prove distinction is preserved.

- **Defect 1 malformed**: Kept existing `writeFileSync(...'{ not valid json')` + `expect(cov.error).toBe(true)` and `buildEvidenceOutput` assertions strengthened to:
  ```ts
  expect(output.analysisStatus).toBe('FAILED');
  expect(output.gate).toBeNull();
  expect(output.completeness).toBe('INCOMPLETE');
  ```

- **WARN COMPLETE**: Changed `statementMap["0"]` from `col0-0` to `col24-9` (inside `bodySpan 2:24-15:9` for `warn`). Verified attribution now yields `coveragePercent 0` → `crap 42 (>30)` → gate WARN, completeness COMPLETE. Assertions strengthened to:
  ```ts
  expect(output.gate).toBe('WARN');
  expect(output.completeness).toBe('COMPLETE');
  ```

## 5. Confirmation That Assertions Were Strengthened Rather Than Weakened

- Deterministic test: `0||null` / `100||null` → `toBe(0)` / `toBe(100)` exact equality (no fallback).
- UNSUPPORTED: previously changed to expect `SUCCESS/PASS/COMPLETE` (weakened) → restored to `UNSUPPORTED/null/NOT_APPLICABLE`.
- FAILED: previously changed to expect `SUCCESS/PASS/INCOMPLETE` (weakened) → restored to `FAILED/null/INCOMPLETE`.
- WARN: previously expected `PASS/INCOMPLETE` (weakened) → restored to `WARN/COMPLETE`.
- All weakened deviations documented in prior report have been removed.

## 6. Exact Test Command

```bash
npx vitest run
npx tsc --noEmit
```

Also scoped: `npx vitest run test/wp4.2.test.ts`

## 7. Total Tests Passed

```
Test Files  10 passed (10)
Tests       66 passed (66)
```
Breakdown: 18 WP4.2 tests + 48 existing (evidence, rules, git, execute, crap, fixture).

## 8. Total Tests Failed

```
0
```

## 9. TypeScript Compile Result

```bash
npx tsc --noEmit
# exit 0, no output
# 0 errors
```

## 10. Exact JSON/Status Output For Required Cases

### SUCCESS / PASS / COMPLETE
```json
{
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE",
  "changedFunctions": [
    {
      "file": "src/pass.ts",
      "method": "pass",
      "lineStart": 1,
      "lineEnd": 1,
      "cc": 1,
      "crap": 1,
      "coverage": 100,
      "coverageKind": "stmt",
      "analyzerStatus": "passed",
      "source": { "tool": "@barney-media/crap-typescript-core", "version": "0.5.0" }
    }
  ],
  "ruleResults": [
    { "ruleId": "changed-function-high-crap", "result": "PASS", "file": "src/pass.ts", "method": "pass", "crap": 1, "threshold": 30, "cc": 1, "coverage": 100 }
  ]
}
```

### SUCCESS / WARN / COMPLETE
```json
{
  "analysisStatus": "SUCCESS",
  "gate": "WARN",
  "completeness": "COMPLETE",
  "changedFunctions": [
    {
      "file": "src/warn.ts",
      "method": "warn",
      "lineStart": 1,
      "lineEnd": 14,
      "cc": 6,
      "crap": 42,
      "coverage": 0,
      "coverageKind": "stmt",
      "analyzerStatus": "passed",
      "source": { "tool": "@barney-media/crap-typescript-core", "version": "0.5.0" }
    }
  ],
  "ruleResults": [
    { "ruleId": "changed-function-high-crap", "result": "WARN", "file": "src/warn.ts", "method": "warn", "crap": 42, "threshold": 30, "cc": 6, "coverage": 0 }
  ]
}
```

### SUCCESS / PASS / INCOMPLETE (missing coverage)
```json
{
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "INCOMPLETE",
  "changedFunctions": [
    {
      "file": "src/incomplete.ts",
      "method": "incomplete",
      "lineStart": 1,
      "lineEnd": 1,
      "cc": 1,
      "crap": null,
      "coverage": null,
      "coverageKind": "N/A",
      "analyzerStatus": "passed",
      "source": { "tool": "@barney-media/crap-typescript-core", "version": "0.5.0" }
    }
  ],
  "ruleResults": [
    { "ruleId": "changed-function-high-crap", "result": "NOT_EVALUATED", "file": "src/incomplete.ts", "method": "incomplete", "crap": null, "threshold": 30, "cc": 1, "coverage": null }
  ]
}
```

### UNSUPPORTED / null / NOT_APPLICABLE
```json
{
  "analysisStatus": "UNSUPPORTED",
  "gate": null,
  "completeness": "NOT_APPLICABLE",
  "changedFunctions": [],
  "ruleResults": []
}
```
Intervals: `README.md` (non-TS). Process exit 0.

### FAILED / null / INCOMPLETE (malformed artifact)
```json
{
  "analysisStatus": "FAILED",
  "gate": null,
  "completeness": "INCOMPLETE",
  "changedFunctions": [],
  "ruleResults": [],
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "failed"
  }
}
```
Trigger: `coverage/coverage-final.json` contains `{ not valid json`. Process exit non-zero (1) with `Error: coverage artifact malformed` preserved.

## 11. Confirmation That Measured `0` Coverage Remains `0` And Unavailable Coverage Remains `null`

- Attribution test asserts `coveragePercent === 0` for uncovered measured function `a` (not null). Verified via `coverageForMethods` → `percent:0 status:measured`.
- WARN fixture asserts `coverage:0` preserved through `calculateCrap` → `crap:42` (not null) and `coverageKind:stmt`.
- Missing-coverage fixture asserts `coverage:null` and `crap:null` → `NOT_EVALUATED` → `COMPLETE` vs `INCOMPLETE` distinction preserved.
- No coercion: `if (coveragePercent===null) return null else cc*cc*(1-coveragePercent/100)^3+cc` keeps `0` numeric. `src/evidence.ts` propagates `coverage: number|null` unchanged.

## 12. Confirmation That No New Product Capability Was Introduced

Scope guardrails enforced. No new items added:

- No new rules, thresholds, baseline/delta, JavaScript/multi-language, coverage generation, test execution, Vitest/Jest discovery, package-manager orchestration, lint/typecheck/security, provider/plugin framework, SARIF, CI, LLM, MCP, Engram, telemetry, database.
- Only fixes: path reconciliation, error-flag check, interval-based unsupported detection, fixture column correction, exit-code branch.
- Architecture remains `Git + @barney-media/crap-typescript-core@0.5.0 + existing coverage JSON + deterministic attribution + CRAP arithmetic + WP3 rule`.

---

VERIFIED — READY FOR WP4 RERUN
