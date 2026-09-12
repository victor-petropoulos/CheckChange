# CheckChange — Candidate Functional, Performance, Tracing, and UX Improvements

**Project:** CheckChange  
**Purpose:** Candidate improvement backlog for the existing deterministic evidence/verification platform  
**Baseline:** v0.4.1 / WP18 closed / WP16 re-verification passed  
**Status:** Planning only. No implementation is authorized by this document.  
**Principle:** Improve the evidence layer without weakening determinism, independence, reproducibility, or the existing Evidence Contract.

---

## 1. Context

CheckChange has progressed from the original changed-function CRAP experiment into a broader deterministic evidence layer for AI-assisted software development.

The latest consolidated status records:

- CheckChange v0.4.1.
- Schema 0.4 frozen.
- Thresholds 30/15 frozen.
- INV-01 through INV-04 preserved.
- Core pipeline: Git → changed functions → complexity + coverage → attribution → CRAP → threshold → evidence.
- Complexity-provider and LCOV coverage-provider infrastructure.
- WP17 product-value validation expanded to 12 cases, with 12/12 human accepted.
- WP18 expansion and closure completed.
- The Python coverage bridge subsequently closed the remaining WP18 gap.
- Narrow re-verification: TypeScript clean, 259/259 tests passing, build passing, package dry-run passing, and no source changes attributable to the narrow re-verification.
- Remaining formal open items include thin multi-repository breadth, deferred Angular Phase 1, and two untested MCP candidates.
- The formal product decision remains a human decision rather than an autonomous LLM decision.

This document proposes improvements that can be explored while those product-validation decisions are being worked through.

The goal is not to create a feature-heavy product. The goal is to make existing deterministic evidence more traceable, explainable, reproducible, performant, consumable, and useful.

---

## 2. Non-Negotiable Design Principles

### 2.1 Deterministic Evidence

The evidence/rule pipeline must remain deterministic.

Do not introduce AI-generated risk classifications, opaque confidence scores, model-dependent evidence, or autonomous defect claims.

If an LLM is ever used, isolate it as a downstream consumer or separate experiment.

### 2.2 Independence From the Coding Agent

CheckChange must not depend on Cursor, Claude Code, OpenCode, GitHub Copilot, a particular model, a particular prompt, or an agent's reasoning.

The intended relationship remains:

```text
AI coding agent
       |
       | completed change
       v
   CheckChange
       |
       | deterministic evidence
       v
human / CI / downstream consumer
```

### 2.3 Evidence Is Not Proof of Correctness

CheckChange identifies evidence relevant to review. It does not prove that software is correct.

### 2.4 Evidence Quality Must Be Explicit

A measured value, attributed value, historical value, and unavailable value are not equivalent.

### 2.5 Existing Contract Stability

Do not modify the Evidence Contract merely because a future feature would be easier with a new field. First determine whether the information belongs in existing fields, diagnostics, traces, sidecar evidence, or only then a contract extension.

---

# 3. Recommended Priority

1. Evidence lineage / provenance
2. Evidence completeness and quality metadata
3. Structured execution tracing
4. Evidence fingerprints
5. Incremental analysis and caching
6. `checkchange doctor`
7. `checkchange explain`
8. Function-level evidence presentation
9. Baseline/delta presentation
10. CI / pull-request evidence presentation

This is a recommendation, not an implementation sequence.

---

# 4. Improvement 1 — Evidence Lineage / Provenance

## Objective

Make every important evidence value traceable back to its source and production path.

The key questions are:

> Where did this value come from?

> What exactly did CheckChange use to derive it?

## Example

```json
{
  "function": "calculateOrderTotal",
  "complexity": {
    "value": 17,
    "provider": "complexity-typescript",
    "source": "src/orders/totals.ts",
    "line_start": 142,
    "line_end": 198
  },
  "coverage": {
    "value": 61.4,
    "provider": "istanbul",
    "source": "coverage/lcov.info"
  },
  "change": {
    "source": "git",
    "commit": "abc123",
    "base": "def456"
  }
}
```

This is illustrative only. The actual implementation must conform to the current architecture and contract.

## Questions to answer

- What is the source artifact?
- What provider produced the value?
- What provider version was used?
- What file/function was analyzed?
- What Git state was used?
- What configuration affected the result?
- Was the value measured directly or attributed?
- Was historical evidence involved?
- Was fallback logic used?

## Suggested model

```text
Run
 |
 +-- Git input
 |
 +-- Changed-function discovery
 |
 +-- Complexity provider
 |
 +-- Coverage provider
 |
 +-- Attribution
 |
 +-- Rule evaluation
 |
 +-- Final evidence
```

