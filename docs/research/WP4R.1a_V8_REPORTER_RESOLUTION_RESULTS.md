# WP4R.1a — V8 Reporter Resolution — Results

## Status
**COMPLETE — ROOT CAUSE IDENTIFIED**

## Purpose
Resolved why h3 and Hono, both using Vitest 4.1.11 and `@vitest/coverage-v8` 4.1.11, behaved differently regarding `coverage-final.json` artifact emission. Determined whether h3 can emit compatible Istanbul JSON with existing dependencies only.

## Environment

| Property | Value |
|----------|-------|
| Target | h3 (`/tmp/wp4r1-h3`) |
| vitest | 4.1.11 |
| `@vitest/coverage-v8` | ^4.1.11 |
| `@vitest/coverage-istanbul` | not installed |
| `vitest.config.mjs` coverage block | `include`/`exclude` only — no `provider`, `reporter`, or `reportsDirectory` |
| CWD for all experiments | `/tmp/wp4r1-h3` |
| Cleanup | `coverage/` directory removed before each experiment |

Source: `experiments/wp4r.1a/h3/environment.md`

## Experiment 1: Baseline Reproduction

**Command:**
```bash
npx vitest --run --coverage
```

**Exit code:** `1` (source: `experiments/wp4r.1a/h3/baseline-exit-code.txt`)

**Test results:** 73 files, 2798 tests (2732 passed, 65 skipped, 1 failed)

**Failure:** `test/utils.test.ts` — `getRequestFingerprint` (1 failed, 2 skipped)

**Artifacts:** None. No `coverage/` directory created. No JSON files produced.

Source: `experiments/wp4r.1a/h3/baseline-stdout.txt`, `experiments/wp4r.1a/h3/baseline-stderr.txt`

## Experiment 2: Report-on-Failure

**Command:**
```bash
npx vitest --run --coverage --coverage.reporter=json --coverage.reportOnFailure
```

**Exit code:** `1` (source: `experiments/wp4r.1a/h3/report-on-failure-exit-code.txt`)

**Test results:** 73 files, 2798 tests (2732 passed, 65 skipped, 1 failed) — identical to baseline

**Artifacts:**
```
/tmp/wp4r1-h3/coverage/coverage-final.json  (826067 bytes)
```

Source: `experiments/wp4r.1a/h3/report-on-failure-stdout.txt`, `experiments/wp4r.1a/h3/report-on-failure-stderr.txt`

## Experiment 3: Explicit v8 JSON

**Command:**
```bash
npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure
```

**Exit code:** `1` (source: `experiments/wp4r.1a/h3/explicit-v8-json-exit-code.txt`)

**Test results:** 73 files, 2798 tests (2732 passed, 65 skipped, 1 failed) — identical

**Artifacts:**
```
/tmp/wp4r1-h3/coverage/coverage-final.json  (826067 bytes)
```

Identical size to Experiment 2. Same content.

Source: `experiments/wp4r.1a/h3/explicit-v8-json-stdout.txt`, `experiments/wp4r.1a/h3/explicit-v8-json-stderr.txt`

## Experiment 4: Passing Subset

**Command:**
```bash
npx vitest --run test/app.test.ts --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure
```

**Exit code:** `0` (source: `experiments/wp4r.1a/h3/passing-subset-exit-code.txt`)

**Test results:** 1 file (`test/app.test.ts`), 76 tests (68 passed, 8 skipped, 0 failed)

**Artifacts:**
```
/tmp/wp4r1-h3/coverage/coverage-final.json  (819492 bytes)
```

Slightly smaller than Exp2/Exp3 (subset coverage vs full suite).

Source: `experiments/wp4r.1a/h3/passing-subset-stdout.txt`, `experiments/wp4r.1a/h3/passing-subset-stderr.txt`

## Artifact Inventory

