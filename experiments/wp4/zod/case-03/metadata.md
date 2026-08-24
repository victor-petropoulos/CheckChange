repository: colinhacks/zod
url: https://github.com/colinhacks/zod
license: MIT
base commit: 49507f34f05109e3e5fa8585eaf5d40d3ee681d4
target commit: 555e5f4Add z.toZod helper (#5913913)
changed TS files:
- packages/docs/content/basics.mdx
- packages/zod/src/v4/classic/external.ts
- packages/zod/src/v4/classic/tests/assignability.test.ts
- packages/zod/src/v4/core/index.ts
- packages/zod/src/v4/core/util.ts
- packages/zod/src/v4/mini/external.ts
- packages/zod/src/v4/mini/tests/assignability.test.ts
rationale: Non-trivial logic change - adding a new helper method `toZod` across classic and mini APIs, involving multiple files and significant logic additions.
