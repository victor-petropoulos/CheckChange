---
task: "O-01 Q1 breadth expansion — prove 2nd/3rd external repos (OICP-MCP + Code-Index-MCP) analyzable via Python bridge"
created: "2026-09-11T10:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Locate/verify OICP-MCP + Code-Index-MCP checkouts; record commit SHAs; confirm Python coverage artifacts ingestible via bridge (e4dadd3)"
    agent: "tester"
    files:
      - "experiments/wp18-o01/repo-checkouts.md"
    acceptance: "SHAs logged for both repos; ingest smoke test COMPLETE per repo (bridge runs without error); file exists with commit hashes"
    depends_on: []
  - id: "2"
    description: "Run deterministic validation per repo: run1 vs run2 diff 0-line; dirty-tree attribution YES; checkchange check --json gate output captured"
    agent: "tester"
    files:
      - "experiments/wp18-o01/reproducibility/oicp-mcp-run1-vs-run2.diff"
      - "experiments/wp18-o01/reproducibility/code-index-mcp-run1-vs-run2.diff"
      - "experiments/wp18-o01/RESULTS.md"
    acceptance: "Both diffs 0-line; dirty-tree attribution YES per repo; checkchange check --json gate output pasted in RESULTS.md showing WARN/PASS + changedFunctions count; acceptance triple met per evidence-contract.md:504"
    depends_on: ["1"]
  - id: "3"
    description: "Write experiments/wp18-o01/RESULTS.md + REPRO.md; update evidence-contract.md gap note; append PROJECT_STATUS_CONSOLIDATED.md §4/§5 (no rewrite history)"
    agent: "documenter"
    files:
      - "experiments/wp18-o01/RESULTS.md"
      - "experiments/wp18-o01/REPRO.md"
      - "docs/contracts/evidence-contract.md"
      - "PROJECT_STATUS_CONSOLIDATED.md"
    acceptance: "RESULTS.md has 12-case style table rows for OICP-MCP + Code-Index-MCP with SHA, LOC, changedFiles, gate output; REPRO.md has rerun commands; evidence-contract.md gap note updated citing O-01 closure; PROJECT_STATUS_CONSOLIDATED.md §4/§5 appended (not rewritten); mem:41224 cited in both"
    depends_on: ["2"]
  - id: "4"
    description: "Verification gate: tsc --noEmit exit 0; vitest run pass count; git diff --stat src/ empty (or flagged bridge fix only); checkchange gate WARN/PASS"
    agent: "tester"
    files: []
    acceptance: "Verbatim exit codes: tsc=0, vitest=PASS N/N; git diff --stat src/ shows 0 files (or only bridge fix file flagged in task 1 with re-review note); checkchange check --json outputs WARN/PASS"
    depends_on: ["3"]
  - id: "5"
    description: "Human review packet: solo ACCEPTED for 2 cases before CLOSE"
    agent: "reviewer"
    files:
      - "experiments/wp18-o01/PACKET.md"
    acceptance: "PACKET.md contains 2 case summaries with evidence refs; solo reviewer ACCEPTED annotation; O-01 CLOSE proposal written; matches WP17 Q7 protocol (12/12 ACCEPTED solo 2026-09-09)"
    depends_on: ["4"]
---
# O-01 Breadth Expansion Plan

## Context (mem:41224)
Q1 multi-repo breadth thin: only 1 external TS repo (engram @b2c61cf case-009) proven; 2-3 required. Python bridge (e4dadd3) closed WP18 gap-a: omlx-review-mcp @983a2df ingest COMPLETE + dirty-tree attribution YES + deterministic. Remaining thin: OICP-MCP + Code-Index-MCP untested.

## Grill Decisions Encoded
| Q | Decision |
|---|----------|
| Q1 | Repos: OICP-MCP (~8k Python) + Code-Index-MCP (~12k Python) as 2nd/3rd proof. TS breadth stays engram @b2c61cf. Rationale: O-03 OPEN candidates, Python bridge makes analyzable, zero new sourcing. |
| Q2 | Acceptance triple per repo: ingest COMPLETE + dirty-tree attribution YES + deterministic rerun (0-line diff) + checkchange check --json gate output pasted (changedFunctions count). Missing = INCOMPLETE. |
| Q3 | Artifacts: new `experiments/wp18-o01/` (RESULTS.md, REPRO.md, reproducibility/*.diff, PACKET.md). Do NOT mutate `experiments/wp17/` (CLOSED). |
| Q4 | Scope guard: docs-validation only. Constraints a-d active (ASSESSMENT.md:130), schema 0.4 frozen additive-only, zero core `src/` change. Bridge fix allowed only if flagged explicit + re-review. |
| Q5 | Human gate: solo reviewer ACCEPTED packet for 2 cases before CLOSE, same as WP17 Q7 (12/12 ACCEPTED solo 2026-09-09). |

## Task Dependencies
1 → 2 → 3 → 4 → 5 (sequential)

## Runnable Checks per Task
- T1: `ls -d <repo-path>`, `git -C <repo-path> rev-parse HEAD`, `checkchange check --json` smoke
- T2: `diff reproducibility/*run1-vs-run2.diff /dev/null`, `checkchange check --json` full output
- T3: `cat experiments/wp18-o01/RESULTS.md`, `grep -n mem:41224 docs/contracts/evidence-contract.md PROJECT_STATUS_CONSOLIDATED.md`
- T4: `npx tsc --noEmit`, `npx vitest run`, `git diff --stat src/`, `checkchange check --json`
- T5: `cat experiments/wp18-o01/PACKET.md` — verify ACCEPTED annotation