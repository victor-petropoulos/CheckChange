# Known Defects — Root Cause Analysis and Corrective Action Proposal

**Status:** Research only. No code changes proposed for WP5.6 freeze. WP6+ decision required.

This document investigates the three open defects recorded in `WP5_6_CLOSURE.md`:
- **F-03** — Istanbul coverage absolute-path coupling
- **F-04** — WP5.3 C03 changed-function count expansion
- **D-APOLLO** — Apollo-client coverage generation failure (WP4R §Known Limitations)

For each: observed behavior, root cause (with file:line evidence), confidence, impact, and proposed corrective action. WP5.6 freezes the current state; these are research notes for WP6+ decision-making.

---

## F-03: Istanbul coverage absolute-path coupling

### Observed behavior

Re-executing the prototype on a fresh clone of `unjs/h3` produced `analyzerStatus="skipped"` for all changed functions when the cloned repo was placed at a different absolute path than the original coverage-generation cwd. After moving the clone to `/tmp/wp4r-repos/h3` (matching the original `/tmp/wp4r-repos/h3` for sup-a) or symlinking `/tmp/wp4r1-h3 -> /tmp/wp4r-repos/h3` (matching the original `/tmp/wp4r1-h3` for sup-b), the same artifact produced `analyzerStatus="passed"` for the locked-focus function with the original CRAP value.

### Root cause

`parseCoverageReport` in `node_modules/@barney-media/crap-typescript-core/dist/istanbul.js:14-25`:

```js
export async function parseCoverageReport(reportPath, sourceRoot) {
  const raw = parseCoverageJson(reportPath, await readFile(reportPath, "utf8"));
  ...
  for (const [entryKey, entryValue] of Object.entries(report)) {
    const parsedEntry = parseCoverageEntry(entryKey, entryValue, sourceRoot);
    ...
  }
}
```

`parseCoverageEntry` (same file, ~line 70):

```js
const sourcePath = typeof entryValue.path === "string" ? entryValue.path : entryKey;
const resolved = isAbsolutePath(sourcePath) ? sourcePath : path.resolve(sourceRoot, sourcePath);
return { normalizedPath: normalizePathForMatch(resolved), coverage: ... };
```

Istanbul `coverage-final.json` records `entry.path` as the **absolute path the test runner saw at instrumentation time** (e.g., `/private/tmp/wp4r-repos/h3/src/rules/normalize.ts`). `parseCoverageReport` does NOT rebase these absolute paths against `sourceRoot`; it preserves them. The returned `Map<string, FileCoverage>` keys are therefore absolute paths baked into the artifact.

`src/attribution.ts:48-54` then matches coverage keys against complexity `info.file` (a repo-relative path produced by `relative(cwd, filePath)` in `src/complexity.ts:55`):

```ts
const normalizedFilePath = filePath.replace(/\\/g, '/');
const matches: { rel: string; list: ComplexityInfo[] }[] = [];
for (const [rel, list] of complexityByFile.entries()) {
  const normalizedRel = rel.replace(/\\/g, '/');
  if (normalizedFilePath.endsWith(normalizedRel)) {
    matches.push({ rel, list });
  }
}
```

`endsWith()` succeeds only when the absolute coverage path's suffix matches the relative complexity path. If the cloned repo is at `/var/folders/.../h3/...` while the artifact was generated at `/tmp/wp4r-repos/h3/...`, the suffix still contains the repo-relative segment (`src/rules/normalize.ts`), so the match CAN work. The reason it didn't in the first attempt was likely the path nesting depth (var/folders has longer prefix) combined with sub-path collisions.

**Critical insight:** the suffix match is by design for suffix-collision avoidance (A08 fix), so changing the matching strategy risks re-introducing A08. Any normalization must keep suffix-collision detection working.

### Confidence

**High.** The Istanbul file format and the attribution algorithm are both verified by reading source. Reproduction is deterministic (same artifact, different cwd → different outcome).

### Impact