## Acceptance criteria

- At least one end-to-end evidence value can be traced to its source.
- Provider identity is visible.
- Source artifact identity is visible.
- Change/base identity is visible.
- Attribution status is visible where applicable.
- Lineage is deterministic.
- Existing results remain backward compatible unless a deliberate contract change is approved.

## Failure cases

Test missing coverage, stale coverage, unavailable providers, unsupported files, zero changed functions, historical coverage, attributed coverage, and invalid Git bases.

Lineage must never imply evidence exists when it does not.

---

# 5. Improvement 2 — Evidence Completeness and Quality

## Objective

Explicitly distinguish the presence, absence, and quality of evidence.

A value such as:

```text
Coverage: 61%
```

can be misleading if the value was inferred or attributed.

## Candidate vocabulary

Coverage:

```text
DIRECT
ATTRIBUTED
HISTORICAL
UNAVAILABLE
```

Complexity:

```text
NATIVE
PROVIDER
FALLBACK
UNAVAILABLE
```

These labels must be reconciled against the existing terminology before implementation.

## Example

```text
Coverage: 63%
Evidence quality: ATTRIBUTED
```

or:

```text
Coverage: unavailable
Evidence quality: UNAVAILABLE
Reason: no compatible coverage artifact
```

## Completeness example

```text
Evidence completeness

Changed functions       ✓
Complexity               ✓
Direct coverage          ✓
Historical baseline      ✓
Coverage attribution     ⚠ 2 functions
```

Do not collapse this into a fabricated:

```text
Confidence: 82%
```

Completeness is not statistical confidence.

## Acceptance criteria

A user can determine:

- what evidence exists;
- what evidence does not exist;
- which values were measured;
- which were attributed;
- which are historical;
- why evidence is incomplete.

---

# 6. Improvement 3 — Structured Execution Tracing

## Objective

Provide a machine-readable execution trace for debugging, support, performance analysis, and downstream tooling.

## Candidate event sequence

```text
RUN_STARTED
REPOSITORY_DISCOVERED
LANGUAGE_DETECTED
PROVIDER_SELECTED
GIT_DIFF_LOADED
FUNCTIONS_IDENTIFIED
COMPLEXITY_LOADED
COVERAGE_LOADED
COVERAGE_ATTRIBUTED
EVIDENCE_ASSEMBLED
RULES_EVALUATED
RESULT_EMITTED
RUN_COMPLETED
```

## Example

```json
{
  "event": "COVERAGE_ATTRIBUTED",
  "function": "calculateOrderTotal",
  "provider": "istanbul",
  "duration_ms": 14
}
```

## Trace requirements

A trace should ideally support:

- run identifier;
- timestamp;
- event name;
- duration;
- provider;
- relevant artifact;
- status;
- error information;
- optional diagnostic context.

Avoid putting sensitive source contents into traces by default.

## Why it matters

### Debugging
What happened?

### Performance
What took 700 ms?

### Support
Why did this repository produce INCOMPLETE?

### Reproducibility
What inputs and providers participated?

## Acceptance criteria

A representative run produces enough trace information to reconstruct the major execution stages without reading source code.

Tracing must not materially distort normal execution performance.

---

# 7. Improvement 4 — Evidence Fingerprints

## Objective

Create a deterministic identifier for an evidence result or its evidence-producing input set.

## Concept

```text
source state
+
change set
+
complexity provider/version
+
coverage input
+
configuration
+
CheckChange version
```

Example:

```text
Evidence fingerprint:
cc-e7b1...92af
```

## Required behavior

Identical relevant inputs should produce the same fingerprint.

A meaningful change to:

- source;
- Git change;
- coverage artifact;
- provider/version;
- relevant configuration;
- CheckChange behavior/version

should normally change the fingerprint.

## Uses

- cache keys;
- repeated-run comparison;
- CI diagnostics;
- reproducibility;
- evidence archival;
- downstream deduplication.

## Acceptance criteria

Demonstrate:

1. identical inputs produce identical fingerprints;
2. meaningful input changes produce different fingerprints;
3. irrelevant metadata does not unnecessarily invalidate fingerprints;
4. fingerprints are explainable enough for debugging.

---

# 8. Improvement 5 — Incremental Analysis and Caching

## Objective

Reduce CI runtime by reusing evidence for unchanged inputs.

## Model

```text
Repository
   |
   v
Changed functions
   |
   +---- changed ----> analyze
   |
   +---- unchanged --> reuse evidence
```

## Cache-key considerations

Consider:

