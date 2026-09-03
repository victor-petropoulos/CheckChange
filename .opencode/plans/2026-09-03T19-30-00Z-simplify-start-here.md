---
task: "Simplify opencode_start_here.md required reading list"
created: "2026-09-03T19:30:00Z"
approved: true
tasks:
  - id: "1"
    description: "Create updated SESSION_CONTEXT_2026-09-03.txt covering full close pre-Angular COMPLETE"
    agent: "implementer"
    files: ["docs/Project Master Plans/SESSION_CONTEXT_2026-09-03.txt"]
    acceptance: "File exists with content based on SESSION_CONTEXT_2026-08-26.txt plus opencode_start_here.md current/next step, includes: WP9 Hardening Rounds 7-8 COMPLETE, Angular Phase 1 next via language:angular + LCOV, test results (233 pass, LCOV+Python/providers, security harden, corpus 17, E2E 0.78s/0.81s), rev-1788397101053-2 0 findings, CI both SUCCESS be9f97a, commits feaa492/be9f97a, hardening B plans approved"
    depends_on: []
  - id: "2"
    description: "Update opencode_start_here.md to 2-item required reads + reference section"
    agent: "implementer"
    files: ["opencode_start_here.md"]
    acceptance: "File shows exactly 2 required reads (EXECUTION GUIDANCE and SESSION_CONTEXT_2026-09-03.txt), Roadmap.txt and Post_WP9_Detailed_Roadmap.md moved to 'Reference (not required, grep if needed)' section, WP5_6_REMEDIATION_CLOSURE.md entry removed, current/next step block preserved, backup exists as opencode_start_here.md.bak.<timestamp>"
    depends_on: ["1"]
---