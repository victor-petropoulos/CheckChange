---
task: "WP7 — Productionization"
created: "2026-08-28T15:51:18Z"
approved: true
tasks:
  - id: "1"
    description: "Reconstruct WP6 state, verify 149/149 tests pass, tsc clean, and minimal CI proof passes."
    agent: "researcher"
    files:
      - "package.json"
      - "src/index.ts"
      - "experiments/wp6/minimal-ci-proof/run-proof.sh"
      - "docs/contracts/evidence-contract.md"
    acceptance: "WP6 state confirmed: 149 tests pass, tsc clean, run-proof.sh exits 0, contract schema 0.2 frozen."
    depends_on: []
  - id: "2"
    description: "Align package.json version with contract 0.2.0, freeze docs/contracts/evidence-contract.md, add version badge."
    agent: "implementer"
    files:
      - "package.json"
      - "docs/contracts/evidence-contract.md"
    acceptance: "package.json version === '0.2.0', contract unchanged, no breaking changes."
    depends_on:
      - "1"
  - id: "3"
    description: "Add prepare/prepublishOnly scripts, verify types bundling, ensure bin works, test npm pack."
    agent: "implementer"
    files:
      - "package.json"
      - "tsconfig.json"
      - "src/index.ts"
    acceptance: "package.json has prepare script, npm pack succeeds, types exported, bin/code-risk works after install."
    depends_on:
      - "2"
  - id: "4"
    description: "Implement config for thresholds, coverage-file, json output, failure behavior; ensure evidence semantics unchanged."
    agent: "implementer"
    files:
      - "src/cli.ts"
      - "src/evidence.ts"
      - "src/rules.ts"
    acceptance: "CLI accepts --crap-threshold, --coverage-file, --json; exit codes per contract; evidence output unchanged for same inputs."
    depends_on:
      - "3"
  - id: "5"
    description: "Audit coverage path traversal, git exec, fs access, deps, ensure no secrets; add safety checks."
    agent: "implementer"
    files:
      - "src/coverage.ts"
      - "src/cli.ts"
      - "package.json"
      - ".npmrc"
    acceptance: "path.relative boundary intact, git args sanitized, no node_modules secrets, deps audit clean, no hardcoded credentials."
    depends_on:
      - "4"
  - id: "6"
    description: "Ensure diagnostics map to analysisStatus/gate/completeness truthfully; add --verbose flag for deep troubleshooting."
    agent: "implementer"
    files:
      - "src/cli.ts"
      - "src/evidence.ts"
    acceptance: "--verbose flag outputs structured diagnostics; analysisStatus, gate, completeness reflect truth; no contradiction."
    depends_on:
      - "5"
  - id: "7"
    description: "Benchmark small/medium/large repos; record wall-clock, memory; set baselines for regression."
    agent: "tester"
    files:
      - "experiments/wp7/benchmarks/small.sh"
      - "experiments/wp7/benchmarks/medium.sh"
      - "experiments/wp7/benchmarks/large.sh"
    acceptance: "Benchmarks run, wall-clock and memory recorded in docs/perf-baseline.md; no regressions vs WP6."
    depends_on:
      - "6"
  - id: "8"
    description: "Verify clean install, reproducible build, regression test, integration proof, docs, end with AWAITING HUMAN REVIEW."
    agent: "documenter"
    files:
      - "README.md"
      - "docs/wp7-release-checklist.md"
      - "experiments/wp6/minimal-ci-proof/run-proof.sh"
      - "experiments/wp7/regression-test.sh"
    acceptance: "Clean install (npm ci) works, build reproducible, 149 tests pass, integration proof passes, release packet drafted, ends with AWAITING HUMAN REVIEW."
    depends_on:
      - "7"
---