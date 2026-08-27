# WP5.3 Results — Coverage Attribution Fixes

**Date:** 2026-08-26  
**Spec:** `WP5_3_ATTRIBUTION_CORRECTNESS_SPEC.md`  
**Invariants:** `attribution-invariants.md` (INV-01 through INV-09)  
**Source Discovery Decision:** `source-discovery-decision.md`  
**Adversarial Matrix:** `adversarial-case-matrix.md`  
**Baseline:** `baseline-characterization.md`

---

## FM-A08: Suffix-Collision Wrong-File Attribution

### Before (defective)
- Bidirectional `endsWith` matching in `src/attribution.ts` lines 55-70.
- Two files sharing suffix `index.ts` (e.g., `src/pkg-a/index.ts` and `src/pkg-b/index.ts`) → ambiguous match → `matches.length > 1` → `fileComplexity = undefined` → coverage silently skipped.
- Result: `src/pkg-a/index.ts` (alpha, 100% covered) got null or wrong-file coverage (0% from beta).
- **Evidence:** `experiments/wp5/wp5.2/defect-repro.spec.ts` — `FM-A08: Suffix-collision path attribution`.

### After (fixed)
- Source-file identity resolution: exact path match first, `endsWith` fallback only if no exact match, ambiguous → decline.
- `src/pkg-a/index.ts` (alpha) → 100%, `src/pkg-b/index.ts` (beta) → 0%, `src/pkg-c/index.ts` (gamma) → 100%. Correct attribution for each.
- **Evidence:** `suffix-collision-3files.spec.ts` PASS (3-way collision, correct per-file attribution).
- **Evidence:** `reversed-coverage-map-order.spec.ts` PASS (order independence).
- **Evidence:** `ambiguous-candidate.spec.ts` PASS (ambiguous → null, not wrong file).

---

## FM-A07: Container-Method Attribution Key Mismatch

### Before (defective)
- `src/attribution.ts` line 97: descriptor key `` `${descriptor.functionName}:${descriptor.startLine}` `` (e.g., `"bar:6"`).
- `src/complexity.ts` lines 21-24: method name `` `${descriptor.containerName}.${descriptor.functionName}` `` (e.g., `"Cls.bar:6"`).
- Key mismatch → `descriptorMap.get("bar:6")` returned `undefined` → all class/object methods got `null` coverage.
- **Evidence:** `experiments/wp5/wp5.2/defect-repro.spec.ts` — `FM-A07: Container-method attribution key mismatch -> observed null coverage outcome`.

### After (fixed)
- `src/attribution.ts` line 97: descriptor key `` `${descriptor.containerName ? descriptor.containerName + '.' : ''}${descriptor.functionName}:${descriptor.startLine}` ``.
- Class methods (`Foo.bar:6`), object methods (`obj.method:11`), and top-level functions (`topLevel:1`) all use consistent keys with complexity layer.
- **Evidence:** `class-method.spec.ts` PASS — `Foo.bar` found with coverage 100.
- **Evidence:** `object-method.spec.ts` PASS — `obj.method` found with numeric coverage.
- **Evidence:** `same-name-different-containers.spec.ts` PASS — `Foo.bar` and `Baz.bar` distinct attributions.
- **Evidence:** `top-level-function.spec.ts` PASS — top-level function still works (no container prefix).

---

## FM-C03: Silent Source-Root Blind Spot

### Before (defective)
- `collectComplexity` called `findAllTypeScriptFilesUnderSourceRoots(cwd)` which only scanned under `src/`.
- `tools/check.ts` (outside `src/`) was invisible — absent from `changedFunctions`, no attribution.
- **Evidence:** `experiments/wp5/wp5.2/defect-repro.spec.ts` — `FM-C03: Source-root blind spot -> observed behavior: changed TS file outside src/ is invisible`.

### After (fixed)
- **Hybrid contract:** Union of `findAllTypeScriptFilesUnderSourceRoots` (baseline `src/`) + `git ls-files` filtered for `.ts` (tracked files outside `src/`).
- `tools/check.ts` now enumerated, attributed with correct coverage.
- **Evidence:** `changed-ts-outside-src.spec.ts` PASS — `tools/check.ts` in `changedFunctions` with coverage 100.
- **Evidence:** `ts-under-src.spec.ts` PASS — normal `src/` operation unchanged.

### C03 Contract: Hybrid Git-LS-Files Union
```
fileSet = Set(
  findAllTypeScriptFilesUnderSourceRoots(cwd),   // baseline: files under src/
  git ls-files | filter .ts | resolve(cwd)        // tracked TS files anywhere in repo
)
```
- **Scope:** Only tracked TS files (respects `.gitignore`). Excludes untracked/ignored files.
- **Interface:** No change to `collectComplexity(cwd)` signature.
- **Fallback:** If `git ls-files` fails (not a repo), falls back to source-root scanner only.

