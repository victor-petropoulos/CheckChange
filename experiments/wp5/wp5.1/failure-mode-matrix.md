# WP5.1 — Failure-Mode Matrix

Status: DISCOVERY. Stable IDs `FM-<LAYER><NN>`. Layers: DET (git change
detection), CPX (complexity/source selection), COV (coverage ingestion),
ATT (attribution), GEX (rules/gate/exit/diagnostics).

Columns per WP5_1_FAILURE_MODE_INVENTORY_SPEC.md: stable ID, layer,
exact condition, current behavior, desired behavior, result class, gate
impact, exit, diagnostic, existing test, fixture requirement, change
needed, evidence.

Result classes observed in code: EVALUATED, NOT_EVALUATED, INCOMPLETE
(completeness aggregate), HARD_FAILURE (only as analysisStatus FAILED or
thrown→exit 1). Classification tags: `CONFIRMED` (pinned by test or
direct code path), `GAP` (behavior exists but silent/under-diagnosed),
`DEFECT?` (apparent defect; needs confirmation), `OQ` (unresolved design
question). Desired-behavior entries are proposals for the approval gate,
not commitments.

## Detection (DET)

| ID | Condition | Current | Desired | Class | Gate impact | Exit | Diagnostic today | Existing test | Fixture need | Change needed |
|---|---|---|---|---|---|---|---|---|---|---|
| FM-D01 | Changed lines overlap a scanned function | Function correlated & evaluated | Same | EVALUATED / NOT_EVALUATED by coverage | drives rule result | 0 | none needed | git.test.ts intervals; evidence.test.ts correlate; wp4.2 regression | FR-D1 (regression anchor) | none |
| FM-D02 | Changed lines land outside any function (types, imports, comments, module-level statements) | Intervals unmatched silently; function set may be empty → PASS/COMPLETE/SUCCESS | Explicit signal that N changed lines matched no function (new diagnostic field); PASS preserved | GAP (EVALUATED-empty) | none today | 0 today | none | none | FR-D2 | add unmatched-interval accounting (WP5.4 candidate) |
| FM-D03 | Added TS file under src root | All its functions evaluable; full-file interval | Same + explicit "added file" provenance optional | EVALUATED | normal | 0 | none | git.test.ts added-file (interval level only) | FR-D3 | none (provenance optional) |
| FM-D04 | Deleted TS file | newLen=0 → no interval; deletion invisible | Deletion acknowledged in diagnostics (count), not evaluated | GAP | none | 0 | none | git.test.ts deleted-file (interval level) | FR-D4 | diagnostics-only |
| FM-D05 | Renamed file/path | New path keyed; old absent | Same; rename provenance optional | CONFIRMED | normal | 0 | none | git.test.ts rename | FR-D5 | none |
| FM-D06 | All changed files non-TS | UNSUPPORTED, gate null, completeness NOT_APPLICABLE | Same (confirm contract) | CONFIRMED-HARD-ish | null gate | 0 | summary line only | wp4.2.test.ts:306 | FR-G3 | decide exit-code intent (OQ-3) |
| FM-D07 | Mixed TS + non-TS changes | Non-TS files silently ignored; TS analyzed | Capability note listing ignored non-TS paths | GAP | normal (TS side) | 0 | none | none | FR-D6 | diagnostics-only |
| FM-D08 | Binary/no-hunk diff entries | Header creates empty interval list; harmless | Same | CONFIRMED | none | 0 | none | none | fold into FR-D2 corpus | none |
| FM-D09 | Malformed hunk header line | Line skipped silently | Tolerate but count malformed headers in diagnostics | GAP | none | 0 | none | git.test.ts multi-hunk tolerates garbage line | fold into FR-D2 corpus | diagnostics-only |
| FM-D10 | git binary missing (ENOENT → exitCode null) or non-repo or unresolvable base | throw → stderr free text, exit 1; ENOENT case reports "Not a git repository" even if cause is missing binary | Distinguish causes in message | DEFECT?-minor (message accuracy) | n/a (pre-analysis) | 1 | stderr text only | execute.test.ts (ENOENT null only); no CLI-level pin | FR-G4 | message fix candidate |

## Complexity / source selection (CPX)

