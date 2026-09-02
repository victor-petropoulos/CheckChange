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
**WP14 historical fresh per-commit coverage APPROVED 2026-09-01 — COMPLETE (commits 00203d4/e11ec0b, Node 20.10.0, schema 0.3, gate WARN/WARN, coverage 24k/29k distinct, hashes 8acc60fa/0053189c)**
WP14: TSDoc/Rush eslint-plugin, fresh coverage per-commit via worktrees + heft test --config jest.coverage.config.json under Node 20.10.0, engine @barney-media/crap-typescript-core@0.5.0, schema 0.3 language typescript, delta CRAP 54.67 vs 116.98 coverage-aware (not complexity-only), closes Round8 reuse gap (1.62M reused → distinct 24k/29k). WP13-LANG-REGISTRY + CC-EQUIVALENCE + SCHEMA 0.3 + WP10/11/12 preserved. 201/201 pass tsc0, npm audit 0 vulns. Plan .opencode/plans/2026-09-01T19:30:00Z-wp14-historical-fresh-coverage.md approved:true. Reviewer PASS, security PASS, 3 limitations documented provisional/2-point/branch-only. Human review APPROVED.

## Next Step
**NEXT: WP15 usefulness (human study) OR WP16 hardening OR STOP — evidence-driven per Post_WP9 §10-16. No code until next plan approved. Provisional limitations (single-env, 2-point, branch-only) deferred unless WP15 requires expansion.**

```
CONTINUE — WP14 APPROVED
```