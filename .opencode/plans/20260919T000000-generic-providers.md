---
task: "Generic Language Providers — config-driven registry, genericCommand, vacuous-PASS ban, Python E2E, regression guard"
created: "2026-09-19T00:00:00Z"
approved: true
repo_conventions:
  gate: "npx tsc --noEmit && npx vitest run"
  entry_points: ["src/cli.ts", "src/evidence.ts"]
  review_hook: "engram_review_delta"
  graph_tool: "graphify query"
risks:
  - { risk: "Registry population order differs from spec discovery order", mitigation: "Unit test deriveRegistry priority + integration test CLI flag precedence", signal: "gate" }
  - { risk: "Generic command timeout/env leakage breaks hermetic tests", mitigation: "Hardcode 30s timeout + PATH-only env in createGenericCommandProvider; test with mock command", signal: "gate" }
  - { risk: "Vacuous-PASS ban changes gate semantics for existing TS projects", mitigation: "Regression test: test_golden_e2e + test_main_rerun_overwrites must pass unchanged", signal: "gate" }
  - { risk: "Python E2E fixture requires external deps (pytest, coverage)", mitigation: "Fixture self-contained; test skipped if deps missing; CI installs deps", signal: "gate" }
guardrails:
  - "No hardcoded extension maps remain in src/evidence.ts, src/cli.ts, src/cache.ts, src/coverage.ts"
  - "All new files export only via src/providers/index.ts (single public surface)"
  - "Provider command runs with PATH only, no ambient authority, 30s timeout"
  - "NOT_EVALUATED gate exits 0 but CI can gate on gate !== 'PASS'"
  - "Config schema version locked to 1; breaking changes require v2"
