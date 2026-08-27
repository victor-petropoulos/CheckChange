# WP5.3 Baseline Characterization

## Command Run
```bash
export PATH="/Users/victorpetropoulos/.nvm/versions/node/v24.18.1/bin:$PATH" && npx vitest run experiments/wp5/wp5.2/
```

## Test Output Summary
- **Test Files**: 25 passed
- **Tests**: 36 passed
- **Duration**: 1.18s

## Defective Behavior Evidence

### FM-A08: Suffix-collision path attribution
From `experiments/wp5/wp5.2/defect-repro.spec.ts`:
```
> FM-A08: Suffix-collision path attribution -> two files share relative path suffix
```
Coverage JSON shows two files (`src/pkg-a/index.ts` and `src/pkg-b/index.ts`) each with a single function (`alpha` and `beta`). Due to bidirectional `endsWith` suffix matching in `src/attribution.ts` lines 55-70, coverage from one file is incorrectly attributed to the other (or null), causing ambiguous attribution.

### FM-A07: Container-method attribution key mismatch
From `experiments/wp5/wp5.2/defect-repro.spec.ts`:
```
> FM-A07: Container-method attribution key mismatch -> observed null coverage outcome
```
Coverage JSON shows `src/cls.ts` with class methods `bar` and `baz`. However, `src/attribution.ts` line 97 constructs descriptor keys using only `functionName` (e.g., `"bar:6"`), while `src/complexity.ts` lines 21-24 uses `containerName.functionName` (e.g., `"Cls.bar:6"`). This key mismatch results in `null` coverage for class methods.

### FM-C03: Silent source-root blind spot
From `experiments/wp5/wp5.2/defect-repro.spec.ts`:
```
> FM-C03: Source-root blind spot -> observed behavior: changed TS file outside src/ is invisible
```
Coverage JSON shows both `src/ok.ts` and `tools/check.ts` (a TypeScript file outside `src/`). However, the source discovery in `@barney-media/crap-typescript-core` (used via `findAllTypeScriptFilesUnderSourceRoots` in `src/complexity.ts:14`) does not enumerate `tools/check.ts` when the source root is limited to `src/`, causing the file to be absent from `changedFunctions` and attribution.

## Source Code Verification
Defective code confirmed present:
- `src/attribution.ts` lines 55-70: bidirectional `endsWith` suffix matching.
- `src/attribution.ts` line 97: descriptor key `${descriptor.functionName}:${descriptor.startLine}`.
- `src/complexity.ts` lines 21-24: method name `${descriptor.containerName}.${descriptor.functionName}`.

## Pre-edit State
```bash
$ git diff --stat -- src/
```
(no output) — no changes to `src/` directory yet.

All defective behaviors are preserved as baseline for WP5.3 fixes.