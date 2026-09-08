# case-004 — chore: rename project to CheckChange

- **Commit:** 8bd543d751d208c09083626ac1780cce0a68e9b3
- **Category:** Mechanical/Refactoring
- **Message:** chore: rename project to CheckChange
- **Date:** Sun Aug 30 19:36:14 2026 -0700

## `git show --stat` excerpt

```
commit 8bd543d751d208c09083626ac1780cce0a68e9b3
Author: victorpetropoulos <petropoulos@hotmail.com>
Date:   Sun Aug 30 19:36:14 2026 -0700

    chore: rename project to CheckChange

    Product identity code-risk-prototype/code-risk → CheckChange/checkchange.
    Preserves WP11 contract (schema 0.2, thresholds 30/15, INV-01..04),
    WP12 paused at approval gate, src/ only CLI usage string.

    Co-Authored-By: internal-model

 OPENCODE_START_HERE.md              |  9 +++------
 PROJECT_STATUS.md                   |  7 ++++++-
 README.md                           | 10 ++++++++--
 docs/contracts/evidence-contract.md |  2 +-
 docs/wp7-release-checklist.md       |  4 ++--
 package-lock.json                   | 11 ++++++-----
 package.json                        | 16 ++++++++++++++--
 src/cli.ts                          |  2 -
 8 files changed, 41 insertions(+), 20 deletions(-)
```

## Selection rationale

Mechanical rename refactoring (8 files, +41/-20). Preserves behavior, only project identity/name changes. Tests whether mechanical refactors produce clean evidence or confusion in changed-function attribution.
