# Repository Selection for WP4R Supplemental

## SUP-A
- ID: SUP-A
- Repo: h3
- Subject: feat: route rules (#1524)
- Base SHA: 5e8a31709b28dbebf2f2f8f1a3063250ec799b74
- Target SHA: 3fae517278a2e677fbe3580918ab069348f80ccc
- File: src/rules/normalize.ts
- Function: normalizeRouteRules
- Line Range: 21-136
- Changed-fn count: 108 total in commit
- Diff LOC: 169 insertions
- CC: 36
- Coverage: 100% (stmt)
- CRAP: 36
- Coverage command: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure`
- Artifact: coverage/coverage-final.json
- Rationale: Real high-complexity changed function from major feature commit.
- Prerequisites: h3 repo at target commit, vitest + @vitest/coverage-v8 installed.

## SUP-B
- ID: SUP-B
- Repo: h3
- Subject: fix(json-rpc)!: require JSON content-type, validate origin and cap batch size
- Base SHA: 07d22ecdb175416231242f7ea1ae8553ca0cc1fe
- Target SHA: 72d8e05fb8a9a0eb6941d0c6f11b69b543452260
- File: src/utils/json-rpc.ts
- Function: processJsonRpcMethod
- Line Range: 404-500
- Changed-fn count: 8 (max CRAP 28.94, no function >30)
- Diff LOC: 5 files, 448 insertions (+9 deletions), src/utils/json-rpc.ts 173 lines changed
- CC: 28
- Coverage: 89.36170212765957 (branch)
- CRAP: 28.94391416160196
- Coverage command: `npx vitest --run --coverage.enabled --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage --coverage.reportOnFailure`
- Artifact: coverage/coverage-final.json
- Rationale: Isolated function with CRAP in (15,30] that yields PASS at threshold 30 and WARN at 15, without other high-CRAP functions in the same commit.
- Prerequisites: h3 repo at target commit, vitest + @vitest/coverage-v8 installed.
