---
task: "Address all OPEN/PROVISIONAL limitations before Angular integration"
created: "2026-09-02T213250Z"
approved: true
tasks:
  - id: "1"
    description: "WP9 R8: Generate fresh tsdoc coverage with Node 18 for historical per-commit validation"
    agent: "implementer"
    files: ["scripts/tsdoc-coverage.sh", "docs/experiments/wp9-r8-historical-coverage.md"]
    acceptance: "Coverage artifact generated, historical complexity/change evidence validated, results documented"
    depends_on: []
  - id: "2"
    description: "WP13 #2: Implement Python AST-based complexity provider to achieve CC correlation ≥0.95"
    agent: "implementer"
    files: ["src/complexity-providers/pythonASTComplexityProvider.ts", "experiments/wp13/adapter/pythonComplexityAST.ts", "test/cc-correlation.test.ts"]
    acceptance: "Provider interface implemented, correlation test passes with ≥0.95 on synthetic benchmark suite"
    depends_on: ["1"]
  - id: "3"
    description: "Hardening P1-5: Measure performance with large monorepo coverage artifact (tsdoc 1.6M)"
    agent: "tester"
    files: ["docs/superpowers/plans/hardening-b-perf.md"]
    acceptance: "Wall-clock time, RSS, artifact size recorded for tsdoc coverage; no scaling issues identified"
    depends_on: ["1"]
  - id: "4"
    description: "WP5.6 TS/JS focus only: Add second Python real repo (e.g., requests) to corpus"
    agent: "implementer"
    files: ["test/corpus/python-repos.md", "scripts/run-python-corpus.sh"]
    acceptance: "Second Python repo processed successfully, valid evidence produced, added to test corpus"
    depends_on: ["2"]
  - id: "5"
    description: "WP5.6 single-package only: Add tsdoc Rush monorepo case to corpus"
    agent: "implementer"
    files: ["test/corpus/monorepos.md", "scripts/run-monorepo-corpus.sh"]
    acceptance: "Tsdoc monorepo processed successfully, valid evidence produced, added to test corpus"
    depends_on: ["1"]
  - id: "6"
    description: "WP5.6 Istanbul/v8 only no LCOV: Add LCOV coverage provider"
    agent: "implementer"
    files: ["src/coverage-providers/lcovProvider.ts", "src/evidence.ts", "test/lcov-provider.test.ts"]
    acceptance: "LCOV provider integrated, parses LCOV artifacts correctly, all existing tests pass"
    depends_on: []
  - id: "7"
    description: "WP5.6 11 cases small sample: Expand corpus to 15-20 cases"
    agent: "implementer"
    files: ["test/corpus/index.md", "test/corpus/python-repos.md", "test/corpus/monorepos.md", "test/corpus/lcov-repos.md"]
    acceptance: "Test corpus size ≥15 cases, all repos process successfully, vitest pass rate ≥95%"
    depends_on: ["4", "5", "6"]
  - id: "8"
    description: "WP5.6 WARN generalizability & D-APOLLO: Fix apollo-client coverage with Jest 26 shim"
    agent: "implementer"
    files: ["scripts/apollo-jest26-shim.sh", "test/corpus/apollo-repos.md"]
    acceptance: "Apollo-client coverage generated, engine processes it, WARN cases observed in corpus"
    depends_on: []
  - id: "9"
    description: "WP5.6 function-level coverage not statement/branch: Document granularity limit"
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/limitations.md", "docs/contracts/evidence-contract.md"]
    acceptance: "Limitations doc updated to clarify function-level coverage only, evidence contract notes attribution granularity"
    depends_on: []
  - id: "10"
    description: "WP15 provisional real-repo closed: Update docs to reflect closed status for p-queue/zustand"
    agent: "documenter"
    files: ["docs/superpowers/plans/hardening-b-perf.md", "experiments/wp15-js/human-review-packet.md"]
    acceptance: "Docs state p-queue/zustand real-repo validation closed, no longer provisional"
    depends_on: ["3"]
  - id: "11"
    description: "Hardening P1-4 CC benchmark <0.95: Propose correction factor or document deviation"
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "Evidence contract updated with correction factor proposal or documented deviation rationale"
    depends_on: ["2"]
---