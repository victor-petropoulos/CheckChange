# WP4R.1 Coverage Artifact Discovery — Results

## 1. Exact Reproduction of WP4R Coverage Failure

WP4R invoked `vitest --run --coverage` (or `pnpm test -- --coverage` for nx targets) on five present-intent repos. All five searches for `coverage/coverage-final.json` (via `src/coverage.ts` → `parseCoverageReport`) returned `NOT_EVALUATED`. WP4R reported **7 INCOMPLETE** (no coverage artifact) and **44 NOT_EVALUATED** (coverage present-intent but artifact absent). The failure was universal across h3 (×2), hono (×2), and nx (×1).

## 2. Installed Vitest / Coverage-Provider Versions

| Repo | Vitest | Coverage Provider | Provider Version |
|------|--------|-------------------|------------------|
| h3 | 4.1.11 | `@vitest/coverage-v8` | 4.1.11 |
| hono | 4.1.11 | `@vitest/coverage-v8` | 4.1.11 (resolved from ^4.1.7) |

Both repos use the v8 provider. Neither has `@vitest/coverage-istanbul` installed.

## 3. Native Coverage Configuration

**h3** (`vitest.config.mjs`):
```js
coverage: {
  include: ["src/**/*.ts"],
  exclude: ["src/types/**", "src/_deprecated.ts", "src/_entries/**"],
}
```
No `provider`, `reporter`, or `reportsDirectory` specified. Relies on vitest v4 defaults.

**hono** (`vitest.config.ts`):
```ts
coverage: {
  enabled: true,
  provider: "v8",
  reportsDirectory: "./coverage/raw/default",
  reporter: ["json", "text", "html"],
}
```
Explicit provider, reportsDirectory, and reporters configured.

## 4. Complete Relevant Artifact Inventory

**h3** — zero artifacts across all experiments. Searched for:
`coverage-final.json`, `coverage.json`, `coverage-summary.json`, `lcov.info`, `lcov-report/`, `clover.xml`, `cobertura*.xml`, `*.lcov`. Result: **none found** in any experiment. Only `node_modules/@vitest/coverage-v8` exists on disk.

**hono** — one primary artifact:
- `coverage/raw/default/coverage-final.json` — 1,593,373 bytes, 159 files, 6,602 statements, 1,130 functions, 2,074 branches. Valid Istanbul JSON (all entries have `path`, `s`, `f`, `b`, `fnMap`, `branchMap`).
- Supplementary: `coverage/raw/default/index.html`, per-file HTML reports under `src/` and `build/`.
- No `lcov.info`, `clover.xml`, or `cobertura*.xml` produced (config specifies only `['json','text','html']`).

## 5. Exact Commands Tested

**h3**:
| Exp | Command | Source |
|-----|---------|--------|
| 1 | `npx vitest --run --coverage` | `experiments/wp4r.1/h3/stdout-wp4r-command.txt` |
| 3 | `pnpm test` (lint+typecheck+vitest --run --coverage) | native script |
| 4 | `npx vitest --run --coverage --coverage.reporter=json` | reporter override |
| 4b | `npx vitest --run --coverage --coverage.reportsDirectory=coverage` | path override |
| 4c | `npx vitest --run --coverage --coverage.provider=v8 --coverage.clean=false` | explicit v8 + no-clean |

**hono**:
| Exp | Command | Source |
|-----|---------|--------|
| 1 | `npx vitest --run --coverage` | `experiments/wp4r.1/hono/stdout-wp4r-command.txt` |
| 3 | `npm run coverage` | native script |
| 4 | `npx vitest --run --coverage --coverage.reporter=json` | reporter override |
| 4b | `npx vitest --run --coverage --coverage.reportsDirectory=coverage` | path override |

## 6. Exit Codes

| Repo | Command | Exit Code | Notes |
|------|---------|-----------|-------|
| h3 | `npx vitest --run --coverage` | **1** | 1 test failure in `test/utils.test.ts` (`getRequestFingerprint` IP format mismatch). Tests ran to completion. |
| h3 | `pnpm test` | **1** | Same failure. |
| h3 | `--coverage.reporter=json` | 0 | No test failures on this invocation. |
| h3 | `--coverage.reportsDirectory=coverage` | 0 | No output despite exit 0. |
| h3 | `--coverage.provider=v8 --coverage.clean=false` | 0 | No output. |
| hono | `npx vitest --run --coverage` | **0** | 4,934 tests passed, 44 skipped. |
| hono | `npm run coverage` | 0 | Identical to Exp1. |
| hono | `--coverage.reporter=json` | 0 | Redundant — same output. |
| hono | `--coverage.reportsDirectory=coverage` | 0 | Writes to prototype-expected path. |

## 7. Whether Tests Actually Ran

