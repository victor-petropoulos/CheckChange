---
task: "Hardening B — Python + JS/React + Next production gaps (patch, real Istanbul, registry, CC ≥0.95, perf/sec)"
created: "2026-09-02T182626Z"
approved: true
tasks:
  - id: "1"
    description: "P0-1 patch persistence: pnpm patch for crap-typescript-core allowJs"
    agent: "implementer"
    files:
      - "patches/crap-typescript-core+0.5.0.patch"
      - "package.json"
      - "pnpm-lock.yaml"
      - "experiments/wp15-js/PATCH_NOTE.md"
    acceptance: "rm -rf node_modules && pnpm install preserves ANALYZABLE_EXTENSIONS .js/.jsx/.mjs/.cjs, tsc --noEmit 0, vitest 223+ pass, PATCH_NOTE updated to reflect permanent patch"
    depends_on: []
  - id: "2"
    description: "P0-2 real Istanbul: p-queue + zustand + next-sample produce coverage/coverage-final.json via c8 --reporter=json or nyc, check --base HEAD~1 --coverage-file shows language javascript/framework react/next and CRAP numeric deterministic"
    agent: "implementer"
    files:
      - "experiments/wp15-js/fixtures/next-sample/package.json"
      - "experiments/wp15-js/WP15_RESULTS.md"
      - "experiments/wp15-js/human-review-packet.md"
    acceptance: "For each of p-queue, zustand, next-sample: coverage/coverage-final.json exists (Istanbul JSON), npx tsx src/cli.ts check --base HEAD~1 --coverage-file <path> --json yields language javascript and appropriate framework (react/next), CRAP numeric deterministic, tsc --noEmit 0, vitest 223+ pass"
    depends_on: ["1"]
  - id: "3"
    description: "Registry: minimal dispatch table in src/evidence.ts extension->provider routing for .py, .ts/.tsx/.js/.jsx, keep Python adapter in experiments/wp13/adapter registering via import side-effect, no schema bump"
    agent: "implementer"
    files:
      - "src/evidence.ts"
      - "src/language-registry.ts"
      - "experiments/wp13/adapter/index.ts"
    acceptance: "buildEvidenceOutput selects provider by file extension; TypeScript and Python files produce evidence with correct language; tsc --noEmit 0; vitest 223+ pass; no schema version change in evidence contract"
    depends_on: []
  - id: "4"
    description: "CC divergence: 10 synthetic functions measured Lizard vs crap-typescript-core CC, correlation ≥0.95 required; if <0.95 propose correction factor or document; table in docs/contracts/evidence-contract.md"
    agent: "implementer"
    files:
      - "docs/contracts/evidence-contract.md"
      - "experiments/wp13/adapter/cc-bench.spec.ts"
    acceptance: "Benchmark suite shows CC correlation coefficient ≥0.95 between Lizard (Python) and crap-typescript-core (TS) OR correction factor documented and applied; tsc --noEmit 0; vitest 223+ pass"
    depends_on: ["3"]
  - id: "5"
    description: "Perf/sec: wall-clock, memory, artifact size for p-queue + zustand + next-sample; note on malicious coverage JSON (malformed, missing, path traversal); measurement + docs, no new code unless gap"
    agent: "implementer"
    files:
      - "experiments/wp15-js/human-review-packet.md"
      - "docs/superpowers/plans/hardening-b-perf.md"
    acceptance: "Performance measurements documented (wall-clock time, memory RSS, coverage artifact size) for each repo; notes on handling malformed/missing/path-traversal coverage JSON; tsc --noEmit 0; vitest 223+ pass"
    depends_on: ["2", "3"]
---