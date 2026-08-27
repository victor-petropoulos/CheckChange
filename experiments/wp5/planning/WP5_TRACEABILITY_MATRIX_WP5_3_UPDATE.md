# WP5 Traceability Matrix — WP5.3 Update

Traces each failure-mode (FM) through WP5.2 baseline fixture → WP5.3 invariant → code change → new adversarial test → before/after result → disposition.

## Resolved FMs (WP5.3)

| FM ID | Baseline Fixture (WP5.2) | Invariant (WP5.3) | Code Change | New Adversarial Test(s) | Before Result | After Result | Disposition |
|-------|--------------------------|-------------------|-------------|------------------------|---------------|--------------|-------------|
| FM-A08 | `fr-a7.spec.ts` — two files sharing suffix `index.ts` → ambiguous match → `fileComplexity = undefined` → coverage silently skipped | INV-01 (Same-Function Identity), INV-02 (Wrong-File Prohibition), INV-03 (Ambiguity Refusal), INV-04 (Order Independence), INV-07 (Source-File Identity Before Function Attribution) | `src/attribution.ts` lines 55-70: Replace bidirectional `endsWith` with exact path match first, `endsWith` fallback only, ambiguous → decline | `suffix-collision-3files.spec.ts` (3-way collision), `reversed-coverage-map-order.spec.ts` (order independence), `ambiguous-candidate.spec.ts` (ambiguous → null) | `src/pkg-a/index.ts` (alpha, 100% covered) got null or wrong-file coverage (0% from beta). `fileComplexity = undefined` → silently skipped. | `src/pkg-a/index.ts` → 100%, `src/pkg-b/index.ts` → 0%, `src/pkg-c/index.ts` → 100%. Ambiguous → `coveragePercent: null`, `coverageKind: null`. Order independence verified. | **RESOLVED** — All 3 adversarial tests PASS. 36/36 WP5.2 regression anchors intact. |
| FM-A07 | `fr-a6.spec.ts` — class method `Foo.bar` at line 6 → descriptor key `bar:6` (attribution) vs `Cls.bar:6` (complexity) → `descriptorMap.get("bar:6")` → `undefined` → null coverage for all class/object methods | INV-05 (Deterministic Container Identity) | `src/attribution.ts` lines 97, 103: Descriptor key from `` `${descriptor.functionName}:${descriptor.startLine}` `` to `` `${descriptor.containerName ? descriptor.containerName + '.' : ''}${descriptor.functionName}:${descriptor.startLine}` `` | `class-method.spec.ts` (Foo.bar → 100%), `object-method.spec.ts` (obj.method → numeric), `same-name-different-containers.spec.ts` (Foo.bar vs Baz.bar distinct), `top-level-function.spec.ts` (topLevel:1 still works) | Class methods `Foo.bar`, `Baz.bar` → null coverage (NOT_EVALUATED). Object methods → null. Top-level functions → worked (no container prefix). | Class methods → numeric coverage (100%). Object methods → numeric coverage. Same-name different containers → distinct attributions. Top-level functions → still work. | **RESOLVED** — All 4 adversarial tests PASS. 36/36 WP5.2 regression anchors intact. |
| FM-C03 | `fr-c3.spec.ts` — `tools/check.ts` (outside `src/`) → `findAllTypeScriptFilesUnderSourceRoots(cwd)` only scanned `src/` → file invisible → absent from `changedFunctions` | INV-08 (Changed TS Outside Analyzed Roots Must Not Yield Trustworthy COMPLETE/PASS) | `src/complexity.ts` added `getGitTrackedTsFiles()` helper + union logic: `fileSet = Set(findAllTypeScriptFilesUnderSourceRoots(cwd), git ls-files | filter .ts | resolve(cwd))` | `changed-ts-outside-src.spec.ts` (tools/check.ts → in changedFunctions with coverage 100), `ts-under-src.spec.ts` (normal src/ operation unchanged) | `tools/check.ts` absent from `changedFunctions`. No attribution. Silent blind spot. | `tools/check.ts` enumerated, attributed with correct coverage (100). `src/` operation unchanged. | **RESOLVED** — Both adversarial tests PASS. 36/36 WP5.2 regression anchors intact. |

## Deferred FMs (WP5.4)

| FM ID | Baseline Fixture (WP5.2) | Invariant (WP5.3) | Code Change | New Adversarial Test(s) | Before Result | After Result | Disposition |
|-------|--------------------------|-------------------|-------------|------------------------|---------------|--------------|-------------|
| FM-V01 | `fr-v1.spec.ts` — `coverageArtifact='available'` when default coverage missing, all changed NOT_EVALUATED | INV-09 (WP5.2 Regression Anchors Intact) | No change | None | Coverage capability mislabel: `coverageArtifact='available'` when artifact missing | No change | **WP5.4 DEFERRED** — No WP5.3 code change. Behavior unchanged. |
| FM-D10 | `cli-diagnostics/fm-d10-evidence.md` — CLI reports 'Not a git repository' when git binary missing | INV-09 (WP5.2 Regression Anchors Intact) | No change | None | CLI diagnostic message inaccurate | No change | **WP5.4 DEFERRED** — No WP5.3 code change. Behavior unchanged. |
| FM-G06 | `cli-diagnostics/fm-g06-evidence.md` — CLI reports 'coverage artifact malformed' when coverage file missing | INV-09 (WP5.2 Regression Anchors Intact) | No change | None | CLI diagnostic message inaccurate | No change | **WP5.4 DEFERRED** — No WP5.3 code change. Behavior unchanged. |
| FM-G07 | `fr-g7.spec.ts` — `analyzerStatus` hardcoded 'passed' | INV-09 (WP5.2 Regression Anchors Intact) | No change | None | `analyzerStatus` always 'passed' regardless of coverage | No change | **WP5.4 DEFERRED** — No WP5.3 code change. Behavior unchanged. |

