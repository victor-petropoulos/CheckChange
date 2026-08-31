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

**WP11 PRODUCTION EVIDENCE CONTRACT COMPLETE 2026-08-30** — docs/11_WP11_CONTRACT_INVENTORY.md (92 lines, 7 sections, no src change) + docs/contracts/evidence-contract.md appended §§ Versioning & Compatibility, Input Contract & Validation, Error Semantics, Determinism & Provenance (230 lines total, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved) + test/contract/wp11.contract.spec.ts 10 tests, 188/188 pass (60 files, was 178/178), tsc 0, build ok, src/ clean.
---
## Next Step

**AWAITING HUMAN REVIEW — WP11 Production Evidence Contract COMPLETE. Gate WP12 (CI Integration Validation) requires explicit CONTINUE.**

Per `docs/11_WP11_CONTRACT_INVENTORY.md` + `docs/contracts/evidence-contract.md` (WP11 §§ V/C/I/E/D) + `docs/10_WP10_CAPABILITY_DEFINITION.md` §9: WP11 DONE (inventory + versioning/compat + input validation + error semantics + determinism/provenance, doc-only, schema 0.2 frozen). Next is WP12 — validate stable contract in 2 real CI pipelines → measure setup complexity, failure modes, evidence completeness, developer comprehension, CI cost, reproducibility. If reliable → toward WP15 real-world validation; if fragile → diagnose caller-side vs contract vs provider before any engine change. Alternative forks: WP13 language, WP14 historical Node20.9, WP15 human study, or narrow/stop per Fork E. No implementation beyond WP11 without CONTINUE.