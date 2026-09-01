# WP12 SUCCESS Validation Supplement

## Branch and Change
- Worktree: .worktrees/synthetic-wp12-success
- Branch: synthetic/wp12-success-validation
- Base: 4c9744dc5aedbf02663d5162689ae6935da24de6 (HEAD~1)
- Change: src/rules.ts, line 21, inside evaluateHighCrap: added comment `// synthetic WP12 SUCCESS validation`
- Effect: 1 changed function (evaluateHighCrap), cc=1, crap=1, coverage=100%

## Pipeline Results
| Pipeline | Command | Exit Code | Gate | Completeness | Timings (cli/vitest) |
|----------|---------|-----------|------|--------------|----------------------|
| P1 default | `node dist/cli.js check --base HEAD~1 --json` | 0 | PASS | COMPLETE | ~0.31s / ~3.6s |
| P2 explicit | `node dist/cli.js check --base HEAD~1 --json --coverage-file coverage/coverage-final.json --crap-threshold 15` | 0 | PASS | COMPLETE | ~0.31s / ~3.6s |
| WARN probe | `node dist/cli.js check --base HEAD~1 --json --crap-threshold 0` | 1 | WARN | COMPLETE | ~0.31s / ~3.6s |

## JSON Samples (trimmed, real)
### P1/P2 SUCCESS (threshold 30 -> PASS, 15 -> PASS)
```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "4c9744dc5aedbf02663d5162689ae6935da24de6",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [
    {
      "file": "src/rules.ts",
      "method": "evaluateHighCrap",
      "lineStart": 20,
      "lineEnd": 58,
      "cc": 1,
      "crap": 1,
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
      "file": "src/rules.ts",
      "method": "evaluateHighCrap",
      "crap": 1,
      "threshold": 30,
      "cc": 1,
      "coverage": 100
    }
  ],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```
### WARN probe (threshold 0 -> WARN, exit 1)
```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "4c9744dc5aedbf02663d5162689ae6935da24de6",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [
    {
      "file": "src/rules.ts",
      "method": "evaluateHighCrap",
      "lineStart": 20,
      "lineEnd": 58,
      "cc": 1,
      "crap": 1,
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
    "crapThreshold": 0
  },
  "ruleResults": [
    {
      "ruleId": "changed-function-high-crap",
      "result": "WARN",
      "file": "src/rules.ts",
      "method": "evaluateHighCrap",
      "crap": 1,
      "threshold": 0,
      "cc": 1,
      "coverage": 100
    }
  ],
  "analysisStatus": "SUCCESS",
  "gate": "WARN",
  "completeness": "COMPLETE"
}
```

## Threshold Propagation Verification
- The WARN probe with --crap-threshold 0 produced gate WARN and ruleResults.crap.passed=false.
- This proves that the threshold from CLI propagates to the policy and then to the rule evaluation.

## Error Path Verification
### Missing coverage file
```bash
$ node dist/cli.js check --base HEAD~1 --json --coverage-file /tmp/missing.json
```
- Exit code: 1
- Stderr: "coverage artifact missing"
- JSON (if any): analysisStatus FAILED, gate null, completeness INCOMPLETE, coverageErrorReason: missing

### Base unresolvable
```bash
$ node dist/cli.js check --base nonexistent --json
```
- Exit code: 1
- Stderr: "Cannot resolve base reference: nonexistent"

## Reproducibility
- P1 ran twice: identical JSON (including analysis.base, no timestamps in output).
- P2 ran twice: identical JSON.

## F-03 and Case Sensitivity Note
- During F-03 rebasing, coverage keys are lowercased (e.g., /users/.../src/rules.ts).
- The matcher uses `endsWith` to match to complexity key 'src/rules.ts'.
- Lowercase file avoids the crapCalc capital bug (where capitalized filenames caused mismatch).
- Known limitation: capitalized filenames in coverage output may not match complexity keys (which are lowercase).
- Recommendation: either lowercase both sides or avoid capitals in filenames for coverage matching.

## Regression Guard
- In the worktree after the change:
  - `tsc --noEmit`: exit 0
  - `vitest run --no-coverage`: 191/191 tests pass (61 files)
  - `git diff src/`: only shows the 1-line insertion in src/rules.ts, otherwise clean.