```text
function/source fingerprint
+
complexity provider/version
+
coverage artifact fingerprint
+
CheckChange version
+
relevant configuration
```

Never use a simplistic key such as function name alone.

## Safety requirement

A stale cache must never silently masquerade as current evidence.

If uncertain:

```text
cache miss
```

is preferable to:

```text
possibly stale evidence
```

## Experiment

Measure cold and warm runs, including:

- total runtime;
- provider runtime;
- coverage parsing;
- attribution;
- filesystem operations;
- Git operations.

Use actual measurements rather than assumed improvements.

## Acceptance criteria

Implement caching only if:

- correctness is preserved;
- invalidation is deterministic;
- measurable runtime improvement exists;
- cache behavior is explainable;
- failures safely fall back to fresh computation.

---

# 9. Improvement 6 — `checkchange doctor`

## Objective

Provide a diagnostic command that identifies environmental or configuration issues before or during analysis.

## Example

```text
$ checkchange doctor

CheckChange Environment

✓ Git
✓ Repository detected
✓ TypeScript provider
✓ Istanbul coverage
✓ Coverage artifact found

⚠ Coverage artifact appears stale
⚠ 3 changed functions have no coverage attribution

Ready to analyze with incomplete evidence.
```

## Responsibilities

Check things such as:

- Git availability;
- repository detection;
- supported language;
- provider availability;
- coverage artifacts;
- artifact readability;
- configuration;
- obvious path problems;
- permissions;
- environment prerequisites.

Do not duplicate the entire analysis engine.

## UX rule

Distinguish:

```text
ERROR
WARNING
INFORMATION
READY
```

Do not make every warning a failure.

---

# 10. Improvement 7 — `checkchange explain`

## Objective

Explain why CheckChange selected its providers, inputs, thresholds, and evidence path.

## Example

```text
$ checkchange explain

Repository:
  TypeScript repository detected

Complexity provider:
  crap-typescript-core
  reason: supported TypeScript provider

Coverage provider:
  Istanbul
  source: coverage/lcov.info

Git base:
  origin/main

CRAP threshold:
  30

Complexity threshold:
  15

Coverage attribution:
  enabled

Historical coverage:
  enabled
```

## Acceptance criteria

A representative run should let the user understand:

- why a provider was selected;
- why a coverage source was selected;
- what base was used;
- what thresholds were applied;
- what fallback path, if any, was used.

---

# 11. Improvement 8 — Function-Level Evidence Presentation

## Objective

Make evidence immediately useful to a human reviewer.

## Example

```text
calculateOrderTotal()
────────────────────────────────────

Changed
  YES

Complexity
  17

Coverage
  61.4%

Coverage evidence
  ATTRIBUTED

Signal
  WARN

Why
  Complexity increased while
  exercised coverage decreased

Sources
  complexity-typescript
  Istanbul LCOV
  Git diff

Review
  Inspect function
```

## Design rules

Prioritize:

1. what changed;
2. what evidence exists;
3. what is missing;
4. what deserves attention;
5. why.

Detailed provenance can remain available through trace/explain output.

## Acceptance criteria

A reviewer unfamiliar with CheckChange internals can understand the result without reading the implementation.

---

# 12. Improvement 9 — Baseline / Delta Presentation

## Objective

Show how evidence changed, not merely the current value.

## Example

```text
calculateOrderTotal()

Complexity
  12 → 17
  +5

Coverage
  84% → 61%
  -23 percentage points

Changed lines
  18

Signal
  WARN
```

## Important distinction

A delta is evidence.

It is not automatically a risk score.

Do not assume:

```text
+5 complexity = X risk points
```

unless an independently justified rule already exists.

## Useful comparisons

- base commit → current commit;
- previous evidence → current evidence;
- historical coverage → current coverage;
- complexity before → complexity after.

## Acceptance criteria

The reviewer can determine whether the change materially altered the evidence without manually reconstructing the baseline.

---

# 13. Improvement 10 — CI / Pull-Request Evidence Presentation

## Objective

Bring existing evidence into the place where software review occurs.

Potential destinations:

- GitHub Actions;
- pull-request checks;
- CI logs;
- machine-readable artifacts;
- future CI platforms.

## Example

```text
CheckChange

PASS

12 changed functions analyzed

10 PASS
2 WARN

Warnings:
  calculateOrderTotal
    complexity: 12 → 17
    coverage: 84% → 61%

Evidence:
  100% of changed functions analyzed
```

The exact presentation must follow existing status semantics.

## Important constraint

Do not turn CI into an opaque gate.

A warning or failure should explain:

- what happened;
- which functions are involved;
- what evidence exists;
- what evidence is missing;
- what the reviewer should inspect.

