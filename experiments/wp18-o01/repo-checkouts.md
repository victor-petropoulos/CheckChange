# O-01 Q1 Breadth Expansion — Repo Checkouts (Task 1)

Mem:41224 cited.
Date: 2026-09-11.

## TP1 (TP = Task)
Task ID: 1
Agent: tester
 trách: Cite mem:41224 victories: proven repos: engram @b2c61cf + omlx-review-mcp @983a2df. Remaining thin: OICP-MCP + Code-Index-MCP probe.

## SHAs Captured

| Repo | SHA | LOC (py-files) | dirty-tree | bridge smoke |
|------|-----|-----------------|------------|--------------|
| OICP-MCP | d906c56fb400cc71f9eaf95179ddbef7a3afcffe | ~1130 | YES (dirty: .opencode/, .DS_Store) | BLOCKED |
| Code-Index-MCP | 55eedd68b8be9f78aa36f674608ed7e8cd65a1b4 | 989 files | NO (base==target) | MR (baseline) |
| omlx-review-mcp | 79b1ca2396185b2a154189c78a4f524ffd287fe4 | (used only for baseline comparison) | YES (dirty: hooks/) | Reference |

## Verified Paths (+ cleanup note)

OICP-MCP checkout: `/Users/victorpetropoulos/Cursor Projects/OICP-MCP`
Code-Index-MCP checkout: `/Users/victorpetropoulos/Cursor Projects/Code-Index-MCP`

Both checkouts already present locally (no clone needed).

## Branch+Dirty Details

OICP-MCP:
- Path: `/Users/victorpetropoulos/Cursor Projects/OICP-MCP`
- HEAD: d906c56fb400cc71f9eaf95179ddbef7a3afcffe
- Recent commits: d906c56 (fix(task-7): add error handling...), 5a95fc6 (fix: add health tool...), a572316 (feat: add health check...)
- dirty-tree: YES (untracked: .opencode/, .DS_Store, Projects/, src/.DS_Store)
- LOC estimate: 1130 total lines in Python files (verified via `wc -l $(find . -name "*.py")`)

Code-Index-MCP:
- Path: `/Users/victorpetropoulos/Cursor Projects/Code-Index-MCP`
- HEAD: 55eedd68b8be9f78aa36f674608ed7e8cd65a1b4
- Recent commits: 55eedd6 (Fix v6 release gate formatting)
- dirty-tree: NO (checked: HEAD same as base used by checkchange, so 0-line diff)
- LOC estimate: 989 Python files detected

## Bridge Smoke Results

**OICP-MCP @ d906c56fb400cc71...:**
- Bridge tool: `/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json`
- Snapshot: `Sep 11 2026 12:08 UTC` (approx)
- Result:
  - Base commit: 81ceffafc3990f81d59ee578c498246fba25609c
  - capabilities: git=available, complexity=available, coverageArtifact=available
  - changedFunctions: []
  - analysisStatus: UNSUPPORTED
  - gate: null
  - completeness: NOT_APPLICABLE
- Coverage artifacts found: NO (.coverage, coverage.xml, coverage.json absent)
- Reason: Missing coverage data + unknown reason for UNSUPPORTED status (dist/ likely pre-bridge build, providers not registered). Needs investigation or manual coverage generation before full bridge ingestion can be proven.

**Code-Index-MCP @ 55eedd68b8be9f78...:**
- Bridge tool: `/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json`
- Snapshot: `Sep 11 2026 12:08 UTC` (approx)
- Result:
  - Base commit: 55eedd68b8be9f78aa36f674608ed7e8cd65a1b4
  - capabilities: git=available, complexity=available, coverageArtifact=absent
  - changedFunctions: [] (empty diff base==target)
  - analysisStatus: SUCCESS
  - gate: PASS
  - completeness: COMPLETE
- Coverage artifacts found: NO (no .coverage, coverage.xml, coverage.json detected)
- Reason: No coverage artifacts present. Baseline PASS due to empty diff (base==HEAD). Cannot prove end-to-end functionality without coverage data.

**omlx-review-mcp (reference for baseline):**
- Bridge smoke (from WP18 prior work, not re-run in T1):
  - SHA: 983a2df
  - ingest COMPLETE
  - dirty-tree attribution YES
  - deterministic (0-line diff between runs)
  - Coverage artifacts present: YES (verified via prior work)

## Acceptance Criteria (mem:41224)

Per Task 1 acceptance:
- [~] SHAs logged for both repos: DONE
- [~] Bridge smoke test COMPLETE per repo: **BLOCKED** — coverage artifacts missing for OICP-MCP and Code-Index-MCP. Smokes inconclusive pending artifact generation or alternative validation path.
- [~] File exists with commit hashes: DONE (`experiments/wp18-o01/repo-checkouts.md`)

## Next Steps (T2 prerequisites)

- Option A: Generate coverage artifacts for OICP-MCP + Code-Index-MCP (run tests with pytest/coverage, produce .coverage files or coverage.xml, move to repos).
- Option B: Investigate UNSUPPORTED root cause for OICP-MCP (check if providers are registered via fresh build; verify complexity analysis works with mature Python module set)..resolve if bridge integration works.
- Proceed to T2 only after smoke completes or blocker resolved.

## Sources

- corpus.md (candidates table)
- evidence-contract.md (gap-a tri-state: ingest COMPLETE/dirty-tree YES/deterministic)
- MEM:41224 (engram incomplete, WP18 gap a closure)