# WP7 Release Checklist

## Contract
- [x] schemaVersion 0.4 frozen, docs/contracts/evidence-contract.md, INV-01..04 preserved

## Packaging
- [x] package.json version 0.4.0, bin checkchange→dist/cli.js (alias: code-risk→dist/cli.js), prepare→npm run build, declaration:true

## Install / Build
- [x] npm ci --dry-run ok
- [x] npm run build → tsc clean
- [x] npm pack --dry-run → 25.8 kB tarball, 38 files

## CLI
- [x] checkchange check --help shows --verbose
- [x] check --base HEAD~1 --json → 0.4 JSON, gate PASS
- [x] check --base HEAD~1 --verbose → stderr diagnostics
- [x] exit codes per contract

## Tests
- [x] npx tsc --noEmit 0
- [x] npx vitest run --no-coverage 259/259
- [x] integration run-proof.sh PASS

## Security (Hardening B — CLOSED 2026-09-03)
- [x] src/coverage.ts path.relative boundary
- [x] git validate, no injection
- [x] malformed coverage → FAILED, no crash
- [x] no secrets
- [x] SHA regex: `^[a-f0-9]{40}$` strict validation in `git.ts`
- [x] LCOV size limit: 10 MB max in `lcov-provider.ts`
- [x] Python prune: skip `site-packages`, `venv`, `dist`, `build` in `detectPythonFramework`
- [x] `readdir` depth limited to 3 in `detectNextFramework` (`src/evidence.ts`)
- [x] `--coverage-file` allowed outside cwd with symlink-follow validation

## Perf
- [x] perf-baseline.md recorded (LCOV 0.78s/255MB, Istanbul 0.81s/260MB, monorepo 3.3M 0.92s)

## Invariants (Preserved — WP5.6 → WP15)
- [x] INV-01: ZERO≠NULL — `evidence.ts:216`, `coverage.ts:21`
- [x] INV-02: MISSING≠MALFORMED — `evidence.ts:146-158` (`coverageErrorReason`)
- [x] INV-03: GIT≠REPO — `evidence.ts:65-72`
- [x] INV-04: ANALYZER TRUTHFUL — `evidence.ts:216`

## Thresholds (Frozen)
- [x] CRAP threshold 30 (default) / 15 (tight) — `rules.ts` unchanged, CLI `--crap-threshold <T>` default 30

## Hardening B Baseline (2026-09-02/03)
- [x] P0-1 Parser Persistence: pnpm patch `@barney-media/crap-typescript-core@0.5.0` — `patches/crap-typescript-core+0.5.0.patch`, `ANALYZABLE_EXTENSIONS`, `resolveScriptKind`, `scriptKindMap`
- [x] P0-3 Registry: minimal dispatch table `src/evidence.ts`, arrow delegation preserves `vi.spyOn`
- [x] P1-4 CC Benchmark: TS/JS correlation 0.626, Python AST 1.0, no correction factor
- [x] Security Addendum: 5 High/Medium fixes CLOSED (see Security section)

## Docs
- [x] WP7_RESULTS.md
- [x] human-review-packet.md ends AWAITING HUMAN REVIEW

## WP16 Re-verification (2026-09-10)
- [x] tsc --noEmit: exit 0
- [x] vitest run: 259/259 pass
- [x] build: exit 0
- [x] pack: 25.8 kB, 38 files
- [x] git diff --stat src/: empty (zero source change)

AWAITING HUMAN REVIEW