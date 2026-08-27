# FM-C03 Source Discovery Decision

## Approaches Compared

### A: Expand source discovery — scan all TS files in repo regardless of src/
- **Pros**: Simple implementation; guarantees any changed TS file is present in complexityInfo; no need for git.
- **Cons**: May include irrelevant files (e.g., test files, config, scripts) leading to unnecessary complexity analysis; could affect performance; may attribute coverage to files not intended for complexity measurement (though still safe as attribution is correct if coverage exists).
- **Safety**: Still safe because attribution is only performed when coverage data exists; no false attribution.

### B: Detect/surface — use git diff to identify changed TS files and parse them even if outside src/
- **Pros**: Narrowest scope — only analyzes TS files that are actually changed; minimal overhead; directly addresses the blind spot.
- **Cons**: Requires access to git diff information (base commit) inside `collectComplexity`, which currently only receives `cwd`. Would need to change function signature or rely on external state, violating current interface. Also, unchanged TS files outside src/ would remain unanalyzed (but they are not changed, so no attribution needed). However, if a file is changed but not yet staged/committed, git diff may not capture it depending on what diff is used.
- **Feasibility**: Not possible without modifying the interface of `collectComplexity` (or using global state), which is not permitted for FM-C03.

### C: Hybrid — use git diff for changed files + source-root scanner for baseline
- **Pros**: Combines baseline safety of source-root scanner with detection of changed TS files outside src/; only analyzes extra files when they are changed.
- **Cons**: Same feasibility issue as B — requires git diff info inside `collectComplexity`. Could approximate by using `git ls-files` to get all tracked TS files (a superset of changed files) which is implementable without extra parameters.

## Selected Approach
We choose a **modified hybrid** approach that is implementable within the existing `collectComplexity(cwd)` signature:
- Keep the existing source-root scanner (`findAllTypeScriptFilesUnderSourceRoots`) to preserve baseline behavior for files under `src/`.
- Augment the file list with all **tracked TypeScript files** in the repository (obtained via `git ls-files`). This ensures any TS file that is part of the project (and thus potentially changed) is included in complexity analysis.
- The union of source-root files and tracked TS files yields a superset that is still narrow: it excludes untracked/ignored files (e.g., build artifacts, temporary files, node_modules if gitignored) while guaranteeing that any changed TS file that is tracked will be present.

### Rationale
- **Narrowest safe contract**: We do not scan the entire filesystem for `.ts` files; we only consider files tracked by git, which aligns with typical project source boundaries and respects `.gitignore`.
- **No interface change**: The function signature remains `collectComplexity(cwd)`. We obtain tracked files via a synchronous git call (`git ls-files`) inside the function.
- **Addresses FM-C03**: A changed TS file outside `src/` that is tracked by git will now be enumerated, receive complexity info, and if coverage data exists, will be attributed and appear in `changedFunctions`.
- **Preserves WP5.2 regression anchors**: Files under `src/` continue to be discovered exactly as before; additional files only increase the set, never decrease it, so existing attributions remain unchanged.
- **Implementation simplicity**: Requires only a few lines of code and a helper function to execute `git ls-files` and filter for `.ts` extension.

### Trade-offs
- Slight overhead of executing `git ls-files` on each call (negligible for typical repo sizes).
- If a TS file is untracked (e.g., newly added but not yet `git add`ed), it will not be included. However, such a file is not yet part of the versioned project and the blind spot is less critical; the user can add it to git to have it analyzed.
- The approach still relies on git being available; if git fails, we fall back to the source-root scanner only (maintaining existing behavior).

## Conclusion
Implement the hybrid approach: augment `findAllTypeScriptFilesUnderSourceRoots` result with tracked TS files from `git ls-files`.