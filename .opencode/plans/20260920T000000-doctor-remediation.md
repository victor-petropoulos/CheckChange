---
task: "Add per-probe remediation hints to doctor output (text + JSON)"
created: "2026-09-20T00:00:00Z"
approved: true
repo_conventions:
  gate: "npx checkchange check --json"
  entry_points: ["src/cli.ts"]
  review_hook: "none"
  graph_tool: "graphify"
risks:
  - risk: "Remediation strings may become stale if CLI flags change"
    mitigation: "Keep hints in single location per probe; test assertions on exact hint text"
    signal: "gate test run"
  - risk: "JSON output shape change breaks downstream consumers"
    mitigation: "Add optional `remediation` field only; never rename/remove existing fields"
    signal: "JSON schema test"
guardrails:
  - "No behavior change to probe logic — only add hint strings"
  - "JSON output backward compatible: new field only"
  - "Text output: hint on new line after probe line"
max_rounds: 3
tasks:
  - id: "1"
    description: "Add remediation hints to each probe in runDoctor; extend DoctorProbe type with optional remediation; emit in both text and JSON output"
    agent: "implementer"
    files: ["src/cli.ts"]
    seam: "src/cli.ts runDoctor() lines 322-395 — extend DoctorProbe and probe helper; rejected: separate formatter module (over-engineering, single call site)"
    acceptance: "tsc --noEmit passes; JSON output includes remediation field for each probe state; text output prints hint on new line after probe line"
    impact: "consumers: none (doctor is leaf); interface diff: +remediation? on DoctorProbe; migration: none"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Add unit tests for doctor remediation strings — one test per probe state asserting hint text present in both text and JSON output"
    agent: "tester"
    files: ["src/cli.test.ts", "src/cli.ts"]
    acceptance: "vitest run src/cli.test.ts passes; each probe state (gitExecutable missing, gitRepo error, defaultBase missing, providerAvailability no-changed-files/partial/skipped/error, coverageArtifact missing/malformed/present) has test asserting exact hint text"
    impact: "consumers: test file only; no src interface change"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Add docs note in AGENTS.md or similar referencing doctor remediation hints"
    agent: "documenter"
    files: ["AGENTS.md"]
    acceptance: "AGENTS.md includes one-line note: 'doctor --json includes remediation field per probe; text output prints hint after each probe line'"
    impact: "docs only"
    open_questions: "none"
    depends_on: ["1"]
---