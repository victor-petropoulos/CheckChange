---
task: "WP13 Python language expansion — minimal adapter + synthetic fixture"
created: "2026-09-01T15:59:54Z"
approved: true
tasks:
  - id: "1"
    description: "Create synthetic Python fixture at experiments/wp13/fixtures/python-sample/ with pyproject.toml, src/*.py (2-3 functions with known CC e.g., cc=2 and cc=8), tests/*.py, pytest config, coverage.py json generation script, git-committed fixture. No src/ changes."
    agent: "implementer"
    files:
      - "experiments/wp13/fixtures/python-sample/pyproject.toml"
      - "experiments/wp13/fixtures/python-sample/src/__init__.py"
      - "experiments/wp13/fixtures/python-sample/src/sample.py"
      - "experiments/wp13/fixtures/python-sample/tests/test_sample.py"
      - "experiments/wp13/fixtures/python-sample/coverage-json.sh"
    acceptance: "Fixture directory exists with valid pyproject.toml; python -m pytest --cov=src --cov-report=json:coverage.json runs and produces coverage.json; lizard src/ outputs JSON with function CC values; git add/commit works"
    depends_on: []
  - id: "2"
    description: "Create Python provider adapter at experiments/wp13/adapter/ (or minimal evidence.ts provider factory ≤10 lines) that normalizes lizard JSON → ComplexityInfo[] and coverage.py JSON → CoverageResult. Reuse crapCalc.ts, rules.ts, evidence.ts core unchanged. Preserve INV-01..04, ZERO≠NULL, MISSING≠MALFORMED semantics."
    agent: "implementer"
    files:
      - "experiments/wp13/adapter/pythonComplexity.ts"
      - "experiments/wp13/adapter/pythonCoverage.ts"
      - "experiments/wp13/adapter/index.ts"
      - "src/evidence.ts"
    acceptance: "TypeScript compiles (tsc --noEmit 0 errors); adapter exports ComplexityProvider and CoverageProvider matching existing interfaces; lizard JSON parsed to ComplexityInfo[]; coverage.json parsed to CoverageResult; no changes to crapCalc.ts/rules.ts/evidence.ts pipeline logic"
    depends_on: ["1"]
  - id: "3"
    description: "Wire adapter to produce EvidenceOutput schema 0.2 via synthetic fixture — run end-to-end: git diff → python adapter complexity → coverage attribution → CRAP calc → rules evaluation → EvidenceOutput with language:python provenance. Demonstrate PASS/WARN at thresholds 30/15, gate/completeness truthful."
    agent: "implementer"
    files:
      - "experiments/wp13/adapter/e2e.ts"
      - "experiments/wp13/fixtures/python-sample/"
    acceptance: "e2e script runs without error; output matches EvidenceOutput schema 0.2; provenance includes language:python; CRAP values computed correctly for cc=2 (low) and cc=8 (high) functions; rules.ts evaluates PASS/WARN at 30/15 thresholds; INV-01..04 preserved (coverage:0 valid, null unavailable, missing≠malformed)"
    depends_on: ["2"]
  - id: "4"
    description: "Verification + docs — tsc --noEmit clean, vitest 191/191 + Python fixture e2e passes, add Python provenance note to docs/contracts/evidence-contract.md (no schema bump), create experiments/wp13/WP13_RESULTS.md with claims/evidence matrix, create human-review packet stub."
    agent: "documenter"
    files:
      - "docs/contracts/evidence-contract.md"
      - "experiments/wp13/WP13_RESULTS.md"
      - "experiments/wp13/HUMAN_REVIEW_STUB.md"
    acceptance: "tsc --noEmit 0 errors; vitest --no-coverage 191/191 pass; python e2e produces valid contract-0.2 output; evidence-contract.md addendum documents Python provenance field only (no schema version bump); WP13_RESULTS.md has claims/evidence table with bash-verifiable evidence (tsc, vitest, coverage.json, CRAP calc); HUMAN_REVIEW_STUB.md lists scope/boundary/constraints for review"
    depends_on: ["3"]
---