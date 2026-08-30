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

**WP9 Hardening Round 5 — IN PROGRESS (gate 2026-08-30: CONTINUE WITH CONSTRAINTS, fifth human gate). Prior Round4 COMPLETE 2026-08-29 (174/174 pass 58 files, ts-jest eb135eb→b1a97ac 277177 bytes PASS n=2 providers v8+Istanbul/babel) committed b50f977, reviewer ACCEPTED, contract 0.2 frozen INV-01..04 preserved.**

Scope Round4: Genuine Jest/Istanbul (kulshekhar/ts-jest babel) validates per-repo hypothesis, external diversity n=2 (v8 defu 12673 + Istanbul 277177) both PASS, threshold 30/15 unchanged, no src change, reversible.

Artifacts Round4: `experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json`, `repro-jest-genuine.md`, `threshold-addendum-round4.md`, `wp9-hardening-round4-report.md`
Verification Round4: 174/174 pass, tsc clean, build ok, gate PASS, genuine provider

---
## Next Step

**WP9 Hardening Round 5 — narrow constrained (per gate CONTINUE WITH CONSTRAINTS). Candidates: (A) real-git main() without mocks, (B) additional Jest repo microsoft/tsdoc genuine provider (n=3). Both Low/Medium cost; deferred: monorepo/history/languages/security Candidate 7 still deferred. Awaiting planner grill + plan approval before implementation.**

Prior rounds: R1 cli unit 87.8% parseCliArgs, R2 main integration, R3 fallback variant2, R4 genuine Jest n=2.
