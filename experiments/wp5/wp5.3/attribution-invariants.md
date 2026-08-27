# WP5.3 — Coverage Attribution Invariants

Derived from `WP5_3_ATTRIBUTION_CORRECTNESS_SPEC.md` (revised after WP5.2 acceptance).

**WP5.1:** ACCEPTED  
**WP5.2:** ACCEPTED  
**WP5.3:** READY FOR EXECUTION

**Authorized defects:** FM-A08 (suffix-collision wrong-file attribution), FM-A07 (container-method attribution mismatch), FM-C03 (silent source-root blind spot)

**Deferred to WP5.4:** FM-V01, FM-D10, FM-G06, FM-G07

---

## INV-01 — Same-Function Identity

> Complexity and coverage must identify the same logical function.

**Invariant:** The attribution layer must map coverage data to the exact same logical function that complexity analysis enumerated. A function identified by complexity at a given file path and line range must receive coverage from the matching coverage entry — not a different function, not a different file.

**Testable criteria:**
- Given a complexity descriptor for `src/utils/helpers.ts:42` (function `formatDate`), the attribution lookup must resolve to the coverage entry for that exact function — not to `formatDate` at a different line or file.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-02 — Wrong-File Prohibition

> Wrong-file coverage must never be selected because paths share suffixes.

**Invariant:** When two or more files share a relative path suffix (e.g., `src/pkg-a/index.ts` and `src/pkg-b/index.ts`), attribution must not select coverage from the wrong file. The first-entry-wins behavior from naive suffix matching is defective and must be eliminated.

**Testable criteria:**
- Given two files `src/pkg-a/index.ts` and `src/pkg-b/index.ts` that share the suffix `index.ts`, and coverage data where `src/pkg-a/index.ts` has 100% coverage and `src/pkg-b/index.ts` has 0% coverage, attribution for `src/pkg-a/index.ts` must return 100% (not 0%).
- Reversing the order of files in the coverage map must produce the same correct attribution — order independence for file identity.
- Given two files with identical suffixes, if no exact path match is possible, attribution must decline (coveragePercent: null, coverageKind: null) rather than selecting a wrong file.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-03 — Ambiguity Refusal

> Ambiguity must not silently choose an arbitrary candidate.

**Invariant:** When the attribution layer cannot deterministically resolve which file or function a coverage entry corresponds to, it must decline attribution rather than silently selecting an arbitrary candidate. Silent wrong attribution is worse than missing attribution.

**Testable criteria:**
- Given two coverage entries that both match a complexity descriptor via suffix matching (ambiguous case), attribution must return `coveragePercent: null` and `coverageKind: null` — not a wrong file's coverage.
- Given a complexity descriptor for a function that exists in multiple files with no disambiguating information, attribution must decline rather than picking the first match.
- The "ambiguous candidate" adversarial test must assert null coverage, not a numeric value.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-04 — Order Independence

> Coverage-map order cannot change attribution.

**Invariant:** The order in which coverage entries appear in the coverage map must not affect attribution results. Attribution must be deterministic with respect to file/function identity, not iteration order.

**Testable criteria:**
- Given a coverage map with entries in order [A, B, C] and the same map with entries in order [C, B, A], attribution for all three files must produce identical results.
- Reversing the coverage-map order must not change any attribution outcome — this is the specific regression tested in the FM-A08 adversarial suite.
- The adversarial test for reversed map order must assert that all attributions remain unchanged.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-05 — Deterministic Container Identity

> Container-method identity must be deterministic.

**Invariant:** Class methods and object methods must be identified by their full qualified name (containerName.functionName), not by functionName alone. This ensures that `Foo.bar()` and `Baz.bar()` are attributed to different coverage entries even though they share the same raw method name.

**Testable criteria:**
- Given class method `Foo.bar` at line 10 and class method `Baz.bar` at line 20, attribution for `Foo.bar` must return coverage for `Foo.bar` — not `Baz.bar`.
- The descriptor key in attribution must use the format `{containerName}.{functionName}:{startLine}` to match the complexity layer's naming convention.
- Top-level functions (no container) must still work — the key format for top-level functions is `{functionName}:{startLine}`.
- The adversarial test for same-name methods in different containers must assert distinct attributions.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-06 — Explicit Missing/Unsupported Discovery

> Missing attribution stays explicit.