**h3**: **Yes** — 2,732 tests across 73 test files. 1 failure (`test/utils.test.ts`). Stdout confirms "Coverage enabled with v8".

**hono**: **Yes** — 4,934 tests across 147 test files (main + 6 subprojects). All passed. Coverage table printed in stdout.

## 8. Formats Produced

**h3**: **None.** v8 provider is completely silent — no files, no directories, no errors.

**hono**: **Istanbul JSON** (`coverage-final.json`) + HTML reports. The JSON is valid Istanbul format (confirmed: all 159 entries have `path`, `s`, `f`, `b`, `fnMap`, `branchMap`). No lcov, clover, or cobertura.

## 9. Whether CLI-Only Istanbul JSON Generation Works

**h3**: **No.** `@vitest/coverage-istanbul` is not installed. `--coverage.provider=istanbul` requires the package. `--coverage.reporter=json` with v8 provider is silently accepted but produces no output. No CLI-only path exists.

**hono**: **Yes.** `--coverage.reportsDirectory=coverage` writes `coverage/coverage-final.json` at the prototype-expected path. No repo modification needed.

## 10. Target-Modification Classification

| Repo | Classification | Rationale |
|------|---------------|-----------|
| h3 | **TARGET DEPENDENCY CHANGE REQUIRED** | Needs `@vitest/coverage-istanbul` installed. No CLI flag produces Istanbul JSON with v8 provider alone. |
| hono | **TEMPORARY CLI OPTION ONLY** | `--coverage.reportsDirectory=coverage` fixes the path mismatch. No config or code changes needed. |

## 11. Whether Current Attribution Can Consume the Result

`src/coverage.ts` hardcodes `join(cwd, 'coverage/coverage-final.json')` and calls `parseCoverageReport()`. `src/attribution.ts` expects Istanbul file-coverage model with per-file `s`, `f`, `b`, `fnMap`, `branchMap`.

| Repo | Consumable by current attribution? | Reason |
|------|-----------------------------------|--------|
| h3 | **No** | No artifact produced at all. |
| hono (default config) | **No** | Artifact exists at `coverage/raw/default/coverage-final.json`, not `coverage/coverage-final.json`. Path mismatch. |
| hono (with `--coverage.reportsDirectory=coverage`) | **Yes** | Writes to `coverage/coverage-final.json`. Valid Istanbul JSON. `parseCoverageReport` succeeds. |

## 12. Comparison of Contracts A–D

### Contract A — Keep Exact Artifact (`coverage/coverage-final.json`)
- **Implementation complexity**: Minimal — no code changes.
- **Portability**: Fails for hono (wrong path) and h3 (no artifact). Both observed failures in WP4R.
- **User burden**: Requires users to configure vitest to write to `coverage/`. Not guaranteed.
- **Determinism**: High if config is correct; zero if config differs.
- **Ambiguity**: Low — single known path.
- **Consistency with "consume analysis"**: Good — simple, single-path contract.
- **Verdict**: Smallest contract but **fails both observed failures** (h3 silent, hono wrong path).

### Contract B — Explicit Istanbul Path (`--coverage-file` flag)
- **Implementation complexity**: Low — add CLI flag, override `coveragePath` in `src/coverage.ts`.
- **Portability**: Fixes hono deterministically (user passes correct path). Still fails h3 (no artifact to point to).
- **User burden**: User must know the artifact path and pass it explicitly.
- **Determinism**: High — explicit path, no search.
- **Ambiguity**: None — user specifies exact file.
- **Consistency with "consume analysis"**: Good — user controls location, prototype consumes deterministically.
- **Verdict**: Fixes hono portability failure. h3 still fails (no artifact regardless of path).

### Contract C — Deterministic Discovery (small explicit set of filenames, search common dirs)
- **Implementation complexity**: Medium — add discovery logic that searches for known Istanbul filenames (`coverage-final.json`, `coverage.json`, `lcov.info`) in common directories (`coverage/`, `coverage/raw/`, `coverage/raw/default/`, `coverage/lcov-report/`).
- **Portability**: Fixes hono automatically (finds `coverage/raw/default/coverage-final.json`). Still fails h3 (no artifact in any directory).
- **User burden**: Low — no flags needed. Works out of the box for most configs.
- **Determinism**: Medium — discovery has fallback ordering; ambiguous if multiple files found.
- **Ambiguity**: Moderate — which file to use if multiple exist? Need tiebreaking rules.
- **Consistency with "consume analysis"**: Acceptable — still targets Istanbul JSON, just discovers it.
- **Verdict**: Fixes hono without user action. Adds search ambiguity vs B. h3 still fails.

