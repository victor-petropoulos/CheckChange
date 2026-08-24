# WP4R Repository Selection

Selected 3 repositories before any tool execution, as required.

## Selection Table

| Repository | URL | License | TS Source (.ts/.tsx vs .d.ts) | Rationale |
|------------|-----|---------|-------------------------------|-----------|
| A (small TS lib/tool) | unjs/h3 | https://github.com/unjs/h3 | MIT | 174 .ts, 0 .d.ts | Small focused HTTP framework. High TS density, vitest with --coverage built-in, non-trivial functions, MIT, ample git history (~800 commits), npm/pnpm compatible, structurally simple. |
| B (medium TS lib/app) | honojs/hono | https://github.com/honojs/hono | MIT | 327 .ts, 1 .d.ts | Medium web framework. Substantial TS implementation, vitest, non-trivial functions, MIT, good history (1255 commits), buildable. |
| C (structurally different) | nrwl/nx | https://github.com/nrwl/nx | MIT | 4380 .ts, 232 .d.ts | Large monorepo tool. Structurally different (many packages, complex build), extensive TS source, MIT, ample history, buildable with pnpm. |

## Verification Details

### h3 (A - small)
- TS source count: `find . -type f -name "*.ts" ! -name "*.d.ts" | wc -l` → 174
- Declaration files: 0
- License: MIT (`cat package.json | grep license`)
- Git history depth: ~800 commits (depth-limited clone)
- Test script: `pnpm lint && pnpm typecheck && vitest --run --coverage` (includes coverage)
- Coverage artifact: `coverage/coverage-final.json` via `vitest --run --coverage`
- Function-like lines: ~1200

### hono (B - medium)
- TS source count: 327 .ts, 1 .d.ts
- License: MIT
- Git history depth: 1255 commits
- Test script: `tsc -p tsconfig.spec.json && vitest --run` (+ --coverage for experiment)
- Function-like lines: 6900

### nx (C - structurally different / monorepo)
- TS source count: 4380 .ts, 232 .d.ts
- License: MIT
- Git history depth: 1000+ commits
- Test script: `nx run-many -t test` (pnpm, Nx Cloud)
- Function-like lines: 43174
- Note: Operational friction expected (large, pnpm) — evaluates "small and usable" question.

## Why Not execa (replaced)
- Initial selection `sindresorhus/execa` was rejected on verification: source is `lib/*.js` (JavaScript) not TypeScript, only declarations are `.ts`. Criteria requires actual TS implementation source, not just .d.ts. Lesson from WP4 p-limit (JS vs TS). Replaced before any tool execution.

## Confirmation

Repositories were selected before observing WP4R output:

```text
YES
```