## Updated Fork Diagnosis
- Caller-side: OK (we can invoke the check and get expected results).
  - Contract: SUCCESS proven (P1/P2) and WARN via threshold 0 proven.
- Provider v8: OK (the tool works as expected).
- Attribution case bug: noted but not blocking because we used a lowercase file (src/rules.ts) for the synthetic change.
  - The bug would affect capitalized filenames (like crapCalc.ts) but we avoided it by choosing a lowercase file.

## Limitations Remaining
- Only one function changed (low complexity).
- Not testing high-complexity WARN with real coverage (we only have a trivial function).
- Worktree pollution observed: the initial coverage run included files from .worktrees until cleaned.
  - Recommendation: add `**.worktrees/**` to coverage exclusion in vitest config to avoid including worktree files in future runs.

## Recommendation
SUCCESS path is now live-validated. The original WP12 limitation (no changed-function SUCCESS path exercised) is partially lifted:
  - We have proven a SUCCESS PASS with a changed function.
  - We have proven WARN gate via threshold manipulation.
  - Remaining gaps: high-complexity changed function, real-world coverage scenarios, and ensuring worktree isolation in coverage.

## N1 Extension 2026-09-01 — High-CC WARN + Capital-File Live (VERIFIED)

### Branch and Change
- Branch: synthetic/n1-highcc-verify (ephemeral, base 6eac65b = HEAD~1 of main 539d3fd, cleaned after run)
- Change: src/crapCalc.ts added syntheticHighRiskProbe(a,b,c) — 8 branches (cc=8 per crap-typescript), lines ~12-30
- Effect: 1 changed function, cc=8, coverage 0% (uncovered), crap=72 (72>30 => WARN). Exercises fix 8885796 src/attribution.ts:63 case-insensitive (capital-C file).

### Pipeline Results (live, reproduced)
| Pipeline | Command | Exit | Gate | Completeness | changedFunctions |
|---|---|---|---|---|---|
| P1 default 30 | node dist/cli.js check --base HEAD~1 --json | 1 | WARN | COMPLETE | 1 src/crapCalc.ts cc8 crap72 cov0 |
| P2 threshold 15 | node dist/cli.js check --base HEAD~1 --coverage-file coverage/coverage-final.json --crap-threshold 15 --json | 1 | WARN | COMPLETE | 1 same |
| WARN probe 1 | node dist/cli.js check --base HEAD~1 --crap-threshold 1 --json | 1 | WARN | COMPLETE | 1 same |

### JSON Sample P1 (threshold 30 -> WARN) — from /tmp/N1_P1.json
```json
{
  "schemaVersion": "0.2",
  "analysis": {
    "base": "6eac65b91330ac68f6dd919585800e14f082213f",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [
    {
      "file": "src/crapCalc.ts",
      "method": "syntheticHighRiskProbe",
      "lineStart": 12,
      "lineEnd": 30,
      "cc": 8,
      "crap": 72,
      "coverage": 0,
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
      "result": "WARN",
      "file": "src/crapCalc.ts",
      "method": "syntheticHighRiskProbe",
      "crap": 72,
      "threshold": 30,
      "cc": 8,
      "coverage": 0
    }
  ],
  "analysisStatus": "SUCCESS",
  "gate": "WARN",
  "completeness": "COMPLETE"
}
```

### Evidence Highlights
- High-CC WARN: cc8 cov0 crap72 >30 => WARN exit1 proven live
- Capital-file live: src/crapCalc.ts fix 8885796 exercised (lowercase coverage key vs capital-C path)
- Threshold propagation: P2 15 => policy 15, rule threshold 15 => WARN proven
- P1/P2 consistent WARN

### Regression Guard
- tsc --noEmit 0, vitest 191/191, git diff src clean after restore

### Limitation Update for N1
PARTIALLY LIFTED => LIFTED for high-CC WARN + capital-file dimensions. Remaining gap: cross-env rebasing (not in scope).

Reference: /tmp/N1_P1.json, /tmp/N1_P2.json on host, plus WP12 packet.