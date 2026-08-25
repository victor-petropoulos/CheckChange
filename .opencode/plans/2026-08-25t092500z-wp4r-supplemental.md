---
task: "WP4R Supplemental WARN and Threshold-Sensitivity Verification"
created: "2026-08-25T09:25:00Z"
approved: true
tasks:
  - id: "0"
    description: "Correct isAllowedSecFetchSite explanation in human-review-packet.md line 565. Replace speculation about different CRAP formula with correct coverage-based formula explanation: CC=3, coverage=100% → CRAP = CC²×(1-1.0)³ + CC = 0 + 3 = 3. Preserve observed values (CC=3, coverage=100%, CRAP=3). Remove 'Standard CRAP formula max(CC, CC²+2×changes) would yield 9' and all speculation about mystery formula."
    agent: "implementer"
    files: ["experiments/wp4r-final/human-review-packet.md"]
    acceptance: "Line 565 no longer speculates about alternative CRAP formulas. CC=3, coverage=100%, CRAP=3 preserved. Diff shows only line 565 changed."
    depends_on: []

  - id: "1"
    description: "Phase 1 Discovery — Bounded search for 2 real TS runtime cases. Search h3 repo commits for changed functions with numeric CRAP in required intervals. Verified candidates from commit 3fae517 (feat: route rules #1524): SUP-A = normalizeRouteRules in src/rules/normalize.ts (CC=36, CRAP=36, cov=100%), SUP-B = createRulesRouter in src/rules/match.ts (CC=27, CRAP=27.03, cov=96.43%). Base SHA=5e8a31709b28dbebf2f2f8f1a3063250ec799b74, target SHA=3fae517278a2e677fbe3580918ab069348f80ccc. Search bounds: h3 repo, last 50 commits, prototype run with vitest coverage. If no qualifying cases found, report bounds and stop."
    agent: "implementer"
    files: ["src/cli.ts", "src/crapCalc.ts", "src/evidence.ts"]
    acceptance: "Discovery report documents search bounds (repo, commit range, tool used), candidate CRAP values, and justification for selected cases. Both cases have real runtime changes, real coverage, and numeric CRAP in required intervals."
    depends_on: []

  - id: "2"
    description: "Phase 2 Case Lock — Create experiments/wp4r-supplemental/repository-selection.md with fields per case: ID (SUP-A, SUP-B), repo (h3), subject (feat: route rules #1524), base SHA (5e8a3170...), target SHA (3fae5172...), file, function, changed-function count (108 total changed functions in commit), diff LOC (normalize.ts: 169 insertions, match.ts: 507 insertions), CC (36 and 27), coverage (100% and 96.43%), CRAP (36 and 27.03), coverage command (npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure), artifact path (coverage/coverage-final.json), rationale (real high-complexity changed functions from major feature commit), prerequisites (h3 repo at target commit, vitest + @vitest/coverage-v8 installed). No substitution after lock without human approval."
    agent: "implementer"
    files: ["experiments/wp4r-supplemental/repository-selection.md"]
    acceptance: "File exists with all required fields for both cases. Values match prototype output. File is in experiments/wp4r-supplemental/ directory."
    depends_on: ["1"]

  - id: "3"
    description: "Phase 3 Execute SUP-A (normalizeRouteRules) — In experiments/wp4r-supplemental/sup-a/: (1) Verify base/target SHAs via git rev-parse in h3 repo. (2) Generate coverage externally: checkout target SHA, run `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure`, preserve raw Istanbul JSON at coverage/coverage-final.json. (3) Run prototype at threshold 30: `node dist/cli.js check --base <baseSHA> --coverage-file coverage/coverage-final.json --json > output-threshold-30.json`, preserve output and exit code. (4) Run prototype at threshold 15 with SAME coverage file: `node dist/cli.js check --base <baseSHA> --coverage-file coverage/coverage-final.json --crap-threshold 15 --json > output-threshold-15.json`, preserve output and exit code. (5) Confirm evidence inputs identical except threshold (compare coverage file checksums). Expected: SUP-A WARN at 30, WARN at 15."
    agent: "implementer"
    files: ["src/cli.ts", "src/evidence.ts", "src/crapCalc.ts", "src/rules.ts"]
    acceptance: "Coverage artifact exists at coverage/coverage-final.json. Both threshold outputs exist as JSON files. SUP-A output-threshold-30.json shows gate=WARN, SUP-A output-threshold-15.json shows gate=WARN. Coverage file checksums match between runs. Exit codes recorded."
    depends_on: ["2"]

  - id: "4"
    description: "Phase 3 Execute SUP-B (createRulesRouter) — Reuse same coverage artifact from SUP-A execution (identical commit pair, same coverage command). In experiments/wp4r-supplemental/sup-b/: (1) Verify same base/target SHAs. (2) Copy coverage/coverage-final.json from SUP-A (or regenerate to confirm identical). (3) Run prototype at threshold 30 with same coverage file → output-threshold-30.json. (4) Run prototype at threshold 15 → output-threshold-15.json. (5) Confirm identical evidence inputs. Expected: SUP-B PASS at 30, WARN at 15."
    agent: "implementer"
    files: ["src/cli.ts", "src/evidence.ts", "src/crapCalc.ts", "src/rules.ts"]
    acceptance: "Both threshold outputs exist. SUP-B output-threshold-30.json shows gate=PASS, SUP-B output-threshold-15.json shows gate=WARN. Coverage file is identical to SUP-A (same SHA). Exit codes recorded."
    depends_on: ["3"]

  - id: "5"
    description: "Phase 4 Human-Review Packet — Create experiments/wp4r-supplemental/human-review-packet.md. For each case (SUP-A, SUP-B): include IDs/SHAs/subject, file/function/range (normalizeRouteRules lines 21-136, createRulesRouter lines 63-175), changed lines diff, complete function source when reasonable, exact diff for the function, CC/coverage/CRAP values, coverage artifact path + Istanbul attribution, both threshold results (JSON excerpts), factual logic description of what the function does, exact commands used. Leave all 3 classification blocks blank with checkboxes: SUP-A (EXPECTED_WARN/QUESTIONABLE_WARN/UNDETERMINED), SUP-B threshold-30 (EXPECTED_PASS/QUESTIONABLE_PASS/UNDETERMINED), SUP-B threshold-15 (USEFUL_WARN/NOISY_WARN/UNDETERMINED). Do not answer classification questions."
    agent: "implementer"
    files: ["experiments/wp4r-supplemental/human-review-packet.md"]
    acceptance: "File exists with complete sections for both SUP-A and SUP-B. All required fields present. Classification checkboxes blank. Function source included. Exact diffs included. Commands documented."
    depends_on: ["4"]

  - id: "6"
    description: "Phase 5 Results Summary — Create experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md with: objective, selection summary (h3 commit 3fae517, 2 cases), achieved intervals (SUP-A CRAP=36 >30, SUP-B CRAP=27.03 in 15-30), coverage results (100% stmt and 96.43% branch), both threshold outcomes (SUP-A WARN/WARN, SUP-B PASS/WARN), completeness statement, deterministic-input confirmation (same coverage file for both thresholds), evidence paths, unresolved limitations (only 1 commit searched, may not represent all repos), pending classification statement (human review not yet completed). Do not claim WP4R complete."
    agent: "implementer"
    files: ["experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md"]
    acceptance: "File exists with all required sections. Outcomes match expected (SUP-A WARN/WARN, SUP-B PASS/WARN). Deterministic-input confirmed. WP4R not declared complete. WP5 not started."
    depends_on: ["5"]

  - id: "7"
    description: "Acceptance Gate Checklist — Verify all criteria: (1) documentation correction completed (step 0), (2) exactly two cases (SUP-A, SUP-B), (3) SUP-A CRAP >30 (36), (4) SUP-B CRAP >15 and ≤30 (27.03), (5) both real runtime changes with real numeric coverage/CRAP, (6) SUP-A WARN at 30 and WARN at 15, (7) SUP-B PASS at 30 and WARN at 15, (8) same evidence used for both threshold runs per case, (9) raw evidence preserved, (10) review packet complete, (11) classifications blank, (12) production code untouched, (13) WP5 not started. Return: files changed, selected cases/CRAP, 30/15 outcomes, evidence issues, unresolved items, confirmation production code untouched, confirmation WP4R remains at human-review gate."
    agent: "implementer"
    files: []
    acceptance: "All 13 checklist items verified. No production code modified. No prototype code modified. No coverage manipulated. No fabrication. WP4R status: at human-review gate."
    depends_on: ["6"]
