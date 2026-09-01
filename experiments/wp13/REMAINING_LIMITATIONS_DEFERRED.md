# WP13 Remaining Limitations — Deferred Research & Suggested Solutions (for next session)

**Date**: 2026-09-01  
**Status**: DEFERRED per CONTINUE WITH CONSTRAINTS, no schema bump, no core registry yet  
**Context**: WP13 A+B remediated 4 of 7 (limitations 1,3,5,6), this doc captures 3 defer (#2, #4, #7) for future session  

**Prior docs**: `WP13_RESULTS.md`, `HUMAN_REVIEW_STUB.md`, `docs/contracts/evidence-contract.md` (Python addendum), `experiments/wp13/adapter/*.ts`

---

## Limitation #2 — Lizard CC Semantics vs crap-typescript-core AST-Based CC

### Observed
Python adapter uses `lizard@1.24.0` token-based CC (CCN) while TypeScript core uses `@barney-media/crap-typescript-core@0.5.0` AST-based CC.

### Expected
Equivalent CC values for equivalent control-flow constructs across languages, or documented divergence with correction factor.

### Evidence
- `docs/contracts/evidence-contract.md:298-302` — Python addendum notes "Lizard CC semantics (token-based) may differ from crap-typescript-core AST-based CC"
- `experiments/wp13/WP13_RESULTS.md:83` — Limitation 2: "DOCUMENTED DEFER — Token vs AST divergence documented, no fix"
- `src/evidence.ts:221-225` — TypeScript source hardcoded to `@barney-media/crap-typescript-core@0.5.0`

### Root Cause
Lizard counts tokens (keywords, operators) approximating McCabe CC; crap-typescript-core parses TypeScript AST and counts decision points. Divergence on:
- Ternary expressions (`a ? b : c`) — Lizard may count as 1 branch, AST counts as 2
- Logical `&&` / `||` short-circuit — Lizard may not count, AST counts each as branch
- Exception handlers (`try/except`) — Python `except` clauses not counted by Lizard
- `async/await` — Lizard CCN ignores suspension points; TS AST may count `await` as yield

### Research Findings
| Aspect | Lizard (Python) | crap-typescript-core (TS) |
|--------|----------------|---------------------------|
| Method | Token regex scan | TypeScript AST traversal |
| CCN field | `cyclomatic_complexity` | `cc` from complexity tree |
| Ternary `?:` | Counts as 1 | Counts as 2 (two branches) |
| Logical `&&` `||` | Often missed | Each operator = branch |
| `try/catch` / `try/except` | `catch`/`except` = branch | `catch` = branch |
| `async/await` | Not counted | `await` may count as yield |
| Default CC for empty fn | 1 | 1 |

Example divergence (hypothetical):
```python
# Python - Lizard CCN = 2 (if + return)
def f(x):
    if x > 0:
        return x
    return 0
```
```typescript
// TypeScript - crap-typescript-core CC = 3 (if + return + implicit else)
function f(x: number) {
    if (x > 0) return x;
    return 0;
}
```

### Suggested Solutions

#### Minimal — Document Divergence (Current)
- **Action**: Keep Python addendum in evidence-contract.md noting token vs AST difference
- **Pros**: Zero code change, reversible, schema stable
- **Cons**: Users cannot compare cross-language CRAP; no equivalence proof
- **Effort**: S (already done)
- **Risk**: Low
- **Schema bump**: No
- **Core change**: No
- **Reversibility**: Trivial (delete doc paragraph)
- **Acceptance**: Doc states "equivalence not proven"

#### Thorough — Python AST Parser (radon-style)
- **Action**: Implement Python CC via `ast` module (stdlib) + `radon` algorithm port, matching crap-typescript-core decision-point counting
- **Pros**: True equivalence, single CC algorithm across languages
- **Cons**: New dependency or vendored code; maintenance burden; Python version compatibility
- **Effort**: L (weeks)
- **Risk**: High (semantic mismatch risk, testing surface)
- **Schema bump**: No (same output field)
- **Core change**: Yes (new complexity provider in src/)
- **Reversibility**: Moderate (remove provider)
- **Acceptance**: Cross-language CC correlation coefficient ≥ 0.95 on benchmark suite

#### Recommended — Plugin Architecture with Documented Mapping
- **Action**: Define complexity provider interface in core, allow Python AST-based provider as plugin; document known divergence table per construct; provide optional correction factor config
- **Pros**: Extensible, documented, no core algorithm change, plugin isolates risk
- **Cons**: Interface design effort; correction factor heuristic
- **Effort**: M
- **Risk**: Medium
- **Schema bump**: No
- **Core change**: Yes (provider registry in evidence.ts)
- **Reversibility**: Moderate
- **Acceptance**: Provider interface stable; divergence table covers 90% common constructs

### Suggested Next Plan Task (approved: false)
```markdown
- task: "WP13-CC-EQUIVALENCE: Define complexity provider interface + Python AST plugin (radon algorithm) or document divergence table"
  depends_on: []
  priority: "L" # Low until multi-lang core integration proven
  labels: ["wp13", "deferred", "complexity-provider"]
  acceptance: |
    - Provider interface in src/complexity-providers.ts
    - Python AST provider in experiments/wp13/adapter/pythonComplexityAST.ts
    - Divergence table in docs/contracts/evidence-contract.md covering ternary, logical, try/except, async
    - Correlation test: 10 synthetic functions CC correlation ≥ 0.95
```

---

## Limitation #4 — File-Extension Detection Not in Core evidence.ts

### Observed
Core `evidence.ts` only handles `.py` for `isUnsupportedIntervals` (line 114: `filePath.endsWith('.py')`). Full dispatch — complexity provider selection, coverage provider selection, attribution routing — remains adapter-only. No central language registry.

### Evidence
- `src/evidence.ts:114` — Only `.py` added to supported extensions for unsupported check
- `experiments/wp13/adapter/index.ts:1-20` — Adapter exports `getPythonProviders(cwd)`; caller must wire manually
- `experiments/wp13/adapter/e2e.ts:12-15` — E2E manually calls `collectPythonComplexity` + `readPythonCoverage`
- `src/evidence.ts:92-308` — `buildEvidenceOutput` hardcodes `@barney-media/crap-typescript-core` source, no extension routing

### Root Cause
WP13 scope was "minimal Python adapter, no src/ changes". Core `evidence.ts` never designed for multi-language routing. `isUnsupportedIntervals` only filters unsupported files; it doesn't select providers.

### Research Findings
Current dispatch is implicit:
1. TypeScript: `collectComplexity` (crap-typescript-core) → `readCoverage` (Istanbul) → `attachCoverage`
2. Python: `collectPythonComplexity` (lizard) → `readPythonCoverage` (coverage.py) → manual attribution in e2e

No unified `LanguageProvider` interface exists. Adding one requires:
- Interface: `{ extensions: string[], collectComplexity, readCoverage, attributionStrategy }`
- Registry: `Map<string, LanguageProvider>` keyed by extension
- Fallback: TypeScript as default
- Attribution: Case-insensitive matching already fixed (commit 8885796)

### Suggested Solutions

#### Minimal — Keep Adapter-Only (Current)
- **Action**: No core change; adapters handle routing; documentation notes pattern
- **Pros**: Zero core risk, additive, reversible
- **Cons**: Duplicate wiring per language; no single entry point; attribution logic duplicated
- **Effort**: S (none)
- **Risk**: Low
- **Schema bump**: No
- **Core change**: No
- **Reversibility**: N/A
- **Acceptance**: Adapter pattern documented

#### Thorough — Core Language Registry
- **Action**: Add `LanguageRegistry` in `src/evidence.ts` with `registerProvider(ext, provider)`, `getProvider(ext)`, default TS provider
- **Pros**: Single entry point; clean extension; attribution unified
- **Cons**: Core change; registry must be populated at startup; plugin loading complexity
- **Effort**: M
- **Risk**: Medium (core change, startup ordering)
- **Schema bump**: No
- **Core change**: Yes (`src/evidence.ts`, new `src/language-registry.ts`)
- **Reversibility**: Moderate (remove registry, restore hardcoded)
- **Acceptance**: `buildEvidenceOutput` routes by extension; TypeScript + Python both work; tsc clean, vitest 201 pass

#### Recommended — Minimal Core Dispatch Table + Adapter Wiring
- **Action**: Add small dispatch table in `evidence.ts` (extension → provider factory) without full plugin system; keep adapters in experiments; core knows how to call provider interface
- **Pros**: Low core footprint; unified entry; adapters stay isolated
- **Cons**: Still some core change; no hot-reload plugin
- **Effort**: M
- **Risk**: Low-Medium
- **Schema bump**: No
- **Core change**: Yes (dispatch table in evidence.ts)
- **Reversibility**: Easy (remove table, restore hardcoded)
- **Acceptance**: 
  - `evidence.ts` exports `ComplexityProvider`, `CoverageProvider` interfaces
  - Dispatch table: `{ '.ts': tsProvider, '.tsx': tsProvider, '.py': pythonProviderFactory }`
  - `buildEvidenceOutput` selects provider by file extension from intervals
  - Python adapter registers via `experiments/wp13/adapter/index.ts` import side-effect or explicit call
  - All existing tests pass (tsc 0, vitest 201)

### Suggested Next Plan Task (approved: false)
```markdown
- task: "WP13-LANG-REGISTRY: Add minimal dispatch table in evidence.ts for extension→provider routing"
  depends_on: []
  priority: "M" # Medium - needed before multi-lang core graduation
  labels: ["wp13", "deferred", "language-registry", "core"]
  acceptance: |
    - src/evidence.ts: add Provider interface + dispatch table (30 lines max)
    - src/evidence.ts: buildEvidenceOutput uses table to select complexity/coverage providers per file
    - experiments/wp13/adapter/index.ts registers Python provider (side-effect import or explicit register())
    - tsc --noEmit: 0 errors
    - vitest run --no-coverage: 201/201 pass
    - Python e2e still produces valid schema 0.2 output
```

---

## Limitation #7 — No Schema Version Bump (Contract Frozen at 0.2)

### Observed
Schema remains 0.2; Python language signaled implicitly via `source.tool: "lizard@1.8.0+coverage.py"`; no explicit `language` field in `ChangedFunction`.

### Expected
Explicit `language` field in schema 0.3 with migration path, or deliberate decision to keep implicit.

### Evidence
- `docs/contracts/evidence-contract.md:3-5` — "Schema Version 0.2 Lifecycle: Currently frozen per WP5.6; no breaking changes permitted without demonstrated gap requiring engine evolution"
- `docs/contracts/evidence-contract.md:110-118` — WP11 Versioning & Compatibility: "Major schema version bump (e.g., 0.2 → 0.3) requires: Migration note, Engine commit tag, Explicit validation that change addresses proven gap in WP10 scoped claims"
- `docs/contracts/evidence-contract.md:278-285` — Python addendum shows `language` as implicit via `source.tool`
- `experiments/wp13/WP13_RESULTS.md:95` — Limitation 7: "DOCUMENTED DEFER — Schema remains 0.2, language via source.tool, no bump"
- `Post_WP9_Detailed_Roadmap.md:135-160` — WP11 §6 governance

### Root Cause
WP5.6 freeze policy + WP11 governance require proven gap before bump. Current Python support is adapter-only (experiments/), not core-integrated. No consumer depends on explicit language field yet.

### Research Findings
**WP11 Bump Checklist** (from evidence-contract.md:110-118):
1. Migration note in evidence-contract.md documenting changes
2. Engine commit tag indicating version compatibility (e.g., `v0.3.0-compatible`)
3. Explicit validation that change addresses proven gap in WP10 scoped claims
4. Consumers must ignore unknown fields (forward compatibility)

**Options**:

| Option | Description | Bump? | Core Change? | Effort | Risk |
|--------|-------------|-------|--------------|--------|------|
| Keep 0.2 implicit | Language via `source.tool`; document pattern | No | No | S | Low |
| Bump to 0.3 with `language` field | Add optional `language: string` to `ChangedFunction` | Yes | Yes (schema + builders) | M | Medium |
| Bump to 0.3 with `language` + `source` object | Structured provenance: `{tool, version, language}` | Yes | Yes | M | Medium |

**Forward Compatibility**: Current consumers (CLI, rules.ts) ignore unknown fields — adding `language` is additive.

**Breaking Risk**: Only if consumer validates exact schema shape (none do currently).

### Suggested Solutions

#### Minimal — Keep 0.2 Implicit (Recommended Until Core Integration)
- **Action**: No bump. Document implicit language detection via `source.tool` pattern. Revisit when Python graduates to core.
- **Pros**: Policy compliant; zero risk; schema stable
- **Cons**: Implicit; fragile if tool name changes; no programmatic language access
- **Effort**: S (doc only, already done)
- **Risk**: Low
- **Schema bump**: No
- **Core change**: No
- **Reversibility**: N/A
- **Acceptance**: Doc states "language implicit via source.tool; bump deferred until core integration proven"

#### Thorough — Bump to 0.3 with Explicit `language`
- **Action**: Add `language?: string` to `ChangedFunction` interface; update `buildEvidenceOutput` to populate from provider; update CLI JSON output; tag engine commit
- **Pros**: Explicit, queryable, future-proof, enables language-specific rules
- **Cons**: Requires proven gap (WP10); migration note; version tag; consumer awareness
- **Effort**: M
- **Risk**: Medium (governance process, consumer upgrade)
- **Schema bump**: Yes (0.2 → 0.3)
- **Core change**: Yes (interfaces, builders, CLI)
- **Reversibility**: Hard (version bump is one-way)
- **Acceptance**: 
  - `ChangedFunction.language` present for all entries
  - `schemaVersion: '0.3'` in output
  - Migration note in evidence-contract.md
  - Engine tagged `v0.3.0-compatible`
  - All tests pass

#### Recommended — Defer Bump Until Core Multi-Lang Integration + Gap Proof
- **Action**: Keep 0.2 now. When language registry (#4) lands in core AND real multi-lang repo proves need for explicit language field (e.g., language-specific thresholds), then bump with full governance.
- **Pros**: Follows WP5.6/WP11 policy; avoids premature bump; aligns with proven need
- **Cons**: Implicit language persists in adapter phase
- **Effort**: S (wait)
- **Risk**: Low
- **Schema bump**: Deferred
- **Core change**: No (yet)
- **Reversibility**: N/A
- **Acceptance**: Gate: "Requires WP10 gap proof for schema bump + core language registry merged"

### Suggested Next Plan Task (approved: false)
```markdown
- task: "WP13-SCHEMA-BUMP: Bump evidence contract to 0.3 with explicit language field (after core registry + gap proof)"
  depends_on: ["WP13-LANG-REGISTRY"]
  priority: "L" # Low until proven gap + core integration
  labels: ["wp13", "deferred", "schema", "governance"]
  acceptance: |
    - WP10 gap demonstrated: multi-lang repo needs language-specific thresholds
    - Language registry (WP13-LANG-REGISTRY) merged to core
    - ChangedFunction interface adds optional language: string
    - schemaVersion: '0.3' in all EvidenceOutput
    - Migration note in docs/contracts/evidence-contract.md
    - Engine commit tagged v0.3.0-compatible
    - All consumers (CLI, rules, tests) handle unknown field (forward compat)
    - tsc --noEmit: 0 errors
    - vitest run --no-coverage: all pass
```

---

## Overall Next Session Roadmap

### Phase C — Core Multi-Language Integration (L, High)

| Task | Depends On | Effort | Risk | Priority |
|------|------------|--------|------|----------|
| WP13-LANG-REGISTRY: Minimal dispatch table in evidence.ts | — | M | Low-Med | M |
| WP13-CC-EQUIVALENCE: Provider interface + Python AST plugin or divergence table | WP13-LANG-REGISTRY | M-L | Med | L |
| WP13-SCHEMA-BUMP: 0.3 with explicit language field | WP13-LANG-REGISTRY + WP10 gap proof | M | Med | L |

### Gate Recommendation
**BLOCKED ON WP10 GAP PROOF** — Schema bump (WP13-SCHEMA-BUMP) requires demonstrated gap from WP10 scoped claims (caller-owned coverage burden 4.96s) or WP11 roadmap validation. Language registry and CC equivalence can proceed as experiments without schema bump.

### Suggested .opencode/plans/<timestamp>-wp13-remaining-deferred.md
```markdown
# WP13 Remaining Deferred — Plan

## Tasks

- [ ] WP13-LANG-REGISTRY: Minimal dispatch table in evidence.ts for extension→provider routing
  - priority: M
  - depends_on: []
  - acceptance: tsc 0, vitest 201, Python e2e valid schema 0.2

- [ ] WP13-CC-EQUIVALENCE: Define complexity provider interface + Python AST plugin (radon) or document divergence table
  - priority: L
  - depends_on: [WP13-LANG-REGISTRY]
  - acceptance: Provider interface stable, divergence table 90% constructs, correlation ≥ 0.95

- [ ] WP13-SCHEMA-BUMP: Bump to 0.3 with explicit language field (after core registry + WP10 gap proof)
  - priority: L
  - depends_on: [WP13-LANG-REGISTRY]
  - acceptance: Migration note, engine tag v0.3.0-compatible, forward compat verified, all tests pass

## Gate
CONTINUE WITH CONSTRAINTS — No schema bump until WP10 gap proven. Core registry first (WP13-LANG-REGISTRY), then CC equivalence, then bump.
```

---

## Links to Prior Docs

- `experiments/wp13/WP13_RESULTS.md` — Full claims/evidence matrix, verification table, gate recommendation
- `experiments/wp13/HUMAN_REVIEW_STUB.md` — Scope, affected functions, evidence missing, reviewer decision
- `docs/contracts/evidence-contract.md:258-330` — Python addendum (provenance mapping, invariants, limitations)
- `experiments/wp13/adapter/pythonComplexity.ts` — Lizard CSV parsing → ComplexityInfo[]
- `experiments/wp13/adapter/pythonCoverage.ts` — coverage.py JSON → CoverageResult (branch support)
- `experiments/wp13/adapter/index.ts` — getPythonProviders() factory
- `experiments/wp13/adapter/e2e.ts` — End-to-end producing EvidenceOutput schema 0.2
- `experiments/wp13/adapter/pythonFault.spec.ts` — 10 fault tests (MISSING≠MALFORMED, analyzerStatus truthful)
- `src/evidence.ts:114` — `.py` support in isUnsupportedIntervals
- `src/evidence.ts:92-308` — buildEvidenceOutput (core pipeline, hardcoded TS provider)
- `commit 518b6fd` — Remediation A+B (git py support + fault tests + branch coverage + async/classes fixtures)
- `commit f105d34` — Docs update marking 4/7 remediated, 3 defer

---

*Generated 2026-09-01 for WP13 next-session continuity. No code changes — research doc only.*
