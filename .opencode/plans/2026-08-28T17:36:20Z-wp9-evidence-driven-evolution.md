---
task: "WP9 — Evidence-Driven Evolution (CONTINUE WITH CONSTRAINTS)"
created: "2026-08-28T17:36:20Z"
approved: true
tasks:
  - id: "1"
    description: "Prioritize evolution candidates using WP8 evidence: produce prioritization table with USER VALUE, EVIDENCE, COST, RISK, VALIDATION, STRATEGIC FIT; label hypothesis items deferred"
    agent: "researcher"
    files: ["experiments/wp9/prioritization.md"]
    acceptance: "Table with 6 columns for each candidate (covering attribution gap, external validation, threshold/ blind spots, monorepo, coverage burden, security etc); hypothesis items explicitly labeled hypothesis/deferred; evidence-backed items map to WP8 findings"
    depends_on: []
  - id: "2"
    description: "Constrained fix for CLI attribution gap: diagnose why parseCliArgs (CC23) and main (CC12) show crap:null despite coverage, implement minimal rebasing/attribution fix preserving INV-01..04 and contract 0.2.0"
    agent: "implementer"
    files: ["src/coverage.ts", "src/evidence.ts", "src/attribution.ts"]
    acceptance: "When coverage exists, parseCliArgs/main receive non-null CRAP; existing 149 tests still pass plus new red-green tests; no CRAP formula or threshold change; no new DB/service/language; reversible via single-function removal"
    depends_on: ["1"]
  - id: "3"
    description: "Minimal external validation pilot: clone ONE small external TS repo under /tmp, generate coverage, run engine, record evidence JSON + repro notes; if network unavailable document fallback"
    agent: "implementer"
    files: ["experiments/wp9/evidence/external-pilot.json", "experiments/wp9/repro.md"]
    acceptance: "One external pilot attempted with repro log (repo, commit, coverage cmd, engine cmd, artifact size, exit code) or documented fallback justification; evidence JSON valid per contract 0.2.0"
    depends_on: ["2"]
  - id: "4"
    description: "Threshold & blind-spot guidance: document threshold sensitivity (30 vs near-threshold flips) and FN blind spots handling via complementary tools"
    agent: "documenter"
    files: ["experiments/wp9/threshold-guidance.md"]
    acceptance: "Guidance doc with WP8 case examples (CRAP 9,10 vs 30), table of 5 FN blind spots + mitigations, no CRAP math change, limitations updated"
    depends_on: ["1"]
  - id: "5"
    description: "Verification + WP9 report: run full suite (vitest, tsc, build), verify INV-01..04 and contract frozen, compile wp9-report.md with evidence summary, claims/evidence matrix update, and gate proposal"
    agent: "documenter"
    files: ["experiments/wp9/wp9-report.md", "experiments/wp9/repro.md"]
    acceptance: "149+ new tests pass, tsc clean, build ok, WP8 baseline preserved, report ends with PROPOSAL awaiting human review (CONTINUE/STOP/CONSTRAINED), no silent methodology change, confidence capped Low/Medium"
    depends_on: ["2", "3", "4"]
---

# WP9 — Evidence-Driven Evolution (CONTINUE WITH CONSTRAINTS)

Source plan: docs/superpowers/plans/2026-08-28-wp9-evidence-driven-evolution.md (251 lines) — adapted to required .opencode/plans format.

Constraints: Preserve CRAP formula, contract 0.2.0 frozen, INV-01..04 (ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL), no new languages/DB/service, reversible via git revert, no silent methodology changes, confidence Low/Medium given n small.

Evidence justification: WP8 CONTINUE WITH CONSTRAINTS — reliability strong but external diversity limited (local fallback n=4+1), zero FP, FN blind spots documented, friction = caller-owned coverage burden + attribution gap.

Tasks 5, depends_on ensures prioritization before fix, fix before external pilot, docs parallel where possible, final report after all.
