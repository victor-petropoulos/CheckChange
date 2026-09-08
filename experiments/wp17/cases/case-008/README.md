# case-008 — docs: simplify OPENCODE_START_HERE required reads 5→2 for token saving

- **Commit:** 991ed4c66033ae987e76d479f8a99d258e25004c
- **Category:** Docs-only
- **Message:** docs: simplify OPENCODE_START_HERE required reads 5→2 for token saving
- **Date:** Thu Sep 3 09:59:34 2026 -0700

## `git show --stat` excerpt

```
commit 991ed4c66033ae987e76d479f8a99d258e25004c
Author: victorpetropoulos <petropoulos@hotmail.com>
Date:   Thu Sep 3 09:59:34 2026 -0700

    docs: simplify OPENCODE_START_HERE required reads 5→2 for token saving

    - required: EXECUTION GUIDANCE + SESSION_CONTEXT_2026-09-03.txt (updated 2026-09-03 full close, Rounds 7-8, Hardening B, global link, auto base, Engram coverage, skill)
    - reference (not required): Roadmap.txt, Post_WP9_Detailed_Roadmap.md, WP5_6_REMEDIATION_CLOSURE.md moved to reference section
    - saves ~19-22K tokens per session start (roadmap history 76K chars)
    - fixes fallback timeout by direct bash copy/patch instead of subagent

 OPENCODE_START_HERE.md                             |  12 +-
 .../SESSION_CONTEXT_2026-09-03.txt                 | 445 +++++++++++++++++++++
 2 files changed, 452 insertions(+), 5 deletions(-)
```

## Selection rationale

Low-complexity docs-only change (2 files, +452/-5). No src/ or test/ impact. Tests whether CheckChange reports clean signal/noise on documentation-only commits.
