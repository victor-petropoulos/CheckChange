# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.6] - 2026-11-11

### Documentation
- The `using-checkchange` skill (global + repo copy) now leads with `--auto-coverage` auto-detection for bun: `checkchange check --auto-coverage` detects bun (bunfig.toml or `bun --version` probe, builtin since 0.5.4; detection also requires at least one repo source file matching a provider extension — `.ts/.tsx/.js/.jsx/.mjs/.cjs`) and runs `bun test --coverage --coverage-reporter=lcov` itself → `coverage/lcov.info`. The manual `--coverage-reporter=lcov` recipe is kept as secondary guidance when not using `--auto-coverage`.

## [0.5.5] - 2026-11-11

### Fixed
- `--auto-coverage` no-runner hint now names Bun: install Bun (`bun` on PATH or a `bunfig.toml`) to use the builtin `bun` test runner. The 0.5.4 hint omitted it, so Bun-only repos were told to install a JS/Python/.NET toolchain they do not use.
- `package.json` `files` array now lists `README.md` explicitly. Verified during this release: `npm pack checkchange@0.5.4` DOES contain `package/README.md` (npm always includes the root README regardless of `files`), and the lean snapshot ships it too — so no 0.5.4 artifact was actually missing it. The explicit entry is defensive documentation of intent, not a bug fix.

### Documentation
- README gained the Bun coverage recipe (`bun test --coverage --coverage-reporter=lcov` → `coverage/lcov.info`) and the `--auto-coverage` flag row now lists bun among the supported runners.

## [0.5.4] - 2026-11-11

### Added
- Builtin `bun` test runner (`BUN_RUNNER`) for the JavaScript and TypeScript providers: detected via `bunfig.toml` plus a `bun --version` probe, runs `bun test --coverage --coverage-reporter=lcov`, and reads `coverage/lcov.info`. The probe is `bun --version`, not `bun test --version` — the latter prints the banner then RUNS THE SUITE and exits non-zero on no/failing tests, so a probe must not execute tests. Bare `bun test --coverage` writes NO artifact (default reporter `text`); lcov is required.
- The `using-checkchange` agent skill gains a bun recipe: `bun test --coverage --coverage-reporter=lcov` then `checkchange check --coverage-file coverage/lcov.info --json`. The lcov provider reads `DA:` line-hit records and ignores `FN:` (bun emits none). Also documents the gate self-disable trap: a diff containing unsupported-extension files (e.g. `package-lock.json`, reformatted `package.json`) can make checkchange evaluate 0 functions → gate `NOT_EVALUATED` with `gateReason no-supported-file-extensions`; keep such files out of the diff.

### Fixed
- `--auto-coverage` now works for bun test projects: the builtin runner drives `bun test --coverage --coverage-reporter=lcov` and consumes `coverage/lcov.info`, so no manual `--coverage-file` is needed. vitest cannot run `bun:test` suites — don't try it.

## [0.5.3] - 2026-11-09

### Added
- `diagnostics.functionCoverage` on `EvidenceOutput`: optional LCOV-only side output carrying per-`SF:`-record FN/FNDA function-hit data (parsed into a side bag, never into `FileCoverage.functions`). Diagnostic-only; zero gate/CRAP impact. (commit 492b627)

### Changed
- Explicit `--coverage-file` pointing at garbage (`.info`/`.lcov` with 0 parsed records and no `SF:`/`DA:` content token) now reports `analysisStatus FAILED`, `gate FAILED`, `completeness INCOMPLETE`, `coverageErrorReason: "malformed"`, `stderr: Error: coverage artifact malformed`, exit 1 — previously lenient `SUCCESS`/`NOT_EVALUATED`. Valid zero-record artifacts carrying `SF:` stay lenient; auto-detect lane untouched. (commit 3a5e905; user-visible behavior change — README already documents it)

