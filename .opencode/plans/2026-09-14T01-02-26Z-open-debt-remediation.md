---
task: "Open debt remediation — verbose-drain test, console→trace, @ts-nocheck, cache criteria, gpg note, stray backup"
created: "2026-09-14T01:02:26Z"
approved: true
repo_conventions:
  gate: "npx tsc --noEmit && npm test"
  entry_points: ["src/cli.ts"]
  review_hook: "engram_review_delta"
  graph_tool: "graphify query"
risks:
  - { risk: "T3 trace unification breaks CLI UX exit codes (src/cli.ts:125-145)", mitigation: "Preserve direct console.warn/error when trace undefined; only buffer when trace in scope", signal: "gate: tsc+test pass; manual runTrace smoke" }
  - { risk: "T4 @ts-nocheck removal reveals widespread type errors in 442-line evidence.ts", mitigation: "Spike isolated; if not clean, restore + rationale comment — no silent degradation", signal: "gate: tsc --noEmit passes either way" }
  - { risk: "T1 stray backup deletion misses hidden import", mitigation: "rg cli.ts.backup across src/ test/ package.json before delete", signal: "grep verification step in acceptance" }
  - { risk: "T5 cache default-on flip premature without field data", mitigation: "GATED — no src/ change; criteria doc only", signal: "acceptance: docs-only, no gate run" }
guardrails:
  - "no gate changes (tsc + vitest run unchanged)"
  - "no EvidenceOutput shape change (diagnostics optional additive only)"
  - "determinism preserved (timestamps excluded, fingerprints SHA-256 stable)"
  - "no new dependencies"
  - "seam composition at owning layer — no entry-point wiring"
