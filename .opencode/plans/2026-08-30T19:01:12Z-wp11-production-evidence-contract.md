---
task: "WP11 Production Evidence Contract"
created: "2026-08-30T19:01:12Z"
approved: true
tasks:
  - id: "1"
    description: "Inventory current contract surface: document input (git refs, coverage path, config, provenance), output (EvidenceOutput schema 0.2 all fields), error vocabulary (INV-01..04, missing/malformed/GIT unavailable/repo invalid/analyzer failed), CLI flags, determinism, provenance"
    agent: "documenter"
    files: ["docs/11_WP11_CONTRACT_INVENTORY.md"]
    acceptance: "File exists and contains sections for each inventory item with file:line citations from existing sources (evidence-contract.md, evidence.ts, cli.ts, coverage.ts, 10_WP10_CAPABILITY_DEFINITION.md, Post_WP9_Detailed_Roadmap.md §6)"
    depends_on: []
  - id: "2"
    description: "Define versioning + compatibility rules — schemaVersion 0.2 lifecycle, forward/backward compat, breaking-change policy, deprecation process. How caller detects version, how engine signals version. Must NOT bump schema unless gap proven."
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "File contains a new section 'Versioning & Compatibility' (or similar) detailing schema version semantics, forward/backward compatibility rules, and breaking-change policy without changing the current schema version (0.2)"
    depends_on: ["1"]
  - id: "3"
    description: "Define input validation spec — exact validation for --base (git ref format, required), --coverage-file (path existence, JSON schema, Istanbul statementMap/fnMap/branchMap), --crap-threshold (number >=0), cwd, engine version. For each invalid input define error code + status + CLI exit."
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "File contains a new subsection under CLI Contract specifying validation rules and error handling for each flag, including exit codes and error messages for invalid inputs"
    depends_on: ["2"]
  - id: "4"
    description: "Define error semantics exhaustively — preserve ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL. Map each to: per-function state, analysisStatus, completeness, gate, exit code, coverageErrorReason, capabilities. Include examples: missing coverage file vs malformed JSON vs git ENOENT vs not-a-repo vs zero-coverage."
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "File contains a new subsection under Unsupported Conditions or a new section detailing error semantics with mappings and examples for each error condition"
    depends_on: ["3"]
  - id: "5"
    description: "Define determinism + provenance — same inputs (evidence+config+engine version) → equivalent output; provenance fields: base/target SHAs, changedFunctions file/method/lineStart/lineEnd/cc/crap/coverage, complexity source crap-typescript@0.5.0, coverage source (caller-provided path+size), config (threshold), engine version/commit, Node version, reproducibility steps."
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "File contains a new subsection under Provenance Pipeline or a new section detailing determinism guarantee and enumerating provenance fields with examples"
    depends_on: ["4"]
  - id: "6"
    description: "Contract verification tests — write contract tests that assert: schemaVersion 0.2, threshold defaults, error vocabulary distinct (missing vs malformed, ENOENT vs not-a-repo, zero vs null), determinism (same inputs twice → same output ignoring timestamps), provenance presence. These are read-only assertions against existing engine, not engine changes."
    agent: "tester"
    files: ["test/contract/wp11.spec.ts"]
    acceptance: "Test file exists and passes (vitest run) asserting the contract properties without modifying engine source (src/ diff clean)"
    depends_on: ["5"]
  - id: "7"
    description: "Update OPENCODE_START_HERE.md + PROJECT_STATUS.md to reflect WP11 completion criteria and next (WP12 CI validation). Depends on Task 6."
    agent: "documenter"
    files: ["OPENCODE_START_HERE.md", "PROJECT_STATUS.md"]
    acceptance: "Both files updated to reflect WP11 completion and readiness for WP12 integration validation"
    depends_on: ["6"]
---