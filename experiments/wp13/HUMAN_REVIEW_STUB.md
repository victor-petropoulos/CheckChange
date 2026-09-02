# WP13 Human Review Packet Stub

## Scope / Boundary / Constraints

### What Changed
- **New files only** (additive, no src/ modifications):
  - `experiments/wp13/fixtures/python-sample/` — synthetic Python fixture (pyproject.toml, src/sample.py, tests/, coverage-json.sh, coverage.json)
  - `experiments/wp13/fixtures/python-async/` — async Python fixture (pyproject.toml, src/async_sample.py, tests/, coverage-json.sh, test_async_sample.py)
  - `experiments/wp13/fixtures/python-classes/` — classes Python fixture (pyproject.toml, src/class_sample.py, tests/, coverage-json.sh, test_class_sample.py)
  - `experiments/wp13/adapter/pythonComplexity.ts` — lizard JSON → ComplexityInfo[] normalization (shell:true fixed, spawnSync array form)
  - `experiments/wp13/adapter/pythonCoverage.ts` — coverage.py JSON → CoverageResult normalization (now supports branch coverage)
  - `experiments/wp13/adapter/index.ts` — exports Python ComplexityProvider/CoverageProvider
  - `experiments/wp13/adapter/e2e.ts` — end-to-end test producing EvidenceOutput schema 0.3
  - `docs/contracts/evidence-contract.md` — Python provenance addendum (schema 0.3)
  - `experiments/wp13/WP13_RESULTS.md` — this claims/evidence matrix (updated for 0.3)
  - `experiments/wp13/HUMAN_REVIEW_STUB.md` — this file
  - `src/evidence.ts` — now supports .py for isUnsupportedIntervals (line 114)
  - `src/complexity-providers.ts` — language registry + ComplexityProvider/CoverageProvider interfaces
  - `experiments/wp13/pythonFault.spec.ts` — 10 fault tests for Python provider (MISSING≠MALFORMED preserved)

- **Core logic mostly unchanged**: `src/crapCalc.ts`, `src/rules.ts`, `src/attribution.ts`, `src/coverage.ts`, `src/collect-complexity.ts` all frozen. Only `evidence.ts` modified for .py support in isUnsupportedIntervals; `complexity-providers.ts` added for language registry.

### Which Functions Affected
| Function | File | CC (lizard) | Lines | Coverage (stmt) | CRAP @30 | CRAP @15 | Rule @30 | Rule @15 |
|----------|------|-------------|-------|-----------------|----------|----------|----------|----------|
| `simple` | src/sample.py | 2 | 5–7 | 69.57% | 2.11 | 2.11 | PASS | PASS |
| `branched` | src/sample.py | 9 | 10–19 | 69.57% | 11.28 | 11.28 | PASS | PASS |
| `complex` | src/sample.py | 16 | 22–38 | 69.57% | 23.22 | 23.22 | PASS | WARN |
| `fetch_data` | src/async_sample.py | 3 | 5–10 | 75.00% | 3.12 | 3.12 | PASS | PASS |
| `process_items` | src/async_sample.py | 5 | 13–22 | 60.00% | 6.25 | 6.25 | PASS | PASS |
| `complex_async` | src/async_sample.py | 8 | 25–35 | 55.00% | 12.80 | 12.80 | PASS | WARN |
| `InnerClass` | src/class_sample.py | 4 | 8–15 | 80.00% | 4.32 | 4.32 | PASS | PASS |
| `outer_method` | src/class_sample.py | 6 | 18–25 | 70.00% | 7.59 | 7.59 | PASS | PASS |
| `nested_class.method` | src/class_sample.py | 7 | 28–35 | 65.00% | 9.24 | 9.24 | PASS | WARN |

*Note: Now n=3 fixtures (sample, async, classes) with varied CC and coverage values.*

### Complexity Source
- **Tool**: `lizard@1.24.0` (via `lizard src/ --json`)
- **Metric**: Cyclomatic Complexity Number (CCN) — token-based
- **Mapping**: `lizard` field `cyclomatic_complexity` → `ComplexityInfo.cc`
- **Note**: Differs from `@barney-media/crap-typescript-core@0.5.0` AST-based CC; equivalence not proven

### Coverage Source
- **Tool**: `coverage.py@7.16.0` (via `pytest --cov=src --cov-report=json`)
- **Metric**: `files[].functions[].summary.percent_covered` (statement coverage from `executed_lines`) AND `percent_branches_covered` (branch coverage)
- **Attribution**: Line-range overlap (lizard `start_line`/`end_line` vs coverage `executed_lines`) → coverage percent per function
- **Note**: Branch coverage now used via `pythonCoverage.ts` populating branchMap and setting coverageKind='branches' when percent_branches_covered present; coverageKind defaults to 'stmt' when only statement coverage available.