### Contract D — Multiple Formats (accept lcov, clover, cobertura in addition to Istanbul JSON)
- **Implementation complexity**: High — need format detection, multiple parsers, or unified adapter layer.
- **Portability**: Speculative — no evidence that lcov would help. h3 produces **no format at all** (v8 silent). hono already produces Istanbul JSON.
- **User burden**: Low — more formats accepted.
- **Determinism**: Low — multiple formats, multiple parsers.
- **Ambiguity**: High — which format to prefer?
- **Consistency with "consume analysis"**: Weaker — prototype's `parseCoverageReport` is Istanbul-specific. Adding lcov/clover requires new parsing logic.
- **Verdict**: **Not justified by evidence.** h3's problem is no output (format-agnostic), not wrong format. hono already produces the format prototype expects. D expands scope without solving the observed failures.

### Summary Table

| Contract | Fixes h3? | Fixes hono? | Complexity | Ambiguity | User burden |
|----------|-----------|-------------|------------|-----------|-------------|
| A (exact artifact) | No | No | Minimal | Low | High (config) |
| B (explicit path) | No | Yes | Low | None | Medium (flag) |
| C (discovery) | No | Yes | Medium | Moderate | None |
| D (multiple formats) | No | No (already works) | High | High | None |

## 13. Smallest Recommended Contract

**ADD EXPLICIT ISTANBUL PATH**

Rationale:
- Fixes the observed hono portability failure (wrong directory) deterministically with no ambiguity.
- Preserves prototype's "consume analysis" principle — single known format, single known path (user-provided).
- h3 fails under ALL contracts A–C because it produces **no artifact at all**. h3 requires `@vitest/coverage-istanbul` — a target dependency change — which is outside the scope of any contract change.
- Contract C (discovery) is close second but adds search ambiguity (which file to use if multiple exist, fallback ordering) without solving anything B doesn't.
- Contract D is not justified: no evidence that lcov/clover would help h3 (silent v8), and hono already produces the format prototype expects.

## 14. Operational Implications

- **h3 repos**: Any prototype run will report `NOT_EVALUATED` until `@vitest/coverage-istanbul` is installed and configured. This is a project-level configuration issue, not a prototype bug.
- **hono repos**: With Contract B (`--coverage-file`), prototype can consume coverage immediately. No repo modification needed.
- **nx repos**: WP4R showed nx targets also fail (same root cause — no Istanbul JSON at expected path). Contract B would fix these if the artifact exists elsewhere.
- **Prototype code**: Contract B requires adding a `--coverage-file` CLI flag and overriding `coveragePath` in `src/coverage.ts` when provided. No changes to `parseCoverageReport` or attribution logic.

## 15. Unanswered Questions

1. **Is h3's silent v8 universal or project-specific?** hono proves v8 CAN produce Istanbul JSON when `reporter` is configured. h3's silence appears to be a missing `reporter` config, not a v8 provider limitation. However, untested: does v8 produce output with `reporter: ['json']` configured in vitest.config.mjs?
2. **Does `@vitest/coverage-v8` in vitest 4.x always require explicit `reporter: ['json']` to produce output?** If so, this is a vitest behavior change from v3 that should be documented.
3. **What is the coverage behavior in nx targets?** WP4R showed nx also fails. nx may use a different test runner (jest?) or vitest with different defaults. Needs investigation.
4. **Are there other common coverage output paths?** Beyond `coverage/` and `coverage/raw/default/`, do projects use `coverage/lcov-report/`, `coverage/coverage/`, or other conventions? Discovery (Contract C) would need this data.

## 16. Next-Milestone Recommendation

**ADD EXPLICIT ISTANBUL PATH**

Implement Contract B: add `--coverage-file` CLI flag to prototype, override `coveragePath` in `src/coverage.ts` when provided. This fixes the hono portability failure (the only case where an artifact exists but at a non-standard path) with minimal code change, no ambiguity, and full determinism.

h3's failure (no artifact) requires a target dependency change (`@vitest/coverage-istanbul`) which is outside prototype scope. Mark h3-class repos as `NOT_EVALUATED` until they install the istanbul provider.

Do not implement Contract C (discovery) — adds ambiguity without solving additional observed failures. Do not implement Contract D (multiple formats) — no evidence it would help, and scope expansion is unjustified.

If future repos show artifacts at multiple non-standard paths (not just `coverage/raw/default/`), revisit Contract C.

---

*Sources: `experiments/wp4r.1/h3/environment.md`, `experiments/wp4r.1/h3/artifact-inventory.md`, `experiments/wp4r.1/h3/stdout-wp4r-command.txt`, `experiments/wp4r.1/hono/environment.md`, `experiments/wp4r.1/hono/artifact-inventory.md`, `experiments/wp4r.1/hono/stdout-wp4r-command.txt`, `src/coverage.ts`, `src/attribution.ts`, `docs/research/WP4R_DECISION_SUMMARY.md`, `docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md`.*

ADD EXPLICIT ISTANBUL PATH