| Artifact | Baseline | Report-on-failure | Explicit v8 JSON | Passing subset |
|----------|----------|-------------------|------------------|----------------|
| `coverage-final.json` | ✗ | ✓ (826067 B) | ✓ (826067 B) | ✓ (819492 B) |
| `coverage.json` | ✗ | ✗ | ✗ | ✗ |
| `coverage-summary.json` | ✗ | ✗ | ✗ | ✗ |
| `lcov.info` | ✗ | ✗ | ✗ | ✗ |
| `lcov-report/` | ✗ | ✗ | ✗ | ✗ |
| `clover.xml` | ✗ | ✗ | ✗ | ✗ |
| `cobertura*.xml` | ✗ | ✗ | ✗ | ✗ |

Source: `experiments/wp4r.1a/h3/artifact-inventory.md`

Only `coverage-final.json` was produced, exclusively when `--coverage` was invoked with either explicit JSON reporter or `reportOnFailure` enabled.

## Format Validation

All produced `coverage-final.json` files contain valid Istanbul JSON objects with the following top-level keys per entry:

- `path` — source file path
- `s` — statement coverage map
- `statementMap` — statement location map
- `f` — function coverage map
- `fnMap` — function location map
- `b` — branch coverage map
- `branchMap` — branch location map
- `meta` — file metadata

Exp2 artifact contained 74 file entries and 3113 statements.

Source: `experiments/wp4r.1a/h3/artifact-inventory.md`

## Parser Compatibility

The prototype's `src/coverage.ts` contains `parseCoverageReport()` which:

- Expects artifact at `coverage/coverage-final.json`
- Reads Istanbul-format fields: `s`, `f`, `b`, `fnMap`, `branchMap`
- Maps these to the prototype's internal coverage data model

**Result: compatible.** No parser changes required. The v8 provider with `--coverage.reporter=json` produces the exact format the parser already consumes.

## Effect of `coverage.reportOnFailure`

This is the critical finding:

| Condition | `reportOnFailure` | Test failure? | Artifact emitted? |
|-----------|-------------------|---------------|-------------------|
| Exp1 (baseline) | default (false) | Yes (1) | ✗ |
| Exp2 (report-on-failure) | true | Yes (1) | ✓ |
| Exp3 (explicit v8) | true | Yes (1) | ✓ |
| Exp4 (passing subset) | true | No (0) | ✓ |

`coverage.reportOnFailure` defaults to `false` in Vitest 4. When any test fails in the suite, coverage reports are suppressed unless this flag is explicitly enabled. The v8 provider itself works correctly — it emits Istanbul JSON when the reporter is requested and the report is not suppressed by failure.

## Corrected Root Cause

**WP4R.1's root cause was incorrect.** The original hypothesis was that h3 was missing `@vitest/coverage-istanbul` and therefore could not emit Istanbul JSON. This is false.

The actual root cause is **failed-test suppression**:

1. h3's test suite contains 1 failing test (`getRequestFingerprint` in `test/utils.test.ts`)
2. `coverage.reportOnFailure` defaults to `false` in Vitest
3. Because a test failed, the coverage report was suppressed — no artifact was written
4. Hono's test suite had zero failures, so its report was emitted even without `reportOnFailure`
5. The v8 provider with `--coverage.reporter=json` CAN emit Istanbul JSON — it works correctly when not suppressed

## WP4R.1 h3 Dependency Conclusion

**REJECTED.** h3 does not require `@vitest/coverage-istanbul`. The existing `@vitest/coverage-v8` provider, with explicit `--coverage.reporter=json` and `--coverage.reportOnFailure`, emits fully compatible Istanbul JSON.

## Next-Step Recommendation

Add explicit Istanbul path configuration to the prototype's coverage invocation:

1. Set `--coverage.reporter=json` to request the json reporter (which outputs Istanbul format)
2. Set `--coverage.reportOnFailure` to prevent suppression on failing test suites
3. Set `--coverage.reportsDirectory=coverage` to place the artifact where `parseCoverageReport()` expects it
4. No dependency changes needed — `@vitest/coverage-v8` alone is sufficient

This aligns with the prototype's existing parser and avoids introducing `@vitest/coverage-istanbul` as a dependency.

## Decision

V8 JSON REQUIRES REPORT-ON-FAILURE — ADD EXPLICIT ISTANBUL PATH
