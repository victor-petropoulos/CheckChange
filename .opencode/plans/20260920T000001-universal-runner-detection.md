---
task: "Universal test runner detection via provider config"
created: "2026-09-20T11:20:00Z"
approved: true
repo_conventions:
  gate: "pnpm vitest run --coverage && npx checkchange check --json"
  entry_points: ["src/cli.ts"]
  review_hook: "engram_review_delta"
  graph_tool: "graphify query"
risks:
  - { risk: "Provider config changes break existing auto-coverage", mitigation: "builtinConfig() preserves current vitest/jest/pytest commands/artifacts; new fields optional", signal: "gate" }
  - { risk: "Mixed-repo detection picks wrong runner", mitigation: "Config-order precedence + per-language file presence check; resolver returns map per provider, not single winner", signal: "gate" }
  - { risk: "venv Python binary resolution fails", mitigation: "Probe .venv/bin/python → VIRTUAL_ENV/bin/python → python3; unit test covers each", signal: "gate" }
guardrails: ["No src/ edits for new languages — only provider config", "Auto-coverage 120s timeout preserved", "Config schema versioned (v1→v2)"]
max_rounds: 3
tasks:
  - id: "1"
    description: "Extend ProviderEntry with testRunners[] schema in config.ts"
    agent: "implementer"
    files: ["src/providers/config.ts"]
    seam: "src/providers/config.ts builtinConfig() — required; rejected: new file (config schema belongs in config.ts)"
    acceptance: "tsc 0; ProviderEntry adds testRunners: {name:string; configFiles:string[]; binaryProbes:string[]; command:string[]; artifact:string}[]; builtinConfig() entries for TS/JS/Python preserve current vitest/jest/pytest behavior"
    impact: "consumers: src/auto-coverage.ts; interface diff: +testRunners field; migration: none (optional)"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Create generic runner resolver in new module"
    agent: "implementer"
    files: ["src/providers/runner-detection.ts"]
    seam: "src/providers/runner-detection.ts resolveRunner(cwd, registry) — new module; rejected: inline in auto-coverage.ts (separation of concerns)"
    acceptance: "tsc 0; exports resolveRunner(cwd:string, registry:Map<string,ResolvedProvider>): Map<string,{command:string[];artifact:string;provenance:string}>; for each provider with matching ext files in repo, probes configFiles then binaryProbes (venv-aware python); returns first hit per language w/ provenance; null hint tailored per observed languages"
    impact: "consumers: src/auto-coverage.ts; interface diff: +resolveRunner; migration: none"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Wire autoCoverage() to resolver; preserve 120s timeout/failure hints"
    agent: "implementer"
    files: ["src/auto-coverage.ts"]
    seam: "src/auto-coverage.ts autoCoverage() — required; rejected: new file (autoCoverage is the public API)"
    acceptance: "tsc 0; autoCoverage() calls resolveRunner(), iterates resolved runners, spawns each with 120s timeout; hint includes resolver guidance (languages observed, probes tried); single artifact path if one runner, or map if multiple"
    impact: "consumers: src/cli.ts (doctor); interface diff: hint string enriched; migration: none"
    open_questions: "none"
    depends_on: ["2"]
  - id: "4"
    description: "Update doctor missing coverage hint to surface resolver guidance"
    agent: "implementer"
    files: ["src/cli.ts"]
    seam: "src/cli.ts runDoctor() line ~328 — required; rejected: separate doctor module (doctor is cli-internal)"
    acceptance: "tsc 0; doctor probe for coverageArtifact shows resolver hint when missing: 'No test runner detected for observed languages: [python, typescript]. Tried: vitest.config.ts (no), npx vitest (no), pytest.ini (yes) → python3 -m pytest (no), .venv/bin/python (no)...'"
    impact: "consumers: CLI users; interface diff: hint enriched; migration: none"
    depends_on: ["3"]
  - id: "5"
    description: "Unit tests: per-language runner detection + mixed repo + future language fixture + venv pytest"
    agent: "tester"
    files: ["test/runner-detection.test.ts"]
    seam: "test/runner-detection.test.ts — new test file; rejected: extend existing (separate concern)"
    acceptance: "pnpm vitest run test/runner-detection.test.ts PASS; cases: (a) TS project vitest config, (b) JS project jest config, (c) Python project pytest.ini + .venv, (d) mixed TS+Python repo detects both, (e) future-language fixture: add provider entry for .rs with cargo test runner, zero src/ edits, resolver picks it up"
    impact: "consumers: test suite; interface diff: +test file; migration: none"
    depends_on: ["2", "3"]
  - id: "6"
    description: "Docs one-liner: read src/ never dist/"
    agent: "documenter"
    files: ["docs/auto-coverage.md"]
    seam: "docs/auto-coverage.md — new doc; rejected: inline in config.ts (docs separate)"
    acceptance: "File exists; states: 'Runner detection is provider-driven. Add testRunners to checkchange.providers.json. Run from src/ via npx tsx src/cli.ts. Never use dist/.'"
    impact: "consumers: operators; interface diff: +doc; migration: none"
    depends_on: ["1"]
---