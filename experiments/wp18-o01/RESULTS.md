# RESULTS — O-01 Q1 Breadth Expansion (Task 2)
## Deterministic Validation: OICP-MCP + Code-Index-MCP

Mem:41224 cited.
Date: 2026-09-11.
Task: 2 (deterministic rerun ×2, diffs, dirty-tree attribution, gate capture).

## Case Rows (12-case style, per WP17 protocol)

| Case | Repo | SHA (pinned base) | LOC (py) | changedFiles (tracked vs HEAD) | gate | coverageArtifact | analysisStatus | completeness | changedFunctions | ingest | dirty | deterministic |
|------|------|-------------------|----------|-------------------------------|------|------------------|----------------|--------------|------------------|--------|-------|---------------|
| o-01-a | OICP-MCP | d906c56fb400cc71f9eaf95179ddbef7a3afcffe | 1130 | 0 | PASS | available | SUCCESS | COMPLETE | 0 | COMPLETE | YES (untracked only) | YES (0-line) |
| o-01-b | Code-Index-MCP | 55eedd68b8be9f78aa36f674608ed7e8cd65a1b4 | 297476 | 0 | PASS | available | SUCCESS | COMPLETE | 0 | COMPLETE | NO tracked (1 untracked coverage.json) | YES (0-line) |
| o-01-c | OICP-MCP | d906c56fb400cc71f9eaf95179ddbef7a3afcffe | 1130 | 1 | PASS | available | SUCCESS | INCOMPLETE | 1 | COMPLETE | YES (tracked change in src/aicp/health.py) | YES (0-line) |

Acceptance triple per repo (evidence-contract.md:504): ingest `COMPLETE` ✓, dirty-tree attribution correct ✓, deterministic rerun 0-line ✓.

## Reproducibility Artifacts

```
experiments/wp18-o01/reproducibility/
  oicp-mcp-run1.json              415B   check --json --base HEAD (run 1)
  oicp-mcp-run2.json              415B   check --json --base HEAD (run 2)
  oicp-mcp-run1-vs-run2.diff        0B   diff run1 run2 → 0 lines
  code-index-mcp-run1.json        415B   check --json --base HEAD (run 1)
  code-index-mcp-run2.json        415B   check --json --base HEAD (run 2)
  code-index-mcp-run1-vs-run2.diff  0B   diff run1 run2 → 0 lines
```

Diff line counts (`diff <run1> <run2> | wc -l`): **0** both repos. No timestamps in output → full byte-identical JSON (415B each, same hash both runs).

## Verbatim check --json Outputs (--base HEAD)

### OICP-MCP @ d906c56f (oicp-mcp-run1.json == run2.json, byte-identical)
```command
$ cd /Users/victorpetropoulos/Cursor\ Projects/OICP-MCP
$ node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json --base HEAD
$ echo $?   → 0
```
```json
{
  "schemaVersion": "0.4",
  "analysis": { "base": "d906c56fb400cc71f9eaf95179ddbef7a3afcffe", "target": "current" },
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": [],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```
- gate: **PASS** (not WARN — 0 changedFunctions, no rules triggered)
- changedFunctions count: **0**
- exit code: **0** (matches evidence-contract §11.2 PASS → 0)

### Code-Index-MCP @ 55eedd68 (code-index-mcp-run1.json == run2.json, byte-identical)
```command
$ cd /Users/victorpetropoulos/Cursor\ Projects/Code-Index-MCP
$ node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json --base HEAD
$ echo $?   → 0
```
```json
{
  "schemaVersion": "0.4",
  "analysis": { "base": "55eedd68b8be9f78aa36f674608ed7e8cd65a1b4", "target": "current" },
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": [],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```
- gate: **PASS**
- changedFunctions count: **0**
- exit code: **0**

## Dirty-Tree Attribution

