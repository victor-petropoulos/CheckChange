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
**WP12 COMPLETE + FIX + HARDENING 2026-08-31 — CONTINUE WITH CONSTRAINTS (A+B+C+D DONE)**
Src fix 8885796 case-insensitive, hardening e354048 vitest.config.ts guard + attribution.case 3 tests + contract addendum, reviewer grounding 6eac65b PASS, security PASS 0 vuln, 191/191 pass (61 files) tsc0 wp11 10/10, crapCalc 100% now, SUCCESS PASS/WARN proven (supplement WP12_SUCCESS_VALIDATION.md), .worktrees ignored, coverage clean 174KB 11 src files.

## Next Step
**NEXT WIP: Await human selection of constrained WP13 language OR WP14 historical OR WP15 usefulness OR WP12 closure finalization** — minimal scope, no schema bump without proven gap, no claim without basis, experiments/.worktrees excluded per vitest.config.ts

