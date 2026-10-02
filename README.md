# checkchange
Independent, deterministic evidence and verification layer for AI-assisted software development.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node: 24](https://img.shields.io/badge/Node-24-green.svg)](.nvmrc)

## Install

Verified from-source (registry install available **after npm publish** — gated on `npm view checkchange version` returning 2xx):

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build
```

```bash
# after npm publish only:
npm install -g checkchange
```

> **Warning:** Git URL install is not supported. `prepare` runs `pnpm run build` (needs pnpm + TypeScript toolchain). The npm registry tarball ships prebuilt `dist/cli.js`; from-source always builds.

## Quickstart (<30s)

```bash
pnpm exec vitest run --coverage
```

```text
 Test Files  122 passed (122)
      Tests  872 passed (872)

 % Coverage report from v8
All files          |   86.47 |    78.74 |   90.16 |   88.42 |
```

```bash
node dist/cli.js check --base main --json
```

```json
{
  "schemaVersion": "0.5",
  "analysis": {
    "base": "2ca94cddb9c2f91a1a56cd6e065d34f4ca1c8de0",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "unavailable",
    "coverageArtifact": "unavailable"
  },
  "changedFunctions": [],
  "ruleResults": [],
  "policy": {
    "crapThreshold": 30
  },
  "analysisStatus": "UNSUPPORTED",
  "gate": "NOT_EVALUATED",
  "completeness": "INCOMPLETE"
}
```

`diagnostics.lineage` and `diagnostics.quality` follow; omitted above for brevity. A clean
checkout has no changed functions, so `changedFunctions` is empty and the gate is not evaluated.

```bash
node dist/cli.js doctor
```

```text
gitExecutable: ok
gitRepo: ok
defaultBase: ok (origin/main)
providerAvailability: no-changed-files
  ↳ no changed files detected against the base — stage a change and re-run (`git status` / `git diff --stat`). An empty diff is a valid stop: there is nothing to assess.
coverageArtifact: present
```

## Usage

Three canonical examples (verbatim from `src/help.ts:75-77`):

```bash
checkchange check --base main --json
```

```bash
checkchange check --crap-threshold 25 --format github
```

```bash
checkchange check --auto-coverage --verbose
```

Primary subcommands (`src/cli.ts:17`):

| Command | Purpose |
|---------|---------|
| `check` | Analyze changed functions, emit PASS/WARN/FAIL with evidence |
| `doctor` | Verify runtime prerequisites (Node, pnpm, coverage, git) |
| `prepare-repo` | Bootstrap test runners & coverage tooling (detect → plan → approve → install → verify) |
| `explain` | Show rule rationale for a given verdict |
| `trace` | Print evidence trace for a specific function |
| `delta` | Compare evidence between two refs |

Supported languages: TypeScript, JavaScript, Python (`src/cli.ts:22`).

## How it works

Eight-stage pipeline (git → complexity → coverage → attribution → crapCalc → rules → evidence):

1. **Git diff** — enumerate changed functions since `--base` (default: `origin/HEAD` → `main`/`master`)
2. **Complexity** — per-function CRAP via `crap-typescript` (TS/JS) or `radon` (Python)
3. **Coverage** — map LCOV/istanbul lines to changed functions (`src/coverage-providers/lcovProvider.ts`)
4. **Attribution** — case-insensitive suffix match to provider-lowercased paths (`src/attribution.ts:91`)
5. **crapCalc** — combine complexity + coverage → CRAP score (`src/crapCalc.ts:5`)
6. **Rules** — INV-01..04 evaluated against thresholds (`src/evidence.ts:828`)
7. **Evidence** — schema 0.5 (`src/evidence.ts:644`, `src/delta.ts:35`)
8. **Output** — human-readable summary by default; JSON via `--json`, or `--format github|junit|sarif` for CI annotations

Default CRAP threshold: **30** (`src/help.ts:49`, `src/help.ts:66`).

Test suite: **122 test files**, 872 tests (`pnpm exec vitest run --coverage` in a clean clone). Hand-written specs live in `src/` (8) and `test/` (55); the run also picks up compiled `dist/` specs and spike suites.

## Configuration

Key options (`src/help.ts` for full list):

| Flag | Description | Default |
|------|-------------|---------|
| `--base <ref>` | Git base ref for diff | auto-detect |
| `--crap-threshold <n>` | CRAP WARN threshold | 30 |
| `--coverage-file <path>` | Explicit LCOV/istanbul path | auto-detect |
| `--format <github\|junit\|sarif>` | Output format; JSON is the `--json` flag | none |

Provider config precedence: explicit `--provider-config <path>` > repo-root `./checkchange.providers.json` > builtin providers.

## Contributing

Contributions via GitHub issues and pull requests.

## License

MIT — see [LICENSE](LICENSE:1-3).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).