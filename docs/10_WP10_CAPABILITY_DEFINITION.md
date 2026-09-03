# WP10 Capability and Product Definition

**Date:** 2026-08-30  
**Status:** WP10 Tasks 1–4 complete (doc-only, no src changes)  
**Engine baseline:** commit 2972e5e + staged docs (WP9 R8), 178/178 tests pass, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved, Node 24.18.1  
**WP9 closure reference:** `experiments/wp9-hardening-round8/WP9_CLOSURE_RECORD.md` (human gate passed per CONTINUE 2026-08-30), `experiments/wp9-hardening-round8/wp9-cumulative-closure-assessment-through-round8.md` (cumulative assessment)

---

## 1. Problem Statement (T1)

What decision the system improves: **change-risk triage at review/CI time**.

The deterministic engine consumes caller-provided evidence (git diff, complexity via crap-typescript, Istanbul JSON coverage) and produces function-level CRAP scores with PASS/WARN gate outcomes. It separates **deterministic evidence** (facts: CC, coverage, CRAP, threshold comparison) from **judgment** (whether a WARN merits action, prioritization, test investment). The engine makes no autonomous risk judgment, no defect prediction, and does not replace human review.

Source: `docs/01_REVISED_PROJECT_THESIS.md` (core boundary: "consumes analysis, does not perform analysis"), `docs/02_SCOPE_AND_GUARDRAILS.md` (hard guardrail: "do not build an analysis engine"), `Post_WP9_Detailed_Roadmap.md` §14.1 evidence-before-inference chain.

---

## 2. Target User / Use Case (T1)

| User | Need |
|------|------|
| Solo developer | Local pre-push check: "did I introduce high-CRAP changes?" |
| Team reviewer | PR review aid: prioritize functions with high CC + low coverage |
| CI gate operator | Automated gate: exit 1 on WARN, exit 0 on PASS, machine-readable JSON for downstream |
| Engram auditor | Independent deterministic evidence to cross-check LLM reasoning |

**Smallest useful workflow:**

```
PR → git diff → run tests → generate Istanbul JSON coverage (caller-owned)
    → deterministic engine (checkchange check [--base <ref>] --json --coverage-file <path>)
    → JSON/CLI output → CI gate (exit code) + reviewer report
    → human/LLM interprets evidence (CC, coverage, CRAP, PASS/WARN)
```

> `--base` is optional — auto-detects fallback: origin/HEAD → origin/master/main → master/main. If omitted, engine resolves base automatically.

**Evidence in (caller provides):**
- Git baseline/target refs
- Istanbul JSON coverage artifact (v8, babel, or Jest v8 format)
- CRAP threshold (default 30, CC threshold 15)
- Repository path (cwd)

**Evidence out (engine calculates):**
- Changed functions with: file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, source
- Rule results: PASS/WARN/FAIL/NOT_EVALUATED per function with crap, threshold, cc, coverage
- Gate: PASS | WARN | null
- Completeness: COMPLETE | INCOMPLETE | NOT_APPLICABLE
- Analysis status: SUCCESS | FAILED | UNSUPPORTED
- Provenance: commit SHAs, artifact sizes, engine version, config

**What caller must configure:**
- Jest coverage: `--coverageReporters=json` (Rush rig default is cobertura/html only → needs `jest.custom.json` override, per WP9 R6/R7)
- Vitest: `--coverage.provider=v8`
- ts-jest: `--coverageProvider=babel --coverageReporters=json`
- Engine only reads existing coverage artifact; caller owns generation (~4.96s burden, per `threshold-guidance.md` §3)

Source: `docs/contracts/evidence-contract.md` (pipeline steps 1–12, CLI contract), `WP9_CLOSURE_RECORD.md` (R6/R7 Rush jest.custom.json), `Post_WP9_Detailed_Roadmap.md` §7 canonical workflow.

---

## 3. Evidence Consumed vs Produced + Refusals (T1)