### Fixed
- Coverage attribution seam: absolute coverage-map keys matched against relative git-diff paths via exact `resolve(cwd, rel)` (tier 1 = attribute, >1 = decline, 0 = legacy suffix fall-through); fixes `coverageKind N/A` for suffix-ambiguous paths on consumed repos. Backward compatible when `cwd` omitted. (commit 845bc1e)

## [0.5.2] - 2026-11-01

### Added
- The `using-checkchange` agent skill (`.agents/skills/using-checkchange/SKILL.md`) now ships
  in the npm tarball and the lean repo snapshot, so agent integrations can install the
  usage contract alongside the CLI (commit 3a75274). npm `checkchange@0.5.1` predates
  this and does not contain the skill.

## [0.5.1] - 2026-11-01

### Added
- Overview `checkchange --help` now states that flags are per-command, so
  probing the top-level help no longer hides `check`-scoped flags such as
  `--format sarif` (commit 63cc9fe).

### Changed
- `doctor`, `explain`, and `trace` now reject unknown flags with
  `Error: Unknown option <arg>` and exit 1, matching `delta` and
  `prepare-repo` (commit fb51d05). Previously stray flags were silently
  ignored.

### Fixed
- Value-taking flags are parsed inline-or-next consistently: `--base=`,
  bare `--base`, and `--provider-config=x` behave predictably;
  `--crap-threshold abc` now errors instead of producing a `NaN` threshold
  (commit fb51d05).
- `check`/`explain`/`trace` run outside a git repository now report
  `Not a git repository — run from a repo root or initialize one with `git init``
  instead of the misleading `Cannot resolve base reference: <ref>`
  (commit 2d9c4ab).
- SARIF sidecar carries the canonical `$schema` key
  (`https://json.schemastore.org/sarif-2.1.0.json`) so strict SARIF
  validators accept the document (commit 648a4fc).

## [0.5.0] - 2026-11-01

### Breaking
- `gate` field of the evidence output is never `null`. It is now one of
  `PASS`, `WARN`, `NOT_EVALUATED`, `FAILED`. Consumers comparing `gate === null`
  must switch to `gate === 'NOT_EVALUATED'` / `'FAILED'`.
- Added optional `gateReason` field explaining non-PASS gates.

### Changed
- Exit codes unchanged: `FAILED`/`WARN` → 1, `PASS`/`NOT_EVALUATED` → 0.

## [0.4.4] - 2026-10-09

### Fixed
- C# primary-constructor type declarations (`record X(P)`, `record struct X(P)`, `class X(P)`)
  are parsed as containers instead of methods. The fallback parser no longer emits a phantom
  method for the type head, and real members of those types are now reported (commit 0bae14d).
- Version provenance constants aligned to 0.4.4 (`src/evidence.ts`, `src/rules.ts`,
  `src/crapCalc.ts`, `src/complexity-providers/csharpDescriptorProvider.ts`).

## [0.4.3] - 2026-10-08

### Added
- C# / .NET support (first language after TypeScript and Python)
  - Complexity: rich structural probe for `.cs`, with a line-based fallback parser when
    no native engine is available. Both routes report on the same functions, so a repo
    with no complexity provider still gets `cc`/`crap` instead of an unsatisfied gate.
  - Coverage: Coverlet **Cobertura** and **LCOV** (`coverage.info`) artifacts are parsed.
    Cobertura is also discovered automatically under `TestResults/`, so a repo whose
    artifact lands in a per-run directory needs no flags; `--coverage-file <path>`
    always works for an explicit path.
  - Test runner: `dotnet test --collect:"XPlat Code Coverage"` is detected and run via
    `prepare-repo`, with `*.csproj` / `*.sln` as the config-file probes.
  - `git` and `complexity` capabilities report `available`; per-stage evidence quality
    is recorded in the `--json` diagnostics lineage so a degraded run (missing provider,
    unreadable coverage artifact) is diagnosable instead of silently scored.
