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
**WP15 JS+React + WP16 Next.js slice COMPLETE 2026-09-02 — schema 0.4, JS+React 216 pass + Next.js 223 pass (next > react)**

WP15: JS (.js/.jsx/.mjs/.cjs) via patched core allowJs, dispatcher javascript + framework react, collector getGitTrackedCodeFiles, synthetic js-sample high CC13 + jsx-sample, faults 10 PASS, 216 pass tsc0. WP16-Next: app/page.tsx + next.config.js via detectNextFramework next>react priority, synthetic next-sample framework next verified, dispatcher 5 + faults 2 PASS, 223/223 pass tsc0, provisional real-repo deferred. Plans .opencode/plans/2026-09-02T080000Z-js-react-expansion.md + 2026-09-02T090000Z-next-js-expansion.md approved:true. Human review AWAITING for Next.js slice.

## Next Step
**NEXT: Angular expansion OR WP15/16 usefulness human study OR hardening — evidence-driven per Post_WP9 §10-16. No code until next plan approved. WP16-Next provisional constraints: real-repo Istanbul coverage + parser persistence via pnpm patch.**

```
AWAITING HUMAN REVIEW — WP16 Next.js 0.4
```