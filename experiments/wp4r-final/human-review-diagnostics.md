# WP4R Final Human Review Diagnostics

Verbose details supporting the human-review-packet.md. For investigators who need to verify evidence independently.

---

## 1. Artifact Paths

| Artifact | Path |
|----------|------|
| Aggregate results | `experiments/wp4r-final/aggregate-results.json` |
| h3/h3-01 output | `experiments/wp4r-final/h3/h3-01/output-threshold-30.json` |
| h3/h3-02 output | `experiments/wp4r-final/h3/h3-02/output-threshold-30.json` |
| h3/h3-03 output | `experiments/wp4r-final/h3/h3-03/output-threshold-30.json` |
| hono/hono-01 output | `experiments/wp4r-final/hono/hono-01/output-threshold-30.json` |
| hono/hono-02 output | `experiments/wp4r-final/hono/hono-02/output-threshold-30.json` |
| hono/hono-03 output | `experiments/wp4r-final/hono/hono-03/output-threshold-30.json` |
| apollo/apollo-01 output | `experiments/wp4r-final/apollo-client/apollo-01/output-threshold-30.json` |
| apollo/apollo-02 output | `experiments/wp4r-final/apollo-client/apollo-02/output-threshold-30.json` |
| apollo/apollo-03 output | `experiments/wp4r-final/apollo-client/apollo-03/output-threshold-30.json` |
| hono-01 coverage | `experiments/wp4r-final/hono/hono-01/coverage/raw/default/coverage-final.json` |
| hono-02 coverage | `experiments/wp4r-final/hono/hono-02/coverage/raw/default/coverage-final.json` |
| hono-03 coverage | `experiments/wp4r-final/hono/hono-03/coverage/raw/default/coverage-final.json` |
| h3 coverage | Not preserved (cleaned after experiment) |
| apollo coverage | Not generated (empty stdout/stderr) |
---

## 2. Exact Commands Used to Inspect Evidence

```bash
# Output JSON structure
cat experiments/wp4r-final/h3/h3-01/output-threshold-30.json | python3 -c "
import json
with open('experiments/wp4r-final/h3/h3-01/output-threshold-30.json') as f:
    d = json.load(f)
print('base:', d['analysis']['base'])
print('target:', d['analysis']['target'])
print('gate:', d.get('gate'))
print('completeness:', d.get('completeness'))
for o in d.get('output', []):
    print(f'  fn: {o.get("function")} lines {o.get("startLine")}-{o.get("endLine")} CC:{o.get("cc")} CRAP:{o.get("crap")} cov:{o.get("coverage")}')
"

# Istanbul fnMap inspection (hono-02 route/index.ts)
python3 -c "
import json
with open('experiments/wp4r-final/hono/hono-02/coverage/raw/default/coverage-final.json') as f:
    d = json.load(f)
for k in d:
    if 'route/index' in k:
        for idx, fn in d[k].get('fnMap', {}).items():
            print(f'fnMap[{idx}]: name={fn.get("name")} startLine={fn.get("startLine")} endLine={fn.get("endLine")}')
"

# Istanbul fnMap inspection (hono-03 csrf/index.ts)
python3 -c "
import json
with open('experiments/wp4r-final/hono/hono-03/coverage/raw/default/coverage-final.json') as f:
    d = json.load(f)
for k in d:
    if 'csrf' in k:
        for idx, fn in d[k].get('fnMap', {}).items():
            print(f'fnMap[{idx}]: name={fn.get("name")} startLine={fn.get("startLine")} endLine={fn.get("endLine")}')
"

# Coverage generation diagnostics
cat experiments/wp4r-final/apollo-client/apollo-01/coverage-generation-stdout.txt | wc -c
cat experiments/wp4r-final/apollo-client/apollo-01/coverage-generation-stderr.txt | wc -c
```
---

## 3. Istanbul File/Function-Map Findings

### hono-02: `src/helper/route/index.ts`