| ID | Condition | Current | Desired | Class | Gate | Exit | Diagnostic today | Test | Fixture need | Change needed |
|---|---|---|---|---|---|---|---|---|---|---|
| FM-C01 | Any single scanned TS file fails to parse | Whole run UNSUPPORTED (all-or-nothing), empty results | Confirm intended blast radius; consider per-file degradation later (out of WP5 scope unless approved) | CONFIRMED behavior; OQ on scope | null | 0 | none beyond status field | wp4.2 UNSUPPORTED (indirect) | FR-C1 | decision required |
| FM-C02 | Zero functions enumerated (no TS files / no src segment) | SUCCESS/PASS/COMPLETE with empty arrays | Same + explicit "no source roots found" note when repo HAS TS files outside roots | GAP-flavored | PASS | 0 | none | wp4.2.test.ts:355 | FR-C2 | diagnostics-only |
| FM-C03 | Changed TS files exist OUTSIDE any `src` segment (e.g. tools/, scripts/) | Never enumerated → their changes invisible; possible silent PASS while real risk exists | At minimum: capability/diagnostic noting root restriction; ideally detect out-of-root changed TS paths from intervals and report unevaluated | DEFECT?-high (silent blind spot) | can mask WARN | 0 | none | none | FR-C3 | design decision (WP5.3/WP5.4 candidate) |
| FM-C04 | Anonymous arrows / unnamed functions in changed code | Parser skips unnamed declarations (parser.js:100-104 branch read); arrow-expression naming UNVERIFIED | Deterministic naming contract documented; fixtures must reveal actual names | OQ-2 | unknown until fixture | — | — | none | FR-A2 (reveals naming) | document after fixture evidence |

Determinism note: file discovery sorted (fileSelection.js:26,41) →
stable output ordering. Confirmed.

## Coverage ingestion (COV)

| ID | Condition | Current | Desired | Class | Gate | Exit | Diagnostic today | Test | Fixture need | Change needed |
|---|---|---|---|---|---|---|---|---|---|---|
| FM-V01 | Default `coverage/coverage-final.json` absent | available:false,error:false → every changed fn NOT_EVALUATED; completeness INCOMPLETE; capabilities.coverageArtifact still reported `'available'` | Keep NOT_EVALUATED semantics; report coverageArtifact truthfully (e.g. `absent`) + reason | DEFECT?-med (capability mislabel) + GAP (no reason) | PASS possible w/ INCOMPLETE | 0 | none beyond completeness | wp4r2 test 6 (pins 'available' with acknowledging comment) | FR-V1 | truthful capability value (schema-visible change → approval) |
| FM-V02 | Explicit --coverage-file path missing | error:true → FAILED/null-gate/INCOMPLETE; stderr says "coverage artifact malformed" though cause is absence | Keep FAILED; correct stderr wording to include path + cause | DEFECT?-minor (message) | null | 1 | inaccurate text | wp4r2 tests 4,10 | FR-V2 | message fix |
| FM-V03 | Explicit artifact malformed JSON | CoverageReportParseError → same FAILED path as V02 | Same | CONFIRMED | null | 1 | stderr text | wp4r2 test 5 | FR-V3 | none |
| FM-V04 | Valid JSON, wrong shape (entries not Istanbul records) | Entries skipped silently (istanbul.js:16-25) → empty map → looks identical to V01 | Distinguish "artifact present but unusable" from "artifact absent"; surface skip counts | GAP-high (indistinguishable outcomes) | PASS+INCOMPLETE possible | 0 | none | none | FR-V4 | ingestion diagnostics |
| FM-V05 | Artifact `{}` (empty object) | Empty map, no error → all NOT_EVALUATED | Same as V04 treatment | GAP-high | same | 0 | none | none | FR-V5 | ingestion diagnostics |
| FM-V06 | Source file present in project but absent from artifact keys | Fallback null coverage (attribution.ts:154) → NOT_EVALUATED for its functions | Same outcome + per-function unknownReason surfaced | GAP-med | INCOMPLETE | 0 | none | none | FR-V6 | reason surfacing |
| FM-V07 | Duplicate entries normalizing to same path | Merged deterministically (max stmt hits, merged branches, canonical fn) | Same | CONFIRMED | normal | 0 | none | none | FR-V7 (pin merge) | none |
| FM-V08 | Relative vs absolute explicit path | Relative resolves against provided cwd; absolute used as-is | Same | CONFIRMED | normal | 0 | none | wp4r2 test 7 | covered by FR-V2 variants | none |

