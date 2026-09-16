---
task: "Add opt-in --auto-coverage flag to detect runner, spawn coverage generation, retry artifact read"
created: "2026-09-16T19:30:00Z"
approved: true
repo_conventions:
  gate: "pnpm test && pnpm build"
  entry_points: ["src/cli.ts"]
  review_hook: "none"
  graph_tool: "grep/glob"
risks:
  - { risk: "Spawn timeout or OOM on large test suites", mitigation: "120s hard timeout + kill on exceed; fallback to absent-path", signal: "gate" }
  - { risk: "Auto-generated artifact stale vs code changes", mitigation: "No cache write for auto-generated (src/cache.ts:384 unchanged)", signal: "audit" }
guardrails: ["Default behavior unchanged (no flag = current flow)", "FAILED/null/INCOMPLETE reserved for explicit malformed only", "Precedence: --coverage-file > --auto-coverage > auto-detect"]
max_rounds: 3
tasks:
  - id: "1"
    description: "Add --auto-coverage flag parsing + help text in src/cli.ts"
    agent: "implementer"
    files: ["src/cli.ts"]
    seam: "src/cli.ts parseCliArgs() — flag parsing at lines 34-155; rejected: separate flag module (single-file change, no need)"
    acceptance: "node dist/cli.js check --help shows '--auto-coverage   Detect test runner, generate coverage artifact, retry [experimental]'; pnpm build clean"
    impact: "consumers: [src/cli.ts:180-210 buildEvidenceOutput call]; interface diff: +autoCoverage boolean to CheckArgs; migration: none"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Create autoCoverage module + integrate in src/coverage.ts and wire from cli.ts"
    agent: "implementer"
    files: ["src/coverage.ts", "src/cli.ts"]
    seam: "src/coverage.ts readCoverage() at line 302 — new export autoCoverage(cwd) called from cli.ts before buildEvidenceOutput; rejected: inline in cli.ts (violates separation, reuse readCoverage)"
    acceptance: "pnpm test passes; vitest project + --auto-coverage → analysisStatus=SUCCESS gate=PASS completeness=COMPLETE; timeout → hint + INCOMPLETE; explicit --coverage-file malformed still FAILED (regression)"
    impact: "consumers: [src/cli.ts:200-210 buildEvidenceOutput receives CoverageResult]; interface diff: +export async function autoCoverage(cwd); migration: none"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Add unit + integration tests + update docs (README.md:93,96; .agents/skills/using-checkchange/SKILL.md:21)"
    agent: "tester"
    files: ["test/auto-coverage.spec.ts", "README.md", ".agents/skills/using-checkchange/SKILL.md"]
    seam: "test/auto-coverage.spec.ts — new file; README.md:93 workflow example + line 96 note; SKILL.md:21 step 1"
    acceptance: "pnpm test passes including new tests; README.md shows 'checkchange check --auto-coverage --json' as single-step; SKILL.md mentions --auto-coverage flag"
    impact: "consumers: [test suite, docs]; interface diff: +test file, doc edits; migration: none"
    open_questions: "none"
    depends_on: ["2"]
---