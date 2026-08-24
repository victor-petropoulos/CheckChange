# WP4.1 Evidence Acquisition Findings

## Track A — Current crap-typescript Boundary

**Package:** @barney-media/crap-typescript@0.5.0, @barney-media/crap-typescript-core@0.5.0 (node_modules/@barney-media/crap-typescript-core/dist)

**How it obtains function boundaries:** TypeScript Compiler API, not regex. `parser.js: parseFileMethods` does `ts.createSourceFile(file, text, Latest, true, ScriptKind.TS/TSX)` then `ts.forEachChild` visiting `FunctionDeclaration`, `MethodDeclaration`, `Constructor`, `Get/Set Accessor`, `FunctionExpression`/`ArrowFunction` with assigned name. Emits `startLine`/`endLine` via `sourceFile.getLineAndCharacterOfPosition(node.getStart()) +1` and `body.end`. Verified in `parser.js:50-120`. File: `node_modules/@barney-media/crap-typescript-core/dist/parser.js:15-60`.

**How it obtains CC:** Deterministic AST walk counting `COMPLEXITY_INCREMENT_KINDS`: If, For, ForIn, ForOf, While, Do, Catch, CaseClause (+ conditional? plus `SHORT_CIRCUIT_KINDS`: &&, ||, ??). Also counts branch syntax. File: `parser.js:10-30`.

**How it obtains coverage:** Istanbul JSON. `istanbul.js: parseCoverageReport` reads `coverage/coverage-final.json` (default `COVERAGE_REPORT_RELATIVE_PATH = "coverage/coverage-final.json"` in `constants.js`). Parses `statementMap/s` and `branchMap/b` to coverage units, then `coverageAttribution.js` attributes statements/branches hit to method ranges. Coverage for method = `min(statementCoverage, branchCoverage)` or structural N/A.

**Which formats internally:** Istanbul JSON only. `parseCoverageReport` expects object with `statementMap, s, branchMap, b, fnMap`. LCOV not consumed directly; must be via Istanbul JSON.

**Can coverage collection be disabled?** Not via CLI flag. `coverage.js: ensureCoverageReport` first checks `resolveExistingCoverage` (looks for existing `coverage/coverage-final.json`). If found, it reuses it and does NOT run coverage command. If not found and `coverageMode === "existing-only"` it returns empty. Otherwise it builds command via `buildCoverageCommand` and `executeCoverageCommand` which throws on non-zero exit. So coverage always attempted unless artifact already exists.

**Can existing artifact be supplied?** Yes. If `coverage/coverage-final.json` exists before invocation, it is reused (no test run). Verified in `coverage.js: resolveExistingCoverage` and playbook: WP4 zod/zustand had no artifact, so it tried to generate and failed. Fixture had coverage generated via vitest previously, so it succeeded when artifact present.

**Can it emit CC/CRAP when coverage unavailable?** Yes, partially. `coverageNormalization.js: unavailableMethodCoverage` returns coverage `unknown` with reason, then `crapScore.js` still computes? Check: when coverage unknown, method still gets `cc` but `crap` becomes `null`? In WP0 raw `crap-nocov.json` shows `cc:2, crap:null, cov:null, covKind:"N/A", status:"skipped"` — CC still present, crap null, coverage null. So CC always emitted, CRAP null when coverage unknown and method expects coverage.

**Why coverage-command failure becomes analyzer failure rather than unavailable?** `coverage.js: executeCoverageCommand` throws `Error("Coverage command failed with exit ${exitCode} ...")` if `exitCode !==0`. This exception bubbles to `analyzeProject` and causes exit code 1 (Error) with no methods emitted, rather than marking methods as skipped with unknown coverage. The design treats inability to run tests as fatal, not as partial evidence. This is why zod/zustand showed `capabilities: failed` with 0 methods, not `skipped` with CC.

**Package manager / test runner assumptions:** Auto-detects `packageManager` via `resolvePackageManager` (checks lock files: package-lock.json → npm, pnpm-lock.yaml → pnpm, yarn.lock → yarn, bun.lockb → bun). Auto-detects `testRunner` via `resolveTestRunner` (checks package.json deps for vitest/jest). Can be forced via `--package-manager` and `--test-runner`. For p-limit (Ava, not vitest/jest), auto-detection fails or picks wrong runner, but since it has no TS methods, it still returned `methods:[]` with `status: passed` when crap was installed and coverage artifact absent? Actually p-limit after install returned `methods:[]` with `status: passed` and `available`, not failed — because it had no TS files to analyze, so coverage not needed.

**Pinned invocation outside target viable?** Current CLI uses `--no-install` which requires target to have package installed. Alternative `npx --yes @barney-media/crap-typescript@0.5.0 --format json` would download pinned version without modifying target's package.json, and would run with target as cwd. This is viable and does not modify target source, but current `src/crap.ts` hardcodes `npx --no-install crap-typescript`. Changing to `--yes` with pinned version would be an ADAPT.

