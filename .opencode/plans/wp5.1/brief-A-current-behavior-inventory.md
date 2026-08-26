# WP5.1 Brief A — current-behavior-inventory.md

Implementer instruction: create `/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp5/wp5.1/current-behavior-inventory.md` with EXACTLY the markdown body below (everything after the `=====` marker). Do not add, remove, or reword sections. Do not touch any other file.

=====

# WP5.1 — Current Behavior Inventory

Status: DISCOVERY (WP5.1) — describes what IS. No production code was changed.
Date: 2026-08-25. Evidence style: `path:line` against working tree at WP4R closure (`a41d25f`).

## 1. Scope and method

Inventory of the deterministic changed-function CRAP pipeline: git change
detection → function enumeration/complexity → coverage ingestion →
attribution → CRAP → rules/gate → CLI/exit. Sources inspected:

- Production: `src/git.ts`, `src/execute.ts`, `src/attribution.ts`,
  `src/complexity.ts`, `src/crapCalc.ts`, `src/crap.ts`, `src/rules.ts`,
  `src/coverage.ts`, `src/evidence.ts`, `src/cli.ts`.
- Library: `node_modules/@barney-media/crap-typescript-core/dist/*`
  (parser, fileSelection, sourceExclusions, istanbul,
  coverageAttribution, coverageNormalization).
- Tests: `src/*.test.ts`, `test/*.test.ts` (7 suites).
- Frozen evidence: `experiments/wp4r-final/WP4R_CLOSURE.md`,
  `WP4R_EVIDENCE_MANIFEST.md`,
  `experiments/wp4r-final/human-review-diagnostics.md`,
  `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md`.

Method: direct source reading; library behavior read from shipped
`dist/*.js`; behavior cross-checked against pinned tests and preserved
WP4R outputs (`sup-a/output-threshold-30.json` re-parsed during discovery).
No LLM inference used to fill missing evidence; unknowns are recorded as
unresolved questions (see `WP5_1_FINDINGS.md` §6).

## 2. Module map

| Module | Role | Key facts |
|---|---|---|
| `src/execute.ts` | child_process wrapper | ENOENT → `exitCode: null`; timeout flag; never rejects (execute.ts:22-70) |
| `src/git.ts` | changed-line intervals | `git diff --unified=0 <resolvedBase>` vs working tree; intervals 1-based inclusive per file keyed by `b/<path>`; deletions (`newLen=0`) produce no interval (git.ts:40-94) |
| `src/complexity.ts` | function enumeration + CC | lib `parseFileMethods` over files found by `findAllTypeScriptFilesUnderSourceRoots`; method name = `containerName.functionName` when container exists else raw name; any parse failure throws for the whole run (complexity.ts:12-41) |
| `src/coverage.ts` | artifact ingestion | explicit `--coverage-file` or default `coverage/coverage-final.json`; explicit-missing → `{available:true,error:true}`; default-missing → `{available:false,error:false}`; parse throw → `{available:true,error:true}` (coverage.ts:11-41) |
| `src/attribution.ts` | coverage→function attach | suffix path match (both directions, first match wins); descriptor key = raw `functionName:startLine`; lookup key = container-qualified `method:startLine`; per-method errors swallowed to null (attribution.ts:56-162) |
| `src/crapCalc.ts` | CRAP formula | `cc²·(1−cov)³ + cc`; `null` coverage → `null` (crapCalc.ts:1-8) |
| `src/crap.ts` | legacy analyzer runner | shells out to `npx crap-typescript --format json`; parses `methods[]`; kept with tests; NOT used by current CLI path (crap.ts:28-81) |
| `src/rules.ts` | advisory rule | single rule `changed-function-high-crap`: `crap===null→NOT_EVALUATED`; `crap<=threshold→PASS`; else `WARN` (rules.ts:20-57) |
| `src/evidence.ts` | composition | orchestrates steps 1-7, builds schemaVersion 0.2 envelope; status matrix FAILED/UNSUPPORTED/SUCCESS (evidence.ts:92-304); also retains legacy sync `buildOutput` schema 0.1 (evidence.ts:60-83) |
| `src/cli.ts` | arg parsing + exit codes | commands: exactly one positional `check`; flags `--base` (required), `--json`, `--crap-threshold` (default 30), `--coverage-file`; exit 0 except arg errors / git errors / `analysisStatus==='FAILED'` (cli.ts:9-135) |

