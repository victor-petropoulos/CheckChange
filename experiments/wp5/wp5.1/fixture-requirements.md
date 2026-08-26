# WP5.1 — Fixture Requirements

Status: SPECIFICATION (WP5.1) — defines what WP5.2 must build, not
building it. No fixture code exists yet. All fixtures are synthetic;
no external repos, no network, no LCOV, no npx. Each fixture is a
self-contained tmp directory with tsconfig.json, src/*.ts files, and
optional coverage-final.json. Fixture invocation is direct
`buildEvidenceOutput()` or targeted unit functions; never CLI subprocess.

Design constraint from WP4R (SUPPLEMENTAL_RESULTS.md:52):
the gate evaluates ALL changed functions per commit. Each fixture
simulates a full-commit change; assertion scope is the entire output
envelope, not cherry-picked functions.

Traceability: every FR-xxx traces to one or more FM-xxx IDs from the
failure-mode matrix.

Priority tiers: P0 = covers apparent defect (must pass before WP5.2
acceptance); P1 = covers gap/edge unpinned by existing tests;
P2 = covers confirmed behavior regression anchor.

---

## Tier P0 — Apparent defect coverage

### FR-A6 — Container-method attribution mismatch (FM-A07)

**Target failure mode:** FM-A07, FM-A10
**Description:** Class with method body that overlaps changed intervals.
Coverage artifact contains Istanbul entries for the class file. Assert
that the class method receives numeric coverage (not null), confirming
descriptor-key alignment. If FM-A07 is confirmed defect, this fixture
must FAIL against current code before any fix.

**Fixture sketch:**
- `src/cls.ts`: class `Foo { bar() { return 1; } baz() { if(true) return 2; else return 3; } }`
- Intervals: entire file `[1, end]`.
- Coverage: full statement coverage for `src/cls.ts`.

**Expected (desired):** `bar` coverage numeric, `baz` coverage numeric,
CRAP computed, gate PASS or WARN per threshold.
**Expected (current broken):** both coverage null → NOT_EVALUATED →
INCOMPLETE despite artifact present.

---

### FR-A7 — Suffix-collision path attribution (FM-A08)

**Target:** FM-A08
**Description:** Two distinct files whose relative paths share the same
suffix after normalization (e.g. `packages/core/src/index.ts` and
`packages/util/src/index.ts`). Each has a function with overlapping
changed intervals. Coverage map has both paths. Assert each function
gets coverage from its own file, not the other's.

**Fixture sketch:**
- `packages/core/src/index.ts`: `export function alpha() { return 1; }`
- `packages/util/src/index.ts`: `export function beta() { return 2; }`
- Coverage entries for both normalized paths; each has 1 statement with 1 hit.
- Intervals cover both files.

**Expected:** alpha coverage from core file; beta coverage from util file.
Cross-file attribution would be a defect.

---

### FR-V1 — Default missing → capability truthfulness (FM-V01)

**Target:** FM-V01
**Description:** No coverage artifact on disk. Assert
capabilities.coverageArtifact ≠ `'available'` (desired) or at minimum
assert current behavior is pinned for comparison.

**Fixture sketch:**
- `src/simple.ts`: one function; interval covers it; no coverage file.
- Invoke with no `--coverage-file`.

**Expected (current):** coverageArtifact=`'available'`, all changed NOT_EVALUATED.
**Expected (desired):** coverageArtifact=`'absent'` or equivalent.

---

### FR-G3 — UNSUPPORTED exit code (FM-G05 / FM-D06)

**Target:** FM-G05, FM-D06
**Description:** CLI invocation with all non-TS changes. Assert exit
code. Currently exits 0; decision required whether this is correct.

**Fixture sketch:** non-TS intervals only (e.g. `src/config.json` changed).
No src/*.ts files at all, or only non-TS intervals passed.

**Expected (current):** exit 0, analysisStatus UNSUPPORTED.
**Expected (desired):** TBD at approval gate.

---

## Tier P1 — Gap/edge coverage

### FR-D2 — Unmatched intervals diagnostic (FM-D02)

**Target:** FM-D02
**Description:** Changed lines that fall in no function body (e.g. import
block, type declaration, blank line inside a file that has functions).
Assert: changed functions list excludes them AND no diagnostic currently
signals the gap (pin for future diagnostic work).

**Fixture sketch:**
- `src/mixed.ts`: lines 1-5 are imports/types; line 10-15 is `export function f() { ... }`.
- Intervals cover lines 1-15.

**Expected:** `f` appears in changedFunctions; no signal about lines 1-9.

---

### FR-D4 — Deleted-file invisibility (FM-D04)

**Target:** FM-D04
**Description:** Deleted file produces interval `[]` (empty) for the file
key. Assert file key exists in intervals map but contributes nothing to
changedFunctions.

**Fixture sketch:** Manually construct intervals map with
`['src/deleted.ts'] → []` + a normal interval in another file.

**Expected:** deleted file absent from changedFunctions; other file present.

---

### FR-D6 — Mixed TS/non-TS changes (FM-D07)

**Target:** FM-D07
**Description:** Intervals contain both `.ts` and `.json` files. Assert
only `.ts`-derived functions appear in changedFunctions; `.json` changes
silently ignored.

**Fixture sketch:**
- Intervals: `src/ok.ts → [{1,5}]` + `config.json → [{1,3}]`.
- `src/ok.ts` has a function spanning lines 1-5.

**Expected:** ok.ts function present; no reference to config.json.

---

### FR-V4 — Non-Istanbul valid JSON artifact (FM-V04)

**Target:** FM-V04, FM-V05
**Description:** Coverage artifact is valid JSON but entries are not
Istanbul-shaped (e.g. `{ "src/x.ts": { "random": true } }` or `{}`).
Assert: analysisStatus SUCCESS (not FAILED), gate PASS, completeness
INCOMPLETE — identical to "no artifact" — pin the indistinguishable
outcomes.

**Fixture sketch:** coverage-final.json containing `{ "src/fixture.ts": { "notIstanbul": true } }`.

**Expected:** same as FM-V01 (all NOT_EVALUATED, INCOMPLETE, no error).

---

### FR-V6 — Source absent from coverage map (FM-V06)

**Target:** FM-V06
**Description:** Coverage artifact exists and is valid Istanbul, but does
not include the changed source file. Assert that the changed function
gets null coverage → NOT_EVALUATED while other files in the artifact
are parsed correctly.

**Fixture sketch:**
- `src/covered.ts`: function with full statement coverage in artifact.
- `src/uncovered.ts`: function changed but absent from artifact keys.
- Intervals cover both files.

**Expected:** covered.ts function has numeric coverage; uncovered.ts function has null → NOT_EVALUATED.

---

### FR-A3 — fnMap ambiguity (FM-A03, FM-A04)

**Target:** FM-A03, FM-A04
**Description:** Construct a coverage artifact where Istanbul fnMap
contains two entries whose spans both match the same method's bodySpan
by containment. Assert: attribution returns null coverage for that
method → NOT_EVALUATED (fnmap_conflict).

**Fixture sketch:**
- `src/dup.ts`: one function at lines 5-10.
- Coverage fnMap: two entries both covering lines 5-10 (ambiguous).
- statementMap has 1 hit for lines 5-10.

**Expected:** function coverage null (conflict).

---

### FR-A4 — Nested function ownership (FM-A05)

**Target:** FM-A05
**Description:** Outer function contains an inner function. StatementMap
has statements overlapping both. Assert inner function exclusively owns
inner statements; outer function gets remaining statements.

**Fixture sketch:**
- `src/nest.ts`:
  ```
  export function outer() {          // lines 1-8
    const inner = () => { return 1; } // lines 2-4
    return inner() + 2;              // line 6
  }
  ```
- Coverage: all statements hit.

**Expected:** inner function has coverage from lines 2-4 region; outer
function has coverage from lines 1,6,8 region. Numeric values differ.

---

### FR-A5 — Overlapping non-nested spans (FM-A06)

**Target:** FM-A06
**Description:** Two functions with overlapping but non-nesting spans
(e.g. function A lines 1-20, function B lines 10-30). Statement at line
15 overlaps both. Assert first-index tie-break: A owns line 15.

**Fixture sketch:**
- `src/overlap.ts`: function A and function B as above.
- Coverage: single statement at line 15 with 1 hit.

**Expected:** A gets coverage from line 15; B does not.

---

### FR-V7 — Duplicate Istanbul entries same path (FM-V07)

**Target:** FM-V07
**Description:** Coverage artifact has two top-level keys normalizing to
the same path (e.g. relative vs absolute). Assert entries are merged
deterministically and output has one function entry per unique function.

**Fixture sketch:** Two keys in coverage-final.json both resolve to same
`src/fix.ts`; each has statementMap; one has higher hits.

**Expected:** merged coverage, max hits for statement at same span.

---

## Tier P2 — Regression anchors

### FR-D1 — Basic in-function change (FM-D01)

**Target:** FM-D01
**Description:** Single TS file, single function, single interval fully
inside function. Full coverage. Assert complete happy path:
coverage numeric, CRAP computed, PASS, COMPLETE, SUCCESS.

**Fixture sketch:** `src/a.ts: export function f() { return 1; }` + full coverage.

**Expected:** PASS, COMPLETE, SUCCESS, f has numeric coverage and CRAP.

---

### FR-D3 — Added file (FM-D03)

**Target:** FM-D03
**Description:** Newly added file with functions. Interval covers entire
file. Assert all functions are evaluable.

**Fixture sketch:** new file `src/new.ts` with two functions; full coverage.

**Expected:** Both functions evaluated, numeric coverage, PASS or WARN.

---

### FR-D5 — Renamed path (FM-D05)

**Target:** FM-D05
**Description:** Intervals keyed to a new path. Complexity scans working
tree (new name). Coverage keyed to new path. Assert attribution succeeds
under new name.

**Fixture sketch:** intervals `src/newname.ts → [{1,20}]`; src has
`src/newname.ts` with a function; coverage keyed to same path.

**Expected:** function evaluated normally.

---

### FR-C1 — Parse failure blast radius (FM-C01)

**Target:** FM-C01
**Description:** One TS file has invalid syntax; one is valid. Assert
entire run becomes UNSUPPORTED (all-or-nothing), not just the bad file.

**Fixture sketch:**
- `src/good.ts`: valid function.
- `src/bad.ts`: `function {{{ invalid`.
- Intervals cover good.ts only.

**Expected:** analysisStatus UNSUPPORTED, gate null, completeness
NOT_APPLICABLE (even though only bad.ts is broken).

---

### FR-C2 — Zero functions / no src root (FM-C02)

**Target:** FM-C02
**Description:** No `src` segment directories, or src exists but has no
TS files. Assert SUCCESS/PASS/COMPLETE with empty changedFunctions.

**Fixture sketch:** tmpDir with tsconfig but no `src/` dir; empty intervals.

**Expected:** SUCCESS, gate PASS, completeness COMPLETE, changedFunctions [].

---

### FR-C3 — Changed TS outside src root (FM-C03)

**Target:** FM-C03
**Description:** TS file changed but lives outside any `src` segment
(e.g. `tools/check.ts`). Intervals reference it. Assert: file never
enumerated by complexity → function absent from correlate → no signal.

**Fixture sketch:**
- `tools/check.ts`: function spanning lines 1-5.
- `src/ok.ts`: function spanning lines 1-5.
- Intervals: both files.

**Expected:** ok.ts function present; tools/check.ts function absent
(blind spot). Pin current behavior for WP5.3 design decision.

---

### FR-G1 — Threshold boundary at composed level (FM-G02)

**Target:** FM-G02
**Description:** Full pipeline invocation (buildEvidenceOutput) with
CRAP exactly equal to threshold. Assert PASS rule result and overall PASS
gate. Regression anchor for the ≤ contract.

**Fixture sketch:** construct coverage such that calculated CRAP = 30.0
exactly.

**Expected:** PASS.

---

### FR-G2 — High CC + 100% coverage → WARN (FM-G03)

**Target:** FM-G03
**Description:** Function with CC=35, full coverage. CRAP = 35.
At threshold 30, assert WARN. Replicates SUP-A real-world finding.

**Fixture sketch:**
- `src/cc35.ts`: function with 34 decision points (CC=35) via nested
  ifs/ternaries; full statement and branch coverage in artifact.

**Expected:** gate WARN, CRAP=35, coverage 100%.

---

### FR-G4 — CLI threshold argument forms (FM-G06)

**Target:** FM-G06
**Description:** CLI-level test (spawn process) with various threshold
forms: `--crap-threshold 30`, `--crap-threshold=30`, `--crap-threshold
29.5`, `--crap-threshold -1` (error), `--crap-threshold abc` (error).

**Fixture sketch:** mock intervals + coverage; spawn CLI with each form.

**Expected:** valid forms parse correctly; invalid forms → exit 1.

---

### FR-G5 — Output format determinism (FM-G10)

**Target:** FM-G10
**Description:** Run same fixture twice; assert JSON output identical
(string-equal).

**Fixture sketch:** reuse FR-D1.

**Expected:** byte-identical output.

---

## Fixture count summary

| Tier | Count | FR IDs |
|---|---|---|
| P0 (defect coverage) | 4 | FR-A6, FR-A7, FR-V1, FR-G3 |
| P1 (gap/edge) | 9 | FR-D2, FR-D4, FR-D6, FR-V4, FR-V6, FR-A3, FR-A4, FR-A5, FR-V7 |
| P2 (regression) | 10 | FR-D1, FR-D3, FR-D5, FR-C1, FR-C2, FR-C3, FR-G1, FR-G2, FR-G4, FR-G5 |
| **Total** | **23** | |

## Implementation notes for WP5.2

- All fixtures use `buildEvidenceOutput()` directly (from `../src/evidence.js`)
  unless testing CLI exit codes (FR-G4), which spawns
  `node dist/cli.js check ...`.
- Coverage artifacts are hand-crafted Istanbul JSON (statementMap + s,
  optionally fnMap + f, branchMap + b).
- Each fixture creates a tmpDir with tsconfig.json + src/*.ts + optional
  coverage dir. Cleanup in afterEach.
- Assertions cover full envelope: analysisStatus, gate, completeness,
  changedFunctions count, per-function coverage/crap/analyzerStatus.
- P0 fixtures that FAIL current code must be marked with
  `// WP5.1 TODO: EXPECTED TO FAIL — defect FM-A07 confirmed` etc.
  and skipped with `test.skip` until fix in WP5.3/5.4, then unskipped.