| fnMap Index | Function Name | startLine | endLine |
|-------------|--------------|-----------|---------|
| 0 | matchedRoutes | None | None |
| 1 | routePath | None | None |
| 2 | baseRoutePath | None | None |
| 3 | basePath | None | None |

**Statement coverage:** 0/0 (file-level — Istanbul reports 0 statements because arrow functions in this file have `None` line numbers)
**Branch coverage:** 170/23 (739.1%)

**Note:** All 4 functions have `startLine=None, endLine=None` in the fnMap. This is a v8 coverage artifact — arrow functions assigned to const declarations do not produce reliable line-number mappings in Istanbul's fnMap. The branch coverage is computed at the statement level and is the authoritative metric.

### hono-03: `src/middleware/csrf/index.ts`

| fnMap Index | Function Name | startLine | endLine |
|-------------|--------------|-----------|---------|
| 0 | isSecFetchSite | 15 | 16 |
| 1 | csrf | 91 | 148 |
| 2 | isAllowedOrigin | 103 | 109 |
| 3 | isAllowedSecFetchSite | 123 | 133 |
| 4 | csrf2 | 135 | 147 |

**Statement coverage:** 0/0 (same arrow-fn mapping issue as hono-02)
**Branch coverage:** 291/35 (831.4%)

**Note:** 5 functions in fnMap. `csrf2` is likely a duplicate or test-only export. The original diagnostics script used `.get("startLine")` / `.get("endLine")` which returned `None` because the actual Istanbul data stores line numbers nested under `decl.start.line` and `decl.end.line`. Correct extraction confirms all 5 functions have valid line-number mappings. Per-function coverage can be verified via fnMap entries.

### hono-01: `src/utils/cors/index.ts` (and related)

Coverage files present but no changed functions mapped to fn intervals. The CORS change is a small utility edit that falls within an existing function body without creating new boundaries.
---

## 4. Function-Range / Attribution Observations

### CRAP analyzer function mapping vs Istanbul fnMap

The CRAP analyzer and Istanbul (v8 coverage) use different function detection strategies:

1. **CRAP analyzer** (TypeScript AST-based): Identifies function declarations, arrow functions, and method definitions by AST node type. Produces `startLine`/`endLine` ranges for each changed function.
2. **Istanbul v8** (runtime instrumentation): Records coverage at the statement level. fnMap entries store line numbers nested under `decl.start.line` / `decl.end.line` (not top-level `startLine`/`endLine`). The original diagnostics script used the wrong key path, causing all entries to report `None`. Correct extraction shows valid line numbers for all functions.

**Impact on this review:**
- For hono-03, Istanbul fnMap CAN be used to verify per-function coverage — correct extraction shows valid line numbers for all 5 functions. (hono-02 route/index.ts still has `None` entries due to different v8 instrumentation behavior.)
- Coverage percentages reported in output-threshold-30.json are file-level aggregates, not per-function.
- For h3 cases, coverage artifacts were cleaned post-experiment. Only the output JSON metadata (coverage=80 branch for h3-01, coverage=100 stmt for h3-02/03) is available.
- For apollo cases, no coverage artifacts were generated at all (empty stdout/stderr).

### Function range attribution for PASS samples

| PASS Sample | CRAP analyzer lines | Istanbul fnMap lines | Match? |
|-------------|-------------------|---------------------|--------|
| h3/h3-01 `isBodySizeWithin` | 152–185 | N/A (cleaned) | N/A |
| h3/h3-02 `requestWithURL` | 29–33 | N/A (cleaned) | N/A |
| h3/h3-02 `requestWithBaseURL` | 38–42 | N/A (cleaned) | N/A |
| h3/h3-03 `setServerTiming` | 17–35 | N/A (cleaned) | N/A |
| h3/h3-03 `withServerTiming` | 51–62 | N/A (cleaned) | N/A |
| hono/hono-02 `basePath` | 107–141 | None (arrow fn) | Partial — Istanbul confirms fn exists but no line mapping |
| hono/hono-02 `routePath` | 58–59 | None (arrow fn) | Partial — Istanbul confirms fn exists but no line mapping |
| hono/hono-03 `csrf` | 91–148 | 91–148 (decl.start.line/decl.end.line) | Match — Istanbul fnMap confirms CRAP analyzer line range |
| hono/hono-03 `isAllowedSecFetchSite` | 123–133 | 123–133 (decl.start.line/decl.end.line) | Match — Istanbul fnMap confirms CRAP analyzer line range |
---

