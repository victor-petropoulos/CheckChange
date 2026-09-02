# OpenCode Start Here

Read, do not skip this,:

1. `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt`
2. `docs/Project Master Plans/Roadmap.txt`
3. `docs/Project Master Plans/SESSION_CONTEXT_2026-08-26.txt`
4. `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` (2026-08-27)
5. `docs/Project Master Plans/Post_WP9_Detailed_Roadmap.md` (post-WP9 provisional)

Execute the next project step in the roadmap only. Record in this document which step you are currently working on and what step is next.

Build the required human-review packet.

Do not autonomously classify usefulness.

If human review has not been supplied, end the results report:

```text
AWAITING HUMAN REVIEW
```

After human review it may end with `CONTINUE`, `CONTINUE WITH CONSTRAINTS`, or `STOP`.

---
## Current Step
**Hardening B COMPLETE WITH CONSTRAINTS 2026-09-02 — 224 pass, 4 limits CLOSED**

Hardening B plans .opencode/plans/2026-09-02T182626Z-hardening-b-python-js-next.md + 2026-09-02T183000Z-hardening-b-completion.md approved:true, commits 388d992 + df0f3ba. P0-1 pnpm patch persists, P0-3 registry, P1-4 CC 0.626 documented, P0-2 p-queue 149K zustand 94K next-sample 1.4K Istanbul JSON, P1-5 perf <1s <260MB, 4 limits closed per contract addendum. Gate CONTINUE WITH CONSTRAINTS per human review 2026-09-02.

Constraints: CC correlation <0.95 accepted as documented divergence (no correction, cross-lang CRAP not comparable); large monorepo 1M+ coverage not measured; synthetic null coverage still valid for dispatch test.

## Next Step
**NEXT: Angular expansion (or other framework) — evidence-driven per Post_WP9 §8 WP13. Build plan .opencode/plans/<ts>-angular-expansion.md with synthetic fixture + dispatcher + faults, schema 0.4 additive framework angular, no parser change, tsc0 224→~230. No code until plan approved:true.**

```
CONTINUE WITH CONSTRAINTS — Hardening B closed, Angular authorized
```