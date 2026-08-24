# WP4R.1 Hono — Analysis

## Target
- **Repo**: honojs/hono
- **SHA**: 017000d
- **Tag**: v4.13.4
- **Vitest**: 4.1.11
- **Coverage provider**: @vitest/coverage-v8 ^4.1.7

## Experiment Results

### Exp1: WP4R Reproduce (`vitest --run --coverage`)
- **Exit code**: 0
- **Tests**: 147 files, 4934 passed, 44 skipped
- **Coverage dir created**: YES — `coverage/raw/default/`
- **coverage-final.json**: YES at `coverage/raw/default/coverage-final.json` (1,593,373 bytes)
- **Format**: Istanbul JSON (all 159 entries have path/s/f/b/fnMap/branchMap)
- **Prototype path match**: NO — writes to `coverage/raw/default/coverage-final.json`, not `coverage/coverage-final.json`

### Exp2: Native Configuration
- **package.json script**: `"coverage": "vitest --run --coverage"`
- **vitest.config.ts coverage block**: provider=v8, reportsDirectory=./coverage/raw/default, reporter=['json','text','html']
- **Dev deps**: vitest ^4.1.9, @vitest/coverage-v8 ^4.1.7 (NO istanbul provider)
- **Excludes**: benchmarks, runtime-tests, build/build.ts, src/test-utils, perf-measures, src/**/types.ts, src/jsx/intrinsic-elements.ts, src/utils/http-status.ts

### Exp3: Native Coverage Command (`npm run coverage`)
- **Exit code**: 0
- **Output**: Identical to Exp1 — `coverage/raw/default/coverage-final.json`
- **Same artifacts**: Yes, identical file set

### Exp4: Reporter Override (`--coverage.reporter=json`)
- **Exit code**: 0
- **Output**: Same — `coverage/raw/default/coverage-final.json` (CLI reporter flag is redundant with config)
- **No crash**: Unlike h3, no ENOENT error — hono's config already includes 'json' reporter

### Exp5: Artifact Inspection
- **coverage-final.json**: 1,593,373 bytes, 159 files, 6,602 statements, 1,130 functions, 2,074 branches
- **Istanbul keys**: All 159 entries have required keys (path, s, f, b, fnMap, branchMap)
- **Compatible with parseCoverageReport**: YES — format is valid Istanbul JSON
- **CLI override `--coverage.reportsDirectory=coverage`**: Writes to `coverage/coverage-final.json` — matches prototype path exactly

## Critical Finding

**hono uses v8 coverage provider (same as h3) but produces output.** Unlike h3 where v8 was silent, hono's v8 provider generates a 1.52 MB Istanbul JSON file. The difference is hono's config sets explicit reporters `['json','text','html']` and a custom `reportsDirectory`, while h3 relied on defaults that apparently didn't trigger output in the h3 environment.

**Path mismatch**: Prototype expects `coverage/coverage-final.json` but hono writes to `coverage/raw/default/coverage-final.json`. This is solvable via CLI-only `--coverage.reportsDirectory=coverage` — no repo modification needed.

## Target-Modification Classification

**TEMPORARY CLI OPTION ONLY**

The coverage artifact IS produced (Istanbul JSON, consumable by parseCoverageReport). The only gap is the output path, which is fixed by passing `--coverage.reportsDirectory=coverage` on the CLI. No dependency changes, no config edits, no production code modifications required.

## CLI-only Istanbul JSON Works?

**YES** — hono already produces Istanbul JSON via `@vitest/coverage-v8`. The `json` reporter is configured in vitest.config.ts. The only adjustment needed is the output directory, achievable via `--coverage.reportsDirectory=coverage`.

## Comparison with h3

| Aspect | h3 | hono |
|--------|-----|------|
| Provider | @vitest/coverage-v8 | @vitest/coverage-v8 |
| v8 produces output? | NO (silent) | YES (1.52 MB) |
| Istanbul JSON? | NO | YES |
| Output path | N/A | coverage/raw/default/ |
| Prototype path match? | N/A | NO (needs reportsDirectory override) |
| CLI-only fix? | N/A | YES |
| Target mod needed? | TARGET DEP CHANGE | TEMPORARY CLI OPTION ONLY |
