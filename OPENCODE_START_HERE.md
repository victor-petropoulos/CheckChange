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

**WP9 READY FOR HUMAN CLOSURE APPROVAL** — WP9 Hardening Rounds 1–8 COMPLETE 2026-08-30 (178/178 pass 59 files, tsc clean, build ok, history/delta 2-point 00203d4 vs e11ec0b on tsdoc eslint-plugin, plugin cc5→6 crap15.54 PASS gate PASS 11 funcs INCOMPLETE vs getRoot cc12 crap116.97 WARN + plugin cc6 crap18.34 PASS gate WARN, delta plugin +1 cc +2.8 crap new WARN appears, coverage fallback full union 1,621,110 bytes 64 entries reused for both commits due to Rush Node 24.18.1 incompatibility with rush.json 16/18/20 ranges, complexity delta real, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved). No source changes since Round 5 (rounds 6–8 evidence-only). Graphify updated from commit 2972e5e.

Scope completed: History/delta trend validated — same repo/provider Jest v8 heft-web-rig, 2-point trend shows complexity increase and gate PASS→WARN, coverage fallback limitation documented, no src change, reversible. Provider diversity n=3 fresh (defu vitest v8 12K, ts-jest babel 277K, tsdoc Jest v8 29K + full union 1.62M), monorepo boundary validated at 55× scale (29K 3 entries → 1.62M 64 entries). Artifacts: experiments/wp9-hardening-round8/evidence/*.json, repro-history-delta.md, threshold-addendum-round8.md, wp9-hardening-round8-report.md. Verification: 178/178, tsc 0, build ok, INV preserved. Limitations: partial historical coverage (reuse), single monorepo (Rush), n=3 providers, TS-only — all acceptable per documented scope.
---
## Next Step

**AWAITING HUMAN REVIEW for CONTINUE / CONTINUE WITH CONSTRAINTS / STOP** — WP9 closure decision pending. Per closure assessment: **OPTION A — CLOSE WP9** under scoped claims (historical coverage partial not blocker, Candidate 6 deferred). If human review requires historical coverage claim: **OPTION B — ONE EXPERIMENT: Fresh Historical Per-Commit Coverage Rerun (Node 20.9)** per §14 of cumulative assessment. No new language/provider/monorepo experiments without explicit CONTINUE.
