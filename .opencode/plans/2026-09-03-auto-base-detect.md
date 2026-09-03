---
task: "Auto-detect base branch for checkchange"
created: 2026-09-03T06:55:00Z
approved: true
tasks:
  - id: "1"
    description: "Add detectDefaultBase() to src/git.ts with fallback chain"
    agent: "implementer"
    files: ["src/git.ts"]
    acceptance: "Function returns first resolvable ref, unit test with mocked git"
    depends_on: []
  - id: "2"
    description: "Make --base optional in src/cli.ts and wire auto-detect"
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "check without --base auto picks master on Engram, main on main-repo, --base explicit still works, --help updated"
    depends_on: ["1"]
---