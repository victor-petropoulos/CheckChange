---
task: "CheckChange Trust Layer — additive lineage, completeness, fingerprinting (Experiment A); CLI dispatcher prerequisite; terminology reconciliation; deterministic sidecar diagnostics"
created: "2026-09-12T18:34:32Z"
approved: true
tasks:
  - id: "1"
    description: "Create terminology reconciliation decision doc: map code terms (available/absent/failed, passed/failed/skipped, SUCCESS/FAILED/UNSUPPORTED) to proposed terms (DIRECT/ATTRIBUTED/HISTORICAL/UNAVAILABLE, NATIVE/PROVIDER/FALLBACK/UNAVAILABLE); resolve 'absent' vs 'unavailable' drift at src/evidence.ts:211; output DECISION.md with binding table"
    agent: "documenter"
    files: ["docs/decisions/terminology-reconciliation.md"]
    acceptance: "DECISION.md exists with binding table mapping every code term to canonical term; no new code; git diff --stat shows only new doc file"
    depends_on: []
  - id: "2"
    description: "Design additive diagnostics object schema for EvidenceOutput v0.5: lineage[], quality{}, fingerprints{}; ensure all fields optional, no required-field changes, schemaVersion bump to '0.5' only when additive fields stabilize; keep EvidenceOutput deterministic per evidence-contract.md:341"
    agent: "documenter"
    files: ["docs/decisions/diagnostics-schema-design.md", "docs/contracts/evidence-contract.md"]
    acceptance: "Design doc defines diagnostics object structure with examples; evidence-contract.md amended with INV-05 DIAGNOSTICS TRUTHFUL + versioning note; no source code changes; git diff --stat shows only docs"
    depends_on: ["1"]
  - id: "3"
    description: "Implement lineage collection: per-stage provenance (git.resolveBaseRef, complexity.collectComplexity, coverage.readCoverage, attribution.attachCoverage, crapCalc.calculateCrap, rules.evaluateHighCrap, evidence.buildEvidenceOutput); capture tool, version, input hashes, timestamps (excluded from main output); emit in diagnostics.lineage[]"
    agent: "implementer"
    files: ["src/evidence.ts", "src/git.ts", "src/complexity.ts", "src/coverage.ts", "src/attribution.ts", "src/crapCalc.ts", "src/rules.ts", "src/execute.ts"]
    acceptance: "npx tsc --noEmit passes; npm test passes; npm run build passes; npm pack --dry-run passes; JSON output with --json includes diagnostics.lineage array (optional); deterministic: same inputs → identical JSON excluding timestamps/durations per evidence-contract.md:341; no breaking changes to existing fields"
    depends_on: ["2"]
  - id: "4"
    description: "Implement completeness/quality metrics: numeric quality score 0-100 in diagnostics.quality; per-stage completeness (git, complexity, coverage, attribution, rules); uncovered-function enumeration in diagnostics.quality.uncoveredFunctions[]; preserve existing capabilities.{git,complexity,coverageArtifact} and completeness enum"
    agent: "implementer"
    files: ["src/evidence.ts", "src/complexity.ts", "src/coverage.ts", "src/attribution.ts", "src/rules.ts"]
    acceptance: "npx tsc --noEmit passes; npm test passes; npm run build passes; npm pack --dry-run passes; diagnostics.quality.score present when coverage available; uncoveredFunctions[] lists functions with coverage===0; existing capabilities/completeness semantics unchanged; INV-01 ZERO≠NULL preserved (0% not null)"
    depends_on: ["3"]
  - id: "5"
    description: "Implement function fingerprints: deterministic hash (SHA-256) of normalized function signature + body AST; stable cross-platform; key by file:method:lineStart; emit in diagnostics.fingerprints{}; no cache yet (C Performance requires lineage+fingerprints+tracing first)"
    agent: "implementer"
    files: ["src/evidence.ts", "src/complexity.ts", "src/complexity-providers/pythonASTComplexityProvider.ts", "src/attribution.ts"]
    acceptance: "npx tsc --noEmit passes; npm test passes; npm run build passes; npm pack --dry-run passes; fingerprints deterministic across runs; same function → same hash; no caching logic; hash algorithm documented in diagnostics-schema-design.md"
    depends_on: ["4"]
  - id: "6"
    description: "CLI subcommand dispatcher rewrite: replace hand-rolled parseCliArgs at src/cli.ts:7-68 with subcommand dispatcher (check|doctor|explain|trace|delta); remove @ts-nocheck at src/cli.ts:2; sidecar output for doctor/explain/trace (NOT EvidenceOutput); preserve exit codes at src/cli.ts:125-145; keep --json on check only"
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "npx tsc --noEmit passes; npm test passes; npm run build passes; npm pack --dry-run passes; checkchange check works identically; checkchange doctor --json emits diagnostics only; checkchange explain <ruleId> prints derivation; checkchange trace --json emits sidecar trace; no @ts-nocheck in src/cli.ts; existing tests for check command pass unchanged"
    depends_on: ["1"]
  - id: "7"
    description: "Tracing seam preparation: wrap execute() at src/execute.ts:18 with optional trace hook; add correlation ID propagation through pipeline stages (git→intervals→complexity→coverage→attribution→crap→rules→evidence); emit diagnostics.trace[] sidecar; no timing in main EvidenceOutput per evidence-contract.md:341"
    agent: "implementer"
    files: ["src/execute.ts", "src/evidence.ts", "src/git.ts", "src/complexity.ts", "src/coverage.ts", "src/attribution.ts", "src/rules.ts"]
    acceptance: "npx tsc --noEmit passes; npm test passes; npm run build passes; npm pack --dry-run passes; checkchange trace --json produces sidecar trace with spans for each pipeline stage; correlation ID stable per run; EvidenceOutput unchanged; no durationMs in main JSON"
    depends_on: ["6"]
  - id: "8"
    description: "Regression baseline verification: run full test suite + typecheck + build + pack dry-run before and after each task; document baseline metrics in task notes"
    agent: "tester"
    files: ["package.json", "tsconfig.json"]
    acceptance: "npx tsc --noEmit exit 0; npm test exit 0; npm run build exit 0; npm pack --dry-run exit 0; baseline recorded in task comments"
    depends_on: []
  - id: "9"
    description: "Contract strategy compliance audit: verify all changes follow §21 versioning (additive optional fields only, no required-field removal/type-change); INV-01..05 hold; diagnostics object excluded from determinism guarantee; schemaVersion bump to '0.5' only after all A tasks complete"
    agent: "security-auditor"
    files: ["docs/contracts/evidence-contract.md", "src/evidence.ts"]
    acceptance: "Audit report confirms: no breaking changes to EvidenceOutput; diagnostics is optional additive; INV-01 ZERO≠NULL, INV-02 MISSING≠MALFORMED, INV-03 GIT≠REPO, INV-04 ANALYZER TRUTHFUL, INV-05 DIAGNOSTICS TRUTHFUL all verifiable; schemaVersion '0.4' in source until A complete then '0.5'"
    depends_on: ["5"]
  - id: "10"
    description: "Security hardening per §20: LCOV size guards (src/coverage-providers/lcovProvider.ts:12 MAX_SIZE 100MB, MAX_LINES 1M) preserved in any new read paths; isWithinCwd path traversal guards (src/coverage.ts:44) preserved; no absolute paths in diagnostics; temp file cleanup (src/coverage.ts:482-492) robust"
    agent: "security-auditor"
    files: ["src/coverage-providers/lcovProvider.ts", "src/coverage.ts", "src/evidence.ts"]
    acceptance: "Audit confirms: all existing guards intact; no new file reads bypass MAX_SIZE/isWithinCwd; diagnostics contains only relative paths; temp files cleaned on error paths"
    depends_on: ["5"]
  - id: "11"
    description: "Experiment plan per §17: document Experiment A (Trust) scope, success criteria, rollback plan; explicitly mark B Observability, C Performance, D Reviewer UX as out-of-scope deferred with ordering A→B→C, D1 with A, D2 after A, D3 anytime"
    agent: "documenter"
    files: ["docs/experiments/A-trust-plan.md"]
    acceptance: "A-trust-plan.md defines: scope (lineage+completeness+fingerprints), success criteria (all 5 tasks green, determinism verified), rollback (git revert); B/C/D sections explicitly deferred with dependency ordering; no code changes"
    depends_on: ["1"]