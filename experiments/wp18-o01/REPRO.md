# REPRO — O-01 Q1 Breadth Expansion (Task 3)

Mem:41224 cited.
Date: 2026-09-11.

## Rerun Commands (verbatim)

### Repo Locations + SHAs
```bash
# OICP-MCP
ls -d /Users/victorpetropoulos/Cursor\ Projects/OICP-MCP
git -C /Users/victorpetropoulos/Cursor\ Projects/OICP-MCP rev-parse HEAD
# Expected: d906c56fb400cc71f9eaf95179ddbef7a3afcffe

# Code-Index-MCP
ls -d /Users/victorpetropoulos/Cursor\ Projects/Code-Index-MCP
git -C /Users/victorpetropoulos/Cursor\ Projects/Code-Index-MCP rev-parse HEAD
# Expected: 55eedd68b8be9f78aa36f674608ed7e8cd65a1b4
```

### OICP-MCP — Pytest + Coverage Generation
```bash
cd /Users/victorpetropoulos/Cursor\ Projects/OICP-MCP
python3 -m coverage run --source=. -m pytest tests/
# Expected: 47 passed in ~0.17s
python3 -m coverage xml && python3 -m coverage json
# Produces: .coverage (52K), coverage.xml (24K), coverage.json (60K)
```

### Code-Index-MCP — Pytest + Coverage Generation (subset, full blocked)
```bash
cd /Users/victorpetropoulos/Cursor\ Projects/Code-Index-MCP
.venv/bin/python -m pytest tests/test_multi_repo_manager.py tests/test_plugin_startup_preindex.py tests/test_sqlite_pool.py tests/smoke/ -o addopts="" --cov=mcp_server --cov-report=xml --cov-report=json
# Expected: 35 passed in ~15.81s
# Full suite blocked: pytest.ini strict-markers + 7 unregistered markers (out of scope)
```

### Deterministic Validation (×2 runs per repo, --base HEAD pinned)
```bash
# OICP-MCP run 1
cd /Users/victorpetropoulos/Cursor\ Projects/OICP-MCP
node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json --base HEAD > /tmp/oicp-run1.json
echo $?   # Expected: 0

# OICP-MCP run 2
node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json --base HEAD > /tmp/oicp-run2.json
echo $?   # Expected: 0

# Diff (expect 0 lines, byte-identical)
diff /tmp/oicp-run1.json /tmp/oicp-run2.json
wc -l <(diff /tmp/oicp-run1.json /tmp/oicp-run2.json)
# Expected: 0 lines, exit 0
```

```bash
# Code-Index-MCP run 1
cd /Users/victorpetropoulos/Cursor\ Projects/Code-Index-MCP
node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json --base HEAD > /tmp/ci-run1.json
echo $?   # Expected: 0

# Code-Index-MCP run 2
node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --json --base HEAD > /tmp/ci-run2.json
echo $?   # Expected: 0

# Diff (expect 0 lines, byte-identical)
diff /tmp/ci-run1.json /tmp/ci-run2.json
wc -l <(diff /tmp/ci-run1.json /tmp/ci-run2.json)
# Expected: 0 lines, exit 0
```

### Expected Gate Outputs (both runs identical)

#### OICP-MCP @ d906c56f
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
- gate: **PASS**, changedFunctions: **0**, exit: **0**, analysisStatus: SUCCESS, completeness: COMPLETE

#### Code-Index-MCP @ 55eedd68
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
- gate: **PASS**, changedFunctions: **0**, exit: **0**, analysisStatus: SUCCESS, completeness: COMPLETE

### Verification Checks
```bash
# Diff reproducibility artifacts (0-line expected)
diff experiments/wp18-o01/reproducibility/oicp-mcp-run1-vs-run2.diff /dev/null
diff experiments/wp18-o01/reproducibility/code-index-mcp-run1-vs-run2.diff /dev/null

# Gate re-check (main repo dist)
cd /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode
node dist/cli.js check --json --base HEAD   # from either repo cwd

# Git diff main repo src/ (must be empty)
git diff --stat src/

# Mem cite grep
grep -n "mem:41224" docs/contracts/evidence-contract.md PROJECT_STATUS_CONSOLIDATED.md
```

## Caveats (honest, must flag)

| Caveat | Detail |
|--------|--------|
| **0 changedFunctions = empty-diff PASS** | Both repos have 0 tracked changes vs HEAD → `changedFunctions: []` is vacuously correct. No high-risk intervals exercised. Contrast: WP17 engram case-009 @b2c61cf had 31 changedFunctions with actual complexity/coverage evaluation. |
| **OICP-MCP auto-base broken** | `git detectDefaultBase` picks `master` (descendant: 1 commit ahead, README only). Use `--base HEAD` explicitly. Root cause: root-cause-B.md. |
| **Code-Index-MCP full suite blocked** | 7 unregistered pytest markers → EXIT 2. Subset 35 tests collected. Marker defect out of scope. |
| **coverageArtifact="available" in OICP run1.json** | Runtime truth: OICP coverage files present (Task-A generated). But prior T1 auto-base run showed hardcoded 'available' in UNSUPPORTED branch (evidence.ts:182). Current --base HEAD run reflects actual filesystem scan. |
| **No WP17 mutation** | All artifacts under `experiments/wp18-o01/`. `experiments/wp17/` untouched (CLOSED). |

## Acceptance Triple (per evidence-contract.md:504)

| Repo | ingest | dirty-tree attribution | deterministic (0-line) |
|------|--------|------------------------|------------------------|
| OICP-MCP | COMPLETE ✓ | YES (untracked only) ✓ | YES (0-line diff) ✓ |
| Code-Index-MCP | COMPLETE ✓ | NO tracked (1 untracked) ✓ | YES (0-line diff) ✓ |

Both repos: **ACCEPTANCE TRIPLE MET** → O-01 PARTIAL/OPEN (coverage thin, no high-risk fn tested).

Mem cite: mem:41224.