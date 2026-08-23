# Decisions and Open Questions

## Decisions

- Separate from Engram.
- No analysis engine.
- TypeScript/JavaScript first.
- Existing tools first.
- No LLM.
- Local and free.
- Deliberately ugly internals.
- Disciplined machine-readable output.
- Research itself is a valid outcome.
- Casual public usability is optional, not enterprise polish.

## Open questions

1. Project name.
2. Can `crap-typescript` expose the required function-level facts stably?
3. Should coverage come through `crap-typescript`, the project coverage report, or both?
4. Can Git plus existing outputs identify changed functions without custom AST analysis?
5. What is the simplest useful baseline behavior?
6. What minimal thresholds make the three rules useful?
7. Confirm TypeScript as implementation language.
8. Dependency/license review if the project is published.
