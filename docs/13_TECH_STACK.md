# Basic Technical Stack

The deliberately ugly prototype uses:

- Node.js 24 LTS
- TypeScript 6.x
- ESM / NodeNext
- npm
- Node `util.parseArgs` for CLI parsing
- Node `child_process.execFile` for external process execution
- Vitest for the prototype's own tests
- ESLint for the prototype's own linting
- `@barney-media/crap-typescript` as the external CRAP/complexity analyzer
- system Git CLI
- existing target-project test/coverage tooling
- existing `tsc` and ESLint where configured

No database, Docker, cloud service, LLM, MCP, Engram dependency, plugin framework,
or custom source-analysis engine is part of the prototype.

The detailed rationale and execution plan are in:

`docs/implementation/UGLY_PROTOTYPE_OPENCODE_PROJECT_PLAN.md`