max_rounds: 3
tasks:
  - id: "1"
    description: "Create src/providers/config.ts with ProviderConfig schema, loadProviderConfig (explicit > repo root > builtin), deriveRegistry (extension Map with override semantics), builtinConfig (current hardcoded defaults as config)"
    agent: "implementer"
    files: ["src/providers/config.ts", "src/providers/index.ts"]
    seam: "src/providers/config.ts loadProviderConfig() deriveRegistry() builtinConfig() — new module, no existing seam; rejected: inline in evidence.ts (violates D3 layering, D5 secrets)"
    acceptance: "npx tsc --noEmit passes; npx vitest run config-loader.test.ts passes (loads explicit path > repo root > builtin; validates schema v1; rejects invalid JSON)"
    impact: "consumers: [src/evidence.ts registry init]; interface diff: +loadProviderConfig +deriveRegistry +builtinConfig; migration: none"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Create src/providers/genericCommand.ts implementing ComplexityProvider via shell command with {cwd}/{files}/{out}/{ext} expansion, 30s timeout (CHECKCHANGE_PROVIDER_TIMEOUT_MS), non-zero exit throws, stdout JSON → ComplexityInfo[]"
    agent: "implementer"
    files: ["src/providers/genericCommand.ts", "src/providers/index.ts"]
    seam: "src/providers/genericCommand.ts createGenericCommandProvider() — new module; rejected: inline in evidence.ts (violates D3, D5); rejected: extend existing typescriptProvider (violates D4 DRY seam)"
    acceptance: "npx tsc --noEmit passes; npx vitest run generic-command.test.ts passes (expands all tokens; 30s timeout; non-zero exit throws; parses JSON array to ComplexityInfo[])"
    impact: "consumers: [src/evidence.ts registry population]; interface diff: +createGenericCommandProvider; migration: none"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Refactor src/evidence.ts registry population: replace hardcoded EXTENSION_PRIORITY, JS_EXTENSIONS, LANGUAGE_MAP, providers Map init with deriveRegistry(loadProviderConfig(cwd, explicitPath)); update detectExtension priority; add providerAvailability config/builtin attribution for doctor; remove registerCachedProviders hardcoded re-registration in src/cache.ts; remove PYTHON_COVERAGE_FILES constant in src/coverage.ts (now config-driven)"
    agent: "implementer"
    files: ["src/evidence.ts", "src/cache.ts", "src/coverage.ts", "src/cli.ts"]
    seam: "src/evidence.ts registry init (lines 223–224) — enabling point: startup population from deriveRegistry; rejected: keep hardcodes + config overlay (violates D1 kill hardcodes, D4 DRY seam)"
    acceptance: "npx tsc --noEmit passes; npx vitest run passes (all 56 existing tests); registry-derivation.test.ts passes (Map keys = extensions; later entries override; language/coverageFiles/coverageCmd propagated); detectExtension.test.ts passes (priority .py > .tsx > .jsx > .js > .ts; empty → .ts)"
    impact: "consumers: [src/cli.ts getChangedIntervals, src/cache.ts]; interface diff: -EXTENSION_PRIORITY -JS_EXTENSIONS -LANGUAGE_MAP -registerCachedProviders hardcodes +config-driven registry; migration: none (builtinConfig preserves current behavior)"
    open_questions: "none"
    depends_on: ["1", "2"]
  - id: "4"
    description: "Implement vacuous-PASS ban in src/evidence.ts buildEvidenceOutput: add NOT_EVALUATED gate when coverage unusable; UNSUPPORTED when changedFunctions empty AND no supported extensions; preserve PASS/COMPLETE for legit no-changes; update computeGateAndCompleteness to handle NOT_EVALUATED; exit code 0 for NOT_EVALUATED"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts buildEvidenceOutput (lines 537–700) — enabling point: post-correlate gate logic; rejected: separate gate module (violates D3 vertical slice — gate logic owns evidence output)"
    acceptance: "npx tsc --noEmit passes; npx vitest run passes; cliLangUnknown.test.ts passes (unknown .rs → UNSUPPORTED gate null completeness NOT_APPLICABLE); NOT_EVALUATED gate emitted when coverage absent; existing TS tests unchanged gate behavior"
    impact: "consumers: [src/cli.ts check command output]; interface diff: +NOT_EVALUATED gate value +UNSUPPORTED analysisStatus; migration: none (new gate value, exit 0)"
    open_questions: "none"
    depends_on: ["3"]
  - id: "5"
    description: "Create Python-only E2E fixture at test/fixtures/python-only/ with src/math.py (CC 1–5), tests/test_math.py (pytest), no TS files; add test script that runs pytest --cov=src --cov-report=xml then checkchange check --base HEAD --json; assert changedFunctions>0, complexity=available, coverageArtifact=available, gate=WARN|PASS, analysisStatus=SUCCESS, quality.complexity=NATIVE, quality.coverage=DIRECT, quality.score!=null"
    agent: "tester"
    files: ["test/fixtures/python-only/src/math.py", "test/fixtures/python-only/tests/test_math.py", "test/fixtures/python-only/package.json", "tests/python-e2e.test.ts"]
    seam: "tests/python-e2e.test.ts — new test file; rejected: inline in existing test file (violates D7 vertical slice, D13 exercised path)"
    acceptance: "npx vitest run python-e2e.test.ts passes (skipped if pytest/coverage not installed); assertions match spec §6 table; fixture self-contained"
    impact: "consumers: [CI pipeline]; interface diff: +fixture +test; migration: none"
    open_questions: "none"
    depends_on: ["3", "4"]
  - id: "6"
    description: "Run full regression suite: pnpm test (56 tests, 20s); verify test_golden_e2e passes (TS project, Istanbul JSON); verify test_main_rerun_overwrites passes (rebuild semantics); verify no behavioral change for builtin TypeScript/Python providers; verify doctor subcommand shows config: vs builtin: attribution"
    agent: "tester"
    files: []
    seam: "Full test suite — no code change; acceptance is gate proof"
    acceptance: "npx tsc --noEmit passes; npx vitest run passes (all 56+ new tests); test_golden_e2e passes; test_main_rerun_overwrites passes; doctor output shows providerAvailability with config:/builtin: labels"
    impact: "consumers: [CI gate]; interface diff: none; migration: none"
    open_questions: "none"
    depends_on: ["4", "5"]
---