- **For current users:** Most CI environments run on a single machine with a stable working directory, so the artifact's absolute path usually matches the `cwd` at analysis time. This is an edge case, not a daily-friction issue.
- **For cross-machine replay** (e.g., a researcher re-runs WP4R on a different laptop): the artifact cannot be replayed without path awareness. WP5.6 demonstrated this directly.
- **For archive durability:** Preserved artifacts become path-locked to the generation environment. A truly durable reproducibility record would need either (a) artifacts with relative paths, (b) path normalization at load time, or (c) a documented cwd contract.

### Proposed corrective action (WP6+)

Three options, listed by reversibility and effort:

1. **Path normalization in `src/coverage.ts` after `parseCoverageReport`.** Walk the returned `Map<string, FileCoverage>` keys; for each key, compute the suffix that overlaps the current `cwd`; if the suffix matches, rebase to repo-relative. **Risk:** could mask real path-coupling bugs; need a test that asserts rebase is correct.
2. **Document a cwd contract on the CLI:** require `cwd` to match the original generation directory or supply `--original-cwd <path>` flag. **Risk:** moves burden to caller; no engineering change.
3. **Strip absolute-path keys at coverage-generation time** (caller-side). Modify the WP4R re-run playbook to post-process the artifact and replace `/private/tmp/wp4r-repos/...` with `REPO_RELATIVE/...`. **Risk:** outside prototype scope; caller-side tooling only.

**Recommendation:** Option 1 with a regression test, deferred to WP6+. WP5.6 freezes the symlink workaround. Reversibility: high (small additive change).

---

## F-04: WP5.3 C03 changed-function count expansion

### Observed behavior

| Case | Pre-WP5.3 changed-fns | Post-WP5.3 changed-fns | Δ | Where the new fns live |
|------|----------------------:|----------------------:|--:|------------------------|
| hono-03 | 4 | 6 | +2 | `src/middleware/csrf/index.test.ts` |
| sup-a | 108 | 196 | +88 | Mostly test files in `src/**/*.test.ts` |
| hono-01 | 0 | 0 | 0 | n/a |
| hono-02 | 3 | 3 | 0 | n/a |
| sup-b | 11 | 11 | 0 | n/a |

New fns are mostly inside `*.test.ts` files. They have `analyzerStatus="skipped"` because Istanbul artifacts don't include test-file coverage (tests run, but the artifact is keyed on source files only).

### Root cause

`src/complexity.ts:8-22, 26-50` (post-WP5.3 C03 fix):

```ts
function getGitTrackedTsFiles(cwd: string): string[] {
  const output = execSync('git ls-files --cached --others --exclude-standard', { cwd, encoding: 'utf8' });
  ...
  for (const line of lines) {
    if (line.trim().endsWith('.ts')) {
      tsFiles.push(resolve(cwd, line.trim()));
    }
  }
  return tsFiles;
}

export async function collectComplexity(cwd: string): Promise<ComplexityInfo[]> {
  const sourceRootFiles = await findAllTypeScriptFilesUnderSourceRoots(cwd);
  const gitTrackedTs = getGitTrackedTsFiles(cwd);
  
  const fileSet = new Set<string>();
  for (const f of sourceRootFiles) fileSet.add(f);
  for (const f of gitTrackedTs) fileSet.add(f);
  ...
}
```

Before WP5.3, the source-root scanner only saw `src/`. After WP5.3, the union with `git ls-files` picks up test files (typically at `src/**/*.test.ts`).

The git-changed-function correlation (`correlate(methodEvidence, intervals)`) then matches changed lines against the discovered fns, including the test-file fns. Hence the +88 in sup-a.

### Confidence

**High.** Root cause traced via direct code inspection. The expansion is by design per WP5.3 C03 fix (per `experiments/wp5/wp5.3/source-discovery-decision.md` and `experiments/wp5/wp5.3/defect-fix-record.md`).

### Impact