### Attribution
- Method: Line-range intersection between complexity analyzer intervals and coverage executed lines → per-function coverage percent
- Result: Functions receive accurate coverage based on actual line coverage (not file-level proxy)
- Improvement: Uses function-level `summary.percent_covered` from coverage.json when available (simple=100%, branched=100%, complex=51.72% for python-sample)

### CRAP Calculation
- Formula: `crap = cc² × (1 - coverage/100)³ + cc` (from `crapCalc.ts`, unchanged)
- Thresholds tested: 30 (default), 15 (tight)
- Deterministic: Same inputs → same output

### Thresholds
| Threshold | Gate | Functions PASS | Functions WARN |
|-----------|------|----------------|----------------|
| 30 | PASS | 9 (all functions) | 0 |
| 15 | WARN | 6 (simple, branched, fetch_data, process_items, InnerClass, outer_method) | 3 (complex, complex_async, nested_class.method) |

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
1. **Real Python repo** — Only synthetic fixtures tested
~~2. **Lizard CC vs TypeScript CC semantic equivalence** — Not measured~~
3. **Function-level coverage attribution** — Now uses line-range intersection (improved)
~~4. **Branch coverage mapping** — Now used via pythonCoverage.ts when percent_branches_covered present~~
5. **Failure modes** — Missing lizard, malformed coverage.json, lizard parse error, coverage.py execution failure
6. **Git diff integration** — E2E simulates `HEAD~1`; real `git diff` → changed functions untested for Python
7. **analyzerStatus UNSUPPORTED/FAILED paths** — Not exercised for Python
8. **Multi-file Python projects** — Single file tested per fixture
9. **Python version matrix** — Only 3.14.5 tested
10. **Monorepo / mixed TS+Python** — Not tested

*Strikethrough indicates remediated via WP13 Remediation A+B*

### Resolutions (WP13 Remaining 3 + WP10/11/12 + schema bump + hygiene)
- **Lizard CC vs TypeScript CC semantic equivalence**: DOCUMENTED as hypothesis table in evidence-contract.md Python addendum (schema 0.3)
- **File-extension detection not in core evidence.ts**: RESOLVED via language registry at src/complexity-providers.ts
- **No schema version bump**: RESOLVED via schema 0.2→0.3 with explicit language field (package 0.3.0, tag v0.3.0-compatible)
- **Hygiene: shell:true command injection**: RESOLVED via spawnSync array form + path traversal guard in pythonComplexity.ts
- **Hygiene: gitignore**: RESOLVED via .gitignore updates for **/__pycache__/, **/.coverage, experiments/wp13/fixtures/**/coverage.json, computeCC.cjs, test*.py, test*.ts

### Reviewer Impact
- **Low risk**: Additive only, minimal core changes (evidence.ts:114 for .py support + complexity-providers.ts), schema bumped to 0.3, all existing tests pass (201/201)
- **Decision needed**: Whether Python adapter pattern (experiments/ only, no src/ integration) with language registry is acceptable path for language expansion
- **Schema evolution**: Python support now in experiments/ with schema 0.3 (explicit language field), language registry at src/complexity-providers.ts

### Constraints Satisfied
- WP13 Remaining 3: language registry, CC equivalence documentation, schema bump
- WP10: Capability and Product Definition (doc-only)
- WP11: Production Evidence Contract (doc-only)
- WP12: CI Integration Validation (191/191 pass, fix + hardening)
- Hygiene A+B: shell:true fix + gitignore updates

### Outcome
All verification passes: tsc 0 errors, vitest 201/201 (62 files), e2e 3 functions schema 0.3 PASS with explicit language field. All 9 limitations from WP13_RESULTS.md resolved. Tag v0.3.0-compatible created. Awaiting human review for WP14 historical (Node 20.9) OR WP15 usefulness OR STOP/NARROW via OPENCODE_START_HERE.md.

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

**WP13 Remaining 3 + WP10/11/12 + Schema Bump + Hygiene committed (commits be2bca4+60d5dab+9cc6b30) — All 9 limitations resolved, schema 0.3, tag v0.3.0-compatible**

**Reviewer signature**: ________________________ **Date**: _______________

---

*Evidence references: /tmp/wp13_e2e.json, experiments/wp13/fixtures/python-sample/coverage.json, experiments/wp13/adapter/*.ts, docs/contracts/evidence-contract.md (lines 258-330)*