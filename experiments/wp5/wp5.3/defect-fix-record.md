# WP5.3 Defect Fix Record

**Date:** 2025-08-26  
**Spec:** `WP5_3_ATTRIBUTION_CORRECTNESS_SPEC.md`  
**Invariants:** `attribution-invariants.md` (INV-01 through INV-09)

---

## FM-A08: Suffix-Collision Wrong-File Attribution

### Baseline (defective)
- **Symptom:** Bidirectional `endsWith` matching in `src/attribution.ts` lines 55-70 caused coverage from `src/pkg-b/index.ts` to be attributed to `src/pkg-a/index.ts` (or null) when both shared the suffix `index.ts`.
- **Evidence:** `experiments/wp5/wp5.2/defect-repro.spec.ts` — `FM-A08: Suffix-collision path attribution -> two files share relative path suffix`. Coverage JSON showed `src/pkg-a/index.ts` (alpha, 100% covered) and `src/pkg-b/index.ts` (beta, 0% covered) — attribution returned wrong-file coverage or null due to ambiguous suffix match.
- **Root cause:** `normalizedFilePath.endsWith(normalizedRel)` matched both files against each other's relative paths → `matches.length > 1` → `fileComplexity = undefined` → coverage silently skipped for both files.

### Fix applied
- **File:** `src/attribution.ts` lines 55-70
- **Strategy:** Replace bidirectional `endsWith` with deterministic source-file identity resolution:
  1. **Exact path match first** — `coverageMap` absolute key normalized against `complexityByFile` relative key after path normalization.
  2. **Relative path computation fallback** — if no exact match, compute relative path from coverage absolute key and try matching.
  3. **Ambiguous → decline** — if multiple matches remain, set `coveragePercent: null, coverageKind: null` rather than first-entry-wins.
- **Key change:** First try exact normalized key match (`filePath === rel` after normalization). Only fall back to `endsWith` if exact match fails. Ambiguous `endsWith` results → skip coverage file entirely.

### After (fixed)
- **exact-path-control.spec.ts:** Direct key match works — `src/utils/helpers.ts` attributed correctly. ✅ PASS
- **suffix-collision-3files.spec.ts:** Three files (`pkg-a/index.ts`, `pkg-b/index.ts`, `pkg-c/index.ts`) each get correct attribution: alpha=100%, beta=0%, gamma=100%. No wrong-file attribution. ✅ PASS
- **reversed-coverage-map-order.spec.ts:** Reversing coverage map order produces identical results — order independence confirmed. ✅ PASS
- **ambiguous-candidate.spec.ts:** Ambiguous case returns `coveragePercent: null, coverageKind: null` (not wrong-file coverage). ✅ PASS

### Test evidence
```
vitest run experiments/wp5/wp5.3/fixtures/suffix-collision-3files.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/reversed-coverage-map-order.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/ambiguous-candidate.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/exact-path-control.spec.ts → PASS (1/1)
```

### Invariants validated
| Invariant | Test |
|-----------|------|
| INV-01 (Same-Function Identity) | exact-path-control |
| INV-02 (Wrong-File Prohibition) | suffix-collision-3files |
| INV-03 (Ambiguity Refusal) | ambiguous-candidate |
| INV-04 (Order Independence) | reversed-coverage-map-order |
| INV-07 (Source-File Identity Before Function Attribution) | ambiguous-candidate |

---

## FM-A07: Container-Method Attribution Key Mismatch

### Baseline (defective)
- **Symptom:** Class methods (`Foo.bar`, `Cls.bar`) and object methods received `null` coverage because `src/attribution.ts` line 97 constructed descriptor keys as `${descriptor.functionName}:${descriptor.startLine}` (e.g., `"bar:6"`), while `src/complexity.ts` lines 21-24 used `${descriptor.containerName}.${descriptor.functionName}` (e.g., `"Cls.bar:6"`).
- **Evidence:** `experiments/wp5/wp5.2/defect-repro.spec.ts` — `FM-A07: Container-method attribution key mismatch -> observed null coverage outcome`. Coverage JSON showed class methods `bar` and `baz` with coverage data, but attribution returned null for both.
- **Root cause:** `descriptorMap` keys used `containerName.functionName` format, but lookup key used only `functionName`. `descriptorMap.get("bar:6")` returned `undefined` because the key was `"Cls.bar:6"`.

### Fix applied
- **Files:** `src/attribution.ts` lines 97, 103
- **Change:** Updated descriptor key construction in attribution to match complexity naming:
  - Before: `` `${descriptor.functionName}:${descriptor.startLine}` ``
  - After: `` `${descriptor.containerName ? descriptor.containerName + '.' : ''}${descriptor.functionName}:${descriptor.startLine}` ``
- This ensures class methods (`Foo.bar:6`), object methods (`obj.method:11`), and top-level functions (`topLevel:1`) all use consistent keys.

