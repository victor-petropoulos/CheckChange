---
task: "Extract helpers to reduce complexity in coverage.ts, cli.ts, and evidence.ts"
created: "2026-09-16T19:30:00Z"
approved: true
repo_conventions:
  gate: "pnpm run checkchange"
  entry_points: ["src/cli.ts"]
  review_hook: "none"
  graph_tool: "graphify"
risks:
  - { risk: "Extraction might break logic if not done carefully", mitigation: "Write tests before extraction and ensure they pass after", signal: "checkchange passes and tests green" }
  - { risk: "Missing edge cases in extracted helpers", mitigation: "Cover all branches in tests", signal: "vitest covers extracted functions" }
guardrails: ["No behavior change", "CRAP score <30 for extracted functions"]
max_rounds: 3
tasks:
  - id: "1"
    description: "Extract format-dispatch helper from readCoverageFile (lines 390-441) in src/coverage.ts and add unit tests"
    agent: "implementer"
    files: ["src/coverage.ts", "src/coverage.test.ts"]
    seam: "src/coverage.ts readCoverageFile() — required for src-touching tasks; rejected: creating new utility file (would require cross-file imports and change call sites)"
    acceptance: "Extracted function has CRAP<30 via checkchange, tsc clean, vitest green for new and existing tests"
    impact: "consumers: [src/coverage.ts:390-441]; interface diff: +extractFormatDispatcher() → -inline logic; migration: none"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Extract base-detect/output helpers from runCheck (lines 185-221) in src/cli.ts and add unit tests covering auto branches"
    agent: "implementer"
    files: ["src/cli.ts", "src/cli.test.ts"]
    seam: "src/cli.ts runCheck() — required for src-touching tasks; rejected: splitting into multiple files (would increase fan-out unnecessarily)"
    acceptance: "Extracted functions have CRAP<30 via checkchange, tsc clean, vitest green for new and existing tests"
    impact: "consumers: [src/cli.ts:185-221]; interface diff: +detectBase() +formatOutput() → -inline logic; migration: none"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Extract per-flag parsers from parseCliArgs (lines 48-142) in src/cli.ts and add combination tests"
    agent: "implementer"
    files: ["src/cli.ts", "src/cli.test.ts"]
    seam: "src/cli.ts parseCliArgs() — required for src-touching tasks; rejected: extracting to separate args parser module (would change entry-point wiring)"
    acceptance: "Extracted functions have CRAP<30 via checkchange, tsc clean, vitest green for new and existing tests"
    impact: "consumers: [src/cli.ts:48-142]; interface diff: +parseFlag() per flag → -inline logic; migration: none"
    open_questions: "none"
    depends_on: ["2"]
  - id: "4"
    description: "Extract extension-detect from buildEvidenceOutput (lines 344-363) in src/evidence.ts and add stage split tests"
    agent: "implementer"
    files: ["src/evidence.ts", "src/evidence.test.ts"]
    seam: "src/evidence.ts buildEvidenceOutput() — required for src-touching tasks; rejected: moving detection to constants file (would hide runtime logic)"
    acceptance: "Extracted function has CRAP<30 via checkchange, tsc clean, vitest green for new and existing tests"
    impact: "consumers: [src/evidence.ts:344-363]; interface diff: +getExtensionHandler() → -inline logic; migration: none"
    open_questions: "none"
    depends_on: ["3"]
---