---

## Constraints

- Do NOT modify production code, changed-function detection, complexity calculation, CRAP calculation, coverage attribution, thresholds, gate rules, CLI behavior, or target repository source/configuration.
- Do NOT synthesize functions, manually manipulate coverage, fabricate evidence, broaden language support, debug Apollo/Jest as a side project, rerun the full original experiment, begin WP5, or autonomously classify usefulness.
- Do NOT substitute cases after lock without human approval.
- Do NOT claim WP4R complete.
- All classification blocks in human-review-packet.md must remain blank.

## Pre-computed Discovery Data (from researcher exploration)

Both cases found in h3 commit 3fae517 (feat: route rules #1524):

| Field | SUP-A | SUP-B |
|-------|-------|-------|
| ID | SUP-A | SUP-B |
| Repo | h3 | h3 |
| Subject | feat: route rules (#1524) | feat: route rules (#1524) |
| Base SHA | 5e8a31709b28dbebf2f2f8f1a3063250ec799b74 | 5e8a31709b28dbebf2f2f8f1a3063250ec799b74 |
| Target SHA | 3fae517278a2e677fbe3580918ab069348f80ccc | 3fae517278a2e677fbe3580918ab069348f80ccc |
| File | src/rules/normalize.ts | src/rules/match.ts |
| Function | normalizeRouteRules | createRulesRouter |
| Line Range | 21-136 | 63-175 |
| Changed-fn count | 108 total in commit | 108 total in commit |
| Diff LOC | 169 insertions | 507 insertions |
| CC | 36 | 27 |
| Coverage | 100% (stmt) | 96.43% (branch) |
| CRAP | 36 | 27.03 |
| Coverage cmd | `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure` | same |
| Artifact | coverage/coverage-final.json | coverage/coverage-final.json |
| Expected 30 | WARN | PASS |
| Expected 15 | WARN | WARN |
