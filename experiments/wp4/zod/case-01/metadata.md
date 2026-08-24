repository: colinhacks/zod
url: https://github.com/colinhacks/zod
license: MIT
base commit: 937b5d01a143c36bb53591fffb29c44412ac9fef
target commit: 6574e78fix(v4): stop catch resurrecting issues an optional already resolved (#6440)
changed TS files:
- packages/zod/src/v4/classic/tests/catch.test.ts
- packages/zod/src/v4/core/schemas.ts
rationale: Small change - fixing a specific issue with catch resolver resurrecting issues, minimal logic change.