### After (fixed)
- **class-method.spec.ts:** `Foo.bar` found with numeric coverage (100%). ✅ PASS
- **object-method.spec.ts:** `obj.method` found with numeric coverage. ✅ PASS
- **same-name-different-containers.spec.ts:** `Foo.bar` and `Baz.bar` each get distinct attributions (different lineStart values). ✅ PASS
- **top-level-function.spec.ts:** Top-level function `topLevel` still works (no container prefix). ✅ PASS

### Test evidence
```
vitest run experiments/wp5/wp5.3/fixtures/class-method.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/object-method.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/same-name-different-containers.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/top-level-function.spec.ts → PASS (1/1)
```

### Invariants validated
| Invariant | Test |
|-----------|------|
| INV-05 (Deterministic Container Identity) | class-method, object-method, same-name-different-containers, top-level-function |

---

## FM-C03: Silent Source-Root Blind Spot

### Baseline (defective)
- **Symptom:** Changed TypeScript files outside `src/` (e.g., `tools/check.ts`) were invisible to complexity analysis because `findAllTypeScriptFilesUnderSourceRoots` only scanned under `src/`. The file was absent from `changedFunctions` and received no attribution.
- **Evidence:** `experiments/wp5/wp5.2/defect-repro.spec.ts` — `FM-C03: Source-root blind spot -> observed behavior: changed TS file outside src/ is invisible`. Coverage JSON showed both `src/ok.ts` and `tools/check.ts`, but `tools/check.ts` was not enumerated by complexity.
- **Root cause:** `collectComplexity` called `findAllTypeScriptFilesUnderSourceRoots(cwd)` which only returned files under configured source roots (`src/`). `tools/check.ts` was outside this scope.

### Fix applied
- **File:** `src/complexity.ts` — added `getGitTrackedTsFiles()` helper and union logic
- **Strategy (hybrid):**
  1. Keep existing `findAllTypeScriptFilesUnderSourceRoots(cwd)` for baseline `src/` files.
  2. Add `getGitTrackedTsFiles(cwd)` — runs `git ls-files`, filters `.ts` extension, resolves to absolute paths.
  3. Union both lists via `Set<string>`, deduplicate.
  4. Parse all files in the union.
- **Rationale:** Narrowest safe contract — only tracked TS files (respects `.gitignore`), no interface change to `collectComplexity(cwd)`, addresses blind spot without scanning entire filesystem.

### After (fixed)
- **changed-ts-outside-src.spec.ts:** `tools/check.ts` enumerated, attributed with numeric coverage (100%). ✅ PASS
- **ts-under-src.spec.ts:** Normal `src/` operation unchanged — TS files under `src/` still work correctly. ✅ PASS

### Test evidence
```
vitest run experiments/wp5/wp5.3/fixtures/changed-ts-outside-src.spec.ts → PASS (1/1)
vitest run experiments/wp5/wp5.3/fixtures/ts-under-src.spec.ts → PASS (1/1)
```

### Invariants validated
| Invariant | Test |
|-----------|------|
| INV-08 (Changed TS Outside Analyzed Roots Must Not Yield Trustworthy COMPLETE/PASS) | changed-ts-outside-src |
| INV-01 (Same-Function Identity) | ts-under-src |
| INV-05 (Deterministic Container Identity) | ts-under-src |

---

## Regression Verification

### WP5.2 Regression Anchors
- **Command:** `vitest run experiments/wp5/wp5.2/`
- **Result:** 25 test files, 36 tests — **ALL PASS**
- **No behavior changes** for FM-V01, FM-D10, FM-G06, FM-G07 confirmed.

### WP5.3 Adversarial Tests
- **Command:** `vitest run experiments/wp5/wp5.3/`
- **Result:** 10 test files, 10 tests — **ALL PASS**

### Files Changed
| File | Lines Changed | Fix |
|------|--------------|-----|
| `src/attribution.ts` | ~lines 55-70, 97, 103 | FM-A08 source identity + FM-A07 descriptor key |
| `src/complexity.ts` | +lines 14-30 (new helper) | FM-C03 hybrid git-tracked union |

### Test Files Added
| File | FM | Invariant |
|------|-----|-----------|
| `exact-path-control.spec.ts` | FM-A08 | INV-01 |
| `suffix-collision-3files.spec.ts` | FM-A08 | INV-02 |
| `reversed-coverage-map-order.spec.ts` | FM-A08 | INV-04 |
| `class-method.spec.ts` | FM-A07 | INV-05 |
| `object-method.spec.ts` | FM-A07 | INV-05 |
| `same-name-different-containers.spec.ts` | FM-A07 | INV-05 |
| `top-level-function.spec.ts` | FM-A07 | INV-05 |
| `ambiguous-candidate.spec.ts` | FM-A08 | INV-03 |
| `ts-under-src.spec.ts` | FM-A08/A07/C03 | INV-01, INV-05, INV-08 |
| `changed-ts-outside-src.spec.ts` | FM-C03 | INV-08 |