---

# 14. Combined Architecture

If eventually implemented, the conceptual architecture could become:

```text
                         Git / Change
                              |
                              v
                    Changed-function discovery
                              |
              +---------------+---------------+
              |                               |
              v                               v
      Complexity Provider             Coverage Provider
              |                               |
              +---------------+---------------+
                              |
                              v
                       Attribution
                              |
                              v
                     Evidence Assembly
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
          Lineage         Completeness     Fingerprint
              |               |               |
              +---------------+---------------+
                              |
                              v
                         Rule Engine
                              |
                              v
                         Final Evidence
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
             CLI             CI          Downstream Agent
              |
       +------+------+
       |             |
       v             v
    explain        doctor
```

Tracing should operate across the pipeline without becoming part of decision logic.

Caching should surround expensive deterministic computation without changing evidence semantics.

---

# 15. Suggested Experimental Work Packages

## Experiment A — Evidence Trust Layer

Combine:

- Evidence lineage;
- Evidence completeness;
- Evidence fingerprints.

Question:

> Can CheckChange make every important evidence result traceable, qualified, and reproducible?

---

## Experiment B — Observability Layer

Combine:

- structured tracing;
- `checkchange explain`;
- `checkchange doctor`.

Question:

> Can a user understand what CheckChange did and why without reading its source?

---

## Experiment C — Performance Layer

Combine:

- execution instrumentation;
- incremental analysis;
- caching.

Question:

> Where does CheckChange spend its time, and can deterministic reuse materially reduce runtime without weakening correctness?

---

## Experiment D — Reviewer UX Layer

Combine:

- function-level evidence;
- baseline/delta presentation;
- CI/PR presentation.

Question:

> Can the evidence be consumed quickly enough to improve real review workflow?

---

# 16. Recommended Experiment Order

### Phase 1
Evidence Trust Layer.

This strengthens the underlying evidence model before optimizing presentation.

### Phase 2
Observability Layer.

Once provenance exists, tracing and explainability become more useful.

### Phase 3
Performance Layer.

Measure first. Optimize only where measurements show a meaningful bottleneck.

### Phase 4
Reviewer UX.

Use validated evidence and provenance structures rather than inventing a parallel representation.

---

# 17. Evidence Required Before Each Implementation

Every proposed feature should begin with a short experiment plan containing:

```text
Hypothesis
Current behavior
Problem
Proposed change
Expected benefit
Risks
Contract impact
Compatibility impact
Performance impact
Security impact
Test strategy
Acceptance criteria
Rollback strategy
```

Do not implement a feature simply because it sounds useful.

---

# 18. Regression Requirements

Every implementation must preserve or explicitly revise the current baseline.

At minimum verify the repository's current equivalents of:

```text
npx tsc --noEmit
npm test
npm run build
npm pack --dry-run
```

When work is documentation-only, verify source changes remain absent.

For source changes, document exactly which production files changed and why.

---

# 19. Performance Requirements

Any performance-related feature must report before/after measurements.

At minimum:

```text
Total runtime
Git/change discovery
Complexity provider
Coverage parsing
Coverage attribution
Evidence assembly
Rule evaluation
Output
```

Do not claim performance improvement from intuition.

---

# 20. Security Requirements

Every feature must consider:

- untrusted repository paths;
- symlinks;
- coverage-file size;
- malformed coverage;
- malicious repository contents;
- path traversal;
- subprocess execution;
- provider invocation;
- cache poisoning;
- stale cache data;
- trace leakage.

Caching deserves particular attention. A cache must not allow one repository or revision to consume another repository's evidence.

---

# 21. Contract Strategy

Before adding fields to schema 0.4, determine whether the feature can be implemented through:

1. existing fields;
2. diagnostics;
3. trace artifacts;
4. CLI output;
5. separate sidecar evidence;
6. only then, a contract extension.

If a schema change is necessary:

- document the reason;
- define compatibility behavior;
- add fixtures;
- add regression tests;
- update the contract;
- update downstream consumers;
- update release/checklist documentation.

---

# 22. UX Design Principle

CheckChange should answer three questions quickly.

### What happened?

```text
2 changed functions generated WARN evidence.
```

### Why?

```text
Complexity increased while exercised coverage decreased.
```

### What should I inspect?

```text
calculateOrderTotal()
```

Everything else should be available when the user wants deeper evidence.

---

# 23. Potential Future CLI

Conceptual target only:

```text
checkchange
checkchange doctor
checkchange explain
checkchange trace
checkchange --json
checkchange --baseline <ref>
```