Artifacts present but inert: `src/cli.ts.backup`, `src/evidence.ts.backup`
(stale WP4-era copies of an earlier runCrap-based pipeline; no runtime
references — grep found none outside themselves). Recorded so WP5.2 does
not mistake them for behavior.

## 3. Pipeline walkthrough (composed path used by CLI)

1. **CLI parse** (cli.ts:9-101): `check` positional required; `--base`
   required; threshold parsed via `parseFloat`, must be finite ≥ 0;
   `--flag value` and `--flag=value` both accepted; unknown `-`-prefixed
   option → error exit 1; `--help` → usage exit 0.
2. **Git** (cli.ts:109-113): validate repo (`git rev-parse --git-dir`),
   resolve base (`rev-parse --verify <base>^{commit}`), diff
   `git diff --unified=0 <sha>`. Any failure throws → caught in main →
   stderr `Error: <message>` → exit 1.
3. **Intervals** (git.ts:40-77): file header regex takes the `b/` side;
   hunk header `@@ -o[,ol] +n[,nl] @@`; `nl=0` (pure deletion) skipped;
   omitted length defaults to 1. Malformed hunk lines ignored silently.
   Empty diff → empty map.
4. **Complexity** (evidence.ts:97-107 → complexity.ts): enumerate all TS
   files under "source roots"; parse each with lib parser; any file parse
   failure → whole-run `complexityCapability='failed'` → early return
   UNSUPPORTED (evidence.ts:164-189). File selection is sorted and
   deterministic (fileSelection.js:26,41). Selection accepts only paths
   containing a `src` segment (fileSelection.js:106,146,185) and honors
   tsconfig include (test comment wp4r2-coverage-file.test.ts:15).
5. **Non-TS guard** (evidence.ts:109-142): if intervals non-empty and NO
   interval path ends `.ts`/`.tsx` → return UNSUPPORTED, gate `null`,
   completeness `NOT_APPLICABLE`. CLI exits **0**.
6. **Coverage read** (evidence.ts:143-156): see module map. On
   `error:true` → `analysisStatus='FAILED'`, gate `null`, completeness
   `INCOMPLETE`, exit 1 with stderr `Error: coverage artifact malformed`
   regardless of whether cause was malformed JSON or a missing explicit
   file (cli.ts:124-127).
7. **Attribution** (evidence.ts:197-209 → attribution.ts):
   - coverage map keys are normalized absolute paths; complexity keys are
     cwd-relative; match by bidirectional suffix compare, first hit wins,
     break (attribution.ts:59-70).
   - per covered file: parse methods once (cache); descriptor map keyed
     `${descriptor.functionName}:${descriptor.startLine}` (attribution.ts:95-99);
     lookup keyed `${info.method}:${info.lineStart}` where `info.method`
     is container-qualified (attribution.ts:102-104).
   - lib matching per method (coverageAttribution.js:44-73): strategy
     chain exact-span → line-aligned boundary → containing span →
     declaration line+name; any AMBIGUOUS outcome (>1 candidate) resolves
     to null → `fnMapConflict=true`; empty fnMap → bodySpan fallback
     (coverageAttribution.js:29-35).
   - statement/branch ownership: innermost containing method
     (isPreferredMethod, coverageAttribution.js:113-115); overlapping
     non-nested spans keep first index.
   - `fnmap_conflict` / `file_unmatched` reasons are computed by the lib
     (coverageNormalization.js unavailableMethodCoverage) but **discarded**
     by src/attribution.ts — only percent survives.
   - coverageKind: stmt<branch → 'stmt'; branch<stmt → 'branch'; equal →
     'stmt' (arbitrary tie-break, attribution.ts:114-128); both null → null.
   - any throw inside per-method attribution swallowed → null
     (attribution.ts:137-141).
8. **CRAP** (evidence.ts:211-221 →crapCalc.ts): `cc²(1−cov/100)³+cc`;
   null coverage → null CRAP. `analyzerStatus` is hardcoded `'passed'`
   in this path (evidence.ts:216); `source` hardcoded to
   `@barney-media/crap-typescript-core 0.5.0`.
