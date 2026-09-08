# WP17 Product-Value Validation Plan

**Source:** CheckChange WP17/WP18 Plan (Desktop/CheckChange/CheckChange_WP17_WP18_Plan.md, sections 1-5)  
**Baseline Version:** 0.4.0 (package.json:3)  
**Baseline Commit:** 4fbae48750684c6cee434f426fdd1f853eaffecf  
**Schema Version:** 0.4.0 (Frozen, JS+React additive)  
**Test Count:** 233/233 passing (baseline)

---

## 1. Purpose

WP16 established architecture general under tested conditions: core evidence pipeline language-agnostic, language-specific complexity extraction isolated behind providers.

WP17 stops optimizing for feature expansion. Central question:

> **Does CheckChange produce sufficiently useful, trustworthy, understandable, reproducible, and independent evidence to justify adoption in an AI coding workflow?**

WP17 is validation phase, not feature-count phase. No new language added solely for extensibility.

---

## 2. Objective

Validate CheckChange against real/representative development changes. Determine whether evidence changes review behavior usefully without unacceptable noise, ambiguity, workflow friction, or coupling to particular AI coding agent.

Seven questions to answer:

1. Does CheckChange consistently identify changes worth reviewing?
2. Does it avoid excessive noise on ordinary low-risk changes?
3. Can engineer understand why a change received its evidence/risk signal?
4. Does behavior remain consistent across repositories (not just curated corpus)?
5. Can CheckChange operate independently of the AI coding agent?
6. Does evidence remain useful when consumed by another system?
7. Does a human reviewer actually do something differently because CheckChange exists?

Q7 is most important.

---

## 3. Scope

### In Scope
- Existing CheckChange core and supported providers
- TypeScript/JavaScript/React/Python coverage already demonstrated
- Existing evidence contract/schema (v0.4.0)
- Existing deterministic rules and CRAP-derived signals
- Real historical changes and/or controlled AI-generated changes
- CI-oriented execution
- Human review of generated evidence
- Evidence reproducibility
- Evidence interpretability
- False-positive/false-negative observations
- Workflow burden
- Independence from coding agent
- Potential downstream consumption by another agent/system

### Out of Scope
- Adding multiple new programming languages
- Building full SaaS product
- Building IDE plugin
- Building autonomous AI reviewer
- Replacing human code review
- Claiming CheckChange proves correctness
- Claiming CheckChange predicts defects with universal accuracy
- Training ML model on evidence
- Broadening Evidence Contract for future product features

Required product changes discovered during WP17 = findings first, not auto-implemented.

---

## 4. Core Principle

Maintain architectural separation from WP16:

```
AI Coding Agent
       |
       | code change
       v
   CheckChange
       |
       | deterministic evidence
       v
Evidence / Risk Signal
       |
       +----> Human reviewer
       |
       +----> Downstream agent/system
```

CheckChange independent of upstream coding agent identity, vendor, model, prompt, implementation.

AI creates change → CheckChange checks change.

---

## 5. WP17 Work Packages

### WP17.1 Baseline Freeze
Before experimentation:
- Freeze current CheckChange source baseline
- Record version and commit (0.4.0, 4fbae48)
- Record current schema version (0.4.0)
- Record current test count (233/233)
- Record current supported languages/providers (TS/JS/React via @barney-media/crap-typescript v0.5.0 patch; Python via pythonASTComplexityProvider)
- Record current performance baseline
- Record current security assumptions (dep patch pinned; local AST scanning with filename boundary checks)
- Confirm 233/233 baseline tests passing
- Confirm TypeScript compilation and build
- Capture reproducible baseline report

**Acceptance:** Clean baseline reproducible from fresh checkout.

### WP17.2 Validation Corpus
Construct corpus broader than existing dev/test corpus.

Prefer:
- Multiple repositories (2-3 minimum)
- Multiple repository sizes
- Multiple application types
- Multiple change sizes
- Multiple complexity profiles
- Multiple coverage levels
- Changes genuinely altering behavior
- Primarily mechanical changes
- Test modifications
- Production code changes without corresponding tests
- Changes touching already-complex functions
- Changes touching low-complexity functions

Include historical changes where practical (avoids current project knowledge bias).

**Constraint:** Do not select cases expected to make CheckChange look good. Record selection criteria before evaluating results.

### WP17.3 AI-Agent Independence
Run at least part of validation through AI coding workflow.

Establish:
- CheckChange consumes completed change without knowing which agent created it
- Evidence pipeline does not depend on agent's reasoning
- Evidence does not depend on agent agreeing with CheckChange
- CheckChange invocable as independent verification step

Multi-agent comparison useful but not required for initial WP17 gate.

### WP17.4 Evidence Usefulness
For each validation case capture:
- Change description
- Repository/context
- Changed functions
- Complexity
- Coverage
- CRAP or other risk signals
- Evidence status
- Warnings/incompleteness
- Relevant diagnostics
- Human reviewer interpretation
- Human reviewer action

Reviewer answers:
1. Was evidence understandable?
2. Did it identify anything worth examining?
3. Did it cause additional investigation?
4. Did it change review priority?
5. Was evidence misleading?
6. Was important context missing?
7. Would reviewer want this in normal workflow?

Do not turn subjective answers into autonomous product claims. Report as observed human-review evidence.

### WP17.5 Noise and Signal Analysis
Classify outcomes:
- Useful signal
- Useful confirmation
- Benign/noise
- Misleading signal
- Incomplete evidence
- Unable to evaluate

No forced binary "correct/incorrect" classification. Goal: understand CheckChange as evidence infrastructure.

Track:
- High-risk evidence reviewers agreed deserved attention
- Low-risk evidence reviewers agreed could receive less attention
- Genuinely useful warnings
- Warnings creating unnecessary investigation
- Cases where CheckChange lacked sufficient evidence

### WP17.6 Reproducibility
For selected cases:
1. Run CheckChange
2. Preserve evidence
3. Repeat run
4. Compare results

Historical cases: reproduce from clean checkout.

Validate stability of:
- Changed-function attribution
- Complexity
- Coverage attribution
- Status semantics
- Schema output (except explicitly nondeterministic metadata)

Nondeterminism = WP17 finding.

### WP17.7 Downstream Consumption
Test whether evidence understandable/usable by another consumer.

Initially: simple deterministic consumer or human-readable transformation.

Purpose: not build another AI system. Question:

> **Can another system consume CheckChange's evidence without needing to understand how CheckChange internally works?**

Tests Evidence Contract as product boundary.

### WP17.8 Workflow Cost
Measure practical overhead:
- Installation/setup
- Runtime
- Required inputs
- CI configuration
- Failure handling
- Diagnostic clarity
- Evidence size
- Human interpretation time

Technically useful signal with disproportionate workflow burden should not auto-pass WP17.

---