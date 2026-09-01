---
task: "WP13 remediation A+B — git+fault and coverage+fixtures"
created: "2026-09-01T17:00:00Z"
approved: true
tasks:
  - id: "A1"
    description: "Extend src/git.ts regex to support .py files; change file filter from \.tsx?$ to \.([jt]sx?|py)$"
    agent: "implementer"
    files: ["src/git.ts", "src/git.test.ts"]
    acceptance: "npx tsc --noEmit 0, getChangedIntervals returns .py intervals for synthetic git diff, vitest 191/191, manual git diff test"
    depends_on: []
  - id: "A2"
    description: "Add adapter fault-injection tests for missing lizard binary and malformed/missing coverage.json"
    agent: "implementer"
    files: ["experiments/wp13/adapter/pythonComplexity.ts", "experiments/wp13/adapter/pythonCoverage.ts", "experiments/wp13/adapter/*.spec.ts"]
    acceptance: "vitest 191/191 + new fault tests pass, tsc0"
    depends_on: []
  - id: "B1"
    description: "Update pythonCoverage.ts to populate branchMap and set coverageKind:'branches' when branch data present; update e2e.ts to handle both kinds"
    agent: "implementer"
    files: ["experiments/wp13/adapter/pythonCoverage.ts", "experiments/wp13/adapter/e2e.ts"]
    acceptance: "tsc0, e2e shows coverageKind branches for fixture (percent_branches_covered 65%), gate still PASS@30 WARN@15, vitest 191/191"
    depends_on: ["A1", "A2"]
  - id: "B2"
    description: "Add two synthetic fixtures: python-async (async/await) and python-classes (class with methods, nested class, staticmethod)"
    agent: "implementer"
    files: ["experiments/wp13/fixtures/python-async/**", "experiments/wp13/fixtures/python-classes/**"]
    acceptance: "lizard parses each fixture, pytest --cov produces coverage.json, e2e can run each fixture via helper"
    depends_on: ["A1"]
---