# WP8 Repository Selection Criteria and Candidates

## Explicit Selection Criteria
1. **Size / Scale**: Repositories must be non-trivial TypeScript codebases (ranging from small utility libraries to medium-large web frameworks/tools).
2. **Architecture & Complexity**: Diverse architectural styles (pure functional/generic types vs async web servers/event-driven systems).
3. **Test Runner & Coverage Tooling**: Repos using standard TS ecosystem tools (Vitest, Jest, Tap) capable of generating Istanbul or V8 coverage json reports.
4. **Monorepo vs Single-Package**: Include both single-package libraries and a monorepo workspace to validate package root resolution and path normalization (`path.relative` safety check).
5. **Language Constraint**: Strict TypeScript-only (no language expansion per scope rules).
6. **Corpus Isolation**: Exclude repositories already tested in WP5.x corpus (`h3`, `hono`, `apollo-client`).
7. **Feasibility**: Caller-owned coverage generation must be straightforward and git history must be fully accessible.

---

## Selected Repositories

### 1. Zod (`colinhacks/zod`)
- **Profile**: ~35k stars, pure TypeScript schema validation library. Small-to-medium single-package library.
- **Architecture**: Heavy generic type inference, complex runtime validation control flow, highly functional design.
- **Test Runner**: Vitest (`vitest run --coverage`).
- **Coverage Tooling**: v8 / Istanbul coverage output (`coverage/coverage-final.json`).
- **Why Chosen**: Excellent test case for pure type-heavy TypeScript logic, highly nested conditional branching, and tight functional components.

### 2. Fastify (`fastify/fastify`)
- **Profile**: ~30k stars, medium-large asynchronous web framework in TypeScript/JavaScript.
- **Architecture**: Event-driven, plugin encapsulation, heavy asynchronous hooks and routing lifecycle.
- **Test Runner**: Tap / Vitest.
- **Coverage Tooling**: Istanbul.
- **Why Chosen**: Tests performance and accuracy on a complex, highly asynchronous, real-world backend web framework with deep call stacks and async boundaries.

### 3. tRPC (`trpc/trpc`) — Optional Monorepo Stretch
- **Profile**: ~32k stars, TypeScript monorepo architecture (`pnpm workspaces`).
- **Architecture**: Monorepo package structure (`packages/server`, `packages/client`, etc.).
- **Test Runner**: Jest / Vitest.
- **Coverage Tooling**: Istanbul.
- **Why Chosen**: Directly tests monorepo path normalization and root attribution limitations noted in WP5.6/WP7.

---

## Rejected Alternatives
- **Express (`expressjs/express`)**: Written primarily in JavaScript with legacy callback patterns; less rigorous TypeScript type signatures for complexity metrics.
- **Axios (`axios/axios`)**: Mix of browser and Node target logic with complex build steps; coverage configuration is less standardized than Vitest/Jest projects.