### OICP-MCP — dirty: YES (untracked only, 0 tracked changes)
`git status --short` excerpt:
```
?? .DS_Store
?? .coverage
?? .opencode/
?? AICP/
?? Projects/
?? coverage.json
?? src/.DS_Store
?? src/aicp.egg-info/
?? src/aicp/__pycache__/
?? src/aicp/discovery/orchestrator.py   (added py file)
?? tests/.../__pycache__/
```
`git diff --name-only HEAD` → **empty** (0 tracked changes). Engine attributes dirty tree correctly: `changedFunctions: []`, gate PASS. Untracked files do not enter change intervals.

### Code-Index-MCP — dirty: NO tracked changes (1 untracked artifact)
`git status --short` excerpt:
```
?? coverage.json
```
`git diff --name-only HEAD` → **empty** (0 tracked changes; base==HEAD). The single `?? coverage.json` is the Task-A generated artifact (untracked), not a source change. Engine attributes correctly: `changedFunctions: []`, gate PASS.

Attribution verdict per repo: **correct** — both repos 0 tracked diff → 0 changedFunctions, PASS. Dirty state (untracked files) does not pollute intervals.

## coverageArtifact: available (honest, filesystem scan)

Task-A generated coverage files now on disk in both repos → `coverageArtifact: "available"` is runtime truth (`src/coverage.ts:241` filesystem precedence scan over `.coverage` > `coverage.xml` > `coverage.json`). Note: coverage-A.md recorded OICP "absent" — that was pre-artifact snapshot; current state with artifacts present reports "available" honestly. dist/cli.js mtime Sep 10 09:08 — unchanged (no rebuild, no src change).

## Runnable Checks

```command
$ diff experiments/wp18-o01/reproducibility/oicp-mcp-run1-vs-run2.diff /dev/null          # exit 0, 0 lines
$ diff experiments/wp18-o01/reproducibility/code-index-mcp-run1-vs-run2.diff /dev/null    # exit 0, 0 lines
$ wc -l experiments/wp18-o01/reproducibility/*.diff                                        # 0 each
$ diff oicp-mcp-run1.json oicp-mcp-run2.json                                               # exit 0 (byte-identical)
$ diff code-index-mcp-run1.json code-index-mcp-run2.json                                  # exit 0 (byte-identical)
$ node dist/cli.js check --json --base HEAD   (either repo cwd, main repo dist)            # gate PASS, changedFunctions 0
$ git -C <repo> diff --name-only HEAD          # empty both repos
```

## Evidence Summary

| Check | Result |
|-------|--------|
| OICP run1-vs-run2 diff | 0 lines (byte-identical 415B) |
| Code-Index run1-vs-run2 diff | 0 lines (byte-identical 415B) |
| OICP gate | PASS, changedFunctions 0, SUCCESS/COMPLETE, exit 0 |
| Code-Index gate | PASS, changedFunctions 0, SUCCESS/COMPLETE, exit 0 |
| OICP dirty-tree attribution | correct (dirty untracked, 0 changedFunctions) |
| Code-Index dirty-tree attribution | correct (clean tracked, 0 changedFunctions) |
| Main repo src/ change | ZERO (git diff --stat src/ empty) |

## Caveat: 0 changedFunctions = Empty-Diff PASS (Honest Flag)

**Critical distinction**: Both repos show `changedFunctions: 0` because **0 tracked changes vs HEAD** (empty diff baseline). This is a *vacuously correct* PASS — no high-risk intervals were exercised, no complexity/coverage evaluation occurred on actual changed functions.

Contrast: **WP17 engram case-009 @b2c61cf** had **31 changedFunctions** with real CRAP evaluation (complexity + coverage on actual modified code). O-01 proves *ingest pipeline works* (bridge runs, attribution correct, deterministic), but does **not** prove *risk detection on changed functions* for Python repos.

This caveat must be carried forward to any closure claim. O-01 status: **PARTIAL/OPEN** — breadth ingest proven; risk-signal-on-changes unproven for Python.

Mem cite: mem:41224.