9. **Correlate** (evidence.ts:21-56): method counted changed iff any
   interval overlaps `[lineStart,lineEnd]` in same file key. Changed
   lines that fall in no function are simply never matched — no signal
   is emitted about them. Deletions never appear (no intervals).
10. **Rules/gate/completeness** (rules.ts:20-57, evidence.ts:241-246):
    per-function PASS/WARN/NOT_EVALUATED; gate = WARN if any WARN else
    PASS; completeness = INCOMPLETE if any NOT_EVALUATED else COMPLETE.
    There is **no FAIL rule result and no FAIL gate value** anywhere in
    the schema.
11. **Envelope** (evidence.ts:261-280): schemaVersion `'0.2'`, analysis
    `{base,target:'current'}`, capabilities `{git,complexity,
    coverageArtifact}`, changedFunctions, policy `{crapThreshold}`,
    ruleResults, analysisStatus ∈ {SUCCESS,FAILED,UNSUPPORTED}, gate
    ∈ {PASS,WARN,null}, completeness ∈ {COMPLETE,INCOMPLETE,NOT_APPLICABLE}.
    Printed pretty (2-space) only with `--json`; otherwise one summary
    line. Exit 0 unless FAILED (exit 1) or earlier thrown error (exit 1).

## 4. Data schemas (as implemented)

```
ChangedFunction { file, method, lineStart, lineEnd, cc, crap:number|null,
                  coverage:number|null, coverageKind:string,
                  analyzerStatus:'passed'|'failed'|'skipped',
                  source:{tool,version} }            // evidence.ts:8-19
RuleResult      { ruleId:'changed-function-high-crap',
                  result:'PASS'|'WARN'|'NOT_EVALUATED', file, method,
                  crap, threshold, cc, coverage }     // rules.ts:3-12
OutputJson(v0.2){ schemaVersion, analysis{base,target}, capabilities,
                  changedFunctions[], policy{crapThreshold}, ruleResults[],
                  analysisStatus, gate, completeness } // evidence.ts:261-280
CoverageResult  { available:boolean, coverageMap:Map|null, error:boolean }
GitChangeIntervals { intervals:Map<string,{start,end}[]>, rawDiff:string }
```

Legacy v0.1 envelope from `buildOutput` (capabilities keys
`git`,`crapTypescript`) remains exported and pinned by WP3-era tests
(evidence.test.ts:172-231, rules.test.ts:88-116).

## 5. Confirmed behaviors (selected, full matrix in failure-mode-matrix.md)

| ID | Condition | Current behavior | Evidence |
|---|---|---|---|
| CB-01 | Changed lines overlap a scanned function | Function reported; numeric CC always; CRAP per coverage | evidence.ts:33-53 |
| CB-02 | `crap <= threshold` (equality included) | PASS | rules.ts:33; rules.test.ts:40-47 |
| CB-03 | Any WARN among changed | gate WARN | rules.test.ts:88-97 |
| CB-04 | Any NOT_EVALUATED among changed | completeness INCOMPLETE; exit still 0 | rules.test.ts:99-108; cli.ts:128 |
| CB-05 | No changed functions at all | gate PASS, completeness COMPLETE, SUCCESS | rules.test.ts:110-116; wp4.2.test.ts:200 |
| CB-06 | Default coverage absent | available:false,error:false → all changed NOT_EVALUATED, INCOMPLETE, coverageArtifact reported 'available' | coverage.ts:28-31; evidence.ts:143-156; wp4r2 test 6 |
| CB-07 | Explicit coverage missing/malformed | FAILED/null/INCOMPLETE, exit 1 | wp4r2 tests 4,5,10 |
| CB-08 | Coverage valid JSON but non-Istanbul/empty `{}` | entries silently skipped → empty map → behaves like CB-06 (no error raised) | istanbul.js:16-25 |
| CB-09 | Non-TS-only changes | UNSUPPORTED/null gate/NOT_APPLICABLE, exit 0 | evidence.ts:121-142; wp4.2.test.ts:306 |
| CB-10 | Any scanned TS file fails to parse | whole run UNSUPPORTED | complexity.ts:34-37; evidence.ts:102-107,164-189 |
| CB-11 | Deleted file in diff | no interval; deletion invisible to output | git.ts:64-71; git.test.ts:75-90 |
| CB-12 | Renamed file | new path keyed | git.test.ts:62-73 |
| CB-13 | fnMap absent for file | statements attributed by bodySpan containment | coverageAttribution.js:29-35 |
| CB-14 | Ambiguous fnMap match | fnmap_conflict → coverage null → NOT_EVALUATED | coverageAttribution.js:74-82,150-165 |
| CB-15 | Nested function | statement owned by innermost containing method only | coverageAttribution.js:113-115 |
| CB-16 | coverage 100% & cc≥31 | CRAP=cc → WARN at default 30 despite perfect coverage | crapCalc.ts:5-7; WP4R_CLOSURE.md:16 (SUP-A) |
| CB-17 | File walk order | sorted → deterministic output ordering | fileSelection.js:26,41 |

