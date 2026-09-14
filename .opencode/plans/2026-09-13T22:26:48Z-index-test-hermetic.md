---
task: "Make src/index.test.ts hermetic to avoid transient gate-null failures"
created: "2026-09-13T22:26:48Z"
approved: true
repo_conventions:
  gate: "npm test"
  entry_points: ["src/index.ts"]
  review_hook: "none"
  graph_tool: "graphify"
risks:
  - { risk: "Test still flaky due to other environmental factors", mitigation: "Use hermetic tmpDir and control all inputs", signal: "gate PASS in both cases" }
  - { risk: "Negative case setup incorrect", mitigation: "Verify malformed artifact triggers coverage-failed branch", signal: "gate null and coverageErrorReason present" }
guardrails: ["test must pass in isolation", "no src/ changes except test file"]
max_rounds: 3
tasks:
  - id: "1"
    description: "Hermetic positive: tmpDir with empty src, no coverage file, empty intervals -> expect schemaVersion 0.5, gate PASS, analysisStatus SUCCESS"
    agent: "implementer"
    files: ["src/index.test.ts"]
    seam: "src/evidence.ts buildEvidenceOutput() — enabled by cwd param (3rd); rejected: none"
    acceptance: "Test passes: npx vitest run src/index.test.ts returns 2/2 PASS, tsc clean, lint clean"
    impact: "consumers: [src/index.test.ts:9-22]; interface diff: none; migration: none"
    depends_on: []
  - id: "2"
    description: "Hermetic negative: tmpDir with empty src, malformed .coverage file, empty intervals -> expect schemaVersion 0.5, gate null, analysisStatus FAILED, completeness INCOMPLETE, coverageErrorReason malformed"
    agent: "implementer"
    files: ["src/index.test.ts"]
    seam: "src/evidence.ts buildEvidenceOutput() — enabled by cwd param (3rd); rejected: none"
    acceptance: "Test passes: npx vitest run src/index.test.ts returns 2/2 PASS (the negative case test), tsc clean, lint clean"
    impact: "consumers: [src/index.test.ts:9-22]; interface diff: none; migration: none"
    depends_on: ["1"]
---