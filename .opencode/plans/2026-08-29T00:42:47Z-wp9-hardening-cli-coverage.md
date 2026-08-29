---
task: "WP9 Hardening — CLI unit coverage + external pilot retry (CONTINUE WITH CONSTRAINTS)"
created: "2026-08-29T00:42:47Z"
approved: true
tasks:
  - id: "1"
    description: "Add CLI unit tests for src/cli.ts parseCliArgs. Cover: valid --base, --json, --coverage-file, --crap-threshold, unknown flag, missing value, help. Must NOT test main() process exit. Acceptance: when coverage generated, parseCliArgs and main show non-null CRAP (or at least coverage entry exists), INV-01 preserved (null still for truly uncovered), 149+ new tests pass, no src change except test file."
    agent: "tester"
    files: ["test/cli.unit.spec.ts"]
    acceptance: "Coverage entry exists for parseCliArgs/main in coverage JSON; CRAP non-null when unit test exercises them; INV-01 ZERO≠NULL preserved (null for unmeasured functions); vitest run 150+ tests pass; tsc clean; no src/cli.ts modification"
    depends_on: []
  - id: "2"
    description: "Minimal external pilot retry — clone ONE vitest-native TS repo under /tmp (e.g., small utility like sindresorhus/type-fest subset or tiny maintained TS lib with explicit json coverage) — generate coverage via npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json, run engine node dist/cli.js check --base <sha> --json --coverage-file coverage/coverage-final.json, record JSON valid per contract 0.2.0 + repro log. If network blocked, document fallback justification and use local prototype diff as second case."
    agent: "implementer"
    files: ["experiments/wp9-hardening/evidence/external-pilot-retry.json", "experiments/wp9-hardening/repro-retry.md"]
    acceptance: "One external attempt logged with repo, commit, coverage cmd, artifact size, exit code, evidence JSON valid per schema; OR documented fallback with justification. Contract 0.2.0 frozen. INV-01..04 preserved. Evidence file written to experiments/wp9-hardening/evidence/external-pilot-retry.json, repro log to experiments/wp9-hardening/repro-retry.md"
    depends_on: ["1"]
  - id: "3"
    description: "If Task1 changes coverage participation, add addendum section documenting new CLI participation and unchanged threshold policy. If no change needed, update experiments/wp9/threshold-guidance.md with note about CLI unit test addition."
    agent: "documenter"
    files: ["experiments/wp9-hardening/threshold-addendum.md", "experiments/wp9/threshold-guidance.md"]
    acceptance: "Addendum with before/after CRAP table for parseCliArgs; threshold 30/15 unchanged; no CRAP math change; or threshold-guidance.md updated with CLI unit test note"
    depends_on: ["1"]
  - id: "4"
    description: "Verification + hardening report — run vitest, tsc, build, verify INV-01..04, compile report mirroring wp9-report structure but scoped to hardening slice, end with PROPOSAL CONTINUE / STOP awaiting human review, do not autonomously classify."
    agent: "documenter"
    files: ["experiments/wp9-hardening/wp9-hardening-report.md"]
    acceptance: "tsc clean; 150+ tests pass; build ok; report ends with AWAITING HUMAN REVIEW; INV-01..04 verified; no silent methodology change; confidence Low/Medium documented"
    depends_on: ["1", "2", "3"]
---

# WP9 Hardening — CLI unit coverage + external pilot retry (CONTINUE WITH CONSTRAINTS)

Source: WP9 gate CONTINUE WITH CONSTRAINTS — reliability strong, external diversity limited, no threshold/CRAP change, contract 0.2.0 frozen, INV-01..04 preserved, Low/Medium confidence, reversible.

## Constraints Embedded
- No new languages, no DB/service/dashboard
- No CRAP formula change (src/crapCalc.ts frozen)
- No threshold policy change (30 default, 15 supplemental frozen in evidence-contract.md)
- Preserve INV-01 ZERO≠NULL, INV-02 MISSING≠MALFORMED, INV-03 GIT≠REPO, INV-04 ANALYZER TRUTHFUL
- No silent methodology change
- Reversibility via git revert
- Confidence capped Low/Medium
- Evidence per Roadmap fork handling

## Context from Prior Artifacts
- WP9 prioritization: CLI attribution gap selected (parseCliArgs CC23, main CC12 show crap:null due to zero unit test coverage)
- repro.md: external pilot attempted twice (nanoid bnt, clsx uvu), both deferred due to coverage tooling mismatch, fallback to local prototype valid
- threshold-guidance.md §3.2: CLI gap correct per INV-01, fix is unit tests not code hack
- evidence-contract.md v0.2.0 frozen with INV-01..04
- src/cli.ts lines 9-106 parseCliArgs, 110-159 main — zero unit test coverage
- src/coverage.ts:38-75 normalizeCoveragePaths suffix matching works, attribution gap is test coverage not path bug
- Node v24.18.1 verified, 149/149 tests passing at commit ca7af83

## Task Dependencies
1 → 2,3 → 4 (Task 1 is blocking; 2 and 3 can run parallel after 1; 4 after all)

## Agent Assignments
- Task 1: tester (unit test authoring)
- Task 2: implementer (external repo clone, coverage gen, engine run)
- Task 3: documenter (threshold addendum / guidance update)
- Task 4: documenter (verification report)

## Notes for Subagents
- STEP 0: read this plan file; verify paths exist (`ls -d`) and line numbers match; if not, STOP and report — do not guess
- Deterministic data travels in files subagents read via tools — not prose
- Bad path → STOP + report. Never fuzzy-resolve
- Every delegation carries a runnable check; evidence over assertion