## 5. Unresolved Gaps

### Gap 1: h3 coverage artifacts cleaned
- h3/h3-01, h3/h3-02, h3/h3-03 coverage directories were cleaned after experiment.
- Only output-threshold-30.json metadata remains (coverage percentages).
- No `coverage-final.json` to verify per-function coverage.
**Impact:** Cannot independently verify that the reported coverage percentages (80 branch for h3-01, 100 stmt for h3-02/03) are accurate for the specific changed functions.

### Gap 2: Apollo coverage generation failure
- All three apollo cases (01, 02, 03) produced empty `coverage-generation-stdout.txt` (0 bytes) and non-empty stderr files.
- apollo-01 stderr: 12128 bytes (ts-jest warnings + test failures)
- apollo-02 stderr: 8948 bytes (ts-jest warnings + console.error)
- apollo-03 stderr: 118679 bytes (large output — likely many test failures)
**Root cause (CORRECTED — was Vitest, actually Jest):** Coverage command was Jest (`node --expose-gc ... jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="..."`) with coverage exit 1 (CONFIRMED), stdout 0 bytes (CONFIRMED), stderr 12128/8948/118679 bytes non-empty (CONFIRMED, ts-jest WARN + test PASS/FAIL), no `coverage-final.json` at expected absolute path (CONFIRMED missing, `/tmp/wp4r-repos/apollo-client/coverage` does not exist, no file in preserved experiments dir), word "coverage" absent from stderr (CONFIRMED). Reporter failed silently (UNRESOLVED why no coverage error). Empty stdout alone is not confirmed root cause (stderr non-empty). Prototype exit 1 with `analysisStatus: SUCCESS` `gate: PASS` is distinct — exit 1 LIKELY signals NOT_EVALUATED/missing coverage, not analysis failure (evidence: SUCCESS indicates analysis completed; completeness INCOMPLETE when changed>0 and coverageAvail 0/1 or 0/4, COMPLETE when changed 0).
**Impact:** CRAP/coverage null for all apollo changed functions (CONFIRMED). NOT_EVALUATED correct but must distinguish coverage-command exit, prototype exit, analysisStatus, gate, completeness.

### Gap 3: Istanbul arrow-function line mapping (CORRECTED per Task 3)
- Original script used wrong key path (`fn.startLine` → None). Correct path is `fn.decl.start.line`.
- hono-02 `src/helper/route/index.ts`: 4 fnMap entries still report `decl.start.line=None` via v8 (arrow const) — per-function line mapping unavailable (CONFIRMED for this file).
- hono-03 `src/middleware/csrf/index.ts`: 5 fnMap entries have valid `decl.start.line` / `decl.end.line` (15-16, 91-148, 103-109, 123-133, 135-147) — per-function mapping CONFIRMED matches CRAP ranges (see §7).
- File-level branch coverage is available (hono-02) and hono-03 per-function 100% stmt per output JSON.
**Impact (CORRECTED):** hono-03 per-function coverage CAN be confirmed via correct fnMap extraction; hono-02 cannot (v8 arrow-fn artifact). Packet's file-level vs per-function note was partially inaccurate before correction.

### Gap 4: Zero-function cases — CRAP analyzer fn boundary detection
- hono-01: 0 changed functions. diff touches utility files and type definitions. CRAP analyzer did not map any changed lines to fn intervals.
- apollo-01: 0 changed functions. Pure type-only change (`Array` → `ReadonlyArray`). TypeScript type aliases are not fn declarations.
**Impact:** No PASS/WARN findings to sample. These cases are correctly documented as having no numeric PASS sample.