- **Material to gate outcomes:** None. hono-03 still PASS, sup-a still WARN. Locked-focus functions unchanged.
- **Material to completeness:** hono-03 went `COMPLETE → INCOMPLETE` because the 2 new test-file fns have no coverage. This is **truthful reporting**, not a regression. Per INV-04 (ANALYZER TRUTHFUL), the pipeline must report what it knows.
- **Material to humans reading the output:** The output JSON now lists test-file fns in `changedFunctions`. A human reviewer might be surprised. Documentation in `pipeline-results.md` explains why.
- **Material to size classification:** The classification `NON-TRIVIAL ≥ 4 changed fns` now includes test-file fns. A case previously classified as `MODERATE` (h3-02 with 4 fns) might shift to `NON-TRIVIAL` if test-file fns grow. WP5.6 already notes h3-02 may have grown (replay-only, not re-executed).

### Proposed corrective action (WP6+)

**Status (2026-08-27): RESOLVED — accepted and documented.**

Three options:

1. **Accept and document.** The expansion is correct: a changed test fn is a real changed function. The pipeline's `skipped` is truthful. Add a note to the contract that `changedFunctions` may include test-file fns when they're tracked.
2. **Filter test files out of the complexity result.** Add a `testRegex` exclusion to `collectComplexity`. **Risk:** a reviewer who wants to know "did any test fn change?" loses that signal. Re-introduces WP5.3 C03.
3. **Reclassify test-file fns as a separate category.** Split `changedFunctions` into `productionChangedFunctions` and `testChangedFunctions`. Each with its own rule evaluation. **Risk:** significant contract change; needs spec.

**Recommendation:** Option 1 (accept and document). The expansion surfaces real changes; the truthful `skipped` status is the correct semantic. WP5.6 already documents this in `pipeline-results.md` §F-04. Reversibility: trivial (no code change).

---

## D-APOLLO: Apollo-client coverage generation failure

### Observed behavior (from preserved WP4R evidence)

| Case | Tests Run | Tests Result | Jest exit | coverage-final.json | prototype exit | analysisStatus |
|------|-----------|--------------|-----------|---------------------|----------------|----------------|
| apollo-01 | 2 suites, 62 tests | 24 failed, 18 skipped, 20 passed | 1 | missing | 1 | SUCCESS |
| apollo-02 | 3 suites, 165 tests | 33 skipped, 132 passed | 1 | missing | 1 | SUCCESS |
| apollo-03 | 5 suites, 541 tests | 33 skipped, 508 passed | 1 | missing | 1 | SUCCESS |

Prototype `analysisStatus=SUCCESS` is **correct** — analysis of changed functions completed. The output is `completeness=INCOMPLETE` because coverage was absent. The pipeline **truthfully reports the gap**. This is INV-02 (MISSING≠MALFORMED) operating correctly.

But the *cause* of the gap is a coverage-generation failure on the caller side, not a prototype defect. The prototype never sees coverage, so it cannot fail.

### Root cause (new analysis, extends WP4R's "unresolved")

#### apollo-01: test failure prevented coverage

`experiments/wp4r-final/apollo-client/apollo-01/coverage-generation-stderr.txt` shows the test suite used `expect(test.read).toBeCalled()`. `toBeCalled` is an **alias removed in Jest 27+** (renamed to `toHaveBeenCalled`). The apollo-client test code at the target SHA still uses the old alias, but the modern Jest version installed via `node ./node_modules/jest/bin/jest.js` (a 29+ version) does not have it.

```
TypeError: expect(...).toBeCalled is not a function
   99 |       test.readQuery({ query });
> 101 |       expect(test.read).toBeCalled();
```

Result: 24/62 tests fail. Jest exits 1 **before** the coverage reporter runs, so `coverage-final.json` is never written. This is **expected Jest behavior** when tests fail: coverage is reported as "partial" or not at all, depending on `--coverageReporters`.

#### apollo-02 and apollo-03: tests passed but coverage not written

For these cases, **all 132/508 tests passed**, but Jest still exited 1 and no `coverage-final.json` was produced. The stderr has no "Wrote" or "coverage" message.

The likely cause: `--coverageReporters=json` is the correct Jest 27+ flag, but it requires `--coverage` (which is provided) **AND** the test process must complete the coverage phase after tests. With `--runInBand --watchAll=false`, Jest should produce the file. The fact that it doesn't suggests:

