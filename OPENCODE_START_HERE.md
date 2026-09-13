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

## Last Session — 2026-09-13
D2 shipped (be5e725, 84/341 green) + reviewer lows fixed; C shipped (18d4ba3: perf baseline, lineage plumbing, src/cache.ts, --cache opt-in, 33 tests, 377 green, Engram approved); refactor (aa70f24: composition cli.ts→cache.ts, 669→535, all 5 arch findings resolved); agent constitutions baked live (planner D1–D16/E1–E5/repo-conventions, implementer H1–H8). Baseline tsc 0 / 85 files / 377 tests. Open: verbose-drain test follow-up, default-on flip needs field data.

## Next Session
Fresh session starts at master §Next-Session Resume Checklist (HEAD aa70f24, expect 0/377). Constitution package at `.opencode/plans/20260913T213000-agent-constitution-package.md` — baked live; first live test on next real planning task.

> Historical (pre-2026-09-12). Current truth = §Last Session above + master plan.

## Current Step
**Full close pre-Angular COMPLETE 2026-09-03 — 233 pass, 72 files, LCOV+Python/providers, security harden (SHA regex, LCOV 10MB limit, Python prune, readdir depth 3), corpus 17, E2E LCOV/Istanbul 0.78s/0.81s, Engram rev-1788397101053-2 approved 0 findings, CI both SUCCESS (be9f97a), commits feaa492 + be9f97a**

Hardening B plans .opencode/plans/2026-09-02T182626Z-hardening-b-python-js-next.md + 2026-09-02T183000Z-hardening-b-completion.md approved:true, commits 388d992 + df0f3ba. P0-1 pnpm patch persists, P0-3 registry, P1-4 CC 0.626 documented (TS/JS), Python 1.0 via new provider, large monorepo measured 3.3M 0.92s, P0-2 p-queue 149K zustand 94K next-sample 1.4K Istanbul JSON, P1-5 perf <1s <260MB, 4 limits closed per contract addendum. Security addendum CLOSED (5 High/Medium fixes). No provisional remain. Gate CONTINUE per human review 2026-09-02.

WP14 APPROVED 2026-09-08 CONTINUE. WP15 solo packet ACCEPTED 2026-09-08 CONTINUE. WP16 assessment CONTINUE WITH CONSTRAINTS 2026-09-08.

Current work 2026-09-12: schema 0.5 bump planned (.opencode/plans/2026-09-12T23-12-40Z-schema-05-bump.md, approved:true), Experiment A tasks 1-11 CLOSED at 8185c30, baseline tsc 0 / 79 files / 297 tests verified this session.

D2 shipped + C shipped + refactor landed (aa70f24); constitutions baked. See §Last Session above + master plan.
## Next Step
**NEXT: WP16 hardening under constraints (perf/security/packaging) OR WP17 product decision prep — no new language without gating criteria met.**
Immediate next (new session): resume checklist → roadmap work or first live test of new planner constitution.

```
CONTINUE — WP14 approved, WP15 accepted 2026-09-08; Angular deferred
```
