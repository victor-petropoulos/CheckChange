# CheckChange
Independent, deterministic evidence for AI-assisted software development.
AI writes. We check the change.

CheckChange provides deterministic evidence around code changes: it analyzes changed functions, their complexity, test coverage, deterministic CRAP scores, evidence completeness and status, and provenance of the evidence.

## Direction

> **This project consumes analysis. It does not perform analysis.**

This is a completely separate project from Engram. Established tools already know how to measure tests, coverage, complexity, CRAP, lint, type errors, security findings, duplication, and similar signals. This project should not recreate them.

Its deliberately small job is to discover or invoke a few supported existing tools, consume their deterministic outputs, correlate facts about the current code change, apply a few deterministic rules, and report PASS / WARN / FAIL.

## Prototype hypothesis

Can a small, free, local-first glue layer over existing developer tools produce a more useful deterministic assessment of a code change than any one tool provides by itself?

If not, stop.

## v0 scope

TypeScript/JavaScript only.

Initial sources:
- Git
- `crap-typescript`
- existing project test/coverage tooling
- `tsc` when configured
- ESLint when configured

Initial rules:
1. Tests fail.
2. A changed function has high CRAP.
3. A changed high-risk function has inadequate coverage.

## Non-goals

No custom analysis engine, AST quality analysis, coverage instrumentation, security scanner, plugin framework, multi-language framework, dashboard, SaaS, LLM, MCP, IDE extension, or Engram integration.

The project is primarily a research and learning project. It only needs to be useful, understandable, free to run, and clean enough that another developer could use it if desired.

Additionally, CheckChange does NOT claim to prove correctness, predict defects, replace human review, or certify production readiness. CRAP is one signal, not the entire product.

Because "trust me, I tested it" isn't evidence.

## Status

**Current state (2026-10-01):** repository version 0.4.0 — evidence schema 0.4, CRAP thresholds frozen, LCOV + Python complexity support.

- Test files: 63 spec files (8 under `src/`, 55 under `test/`)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok (runs `tsc && chmod +x dist/cli.js`), bin entries: `checkchange` + `code-risk`
- Evidence contract: schema 0.4, thresholds 30/15 frozen, INV-01..04 preserved, explicit `language` and `framework` fields (`src/evidence.ts:433`)
- Pluggable complexity providers behind the `ComplexityProvider` interface (`src/complexity-providers.ts:3`); Python complexity provider registered (`src/evidence.ts:325`)
- LCOV coverage provider (`src/coverage-providers/lcovProvider.ts`)
- Attribution: case-insensitive suffix match for provider-lowercased paths (`src/attribution.ts:91`), anchored by `test/attribution.case.spec.ts`
- Performance: LCOV synthetic E2E 0.78s/255 MB, Istanbul synthetic 0.81s/260 MB
- Schema 0.4 is current; schema 0.3 consumers should stay on v0.3.x

## Installation

Requires Node 24 (`.nvmrc`).

```bash
npm install -g checkchange
```

Or run it without installing:

```bash
npx checkchange --help
```

Verify:

```bash
checkchange --help
```

**Installing from a git URL is not supported.** The package builds itself on
install — `prepare` runs `pnpm run build`, which needs pnpm plus a full
TypeScript toolchain. Installing from the npm registry ships the prebuilt
tarball instead, so no build step runs on your machine.

## Usage

```bash
checkchange check [--base <ref>] [--json] [--verbose]
```

- `--base` optional — auto-detects: `origin/HEAD` → `origin/master`/`main` → `master`/`main` (Engram uses `master`, most others `main`)
- `--json` — machine-readable output for CI/programmatic use
- `--verbose` — detailed evidence breakdown

Examples:

```bash
checkchange check --verbose
checkchange check --base main --json | jq
pnpm vitest run --coverage && checkchange check --json
checkchange check --auto-coverage --json
```

**Coverage artifact required** for CRAP score calculation. Without coverage, gate returns `INCOMPLETE`. Use `--auto-coverage` to auto-detect runner and generate the artifact.

## `prepare-repo` — Bootstrap Test Runners

```bash
checkchange prepare-repo [--dry-run] [--json] [--yes]
```

Phases: **detect** → **plan** → **approve** → **install** → **verify**

- `--dry-run` — print plan (human or `--json`), exit 0. Safe in non-TTY.
- `--json` — machine-readable output for CI/agents.
- `--yes` — skip interactive approval, execute plan. Combined with `--dry-run`, `--dry-run` wins.
- Agent protocol: **always run `--dry-run --json` first**, inspect plan, then `--yes` to execute.

Example:
```bash
checkchange prepare-repo --dry-run --json
checkchange prepare-repo --yes
checkchange doctor  # verify
```

## Use from AI Agents

`checkchange check --json` is the stable machine-readable entry point. Run it
first, read the PASS / WARN / FAIL verdict and the per-rule evidence, and treat
it as one deterministic signal among many — it does not replace human review.

## Next

Angular integration awaiting spec (Hardening B human review 2026-09-02 authorized fork).