# WP8 Real-World Historical Changes & Validation Matrix

## Planned Validation Changes (4 Total Changes Across Repos)

### Repo 1: Zod (`colinhacks/zod`)

#### Change 1: Small Change (1 Function)
- **Repo**: `colinhacks/zod`
- **Commit SHA**: `pending: to be resolved via git log --oneline`
- **Parent SHA**: `pending: to be resolved via git log --oneline`
- **Changed Files**: `src/types.ts`
- **Expected Function Count**: 1 (e.g. `ZodString.email` validator or parse function)
- **Engineering Significance**: Fix or refinement to string schema validation regex/logic. Small isolated scope.
- **Reproduction Steps**:
  1. Clone `colinhacks/zod` and checkout commit SHA.
  2. Install deps: `pnpm install`
  3. Generate coverage: `pnpm test:coverage` (or `npx vitest run --coverage`)
  4. Run code-risk analyzer:
     `node <prototype-path>/dist/cli.js check --base <parent-sha> --json --coverage-file coverage/coverage-final.json`

#### Change 2: Moderate Change (2-3 Functions)
- **Repo**: `colinhacks/zod`
- **Commit SHA**: `pending: to be resolved via git log --oneline`
- **Parent SHA**: `pending: to be resolved via git log --oneline`
- **Changed Files**: `src/types.ts`, `src/helpers/parseUtil.ts`
- **Expected Function Count**: 2-3 functions
- **Engineering Significance**: Refactoring parsing engine core loop or object schema merging.
- **Reproduction Steps**:
  1. Checkout commit SHA.
  2. Run `pnpm test:coverage`.
  3. Run `node <prototype-path>/dist/cli.js check --base <parent-sha> --json --coverage-file coverage/coverage-final.json`

---

### Repo 2: Fastify (`fastify/fastify`)

#### Change 3: Small Change (1 Function)
- **Repo**: `fastify/fastify`
- **Commit SHA**: `pending: to be resolved via git log --oneline`
- **Parent SHA**: `pending: to be resolved via git log --oneline`
- **Changed Files**: `lib/reply.js` / `lib/reply.d.ts` (or TS module equivalent)
- **Expected Function Count**: 1 function
- **Engineering Significance**: Patch to HTTP reply header formatting or status code validation.
- **Reproduction Steps**:
  1. Clone `fastify/fastify` and checkout commit SHA.
  2. Install deps: `npm install`
  3. Generate coverage: `npm run test:coverage`
  4. Run code-risk analyzer:
     `node <prototype-path>/dist/cli.js check --base <parent-sha> --json --coverage-file coverage/coverage-final.json`

#### Change 4: Moderate Change (2-3 Functions)
- **Repo**: `fastify/fastify`
- **Commit SHA**: `pending: to be resolved via git log --oneline`
- **Parent SHA**: `pending: to be resolved via git log --oneline`
- **Changed Files**: `lib/hooks.js`, `lib/route.js`
- **Expected Function Count**: 2-3 functions
- **Engineering Significance**: Updates to route registration and async hook invocation pipeline.
- **Reproduction Steps**:
  1. Checkout commit SHA.
  2. Run `npm run test:coverage`.
  3. Run `node <prototype-path>/dist/cli.js check --base <parent-sha> --json --coverage-file coverage/coverage-final.json`

---

## Reproducibility Caveats & Environment Dependencies
1. **Node.js Environment**: Requires Node.js v24 (or v20+ matching target repo toolchain requirements).
2. **Engine Build**: Prototypes MUST be compiled first (`npm run build`) so `dist/cli.js` is fresh.
3. **Dependency Pinning**: Target repos must install dependencies cleanly via lockfile (`pnpm install --frozen-lockfile` / `npm ci`) to guarantee test runner/coverage generator reproducibility.

---

## Fallback Plan (Local Prototype Repository Self-Validation)
If external repo cloning or dependency installation fails in restricted runtime environment:
- **Fallback Target**: `code-risk-prototype` repository itself.
- **Rationale**: `code-risk-prototype` is a real-world, non-trivial TypeScript repository with full coverage tooling, Istanbul coverage reports, and git history accessible locally.
- **Fallback Changes**: Historical commits within `code-risk-prototype` git history (e.g., F-03 fix commit vs parent, WP7 perf baseline commit vs parent).
