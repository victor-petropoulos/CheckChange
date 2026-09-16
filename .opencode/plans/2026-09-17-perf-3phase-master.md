---
task: "Perf 3-phase: 10 verified findings (serial parse, python spawns, attribution re-parse, prune storm, coverage O(TxE), evidence walks, suffix match, LCOV, recursive scan, git probes) + vitest threads — determinism-preserved, no API break, no accuracy loss"
created: "2026-09-17T00:00:00Z"
approved: false
repo_conventions:
  gate: "npx tsc --noEmit && npx vitest run && npx checkchange check"
  entry_points: ["src/cli.ts"]
  review_hook: "engram_review_delta at each phase gate (A-gate task 5, B-gate task 9, C-gate task 15); findings via Finding Evaluation Protocol, resolved via engram_report_review_action"
  graph_tool: "grep/glob (rg)"
risks:
  - { risk: "A1 parallel parse breaks ordering/error semantics", mitigation: "index-mapped Promise.all preserving walk order; aggregate reject with index attached; determinism run-twice diff empty", signal: "vitest + byte-diff vs baseline" }
  - { risk: "B3 shared descriptor Map drifts from per-call parse accuracy", mitigation: "parity test: attribution output byte-identical vs baseline before swap", signal: "diff empty + trace MEASURED" }
  - { risk: "B4 prune throttle lets cache overshoot 500MB cap", mitigation: "overshoot bounded by (writes in throttle window) x MAX_CACHE_ENTRY_BYTES 10MB (cache.ts:21) vs 500MB cap (cache.ts:20); final sweep at run end still evicts", signal: "cold-fill dir-size sweep test" }
  - { risk: "Unmeasured perf claims (ESTIMATE masquerading as fact)", mitigation: "every gain labeled ESTIMATE until trace --json before/after proves it; NOT ACHIEVED marks keep-or-revert decision at gate", signal: "docs/perf-baseline.md MEASURED column" }
  - { risk: "checkchange WARN block on gate", mitigation: "WARN-block invariant enforced: any WARN block fails acceptance; resolve or escalate, never bypass", signal: "npx checkchange check output" }
guardrails:
  - "Determinism preserved: COMP-17 sorted walk; all parallel ops index-mapped, output order = input order"
  - "No public API break: only internal fns touched (coverage transform fns internal; provider fns internal)"
  - "No accuracy loss: byte-identical outputs vs baseline for affected stages"
  - "Small opt-in deps only: p-limit allowed; piscina deferred unless A1 measurement demands worker threads"
  - "Every perf-affecting task: trace --json before/after appended to docs/perf-baseline.md; gains MEASURED or NOT ACHIEVED, never silently claimed"
  - "Cache providerVersion bumped when python script changes (key includes it, cache.ts:41-42,94-96)"