## Attribution (ATT)

| ID | Condition | Current | Desired | Class | Gate | Exit | Diagnostic today | Test | Fixture need | Change needed |
|---|---|---|---|---|---|---|---|---|---|---|
| FM-A01 | fnMap absent for file (statementMap-only artifact) | bodySpan containment attribution succeeds | Same | CONFIRMED | normal | 0 | none | wp4r2 tests use statementMap-only artifacts | FR-A1 (pin explicitly) | none |
| FM-A02 | Unique fnMap match | Span-based attribution | Same | CONFIRMED | normal | 0 | none | wp4.2 deterministic-attribution | FR-A1 | none |
| FM-A03 | Ambiguous fnMap match (>1 candidates at some strategy) | AMBIGUOUS → null → fnmap_conflict → unavailable → NOT_EVALUATED; lib's unknownReason discarded by src/attribution.ts | Same outcome + expose reason string | GAP (reason dropped) | INCOMPLETE | 0 | none | none | FR-A3 | reason surfacing |
| FM-A04 | AST function absent from non-empty fnMap | Likely conflict → NOT_EVALUATED (strategy chain fails) | Same + reason | GAP | INCOMPLETE | 0 | none | none | FR-A3 variant | reason surfacing |
| FM-A05 | Nested inner function shares statements with outer | Innermost containing method exclusively owns statement; outer excludes them | Document as canonical ownership rule; fixture pins numerics | CONFIRMED-semantics; unpinned numerics | normal | 0 | none | none | FR-A4 | none (documentation) |
| FM-A06 | Overlapping NON-nested method spans | First-index tie-break keeps earliest bestMatch (strict containment required to switch) | Document; fixture pins | EDGE | normal | 0 | none | none | FR-A5 | documentation |
| FM-A07 | Method with containerName ≠ null (class methods, object-literal methods, some nested arrows) | descriptorMap key uses raw `functionName:startLine` (attribution.ts:97) while lookup uses container-qualified `info.method:startLine` (complexity.ts:22-24 → attribution.ts:103) → systematic mismatch → coverage null → NOT_EVALUATED for ALL container methods | Key alignment (use displayName-consistent keys both sides) OR verified lib contract showing functionName already qualified | **DEFECT?-critical** (masked in WP4R: h3 = top-level style; apollo artifacts unusable) | mass INCOMPLETE; real WARNs suppressed | 0 | none | none | **FR-A6 (top priority)** | fix pending WP5.3 proof + approval |
| FM-A08 | Two project files sharing suffix after normalization (e.g. packages/a/src/x.ts vs packages/b/src/x.ts) | Bidirectional endsWith match, first entry wins, break (attribution.ts:62-68) → possible cross-file attribution | Unambiguous path resolution or explicit ambiguity refusal | DEFECT?-low-prob/high-impact | could attribute WRONG file's coverage | 0 | none | none | FR-A7 | fix candidate WP5.3 |
| FM-A09 | stmt% == branch% (non-null) | coverageKind='stmt' arbitrary tie (attribution.ts:127) | Document tie rule | CONFIRMED quirk | kind label only | 0 | none | none | fold into FR-A1 | documentation |
| FM-A10 | coverageForMethods throws for one method | Swallowed → null coverage for that method only | Same + reason captured | GAP | INCOMPLETE | 0 | none | none | fold into FR-A3 | reason surfacing |

## Rules / gate / exit / diagnostics (GEX)

