# Usability for Others

The project is primarily for research/personal use while preserving casual public usability.

A stranger should be able to clone, install, build, run against a documented supported TypeScript project, and understand the result.

Documentation should state what the tool does and does not do, supported setups, external tools, commands, outputs, limitations, exit codes, and JSON format.

If published, prefer a permissive license after dependency review; require no paid service, API key, account, telemetry, source upload, hosted backend, or LLM.

## Installation

```bash
npm link
```

This installs `checkchange` globally (requires Node 24 via `nvm use`).

## Usage

```bash
checkchange check [--base <ref>] [--json] [--verbose]
```

- `--base` optional — auto-detects git base (see below)
- `--json` — machine-readable output
- `--verbose` — detailed evidence breakdown

### Base Selection (`--base`)

Optional. Auto-detects via:
1. `origin/HEAD`
2. `origin/master` or `origin/main`
3. `master` or `main`

Engram uses `master`; most others use `main`.

### Coverage Artifact

Required for CRAP score calculation. Produce via:

```bash
pnpm vitest run --coverage
```

Outputs to `coverage/coverage-final.json` (default Vitest V8 config).

Without coverage artifact, gate returns `INCOMPLETE`.

## Feedback Handling

The tool emits:
- `PASS` — all evidence sufficient
- `WARN` — insufficient evidence (blocking in CI)
- `FAIL` — tests fail or high-risk gaps

Exit codes: 0 (PASS), 1 (WARN/FAIL). Use `--json` for structured output.

Suggested positioning:

> A small, free, local-first utility that correlates deterministic evidence from existing development tools to flag risk in the code you are changing.

Do not claim to replace commercial code-quality platforms.
