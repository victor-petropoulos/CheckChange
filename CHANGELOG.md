# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `prepare-repo` subcommand: detect → plan → approve → install → verify test runners
  - `--dry-run` preview (human or `--json`), safe in non-TTY
  - `--yes` non-interactive execution
  - Agent protocol: `--dry-run --json` first, then `--yes`
  - Idempotent: re-run anytime

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