### Consumed (input contract)
- Git change intervals (changed files → function intervals via complexity analyzer)
- Cyclomatic complexity via `@barney-media/crap-typescript-core@0.5.0` (TS only)
- Istanbul JSON coverage (caller-owned): statementMap, fnMap, branchMap
- File paths (relative from repo root)
- Provenance: base/target SHAs, repository identity, revision
- Config: crapThreshold (default 30), coverage file path

### Produced (output contract, schema 0.2)
```typescript
interface EvidenceOutput {
  analysis: { base: string; target: string };
  capabilities: { git, complexity, coverageArtifact, crapTypescript?: 'available'|'unavailable'|'failed' };
  changedFunctions: { file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, source }[];
  policy: { crapThreshold: number };
  ruleResults: { ruleId, result: 'PASS'|'WARN'|'FAIL'|'NOT_EVALUATED', file, method, crap, threshold, cc, coverage }[];
  analysisStatus: 'SUCCESS'|'FAILED'|'UNSUPPORTED';
  gate: 'PASS'|'WARN'|null;
  completeness: 'COMPLETE'|'INCOMPLETE'|'NOT_APPLICABLE';
  coverageErrorReason?: 'missing'|'malformed';
}
```

### Explicit Refusals (engine does NOT infer)
- ❌ Defect prediction or causal CRAP→defect relationship
- ❌ Autonomous risk judgment (engine produces evidence, not judgment)
- ❌ Replacement of human review
- ❌ Universal language support (TS-only validated)
- ❌ Universal coverage-provider compatibility (Istanbul JSON family only, n=3)
- ❌ Universal monorepo architecture support (1 Rush repo validated)
- ❌ Historical per-commit coverage claim (R8 reused Round 7 union — coverage delta NOT historical)
- ❌ Overall project-risk score / composite scoring
- ❌ Real-time IDE integration, auto test generation, LLM classification, ML prediction
- ❌ Dashboards, cloud hosting, telemetry

Source: `docs/contracts/evidence-contract.md` (invariants INV-01..04, unsupported conditions), `WP9_CLOSURE_RECORD.md` §Known Limitations, `Post_WP9_Detailed_Roadmap.md` §19.

---

## 4. Supported-Claim Matrix (T2)

Narrowed from WP9 C1–C24 cumulative assessment (§3, §16, §17) to product-scoped claims.

