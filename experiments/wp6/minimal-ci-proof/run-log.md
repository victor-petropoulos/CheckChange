# Minimal CI Proof Run Log

This log captures the execution of the minimal CI proof script.

## Command Executed

```bash
./run-proof.sh
```

## Environment

```
Node version: v24.18.1
NPM version: 11.16.0
Git commit HEAD: 298e1bef9ddcef697851dd2416ebe7b43cf09bde
Vitest version: vitest/4.1.11 darwin-arm64 node-v24.18.1
Project root: /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode
Proof directory: /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp6/minimal-ci-proof
Base commit: 21daa57efcc659687020e0ee7fad125d7cf4161e
```

## Steps Executed

1. Environment check
2. TypeScript build check (`npx tsc --noEmit`)
3. Coverage artifact generation (`npx vitest run --coverage`)
4. CLI check execution (`node ./dist/cli.js check --base <base> --json --coverage-file <path>`)
5. JSON output saving and gate evaluation

## Full Output

```
=== Minimal CI Proof for Code Risk Prototype ===

Environment:
  Node version: v24.18.1
  NPM version: 11.16.0
  Git commit HEAD: 298e1bef9ddcef697851dd2416ebe7b43cf09bde
  Vitest version: vitest/4.1.11 darwin-arm64 node-v24.18.1

Project root: /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode
Proof directory: /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp6/minimal-ci-proof

Base commit: 21daa57efcc659687020e0ee7fad125d7cf4161e

Running TypeScript build check...
Build check passed.

Generating coverage artifact with vitest...

[1m[30m[46m RUN [49m[39m[22m[36mv4.1.11 [39m[90m/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode[39m
      [2mCoverage enabled with [22m[33mv8[39m

[31mNo test files found, exiting with code 1
[39m
[2minclude: [22m[33m**/*.{test,spec}.?(c|m)[jt]s?(x)[39m
[2mexclude:  [22m[33m**/node_modules/**[39m,  [22m[33m**/.git/**[39m

[34m % [39m[2mCoverage report from [22m[33mv8[39m
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |       0 |        0 |       0 |       0 |                   
----------|---------|----------|---------|---------|-------------------

[32m✓[39m experiments/wp5/wp5.3/fixtures/top-level-function.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m85[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-a5.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m88[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g2.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m91[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-c3.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m102[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g4.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m171[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g5.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m112[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g3.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m84[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g3.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m84[2m[39m
[32m✓[39m experiments/wp5/wp5.2/defect-repro.spec.ts [2m(22m[2m6 test[22m[2m) [2m[33m611[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-v6.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m91[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-v6.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m91[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-a4.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m90[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-a3.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m82[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-d1.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m101[2m[39m
[32m✓[39m experiments/wp5/wp5.3/fixtures/ts-under-src.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m112[2m[39m
[32m✓[39m experiments/wp5/wp5.3/fixtures/changed-ts-outside-src.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m124[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-v7.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m120[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-v7.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m120[2m[39m
[32m✓[39m src/execute.test.ts [2m(22m[2m2 test[22m[2m) [2m[32m25[2m[39m
[32m✓[39m dist/execute.test.js [2m(22m[2m2 test[22m[2m) [2m[32m47[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g1.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m97[2m[39m
[32m✓[39m experiments/wp0/fixture/src/math.test.ts [2m(22m[2m2 test[22m[2m) [2m[32m3[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-v1.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m98[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g1.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m97[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-g1.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m97[2m[39m
[32m✓[39m test/basic.test.ts [2m(22m[2m1 test[22m[2m) [2m[32m2[2m[39m
[32m✓[39m test/collect-complexity.test.ts [2m(22m[2m1 test[22m[2m) [2m[32m34[2m[39m
[32m✓[39m test/simple-complexity.test.ts [2m(22m[2m1 test[22m[2m) [2m[32m29[2m[39m
[32m✓[39m experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts [2m(22m[2m2 test[22m[2m) [2m[32m47[2m[39m
[32m✓[39m experiments/wp5/wp5.2/fixtures/fr-c2.spec.ts [2m(22m[2m1 test[22m[2m) [2m[32m71[2m[39m
[32m✓[39m src/crap.test.ts [2m(22m[2m5 test[22m[2m) [2m[32m3[2m[39m
[32m✓[39m test/rules.test.ts [2m(22m[2m10 test[22m[2m) [2m[32m8[2m[39m
[32m✓[39m test/evidence.test.ts [2m(22m[2m8 test[22m[2m) [2m[32m3[2m[39m
[32m✓[39m experiments/wp5/wp5.5/wp55-git-unsupported.spec.ts [2m(22m[2m4 test[22m[2m) [2m[33m2541[2m[39m
[32m✓[39m experiments/wp5/wp5.5/wp55-coverage-distinction.spec.ts [2m(22m[2m4 test[22m[2m) [2m[33m3120[2m[39m
       [33m[2m✓[22m[39m should return coverageArtifact: absent, analysisStatus: SUCCESS, gate: PASS, completeness: INCOMPLETE, exit 0 [33m304[2m[39m
       [33m[2m✓[22m[39m should return coverageArtifact: failed, coverageErrorReason: missing, analysisStatus: FAILED, gate: null, completeness: INCOMPLETE, exit 1, stderr: "coverage artifact missing" [33m309[2m[39m
       [33m[2m✓[22m[39m should return coverageArtifact: failed, coverageErrorReason: malformed, analysisStatus: FAILED, gate: null, completeness: INCOMPLETE, exit 1, stderr: "coverage artifact malformed" [33m311[2m[39m

[2m Test Files [22m [2m[1m[32m54 passed[39m[22m[2m[90m (54)[39m
[2m      Tests [22m [2m[1m[32m145 passed[39m[22m[2m[90m (145)[39m
[2m   Start at [22m 06:50:26
[2m   Duration [22m 3.59s[2m (transform 933ms, setup 0ms, import 12.44s, tests 12.60s, environment 3ms)[22m

[34m % [39m[2mCoverage report from [22m[33mv8[39m
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   73.95 |    65.73 |      82 |   73.75 |                   
 dist              |    52.8 |    47.61 |   54.54 |   52.87 |                   
  crap.js          |   31.81 |    48.48 |      50 |      30 | 8-47              
  execute.js       |   73.07 |    59.09 |     100 |   73.07 | 22,26,29,32,39-42 
  git.js           |   51.21 |    37.93 |      25 |   51.21 | 8-31,81-91        
 ...p0/fixture/src |   93.75 |       95 |     100 |   93.75 |                   
  math.ts          |   93.75 |       95 |     100 |   93.75 | 7                 
 ...wp5.2/fixtures |   96.77 |    58.33 |     100 |   96.77 |                   
  helpers.ts       |   96.77 |    58.33 |     100 |   96.77 | 114               
 src               |   76.65 |    70.73 |   86.66 |   76.29 |                   
  attribution.ts   |   77.02 |       75 |     100 |   76.71 | ...26-131,138-150 
  complexity.ts    |   96.42 |    66.66 |     100 |   96.42 | 70                
  coverage.ts      |   93.33 |    93.75 |     100 |    93.1 | 45-46             
  crap.ts          |   31.81 |    48.48 |      50 |      30 | 29-74             
  crapCalc.ts      |     100 |      100 |     100 |     100 |                   
  evidence.ts      |   82.35 |    89.47 |     100 |   81.25 | ...69-173,209-212 
  execute.ts       |   73.07 |    59.09 |     100 |   73.07 | 42,46,48,51,56-59 
  git.ts           |   58.53 |    44.82 |      50 |   58.53 | 18-38,93-103      
  rules.ts         |     100 |      100 |     100 |     100 |                   
-------------------|---------|----------|---------|---------|-------------------
Coverage artifact generated at /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/coverage/coverage-final.json
Copied coverage-final.json to proof directory

Running code-risk CLI check...
CLI exit code: 0
CLI output:
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "21daa57efcc659687020e0ee7fad125d7cf4161e",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [
    {
      "file": "src/coverage.ts",
      "method": "normalizeCoveragePaths",
      "lineStart": 38,
      "lineEnd": 72,
      "cc": 6,
      "crap": 6.5625,
      "coverage": 75,
      "coverageKind": "branch",
      "analyzerStatus": "passed",
      "source": {
        "tool": "@barney-media/crap-typescript-core",
        "version": "0.5.0"
      }
    },
    {
      "file": "src/coverage.ts",
      "method": "readCoverage",
      "lineStart": 74,
      "lineEnd": 105,
      "cc": 10,
      "crap": 10,
      "coverage": 100,
      "coverageKind": "stmt",
      "analyzerStatus": "passed",
      "source": {
        "tool": "@barney-media/crap-typescript-core",
        "version": "0.5.0"
      }
    }
  ],
  "policy": {
    "crapThreshold": 30
  },
  "ruleResults": [
    {
      "ruleId": "changed-function-high-crap",
      "result": "PASS",
      "file": "src/coverage.ts",
      "method": "normalizeCoveragePaths",
      "crap": 6.5625,
      "threshold": 30,
      "cc": 6,
      "coverage": 75
    },
    {
      "ruleId": "changed-function-high-crap",
      "result": "PASS",
      "file": "src/coverage.ts",
      "method": "readCoverage",
      "crap": 10,
      "threshold": 30,
      "cc": 10,
      "coverage": 100
    }
  ],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}

JSON output saved to /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp6/minimal-ci-proof/sample-output.json

Analysis status: SUCCESS
Gate: PASS
CI would PASS

=== Proof complete ===
```

## Exit Code

0 (success)

## Gate Evaluation

Based on the JSON output in `sample-output.json`:
- `analysisStatus`: SUCCESS
- `gate`: PASS
- `completeness`: COMPLETE

Therefore, CI would PASS.

## Reproducibility

This run is reproducible by running `./run-proof.sh` in the same directory (`experiments/wp6/minimal-ci-proof`). The script uses the current HEAD and HEAD~1 as the base and target, and generates a fresh coverage artifact from the test suite.