| ID | Condition | Current | Desired | Class | Gate | Exit | Diagnostic today | Test | Fixture need | Change needed |
|---|---|---|---|---|---|---|---|---|---|---|
| FM-G01 | crap null (any cause) | Rule NOT_EVALUATED; completeness INCOMPLETE if any | Same + cause enum per function | CONFIRMED + GAP(cause) | INCOMPLETE | 0 | none | rules.test.ts:58-65 | cross-ref FR-V*/FR-A* | cause surfacing |
| FM-G02 | crap == threshold exactly | PASS (≤ boundary) | Keep (contract; pinned) | CONFIRMED-contract | PASS | 0 | — | rules.test.ts:40-47 | FR-G1 (boundary pin at composed level) | none |
| FM-G03 | High CC + 100% coverage | CRAP=cc ≥31 → WARN despite perfect coverage (SUP-A real case) | Keep (formula is the point) | CONFIRMED-by-design | WARN | 0 | — | none directly (SUP-A evidence) | FR-G2 | none |
| FM-G04 | Gate value space | {PASS, WARN} from rules; null only FAILED/UNSUPPORTED. NO FAIL value exists | Decide whether advisory gate needs FAIL distinct from WARN (probably not — advisory) | CONFIRMED-contract; OQ-4-lite | — | — | — | — | rules/wp4.2 suites | none | decision note only |
| FM-G05 | Status↔exit mapping | SUCCESS→0 (PASS or WARN, COMPLETE or INCOMPLETE); FAILED→1; UNSUPPORTED→0 | Confirm UNSUPPORTED-exit-0 intent; document matrix verbatim | OQ-3 | — | mixed | — | partial (wp4.2 unit-level only; no CLI-level pin) | FR-G3 (CLI-level) | decision + CLI pin |
| FM-G06 | Threshold arg forms/values | parseFloat; finite≥0 else exit 1; `--f=v` and `--f v`; float thresholds accepted (e.g. 29.5) | Pin float acceptance as contract | CONFIRMED | — | 1 on invalid | stderr | none at CLI level! | FR-G4 | none + add pin |
| FM-G07 | Composed-path analyzerStatus | Hardcoded `'passed'` even when coverage null (evidence.ts:216) | Truthful per-function analyzer status or deprecate field in v0.2 docs | DEFECT?-med (honesty) | label only | 0 | none | none | FR-A6 captures it | schema-doc decision |
| FM-G08 | Legacy v0.1 buildOutput + runCrap path | Retained, tested, unused by CLI | Freeze as legacy; no v0.2 drift | CONFIRMED | — | — | — | — | evidence/rules/crap suites | none | none |
| FM-G09 | Historical apollo run: prototype exit 1 with analysisStatus SUCCESS gate PASS (human-review-diagnostics.md:151) | Contradicts current cli.ts mapping (exit 1 ⇔ FAILED) | Reconcile: likely earlier pipeline era or log inaccuracy; do NOT assume current behavior | OQ-5 unresolved | — | ? | — | none | none | none (document-only) | reconcile record note |
| FM-G10 | Output ordering/format | Pretty JSON 2-space (--json); ordering = sorted walk → complexity order → correlate filter; intervals insertion order | Keep; pin ordering in fixture assertions | CONFIRMED | — | 0 | — | indirect | FR-G5 | none |

## Summary counts

- Total modes catalogued: **37** (DET 10, CPX 4, COV 8, ATT 10, GEX 5).
- Apparent defects (need confirmation/approval before any fix):
  FM-A07 (critical, attribution key mismatch), FM-C03 (source-root blind
  spot), FM-A08 (suffix collision), FM-V01 (capability mislabel),
  FM-V02/GEX-FM-D10 (message accuracy), FM-G07 (analyzerStatus honesty).
  Count: **6 defect candidates**.
- Genuine gaps (missing diagnostics/truthfulness, no behavior bug):
  FM-D02, D04, D07, D09, C02, V04, V05, V06, A03, A04, A10, G01-cause.
  Count: **12**.
- Confirmed contracts to preserve: CB/FM set incl. ≤ boundary PASS,
  gate∈{PASS,WARN}, completeness aggregation, explicit-vs-default
  coverage split, non-TS UNSUPPORTED, sorted determinism.
- Open questions: OQ-1 (A07 lib intent), OQ-2 (anonymous naming),
  OQ-3 (UNSUPPORTED exit intent), OQ-4 (diagnostics policy for unmatched
  evidence), OQ-5 (apollo exit-1 anomaly), OQ-6 (V01 capability value
  intent), OQ-7 (source-root algorithm inputs incl. tsconfig interplay).

(End of file - total 113 lines)