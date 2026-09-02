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
**WP15 JS+React expansion APPROVED 2026-09-02 — COMPLETE (schema 0.4, language javascript + framework react, synthetic 3 JS + 2 JSX, 10 faults, 216 pass, parser allowJs)**

WP15: JS (.js/.jsx/.mjs/.cjs) via patched @barney-media/crap-typescript-core allowJs + ANALYZABLE_EXTENSIONS, dispatcher language javascript + framework react (package.json react dep), collector getGitTrackedCodeFiles, schema 0.4 additive, synthetic js-sample high CC13 med6 low1 + jsx-sample Component/useHook, dispatcher 2 PASS, jsPatch/jsxTest 2 PASS, collect 1 PASS, jsFault 10 PASS, 216/216 pass tsc0, real-repo p-queue/zustand provisional (c8 format mismatch). Fallback Approach2 documented. Plan .opencode/plans/2026-09-02T080000Z-js-react-expansion.md approved:true. Reviewer Task1 PASS rev-1788360897777-2, Task2 medium PATCH_NOTE, 3 limitations provisional (real-repo, parser persistence, framework .tsx). Human review CONTINUE WITH CONSTRAINTS 2026-09-02.

## Next Step
**NEXT: Next.js/Angular expansion (WP16) OR WP15 usefulness human study OR WP16 hardening — evidence-driven per Post_WP9 §10-16. No code until next plan approved. Provisional constraints carry forward: real-repo coverage format (c8→Istanbul conversion), parser persistence via pnpm patch/fork, framework detection for .tsx non-React. Narrow next WP to one framework slice.**

```
CONTINUE WITH CONSTRAINTS — WP15 0.4 APPROVED
```