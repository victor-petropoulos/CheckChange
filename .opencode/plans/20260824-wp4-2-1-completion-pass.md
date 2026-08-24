---
task: "WP4.2.1 Completion Pass — 3 Defects"
created: 2026-08-24T09:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Fix Defect1 malformed coverage FAILED"
    agent: "implementer"
    files: ["src/evidence.ts", "src/coverage.ts", "src/cli.ts"]
    acceptance: "malformed coverage-final.json yields FAILED/null/INCOMPLETE + non-zero exit, test asserts FAILED"
    depends_on: []
  - id: "2"
    description: "Fix Defect2 unsupported UNSUPPORTED"
    agent: "implementer"
    files: ["src/evidence.ts", "test/wp4.2.test.ts"]
    acceptance: "unsupported input yields UNSUPPORTED/null/NOT_APPLICABLE, SUCCESS/PASS/COMPLETE still works for no relevant functions"
    depends_on: []
  - id: "3"
    description: "Fix Defect3 deterministic attribution 0 and 100"
    agent: "implementer"
    files: ["src/attribution.ts", "test/wp4.2.test.ts"]
    acceptance: "deterministic test asserts exact coverage ===0 and ===100, no permissive 0||null"
    depends_on: []
  - id: "4"
    description: "Fix SUCCESS/WARN/COMPLETE fixture to be genuinely COMPLETE"
    agent: "implementer"
    files: ["test/wp4.2.test.ts"]
    acceptance: "WARN fixture shows SUCCESS/WARN/COMPLETE with numeric CRAP>30"
    depends_on: ["3"]
  - id: "5"
    description: "Full verification: vitest run + tsc --noEmit + update results doc"
    agent: "implementer"
    files: ["docs/research/WP4.2.1_CORRECTIVE_VERIFICATION_RESULTS.md"]
    acceptance: "0 failing, 0 tsc errors, 5 JSON outputs, VERIFIED READY"
    depends_on: ["1", "2", "4"]
---

# WP4.2.1 Completion Pass — 3 Defects

## Root Causes
1. **Malformed FAILED**: `src/coverage.ts` returns `{available:true, error:true}` on malformed JSON but `src/evidence.ts:158` only checks `coverageCapability==='failed'` (catch branch), never `coverageResult.error===true`. So malformed silently treated as coverage available=false → SUCCESS.
2. **Unsupported UNSUPPORTED**: `src/evidence.ts` only sets UNSUPPORTED on `collectComplexity` throw. Empty complexityInfo (no TS functions) stays SUCCESS. No detection for outside TS scope (non-TS intervals). Test used TS file with no functions → indistinguishable from SUCCESS/no-relevant-functions case. Need real unsupported fixture (non-TS file) + detection via intervals containing non-TS files.
3. **Attribution deterministic**: fixture coverageData only had `statementMap`/`s` with sparse mapping and expected permissive `0||null`/`100||null`. `attachCoverage` returned null due to descriptor mismatch / file path not in coverageMap, so test weakened. Need fixture with functionMap+statementMap that maps unambiguously to parsed MethodDescriptors, yielding exact 0 and 100.

## Production Changes Required
- `src/evidence.ts`: after `readCoverage`, if `coverageResult.error===true` set FAILED/null/INCOMPLETE early return (same as failed capability). Also fix `coverageCapability` assignment to reflect error.
- `src/evidence.ts`: UNSUPPORTED detection: if `complexityInfo.length===0` and intervals contain at least one file with non-TS extension (or intervals non-empty but correlated changedFunctions empty and intervals have non-TS), return UNSUPPORTED/null/NOT_APPLICABLE. Alternative: if intervals map has any file not ending .ts/.tsx -> UNSUPPORTED. Must preserve SUCCESS/PASS/COMPLETE when complexityInfo empty but intervals empty or intervals only TS no-functions (case 15).
- `src/cli.ts`: ensure non-zero exit on FAILED (already does via throw, but need to ensure buildEvidenceOutput FAILED propagates to exit 1). Currently cli does `process.exit(0)` always on success path even if analysisStatus FAILED. Must exit 1 when FAILED.

## Test Fixture Changes
- Defect1: test must assert `analysisStatus==='FAILED', gate===null, completeness==='INCOMPLETE'` after buildEvidenceOutput with malformed file.
- Defect2: change unsupported fixture to use interval `src/unsupported.js` or `README.md` (outside TS scope) with complexityInfo empty, assert UNSUPPORTED. Keep case 15 `no relevant TS functions -> SUCCESS/PASS/COMPLETE` with empty complexity but intervals pointing to TS file with no functions (or empty intervals).
- Defect3: rewrite attribution fixture to include valid Istanbul coverage with `statementMap`, `s`, `fnMap`, `f`, `branchMap`, `b` that aligns to function ranges from `collectComplexity`. Use `parseFileMethods` to get exact descriptor startLines then craft coverage spans covering those lines with s:0 for uncovered and s:1 for covered, ensuring `coverageForMethods` returns deterministic percent 0 and 100. Assert `expect(aVal).toBe(0)` and `expect(bVal).toBe(100)` exact.
- Defect WARN COMPLETE: ensure WARN fixture has `coverage:0` for high CC function and `coverage:100` for low CC? But to get COMPLETE, all changedFunctions must be evaluated (no null). So ensure coverage attribution yields number for WARN function, and changedFunctions only contains that one WARN function (no unrelated nulls). Use single-file fixture with one high-CC function.

## Scope Guardrails
No new rules, thresholds, baseline, JS support, test execution, coverage generation, etc.

## Verification
`npx vitest run` and `npx tsc --noEmit` must both be clean. Results doc must show 5 JSON outputs.
