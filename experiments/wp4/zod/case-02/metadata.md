repository: colinhacks/zod
url: https://github.com/colinhacks/zod
license: MIT
base commit: 28e1ebd89d26147bacb164af988da6ed6de738d4
target commit: 6c77d02feat: compact simple anyOf unions to type array in toJSONSchema (#6339)
changed TS files:
- packages/zod/src/v4/classic/tests/to-json-schema.test.ts
- packages/zod/src/v4/core/json-schema.ts
- packages/zod/src/v4/core/to-json-schema.ts
- packages/docs/content/json-schema.mdx
rationale: Moderate change - adding feature to compact simple anyOf unions in JSON schema output, involves modifications to core serialization logic and tests.