Potential behavior:

```text
checkchange
    human-oriented evidence

checkchange --json
    machine-readable evidence

checkchange doctor
    environment diagnostics

checkchange explain
    decision/provider explanation

checkchange trace
    execution diagnostics
```

Do not implement these commands without reconciling them against the current CLI architecture.

---

# 24. Potential Future Evidence Artifacts

A mature run could conceptually produce:

```text
checkchange/
├── evidence.json
├── lineage.json
├── trace.jsonl
└── summary.txt
```

Where:

### `evidence.json`
Stable machine-readable evidence.

### `lineage.json`
Where the evidence came from.

### `trace.jsonl`
How the run executed.

### `summary.txt`
Human-oriented result.

This is a candidate architecture, not a requirement.

---

# 25. How These Improvements Support Engram

The improvements should make CheckChange more useful to Engram without making CheckChange dependent on Engram.

Potential flow:

```text
Engram / coding agent
        |
        v
      change
        |
        v
   CheckChange
        |
        +--> evidence
        +--> lineage
        +--> completeness
        +--> fingerprint
        |
        v
Engram reviewer/orchestrator
```

Engram could use evidence to decide where additional review attention is appropriate.

CheckChange itself should not need to know that Engram exists.

---

# 26. Potential Human Review Experience

A mature reviewer interaction could look like:

```text
CheckChange: 2 WARN / 10 changed functions

WARN  calculateOrderTotal
      Complexity: 12 → 17
      Coverage:   84% → 61%
      Evidence:   attributed
      Why:        complexity increased and exercised coverage decreased

WARN  applyDiscount
      Complexity: 8 → 16
      Coverage:   unavailable
      Evidence:   incomplete
      Why:        complexity increased; coverage could not be established

PASS  8 other changed functions
```

No LLM is required to produce the evidence.

An LLM can optionally consume the evidence afterward.

---

# 27. What Success Would Look Like

These improvements should make CheckChange:

### More trustworthy
Because users can trace evidence.

### More honest
Because evidence quality and completeness are explicit.

### Easier to debug
Because execution traces explain failures.

### Easier to use
Because `doctor` and `explain` reduce configuration ambiguity.

### Faster
If incremental analysis and caching produce measured improvements.

### More useful to reviewers
Because deltas and function-level presentation focus attention.

### Easier to integrate
Because machine-readable evidence, lineage, and fingerprints provide stable boundaries.

---

# 28. What Success Would NOT Mean

Do not use these improvements to claim:

- CheckChange predicts defects.
- CheckChange proves correctness.
- CheckChange determines software risk with certainty.
- CheckChange replaces human review.
- CheckChange output is equivalent to expert engineering judgment.
- More metadata automatically means better evidence.

The goal is better evidence infrastructure, not a larger claim.

---

# 29. Recommended Immediate Experiment

If only one experiment is started first, choose:

## Evidence Trust Layer

Start with:

1. lineage;
2. completeness/quality;
3. fingerprint.

Reason:

These three improvements reinforce the central product proposition more directly than additional language support or UI work.

They also create a foundation for:

- tracing;
- caching;
- CI;
- downstream AI consumption;
- reviewer UX.

The first prototype should remain additive and should avoid changing the frozen contract until evidence demonstrates that a contract change is necessary.

---

# 30. Human Decision Gate

Before implementation, the human owner should decide which experiment, if any, is authorized.

Recommended options:

```text
A — Approve Evidence Trust Layer
B — Approve Observability Layer
C — Approve Performance Layer
D — Approve Reviewer UX Layer
E — Approve a different experiment
F — Do not implement these changes yet
```

An LLM must not choose among these options autonomously.

---

# 31. Final Guidance to Any Implementing LLM

If this document is provided to an implementation LLM:

1. Read the repository's authoritative instructions first.
2. Inspect the actual current code before planning changes.
3. Treat this document as a candidate-improvement specification, not permission to implement everything.
4. Do not assume proposed structures already exist.
5. Do not change schema 0.4 without explicit justification and approval.
6. Do not introduce LLM judgment into the deterministic evidence pipeline.
7. Do not weaken existing security protections.
8. Do not silently change status semantics.
9. Do not optimize before measuring.
10. Do not add a feature simply because it is technically interesting.
11. Record assumptions.
12. Record deviations.
13. Add deterministic tests for every behavior change.
14. Preserve backward compatibility where required.
15. Produce evidence that allows a human to determine whether the change actually improved CheckChange.

The standard should remain:

> **Measure → implement narrowly → test → verify → document → decide whether to keep.**

Not:

> **Imagine → build → assume improvement.**
