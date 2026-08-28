---
task: "WP5.6 — Usefulness, Robustness, Freeze"
created: "2026-08-27T12:05:00Z"
approved: true
tasks:
  - id: "1"
    description: "State reconstruction and baseline verification. Verify current branch (main), test status (143/143 pass), WP5.5 closure (invariants INV-01..04 verified, determinism 5× identical), WP4R evidence frozen. Confirm pipeline modules intact: src/git.ts, src/evidence.ts, src/complexity.ts, src/coverage.ts, src/attribution.ts, src/crapCalc.ts, src/rules.ts, src/cli.ts. No source changes in this task — read-only verification."
    agent: "researcher"
    files: ["src/git.ts", "src/evidence.ts", "src/complexity.ts", "src/coverage.ts", "src/attribution.ts", "src/crapCalc.ts", "src/rules.ts", "src/cli.ts"]
    acceptance: "git branch shows main; npx vitest run reports 143/143 pass; WP5_5_RESULTS.md confirms invariants; no uncommitted source changes"
    depends_on: []
  - id: "2"
    description: "Case selection and documentation. Re-use WP4R 9 cases (h3-01/02/03, hono-01/02/03, apollo-01/02/03) + 2 supplemental (SUP-A normalizeRouteRules, SUP-B processJsonRpcMethod) = 11-case corpus. Justification: WP4R cases already classified by size (small/moderate/non-trivial per changed-function count), SHAs pinned, evidence artifacts preserved. Re-running through corrected pipeline (post-WP5.4 fixes, post-WP5.5 verification) provides clean comparison. SUP-A/B add high-CRAP signal that original 9 lacked. Document case selection criteria BEFORE inspecting outcomes. Record rejected candidates. Create experiments/wp5/wp5.6/case-selection.md with: selection criteria, rejected candidates, classification table, SHAs."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/case-selection.md", "experiments/wp4r-final/WP4R_CLOSURE.md", "experiments/wp4r-final/WP4R_EVIDENCE_MANIFEST.md", "experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md"]
    acceptance: "case-selection.md exists with: 11 cases listed, classification per changed-fn count (SMALL=1, MODERATE=2-3, NON-TRIVIAL=4+), rejected candidates documented, SHAs verified, selection criteria stated before outcome inspection"
    depends_on: ["1"]
  - id: "3"
    description: "Coverage strategy design. Tier 1: full-suite coverage for at least 1 representative case per repo (h3-01 via vitest, hono-02 via vitest, apollo-02 via Jest with narrowed scope since full suite impractical). Tier 2: scoped coverage for remaining cases. Document explicitly what was full vs scoped — never claim full when scoped. Create experiments/wp5/wp5.6/coverage-strategy.md with: per-case coverage command, scope (full/scoped), artifact path, provider (v8/Istanbul/Jest), test scope rationale. Preserve all coverage artifacts with SHA-256 hashes."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/coverage-strategy.md", "experiments/wp4r-final/h3/h3-01/metadata.md", "experiments/wp4r-final/hono/hono-02/metadata.md", "experiments/wp4r-final/apollo-client/apollo-02/metadata.md"]
    acceptance: "coverage-strategy.md exists with per-case coverage command, scope label (full/scoped), artifact path, provider, rationale; no case claims full-suite when scoped"
    depends_on: ["2"]
  - id: "4"
    description: "Execute pipeline verification for all 11 cases. For each case: (1) clone/checkout repo at base/target SHAs, (2) run coverage per strategy, (3) run prototype with --coverage-file pointing to artifact, (4) capture JSON output, (5) verify pipeline stages: Git → Changed functions → Complexity → Coverage → Attribution → CRAP → Threshold → Status → JSON → CLI → Exit. Verify ZERO≠NULL (coverage 0 → analyzerStatus passed, coverage null → skipped), MISSING≠MALFORMED (distinct reason+stderr, same FAILED status), GIT≠REPO (distinct msgs, same exit 1), ANALYZER TRUTHFUL (status from evaluation state). Run at thresholds 30 and 15. Preserve all outputs in experiments/wp5/wp5.6/<case>/ with subdirs: coverage/, output-threshold-30/, output-threshold-15/, exit-code.txt. Create experiments/wp5/wp5.6/pipeline-results.md with per-case table: changed-fn count, CC range, CRAP range, threshold outcomes, completeness, coverage source."
    agent: "implementer"
    files: ["src/git.ts", "src/evidence.ts", "src/coverage.ts", "src/crapCalc.ts", "src/rules.ts", "src/cli.ts"]
    acceptance: "All 11 cases produce JSON outputs at both thresholds; pipeline-results.md has per-case summary table; ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL verified per case; all artifacts preserved with paths"
    depends_on: ["3"]
  - id: "5"
    description: "Human review packet. Create experiments/wp5/wp5.6/human-review-packet.md with per-case section answering: (1) What changed? (diff summary), (2) Which functions affected? (fn names, lines, CC), (3) How complex? (CC values), (4) How well tested? (coverage %), (5) What CRAP risk? (CRAP values at thresholds 30 and 15), (6) Why did system produce this status? (threshold crossing logic), (7) What evidence was missing? (NOT_EVALUATED fns, coverage gaps), (8) Would this affect review behavior? (blank for human reviewer). Include Outcome A (high CRAP = risky change), Outcome B (high CRAP but harmless), Outcome C (low CRAP but risky), Outcome D (coverage unavailable) classification where applicable. Use WP4R human-review-packet.md as template. Leave classification fields blank for human reviewer."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/human-review-packet.md", "experiments/wp4r-final/human-review-packet.md"]
    acceptance: "human-review-packet.md exists with 11 case sections, each answering all 8 questions, classification fields blank for human reviewer, Outcome A/B/C/D examples documented"
    depends_on: ["4"]
  - id: "6"
    description: "Claims/evidence matrix and robustness evaluation. Create experiments/wp5/wp5.6/claims-evidence-matrix.md with: | Claim | Evidence | Confidence | Limitation | rows for: changed-function identification, coverage attribution, CRAP determinism, output explainability, signal usefulness. Confidence tied to actual sample (9 cases ≠ universal claims — use Medium/Low for signal usefulness). Create experiments/wp5/wp5.6/robustness-evaluation.md with test results for: repeated execution (5× identical JSON), zero coverage, missing coverage, malformed coverage, partial coverage, multiple changed functions, unusual paths, monorepo handling, large coverage artifacts. Document which robustness tests pass/fail/unsupported. Create experiments/wp5/wp5.6/limitations.md listing: TypeScript/JavaScript focus, coverage-provider assumptions, repository structure assumptions, test-run assumptions, attribution limitations, small experimental sample (11 cases), CRAP inherent limitations, inability to measure non-CC/coverage risks, scoped test limitations, generated-code complications."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/claims-evidence-matrix.md", "experiments/wp5/wp5.6/robustness-evaluation.md", "experiments/wp5/wp5.6/limitations.md"]
    acceptance: "All 3 docs exist; claims/evidence matrix has 5 rows with confidence matching sample size; robustness-evaluation.md documents results for all 9 robustness questions; limitations.md lists all expected limitations"
    depends_on: ["4"]
  - id: "7"
    description: "Reproducibility record and freeze checklist. Create experiments/wp5/wp5.6/reproducibility-record.md with per-case: repo, base/target SHA, engine commit, Node version, coverage command, artifact hash, analysis command, threshold, changed-function method, test scope, result, expected vs observed. Create experiments/wp5/wp5.6/freeze-checklist.md with: source frozen, tests frozen, contracts frozen (failure-semantics-contract.md, diagnostic-matrix.md), methodology frozen, thresholds frozen (30 default, 15 supplemental), experiment results frozen, limitations documented, reproducibility instructions documented. Verify regression suite green (143/143) before marking freeze items as satisfied."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/reproducibility-record.md", "experiments/wp5/wp5.6/freeze-checklist.md", "experiments/wp5/wp5.4/failure-semantics-contract.md", "experiments/wp5/wp5.4/diagnostic-matrix.md"]
    acceptance: "reproducibility-record.md has 11 case entries with all required fields; freeze-checklist.md has all items checked; regression suite verified green"
    depends_on: ["4"]
  - id: "8"
    description: "WP5.6 closure document and exit gate. Create experiments/wp5/wp5.6/WP5_6_CLOSURE.md summarizing: objective (usefulness + robustness + freeze), corpus (11 cases), key findings (which outcomes observed: A/B/C/D), usefulness conclusion (evidence useful for X under conditions Y, limitations Z), robustness conclusion (which boundaries reliable), freeze declaration (source, tests, contracts, methodology, thresholds, results, limitations, reproducibility), exit gate checklist (usefulness experiment complete, robustness complete, human-review packet complete, matrix complete, limitations documented, regression green, reproducibility documented, methodology documented). Include handoff document for WP6: current state, what is frozen, what is proven, what is not proven, known defects, known limitations, experimental results, current architecture, current contract, open decisions, next authorized work, next gate."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/WP5_6_CLOSURE.md"]
    acceptance: "WP5_6_CLOSURE.md exists with all required sections; exit gate checklist all items satisfied; handoff document complete for WP6"
    depends_on: ["5", "6", "7"]