max_rounds: 3
tasks:
  - id: "1"
    description: "Delete stray src/cli.ts.backup artifact (4853 bytes, Sep 2); verify untracked + no imports"
    agent: "implementer"
    files: ["src/cli.ts.backup"]
    seam: "none (cleanup only — no src/ logic change)"
    acceptance: "file gone; rg 'cli.ts.backup' src/ test/ package.json returns 0 hits; npx tsc --noEmit passes; npm test passes (379 green)"
    impact: "consumers: none; interface diff: none; migration: none"
    open_questions: "none — verified untracked via git status; no imports per rg"
    depends_on: []
  - id: "2"
    description: "Add verbose-drain test asserting warnings buffered in cacheWarnings[] and drained only under --verbose + reset per registration"
    agent: "tester"
    files: ["test/cache-verbose.spec.ts"]
    seam: "src/cache.ts registerCachedProviders() — cacheWarnings buffer at :309-314, :337 push, :390 drain, :399 reset; src/cli.ts:204-206 drain under --verbose"
    acceptance: "vitest run test/cache-verbose.spec.ts PASS; full suite npm test PASS (379+); test asserts: (a) warning pushed to buffer on cache miss, (b) warning NOT printed without --verbose, (c) warning printed WITH --verbose, (d) buffer reset to 0 after registration"
    impact: "consumers: none (test-only); interface diff: +test file; migration: none"
    open_questions: "none — buffer/drain logic already implemented, test only"
    depends_on: []
  - id: "3"
    description: "Unify console.warn/error in complexity.ts:73 and coverage.ts:322 into TraceRun buffer when trace in scope; fallback to console when no trace"
    agent: "implementer"
    files: ["src/execute.ts", "src/complexity.ts", "src/coverage.ts"]
    seam: "src/execute.ts:18 execute() + TraceRun class :26 — add warnings: TraceWarning[] + recordWarning(); src/complexity.ts:73 + src/coverage.ts:322 call trace?.recordWarning() else console.warn/error"
    acceptance: "npx tsc --noEmit passes; npm test passes; runTrace sidecar includes warnings spans; without trace, CLI UX unchanged (exit codes src/cli.ts:125-145 preserved); complexity/coverage warn messages identical"
    impact: "consumers: runTrace (sidecar richer); complexity/coverage callers (trace optional param); interface diff: TraceRun +warnings[] +recordWarning(); migration: none (opt-in trace)"
    open_questions: "none — Option A chosen: TraceRun owns buffer, call-site check trace?.recordWarning()"
    depends_on: []
  - id: "4"
    description: "Spike: attempt @ts-nocheck removal from src/evidence.ts:1; if tsc --noEmit clean → keep removed; else restore + ADR-style rationale comment"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts:1 // @ts-nocheck — entire file (442 lines); contract FROZEN at 0.5.0 (docs/contracts/evidence-contract.md:5)"
    acceptance: "npx tsc --noEmit passes either way; decision recorded in plan appendix (kept/removed + rationale if kept); npm test passes (no behavior change)"
    impact: "consumers: none (internal types); interface diff: none; migration: none"
    open_questions: "none — spike isolates risk; large file may have pre-existing type gaps"
    depends_on: []
  - id: "5"
    description: "Define field-data criteria for cache default-on flip (hit rate, warm saving, determinism thresholds) — GATED: no src/ change"
    agent: "documenter"
    files: ["docs/decisions/cache-default-on-criteria.md"]
    seam: "none (docs-only); src/cli.ts:37 let cache=false, :195 Default OFF, :197 CHECKCHANGE_CACHE=1 env gating"
    acceptance: "File created with: (a) metrics to collect (hit rate %, warm/cold latency ratio, determinism diff bytes), (b) thresholds for flip (e.g., hit rate >80%, warm p50 <0.8x cold, diff=0), (c) data collection method, (d) rollback trigger; no src/ edits; npx tsc --noEmit passes; npm test passes"
    impact: "consumers: future cache-on decision; interface diff: +doc file; migration: none"
    open_questions: "none — criteria defined in doc, flip remains manual gated decision"
    depends_on: []
  - id: "6"
    description: "Record gpg signing status (tool unavailable → commits unsigned) in master plan Session Log/Blockers"
    agent: "documenter"
    files: ["docs/Project Master Plans/checkchange-master-plan.md"]
    seam: "none (docs-only append to existing Session Log at file:185-186)"
    acceptance: "Master plan updated: Blockers column explicitly includes 'gpg signing unavailable → commits unsigned'; Next Steps unchanged; npx tsc --noEmit passes; npm test passes"
    impact: "consumers: release process; interface diff: +doc line; migration: none"
    open_questions: "none — already tracked, just make explicit"
    depends_on: []
  - id: "7"
    description: "Universal update of using-checkchange SKILL.md to app reality: schemaVersion 0.5 + diagnostics{lineage,quality,fingerprints} optional; analysisStatus SUCCESS|FAILED|UNSUPPORTED; coverageArtifact available|absent|failed; subcommands check|doctor|explain|trace|delta; --cache opt-in default off (+CHECKCHANGE_CACHE=1); --format github|junit|sarif; threshold default 30; exit codes FAILED->1, SUCCESS+WARN->1, UNSUPPORTED+NOT_APPLICABLE->0; hermetic coverage note (malformed artifact -> FAILED gate null); Returns JSON updated with schemaVersion/diagnostics/correlationId trace sidecar shape"
    agent: "documenter"
    files: ["/Users/victorpetropoulos/.config/opencode/skills/using-checkchange/SKILL.md"]
    seam: "none (docs-only, global skill, outside repo)"
    acceptance: "SKILL.md Returns + Quick Reference + Implementation + Dealing With Feedback reflect all above; no repo files touched; skill file diff reviewed"
    impact: "consumers: agent users of checkchange skill; interface diff: +skill doc; migration: none"
    open_questions: "none — reflects implemented CLI behavior per orchestrator read"
    depends_on: []

## Appendix: T4 Decision Record — @ts-nocheck in src/evidence.ts

**Decision: KEEP** (2026-09-13, implementer spike)

Spike removed `// @ts-nocheck` from src/evidence.ts:1 and ran `npx tsc --noEmit`:
**34 pre-existing type errors** (grep -c "error TS" = 34), including:
- implicit-any params (correlate/base/intervals/cwd/filePath)
- missing index signature on extension-map literal (evidence.ts:581)
- `diagnostics.fingerprints` optional-vs-required mismatch in generic intersection (evidence.ts:190)
- provenance-object property narrowing gaps on `{}` (evidence.ts:274-281)

Per task spec: errors found → restore `@ts-nocheck` + ADR-style rationale comment at top of
src/evidence.ts (added 10 comment lines). Rationale: EvidenceOutput contract FROZEN 0.5.0
(docs/contracts/evidence-contract.md:5); 713-line builder; typing internals = separate task,
risks behavior change.

Gate: `npx tsc --noEmit` exit 0 (restored). `npx vitest run test/evidence.test.ts` 8/8 pass.
Full suite `npm test` exit 0, 383/383 pass. No behavior change (comment-only diff).