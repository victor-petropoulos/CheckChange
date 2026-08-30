# OpenCode Start Here


Read, do not skip this,:

1. `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt`
2. `docs/Project Master Plans/Roadmap.txt`
3. `docs/Project Master Plans/SESSION_CONTEXT_2026-08-26.txt`
4. `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` (2026-08-27)


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

**WP9 Hardening Round 4 — COMPLETE 2026-08-29 (174/174 pass 58 files, genuine Jest/Istanbul ts-jest eb135eb→b1a97ac 277177 bytes PASS 6 funcs 3 PASS crap 4.37/7.11/5.03, threshold addendum round4, report, reviewer ACCEPTED). Human gate 2026-08-29: CONTINUE WITH CONSTRAINTS (fourth, approved).**

Scope completed: Genuine Jest/Istanbul provider success (kulshekhar/ts-jest babel Istanbul) validates per-repo hypothesis, external diversity now n=2 providers (v8 defu 12673 + Istanbul ts-jest 277177) both PASS, contract 0.2 frozen INV-01..04 preserved, no src change, reversible.

Artifacts: `experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json`, `repro-jest-genuine.md`, `threshold-addendum-round4.md`, `wp9-hardening-round4-report.md`
Verification: 174/174 pass, tsc clean, build ok, genuine provider evidence valid per contract 0.2, no src change

---
## Next Step

**AWAITING HUMAN REVIEW for CONTINUE / CONTINUE WITH CONSTRAINTS / STOP fork per Roadmap WP9 evidence-driven evolution.**

Prior rounds: R1 cli unit 87.8% parseCliArgs, R2 main integration, R3 fallback variant2, R4 genuine Jest. Next narrow options if CONTINUE: real-git main without mocks or additional Jest repo (microsoft/tsdoc) — both Low/Medium cost, deferred monorepo/history/languages/security per prioritization Candidate 7 still deferred.