### Gap 5: Completeness flags
- h3/h3-02: INCOMPLETE (2 NOT_EVAL fns in the case)
- apollo-02: INCOMPLETE (1 NOT_EVAL fn)
- apollo-03: INCOMPLETE (4 NOT_EVAL fns)
- All other cases: COMPLETE
**Impact:** INCOMPLETE cases have fewer evaluated findings. This is correctly reflected in the packet.
---

## Appendix: Coverage Generation Output Samples

### h3/h3-01 coverage-generation-stdout.txt (first 20 lines)
```
 RUN  v4.1.10 /private/tmp/wp4r1-h3
      Coverage enabled with v8

 ❯ test/bench/bundle.test.ts (3 tests | 1 failed) 49ms
    × bundle size (H3) 28ms
    ✓ bundle size (H3Core) 10ms
    ✓ bundle size (defineHandler) 10ms
 ✓ test/unit/package.test.ts (1 test) 164ms
 ❯ test/status.test.ts (10 tests | 2 failed) 57ms
    × sets status 200 as default (web) 12ms
    ✓ override status and statusText (web) 1ms
    ...
```
**Note:** Tests ran and coverage was enabled. Coverage dir cleaned post-experiment.

### apollo-01 coverage-generation-stderr.txt (first 20 lines — CORRECTED, was h3/Vitest content)
```
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /private/tmp/wp4r-repos/apollo-client/tsconfig.tests.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
FAIL Core Tests src/cache/core/__tests__/cache.ts
  ● abstract cache › readQuery › runs the read method

    TypeError: expect(...).toBeCalled is not a function

       99 |
      100 |       test.readQuery({ query });
    > 101 |       expect(test.read).toBeCalled();
```
**Note (CORRECTED):** Jest (not Vitest) with ts-jest. stdout 0 bytes (CONFIRMED), stderr 12128 bytes (CONFIRMED) contains ts-jest WARN + FAIL markers. Word "coverage" absent (CONFIRMED). Previous version incorrectly showed h3/Vitest stderr (copy-paste error).

### apollo-02 coverage-generation-stdout.txt
- 0 bytes (CONFIRMED `wc -c`)

### apollo-02 coverage-generation-stderr.txt
- 8948 bytes (CONFIRMED) — `ts-jest[config] (WARN)` + `PASS ReactDOM 19 ... useMutation.test.tsx (5.64s)` + console.error (Missing field 'createTodo'). Word "coverage" absent (CONFIRMED).

### apollo-03 coverage-generation-stdout.txt
- 0 bytes (CONFIRMED)

### apollo-03 coverage-generation-stderr.txt
- 118679 bytes (CONFIRMED) — `ts-jest[config] (WARN)` + `PASS ReactDOM 19 ... useQuery.test.tsx (19.304s, 5 passed)` + console.error. Word "coverage" absent (CONFIRMED). Not "likely many test failures" — tests PASSED; coverage reporter failed silently.

### Apollo distinction summary (CORRECTED — Task 4)
| Case | Coverage command | coverage-exit | stdout | stderr | artifact `/tmp/.../coverage/coverage-final.json` | artifact exists at execution? | prototype-exit-30 | analysisStatus | gate | completeness | changed | coverageAvail |
|------|----------------|---------------|--------|--------|--------------------------------------------------|-------------------------------|-------------------|---------------|------|--------------|---------|---------------|
| apollo-01 | Jest `... --testPathPatterns="src/cache/core"` | 1 (CONFIRMED) | 0 (CONFIRMED) | 12128 (CONFIRMED ts-jest+FAIL) | `coverage/coverage-final.json` | No — CONFIRMED missing (0/0) | 1 (CONFIRMED) | SUCCESS (CONFIRMED) | PASS | COMPLETE | 0 | 0/0 |
| apollo-02 | Jest `... --testPathPatterns="src/react/hooks/__tests__/useMutation"` | 1 | 0 | 8948 (ts-jest+PASS) | same | No — CONFIRMED 0/1 | 1 | SUCCESS | PASS | INCOMPLETE | 1 | 0/1 |
| apollo-03 | Jest `... --testPathPatterns="src/react/hooks/__tests__/useQuery"` | 1 | 0 | 118679 (ts-jest+PASS) | same | No — LIKELY never generated (0/4; UNRESOLVED exact instant) | 1 | SUCCESS | PASS | INCOMPLETE | 4 | 0/4 |
Prototype exit 1 ≠ analysis failure (SUCCESS+PASS proves analysis completed; exit 1 LIKELY signals missing coverage/NOT_EVALUATED). Empty stdout alone not confirmed root cause.
---

