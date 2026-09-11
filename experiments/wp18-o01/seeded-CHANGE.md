# SEEDED CHANGE — T6: non-zero changedFunctions proof (OICP-MCP @ d906c56f)

Mem:41224 cited.
Date: 2026-09-11.
Task: T6 — seed real Python code change to close 0-fn caveat (O-01 PARTIAL/OPEN).

## Goal
Prior T2 runs had `changedFunctions: 0` (empty-diff PASS). Caveat: no high-risk interval exercised. T6 seeds a real change in OICP-MCP to prove risk-signal-on-changes for Python repos.

## Seeded change
- Repo: `/Users/victorpetropoulos/Cursor Projects/OICP-MCP`
- HEAD: `d906c56fb400cc71f9eaf95179ddbef7a3afcffe`
- File: `src/aicp/health.py` line 7 (inside `get_health_status`, covered function, 100% from prior coverage)
- Change: add branch `if True: marker = 1` (complexity 1 → 2, no behavior change)

### Verbatim diff (`experiments/wp18-o01/reproducibility/seeded-oicp-diff.txt`)
```diff
diff --git a/src/aicp/health.py b/src/aicp/health.py
index 81b7d8e..41ad9fe 100644
--- a/src/aicp/health.py
+++ b/src/aicp/health.py
@@ -4,6 +4,8 @@ from aicp import __version__
 
 def get_health_status() -> dict:
     """Return server health status."""
+    if True:  # SEEDED-CHANGE-T6
+        marker = 1
     return {
         "status": "ok",
         "version": __version__,
```

## Pytest + coverage regeneration
```command
$ cd /Users/victorpetropoulos/Cursor\ Projects/OICP-MCP
$ python3 -m coverage run --source=. -m pytest tests/ -q
...............................................                          [100%]
47 passed in 0.14s
PYTEST_EXIT: 0

$ python3 -m coverage json -o coverage.json    # JSON_EXIT: 0
$ python3 -m coverage xml -o coverage.xml      # XML_EXIT: 0
```
Seed lines covered (coverage.json): `health.py executed_lines: [2, 5, 7, 8, 9]`, `get_health_status` percent_covered **100.0**.

## check --json --base HEAD ×2 (deterministic)
```command
$ node <main-repo>/dist/cli.js check --json --base HEAD > seeded-oicp-run1.json   # exit 0
$ node <main-repo>/dist/cli.js check --json --base HEAD > seeded-oicp-run2.json   # exit 0
$ diff seeded-oicp-run1.json seeded-oicp-run2.json                                # exit 0, 0 lines — byte-identical (1054B each)
```
Artifacts: `reproducibility/seeded-oicp-run1.json`, `seeded-oicp-run2.json`, `seeded-oicp-run1-vs-run2.diff` (0B).

### Verbatim JSON (run1 == run2)
```json
{
  "schemaVersion": "0.4",
  "analysis": { "base": "d906c56fb400cc71f9eaf95179ddbef7a3afcffe", "target": "current" },
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": [
    {
      "file": "src/aicp/health.py",
      "method": "get_health_status",
      "lineStart": 5,
      "lineEnd": 12,
      "cc": 2,
      "crap": null,
      "coverage": null,
      "coverageKind": "N/A",
      "analyzerStatus": "skipped",
      "source": { "tool": "@barney-media/crap-typescript-core", "version": "0.5.0" },
      "language": "python"
    }
  ],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [
    {
      "ruleId": "changed-function-high-crap",
      "result": "NOT_EVALUATED",
      "file": "src/aicp/health.py",
      "method": "get_health_status",
      "crap": null,
      "threshold": 30,
      "cc": 2,
      "coverage": null
    }
  ],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "INCOMPLETE"
}
```

## Result
| Field | Value |
|-------|-------|
| changedFunctions count | **1** (non-zero — caveat closed) |
| changedFunctions names | `src/aicp/health.py:get_health_status` |
| gate | **PASS** (cc 2, no WARN) |
| analysisStatus | SUCCESS |
| coverageArtifact | available |
| completeness | **INCOMPLETE** (crap null → NOT_EVALUATED) |
| deterministic | run1 == run2 byte-identical |
| revert | clean — `git diff --name-only HEAD` = 0 lines, `git status --short` untracked-only |

## Revert proof
```command
$ git checkout -- src/aicp/health.py          # REVERT_EXIT: 0
$ git diff --stat                              # empty (0 tracked changes)
$ git diff --name-only HEAD | wc -l            # 0
$ git status --short                           # ?? .coverage, ?? coverage.json, ?? coverage.xml + pre-existing untracked only
```
External repo clean except untracked coverage artifacts + pre-existing untracked files. **Revert clean: YES.**

## Honest caveat: completeness INCOMPLETE — Python CRAP attribution gap
Gate PASS with N=1 fn met the closing goal (non-zero changedFunctions + PASS). BUT `crap: null`, `analyzerStatus: "skipped"`, rule `NOT_EVALUATED`, completeness `INCOMPLETE`.

Root cause (verified live): `src/attribution.ts:87` calls `parseFileMethods(filePath)` from `@barney-media/crap-typescript-core` — a **TypeScript-only parser** — on every coverage file, including `.py`. Direct probe:
```
node -e "parseFileMethods('/.../OICP-MCP/src/aicp/health.py')"
→ THREW: Unable to parse TypeScript source ... line 1, column 3: ';' expected.
```
catch → coveragePercent null → analyzerStatus 'skipped' → ruleResult NOT_EVALUATED → completeness INCOMPLETE (`evidence.ts:305-306`).

Implication: for ANY changed Python function, CRAP cannot be computed under current code — coverage attribution for Python is a genuine product gap (no Python descriptor parser in the attribution path). T2's `COMPLETE` on these repos was vacuous (0 changedFunctions → nothing to evaluate). WARN is currently **unreachable** for Python changed functions.

Second-seed attempt would NOT help: `parseFileMethods` throws for every `.py` — gap is language-independent of location.

Status: **NOT BLOCKED** (goal conditions non-zero fn + PASS met). Caveat updated: risk-signal-on-changes for Python = changedFunction detection proven; CRAP evaluation unproven pending parseFileMethods Python support.

Mem cite: mem:41224.