# checkchange

Independent, deterministic evidence and verification layer for AI-assisted software development.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node: 24](https://img.shields.io/badge/Node-24-green.svg)](.nvmrc)

## Install

Registry is live at `0.4.0` (`npm view checkchange version` → `0.4.0`).

### npm / pnpm (recommended)

```bash
npm install -g checkchange
npx checkchange --help
```

```bash
pnpm add -g checkchange
pnpm dlx checkchange check --base main --json
```

```bash
npm install checkchange
npx checkchange check --base main --json
```

### From-source (GitHub clone)

```bash
git clone https://github.com/victor-petropoulos/CheckChange.git
cd CheckChange
corepack enable
pnpm install --frozen-lockfile
pnpm run build
node dist/cli.js check --base main --json
```

> **Warning:** Git URL install (`npm install git+https://…`) is not supported. `prepare` runs `pnpm run build` (needs pnpm + TypeScript toolchain). The npm registry tarball ships prebuilt `dist/cli.js`; from-source always builds.

The lean repo is public, 125 files, 2 commits.

### Requirements

- Node 24 (`.nvmrc:1`)
- pnpm 11.17.0 (`package.json:5`)

### Registry choice

Published to **npmjs.org** as unscoped `checkchange` (`package.json:2`). GitHub Packages only supports scoped packages (`@NAMESPACE/...`), would require rename to `@victor-petropoulos/checkchange` and consumer `.npmrc` mapping — no `publishConfig` or scope-to-registry mapping is used.

## What it does

checkchange looks at the functions you changed since `--base`, measures their complexity and test coverage, computes a CRAP score (complexity × uncovered), and emits **PASS / WARN / NOT_EVALUATED** with a deterministic evidence JSON you can feed to CI (`src/rules.ts:8`, `src/evidence.ts:464`).

- **What it is**: Independent verification layer for AI-assisted development (verbatim from `package.json:43`).
- **How**: 8-stage pipeline — git diff → complexity → coverage → attribution → crapCalc → rules → evidence → output (`src/evidence.ts:828`, `src/cli.ts:17` SUBCOMMANDS, `src/cli.ts:22` extensions `.ts/.tsx/.js/.jsx/.mjs/.cjs/.py`).
- **Default threshold**: CRAP 30 (`src/help.ts:49`, `src/help.ts:66`).
- **Output schema**: 0.5 (`src/evidence.ts:644`).
- **Where/who**: any git repo that produces coverage output — a PR pipeline, a developer's pre-commit hook, or an AI coding agent checking its own change. The latter two are common setups; this CLI installs neither.
- **Verified CI output formats**: `--format github|junit|sarif` (`src/help.ts:39`).

## Quickstart

```bash
pnpm exec vitest run --coverage
```

```bash
node dist/cli.js check --base main --json
```

```json
{
  "schemaVersion": "0.5",
  "analysis": {
    "base": "<resolved-base-sha>",
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

`diagnostics.lineage` and `diagnostics.quality` follow; omitted for brevity. A clean checkout has no changed functions, so `changedFunctions` is empty and the gate is not evaluated.

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
| `check` | Analyze changed functions, emit PASS/WARN/NOT_EVALUATED with evidence |
| `doctor` | Verify runtime prerequisites (Node, pnpm, coverage, git) |
| `prepare-repo` | Bootstrap test runners & coverage tooling (detect → plan → approve → install → verify) |
| `explain` | Show rule rationale for a given verdict |
| `trace` | Print evidence trace for a specific function |
| `delta` | Compare evidence between two refs |

Supported languages: TypeScript, JavaScript, Python (`src/cli.ts:22`).

## How it works

Eight-stage pipeline (git → complexity → coverage → attribution → crapCalc → rules → evidence):

1. **Git diff** — enumerate changed functions since `--base` (default: `origin/HEAD` → `main`/`master`)
2. **Complexity** — per-function CRAP via `crap-typescript` (TS/JS) or Python AST (`src/complexity-providers/pythonASTComplexityProvider.ts`)
3. **Coverage** — map LCOV/istanbul lines to changed functions (`src/coverage-providers/lcovProvider.ts`)
4. **Attribution** — case-insensitive suffix match to provider-lowercased paths (`src/attribution.ts:91`)
5. **crapCalc** — combine complexity + coverage → CRAP score (`src/crapCalc.ts:5`)
6. **Rules** — INV-01..04 evaluated against thresholds (`src/evidence.ts:828`)
7. **Evidence** — schema 0.5 (`src/evidence.ts:644`, `src/delta.ts:35`)
8. **Output** — human-readable summary by default; JSON via `--json`, or `--format github|junit|sarif` for CI annotations

Default CRAP threshold: **30** (`src/help.ts:49`, `src/help.ts:66`).

## Configuration

Key options (`src/help.ts` for full list):

| Flag | Description | Default |
|------|-------------|---------|
| `--base <ref>` | Git base ref for diff | auto-detect |
| `--crap-threshold <n>` | CRAP WARN threshold | 30 |
| `--coverage-file <path>` | Explicit LCOV/istanbul path | auto-detect |
| `--format <github\|junit\|sarif>` | Output format; JSON is the `--json` flag | none |

Provider config precedence: explicit `--provider-config <path>` > repo-root `./checkchange.providers.json` > builtin providers.

## Dependencies & credits

### Runtime dependencies

| Package | Version | Purpose | Link |
|---------|---------|---------|------|
| `@barney-media/crap-typescript` | 0.5.0 | CLI wrapper `npx crap-typescript --format json` (legacy `src/crap.ts:43`), source fallback in `src/evidence.ts:717-718` | [npm](https://www.npmjs.com/package/@barney-media/crap-typescript) |
| `@barney-media/crap-typescript-core` | 0.5.0 | Core engine: `findAllTypeScriptFilesUnderSourceRoots` + `parseFileMethods` (`src/complexity.ts:1`), `parseCoverageReport` + `coverageForMethods` (`src/coverage.ts:6`, `src/attribution.ts:1-2`), CRAP calc provenance (`src/evidence.ts:684`, `src/attribution.ts:17`) | [npm](https://www.npmjs.com/package/@barney-media/crap-typescript-core) |

### Dev dependencies

| Package | Version | Purpose | Link |
|---------|---------|---------|------|
| `typescript` | 6.0.3 | Build (`package.json:16` `tsc && chmod +x dist/cli.js`) | [npm](https://www.npmjs.com/package/typescript) |
| `vitest` | 4.1.11 | Test runner (`package.json:17` `vitest run`) | [npm](https://www.npmjs.com/package/vitest) |
| `@vitest/coverage-v8` | ^4.1.11 | Coverage provider (`package.json:33`; config `vitest.config.ts:4`) | [npm](https://www.npmjs.com/package/@vitest/coverage-v8) |
| `@types/node` | latest | Node type defs for the bin shebang (`package.json:30`, `src/cli.ts:1`) | [npm](https://www.npmjs.com/package/@types/node) |
| `eslint` + `@eslint/js` + `@typescript-eslint/{eslint-plugin,parser}` | latest | Flat-config lint rules; `eslint.config.js` exists but `package.json` has no `lint` script and CI runs no lint step | [npm](https://www.npmjs.com/package/eslint) |
| `tsx` | ^4.23.12 | Run TS directly (dev) | [npm](https://www.npmjs.com/package/tsx) |

### External tools / runtimes

| Tool | Version / Requirement | Purpose | Evidence |
|------|----------------------|---------|----------|
| `node` | 24 | Runtime; bin shebang `src/cli.ts:1` `#!/usr/bin/env node` | `.nvmrc:1` |
| `pnpm` | 11.17.0 | Install + build; `prepare` needs pnpm+tsc | `package.json:5` |
| `git` | system | Diff enumeration `git diff --unified=0` (`src/evidence.ts:839`), `git ls-files` (`src/complexity.ts:20`) | `src/git.ts:1,18,35,59,145` |
| `lcov` | file format `.info`/`.lcov` | Alternate coverage input; parsed via `parseLcovContent` (`src/coverage-providers/lcovProvider.ts:17`) | `src/coverage.ts:404,469` |
| `python` + `coverage.py` + `pytest` | python3 | Python stack detection + coverage conversion (`src/providers/config.ts:67-73,92-96`) | `src/coverage.ts:65,247` |

### Providers

| Provider | Purpose | Source |
|----------|---------|--------|
| `genericCommand` | Pluggable `complexityCmd` → `ComplexityInfo[]` via allowlisted argv, tokens `{cwd} {out} {ext}`, 30s timeout, PATH-only env | `src/providers/genericCommand.ts:1,11,38,48,56,60` |
| `lcovProvider` | `parseLcovContent(lcovContent, cwd) → Map<string,FileCoverage>` rebasing + suffix logic | `src/coverage-providers/lcovProvider.ts:17` |

## Contributing

Contributions via GitHub issues and pull requests.

## License

MIT — see [LICENSE:1-3](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).