# WP6 Strategic Direction Evaluation

## Objective
Answer: What is the smallest useful engineering capability justified by WP5 evidence?

## WP5 Evidence Summary (from claims-evidence-matrix.md and limitations.md)

### Proven Claims (with confidence)
- Changed functions identifiable from Git diff + complexity analysis: **Medium/High**
  - 11 cases: 5 re-executed, 6 replay-only; 4/5 re-executed produced expected locked-focus functions
  - Limitation: TypeScript/JavaScript only; monorepos untested; apollo scope mismatch
  
- Coverage attributable to changed functions: **Medium**
  - 5 re-executed cases with preserved Istanbul/v8 artifacts
  - Limitation: Coverage-provider dependent; test files outside Istanbul scope report skipped
  
- CRAP deterministic: **High**
  - 5 re-executed cases × 2 thresholds reproduce WP4R frozen baseline exactly
  - Limitation: Tested environments only; documented path-coupling caveat (F-03 RESOLVED in WP5.6 remediation)
  
- CRAP calculation correct: **High**
  - Formula checks against sup-a, sup-b, hono-02
  - Limitation: Third-party trust boundary (`crap-typescript-core` v0.5.0)
  
- Output explainable (JSON schema 0.2): **High**
  - All 11 cases produce schemaVersion: 0.2 JSON with required fields
  - Limitation: JSON only; no terminal/human-friendly output
  
- Threshold sensitivity deterministic: **Medium**
  - sup-b: T30=PASS, T15=WARN (same evidence, different policy)
  - Limitation: Single demonstration case

### Not Proven (per limitations.md)
- Universal usefulness (insufficient sample: 11 cases)
- Cross-language generality (TypeScript/JavaScript only)
- Monorepo handling (not tested)
- Coverage generation orchestration (caller owns it)
- Apollo-client coverage generation (unresolved Jest reporter failure)

## Fork Analysis

### Direction A — Reusable Evidence API / Protocol
- **What it would prove**: Engine as reusable deterministic service/library for programmatic consumption
- **Evidence supporting**: 
  - Deterministic evidence model proven (High confidence)
  - JSON schema 0.2 stable (High confidence)
  - Evidence contract frozen (WP5.6 CLOSURE.md)
  - F-03 path normalization resolved enables cross-environment artifact replay
- **Evidence against**: 
  - No demonstrated programmatic consumer in WP5 (WP4R/WP5.5 used file output only)
  - Usefulness classification awaiting human review (Low/Medium confidence)
- **Cost**: Low (thin wrapper around `buildEvidenceOutput`)
- **Risk of over-generalization**: Low (preserves evidence/judgment boundary)
- **Reversibility**: High (additive interface, no core changes)

### Direction B — Engram Integration
- **What it would prove**: LLM auditor reasoning over factual evidence instead of generating evidence
- **Evidence supporting**: 
  - Clear evidence/judgment boundary in architecture (git → evidence → engine → structured output)
  - WP5.6 frozen contract enables reliable factual input
- **Evidence against**: 
  - No evidence that current evidence is meaningful to LLMs (usefulness not classified)
  - Engram integration would require prompt engineering beyond evidence provision
  - Adds complexity without evidence of value (violates minimality)
- **Cost**: Medium (requires LLM prompt design, testing)
- **Risk of over-generalization**: High (assumes evidence usefulness without proof)
- **Reversibility**: Medium (would need to remove LLM-specific code)

### Direction C — CI/CD Gate
- **What it would prove**: Reliable evidence production in CI for automated gating
- **Evidence supporting**: 
  - Deterministic engine works with real changes (5 re-executed cases)
  - Gate evaluation (PASS/WARN/null) functional in evidence output
  - Real change → coverage artifact → structured output → gate evaluation possible
- **Evidence against**: 
  - No end-to-end CI demonstration in WP5 (caller responsible for coverage generation)
  - Policy layer separate from evidence layer (threshold configurable)
- **Cost**: Low (shell script invoking CLI with real change)
- **Risk of over-generalization**: Low (minimal proof focuses on mechanism, not policy)
- **Reversibility**: High (no persistent changes)

### Direction D — Historical Risk / Baseline
- **What it would prove**: Historical context improves decision quality over absolute values
- **Evidence supporting**: 
  - Changed-function count metric enables delta calculation
  - Deterministic evidence supports reproducible baselines
- **Evidence against**: 
  - No evidence that historical delta improves decisions over absolute CRAP
  - Adds complexity (storage, comparison logic) without evidence of value
  - Violates demonstration-before-generalization principle
- **Cost**: Medium (requires storage, diff logic)
- **Risk of over-generalization**: Medium (assumes historical value without proof)
- **Reversibility**: Medium (would need to remove history features)

