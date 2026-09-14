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
HEAD 45b3edc nits T2/T3 landed (satisfies caps default + indent cleanup), T1 kept (`| undefined` required), Engram rev-1789409197427-4 GO, 87/391, gate PASS/5, pushed
HEAD 5a718ce, typing T1-T8 landed (@ts-nocheck removed, tsc 0, 87/391, T7 byte-identical, Engram rev-1789403842876-2 GO); WP16 T1/T2 + WP17_DECISION shipped (docs GO rev-1789402250035-1)

## Next Session
Fresh session starts at master §Next-Session Resume Checklist (HEAD 45b3edc, expect 0/87/391). Constitution package at `.opencode/plans/20260913T213000-agent-constitution-package.md` — baked live; first live test on next real planning task.

> Historical (pre-2026-09-12). Current truth = §Last Session above + master plan.

## Current Step
**Nits COMPLETE** — T2 (`satisfies` caps default) + T3 (indent cleanup 4 regions) landed, T1 reverted (`| undefined` required for strict assignability). tsc 0, 87/391 tests, checkchange gate PASS/5, Engram rev-1789409197427-4 GO. WP16 T1/T2 + WP17_DECISION docs shipped prior. WP17 A/B/C/D pending human review.

## Next Step
**NEXT: WP17 decision human review (A/B/C/D pending).** No new language without gating criteria met.

```
CONTINUE — WP14 approved, WP15 accepted 2026-09-08; Angular deferred
```
