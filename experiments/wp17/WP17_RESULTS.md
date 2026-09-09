# WP17 Validation Results — FINAL (8 cases)

**Baseline version:** 0.4.0 (commit 4fbae48)
**Baseline tests:** 233/233 passing
**Execution date:** 2026-09-08
**Scope:** FINAL (8 cases, target 8-12; human review ACCEPTED 2026-09-09, multi-repo + high-complexity unmet)

## Gate Answers (Q1–Q7) — FINAL (evidence-backed)

| Gate Q | Answer (FINAL) | Status | Evidence Pointer |
|--------|----------------|--------|------------------|
| **Q1. Repository Selection** | single repo (code-risk-prototype-v0.3-opencode). Audience: AI coding workflow around checkchange CLI used locally. Q1 requires 2-3 repos — partially met. | FINAL | corpus.md (repo candidates table empty) |
| **Q2. Case Selection Method** | manual sampling from git log window (feature, fix, test-only, mechanical, prod-without-test, docs-only) + 2 AI-generated branches. No random/stratified sampling run. | FINAL | corpus.md case-001..008 |
| **Q3. Ground Truth Definition** | evidence usefulness judged by: changed-function attribution clarity, gate/completeness classification, CLI stability. Human judgment executed 2026-09-09 (human-review/ 8/8 ACCEPTED). | FINAL | human-review/case-001..008.md (ACCEPTED) |
| **Q4. AI-Agent Independence** | 2 explicit AI-generated cases: case-006 (git.ts local var rename + comment → exit 1 WARN, deterministic), case-007 (evidence.ts unused stub → exit 0 PASS, 2 changed fns). Pipeline ran independently; no CheckChange config changes. | PASS (partial) | evidence/case-006.txt, evidence/case-007.txt |
| **Q5. Reproducibility Protocol** | pilot `check --help` 2 runs → 0-line diff (PASS). case-006 `check --verbose` 2 runs → 0-line diff (PASS). | PASS | reproducibility/pilot-run1-vs-run2.diff, reproducibility/case-006-run1-vs-run2.diff |
| **Q6. Workflow Cost Measurement** | check runtime 0.333s; evidence 0.5-2KB/case (total 9907 bytes). No setup cost (already built). | PASS | evidence/cost-notes.txt |
| **Q7. Human Review Protocol** | ACCEPTED 2026-09-09 (user sign-off 8/8, reviewer user). | ACCEPTED | human-review/ |

## Cases Overview (8)

| Case | Commit | Type | Files | +/- | Evidence File |
|------|--------|------|-------|-----|---------------|
| case-001 | 388d992 | Feature (largest, +499/-228) | 12 files | +499/-228 | evidence/case-001.txt |
| case-002 | 6f26f95 | Fix (small, +2/-1) | 2 files | +2/-1 | evidence/case-002.txt |
| case-003 | c9b6654 | Test-only (+100) | 2 files | +100 | evidence/case-003.txt |
| case-004 | 8bd543d | Mechanical rename (+41/-20) | 8 files | +41/-20 | evidence/case-004.txt |
| case-005 | 480de63 | Prod-without-test (+37/-6) | 2 files | +37/-6 | evidence/case-005.txt |
| case-006 | wp17-pilot-ai-006 (deleted branch) | AI-generated: git.ts local var rename + comment | 1 file | +1 | evidence/case-006.txt |
| case-007 | wp17-pilot-ai-007 (deleted branch) | AI-generated: evidence.ts unused stub fn | 1 file | +8 | evidence/case-007.txt |
| case-008 | 991ed4c | Docs-only (+452/-5) | 2 files | +452/-5 | evidence/case-008.txt |

## Reproducibility Artifacts

- **reproducibility/pilot-run1-vs-run2.diff** — `node dist/cli.js check --help`, 2 runs, EMPTY (0-line diff), exit 0 both.
- **reproducibility/case-006-run1-vs-run2.diff** — `node dist/cli.js check --verbose`, 2 runs, EMPTY (0-line diff), exit 1 both (WARN gate).
- **Verdict:** deterministic command output across runs.

## Cost Artifacts

- **evidence/cost-notes.txt** — check 0.333s total, evidence 9907 bytes across 8 cases.
- **evidence/downstream-consumer-test.txt** — case-001.txt parsed, length 2029 bytes.

## Observations

1. **CLI Interface:** `node dist/cli.js check --help` exit 0. `node dist/cli.js check --verbose` exit 0 on clean tree (changedFunctions=0, PASS), exit 1 on AI-generated git.ts change (WARN gate, changedFunctions=1), exit 0 on evidence.ts stub (changedFunctions=2).
2. **AI cases (Q4):** both AI-generated changes produced attributable changed-function output without pipeline config changes. case-006 rename+comment → WARN gate; case-007 unused stub → changedFunctions=2 (uncovered function surfaced).
3. **Prod-without-test (Q2):** case-005 commit 480de63 has no test file change; CheckChange flags changed src function (evidence.ts detectNextFramework, later tests in c9b6654).
4. **Docs-only (Q2):** case-008 docs-only commit produced no src changed functions (clean evidence).
5. **Reproducibility:** check --help + check --verbose both deterministic (0-line diffs).
6. **Cost:** ~0.33s per check, evidence small (0.5-2KB/case).
7. **Missing:** high-CRAP/complex-function coverage, multi-repo (Q1 partially met), human review (Q7).

## Outcome Recommendation — FINAL (signed off 2026-09-08) — Q7 CLOSED 2026-09-09; remaining: (a)(c)(d).

**CONTINUE WITH CONSTRAINTS — signed off 2026-09-08** — as in WP16. Core workflow (selection Q2, AI independence Q4, reproducibility Q5, cost Q6) validated with 8 cases. Constraints: (a) Q1 multi-repo target unmet (single repo only), (b) Q7 human review CLOSED 2026-09-09 (8/8 ACCEPTED, commit 3f9b9f8), (c) high-CRAP/complex-function category uncovered, (d) sampling not random/stratified (manual selection only).

**Next Steps:** Q7 done → expand to 12-case target with multi-repo + high-complexity (WP18-2).