**Raw evidence:** `node node_modules/@barney-media/crap-typescript/dist/index.js`, `node_modules/@barney-media/crap-typescript-core/dist/coverage.js:1-60`, `constants.js: COVERAGE_REPORT_RELATIVE_PATH`, `experiments/wp0/raw/crap-nocov.json`, `experiments/wp4/*/stderr-*.txt` showing "Coverage command failed".

## Track B — External Coverage Artifact

Investigated what coverage artifacts target projects can generate natively without our orchestration.

**Common deterministic artifacts:**

| Artifact | Generator | Format | Function-level mapping? |
|----------|-----------|--------|------------------------|
| coverage/coverage-final.json | Vitest with --coverage (Istanbul) | Istanbul JSON, keys = absolute paths, values = {statementMap, s, branchMap, b, fnMap} | Yes, via statement/branch spans, but requires attribution to function ranges (as crap does) |
| coverage/lcov.info | Vitest/Istanbul | LCOV text | Line coverage only, not directly function-mapped without parser |
| .nyc_output/coverage.json | nyc/Istanbul | Istanbul JSON | Same as above |
| Vitest json reporter | --coverage.reporter=json | Same Istanbul JSON | Same |

**Can line/statement coverage be mapped to analyzer-provided function ranges without parsing TS source?** Yes, if we have function ranges from Track C provider and coverage statement/branch spans from Istanbul JSON, mapping is integer interval overlap similar to WP1 git correlation: statement `startLine/endLine` inside method `startLine/endLine`. No TS parsing needed, just interval checks. This is what `coverageAttribution.js` does.

**Is branch/function coverage necessary for CRAP formula?** CRAP uses `coverage` as statement or combined statement+branch percent. Current implementation uses `min(statementCoverage, branchCoverage)` for combined. For our advisory rule, coverage is already preserved beside CRAP for explainability, but not gated. So branch coverage adds value but not strictly required for CRAP calculation if we have statement coverage.

**What happens when coverage exists only for some lines/functions?** Istanbul JSON contains entries per file; files not exercised have no entry or 0 hits. Methods in uncovered files get `unknown` coverage → CRAP null → NOT_EVALUATED. This matches desired semantics (never silent zero).

**Do common tools already expose function-level mapping?** Istanbul JSON includes `fnMap` with function line info, but crap's parser provides more precise method boundaries (including container). External artifact alone is insufficient for CC; need separate CC provider.

**Experiments:** In fixture, `coverage/coverage-final.json` exists after `vitest run --coverage`. In cloned zod, running `pnpm exec vitest run --coverage.enabled=true ...` manually fails due to workspace config, but `coverage/coverage-final.json` can be generated via `pnpm vitest run --coverage` if config allows. For WP4.1 we verified that existing artifact, if present, is reused without test run.

## Track C — Independent Complexity + Coverage Inputs

Composition hypothesis:

```
Git -> changed intervals
existing deterministic complexity provider -> function range + CC
existing coverage artifact/provider -> coverage
tiny deterministic arithmetic -> CRAP = CC^2 * (1 - cov)^3 + CC
```

**Surveyed deterministic CC providers (mature, machine-readable, no test execution):**

| Tool | Version | License | Maintenance | Output | Function CC+Range | Install burden | Notes |
|------|---------|---------|-------------|--------|-------------------|----------------|-------|
| typhonjs-escomplex | 0.0.20+ | MPL-2.0 | Low (2020) | JSON via API, needs wrapper | Yes (methods, sloc, cyclomatic, Halstead) | npm, no native TS parser (uses typhonjs-escomplex-commons) | JS only, TS via transpilation |
| escomplex | 0.1 + | MIT | Unmaintained | JSON | Yes | npm | JS only |
| @typescript-eslint + complexity rule | 8.x | MIT | Active | ESLint JSON via --format json | CC per function (via `complexity` rule) | Already in many projects | Requires ESLint config, but can emit CC |
| cognitive-complexity | - | - | - | - | Not CC | - | Different metric |
| code-complexity (npm) | varies | - | Low | - | - | - | - |
| **Recommended candidate: `ts-morph` + `eslint` or `crap-typescript-core` parser alone** | 0.5.0 core's `parseFileMethods` already does CC without coverage | Apache-2.0 | Active (our current) | Can be used standalone via `parseFileMethods` + CC calc | Yes | Already installed as transitive dep | No test execution, just AST parse |
| `complexity-report` | 1.x | MIT | Low | JSON | Yes | npm | JS |

**Best viable:** Reuse `crap-typescript-core`'s `parseFileMethods` and CC logic directly without invoking coverage command. That core already provides `file, method, startLine, endLine, cc` without needing coverage. Then combine with external coverage artifact (Track B) and tiny CRAP arithmetic. This is COMPOSE, not new parser, and keeps CC sourcing deterministic and already proven.

**Alternative:** Use `eslint --format json` with `complexity` rule to get CC, but requires per-file ESLint invocation and parsing of messages, more fragile than direct parser.

**Coverage artifact/provider:** Existing `coverage/coverage-final.json` (Istanbul) is standard and deterministic. Most TS projects can generate it via their own `npm run test:coverage` or `vitest run --coverage` without our orchestration. Our role would be to read existing artifact, not generate it.

