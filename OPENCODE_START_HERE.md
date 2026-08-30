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

**WP10 CAPABILITY DEFINITION COMPLETE 2026-08-30** — `docs/10_WP10_CAPABILITY_DEFINITION.md` 269 lines 19K, 9 sections, no src change, 178/178 pass, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved. Deliverable: problem statement, target users (solo dev/team reviewer/CI gate/Engram auditor), smallest workflow (PR→git diff→tests→Istanbul JSON→engine→JSON/CLI→human/LLM interprets), evidence in/out/refusals, supported-claim matrix C1–C24 scoped to product (TS, Istanbul JSON, Node 24.18.1), non-goals (no universal language/coverage/monorepo/historical/IDE/ML/dashboards), success metrics (integration cost, DX, review usefulness, FP/FN, runtime, reliability, reproducibility, explainability), product shape A/B/C with evidence-backed recommendation (C long-term, A immediate — caller-owned coverage burden 4.96s/jest.custom.json is immediate blocker, not language/history), 6 prioritized research Qs, provisional next branch WP11/12 integration highest priority.
---
## Next Step

**AWAITING HUMAN REVIEW for WP11/12 Integration Validation (or alternative per forks) — WP10 deliverable defines problem/user/workflow/evidence/refusals/claim matrix/non-goals/metrics/shape A/B/C/research Qs/next branch. No implementation without explicit CONTINUE.**

Per `docs/10_WP10_CAPABILITY_DEFINITION.md` §9: Highest-priority next is WP11/12 — define stable input/output contract (WP11) → validate in 2 real CI pipelines (WP12) → measure setup complexity, failure modes, evidence completeness, developer comprehension, CI cost, reproducibility. If integration proves reliable → proceed toward real-world validation (WP15). If fragile → diagnose caller-side vs engine contract vs provider format before any engine change. Alternative forks: WP13 language expansion, WP14 historical/delta (Node 20.9 fresh per-commit coverage), WP15 human review study, or narrow/stop per Fork E.