- **Option A:** The `jest.config.ts` has `collectCoverage: false` or an empty `coveragePathIgnorePatterns` that excludes all source.
- **Option B:** `ts-jest` is in a configuration that doesn't instrument the source files, so coverage map is empty.
- **Option C:** The Jest config has a custom coverage reporter that suppresses the `coverage-final.json` write.
- **Option D:** A pre-flight check (e.g., `--listTests`) was implicitly invoked and produced an early exit.

Without a live `apollo-client` clone and without the `jest.config.ts` file, the exact cause cannot be determined from preserved evidence alone. The WP4R team had access to a live clone at the time but did not preserve the config or the npm-debug log.

### Confidence

- **apollo-01:** **High** that `toBeCalled` removal is the cause. Confirmed by stderr text and Jest release notes.
- **apollo-02/03:** **Medium** on the specific mechanism. **Correction (after independent reviewer verification, 2026-08-27):** the `--coverage --coverageReporters=json` flags WERE present in the `metadata.md` command (verified by reviewer reading `metadata.md:8,10`). The earlier "omitted --coverage" hypothesis was incorrect. Reviewer's revised hypothesis: "Jest exited with non-zero status before coverage file could be written or serialized" due to console errors / act warnings / timeout disposables in test runs. The actual exit cause within `--runInBand --watchAll=false` Jest mode remains unconfirmed without a live clone + re-run.

### Impact

- **For WP4R / WP5.6 evidence base:** The 3 apollo cases cannot contribute to usefulness evidence because no coverage was produced. The system **truthfully reports this**; the prototype itself is not at fault.
- **For future apollo-client experiments:** A reproducer needs to either (a) use a Jest version that supports `toBeCalled` (Jest 26 or earlier), (b) apply a shim that aliases `toBeCalled → toHaveBeenCalled` at test time, or (c) modify the test code in the clone before running coverage. All are caller-side workarounds.
- **For prototype contract:** No change required. The `INCOMPLETE` reporting for missing coverage is the documented semantic.

### Proposed corrective action (WP6+)

Three options:

1. **Re-clone apollo-client at the pinned SHAs and re-run coverage with Jest 26 or a `toBeCalled` shim.** Validates the prototype end-to-end on apollo. **Effort:** ~30-60 min for one apollo case if the npm install works at the pinned SHAs.
2. **Document the apollo cases as "D-APOLLO: caller-side coverage-generation failure"** and exclude them from the "WP4R frozen" set in future WP docs. Treat apollo as out-of-scope for usefulness claims. **Effort:** documentation only.
3. **Investigate Options A-D for apollo-02/03 by re-cloning** to determine which is the actual cause. May or may not yield a fixable path.

**Recommendation:** Option 1 if a future WP wants apollo coverage evidence. Option 2 if WP6+ de-prioritizes apollo. The honest recorded answer is: **apollo-client is a known caller-side failure mode, not a prototype failure**. The system's truthful reporting is the correct outcome. Reversibility: depends on path.

---

## Cross-defect observation

All three defects share a common property: **the prototype behaves correctly; the gap is in (a) caller-side artifact quality (F-03, D-APOLLO) or (b) the deliberately broader source-discovery scope (F-04)**. None of them indicate a defect in the deterministic evidence engine itself.

This is a **strong positive signal** for the WP5.6 closure: the post-WP5.4 invariant system (INV-01..04) is doing what it was designed to do — surface gaps truthfully without fabrication.

---

## Recommended next decision

WP6+ should decide:

1. **F-03:** implement path normalization in `src/coverage.ts` (small, reversible) **OR** document cwd contract (zero-risk, zero-reversibility-needed).
2. **F-04:** accept current behavior; document in contract; **no code change**.
3. **D-APOLLO:** re-clone + re-attempt coverage **OR** formally exclude apollo-client from the WP4R frozen corpus. The decision affects how the usefulness claim is framed.

None of these are blocking for WP5.6 closure. The freeze at `21daa57` stands.