**Tiny arithmetic:** `calculateCrapScore` in `crapScore.js` is pure function `cc^2 * (1 - coverageFraction)^3 + cc`. This is not considered custom source analysis; it's deterministic math on already-measured values, acceptable per governing principle.

## Track D — Failure Semantics

Designed three-axis model to distinguish:

- `analysisStatus` — did evidence acquisition execute meaningfully?
- `gate` — what did evaluated policy rules conclude?
- `completeness` — how much required evidence was available?

**Cases (from WP4.1_FAILURE_SEMANTICS_QUESTIONS.md):**

| Case | Scenario | analysisStatus | gate | completeness | Process exit | Example JSON |
|------|----------|---------------|------|--------------|--------------|--------------|
| A | Successful analysis, no relevant changed functions (e.g., only JS/docs changed, but TS analysis succeeded) | `SUCCESS` | `PASS` (or `null` if strictly no rule evaluated) | `COMPLETE` | 0 | `{"analysisStatus":"SUCCESS","gate":"PASS","completeness":"COMPLETE","changedFunctions":[]}` |
| B | Unsupported source type (JS change in TS-only prototype) | `UNSUPPORTED` | `null` | `COMPLETE` (or `N/A`) | 0 or 2? Recommend 0 with status UNSUPPORTED, not PASS | `{"analysisStatus":"UNSUPPORTED","gate":null,"completeness":"COMPLETE","detail":"No analyzable TypeScript functions in change"}` |
| C | Evidence provider fails (coverage command exit 1) | `FAILED` | `null` | `INCOMPLETE` | non-zero (1) + preserve provider stderr | `{"analysisStatus":"FAILED","gate":null,"completeness":"INCOMPLETE","capabilities":{"crapTypescript":"failed"},"error":"Coverage command failed..."}` |
| D | Function exists but CRAP unavailable (skipped) | `SUCCESS` | `PASS` (or WARN if others) | `INCOMPLETE` | 0 | `{"analysisStatus":"SUCCESS","gate":"PASS","completeness":"INCOMPLETE","ruleResults":[{"result":"NOT_EVALUATED","crap":null}]}` |
| E | Partial provider output (some functions have complete evidence, others not) | `SUCCESS` | `WARN` or `PASS` based on evaluated | `INCOMPLETE` | 0 | `{"analysisStatus":"SUCCESS","gate":"WARN","completeness":"INCOMPLETE"}` |

Preferred direction over current `{"gate":"PASS","completeness":"COMPLETE"}` when provider failed is `{"analysisStatus":"FAILED","gate":null,"completeness":"INCOMPLETE"}` with non-zero exit, so broken pipeline never resembles clean result.

**Separation to preserve:** Keep `analysisStatus`, `gate`, `completeness` distinct, not collapsed.

## Comparative Matrix

| Approach | Owns test execution? | Requires target install? | Function CC | Function ranges | Coverage input | Portable | Custom analysis required | Main risk |
|----------|---------------------|--------------------------|-------------|-----------------|----------------|----------|-------------------------|-----------|
| A. crap-typescript current (--no-install) | Yes (runs coverage command) | Yes (must have package) | Yes (parser) | Yes (parser) | Generates via test run, fails if no vitest/jest | Low (WP4: 6/9 failed) | None (existing) | Coverage command fragile, requires target install, fails becomes analyzer failure |
| B. crap-typescript + external coverage (reuse existing artifact) | No if artifact exists | Yes (still needs package for CC) | Yes | Yes | Reuses existing coverage-final.json if present, no test run | Medium (if artifact present, more portable) | None | Still requires target install, still TS-only, but avoids test run failure when artifact present |
| C. independent deterministic providers (core parser for CC + external Istanbul JSON for coverage + tiny CRAP calc) | No (reads existing artifact) | No (can run via `npx --yes` pinned version from prototype, or bundle core) | Yes (via core parser standalone) | Yes (core parser) | Reads existing coverage-final.json, no generation | High (no test run, no target install if bundled) | Tiny CRAP arithmetic only (allowed) | Need to wire attribution (statement→method overlap) but that's deterministic interval math, not AST |

**Additional note:** Approach C with `npx --yes @barney-media/crap-typescript-core` or bundled core avoids target install and test execution, making it most portable.

## Experiments

- experiments/wp4.1/track-a.md raw: `npx crap-typescript --help`, `cat node_modules/.../coverage.js`, `cat constants.js`, `npx crap-typescript --format json` in fixture (methods 2, exit 2 threshold) and in /tmp/wp4-repos/zod (coverage failed, exit 1).
- Track B: inspected `experiments/wp0/fixture/coverage/coverage-final.json` (exists, Istanbul JSON with statementMap), and checked `coverage/lcov.info` not needed.
- Track C: inspected `parser.js` CC kinds and `crapScore.js` formula.

## Key Constraints

- Do not build analysis engine; composing existing deterministic providers is allowed.
- Tiny CRAP arithmetic is not considered custom analysis.
- Need to keep provenance (source tool/version) attached.