| # | Claim | Evidence | Scoped Boundary | Limitation |
|---|-------|----------|-----------------|------------|
| C1 | Deterministic changed-function detection (git diff → intervals) | Real repos: defu, ts-jest, tsdoc (subset+full+histo), real-git tests; 178 tests | TS, git CLI, Node 24.18.1 | Single Git implementation (git CLI), no libgit2 |
| C2 | Git historical analysis (base→target diff) | Bases across 3 external repos + invalid/ENOENT distinct | Commit SHA bases | Branch refs only via CLI unit |
| C3 | Complexity measurement (CC via crap-typescript) | CC consistent across rounds (plugin 5/6, getRoot 12, _defu 14, isPlainObject 8) | TS-only, @barney-media/crap-typescript-core@0.5.0 | No other language |
| C4 | Coverage ingestion (Istanbul JSON caller-owned) | 4 fresh artifacts 12K–1.62M, v8 + babel/Istanbul | Caller emits json; Rush needs jest.custom.json | Documented caller burden |
| C5 | Coverage attribution (suffix + normalizeCoveragePaths) | EndsWith isolates eslint-plugin/src/index.ts among 64 entries (R7), rebases 3→64 keys | Validated at 1.6M scale | Ambiguous suffix collision not tested |
| C6 | Zero-coverage semantics (ZERO≠NULL, INV-01) | parseCliArgs null→54, helpers null, 00203d4 10 skipped vs 1 measured | INV-01 logic in evidence.ts/coverage.ts | True 0% vs unmeasured not artifact-tested at scale |
| C7 | Unavailable/missing/malformed (MISSING≠MALFORMED, INV-02) | coverageErrorReason distinct, CLI tests for both | WP5.5 + R1–8 | Historical always had available coverage |
| C8 | CRAP deterministic (CC²×(1-cov)³+CC) | Same inputs → same outputs R6 subset vs R7 full union identical (116.97/18.34) | Threshold is policy, branch coverage kind | No |
| C9 | Threshold evaluation (30/15 frozen) | evidence-contract.md:38 + rules.ts default 30, all addenda frozen | Single threshold value tested | Tuning not engine change |
| C10 | PASS/WARN behavior + gate | Gate PASS (defu, ts-jest) vs WARN (tsdoc getRoot 116), PASS→WARN delta R8 | Only PASS/WARN observed in hardening | No FAIL path (provider error only) |
| C11 | Incomplete evidence (COMPLETE vs INCOMPLETE) | 00203d4 INCOMPLETE (11 funcs, 10 no coverage) vs e11ec0b COMPLETE | INCOMPLETE due to missing configs not probed | No |
| C12 | Truthful statuses (INV-04 analyzer truthful) | analyzerStatus passed/skipped/failed per function; capabilities truthful; real-git 4 cases | No failed-complexity case in hardening | No |
| C13 | Machine-readable evidence (schema 0.2 frozen) | All engine JSON schemaVersion 0.2, validated R2,5,6,7,8 | Schema not version-bumped, F-03 additive | No |
| C14 | Evidence API (CLI check --json --coverage-file) | CLI unit+integration+real-git 25+4 tests, all repos | Single CLI entrypoint | No service/DB |
| C15 | CI gate (exit codes) | Exit 0 PASS / 1 WARN verified in integration + real-git | Local only, no CI runner matrix | Acceptable |
| C16 | Reproducibility | repro.md each round, 178 deterministic offline tests | Historical Rush coverage needs Node 20.9 | Env dependency documented |
| C17 | Multiple repositories | 3 external + this repo | n=3 small statistically | Claim scoped: "validated across tested repos" |
| C18 | Multiple coverage/test envs | v8 + babel + Jest v8 (n=3), vitest+Jest (2 frameworks), 12K–1.62M | Istanbul JSON family only | R8 reuse not counted as new |
| C19 | Monorepo behavior | R7 full union 1.62M 64 entries vs subset 29K 3 entries same results | 1 monorepo (tsdoc Rush), 1 diff | Not universal; claim scoped |
| C20 | Historical/delta behavior | R8 2-point complexity delta real (plugin 5→6, +getRoot 12), gate PASS→WARN | Coverage reused → NOT per-commit | Partial — historical coverage not validated |
| C21 | Provider diversity (distinct artifact formats) | 3 Istanbul JSON variants (2 v8 + 1 babel) | All Istanbul-family | Not lcov/cobertura |
| C22 | Language diversity | TS-only throughout | Engine evidence layer partially language-neutral | Deferred to WP10 |
| C23 | Scalability (artifact size) | 12K → 1.62M (55×) handled without attribution break | Upper bound not probed beyond 1.62M | Acceptable |
| C24 | Provenance / traceability | Every report: engine commit, Node, SHAs, artifact sizes, repro steps, plan paths | Graphify labels stale by staged docs | Minor |

Source: `wp9-cumulative-closure-assessment-through-round8.md` §3 (C1–C24 table), §16 (closure test), §17 (boundary of claims).

---

## 5. Non-Goals (T2)

What the product does NOT claim to do (per `Post_WP9_Detailed_Roadmap.md` §19):

- Universal language support
- Every coverage provider
- Every CI provider
- Every monorepo architecture
- Full historical analysis (per-commit coverage)
- Real-time IDE integration
- Automated test generation
- LLM-based risk classification
- Machine-learning risk prediction
- Overall project-risk score
- Enterprise dashboards
- Cloud-hosted analysis
- Telemetry

Each requires a concrete use case and evidence-based justification.

Source: `Post_WP9_Detailed_Roadmap.md` §19, `WP9_CLOSURE_RECORD.md` §Unsupported Claims.

---

## 6. Success Metrics (T3)

How to measure value (observable before building, per `Post_WP9_Detailed_Roadmap.md` §3 strategic shift):