max_rounds: 3
tasks:
  - id: "1"
    description: "Baseline record: green state + before-data for all 10 findings. Run gate, then trace --json x3 on fixture C, append BEFORE section to docs/perf-baseline.md. No code edits."
    agent: "researcher"
    files: ["docs/perf-baseline.md"]
    acceptance: "BEFORE section written with verbatim trace JSON + 3-run medians per stage (complexity/coverage/attribution/rules/enrich); tsc/vitest output pasted; numbers only, no analysis claims"
    depends_on: []
  - id: "2"
    description: "A1: parallel AST parse. Restructure src/complexity.ts:55-57 serial per-file loop into index-mapped Promise.all with p-limit 8-16; errors aggregated with index; order preserved (COMP-17). Add p-limit dep (opt-in, small)."
    agent: "implementer"
    files: ["src/complexity.ts", "package.json"]
    acceptance: "npx tsc --noEmit exit 0, 0 errors; npx vitest run all pass; run-twice output diff empty; trace --json after vs task-1 BEFORE shows MEASURED 10-30% IO / 40-70% with workers or NOT ACHIEVED; gate paste included"
    depends_on: ["1"]
  - id: "3"
    description: "A2: python per-file spawnSync batch. Replace src/complexity-providers/pythonASTComplexityProvider.ts:132 and src/complexity-providers/pythonDescriptorProvider.ts:118 (via src/attribution.ts:92) single-file spawns with ONE python3 process batching all files via argv/stdin, script loops, per-file output in find order; route .py complexity through getOrCompute (key exists cache.ts:41; bypass removed cache.ts:407-411); providerVersion bump on script change."
    agent: "implementer"
    files: ["src/complexity-providers/pythonASTComplexityProvider.ts", "src/complexity-providers/pythonDescriptorProvider.ts", "src/attribution.ts", "src/cache.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; per-file outputs byte-identical vs sequential baseline run; find order preserved; trace MEASURED 6-25s reduced or NOT ACHIEVED; gate paste included"
    depends_on: ["1"]
  - id: "4"
    description: "A5-Set: O(TxE) to O(T). Replace src/coverage.ts:186 executedLines.includes(line) loop (coverage.ts:180-187) with one new Set(executedLines) before loop, set.has in loop."
    agent: "implementer"
    files: ["src/coverage.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; generated ndjson identical to baseline output (diff empty)"
    depends_on: ["1"]
  - id: "5"
    description: "Phase A gate. Independent review of A1/A2/A5-set diffs; run full gate; checkchange WARN-block invariant; engram_review_delta + Finding Evaluation Protocol; results logged via engram_report_review_action."
    agent: "reviewer"
    files: []
    acceptance: "gate output pasted (tsc 0, vitest pass, checkchange no WARN block); review findings resolved (accept/modify/reject each logged); A-phase summary appended to docs/perf-baseline.md"
    depends_on: ["2", "3", "4"]
  - id: "6"
    description: "B3: share per-run descriptor Map. Single per-run Map<normalizedAbsolutePath, descriptors> populated once; replace attribution per-call re-parse (src/attribution.ts:46,87-94) with Map hit, miss->parse+store; dedup vs cached variant src/cache.ts:321 (dup of src/complexity.ts:57). Requires A1 restructure (order: task 1 before task 3)."
    agent: "implementer"
    files: ["src/attribution.ts", "src/complexity.ts"]
    acceptance: "parity: attribution output byte-identical vs task-1 baseline (diff empty); npx tsc --noEmit 0 errors; npx vitest run pass; trace MEASURED 30-50% or NOT ACHIEVED; gate paste included"
    depends_on: ["2", "5"]
  - id: "7"
    description: "B4: prune-storm throttle. Throttle src/cache.ts:281 (wrote -> prune(root)) to >=1s between prunes or per-k-writes; per-file prune cache.ts:215-253 collapses to sweep; final pass at run end still sweeps TTL/tmp and 500MB LRU (cache.ts:245-252); overshoot bounded by window-writes x 10MB vs 500MB cap."
    agent: "implementer"
    files: ["src/cache.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; cold-fill trace MEASURED 40-70% or NOT ACHIEVED; eviction-at-cap behavior still proven (dir-size sweep test)"
    depends_on: ["2", "5"]
  - id: "8"
    description: "B6: memoize per-cwd walks. src/evidence.ts:386-399 walkDirBounded called per function at evidence.ts:401-404 (readFileSync x2, existsSync x5-6 each) — memoize per cwd with per-run Map<dir, result>."
    agent: "implementer"
    files: ["src/evidence.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; 200-fn fixture trace MEASURED 0.2-0.6s reduction or NOT ACHIEVED; memo per-run scope only (fresh each run)"
    depends_on: ["5"]
  - id: "9"
    description: "Phase B gate. Independent review of B3/B4/B6 diffs; full gate; WARN-block invariant; engram_review_delta + protocol; B-phase summary appended."
    agent: "reviewer"
    files: []
    acceptance: "gate output pasted (tsc 0, vitest pass, checkchange no WARN block); findings resolved and logged; B-phase summary in docs/perf-baseline.md"
    depends_on: ["6", "7", "8"]
  - id: "10"
    description: "C7: basename index for suffix match. src/attribution.ts:60-67 O(CxF) suffix matching replaced by basename index Map (basename -> paths) built once per call; O(1) lookup; ambiguous multi-basename preserves skip at src/attribution.ts:74-76."
    agent: "implementer"
    files: ["src/attribution.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; parity: ambiguous files still skipped, unambiguous resolution identical; trace MEASURED 5-15%, else NOT ACHIEVED; gate paste included"
    depends_on: ["9"]
  - id: "11"
    description: "C8: LCOV memory short-circuit. src/coverage.ts:461 double rebase -> skip second rebase for LCOV-sourced maps; add isWithinCwd-key early exit top of normalizeCoveragePaths (src/coverage.ts:266-300); replace spread+delete reset (src/coverage-providers/lcovProvider.ts:29-42) with fresh-object build; leave split and existsSync (lcovProvider.ts:20,118-131) as-is unless measured below goal."
    agent: "implementer"
    files: ["src/coverage-providers/lcovProvider.ts", "src/coverage.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; rebased paths identical to baseline (diff empty); peak memory on 100MB LCOV fixture MEASURED lower than 200MB baseline or NOT ACHIEVED"
    depends_on: ["9"]
  - id: "12"
    description: "C9: recursive scan prune. src/auto-coverage.ts:50 readdirSync(cwd,{recursive:true}) full-tree .py scan — prune node_modules/.git (match find prune src/complexity-providers/pythonASTComplexityProvider.ts:19), stop at first .py, fold duplicate reads (package.json x2 :32,:41; readdirSync x2 :29,:38) into one pass."
    agent: "implementer"
    files: ["src/auto-coverage.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; new test: node_modules-only .py files -> hasPytest false; trace MEASURED 0.5-2s when pytest config present"
    depends_on: ["9"]
  - id: "13"
    description: "C10: git probe redundancy. src/cli.ts:258-262 revalidates repo + src/git.ts:143-144 re-probes after probes src/git.ts:59-78 — pass validated repo ctx through, index-mapped parallel probes; error semantics for missing repo unchanged."
    agent: "implementer"
    files: ["src/cli.ts", "src/git.ts"]
    acceptance: "npx tsc --noEmit 0 errors; npx vitest run pass; missing-repo error identical to baseline; trace MEASURED 15-40ms or NOT ACHIEVED"
    depends_on: ["9"]
  - id: "14"
    description: "C-vitest (test-only): measure threads pool before committing config. Run npx vitest --pool=threads vs forks baseline (task-1 record); safe because no native addons (package.json:18-29). Apply pool:threads + fsModuleCache:true only if measured >=10% faster and all pass."
    agent: "tester"
    files: ["vitest.config.ts"]
    acceptance: "all tests pass under threads; wall-time comparison pasted (forks vs threads); config change (if any) accompanied by benchmark note; no native-dep hazard"
    depends_on: ["9"]
  - id: "15"
    description: "Phase C gate + final composition proof (E1 wiring rule: all 10 findings integrated). Full repo gate; integration parity: full trace run before/after on fixture C — complexity/coverage/attribution outputs byte-identical; per-item MEASURED/NOT ACHIEVED summary table appended to docs/perf-baseline.md; engram_review_delta + protocol."
    agent: "reviewer"
    files: []
    acceptance: "gate pasted (tsc 0, vitest pass, checkchange no WARN block); integration parity diff empty; summary table complete — every finding labeled MEASURED (with %) or NOT ACHIEVED (with keep/revert decision); findings resolved and logged"
    depends_on: ["10", "11", "12", "13", "14"]
---
# Perf 3-Phase Master Implementation Plan

## Goal

Ship all 10 verified performance findings (+1 test-only vitest finding) across three phases — **A**: hot-path parallelism (1, 2, 5-Set), **B**: cache & re-parse elimination (3, 4, 6), **C**: matching/scan/git trim (7, 8, 9, 10, vitest) — with **zero behavior change**: determinism preserved (COMP-17 sorted walk), no public API break, no accuracy loss. Every gain measured via `trace --json` before/after against task-1 baseline; gains labeled **MEASURED** (with %) or **NOT ACHIEVED** (keep/revert decision at gate). No claim without evidence.

**Order constraint:** finding 1 (A1) must land before finding 3 (B3) — B3 dedups attribution against the A1-restructured compute path. Enforced via `depends_on` (B3 → A1 + A-gate).

**Baseline ground (verified):** complexity stage = 59–77% of span total; fixture C (248 TS files) median span total 266 ms (`docs/perf-baseline.md:208-216,228`). This repo has 0 `.py` files — python gains scored for "medium repo + python coverage present" (hypothetical: 500 TS + 200 `.py`, ≥80 changed).

## Architecture

Pipeline (unchanged, never rewired): `src/cli.ts:554` main → `src/evidence.ts:537` buildEvidenceOutput → complexity → coverage → attribution → rules → enrich.

- **Complexity** (`src/complexity.ts:55-57`, cached variant `src/cache.ts:321`): A1 index-maps the per-file loop (order-preserving); B3 shares descriptors with attribution via one per-run Map. Python providers (`src/complexity-providers/pythonASTComplexityProvider.ts`, `src/complexity-providers/pythonDescriptorProvider.ts`) get single-process batching (A2) and `.py` complexity routed through `getOrCompute` (`src/cache.ts:407-411`).
- **Cache** (`src/cache.ts`): B4 throttles prune storm (`:281` → `:215-253`); overshoot provably bounded; eviction-at-cap retained.
- **Coverage** (`src/coverage.ts`, `src/coverage-providers/lcovProvider.ts`): A5-Set turns O(T×E) into O(T); C8 removes double rebase + spread/delete churn. Transform/content fns internal — no API break.
- **Attribution** (`src/attribution.ts`): C7 replaces O(C×F) suffix match with basename index; ambiguous-skip kept.
- **Evidence** (`src/evidence.ts:386-404`): B6 memoizes per-cwd bounded walks per run.
- **Auto-coverage** (`src/auto-coverage.ts:50`): C9 prunes node_modules/.git, folds duplicate reads.
- **Git** (`src/git.ts:59-78,143-144`, `src/cli.ts:258-262`): C10 threads validated repo ctx, parallel probes.
- **Test perf** (`vitest.config.ts:2-8`): threads pool only if measured.

## Tech Stack

- TypeScript ESM NodeNext ES2022, Node 24 (`nvm use` before any command).
- Opt-in dep: `p-limit` (small, A1 only). **Piscina deferred** — only if A1 measurement on 8-core shows worker threads needed; never speculative.
- No runtime DB deps; no native addons (verified `package.json:18-29` — `threads` pool safe for vitest).

## Global Constraints

1. **Determinism (COMP-17):** sorted walk preserved. Every parallelization is index-mapped — output array index = input walk index. Run-twice byte-diff is the proof, per task.
2. **No public API break:** only internal fns touched: coverage transform fns internal (`coverage.ts:148,266`), provider fns internal. No exported signature changes.
3. **No accuracy loss:** affected-stage outputs byte-identical vs task-1 baseline. Parity diff is acceptance, not aspiration.
4. **Deps:** small opt-in only (`p-limit`). Anything bigger requires phase-gate justification in docs/perf-baseline.md.
5. **ESTIMATE vs MEASURED labeling:** all gains in findings table are ESTIMATE until `trace --json` before/after proves them. Task acceptance: MEASURED (with %) or NOT ACHIEVED + keep/revert decision. Never claim unproven gain.
6. **Trace requirement:** every perf-affecting task runs `npx checkchange trace --json` on fixture C (definition `docs/perf-baseline.md:208-216,228`) before and after, appends both to `docs/perf-baseline.md`.
7. **Checkchange WARN-block invariant:** `npx checkchange check` WARN blocks fail acceptance. Resolve or escalate at gate — never bypass.
8. **Cache key hygiene:** python provider `providerVersion` bumped when inline script changes (cache key includes it, `cache.ts:41-42,94-96`).
9. **Estimate honesty (P9):** repo has no python fixture — python-path gains (A2, C9) require a synthetic 200-`.py` fixture measurement or explicit score as "conditional: measured only when python coverage present"; never reported as unconditional.

## Project Setup (every task, unskipable)

- [ ] `nvm use` — verify Node 24 (`node -v`); abort if wrong version (pnpm `ERR_UNKNOWN_BUILTIN_MODULE` = wrong node).
- [ ] Stop: verify plan file paths exist (`ls -d` each `files:` entry) and line numbers match — bad path → STOP + report, never guess.
- [ ] Run gate command sequence, paste verbatim output with exit codes into task report.

## Phase A — Hot-path parallelism (tasks 2-5)

### Task 1 — Baseline record (researcher)

**Files:** `docs/perf-baseline.md` (append section, no other edits)

**Interfaces:** consumes `src/cli.ts` trace entrypoint + fixture C; produces BEFORE data for all later tasks.

**Steps**
- [ ] `nvm use` (Node 24)
- [ ] `npx tsc --noEmit` → paste exit code (expect 0, 0 errors)
- [ ] `npx vitest run` → paste summary (baseline: 31 files / 245 tests passed)
- [ ] `npx checkchange trace --json` on fixture C, 3 runs → capture per-run span totals per stage: complexity / coverage / attribution / rules / enrich
- [ ] Append `## 2026-09-17 perf-3phase BEFORE baseline` to `docs/perf-baseline.md`: verbatim trace JSON (3 runs) + median per stage. Numbers only — no analysis claims.

**Acceptance:** BEFORE section exists with verbatim JSON + medians; tsc/vitest output pasted; zero code edits (verify `git status` shows only docs/perf-baseline.md touched).

### Task 2 — A1: parallel AST parse (implementer)

**Files:** `src/complexity.ts` (`:55-57` loop), `package.json` (+`p-limit`)

**Interfaces:** consumes file walk list (COMP-17 sorted); produces same outputs array in same order; error surface: aggregated reject carrying file index.

**Seam:** per-file loop body at `src/complexity.ts:55-57` — replace serial `for` with index-mapped `Promise.all(pLimit(8-16)(...))`; results written to `results[i]` by input index. Rejected alternative: bare `Promise.all` without p-limit (unbounded fd pressure on 1000-file repos).

**Steps**
- [ ] `pnpm add p-limit` (small opt-in dep; piscina NOT added)
- [ ] Restructure loop: `files.map((f, i) => limit(() => collect(f).then(r => out[i] = r)))` + `Promise.all`; errors aggregated, reject with index attached; walk order byte-preserved
- [ ] Confirm cached variant `src/cache.ts:321` keeps same semantics (no change this task — B3/owner tasks touch cache)
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npx vitest run` → all pass
- [ ] Determinism: run twice, `diff` outputs — expect empty
- [ ] `npx checkchange trace --json` before (task-1 data) vs after → append MEASURED delta to `docs/perf-baseline.md`
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0 errors; vitest pass; run-twice diff empty; trace delta MEASURED (10-30% IO; 40-70% with workers — if worker threads needed mark piscina decision) or NOT ACHIEVED + revert decision; gate paste included. Undo: revert commit / `git checkout src/complexity.ts` (task isolated).

### Task 3 — A2: python batch process + cache wiring (implementer)

**Files:** `src/complexity-providers/pythonASTComplexityProvider.ts` (`:132`), `src/complexity-providers/pythonDescriptorProvider.ts` (`:118`), `src/attribution.ts` (`:92`), `src/cache.ts` (`:407-411`)

**Interfaces:** consumes file list; produces per-file complexity + descriptors in find order (exactly as sequential spawn today); cache key `{kind:'file'}` already exists (`cache.ts:41`).

**Steps**
- [ ] One `spawnSync('python3', [...])` per run batch — files via argv/stdin; inline script loops over files, prints per-file results in input order; output order deterministic (= `find` order at `pythonASTComplexityProvider.ts:19`)
- [ ] Script body byte-equivalent to current `compute_cc` per file (cross-check: run batch vs sequential on same fixture, per-file diff empty)
- [ ] Bump `providerVersion` for changed script (cache key hygiene, constraint 8)
- [ ] Replace both spawn sites (`pythonASTComplexityProvider.ts:132`, `pythonDescriptorProvider.ts:118`) with batch call; `text-encoding`/argv size guard: 200 files ~ ≤2 MB stdout — no `maxBuffer` concern (verified)
- [ ] Route `.py` complexity through `getOrCompute`; remove bypass at `cache.ts:407-411`
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Parity: per-file outputs byte-identical vs sequential baseline run (temp harness, same fixture)
- [ ] `npx checkchange trace --json` before/after → MEASURED 6-25s reduction or NOT ACHIEVED (score conditional on python fixture — constraint 9)
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass; per-file parity diff empty; order preserved; trace result labeled per constraint 5/9; gate paste. Undo: revert commit.

### Task 4 — A5-Set: coverage O(T×E) → O(T) (implementer)

**Files:** `src/coverage.ts` (`:180-187` loop, `:186` includes)

**Interfaces:** produces identical ndjson coverage output; internal fn only.

**Steps**
- [ ] Build `const executed = new Set(executedLines)` once before loop; replace `executedLines.includes(line)` with `executed.has(line)` (`coverage.ts:186`)
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Parity: generated ndjson diff vs baseline — empty
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass; ndjson diff empty. Undo: revert commit (one-liner).

### Task 5 — Phase A gate (reviewer)

**Files:** none (verification only)

**Steps**
- [ ] `engram_review_delta` on work since task-1 start; evaluate each finding (confidence × severity); `explain_finding` when unclear; log via `engram_report_review_action` (accept/modify/reject each, reasoned)
- [ ] `npx tsc --noEmit`; `npx vitest run`; `npx checkchange check` — paste all three; **WARN block → gate fails** (invariant, constraint 7): resolve or escalate, never bypass
- [ ] Append `## 2026-09-17 Phase A summary` to `docs/perf-baseline.md`: per-task MEASURED/NOT ACHIEVED
- [ ] Green gate + zero unresolved Critical/High findings required to open Phase B

**Acceptance:** three gate outputs pasted; findings resolved; summary appended.

## Phase B — Cache & re-parse elimination (tasks 6-9)

### Task 6 — B3: shared per-run descriptor Map (implementer)

**Files:** `src/attribution.ts` (`:46` per-call cache, `:87-94` re-parse), `src/complexity.ts` (`:57` parse)

**Interfaces:** produces attribution output byte-identical to baseline; consumes descriptors from single per-run Map keyed by normalized absolute path.

**Seam:** attribution per-call descriptor cache (`src/attribution.ts:46`) and complexity parse (`src/complexity.ts:57`) are duplicates — unify behind one per-run `Map<normalizedPath, descriptors>` created at run scope (owner: run composition, not cli.ts). Rejected: module-global cache (cross-run staleness) — per-run only.

**Steps**
- [ ] Introduce per-run descriptors Map; populate once from complexity pass (A1 restructure already delivers parse results — reuse, no second parse)
- [ ] Replace attribution re-parse (`attribution.ts:87-94`) with Map hit; miss → parse + store (defensive: files outside complexity walk)
- [ ] Remove dup per-call cache at `attribution.ts:46` (single source)
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Parity: attribution output byte-identical vs task-1 baseline (diff empty) — **accuracy tripwire**: any diff → stop, root-cause, do not land
- [ ] `npx checkchange trace --json` before/after → MEASURED 30-50% or NOT ACHIEVED
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** parity diff empty; tsc 0; vitest pass; trace labeled; gate paste. Depends: A1 + A-gate (order constraint satisfied). Undo: revert commit.

### Task 7 — B4: prune-storm throttle (implementer)

**Files:** `src/cache.ts` (`:215-253` prune, `:281` write-through call)

**Interfaces:** cache semantics unchanged — outputs never depend on eviction; TTL/tmp sweep + 500 MB LRU still enforced at run end.

**Steps**
- [ ] Add throttle: prune at most once per ≥1 s (or per k writes) inside `getOrCompute` write-through path (`cache.ts:281`)
- [ ] Keep final sweep pass at run end — TTL (`:231-238`) and 500 MB LRU (`:245-252`) still evaluated
- [ ] Overshoot bound check: ≤ (writes in throttle window) × `MAX_CACHE_ENTRY_BYTES` 10 MB (`:21`) vs 500 MB cap (`:20`) — document in code comment
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Cold-fill run ×3: `npx checkchange trace --json` → MEASURED 40-70% or NOT ACHIEVED
- [ ] Behavior proof: dir-size sweep test still evicts at 500 MB cap (existing cache tests must cover)
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass (incl. eviction-at-cap); cold-fill MEASURED; gate paste. Undo: revert commit; cache dir delete optional (recreated).

### Task 8 — B6: memoize per-cwd bounded walks (implementer)

**Files:** `src/evidence.ts` (`:386-399` walkDirBounded, callers `:401-404`)

**Interfaces:** same walk results; per-run memo only (fresh each run — correctness invariant).

**Steps**
- [ ] Add per-run `Map<dir, result>` memo to `walkDirBounded` (key: resolved cwd)
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Perf: 200-fn fixture `npx checkchange trace --json` before/after → MEASURED 0.2-0.6 s or NOT ACHIEVED
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass (file-change invalidation covered by per-run lifecycle); trace labeled; gate paste. Undo: revert commit.

### Task 9 — Phase B gate (reviewer)

**Files:** none

**Steps**
- [ ] `engram_review_delta` + Finding Evaluation Protocol + `engram_report_review_action` (each finding accept/modify/reject, reasoned)
- [ ] `npx tsc --noEmit`; `npx vitest run`; `npx checkchange check` — paste all three; WARN block → gate fails (constraint 7)
- [ ] Append `## 2026-09-17 Phase B summary` to `docs/perf-baseline.md`
- [ ] Green gate + zero unresolved Critical/High → open Phase C

**Acceptance:** three gate outputs pasted; findings resolved; summary appended.

## Phase C — Matching, scan, git trim (tasks 10-15)

### Task 10 — C7: basename index for suffix match (implementer)

**Files:** `src/attribution.ts` (`:60-67` O(C×F) suffix loop, `:74-76` ambiguous skip)

**Interfaces:** identical resolution for unambiguous files; ambiguous multi-basename files still skipped.

**Steps**
- [ ] Build basename→paths index once per call; suffix membership via index (O(1) per lookup); same match semantics per basename
- [ ] Preserve ambiguous-skip at `:74-76`: multiple paths sharing basename → skip (unchanged)
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Parity: ambiguous skipped identically; unambiguous resolution identical (diff empty on fixture)
- [ ] `npx checkchange trace --json` before/after → MEASURED 5-15% or NOT ACHIEVED
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass; parity diff empty; trace labeled; gate paste. Undo: revert commit.

### Task 11 — C8: LCOV memory short-circuit (implementer)

**Files:** `src/coverage-providers/lcovProvider.ts` (`:29-42` spread+delete reset; `:20` split and `:118-131` existsSync left as-is unless measured below goal), `src/coverage.ts` (`:266-300` normalizeCoveragePaths, `:461` double rebase)

**Interfaces:** rebased paths byte-identical to baseline (early exit is identity for within-cwd keys); internal fns only.

**Steps**
- [ ] Top of `normalizeCoveragePaths` loop: `isWithinCwd(key, cwd)` already-satisfied keys → keep (short-circuit; mirrors `lcovProvider.ts:114`)
- [ ] Skip second rebase for LCOV-sourced maps (`coverage.ts:461` — already rebased in parse)
- [ ] Reset via fresh object instead of `{...map}` + `Object.keys().forEach(delete)` (`lcovProvider.ts:29-42`)
- [ ] Leave `split('\n')` (`:20`) and suffix existsSync (`:118-131`) untouched this task — streaming split = readCoverageFile API change, out of scope (flag as future in baseline doc)
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Parity: rebased paths identical (diff empty)
- [ ] Memory measure: 100 MB LCOV fixture peak RSS before/after → MEASURED lower than ~200 MB transient baseline or NOT ACHIEVED
- [ ] `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass; parity diff empty; memory peak labeled; gate paste. Undo: revert commit.

### Task 12 — C9: recursive scan prune (implementer)

**Files:** `src/auto-coverage.ts` (`:50` readdirSync recursive, `:32,:41` pkg reads, `:29,:38` readdirSync dups)

**Interfaces:** detection result matches pruned-`find` semantics (`pythonASTComplexityProvider.ts:19`); failure paths unchanged (`:57-79`).

**Steps**
- [ ] Single recursive pass pruning `node_modules`/`.git`; stop at first `.py`; fold duplicate reads: read `package.json` once, `readdirSync` once
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] New test: fixture where only `node_modules/**/*.py` exist → `hasPytest` false (was true — behavior fix)
- [ ] `npx checkchange trace --json` → MEASURED 0.5-2 s when pytest config present (conditional — constraint 9); `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass incl. new test; trace labeled; gate paste. Undo: revert commit.

### Task 13 — C10: git probe redundancy (implementer)

**Files:** `src/cli.ts` (`:258-262` revalidate), `src/git.ts` (`:59-78` probes, `:143-144` re-probe)

**Interfaces:** error semantics identical for missing/not-a-repo cwd; validated repo ctx passed through.

**Steps**
- [ ] Thread validated repo ctx (from first probe) into downstream git ops — drop revalidation (`cli.ts:258-262`) and re-probe (`git.ts:143-144`)
- [ ] Index-mapped parallel probes where multiple independent git info calls needed
- [ ] `npx tsc --noEmit` → 0 errors; `npx vitest run` → pass
- [ ] Error parity: missing repo → same error message/exit as baseline (existing tests cover)
- [ ] `npx checkchange trace --json` before/after → MEASURED 15-40 ms or NOT ACHIEVED; `npx checkchange check` → no WARN block

**Acceptance:** tsc 0; vitest pass; error parity confirmed; trace labeled; gate paste. Undo: revert commit.

### Task 14 — C-vitest: measure threads pool (tester)

**Files:** `vitest.config.ts` (`:2-8` coverage.exclude only today)

**Steps**
- [ ] `npx vitest run` (forks) → record wall time (baseline from task 1)
- [ ] `npx vitest run --pool=threads` → record wall time; all tests must pass
- [ ] If threads ≥10% faster AND all pass: set `pool: 'threads'` + `experimental.fsModuleCache: true` (+ note: no native addons, `package.json:18-29`, so `threads` safe). Else: no config change; document numbers
- [ ] `npx tsc --noEmit` → 0 errors; `npx checkchange check` → no WARN block

**Acceptance:** wall-time comparison pasted (forks vs threads); pass/fail under threads stated; config change (if any) benchmark-justified; test-only edit scope.

### Task 15 — Phase C gate + final composition proof (reviewer)

**Files:** none — E1 wiring-task: final integration proof at repo gate

**Steps**
- [ ] `engram_review_delta` + Finding Evaluation Protocol + `engram_report_review_action` (each finding accept/modify/reject, reasoned)
- [ ] Full gate: `npx tsc --noEmit`; `npx vitest run`; `npx checkchange check` — paste all three; WARN block → gate fails (constraint 7)
- [ ] Integration parity (D14): full `npx checkchange trace --json` run before (task-1) vs after on fixture C — complexity/coverage/attribution outputs **byte-identical** (diff empty); any drift → stop, root-cause
- [ ] Append `## 2026-09-17 perf-3phase FINAL summary` to `docs/perf-baseline.md`: per-finding table — MEASURED (with %) or NOT ACHIEVED + keep/revert decision; conditional findings flagged per constraint 9
- [ ] `git status` clean-by-design (only intended files); commit plan review green

**Acceptance:** three gate outputs pasted; integration parity diff empty; summary table complete with every finding labeled; findings resolved and logged. This task is the sole composition point for the whole plan.

## Self-Review

### Spec coverage (finding → task)

| Finding | Task | Files verified |
|---|---|---|
| 1 Serial AST parse | 2 (A1) | src/complexity.ts:55-57, src/cache.ts:321 |
| 2 Python per-file spawn | 3 (A2) | pythonASTComplexityProvider.ts:132, attribution.ts:92, pythonDescriptorProvider.ts:118, cache.ts:407-411 |
| 3 Attribution re-parse | 6 (B3) | attribution.ts:46,87-94; complexity.ts:57 |
| 4 Prune storm | 7 (B4) | cache.ts:215-253,281 |
| 5 O(T×E) coverage (Set part) | 4 (A5-Set) | coverage.ts:180-187 |
| 6 Per-fn walks | 8 (B6) | evidence.ts:386-404 |
| 7 Suffix match O(C×F) | 10 (C7) | attribution.ts:60-67,74-76 |
| 8 LCOV split/spread/rebase | 11 (C8) | lcovProvider.ts:20,29-42,118-131; coverage.ts:266-300,461 |
| 9 Recursive scan | 12 (C9) | auto-coverage.ts:32,41,50; pythonASTComplexityProvider.ts:19 |
| 10 Git probe redundancy | 13 (C10) | cli.ts:258-262; git.ts:59-78,143-144 |
| vitest threads (test-only) | 14 | vitest.config.ts:2-8 |

Coverage: 10/10 findings + 1 test-only item + baseline (task 1) + phase gates (5, 9, 15). Finding 5's remaining parts (content-threading `coverage.ts:151,228`, blocking 30 s probe `coverage.ts:102-106`, transform write-then-reread) are deliberately **excluded** — flagged NOT ACHIEVED/deferred in Phase A summary with rationale (internal-fn threading + async spawn = separate risk surface; probe timeout reduction only affects hang cases); A5-Set lands first as pure output-identical win. Finding 8's `split('\n')` streaming excluded (readCoverageFile API change — flag as future).

### Placeholder scan

- [ ] `rg -n "TBD|TODO|FIXME|XXX|placeholder|<\?|\?\?" .opencode/plans/2026-09-17-perf-3phase-master.md` → expect 0 hits (no placeholders; every decision concrete)

### Type consistency

- Every task acceptance includes `npx tsc --noEmit` exit-0 gate (ESM NodeNext ES2022 strictness).
- Exact paths throughout: `src/…`, `docs/perf-baseline.md`, `vitest.config.ts`, `package.json` — no globs, no `src/` shorthand in file lists.
- `depends_on` chain acyclic and enforced: 1 → {2,3,4} → 5 → {6,7,8} → 9 → {10,11,12,13,14} → 15. Order constraint (1 before 3) via B3 → [2,5].
- Agent roles from QA stack: researcher/implementer/tester/reviewer match file-scope permissions (tester = test files only; reviewer = verify-only).

## Verification Honesty

Every task report must paste verbatim tool output with exit codes for every claim: `tsc --noEmit` exit, `vitest run` summary line, `checkchange check` result (WARN-block check), `trace --json` numbers, `diff` results, `git status`. Unrun = NOT RUN, never passed. MEASURED label requires the trace pair in the same report; anything else is ESTIMATE or NOT ACHIEVED.

## Approval Gate

**`approved: false` — awaiting explicit user approval.** Plan is NOT executable until the user approves (flip frontmatter `approved: true` and confirm). No code edits may start from this plan before that gate; task 1 (baseline, read-only research) may be prepared but not executed pre-approval.
