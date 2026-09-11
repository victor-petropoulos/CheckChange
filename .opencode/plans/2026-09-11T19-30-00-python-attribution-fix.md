---
task: "Fix Python attribution to enable COMPLETE CRAP evaluation"
created: "2026-09-11T19:30:00Z"
approved: true
tasks:
  - id: "1"
    description: "Implement src/complexity-providers/pythonDescriptorProvider.ts that spawns python3 AST to emit MethodDescriptor-compatible objects; modify src/attribution.ts to guard .py files to use this parser else TS parseFileMethods."
    agent: "implementer"
    files:
      - "src/complexity-providers/pythonDescriptorProvider.ts"
      - "src/attribution.ts"
    acceptance: |
      - npx tsc --noEmit passes with no new errors.
      - New provider exports interface matching ComplexityProvider.
      - attribution.ts uses pythonDescriptorProvider for .py files, fallback to parseFileMethods for others.
      - Existing TS attribution tests (259) still pass.
      - No runtime errors when parsing valid/invalid Python files.
    depends_on: []
  - id: "2"
    description: "Create test/attribution-python.test.ts with seed health.py pattern (1 function CC2) expecting COMPLETE PASS; extend test/coverage-python.test.ts to assert buildEvidenceOutput produces correct attribution (not just ingest)."
    agent: "tester"
    files:
      - "test/attribution-python.test.ts"
      - "test/coverage-python.test.ts"
    acceptance: |
      - npx vitest run test/attribution-python.test.ts passes.
      - npx vitest run test/coverage-python.test.ts passes, including new assertion that buildEvidenceOutput returns non-empty changedFunctions with correct crap values for .py.
      - Test seed mirrors experiments/wp18-o01/seeded-CHANGE.md.
    depends_on: ["1"]
  - id: "3"
    description: "Run seeded OICP re-run (using experiments/wp18-o01 seed) to verify COMPLETE PASS outcome; ensure checkchange WARN/PASS on seeded change with non-zero functions."
    agent: "tester"
    files: []
    acceptance: |
      - Running the OICP verification script (node dist/cli.js check --json --base HEAD) on the seeded change yields:
          * completeness: "COMPLETE"
          * changedFunctions length > 0
          * at least one function with crap < 30 => result "PASS" (or WARN if any high crap, but seed expects PASS).
      - No regression in existing OICP ingest-only tests.
    depends_on: ["2"]
  - id: "4"
    description: "Run Engram review pre-commit on changes; run tsc, vitest, checkchange; ensure no new warnings."
    agent: "reviewer"
    files: []
    acceptance: |
      - Engram review_changes returns no Critical or High severity findings (any Medium/Low accepted or mitigated).
      - npx tsc --noEmit reports 0 errors.
      - npx vitest runs all tests (including new) with 0 failures.
      - checkchange check --json returns status indicating no drift or expected WARN/PASS as appropriate.
    depends_on: ["3"]
  - id: "5"
    description: "Update docs/contracts/evidence-contract.md gap note; append to PROJECT_STATUS_CONSOLIDATED.md; add note to experiments/wp18-o01/RESULTS.md and PACKET.md about COMPLETE PASS."
    agent: "documenter"
    files:
      - "docs/contracts/evidence-contract.md"
      - "PROJECT_STATUS_CONSOLIDATED.md"
      - "experiments/wp18-o01/RESULTS.md"
      - "experiments/wp18-o01/PACKET.md"
    acceptance: |
      - evidence-contract.md updated to reflect Python attribution now handles .py functions (gap closed or noted as resolved).
      - PROJECT_STATUS_CONSOLIDATED.md appended with concise entry: "Python attribution fix: COMPLETE CRAP evaluation enabled."
      - experiments/wp18-o01/RESULTS.md and PACKET.md updated with outcome of re-run showing COMPLETE PASS.
      - No formatting errors; files remain valid markdown.
    depends_on: ["4"]
---