| Metric | How to Measure | WP9 Baseline |
|--------|----------------|--------------|
| **Integration cost** | Setup steps, path handling complexity, artifact size burden | 4.96s caller-owned coverage generation; Rush needs jest.custom.json; F-03 normalize rebases absolute paths |
| **Developer experience** | Comprehension (can user explain output?), trust (deterministic?), willingness to run | 178 deterministic tests, schema 0.2 frozen, truthful statuses |
| **Review usefulness** | Does WARN prioritize correctly vs manual review? False-positive burden? False-negative blind spots per threshold-guidance? Review time delta? Tests added? | 5 FN blind spots documented in `threshold-guidance.md`; 8 WP4R samples EXPECTED_PASS; no independent human study |
| **Runtime cost** | Engine execution time (excl. coverage generation) | ~3.62s full suite; engine itself sub-second |
| **Operational reliability** | Failure modes, reproducibility, CI portability | 178/178 pass; historical Rush needs Node 20.9 (env limitation) |
| **Reproducibility** | Same inputs → same outputs across environments | Deterministic offline; historical blocked by Node/Rush |
| **Explainability** | Shows ingredients: CC, coverage, CRAP, threshold | Output includes all: `CRAP = 116.97, Complexity = 12, Coverage = 10%` |

Source: `Post_WP9_Detailed_Roadmap.md` §3 (measure: integration cost, DX, review usefulness, FP burden, FN limitations, runtime, reliability, compatibility, explainability, decision impact), §14.3 (show ingredients).

---

## 7. Product-Shape Decision A/B/C (T3)

### A. Standalone deterministic risk engine
```
Git change → Evidence generation → Deterministic CRAP engine → JSON / CLI / CI gate
```
**Pros:** Simple boundary, independently useful, easy to integrate, clean deterministic contract.  
**Cons:** May become isolated tool; usefulness limited if not integrated into review workflows.  
**WP9 evidence:** Provider n=3 validates standalone operation; monorepo 55× works; but integration burden remains (caller-owned coverage, path normalization, jest.custom.json friction).

### B. Engram capability
```
Coding LLM → Engram → (deterministic evidence + LLM reasoning) → Human
```
**Pros:** Strong evidence/interpretation separation; fits Engram architecture.  
**Cons:** Couples to Engram; premature product architecture; unclear boundaries between evidence and interpretation.  
**WP9 evidence:** Engine evidence layer is language-neutral at contract level; Engram integration not yet validated.

### C. Both: Standalone with Engram adapter
**Pros:** Deterministic component independently testable; Engram can consume via adapter.  
**Cons:** Requires maintaining two interfaces; Engram integration not yet proven valuable.

### Recommendation: **Prefer C as long-term, but A as immediate next**

**Evidence-backed rationale:**
- Provider n=3 (2 v8 + 1 babel) validates standalone engine across tested conditions
- Monorepo 55× scale (1.62M 64 entries) works under tested Rush scenario
- R8 historical coverage partial → historical not a product promise yet
- Threshold 30/15 stable across 8 rounds
- Caller-owned burden (4.96s, path rebasing, jest.custom.json) is the immediate UX blocker — not language/history
- Engram integration unvalidated; coupling premature per `Post_WP9_Detailed_Roadmap.md` §21 final strategic view (keep boundaries explicit)

Source: `Post_WP9_Detailed_Roadmap.md` §4 (candidate forms A/B/C), §14.1 (evidence before inference), §17 (claim boundary), `WP9_CLOSURE_RECORD.md` (n=3, monorepo 55×, R8 partial, threshold stable).

---

## 8. Prioritized Research Questions (T4)

From WP9 limitations (§5, §13) and forks (§5, §17):