## Traceability Chain Summary

```
FM-A08 → fr-a7.spec.ts → INV-01/02/03/04/07 → src/attribution.ts:55-70 → suffix-collision-3files + reversed-coverage-map-order + ambiguous-candidate → null/wrong-file → 100%/0%/null → RESOLVED
FM-A07 → fr-a6.spec.ts → INV-05 → src/attribution.ts:97,103 → class-method + object-method + same-name-different-containers + top-level-function → null for methods → numeric for methods, null for top-level → RESOLVED
FM-C03 → fr-c3.spec.ts → INV-08 → src/complexity.ts (getGitTrackedTsFiles + union) → changed-ts-outside-src + ts-under-src → absent from changedFunctions → present with coverage → RESOLVED
FM-V01 → fr-v1.spec.ts → INV-09 → no change → none → mislabeled artifact → unchanged → WP5.4 DEFERRED
FM-D10 → fm-d10-evidence.md → INV-09 → no change → none → inaccurate CLI msg → unchanged → WP5.4 DEFERRED
FM-G06 → fm-g06-evidence.md → INV-09 → no change → none → inaccurate CLI msg → unchanged → WP5.4 DEFERRED
FM-G07 → fr-g7.spec.ts → INV-09 → no change → none → hardcoded 'passed' → unchanged → WP5.4 DEFERRED
```

## Regression Evidence

| Suite | Files | Tests | Result |
|-------|-------|-------|--------|
| WP5.2 regression anchors | 25 | 36 | ✅ ALL PASS |
| WP5.3 adversarial | 10 | 10 | ✅ ALL PASS |
| **Total** | **35** | **46** | **✅ ALL PASS** |

## Disposition Key
- **RESOLVED**: Fix applied, adversarial tests PASS, WP5.2 regression anchors intact (36/36 pass), no regressions.
- **WP5.4 DEFERRED**: No WP5.3 code change. Behavior confirmed unchanged. Routes to WP5.4 scope.
- **CONFIRMED**: WP5.2 executable evidence supports the defect (pre-WP5.3 status).
- **REFUTED**: WP5.2 executable evidence refutes the defect.
- **BY_DESIGN**: Behavior is intentional and not a defect.

## Routing Key
- **WP5.3**: Fix applied and verified in this pass.
- **WP5.4**: Fix requires policy/schema decision or deeper redesign; deferred from WP5.3 scope.
- **neither**: No fix needed or out of scope.

## Traceability Correction (Documentation Reconciliation)

| Correction | Before | After | Artifact |
|------------|--------|-------|----------|
| WP5.3 documentation reconciliation | WP5.4 routing section used inferred FM descriptions for V01/D10/G06/G07 that did not match WP5.2 authoritative taxonomy | FM descriptions corrected to match authoritative WP5.2 records: V01=capability mislabel, D10=git binary ENOENT, G06=malformed artifact msg, G07=hardcoded passed | `WP5_3_DOCUMENTATION_RECONCILIATION.md` reconciliation table |

**Principle:** WP5.4 deferred FM descriptions must inherit from WP5.2 authoritative records (`defect-reproduction-results.md`, `WP5_2_RESULTS.md`, `cli-diagnostics/*.md`), not from WP5.3 inferred descriptions. This is a documentation correction, not a new defect.

**Deferred FM Traceability (authoritative WP5.2 meanings):**
- FM-V01 → `fr-v1.spec.ts` → INV-09 → `defect-reproduction-results.md` FM-V01 row + `WP5_2_RESULTS.md` Defect Classifications `expect(output.capabilities.coverageArtifact).toBe('available')` → WP5.4 DEFERRED
- FM-D10 → `fm-d10-evidence.md` → INV-09 → `defect-reproduction-results.md` FM-D10/FM-G06 row (CLI: "Error: Not a git repository" when git binary missing) → WP5.4 DEFERRED
- FM-G06 → `fm-g06-evidence.md` → INV-09 → `defect-reproduction-results.md` FM-D10/FM-G06 row (CLI: "Error: coverage artifact malformed" when coverage file missing, requires TS change) → WP5.4 DEFERRED
- FM-G07 → `fr-g7.spec.ts` → INV-09 → `defect-reproduction-results.md` FM-G07 row + `defect-repro.spec.ts` `expect(func.analyzerStatus).toBe('passed')` → WP5.4 DEFERRED
