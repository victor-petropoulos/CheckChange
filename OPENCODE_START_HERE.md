# OpenCode Start Here

Read, do not skip this:

1. `docs/Project Master Plans/checkchange-master-plan.md` (living master plan — §Session Log is session-bridge source of truth)
2. `.opencode/plans/2026-09-12T18-34-32-checkchange-trust-layer.md` (trust-layer phase plan, approved:false)
3. `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt`

Reference (not required, grep if needed):
- `docs/Project Master Plans/Post_WP9_Detailed_Roadmap.md` (WP10→WP17 strategic)
- `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` (redundant, summarized in session context §14)

Historical (pre-2026-09-12):
- `docs/Project Master Plans/SESSION_CONTEXT_2026-09-03.txt`
- `docs/Project Master Plans/Roadmap.txt` (WP5.4→WP9 historical)

---

## Living Plans

- **Master Plan:** `docs/Project Master Plans/checkchange-master-plan.md` — single source of truth, updated each session; §Session Log bridges sessions
- **Phase Plan:** `.opencode/plans/2026-09-12T18-34-32-checkchange-trust-layer.md` — 11 tasks (P0→P10), `approved:false`
- **Resume:** Master plan §Next-Session Resume Checklist is the canonical session-bridge

Execute the next project step in the roadmap only. Record in this document which step you are currently working on and what step is next.

Build the required human-review packet.

Do not autonomously classify usefulness.

If human review has not been supplied, end the results report:

```text
AWAITING HUMAN REVIEW
```

After human review it may end with `CONTINUE`, `CONTINUE WITH CONSTRAINTS`, or `STOP`.
---

## Last Session — 2026-09-14
HEAD 5a718ce, typing T1-T8 landed (@ts-nocheck removed, tsc 0, 87/391, T7 byte-identical, Engram rev-1789403842876-2 GO); WP16 T1/T2 + WP17_DECISION shipped (docs GO rev-1789402250035-1)
HEAD 5efd353, 87/391 green, trace-warning 8/8 + typing plan staged approved:false (gpg skipped)

## Next Session
Fresh session starts at master §Next-Session Resume Checklist (HEAD 5a718ce, expect 0/87/391). Constitution package at `.opencode/plans/20260913T213000-agent-constitution-package.md` — baked live; first live test on next real planning task.

> Historical (pre-2026-09-12). Current truth = §Last Session above + master plan.

## Current Step
**Typing COMPLETE** — T1-T8 explicit types landed, @ts-nocheck removed, tsc 0, 87/391 tests, T7 byte-identical determinism verified, Engram rev-1789403842876-2 GO. WP16 T1 re-verify + T2 checklist done. WP17_DECISION docs shipped (Engram rev-1789402250035-1 approved 0 findings). Implementer agent returned empty twice → cavecrew-builder fallback succeeded 4/4.

## Next Step
**NEXT: WP17 decision human review (A/B/C/D pending) + reviewer nits (caps cast, indent, redundant `| undefined`) as optional follow-up.**
No new language without gating criteria met.

```
CONTINUE — WP14 approved, WP15 accepted 2026-09-08; Angular deferred
```