| # | Question | Uncertainty | Evidence Needed | If Positive | If Negative | Minimal Experiment |
|---|----------|-------------|-----------------|-------------|-------------|-------------------|
| RQ1 | Can CI reliably feed evidence? | Integration burden (4.96s, path rebasing, jest.custom.json) is the main UX blocker | Measure setup steps, artifact handling, path mapping failures in real CI (GitHub Actions) | Proceed to WP11/12 production contract + integration validation | Fix caller-side first; don't change engine | WP11/12: Define input/output contract → validate in 2 real CI pipelines |
| RQ2 | Is TS sufficient for target users? | Language breadth strategic value unknown | Survey target users; attempt JS/Python adapter prototype | WP13 language expansion | Keep TS-only; defer | WP13: Build one JS adapter (crap-js) + validate on 1 repo |
| RQ3 | Is historical per-commit coverage required? | R8 partial (complexity real, coverage reused); historical deferred per prioritization | Fresh per-commit coverage in compatible env (Node 20.9) | WP14 historical/delta capability | Accept partial; scope claims to complexity-only history | WP14: Rerun R8 with Node 20.9 + fresh heft coverage (see §14 of closure assessment) |
| RQ4 | Do reviewers value WARN signal? | No independent human-usefulness evidence beyond 8 WP4R samples | Controlled reviewer study: WARN vs manual prioritization, FP burden, review time, tests added | Productize with confidence | Investigate presentation/workflow before changing metric | WP15: Human review packet with 10+ real PRs, measure decisions |
| RQ5 | Does monorepo attribution generalize? | 1 Rush repo, 1 diff, no suffix collision tested | Second monorepo (pnpm/Nx) with collision test (two src/index.ts) | Broaden monorepo claim | Keep claim scoped to tested scenario | WP11/12 integration: validate on 1 more monorepo |
| RQ6 | Can provider format expand beyond Istanbul JSON? | Contract is Istanbul JSON; lcov/cobertura unsupported | Test c8/nyc lcov→json conversion or another Jest preset | Add adapter layer | Keep contract narrow | WP11: Define adapter boundary in contract |

Source: `Post_WP9_Detailed_Roadmap.md` §5 (forks), §13 (future evidence), §15 (value-of-information), `wp9-cumulative-closure-assessment-through-round8.md` §5 (material uncertainties), §10 (provider diversity), §11 (monorepo), §12 (language).

---

## 9. Provisional Next Branch (T4)

**Decision tree per `Post_WP9_Detailed_Roadmap.md` §5, §17, §22:**

```
WP9 CLOSED
    |
    v
WP10 Definition
    |
    +-- Integration biggest gap? → WP11/12 (production contract + real integration validation)
    |
    +-- Historical/delta required? → WP14 (Node 20.9 fresh historical coverage rerun)
    |
    +-- Language strategic? → WP13 (JS/Python adapter)
    |
    +-- Usefulness uncertain? → WP15 (human review study)
    |
    +-- None compelling? → Narrow/stop per §5 Fork E
```

### Highest-Priority Next: **WP11/12 — Integration Validation**

**Rationale:** The immediate UX blocker is **caller-owned coverage burden** (4.96s, path rebasing via F-03, jest.custom.json friction for Rush/Heft), not language breadth or historical coverage. WP9 demonstrated the engine works deterministically; the gap is whether CI systems can reliably feed it evidence and consume output.

**Evidence from WP9:**
- Operational delta: 4.96s coverage generation burden unchanged (`threshold-guidance.md` §3)
- Rush rig default cobertura/html → requires `jest.custom.json` override (R6/R7)
- Path normalization rebases 64 absolute keys (F-03 validated at scale)
- CI gate logic proven locally (exit 0/1), but no CI runner matrix tested
- `Post_WP9_Detailed_Roadmap.md` §7: "engine may be deterministic while evidence-generation environment is not. WP12 should measure the integration boundary"

**Next step:** Define stable input/output contract (WP11) → validate in 2 real CI pipelines (WP12) → measure setup complexity, failure modes, evidence completeness, developer comprehension, CI cost, reproducibility.

If integration proves reliable → proceed toward real-world validation (WP15). If fragile → diagnose caller-side vs engine contract vs provider format before any engine change.

Source: `Post_WP9_Detailed_Roadmap.md` §5 Fork A, §7, §18 (recommended priority: WP11/12 for integration), `wp9-cumulative-closure-assessment-through-round8.md` §13 (value-of-information: H1 low for closure, integration highest value), `WP9_CLOSURE_RECORD.md` §Known Limitations #5.
