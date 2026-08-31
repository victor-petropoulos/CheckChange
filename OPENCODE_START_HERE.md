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
**WP12 COMPLETE + FIX APPLIED 2026-08-31 — CONTINUE WITH CONSTRAINTS**
Details: src fix applied (attribution.ts:62 case-insensitive suffix match), 188/188 tests pass, tsc 0 errors, crapCalc.ts now 100% stmt coverage (was null), supplement PASS/WARN proven, capital-file bug resolved. Commit 8885796.

## Next Step
**CONSTRAINED NEXT: Select WP13 language OR WP14 historical OR WP15 usefulness OR WP12 closure finalization per Roadmap, minimal scope, no schema bump without proven gap, keep experiments excluded from coverage**