### Direction E — Additional Language Support
- **What it would prove**: Language-independent deterministic evidence model
- **Evidence supporting**: 
  - Common evidence model conceptualized in architecture
  - CRAP formula language-agnostic (though implementation is TS-specific)
- **Evidence against**: 
  - Zero evidence of cross-language applicability
  - Would require significant adapter work (complexity, coverage, attribution per language)
  - Premature generalization without single-language proof
- **Cost**: High (language adapter development)
- **Risk of over-generalization**: Very High (builds framework before proving value)
- **Reversibility**: Low (language entanglement in core)

### Direction F — Freeze-Stop
- **What it would prove**: Current evidence is sufficient; no further investment justified
- **Evidence supporting**: 
  - Deterministic evidence model with truthful semantics proven
  - Evidence contract frozen and stable
  - Usefulness classification deferred to human review (appropriate)
- **Evidence against**: 
  - WP5.6 explicitly hands off to WP6 for strategic direction
  - Roadmap WP6 expects decision and proof, not freezing
  - Misses opportunity to demonstrate minimal useful capability
- **Cost**: Zero (no implementation)
- **Risk of over-generalization**: None (no implementation)
- **Reversibility**: N/A (no change)

## Decision
**Select: Evidence API + Minimal CI Gate as combined minimal proof**

### Justification
1. **Smallest reversible step**: 
   - Evidence API: Thin wrapper around existing `buildEvidenceOutput` (additive, reversible)
   - CI Gate proof: Shell script demonstrating real caller → real evidence → deterministic engine → real structured output → gate evaluation (no platform changes)
   - Combined cost lower than any single-direction full implementation

2. **Evidence-grounded**:
   - Builds on proven deterministic evidence (High confidence)
   - Uses frozen JSON schema 0.2 contract (High confidence)
   - Demonstrates real consumption pattern implied by architecture
   - Does not autonomously classify usefulness (defers to human review per WP5.6 guardrail)

3. **Minimality principle compliance**:
   - No databases, dashboards, services, or multi-language frameworks
   - One real example → repeatable example progression (5 re-executed cases available)
   - Preserves evidence/judgment boundary (engine produces facts, gate applies policy)

4. **Reversibility**:
   - Evidence API: Reversible by removing thin wrapper
   - CI proof: Reversible by deleting proof artifacts (no src changes)
   - Combined: Fully reversible via `git revert` or file deletion

5. **Risk mitigation**:
   - Addresses WP6 open decision F-03 (path normalization now resolved)
   - Uses existing CLI as evidence producer (no new interface complexity)
   - JSON contract as stable boundary for future evolution

### Rejected Alternatives Rationale

**Why not Engram first?**
- Engram integration assumes evidence usefulness without proof (WP5.6 usefulness confidence Low/Medium)
- Violates demonstration-before-generalization: need evidence consumer proof before LLM integration
- Higher cost and risk than minimal API+CI proof
- Evidence shows deterministic engine works; Engram integration adds unproven value

**Why not history first?**
- No evidence that historical delta improves decisions over absolute values in tested cases
- Adds complexity (storage, comparison) without demonstrated need
- Premature generalization: single-repo deterministic proof needed before temporal analysis
- WP5.6 limitations show insufficiency for universal claims; history exacerbates this

**Why not language first?**
- Zero evidence of cross-language applicability in WP5 corpus
- Would require rebuilding core components (complexity, coverage, attribution) per language
- Violates minimality principle: build multi-language framework before proving single-language value
- Highest cost option with least evidence grounding

**Why not freeze-stop?**
- Contradicts WP6 objective: "What is the smallest useful engineering capability justified by WP5 evidence?"
- WP5.6 handoff explicitly expects WP6 decision and proof
- Misses opportunity to demonstrate minimal viable capability from strong evidence base
- Freeze justified only if evidence shows no useful signal; WP5 shows deterministic signal works under tested conditions

## Evidence API + CI Gate Proof Scope
- **Evidence producer**: Existing CLI (`check --base <ref> --json`) as real caller
- **Evidence contract**: Frozen schema 0.2 with invariants INV-01..04 preserved
- **Deterministic engine**: Unchanged WP5.6 frozen engine (commit post-remediation)
- **Evidence consumer**: Shell script that parses JSON output and applies gate policy
- **Real change**: Local repository modification triggering new evidence generation
- **No platform**: Proof uses existing tools (Node, shell, Git) without new services

This represents the smallest reversible step that demonstrates:
1. Real engineering capability (deterministic evidence production/consumption)
2. Grounded in WP5 evidence (not speculative)
3. Reversible without loss of proven capability
4. Compliant with minimality and evidence/judgment boundary principles
