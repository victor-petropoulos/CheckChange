# WP13 Human Review Packet Stub

## Scope / Boundary / Constraints

### What Changed
- **New files only** (additive, no src/ modifications):
  - `experiments/wp13/fixtures/python-sample/` — synthetic Python fixture (pyproject.toml, src/sample.py, tests/, coverage-json.sh, coverage.json)
  - `experiments/wp13/adapter/pythonComplexity.ts` — lizard JSON → ComplexityInfo[] normalization
  - `experiments/wp13/adapter/pythonCoverage.ts` — coverage.py JSON → CoverageResult normalization
  - `experiments/wp13/adapter/index.ts` — exports Python ComplexityProvider/CoverageProvider
  - `experiments/wp13/adapter/e2e.ts` — end-to-end test producing EvidenceOutput schema 0.2
  - `docs/contracts/evidence-contract.md` — Python provenance addendum (no schema bump)
  - `experiments/wp13/WP13_RESULTS.md` — this claims/evidence matrix
  - `experiments/wp13/HUMAN_REVIEW_STUB.md` — this file

- **Core logic unchanged**: `src/crapCalc.ts`, `src/rules.ts`, `src/evidence.ts`, `src/attribution.ts`, `src/coverage.ts`, `src/collect-complexity.ts` all frozen.

### Which Functions Affected
| Function | File | CC (lizard) | Lines | Coverage (stmt) | CRAP @30 | CRAP @15 | Rule @30 | Rule @15 |
|----------|------|-------------|-------|-----------------|----------|----------|----------|----------|
| `simple` | src/sample.py | 2 | 5–7 | 69.57% | 2.11 | 2.11 | PASS | PASS |
| `branched` | src/sample.py | 9 | 10–19 | 69.57% | 11.28 | 11.28 | PASS | PASS |
| `complex` | src/sample.py | 16 | 22–38 | 69.57% | 23.22 | 23.22 | PASS | WARN |

### Complexity Source
- **Tool**: `lizard@1.24.0` (via `lizard src/ --json`)
- **Metric**: Cyclomatic Complexity Number (CCN) — token-based
- **Mapping**: `lizard` field `cyclomatic_complexity` → `ComplexityInfo.cc`
- **Note**: Differs from `@barney-media/crap-typescript-core@0.5.0` AST-based CC; equivalence not proven

### Coverage Source
- **Tool**: `coverage.py@7.16.0` (via `pytest --cov=src --cov-report=json`)
- **Metric**: `files[].functions[].summary.percent_covered` (statement coverage from `executed_lines`)
- **Attribution**: Line-range overlap (lizard `start_line`/`end_line` vs coverage `executed_lines`) → file-level percent used as proxy for function-level
- **Note**: Branch coverage available in JSON (`percent_branches_covered`) but not used; `coverageKind` set to `"stmt"`

### Attribution
- Method: File-level coverage percent applied to all functions in that file (simplified; no per-function line-range intersection in current adapter)
- Result: All 3 functions receive 69.57% coverage (file-level `src/sample.py` percent)
- Limitation: Function-level `summary.percent_covered` exists in coverage.json (simple=100%, branched=100%, complex=51.72%) but adapter uses file-level for simplicity

### CRAP Calculation
- Formula: `crap = cc² × (1 - coverage/100)³ + cc` (from `crapCalc.ts`, unchanged)
- Thresholds tested: 30 (default), 15 (tight)
- Deterministic: Same inputs → same output

### Thresholds
| Threshold | Gate | Functions PASS | Functions WARN |
|-----------|------|----------------|----------------|
| 30 | PASS | 3 (simple, branched, complex) | 0 |
| 15 | WARN | 2 (simple, branched) | 1 (complex) |

### Status Truthfulness
| Field | Value | Truthful? | Evidence |
|-------|-------|-----------|----------|
| `analysisStatus` | `SUCCESS` | ✅ | lizard + coverage.py both succeed |
| `capabilities.complexity` | `available` | ✅ | lizard runs and parses |
| `capabilities.coverageArtifact` | `available` | ✅ | coverage.json exists and parses |
| `capabilities.git` | `available` | ✅ | Git repo detected (simulated HEAD~1) |
| `analyzerStatus` (per function) | `passed` | ✅ | Both analyzers succeed per function |
| `gate` | `PASS` @30, `WARN` @15 | ✅ | Derived from ruleResults |
| `completeness` | `COMPLETE` | ✅ | All rules evaluated (no NOT_EVALUATED) |
| `coverageErrorReason` | omitted | ✅ | No coverage error |

### Evidence Missing / Untested
1. **Real Python repo** — Only synthetic fixture tested
2. **Lizard CC vs TypeScript CC semantic equivalence** — Not measured
3. **Function-level coverage attribution** — Currently uses file-level proxy
4. **Branch coverage mapping** — Available in coverage.py JSON, not used
5. **Failure modes** — Missing lizard, malformed coverage.json, lizard parse error, coverage.py execution failure
6. **Git diff integration** — E2E simulates `HEAD~1`; real `git diff` → changed functions untested
7. **analyzerStatus UNSUPPORTED/FAILED paths** — Not exercised for Python
8. **Multi-file Python projects** — Single file tested
9. **Python version matrix** — Only 3.14.5 tested
10. **Monorepo / mixed TS+Python** — Not tested

### Reviewer Impact
- **Low risk**: Additive only, no core changes, schema frozen at 0.2, all existing tests pass (191/191)
- **Decision needed**: Whether Python adapter pattern (experiments/ only, no src/ integration) is acceptable path for language expansion, or if core `evidence.ts` needs language routing
- **Schema evolution**: If Python support graduates to core, consider:
  - Adding explicit `language` field to `ChangedFunction` (currently implicit via `source.tool`)
  - Core file-extension → provider routing
  - Function-level coverage attribution using line-range intersection
  - Schema version bump to 0.3 (requires WP10/WP11 gap proof)

---

## AWAITING HUMAN REVIEW

**Reviewer**: Please evaluate the above constraints, limitations, and evidence. Decision options:

- [ ] **APPROVE** — Continue with constraints documented; merge to main
- [ ] **APPROVE WITH CONDITIONS** — Merge with specific follow-up tasks (list below)
- [ ] **REQUEST CHANGES** — Specific modifications needed before approval
- [ ] **REJECT** — Do not proceed; document rationale

**Follow-up conditions (if APPROVE WITH CONDITIONS)**:
1. ________________________________________________
2. ________________________________________________
3. ________________________________________________

**Reviewer signature**: ________________________ **Date**: _______________

---

*Evidence references: /tmp/wp13_e2e.json, experiments/wp13/fixtures/python-sample/coverage.json, experiments/wp13/adapter/*.ts, docs/contracts/evidence-contract.md (lines 258-330)*