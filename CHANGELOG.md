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

## [0.3.0] - 2026-09-03

### Added
- Schema 0.4 evidence contract (Security Addendum 2026-09-03)
- CRAP thresholds frozen at 30/15 (INV-01..04)
- WP13: Language registry + Python complexity adapters (`src/complexity-providers.ts`, `experiments/wp13/adapter/`)
- WP15: JS/React dispatcher + framework detection (`experiments/wp15-js/`)
- WP9-R8: LCOV provider + historical fixtures (`experiments/wp9-r8/`)
- WP12 Hardening: attribution case-insensitive suffix match, vitest.config.ts guard

### Fixed
- Coverage artifact malformed handling (INCOMPLETE gate)
- Sudo rejection in install plan
- Mixed install continues after failure (no short-circuit)
- dryRun wins over yes flag

### Changed
- Test suite: 233/233 pass (72 files)
- Typecheck: 0 errors
- Build: `dist/cli.js` 6K, bin entries: `checkchange` + `code-risk`

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