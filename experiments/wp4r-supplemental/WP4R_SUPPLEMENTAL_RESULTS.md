# WP4R Supplemental Results

## Objective
To supplement WP4R with two real-world TypeScript runtime cases demonstrating the threshold-sensitivity and WARN gate behavior of the CRAP-based change-risk prototype.

## Selection Summary
- Repository: h3 (https://github.com/unjs/h3)
- SUP-A from commit pair base 5e8a31709b28dbebf2f2f8f1a3063250ec799b74 → target 3fae517278a2e677fbe3580918ab069348f80ccc (feat: route rules #1524): normalizeRouteRules in src/rules/normalize.ts (lines 21-136), 108 changed functions in commit.
- SUP-B from separate isolated commit pair base 07d22ecdb175416231242f7ea1ae8553ca0cc1fe → target 72d8e05fb8a9a0eb6941d0c6f11b69b543452260 (fix(json-rpc)!: require JSON content-type, validate origin and cap batch size): processJsonRpcMethod in src/utils/json-rpc.ts (lines 404-500), 8 changed functions in commit, max CRAP 28.94.
- Changed-function count in commit: 108 total
- Selection criteria: real runtime changes, real coverage, numeric CRAP in required intervals (SUP-A >30, SBP-B in (15,30]).

## Achieved Intervals
- SUP-A: CRAP = 36 ( >30 )
- SUP-B: CRAP = 28.94391416160196 ( in (15,30] )

## Coverage Results
- SUP-A: 100% statement coverage (stmt)
- SUP-B: 89.36170212765957% branch coverage (branch)

## Threshold Outcomes
- SUP-A:
  - Threshold 30: gate = WARN
  - Threshold 15: gate = WARN
- SUP-B:
  - Threshold 30: gate = PASS
  - Threshold 15: gate = WARN

## Completeness
- Both cases: COMPLETE (coverage generated, prototype executed, outputs preserved)

## Deterministic-Input Confirmation
- For each case, the same coverage artifact was used for both threshold runs.
- SUP-A: experiments/wp4r-supplemental/sup-a/coverage-final.json used for threshold 30 and 15.
- SUP-B: experiments/wp4r-supplemental/sup-b/coverage-final.json used for threshold 30 and 15.
- Coverage file checksums identical between runs (verified via sha256).

## Evidence Paths
- SUP-A:
  - Coverage: experiments/wp4r-supplemental/sup-a/coverage-final.json
  - Threshold 30 output: experiments/wp4r-supplemental/sup-a/output-threshold-30.json
  - Threshold 15 output: experiments/wp4r-supplemental/sup-a/output-threshold-15.json
- SUP-B:
  - Coverage: experiments/wp4r-supplemental/sup-b/coverage-final.json
  - Threshold 30 output: experiments/wp4r-supplemental/sup-b/output-threshold-30.json
  - Threshold 15 output: experiments/wp4r-supplemental/sup-b/output-threshold-15.json

## Unresolved Limitations
- Bounded search: only the h3 repository was searched (last 50 commits).
- Single repository: results may not generalize to other repositories or languages.
- Threshold sensitivity: only two thresholds (15 and 30) evaluated per case.
- Gate semantics: prototype evaluates ALL changed functions per commit, so case isolation matters; both locked cases satisfy this.

## Evidence Issues
- None blocking. An earlier candidate for SUP-B (createRulesRouter, same commit as SUP-A) was rejected during discovery because the gate evaluates all changed functions in a commit; it was replaced by the isolated json-rpc commit before case lock.

## Human Classification (Recorded)
- SUP-A: [X] EXPECTED_WARN
- SUP-B threshold 30: [X] EXPECTED_PASS
- SUP-B threshold 15: [X] USEFUL_WARN

Reviewer rationales are recorded in `experiments/wp4r-supplemental/human-review-packet.md`. Supplemental evidence was accepted for its intended WP4R purpose (demonstrating threshold sensitivity and WARN-gate behavior on real-world cases).

## Status
- Human classification: RECORDED — SUP-A EXPECTED_WARN; SUP-B threshold 30 EXPECTED_PASS; SUP-B threshold 15 USEFUL_WARN.
- Supplemental evidence accepted for its intended WP4R purpose.
- Threshold 30 remains the current default; nothing here establishes that 15 should universally replace 30.
- WP4R proceeds to closure documentation. WP5 has NOT started.

## Acceptance Gate Checklist
- [x] Documentation correction completed (isAllowedSecFetchSite note in wp4r-final packet)
- [x] Exactly two cases (SUP-A, SUP-B)
- [x] SUP-A CRAP=36 >30
- [x] SUP-B CRAP=28.94 >15 and <=30
- [x] Both real runtime changes with real numeric coverage/CRAP
- [x] SUP-A WARN at 30, WARN at 15
- [x] SUP-B PASS at 30, WARN at 15
- [x] Same evidence used for both threshold runs per case (identical coverage artifact)
- [x] Raw evidence preserved (coverage-final.json + outputs + exit codes under sup-a/, sup-b/)
- [x] Review packet complete
- [x] Classifications recorded (EXPECTED_WARN / EXPECTED_PASS / USEFUL_WARN)
- [x] Production code untouched
- [x] WP5 not started