## 6. Existing test coverage map

| Suite | Pins |
|---|---|
| src/git.test.ts (7) | interval parse: single/multi hunk, default len, rename→new path, delete→empty, add→full, empty diff |
| src/crap.test.ts (5) | legacy JSON parse incl. covKind N/A, invalid JSON → [], missing fields → undefined cc |
| src/execute.test.ts (2) | simple exec, ENOENT → exitCode null |
| test/evidence.test.ts (8) | correlate overlap/name-independence/non-overlap/different-file/skip; buildOutput v0.1 shape + capability overrides |
| test/rules.test.ts (10) | PASS boundary ≤, WARN >, NOT_EVALUATED null, threshold variation, gate/completeness aggregation, empty set, threshold 0 |
| test/wp4.2.test.ts (20) | composed path: parser range+CC, valid artifact, absent→null, malformed→FAILED, deterministic attribution, unknown→null, CRAP arithmetic, zero-cov/zero-CRAP, full status matrix incl UNSUPPORTED + no-TS-functions, threshold override, git-correlation regression |
| test/wp4r2-coverage-file.test.ts (10) | --coverage-file semantics: rel/abs/nested paths OK, explicit missing→FAILED (no fallback to default), malformed→FAILED, default-missing→SUCCESS/PASS/INCOMPLETE, cwd-relative resolution, no-change case |

Unpinned areas (feed fixture list): container-method attribution,
anonymous arrows, nested ownership numerics, suffix-collision paths,
non-Istanbul-but-valid JSON, empty `{}` artifact, unmatched-interval
diagnostics (none exist), deleted-file visibility, mixed TS/non-TS runs,
threshold float forms at CLI level, UNSUPPORTED exit code at CLI level.

## 7. Result-class mapping (per WP5.1 spec)

The four candidate classes exist today as:
- EVALUATED → ruleResult PASS|WARN with numeric crap.
- NOT_EVALUATED → ruleResult NOT_EVALUATED (crap null).
- INCOMPLETE → envelope completeness INCOMPLETE (aggregate of any
  NOT_EVALUATED) — also reused as completeness on FAILED.
- HARD_FAILURE → no first-class representation; realized only as
  analysisStatus FAILED (coverage provider) or thrown errors caught in
  cli.ts main → exit 1 with free-text stderr.

## 8. Reconciliation with frozen WP4R observations

| WP4R record | Matrix link |
|---|---|
| 7/21 NOT_EVALUATED in original rerun; two cases zero detected functions (WP4R_CLOSURE.md:35) | FM-D02, FM-V01, FM-C02 |
| SUP-A CC=36, 100% stmt cov, CRAP=36 → WARN at 30 and 15 (WP4R_CLOSURE.md:16) | FM-G03 (CB-16) |
| Apollo Jest reporter produced no usable artifacts (WP4R_CLOSURE.md:34; human-review-diagnostics.md:146-221) | context for why FM-A07 remained invisible |
| Diagnostics note: prototype exit 1 while analysisStatus SUCCESS gate PASS (human-review-diagnostics.md:151) | unresolved OQ-5 (contradicts current cli.ts:124-133 mapping) |
| Threshold 15 useful once; not universal; 30 stays default (WP4R_CLOSURE.md:26-28,54) | respected; no thresholds touched in WP5.1 |
| Gate evaluates ALL changed functions per commit (SUPPLEMENTAL_RESULTS.md:52,55) | scoping constraint carried into fixture design |
