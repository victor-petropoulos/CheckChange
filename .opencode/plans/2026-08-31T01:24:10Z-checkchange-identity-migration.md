---
task: "CheckChange identity migration — rename code-risk-prototype → CheckChange before WP12 resumes"
created: "2026-08-31T01:24:10Z"
approved: true
tasks:
  - id: "1"
    description: "Capture before evidence — run full test suite, TypeScript, build, and deterministic CLI smoke test; record outputs for after-comparison"
    agent: "tester"
    files: []
    acceptance: "npm test → 188/188 pass; npx tsc --noEmit → 0 errors; npm run build → ok; node dist/cli.js check --base HEAD~1 --json → valid schema 0.2 JSON with gate/completeness; outputs saved for diff"
    depends_on: []
  - id: "2"
    description: "package.json — rename name to 'checkchange', bin to 'checkchange': './dist/cli.js'; add compatibility alias 'code-risk': './dist/cli.js' (internal unpublished, no external consumers); update description to 'Independent deterministic evidence for AI-assisted software development'; add repository/homepage/bugs fields pointing to CheckChange repo"
    agent: "implementer"
    files: ["package.json"]
    acceptance: "name=checkchange; bin={checkchange, code-risk}; description updated; repository URL present; npm run build still works; bin both invoke same dist/cli.js"
    depends_on: []
  - id: "3"
    description: "README.md — replace title with '# CheckChange', add tagline 'AI writes. We check the change.', position as independent deterministic evidence/verification layer per migration plan §11-12; keep non-goals section intact"
    agent: "implementer"
    files: ["README.md"]
    acceptance: "Title '# CheckChange'; tagline present; positioning paragraph describes evidence layer consuming changed functions/complexity/coverage/CRAP; non-goals unchanged; no unsupported claims added"
    depends_on: []
  - id: "4"
    description: "PROJECT_STATUS.md — update header to 'Project: CheckChange'; preserve WP10/WP11 complete verbatim; keep WP12 paused state verbatim; preserve all technical baselines (schema 0.2, thresholds 30/15, INV-01..04, 188/188, tsc 0, build pass)"
    agent: "implementer"
    files: ["PROJECT_STATUS.md"]
    acceptance: "Header 'Project: CheckChange'; WP10/WP11 COMPLETE unchanged; WP12 section unchanged (paused at approval gate, fork A, not started, src/ clean); all baselines verbatim; no WP12 completion claims"
    depends_on: []
  - id: "5"
    description: "OPENCODE_START_HERE.md — add 'PAUSED AT APPROVAL GATE PENDING CHECKCHANGE RENAME' context to Current Step; preserve all execution controls (next roadmap step only, human-review packet, AWAITING HUMAN REVIEW, CONTINUE/CONTINUE WITH CONSTRAINTS/STOP)"
    agent: "implementer"
    files: ["OPENCODE_START_HERE.md"]
    acceptance: "Current Step includes rename pause context; Next Step unchanged (resume WP12 via APPROVED); all 5 execution rules preserved; no weakening of gate discipline"
    depends_on: []
  - id: "6"
    description: "src/cli.ts — update usage string line 86 from 'code-risk check' to 'checkchange check'; verify no other product-facing strings in src/; ensure engine semantics unchanged"
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "Line 86: 'Usage: checkchange check --base <ref>...'; no other 'code-risk' in src/; npm test 188/188 still passes; CLI smoke test works with 'checkchange' binary"
    depends_on: ["2"]
  - id: "7"
    description: "Current-facing docs — update product identity references to CheckChange in: docs/contracts/evidence-contract.md (line 9: 'code-risk evidence engine'), docs/10_WP10_CAPABILITY_DEFINITION.md, docs/11_WP11_CONTRACT_INVENTORY.md, docs/wp7-release-checklist.md (bin refs), docs/Project Master Plans/Post_WP9_Detailed_Roadmap.md (current refs only); preserve contract semantics exactly; do NOT touch experiments/"
    agent: "implementer"
    files: ["docs/contracts/evidence-contract.md", "docs/10_WP10_CAPABILITY_DEFINITION.md", "docs/11_WP11_CONTRACT_INVENTORY.md", "docs/wp7-release-checklist.md", "docs/Project Master Plans/Post_WP9_Detailed_Roadmap.md"]
    acceptance: "All current-facing refs to 'code-risk'/'code-risk-prototype'/'Deterministic Code-Risk' → 'CheckChange'; evidence-contract.md line 9 updated; wp7-checklist bin refs updated; WP10/WP11/Post_WP9 roadmap current product refs updated; contract schema/invariants/thresholds/CLI behavior unchanged; experiments/ untouched"
    depends_on: []
  - id: "8"
    description: "Tests — update only product-identity assertions (e.g., CLI help text checks, package name checks); do NOT modify contract test technical assertions (schema 0.2, INV-01..04, thresholds, gate logic)"
    agent: "tester"
    files: ["test/**/*.test.ts", "test/**/*.spec.ts"]
    acceptance: "grep -r 'code-risk' test/ shows only historical/experimental refs or updated identity assertions; npm test → 188/188 pass; wp11.contract.spec.ts 10/10 pass unchanged; no technical assertion changes"
    depends_on: ["6", "7"]
  - id: "9"
    description: "Final verification — run full suite, compare before/after CLI output on deterministic case, refresh Graphify, classify remaining old-name refs"
    agent: "tester"
    files: []
    acceptance: "npm test → 188/188; npx tsc --noEmit → 0; npm run build → ok; node dist/cli.js check --base HEAD~1 --json → identical technical fields (changedFunctions, ruleResults, gate, completeness, schema 0.2) vs before capture; graphify update . → graph reflects CheckChange identity; remaining old-name refs classified as HISTORICAL_REFERENCE (experiments/, .opencode/plans/) or COMPATIBILITY_IDENTIFIER (package.json code-risk alias)"
    depends_on: ["1", "2", "3", "4", "5", "6", "7", "8"]

non_goals:
  - "No WP12 workflows created (.github/workflows/ remains absent)"
  - "No schema/threshold/INV changes (0.2, 30/15, INV-01..04 frozen)"
  - "No git history rewrite (single commit: chore: rename project to CheckChange)"
  - "No engine refactor (src/ only CLI usage string)"
  - "No historical artifact rewrite (experiments/, .opencode/plans/ preserved)"
  - "No technical term renames (crap, complexity, coverage, evidence, analyzer unchanged per §15)"
  - "No WP12 approval gate flipped (approved:false remains)"
  - "No CI measurement results fabricated"

files_intentionally_not_changed:
  - "experiments/**/* (all historical evidence)"
  - ".opencode/plans/**/* (all planning history)"
  - "graphify-out/**/* (regenerated after)"
  - "src/git.ts, src/evidence.ts, src/complexity.ts, src/coverage.ts, src/rules.ts, src/crapCalc.ts (engine internals)"
  - "test/contract/wp11.contract.spec.ts (contract tests untouched)"
  - ".nvmrc, .node-version, tsconfig.json, vitest.config.ts (config unchanged)"
  - "docs/01_REVISED_PROJECT_THESIS.md, docs/02_SCOPE_AND_GUARDRAILS.md (foundational)"
  - "docs/contracts/evidence-contract.md schema/invariant/CLI sections (technical content frozen)"