- `prepare-repo` subcommand: detect → plan → approve → install → verify test runners
  - `--dry-run` preview (human or `--json`), safe in non-TTY
  - `--yes` non-interactive execution
  - Agent protocol: `--dry-run --json` first, then `--yes`
  - Idempotent: re-run anytime

### Known limitations
- A Coverlet Cobertura artifact always lands in a per-run `TestResults/<guid>/`
  directory whose name is generated by `vstest`, not Coverlet. No literal config path
  can name it. Discovery is handled by the automatic `TestResults` scan or by passing
  `--coverage-file`; the `artifact` field of the built-in `dotnet` runner stays inert.
- The `TestResults` scan runs in BOTH `readCoverage` AND the cached reader
  (`src/cache.ts:501` calls `scanCoberturaUnderTestResults`), so cached parity holds:
  a cached C# run now sees the same artifact as uncached. Residual limit: when the
  scan finds an artifact that then fails conversion, cached returns `{ available: false }`
  while uncached returns `{ available: true, error: true, reason: 'malformed' }` — the
  cached path has always warned-and-continued for unconvertible literal candidates;
  changing that taxonomy would alter behaviour for every language.

### Changed
- README: added `prepare-repo` usage section

## [0.4.2] - 2026-10-04

### Breaking
- `providers[].coverageCmd` is now rejected at config load: `config: providers[<i>].coverageCmd not supported (never executed); remove the key`. The key was never executed — remove it from `checkchange.providers.json`.
- `ProviderConfig.allowlist` removed from the type surface. It had zero readers and duplicated `REPO_ROOT_NAMES`; configs still carrying the key load unchanged.

### Fixed
- `flushConfigUpdates` tmp-write hardening (`src/providers/prepare.ts`): pid-suffixed tmp name, `flag: 'wx'` (O_EXCL) so create fails EEXIST rather than writing through a planted symlink, realpath containment re-checked after write and before rename, tmp unlinked on failure, and a `console.warn` naming the failure instead of a silent skip.

### Added
- Missing-branch tests for attribution and runner detection: `test/attribution.case.spec.ts` (16), `test/runner-detection.test.ts` (17), `test/attribution-python.test.ts` (3).

## [0.4.1] - 2026-10-03

### Fixed
- Corrected README install directions for the live npm registry
- Removed stale test-count claims from README
- Clarified gate vocabulary (`PASS` / `WARN` / `NOT_EVALUATED`)

## [0.3.0] - 2026-09-03

### Added
- Schema 0.4 evidence contract (Security Addendum 2026-09-03)
- CRAP thresholds frozen at 30/15 (INV-01..04)
- Pluggable complexity providers (`src/complexity-providers.ts`) including a Python complexity adapter
- JS/React dispatcher and framework detection
- LCOV provider with historical framework fixtures
- Hardening: attribution case-insensitive suffix match (`src/attribution.ts:91`), `vitest.config.ts` guard

### Fixed
- Coverage artifact malformed handling (INCOMPLETE gate)
- Sudo rejection in install plan
- Mixed install continues after failure (no short-circuit)
- dryRun wins over yes flag

### Changed
- Test suite: 63 spec files (8 under `src/`, 55 under `test/`)
- Typecheck: 0 errors
- Build: bin entries `checkchange` + `code-risk`

## [0.2.0] - 2026-08-31

### Added
- `check` subcommand: deterministic evidence for changed functions
- `doctor` subcommand: environment probes with remediation hints
- `explain` subcommand: derivation trace for rules
- `trace` subcommand: span sidecar with correlation ID
- `delta` subcommand: compare two EvidenceOutput runs
- Auto-coverage (`--auto-coverage`): detect runner, generate artifact, retry
- CRAP scoring with INV-01..04 invariants
- Cache opt-in (`--cache` / `CHECKCHANGE_CACHE=1`)
- Output formats: github, junit, sarif

### Changed
- Prototype hypothesis validated for TypeScript/JavaScript
- Non-goals documented: no custom analysis, no SaaS, no LLM