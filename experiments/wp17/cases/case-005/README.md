# case-005 — feat: Next.js detector next>react (Task1)

- **Commit:** 480de63c64891bd957f8c67b5a3b799bc713fd36
- **Category:** Production code without test (behavioral feature)
- **Message:** feat: Next.js detector next>react (Task1)
- **Date:** Wed Sep 2 2026 -0700

## `git show --stat` excerpt

```
commit 480de63c64891bd957f8c67b5a3b799bc713fd36
Author: victorpetropoulos <petropoulos@hotmail.com>
Date:   Wed Sep 2 2026 -0700

    feat: Next.js detector next>react (Task1)

    - detectNextFramework 6-step priority: package.json next, next.config.*, app/page|layout|route, pages/**, react fallback
    - contract framework values react|next, tsc0

 docs/contracts/evidence-contract.md |  4 ++--
 src/evidence.ts                     | 39 +++++++++++++++++++++++++++++++++----
 2 files changed, 37 insertions(+), 6 deletions(-)
```

## Selection rationale

Feature implementation without corresponding test file in same commit. `src/evidence.ts` modified (+42 lines), docs updated. Tests added later (c9b6654, 3b2d455). Tests whether CheckChange reports prod-without-test signal correctly.
