# WP17 Validation Corpus

**Selection Criteria** — FROZEN before any runs (see methodology.md Q1-Q7)

---

## Target: 8–12 Cases Across 2–3 Repositories

| Case ID | Repository | Type | Change Category | Rationale |
|---------|------------|------|-----------------|-----------|
| case-001 | this-repo (code-risk-prototype-v0.3-opencode) | | Behavioral/mechanical feature | commit 388d992 — feat(hardening-b): pnpm patch + dispatch registry + CC bench; 12 files, +499/-228. Largest recent change in git log -20 window |
| case-002 | this-repo | | Fix (low-complexity) | commit 6f26f95 — fix: add shebang to cli for global npm link; 2 files, +2/-1. Small scoped CLI fix |
| case-003 | this-repo | | Test-only | commit c9b6654 — test: Next.js dispatcher 5 + fault 2 (Task3+4); 2 files, +100. Test-only commit for noise check |
| case-004 | this-repo (code-risk-prototype-v0.3-opencode) | Mechanical/Refactoring | Mechanical/refactor | commit 8bd543d — Rename project CheckChange, src/ only CLI usage (8 files, +41/-20). Mechanical rename, no behavior change. |
| case-005 | this-repo (code-risk-prototype-v0.3-opencode) | Production Without Test | Prod-without-test | commit 480de63 — feat: Next.js detector, src/evidence.ts + docs, no test file in same commit (2 files, +37/-6). Behavioral feature, tests added later. |
| case-006 | this-repo (code-risk-prototype-v0.3-opencode) | AI-Generated | AI-generated change; src/git.ts local var rename + comment, branch wp17-pilot-ai-006, check exit 1 WARN gate, deterministic output (0-line diff). |
| case-007 | this-repo (code-risk-prototype-v0.3-opencode) | AI-Generated | AI-generated change; src/evidence.ts unused stub function, branch wp17-pilot-ai-007, check exit 0 PASS gate, 2 changed functions, deterministic output. |
| case-008 | this-repo (code-risk-prototype-v0.3-opencode) | Docs-Only | docs-only | commit 991ed4c — docs simplification (2 files, +452/-5). No src/ or test changes. Low-complexity docs change. |
| case-009 | engram (external) | | Behavioral (prompt change) | commit b2c61cf — feat(reviewer): suppress praise hallucinations in review prompt; 1 file, +15. External TS repo, WARN gate, 31 changedFn. |
| case-010 | this-repo (code-risk-prototype-v0.3-opencode) | | Behavioral/mechanical feature | commit feaa492 — feat: full close pre-Angular limits; 23 files, +1639/-93. Distinct-area fallback (experiments/), PASS gate, 18 changedFn. |
| case-011 | this-repo (code-risk-prototype-v0.3-opencode) | | Behavioral (attribution fix) | commit 3876c1a — feat(wp5.3): attribution correctness fixes; 32 files, +2280/-162. High-CC function touched (CC=28), PASS gate, 3 changedFn. |
| case-012 | this-repo (code-risk-prototype-v0.3-opencode) | | Config/CI only | commit be9f97a — fix(ci): chdir hardcode + lizard install; 4 files, +32/-20. No src/ logic changes, PASS gate, 0 changedFn. |

---

## Repository Candidates (select 2–3)

| Repo | Size | Language(s) | Application Type | Notes | TS/JS Analyzable |
|------|------|-------------|------------------|-------|------------------|
| engram | ~15k LOC | TypeScript | MCP server (reviewer engine) | Separate repo, TS analyzable | YES |
| OICP-MCP | ~8k LOC | Python | MCP server | Python-only, not analyzable by checkchange | NO |
| omlx-review-mcp | ~5k LOC | Python | MCP server | Python-only, not analyzable by checkchange | NO |
| Code-Index-MCP | ~12k LOC | Python | MCP server | Python-only, not analyzable by checkchange | NO |

**Honest gap note:** Only **1 external TypeScript repo (engram)** was analyzable by checkchange. OICP-MCP, omlx-review-mcp, Code-Index-MCP are Python-only. case-010 uses this-repo's experiments/ subarea as distinct-area fallback.

---

## Change Categories to Cover

- [x] Behavioral change (alters observable behavior) — case-001, case-005, case-009, case-010, case-011
- [x] Mechanical/refactoring (no behavior change) — case-004
- [x] Test-only modification — case-003
- [x] Production code without corresponding test change — case-005
- [x] Touches already-complex function (high CRAP/cyclomatic) — case-011 (CC=28)
- [x] Touches low-complexity function — case-002, case-008, case-012
- [x] Historical change (from git history, not current knowledge) — case-001..005, case-008, case-009..012
- [x] AI-generated change (via coding agent) — case-006, case-007
- [x] Human-authored change — case-001..005, case-008, case-009..012

---

## Selection Constraints

1. **No cherry-picking** — Cases not selected because they make CheckChange look good
2. **Criteria recorded first** — Selection criteria documented before any evaluation
3. **Diversity** — Multiple repos, sizes, types, complexity profiles
4. **Reproducibility** — Historical cases reproducible from clean checkout
5. **Independence** — At least some cases processed through AI coding workflow

---

*Populate after methodology.md selection criteria finalized and repositories chosen.*