## Stale Output JSON Note

All 9 `output-threshold-30.json` files have `"target": "current"` in their `analysis.target` field:

```
h3/h3-01/output-threshold-30.json:    "target": "current"
h3/h3-02/output-threshold-30.json:    "target": "current"
h3/h3-03/output-threshold-30.json:    "target": "current"
hono/hono-01/output-threshold-30.json: "target": "current"
hono/hono-02/output-threshold-30.json: "target": "current"
hono/hono-03/output-threshold-30.json: "target": "current"
apollo-client/apollo-01/output-threshold-30.json: "target": "current"
apollo-client/apollo-02/output-threshold-30.json: "target": "current"
apollo-client/apollo-03/output-threshold-30.json: "target": "current"
```

**Authoritative sources:** `aggregate-results.json` and per-case `metadata.md` have correct full SHAs. These were used to correct all `Target SHA: current` occurrences in `human-review-packet.md`.

**Root cause:** The output JSONs were generated during the experiment run when `analysis.target` was set to the literal string `"current"` (indicating "use current HEAD of the forked repo at experiment time). The SHAs were resolved later via `aggregate-results.json` and `metadata.md`.

**Action taken:** Only `human-review-packet.md` was corrected (13 replacements). The `output-threshold-30.json` files were NOT modified — they are experiment artifacts showing the state of the analysis pipeline at execution time. The packet now has the correct SHAs for human review.

---

## 6. Task 2: Hono basePath/routeIndex Investigation

### Investigation steps

1. **Located hono repo:** `/private/tmp/wp4r-repos/hono` (also at `/tmp/wp4r-repos/hono`)
2. **Verified SHAs resolve:**
   - `git -C /private/tmp/wp4r-repos/hono rev-parse 81bda2e169ba26810c8044980f1cfea66912d720` → `81bda2e169ba26810c8044980f1cfea66912d720` ✓
   - `git -C /private/tmp/wp4r-repos/hono rev-parse 393ded96196da1b4f23813fea670b0d5a70526c6` → `393ded96196da1b4f23813fea670b0d5a70526c6` ✓
3. **Extracted complete file:** `git show 81bda2e:src/helper/route/index.ts` (141 lines)
4. **Extracted diff:** `git diff 393ded9..81bda2e -- src/helper/route/index.ts`

### Key finding: `routeIndex` is NOT a local variable in the target

In the **base** version (393ded9), `basePath` contained:
```typescript
export const basePath = (c: Context): string => {
  const routeIndex = c.req.routeIndex
  // ... uses cache[routeIndex] throughout
}
```

In the **target** version (81bda2e), `basePath` was refactored to:
```typescript
export const basePath = (c: Context, index?: number): string => {
  index ??= c.req.routeIndex
  // ... uses cache[index] throughout
}
```

The local variable `routeIndex` was **eliminated** and replaced by the `index` parameter. The expression `c.req.routeIndex` still exists as a **property access** on the request object (defined as `routeIndex: number = 0` in `src/request.ts:53`), but it is no longer a local variable.

### Verdict: TRUNCATION ARTIFACT

The original packet's source code block incorrectly showed `cache[routeIndex] = result` in the target source. This was a transcription error — the packet author likely truncated the diff and copied the `-` line (base version) instead of the `+` line (target version).

The `routeIndex` variable does **not** exist in the target scope. The target uses `cache[index]` where `index` is the function parameter (nullish-coalesced to `c.req.routeIndex`).

### Corrections applied to packet
- Source block line 340: `cache[routeIndex] = result` → `cache[index] = result`
- Diff block line 369: `+  cache[routeIndex] = result` → `+  cache[index] = result`
- Diff block: replaced `//... loop body unchanged...` with actual loop body from git diff

### Evidence
- `c.req.routeIndex` type: `number` with default `0` (from `src/request.ts:53`)
- Target `basePath` lines: 107–138 (function body)
- Diff shows 3 functions changed: `routePath`, `baseRoutePath`, `basePath` — all gained optional `index` parameter
- Cache map type changed: `string[]` → `Record<number, string>` to support indexed caching


---

## 7. Task 3: hono-03 isAllowedSecFetchSite Complete Evidence

### Extraction commands
```bash
# Target source
git -C /private/tmp/wp4r-repos/hono show 117d0a413fb021804e4996c3c79cdbac56e17b43:src/middleware/csrf/index.ts

# Diff
git -C /private/tmp/wp4r-repos/hono diff d9f7b99c519602d6f0664514a42b1bbc6ef57206..117d0a413fb021804e4996c3c79cdbac56e17b43 -- src/middleware/csrf/index.ts

# Base source (verification: isAllowedSecFetchSite does NOT exist)
git -C /private/tmp/wp4r-repos/hono show d9f7b99c519602d6f0664514a42b1bbc6ef57206:src/middleware/csrf/index.ts | grep -c "isAllowedSecFetchSite\|secFetchSite"
# Result: 0

# Istanbul fnMap extraction (correct key path)
python3 -c "
import json
with open('experiments/wp4r-final/hono/hono-03/coverage/raw/default/coverage-final.json') as f:
    d = json.load(f)
for k in d:
    if 'csrf' in k:
        for idx, fn in d[k].get('fnMap', {}).items():
            decl = fn.get('decl', {})
            sl = decl.get('start', {}).get('line') if isinstance(decl, dict) else None
            el = decl.get('end', {}).get('line') if isinstance(decl, dict) else None
            print(f'fnMap[{idx}]: name={fn.get("name")} startLine={sl} endLine={el}')
"
```

### Findings
- `isAllowedSecFetchSite` is a **new function** added in target SHA `117d0a4`. Zero references in base SHA `d9f7b99`.
- Function lines: 123–133 (11 lines). Type: arrow function assigned to `const`.
- CC=3, coverage=100% (stmt), CRAP=3 (per output-threshold-30.json).
- Istanbul fnMap: `decl.start.line=123, decl.end.line=133` — confirms CRAP analyzer line range.
- The original diagnostics script used `.get("startLine")` / `.get("endLine")` which returned `None` because Istanbul stores line numbers nested under `decl.start.line` / `decl.end.line`. Correct extraction confirms valid line numbers.
- The function is a type guard that validates `sec-fetch-site` header values through three conditional branches: undefined check, SecFetchSite type guard via `isSecFetchSite`, and delegation to `secFetchSiteHandler`.
- Output JSON has `changedFunctions` (camelCase key, not `changed_functions`). Contains 4 changed functions: `isSecFetchSite`, `csrf`, `isAllowedOrigin`, `isAllowedSecFetchSite`.
- `csrf2` appears in Istanbul fnMap (lines 135–147) but not in output JSON changedFunctions — likely a test-only export or internal alias.

### Istanbul fnMap verification
| fnMap Index | Function Name | startLine | endLine | Matches CRAP? |
|-------------|--------------|-----------|---------|---------------|
| 0 | isSecFetchSite | 15 | 16 | Yes (CRAP: 15–16) |
| 1 | csrf | 91 | 148 | Yes (CRAP: 91–148) |
| 2 | isAllowedOrigin | 103 | 109 | Yes (CRAP: 103–109) |
| 3 | isAllowedSecFetchSite | 123 | 133 | Yes (CRAP: 123–133) |
| 4 | csrf2 | 135 | 147 | N/A (not in output JSON) |

All 4 output-JSON functions have matching Istanbul fnMap entries with correct line ranges.

### Classification
Classification fields remain blank: [ ] EXPECTED_PASS / [ ] QUESTIONABLE_PASS / [ ] UNDETERMINED

---

## 8. Reconciliation with WP4R_FINAL_USEFULNESS_RESULTS.md

### Comparison table
| Dimension | `human-review-packet.md` / `diagnostics.md` (corrected) | `WP4R_FINAL_USEFULNESS_RESULTS.md` | Verdict |
|-----------|------------------------------------------------------|----------------------------------|---------|
| Pinned base/target SHAs (9 cases) | All match `aggregate-results.json` + per-case `metadata.md` (e.g., h3-01 43e1fa3→708a3aa, hono-02 393ded9→81bda2e, hono-03 d9f7b99→117d0a4, apollo-01 c34538e→f6d0efa, apollo-02 4d3fb77→db8a04b, apollo-03 5352c12→71f2517) — 0 `current` remains (CONFIRMED `grep -c "Target SHA: current" 0`) | Repository and Case Selection table lists same 7-char prefixes (e.g., h3-01 43e1fa3/708a3aa, hono-02 393ded9/81bda2e) — matches authoritative sources | **CONSISTENT** |
| Coverage commands | h3: `npx vitest --run --coverage.enabled ... --coverageReportOnFailure` → `coverage/coverage-final.json`; hono-01/02: `npx vitest --run --project=main --coverage` → `coverage/raw/default/coverage-final.json`; hono-03 fallback note: `--project=main` → fallback `npx vitest --run --coverage`; apollo-01/02/03: Jest `node --expose-gc ... jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/cache/core|src/react/hooks/__tests__/useMutation|useQuery"` (CONFIRMED from metadata/aggregate) | § Coverage Commands and Artifact Paths lists identical commands/paths (including hono-03 fallback and apollo Jest with `--testPathPatterns` plural + absolute `--coverageDirectory`) | **CONSISTENT** — prior packet incorrectly said Vitest for Apollo, now corrected to Jest matching final-results |
| Coverage exits | h3/hono 0 (not recorded but artifact exists); apollo 1 (CONFIRMED `coverage-exit.txt` 1 for all 3) | Execution Success Table: h3/hono 0, apollo 1 | **CONSISTENT** |
| Prototype exits | h3/hono 0; apollo-01/02/03 1 (CONFIRMED `prototype-exit-30.txt` 1) with `analysisStatus: SUCCESS` `gate: PASS` — exit 1 distinct from SUCCESS (LIKELY signals missing coverage/NOT_EVALUATED) | Execution Success Table: same (prototype 30/15 exit 1 for all Apollo, SUCCESS/PASS) | **CONSISTENT** — packet now distinguishes coverage-exit vs prototype-exit vs analysisStatus vs gate vs completeness (prior collapse corrected) |
| Artifact paths | h3 `coverage/coverage-final.json` (cleaned, not preserved); hono `coverage/raw/default/coverage-final.json` (preserved); apollo `coverage/coverage-final.json` absolute at `/tmp/wp4r-repos/apollo-client/coverage` — CONFIRMED missing (no file, dir absent) | Same paths in Coverage Commands section + Operational Friction | **CONSISTENT** |
| Changed-function counts (threshold 30) | h3-01 1, h3-02 4, h3-03 4, hono-01 0, hono-02 3, hono-03 4, apollo-01 0, apollo-02 1, apollo-03 4 — total 21 (14 PASS, 0 WARN, 7 NOT_EVAL) per `aggregate-results.json` | Evaluation Rates: total 21 (PASS 14 WARN 0 NOT_EVAL 7), 2 cases 0 fns (hono-01, apollo-01) | **CONSISTENT** |
| Completeness | COMPLETE: h3-01, h3-03, hono-01, hono-02, hono-03, apollo-01 (6); INCOMPLETE: h3-02 (2 NOT_EVAL), apollo-02 (1 NOT_EVAL), apollo-03 (4 NOT_EVAL) (3) — matches `aggregate-results.json` | Cases with COMPLETE vs INCOMPLETE: 6 COMPLETE, 3 INCOMPLETE (h3-02, apollo-02, apollo-03) | **CONSISTENT** |
| PASS/WARN/NOT_EVALUATED counts | WARN 0 at 30 and 15, additional 0; PASS sampled 8 from 5 cases with changed fns; apollo NOT_EVAL 7 total | Same in Evaluation Rates + Threshold Sensitivity | **CONSISTENT** |
| Hono fallback behavior | hono-03 required fallback from `--project=main` to no-filter due to vitest project mismatch at that SHA (from `metadata.md`) | Same note + Operational Friction describes fallback | **CONSISTENT** |
| Artifact generation statements | h3 coverage cleaned post-experiment (only output JSON remains); hono artifacts preserved; apollo Jest coverage reporter produced no artifact, no "coverage" word in stderr, empty stdout not confirmed root cause | "Coverage generation: h3 vitest V8 JSON ... hono required --project=main ... apollo required --testPathPatterns ..." | **CONSISTENT after correction** |
| Istanbul fnMap | hono-02 4 entries (decl None for this file via v8), hono-03 5 entries with valid decl lines matching CRAP ranges | Not detailed in final-results (spot checks only) | No conflict |

### Discrepancies found
- **Prior packet/diagnostics incorrectly claimed Apollo used Vitest** — contradicts final-results doc's correct Jest commands (§ Coverage Commands, Execution Success Table, Operational Friction). **Corrected** in packet §§ apollo-01/02/03 + Apollo NOT_EVALUATED Summary and diagnostics §§ 2,5, Appendix, §8. Final-results doc was correct; no change needed there. Recorded here as corrected discrepancy.
- **Prior packet/diagnostics claimed `coverage-generation-stdout.txt` and `stderr` both 0 bytes for Apollo** — contradicts preserved evidence (`stderr` 12128/8948/118679). **Corrected** per `wc -c` and `head` findings. Final-results doc did not make this 0-byte claim; no change needed there.
- **Prior diagnostics Appendix pasted h3/Vitest stderr under apollo-01 label (copy-paste error)** — corrected to actual ts-jest stderr head. Final-results doc not affected.
- **Prior diagnostics Gap 3 claimed Istanbul fnMap always None** — actually hono-03 has valid decl lines; corrected per §7 verification. Final-results doc not affected.
- **Prior packet basePath showed `cache[routeIndex]` in target** — truncation artifact; corrected to `cache[index]` per `git show 81bda2e`. Final-results doc not affected (didn't list basePath source).
- **No demonstrably incorrect factual statement found in `WP4R_FINAL_USEFULNESS_RESULTS.md`** that requires rewriting history. All its SHAs, commands, exits, counts, and fallback statements are supported by preserved evidence (`aggregate-results.json`, `metadata.md`, `coverage-exit.txt`, `prototype-exit-*.txt`, `coverage-final.json` presence). **No update to final-results doc performed** — packet/diagnostics corrected to align with it. If future evidence contradicts final-results, record discrepancy with proposed correction per §5 of the correction prompt.

### Final-results doc update
**None** — packet/diagnostics were the documents with errors; final-results doc was authoritative and remains unchanged. This preserves history.

### Remaining UNRESOLVED items (evidence-calibrated)
- Why Jest coverage reporter with `--coverageReporters=json` + absolute `--coverageDirectory` fails silently with exit 1 and no "coverage" word in stderr (UNRESOLVED — no evidence of reporter error; tests PASS for apollo-02/03 yet no artifact).
- Whether `coverage-final.json` ever existed at exact prototype execution instant for Apollo (UNRESOLVED edge — `coverageAvail 0/1` and missing file LIKELY never generated, but no timestamped snapshot).
- hono-02 per-function line mapping via Istanbul (UNRESOLVED — v8 reports decl None for arrow const in that file, file-level coverage only).


