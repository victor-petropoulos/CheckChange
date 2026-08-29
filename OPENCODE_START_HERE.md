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

**WP9 Hardening Round 2 — COMPLETE 2026-08-29 (174/174 pass 58 files, cli.ts 86/98 87.8% main 8 hits, main integration 8 tests, round2 addendum+report, reviewer ACCEPTED). Human gate 2026-08-29: CONTINUE WITH CONSTRAINTS (third, approved).**

---
## Next Step

**WP9 Hardening Round 3 — COMPLETE 2026-08-29 (174/174 pass 58 files, no src change, external matrix Jest/Istanbul attempted defu variant2 fallback 12673 bytes PASS, threshold addendum round3, report, reviewer ACCEPTED) — AWAITING HUMAN REVIEW for CONTINUE/STOP fork.**

Scope completed: Jest/Istanbul provider search deferred due to suitable TS Jest repo scarcity (type-fest/guideline no TS diffs), fallback defu 869a053→HEAD variant validates determinism across base SHAs, external diversity still n=1 provider (v8) + 2 variants, contract 0.2 frozen INV-01..04 preserved, reversible.

Artifacts: `experiments/wp9-hardening-round3/evidence/external-pilot-jest.json`, `repro-jest.md`, `threshold-addendum-round3.md`, `wp9-hardening-round3-report.md`
Verification: 174/174 pass, tsc clean, build ok, second provider evidence valid per contract, no src change