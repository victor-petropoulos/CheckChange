---
task: "WP12 CI Integration Validation"
created: "2026-08-31T01:01:40Z"
approved: false
tasks:
  - id: "1"
    description: "Scaffold .github/workflows/ with two CI pipelines per Fork A spec — ci-evidence-default.yml (P1: vitest run --coverage -> node dist/cli.js check --base origin/main --json using default coverage/coverage-final.json) and ci-evidence-explicit.yml (P2: same but with explicit --coverage-file <path> + --crap-threshold override). Include: on pull_request + push to main, Node 24 via actions/setup-node@v4 with cache, npm ci, npm run build, fetch base ref (git fetch --depth=1 origin main || fallback HEAD~1), run vitest --coverage, invoke engine, upload JSON artifact, assert exit codes (0=PASS/UNSUPPORTED+NOT_APPLICABLE, 1=FAILED/WARN). No src/ changes."
    agent: "implementer"
    files: [".github/workflows/ci-evidence-default.yml", ".github/workflows/ci-evidence-explicit.yml"]
    acceptance: "Both YAML files exist, valid YAML syntax, reference frozen contract behavior (schema 0.2, threshold 30 default, INV-01..04 propagation), no src/ modifications, both workflows trigger on PR/push to main, use Node 24, include base ref fetch logic for shallow checkout resilience"
    depends_on: []
  - id: "2"
    description: "Create local dry-run harness proving both pipelines execute locally -- document commands: vitest run --coverage && node dist/cli.js check --base HEAD~1 --json (P1 default) and vitest run --coverage && node dist/cli.js check --base HEAD~1 --coverage-file coverage/coverage-final.json --crap-threshold 15 --json (P2 explicit). Capture exit codes, JSON output shape, gate/completeness values. Document in docs/experiments/wp12/LOCAL_DRYRUN.md with expected outputs and troubleshooting for missing base ref / missing artifact / malformed JSON / ENOENT git."
    agent: "documenter"
    files: ["docs/experiments/wp12/LOCAL_DRYRUN.md"]
    acceptance: "File exists with step-by-step commands for both pipelines, expected JSON schema 0.2 fields, exit code matrix (0 vs 1 scenarios), F-03 path rebasing verification note, common failure mode recovery steps"
    depends_on: ["1"]
  - id: "3"
    description: "Define measurement specification for Roadmap S7 metrics -- create rubric table covering: setup complexity (step count, config lines), failure modes (missing coverage, malformed JSON, base unresolvable, git ENOENT, threshold override propagation), evidence completeness (all schema 0.2 fields present, provenance fields populated), developer comprehension (time-to-first-success, cognitive load), CI cost (wall-clock seconds for each pipeline stage), reproducibility (same inputs twice -> equivalent JSON per INV determinism), path handling (F-03 normalizeCoveragePaths rebasing across env), artifact handling (default vs explicit, size, retention), config burden (--crap-threshold override propagation to policy and ruleResults). Save as docs/experiments/wp12/WP12_MEASUREMENT_SPEC.md."
    agent: "documenter"
    files: ["docs/experiments/wp12/WP12_MEASUREMENT_SPEC.md"]
    acceptance: "File exists with structured rubric table for all 9 Roadmap S7 measurement categories, each with measurable criteria, pass/fail thresholds where applicable, and linkage to frozen contract invariants (INV-01..04, F-03)"
    depends_on: ["1"]
  - id: "4"
    description: "Run both pipelines (locally via dry-run harness and/or via GitHub Actions), collect evidence: JSON outputs from both pipelines, gate/completeness values, wall-clock timings per stage, any failures with error categorization. Compile into docs/closure/WP12_HUMAN_REVIEW_PACKET.md (executive summary, pipeline results table, gate outcomes, measurement data per WP12_MEASUREMENT_SPEC.md rubric, fork diagnosis if integration fragile -- caller-side vs contract vs provider per Roadmap S7) and experiments/wp12/WP12_RESULTS.md (raw data, timings, JSON samples). Packet must end with 'AWAITING HUMAN REVIEW' banner."
    agent: "tester"
    files: ["docs/closure/WP12_HUMAN_REVIEW_PACKET.md", "experiments/wp12/WP12_RESULTS.md"]
    acceptance: "Both files exist, packet contains all required sections ending with 'AWAITING HUMAN REVIEW', results file contains raw JSON outputs and timings, diagnosis section identifies whether any failures are caller-side (coverage generation), contract (engine behavior), or provider (crap-typescript-core/coverage-v8), measurement data maps to WP12_MEASUREMENT_SPEC.md rubric"
    depends_on: ["2", "3"]
  - id: "5"
    description: "Regression guard -- verify WP11 baseline preserved: run npx tsc --noEmit (0 errors), npx vitest run (188/188 pass, 60 files), git diff src/ (clean), npx vitest run test/contract/wp11.contract.spec.ts --no-coverage (10 pass, INV-01..04 + F-03 assertions green). Document results in WP12_HUMAN_REVIEW_PACKET.md appendix."
    agent: "tester"
    files: ["docs/closure/WP12_HUMAN_REVIEW_PACKET.md"]
    acceptance: "All four verification commands pass (tsc 0 errors, 188/188 tests pass, src/ diff clean, wp11 contract tests 10/10 pass), results appended to packet appendix"
    depends_on: ["4"]
---