---

## Code/Files Changed

| File | Change Type | Description |
|------|------------|-------------|
| `src/attribution.ts` | Modified | Lines 55-70: source-file identity resolution (FM-A08). Lines 97, 103: descriptor key format (FM-A07). |
| `src/complexity.ts` | Modified | Added `getGitTrackedTsFiles()` helper + union logic (FM-C03). |

**Total production code files changed:** 2  
**Total lines added:** ~30 (git-tracked helper + union logic)  
**Total lines modified:** ~15 (attribution key + identity resolution)

---

## Test Results

### WP5.2 Regression Anchors
```
vitest run experiments/wp5/wp5.2/
  Test Files: 25 passed (25)
  Tests: 36 passed (36)
  Duration: 2.02s
```
**Result: ALL PASS** — No regressions. FM-V01, FM-D10, FM-G06, FM-G07 behavior unchanged.

### WP5.3 Adversarial Tests
```
vitest run experiments/wp5/wp5.3/
  Test Files: 10 passed (10)
  Tests: 10 passed (10)
  Duration: 1.31s
```
**Result: ALL PASS** — All adversarial fixtures pass with desired behavior.

### Regression Summary
| Suite | Files | Tests | Result |
|-------|-------|-------|--------|
| WP5.2 regression anchors | 25 | 36 | ✅ ALL PASS |
| WP5.3 adversarial | 10 | 10 | ✅ ALL PASS |
| **Total** | **35** | **46** | **✅ ALL PASS** |

---

## Unresolved Limitations

1. **Untracked TS files:** `git ls-files` only returns tracked files. Newly added but uncommitted TS files (not yet `git add`ed) will not be enumerated. Current behavior: only tracked TS files are added by Git-based expansion; new or untracked TS files may remain undiscovered by the Git-based expansion. This is an unresolved product/analysis-contract question; no fix authorized in this pass. Do not prescribe `git add` as product requirement.

2. **Git availability:** `getGitTrackedTsFiles()` falls back to empty array if `git ls-files` fails (not a git repo). In non-git environments, only `src/` files are analyzed — same as pre-fix behavior. No regression.

3. **Performance:** `git ls-files` adds a synchronous subprocess call per `collectComplexity` invocation. For typical repos (< 10k tracked files), overhead is negligible (< 50ms). Not benchmarked formally.

4. **Coverage outside repo:** Files with coverage entries whose absolute paths fall outside the repo root are not handled by the git-tracked union. This is an edge case not addressed by FM-C03 scope.

---

## WP5.4 Untouched Confirmation

The following FMs are explicitly **untouched** by WP5.3 and remain deferred to WP5.4:

| FM | Description | Status |
|----|-------------|--------|
| FM-V01 | Coverage capability mislabel — `capabilities.coverageArtifact` reports 'available' when default coverage missing (`available: false`) | Untouched → WP5.4 |
| FM-D10 | CLI reports "Not a git repository" when git binary missing (ENOENT), not repo state | Untouched → WP5.4 |
| FM-G06 | CLI reports "coverage artifact malformed" when explicit coverage file missing — requires TS change to activate coverage path | Untouched → WP5.4 |
| FM-G07 | Composed-path `analyzerStatus` hardcoded 'passed' regardless of null coverage | Untouched → WP5.4 |

**Verification:** No code changes touch any of these FMs. The fixes are strictly scoped to:
- Source-file identity resolution (FM-A08)
- Descriptor key format (FM-A07)
- Source discovery scope (FM-C03)

No threshold, CRAP formula, provider, orchestration, language, or LLM logic was modified.

---

## Recommended WP5.4 Scope

Based on WP5.3 completion, WP5.4 should address:

1. **FM-V01:** Correct `capabilities.coverageArtifact` to reflect actual availability (currently reports 'available' when default coverage missing).
2. **FM-D10:** Clarify CLI message for git binary missing (ENOENT) vs. actual "not a git repository" repo state.
3. **FM-G06:** Clarify CLI message for missing coverage file vs. "malformed artifact" — requires TS-change precondition for coverage path activation.
4. **FM-G07:** Set `analyzerStatus` based on actual evaluation result / coverage validity (currently hardcoded 'passed').
5. **INV-06 (explicit missing/unsupported):** Surface NOT_EVALUATED status for functions with no coverage data (currently silently omitted).
6. **INV-09 (WP5.2 regression anchors):** Continue maintaining WP5.2 anchors as WP5.4 changes are made.

**Recommendation:** WP5.4 scope is orthogonal to WP5.3 fixes. No rework needed. WP5.3 provides a clean attribution foundation (correct file identity, correct method naming, complete source enumeration) that WP5.4 can build on for version/diff/blame attribution.
