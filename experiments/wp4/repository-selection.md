# WP4 Repository Selection

Date: 2026-08-24
Selection Methodology: Selected three public TypeScript repositories based on the criteria in WP4_USEFULNESS_VALIDATION.md:
- Public and open source
- Primarily TypeScript
- npm-compatible installation
- Contain automated tests and coverage-capable tooling
- Have enough non-trivial functions to exercise the analyzer
- Have accessible Git history
- Are small/medium enough to run locally without special infrastructure
- Deliberately varied sample (small library, medium application/tool, structurally different)
- Not selected based on expected CRAP scores
- Selection completed before any tool runs or change evaluation

| Repository | URL | License | Primary Language | Package Manager | Test Framework | Stars/Size | Rationale |
|------------|-----|---------|------------------|-----------------|----------------|------------|-----------|
| sindresorhus/p-limit | https://github.com/sindresorhus/p-limit | MIT | TypeScript | npm | Ava | ~1.5k stars, small (~200 lines) | Small utility library for limiting promise concurrency. Represents a small, focused package with clear functionality. |
| colinhacks/zod | https://github.com/colinhacks/zod | MIT | TypeScript | npm | Vitest | ~25k stars, medium (~5k lines) | TypeScript-first schema validation library with complex type inference. Represents a medium-sized library with substantial non-trivial functions. |
| pmndrs/zustand | https://github.com/pmndrs/zustand | MIT | TypeScript | npm | Vitest | ~30k stars, medium (~1.5k lines) | Small, fast, and scalable state management solution with minimal API. Represents a structurally different approach to state management compared to traditional Redux-style solutions. |

**Note on Selection Timing**: This repository selection was completed before any WP4 tool runs, change evaluations, or observation of WP4 results, as required by WP4_USEFULNESS_VALIDATION.md Section 33-34 and Phase 1 of WP4_EXECUTION_PLAYBOOK.md.

**Pinned Commits Placeholder**: Specific commit SHAs for base/target comparisons will be recorded in the next phase (WP4 Phase 2) after repository cloning.