---
```

## WP5.6 Plan — Usefulness, Robustness, Freeze

### State Reconstruction (pre-plan)
- **Branch:** main
- **Tests:** 143/143 pass (53 files, ~4.6s)
- **WP5.5:** CLOSED via CONTINUE. Invariants INV-01..04 verified. Determinism 5× identical. F-01 FIXED, F-02 hardened.
- **WP4R:** 9-case baseline (h3-01/02/03, hono-01/02/03, apollo-01/02/03) + 2 supplemental (SUP-A, SUP-B). Frozen.
- **Pipeline:** Git → Changed intervals → Complexity → Coverage → Attribution → CRAP → Threshold → Status → JSON → CLI → Exit
- **Methodology:** No silent changes. Preservation of original results required.

### Case Design Decision
**11-case corpus: Re-use WP4R 9 + 2 supplemental.**
- WP4R cases already classified by changed-function count (SMALL=1, MODERATE=2-3, NON-TRIVIAL=4+)
- SHAs pinned, evidence artifacts preserved, human review packet ready
- Re-running through corrected pipeline (post-WP5.4, post-WP5.5) provides clean comparison
- SUP-A/B fill high-CRAP gap (CRAP=36, CRAP≈28.94) that original 9 lacked
- Fresh selection would introduce bias risk and duplicate work
- Case selection criteria documented BEFORE outcome inspection per Roadmap discipline

### Coverage Strategy
- **Tier 1 (full suite):** h3-01 (vitest), hono-02 (vitest), apollo-02 (Jest narrowed scope — full suite impractical for apollo-client)
- **Tier 2 (scoped):** Remaining 8 cases
- Explicitly document scope per case. Never claim full-suite when scoped.

### Pipeline Verification Per Case
Each case verified through: Git diff → Changed functions → Complexity → Coverage acquisition → Attribution → CRAP calculation → Threshold evaluation → Status assignment → JSON output → CLI execution → Exit code. Invariants ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL checked per case.

### Non-Goals
- No threshold tuning (threshold 30 remains default; threshold 15 tested but not adopted)
- No language expansion (TypeScript/JavaScript only)
- No test orchestration (caller/CI owns coverage generation)
- No LLM judgment in deterministic pipeline

### Exit Gate (per Roadmap)
- [ ] Usefulness experiment complete
- [ ] Robustness evaluation complete
- [ ] Human-review packet complete
- [ ] Claims/evidence matrix complete
- [ ] Limitations documented
- [ ] Regression suite green (143/143)
- [ ] Reproducibility documented
- [ ] Methodology documented
- [ ] Prototype frozen
