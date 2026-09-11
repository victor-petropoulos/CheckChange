# SEEDED RERUN — Task 3: Python attribution fix verification (OICP-MCP @ d906c56f)

Mem:41224 cited.
Date: 2026-09-11.
Task: T3 — re-run seeded OICP check after `pythonDescriptorProvider` fix (Task 1) to verify COMPLETE PASS.

## Result: INCOMPLETE — FIX NOT SUFFICIENT (task acceptance NOT met)

| Field | Expected (plan T3) | Actual |
|-------|--------------------|--------|
| completeness | COMPLETE | **INCOMPLETE** |
| changedFunctions length | > 0 | 1 |
| crap | < 30 (PASS) | **null** |
| coverage | non-null | **null** |
| analyzerStatus | passed | **skipped** |
| ruleResult | PASS | **NOT_EVALUATED** |
| gate | PASS | PASS |

`node dist/cli.js check --json --base HEAD` on the seeded change produced output **byte-identical to the pre-fix INCOMPLETE run** (`diff` exit 0, 1054B each). Fix deployed in dist (`dist/attribution.js` lines 60-61 `.py` guard → `parsePythonFileMethods`), but real-world Python coverage artifact still fails attribution.

## Seeded change (identical to seeded-CHANGE.md)

- Repo: `/Users/victorpetropoulos/Cursor Projects/OICP-MCP` — HEAD `d906c56fb400cc71f9eaf95179ddbef7a3afcffe`
- File: `src/aicp/health.py` — added `if True: marker = 1` (CC 1 -> 2, no behavior change)
- Diff byte-identical to `seeded-oicp-diff.txt` (index `81b7d8e..41ad9fe`)
- Coverage regen: `coverage run --source=. -m pytest tests/ -q` -> **47 passed**, `coverage json`/`xml` exit 0
- Seed lines covered: `executed_lines: [2, 5, 7, 8, 9]`, function `get_health_status` `percent_covered: 100.0` (function-level, present in coverage.json)

## check x2 (deterministic)

```command
$ node <main-repo>/dist/cli.js check --json --base HEAD > seeded-oicp-rerun1.json   # exit 0
$ node <main-repo>/dist/cli.js check --json --base HEAD > seeded-oicp-rerun2.json   # exit 0
$ diff seeded-oicp-rerun1.json seeded-oicp-rerun2.json                               # exit 0, 0 lines — byte-identical (1054B each)
```
Artifacts: `reproducibility/seeded-oicp-rerun1.json`, `seeded-oicp-rerun2.json`, `seeded-oicp-rerun1-vs-rerun2.diff` (0B).

### Verbatim JSON (run1 == run2, also == pre-fix run)
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

## Root cause (verified by live probe, not guessed)

Fix (Task 1) closed the *parser* gap only: `attribution.ts` now calls `parsePythonFileMethods` for `.py` instead of TS-only `parseFileMethods`. Descriptor matches (probe: `get_health_status:5`, startLine 5, endLine 12, cc 2). **But coverage attribution still fails.**

Probe against real pipeline (`readCoverage` -> `parseCoverageReport` -> `coverageForMethods`):

```
HEALTH KEY: /users/victorpetropoulos/cursor projects/oicp-mcp/src/aicp/health.py
FILE KEYS: statements,branches,functions
has statementMap: false
coverageForMethods: [{"coverage":{"percent":null,"status":"unknown","unknownReason":"statement_unattributed"}, ...}]
statements: []   functions: []    <- parseCoverageReport produced EMPTY buckets
```

Why: `transformPythonCoverageToIstanbul` (coverage.ts) only re-keys absolute file paths — it does **not** convert Python-shaped `fileData` (`executed_lines`, no `statementMap`) into Istanbul spans. `parseCoverageReport` then yields empty `statements`/`functions`; `coverageForMethods` returns `statement_unattributed` -> coverage null -> analyzerStatus `skipped` -> `NOT_EVALUATED` -> `INCOMPLETE`.

Independent repro (tmp repo, Python-shaped `coverage.json` at root + `coverage/coverage-final.json`): `buildEvidenceOutput` -> same `INCOMPLETE`. The **only** shape that passes is istanbul `statementMap` + `s` counts (coverage-final.json from a TS repo) — which real coverage.py artifacts never emit.

Note: coverage.py JSON *does* carry per-function coverage (`functions.get_health_status.summary.percent_covered: 100.0`) — surface exists, transform drops it.

## Test gap (Task 2, tester-owned)

`test/attribution-python.test.ts` `seedCoverageData()` used **istanbul-shaped** coverage-final.json (`statementMap`), NOT the Python shape documented in seeded-CHANGE.md (`executed_lines`). Test passed for the wrong reason — it never exercised the real artifact shape. Fix: seed must mirror seeded-CHANGE.md Python shape -> expected red -> then implementer closes transform gap.

## Revert proof
```command
$ git checkout -- src/aicp/health.py          # REVERT_EXIT: 0
$ git diff --stat                              # empty (0 tracked changes)
$ git diff --name-only HEAD | wc -l            # 0
$ git status --short                           # ?? coverage.json, ?? coverage.xml, ?? .coverage + pre-existing untracked only
```
External repo clean except untracked coverage artifacts + pre-existing untracked files. No `.checkchange-coverage-temp-*` leftovers. **Revert clean: YES.**

## Status

**Task 3 acceptance NOT met** (`completeness: COMPLETE` required). Fix is a necessary-but-insufficient first step. Hand back to implementer: extend coverage transform to build Istanbul spans from Python function-level coverage (or attribute via coverage.py `functions.*.summary.percent_covered`), then re-run this seed -> expect COMPLETE.

Mem cite: mem:41224.