**Invariant:** When a complexity descriptor has no corresponding coverage entry, or when a source file falls outside the analyzed source roots, the system must produce an explicit signal (e.g., `coverageKind: NOT_EVALUATED`, `coveragePercent: null`, or a documented reason) rather than silently omitting the function from results.

**Testable criteria:**
- Given a complexity descriptor for a file that exists but has no coverage data, the attribution result must include an explicit marker (e.g., `coverageKind: NOT_EVALUATED`) — not silently drop the function.
- Given a complexity descriptor for `tools/check.ts` (outside `src/`), the system must either enumerate it and attribute coverage, or explicitly surface that it was not analyzed — not silently disappear from the output.
- The adversarial test for missing coverage must assert explicit null/NOT_EVALUATED, not an incorrect numeric value.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-07 — Source-File Identity Before Function Attribution

> Source-file identity is resolved before function attribution.

**Invariant:** The attribution layer must resolve which file a coverage entry belongs to before attempting to match it to a complexity descriptor. File-level identity resolution is a prerequisite for function-level attribution.

**Testable criteria:**
- Given a coverage entry with absolute path `/repo/src/utils/helpers.ts`, the attribution layer must first resolve this to the relative complexity path `src/utils/helpers.ts` before attempting function-level matching.
- If source-file identity cannot be resolved (e.g., path normalization fails, or the coverage path has no matching complexity file), attribution must decline — not proceed to function matching with a wrong file.
- The adversarial test for ambiguous candidate must verify that source-file resolution happens first and fails before function matching is attempted.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-08 — Changed TS Outside Analyzed Roots Must Not Yield Trustworthy COMPLETE/PASS

> Known changed TS outside analyzed roots must not silently yield trustworthy COMPLETE/PASS.

**Invariant:** When TypeScript files that have changed (per git diff) exist outside the analyzed source roots (e.g., `tools/check.ts` outside `src/`), the system must not silently report COMPLETE/PASS for those files. Either they must be enumerated and attributed, or their absence must be explicitly surfaced.

**Testable criteria:**
- Given `tools/check.ts` (outside `src/`) that has changed per git diff, the complexity layer must either: (a) enumerate it and include it in changedFunctions, or (b) explicitly surface that it exists outside analyzed roots.
- The attribution result for `tools/check.ts` must not be silently omitted from the output — the function must appear with an explicit coverage status.
- The adversarial test for changed TS outside src/ must assert that the file appears in changedFunctions with correct attribution or explicit NOT_EVALUATED status.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## INV-09 — WP5.2 Regression Anchors Intact

> WP5.2 regression anchors and WP4R boundaries remain intact.

**Invariant:** All WP5.2 regression anchors must remain green after WP5.3 fixes. No behavior change is authorized for FM-V01, FM-D10, FM-G06, or FM-G07. The fixes for FM-A08, FM-A07, and FM-C03 must not introduce regressions in previously passing behavior.

**Testable criteria:**
- Running `vitest run experiments/wp5/wp5.2/` must return all 36 tests passing (25 files) after WP5.3 fixes.
- The specific WP5.2 fixtures (fr-a7, fr-a6, fr-c3) must continue to pass — their baseline defective behavior has been corrected, but the test structure and assertions must remain valid.
- No test in the WP5.2 regression suite should fail as a result of WP5.3 changes.
- The adversarial-case-matrix.md must confirm that each WP5.2 anchor test remains green.

**Blocked by / deferred to:** WP5.4 (FM-V01, FM-D10, FM-G06, FM-G07)

---

## Traceability

| Invariant | Spec Section | FM | Adversarial Test |
|-----------|-------------|-----|-----------------|
| INV-01 | §Invariants.1 | FM-A08 | exact-path control |
| INV-02 | §Invariants.2 | FM-A08 | suffix collision (3+ files) |
| INV-03 | §Invariants.4 | FM-A08 | ambiguous candidate |
| INV-04 | §Invariants.6 | FM-A08 | reversed map order |
| INV-05 | §Invariants.3 | FM-A07 | class method, object method, same-name in different containers |
| INV-06 | §Invariants.5 | FM-C03 | missing coverage |
| INV-07 | §Invariants.7 | FM-A08 | source-file identity resolution |
| INV-08 | §Invariants.8 | FM-C03 | changed TS outside src/ |
| INV-09 | §Invariants.9 | — | WP5.2 regression anchors |
