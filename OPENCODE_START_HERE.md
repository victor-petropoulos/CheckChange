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
**Hardening B (WP13 Python + WP15 JS/React + WP16 Next) IN PROGRESS 2026-09-02 — P0-1 patch + P0-3 registry DONE, 224 pass**

Hardening B plan .opencode/plans/2026-09-02T182626Z-hardening-b-python-js-next.md approved:true, commit 388d992. P0-1 pnpm patch persists (patches/crap-typescript-core+0.5.0.patch, ANALYZABLE_EXTENSIONS, jsx->TSX), P0-3 dispatch registry in src/evidence.ts (tsx/ts/js/jsx/mjs/cjs + .py delegation), tsc0 224 pass (70 files, includes cc-bench). P1-4 CC bench 10 funcs correlation 0.626 <0.95 (no correction, documented). P0-2 next-sample coverage generated (1.4K Istanbul JSON), p-queue/zustand real Istanbul provisional (p-queue coverage exists 1.2MB at /tmp/p-queue, zustand pending). P1-5 perf/sec not yet measured. Previous WP15/16 slices remain 223→224.

## Next Step
**NEXT: Complete Hardening B P0-2 (zustand + p-queue CLI verify) + P1-5 perf/sec + contract doc, OR defer to Angular. No Angular code until hardening B gate. Current blockers: CC correlation <0.95 requires human accept document divergence vs correction factor; real-repo CLI verify for zustand.**

```
AWAITING HUMAN REVIEW — Hardening B P0-1+3 done, P0-2/P1-4+5 provisional
```