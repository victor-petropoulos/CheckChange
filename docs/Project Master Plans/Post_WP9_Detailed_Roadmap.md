# Post-WP9 Roadmap: Deterministic CheckChange / CRAP Evidence Engine

**Status:** Provisional roadmap after WP9 closure  
**Purpose:** Define the likely path from the completed WP9 evidence/hardening phase through the eventual product/architecture decision, while preserving evidence-driven forks instead of assuming every future work package is mandatory.

---

## 0. How to Use This Roadmap

This is a **provisional execution roadmap**, not a commitment to execute WP10 through WP17 sequentially.

WP9 established a strong deterministic evidence-engine baseline under the tested conditions. After WP9, the central questions change from:

> Can the deterministic evidence engine behave correctly?

to:

> What should this engine actually be used for, and does it provide enough practical value to justify further investment?

The correct operating model is therefore:

```text
WP9 closure
    |
    v
WP10: capability/product definition
    |
    +--> integration is the biggest gap -> WP11/12
    |
    +--> language breadth is the biggest gap -> WP13
    |
    +--> historical/delta analysis is required -> WP14
    |
    +--> practical usefulness is uncertain -> WP15
    |
    v
Evidence-driven product/architecture decision
```

A work package should proceed only when its predecessor's evidence demonstrates that it is necessary or valuable.

---

# 1. CURRENT BASELINE AFTER WP9

WP9 provides evidence for a deterministic CheckChange pipeline that can:

- identify changed functions;
- consume complexity evidence;
- consume coverage evidence;
- attribute coverage deterministically;
- distinguish zero coverage from unavailable coverage;
- distinguish missing evidence from malformed evidence;
- calculate CRAP deterministically;
- evaluate frozen thresholds;
- produce PASS/WARN/incomplete-style outcomes;
- preserve truthful analyzer status;
- expose machine-readable evidence;
- support an Evidence API;
- support a minimal CI gate;
- preserve provenance;
- operate across the tested repositories and environments;
- process a materially larger monorepo coverage artifact;
- perform historical Git/change analysis;
- produce historical complexity delta.

These claims remain bounded by the actual experiments.

The project should not claim:

- universal language support;
- universal coverage-provider compatibility;
- universal monorepo compatibility;
- fully validated historical per-commit coverage;
- defect prediction;
- causal proof that a high CRAP score causes defects;
- autonomous risk judgment;
- replacement of human review.

CRAP should remain a deterministic risk-oriented signal, not a probability of failure or a complete quality score. The original CRAP formulation combines cyclomatic complexity and coverage and was empirically fitted to subjective judgments rather than established as a universal defect predictor. citeturn0search5

---

# 2. ROUND 8 LIMITATION THAT MUST CARRY FORWARD

WP9 Round 8 attempted historical/delta validation.

The historical Git/change and complexity portions were genuine.

However, the TSDoc/Rush historical environment could not execute under the available Node v24.18.1 runtime because the repository required an older Node range.

As a result, Round 8 reused the Round 7 full-union coverage artifact.

The correct characterization is:

> **Partial historical/delta validation with real historical complexity/change evidence and reused/non-historical coverage evidence.**

This must not later become a claim that historical per-commit coverage has been validated.

If historical coverage becomes important later, perform a new experiment using a reproducible compatible environment. Do not rewrite Round 8.

---

# 3. STRATEGIC SHIFT AFTER WP9

The project should now move from:

> Can we make the engine work?

toward:

> Where does this engine create enough value to justify becoming something larger?

Future work should increasingly measure:

- integration cost;
- developer experience;
- review usefulness;
- false-positive burden;
- false-negative limitations;
- runtime cost;
- operational reliability;
- compatibility;
- explainability;
- decision impact.

A useful principle is:

> **The deterministic engine should produce evidence. It should not pretend to know more than its evidence supports.**

---

# 4. WP10 — CAPABILITY AND PRODUCT DEFINITION

## Objective

Determine exactly what the project should become after WP9.

WP10 should primarily define the problem, user, capability, claims, and decision criteria rather than immediately adding code.

## Questions

1. Who is the intended user?
2. What decision is the system supposed to improve?
3. What is the smallest useful workflow?
4. What evidence does the caller provide?
5. What does the deterministic engine calculate?
6. What does the engine explicitly refuse to infer?
7. What does the human or LLM do with the result?
8. Is this a standalone tool, an Engram capability, or both?
9. What claims should the project eventually make?
10. What evidence would be necessary to support those claims?

## Candidate product forms

### A. Standalone deterministic risk engine

```text
Git change
   |
Evidence generation
   |
Deterministic CRAP engine
   |
JSON / CLI / CI gate
```

Advantages:

- simple boundary;
- independently useful;
- easy to integrate;
- clean deterministic contract.

Risks:

- may become another isolated developer tool;
- usefulness may be limited if not integrated into review workflows.

### B. Engram capability

```text
Coding LLM
    |
    v
Engram
    |
    +--> deterministic code evidence
    |       +-- changed functions
    |       +-- complexity
    |       +-- coverage
    |       +-- CRAP
    |
    +--> LLM reasoning/review
    |
    v
Human
```

Advantages:

- strong separation between evidence and interpretation;
- potentially fits the broader Engram architecture.

Risks:

- coupling to Engram;
- premature product architecture;
- unclear boundaries between evidence and interpretation.

### C. Both

A standalone engine with an Engram adapter.

This may ultimately be the strongest architecture because the deterministic component remains independently testable while Engram can consume it.

Do not commit to this until evidence supports it.

## WP10 deliverables

- capability definition;
- target-user/use-case definition;
- supported-claim matrix;
- non-goals;
- success metrics;
- product-shape decision;
- prioritized research questions;
- provisional next branch.

## Exit criterion

WP10 is complete when there is a clear answer to:

> **What problem are we solving, for whom, and what evidence would demonstrate that we solve it?**

---

# 5. WP10 EVIDENCE-DRIVEN FORKS

### Fork A — Integration is the biggest gap

Proceed to WP11/12.

Example: the engine is technically sound, but the main uncertainty is whether CI systems can reliably feed it evidence and consume its output.

### Fork B — Historical/delta capability is strategically important

Proceed to WP14.

Example: the intended product promise explicitly includes risk introduced by a change relative to its previous revision.

### Fork C — Language breadth is strategically important

Proceed to WP13.

Example: the target environment is polyglot and TypeScript evidence is insufficient.

### Fork D — Practical usefulness is uncertain

Proceed to WP15 earlier.

Example: the engine works, but nobody has demonstrated that reviewers make better decisions with the signal.

### Fork E — Product direction is not compelling

Do not build more merely because the prototype works. Run a smaller research/decision phase or stop/hold.

---

# 6. WP11 — PRODUCTION EVIDENCE CONTRACT

## Objective

Turn the frozen prototype semantics into a stable contract that external systems can consume without understanding implementation details.

## Areas

### 11.1 Input contract

Define exactly what the caller must provide:

- changed functions;
- complexity;
- coverage;
- file paths;
- provenance;
- repository identity;
- revision;
- configuration.

### 11.2 Output contract

Define:

- result;
- function-level evidence;
- CRAP;
- coverage;
- complexity;
- status;
- completeness;
- provenance;
- diagnostics.

### 11.3 Error semantics

Preserve:

- zero;
- null/unavailable;
- missing;
- malformed;
- Git unavailable;
- repository invalid;
- analyzer failure.

### 11.4 Versioning

Define:

- schema version;
- compatibility rules;
- forward/backward compatibility;
- breaking-change policy.

### 11.5 Determinism

Same evidence + same configuration + same engine version should produce equivalent output.

### 11.6 Provenance

A consumer should be able to answer:

- Which revision?
- Which functions?
- Which complexity source?
- Which coverage source?
- Which configuration?
- Which thresholds?
- Which engine version?

## Exit criterion

An external consumer should be able to use the evidence output without understanding the engine internals.

---

# 7. WP12 — REAL INTEGRATION VALIDATION

## Objective

Determine whether the engine works reliably in actual engineering workflows.

## Canonical workflow

```text
Pull request
   |
Determine changed functions
   |
Run tests
   |
Generate coverage
   |
Run deterministic engine
   |
Generate evidence
   |
   +--> CI gate
   +--> reviewer report
   +--> downstream LLM
```

## Measure

- runtime;
- setup complexity;
- failure modes;
- evidence completeness;
- developer comprehension;
- CI cost;
- reproducibility;
- path handling;
- artifact handling;
- configuration burden.

The engine may be deterministic while the evidence-generation environment is not. WP12 should therefore measure the integration boundary, not only the engine.

## Forks

### If integration is reliable

Proceed toward real-world validation.

### If integration is fragile

First determine whether the problem is:

- caller-side;
- coverage-provider-specific;
- environment-specific;
- documentation/configuration;
- engine contract;
- engine defect.

Only engine defects belong in the engine hardening path.

### Example

If a CI system produces coverage paths that cannot be mapped:

1. determine whether the format is supported;
2. determine whether normalization belongs in the contract;
3. determine whether the caller should normalize;
4. only then decide whether the engine needs a change.

Do not add ad-hoc compatibility rules simply to make one repository pass.

---

# 8. WP13 — LANGUAGE / ECOSYSTEM EXPANSION

## Objective

Determine whether the deterministic evidence architecture generalizes beyond TypeScript.

This is an architectural validation exercise, not a language popularity checklist.

## Selection criteria

Evaluate candidate languages by:

- strategic relevance;
- ecosystem maturity;
- complexity tooling;
- coverage tooling;
- changed-function extraction;
- attribution difficulty;
- architectural difference from TypeScript;
- expected user value.

## Adapter model

```text
                Evidence Contract
                       |
        +--------------+--------------+
        |              |              |
   TypeScript       Python          C#
   provider         provider       provider
        |              |              |
        +--------------+--------------+
                       |
                Deterministic Engine
```

The language-specific layer should produce normalized evidence.

The core engine should remain language-neutral.

## Example

```text
Git diff
  |
changed functions
  |
complexity provider
  |
coverage provider
  |
normalized evidence
  |
existing CRAP engine
```

The real question is:

> Can another ecosystem produce evidence that satisfies the same deterministic contract?

## Forks

### Clean fit

The architecture gains credibility.

### Requires core-engine changes

Stop and investigate whether:

- the adapter boundary is insufficient;
- the contract is too TypeScript-specific;
- coverage assumptions are wrong;
- language-specific semantics need explicit modeling.

Do not immediately rewrite the core.

### Low strategic value

Defer the language.

---

# 9. WP14 — HISTORICAL / DELTA CAPABILITY

## Objective

Only pursue this as a major work package if historical risk is part of the intended capability.

The goal is to close the specific evidence gap identified by Round 8.

## Correct experiment

For commit A:

```text
commit A
   |
   +--> changed functions A
   +--> complexity A
   +--> fresh coverage A
   |
   v
risk A
```

For commit B:

```text
commit B
   |
   +--> changed functions B
   +--> complexity B
   +--> fresh coverage B
   |
   v
risk B
```

Then compare:

```text
risk A
   +
risk B
   |
   v
historical delta
```

This is materially different from reusing one coverage artifact for both revisions.

## Environment

The historical repository must execute reproducibly.

Possible mechanisms:

- Node version manager;
- container;
- pinned CI image;
- documented compatible runtime.

Do not alter the engine merely to accommodate an incompatible repository environment.

## Success criteria

- reproducible historical checkout;
- fresh coverage for each revision;
- correct changed-function detection;
- correct complexity;
- correct coverage;
- correct attribution;
- deterministic CRAP;
- meaningful comparison.

## Fork

### Historical analysis is required

Complete the validation.

### Historical analysis is interesting but nonessential

Run a smaller experiment or defer.

### Historical analysis is not part of the intended capability

Do not spend significant engineering effort on it.

---

# 10. WP15 — REAL-WORLD / HUMAN USEFULNESS VALIDATION

## Objective

Move from:

> The signal is technically correct.

to:

> The signal improves engineering decisions.

This is potentially the most important post-WP9 phase.

## Questions

For real changes:

- Does a reviewer notice high-risk functions?
- Does the ranking focus attention?
- Does it identify issues missed by ordinary coverage?
- Does it create too many warnings?
- Does it help prioritize tests?
- Does it increase review time unnecessarily?
- Do developers attempt to game it?
- Does it improve review confidence?

## Example

```text
Function A
CC = 4
Coverage = 90%
CRAP = low
```

versus:

```text
Function B
CC = 12
Coverage = 10%
CRAP = 116.97
```

Coverage alone can make both look like coverage problems. CRAP provides a basis for prioritizing the complex, weakly covered function.

The human study must determine whether that distinction actually helps.

## Critical guardrail

Do not conclude "CRAP is useful" merely because the distinction is intuitive.

Collect actual human evidence.

Possible evidence:

- reviewer decisions;
- review time;
- tests added;
- defects discovered;
- qualitative feedback;
- reviewer agreement.

---

# 11. WP15 FORKS

### Reviewers consistently value WARN cases

Proceed toward productization.

### Reviewers ignore the signal

Investigate presentation and workflow before changing the metric.

### Too many false positives

Consider additional contextual evidence such as:

- dependency impact;
- change size;
- ownership;
- business criticality;
- history.

Do not immediately weaken CRAP.

### High-CRAP changes are frequently important

This strengthens the case for risk-based review.

### No meaningful difference

Reconsider whether CRAP is the right signal or whether additional evidence is required.

---

# 12. WP16 — ENGINEERING / RELEASE HARDENING

Only after the capability has demonstrated sufficient value should the project invest heavily in production hardening.

## Performance

Measure:

- repository size;
- changed-function count;
- coverage artifact size;
- runtime;
- memory.

## Scalability

Test:

- large repositories;
- large coverage files;
- large monorepos;
- many changed functions.

## Caching

Potential model:

```text
unchanged functions -> cached evidence
changed functions   -> fresh evidence
```

Introduce caching only if measurements demonstrate the need.

## Parallelism

Use profiling before adding concurrency.

## Security

Consider:

- untrusted repositories;
- coverage artifacts;
- malicious paths;
- malformed JSON;
- resource exhaustion;
- command execution boundaries.

## Packaging

Eventually define:

- installation;
- versioning;
- release artifacts;
- upgrade path;
- compatibility matrix.

## Fork

### Performance already acceptable

Keep the architecture simple.

### Specific bottleneck measured

Optimize that bottleneck.

### Optimization requires semantic changes

Do not compromise deterministic semantics for speed.

---

# 13. WP17 — FINAL PRODUCT / ARCHITECTURE DECISION

At this point the project may have evidence from:

- deterministic correctness;
- repository validation;
- integration;
- language expansion;
- historical analysis;
- human usefulness;
- operational measurements.

Then make one decision.

## Option A — Productize standalone

Choose if:

- users have a clear use case;
- integration cost is manageable;
- the signal is useful;
- architecture is stable.

## Option B — Integrate into Engram

Choose if:

- deterministic evidence materially improves Engram;
- evidence/interpretation separation is valuable;
- Engram is the natural workflow context.

Potential architecture:

```text
                 Developer Change
                        |
                        v
                    Engram
                        |
             +----------+----------+
             |                     |
             v                     v
     Deterministic Evidence       LLM
             |                     |
             |                     v
             |                Interpretation
             |                     |
             +----------+----------+
                        |
                        v
                      Human
```

The deterministic engine remains authoritative for its facts. The LLM may interpret them but should not silently alter them.

## Option C — Keep as research/tooling

Choose if:

- the evidence is valuable;
- product value is limited;
- experimentation remains useful;
- production investment is not justified.

## Option D — Stop

Choose if:

- real-world value is insufficient;
- integration cost is excessive;
- the signal adds little;
- evidence does not justify further investment.

Stopping is a valid result.

---

# 14. CROSS-CUTTING PRINCIPLES

## 14.1 Evidence before inference

```text
FACT
  |
  v
DETERMINISTIC EVIDENCE
  |
  v
METRIC
  |
  v
RISK SIGNAL
  |
  v
INTERPRETATION
  |
  v
HUMAN DECISION
```

The first four layers should remain distinguishable from LLM inference.

## 14.2 Never turn CRAP into probability

A score is not a percentage chance of failure.

## 14.3 Show ingredients

Prefer:

```text
CRAP = 116.97
Complexity = 12
Coverage = 10%
```

over an unexplained:

```text
Risk = HIGH
```

## 14.4 Avoid composite-score inflation

Do not automatically create an opaque score from:

```text
CRAP + churn + ownership + dependency + history + business criticality
```

First establish whether each signal adds independent value.

Prefer an evidence packet with independently visible signals.

## 14.5 Do not use the metric as a developer-performance score

The metric describes code/change characteristics, not developer quality.

## 14.6 Protect against gaming

If this becomes a gate, consider whether developers or coding agents can manipulate:

- coverage exclusions;
- test scope;
- complexity definitions;
- changed-function selection;
- thresholds;
- evidence artifacts.

---

# 15. FUTURE EVIDENCE THAT WOULD BE PARTICULARLY VALUABLE

## 15.1 More real historical cases

Especially cases where:

- CRAP rises;
- CRAP falls;
- coverage rises;
- complexity rises;
- complexity falls;
- the gate changes;
- the gate remains stable.

## 15.2 Actual defect linkage

Eventually compare signals against:

- bug-fixing commits;
- reverted changes;
- production incidents;
- defect tickets;
- post-release defects.

Do not assume correlation.

## 15.3 Human review outcomes

Measure:

- reviewer agreement;
- review prioritization;
- time;
- tests added;
- defects found;
- warnings ignored.

## 15.4 Agentic coding workflows

Eventually evaluate:

```text
LLM writes change
       |
       v
deterministic evidence
       |
       v
CRAP / risk signal
       |
       v
LLM reviewer
       |
       v
additional tests/refactoring/review
```

This could become particularly valuable in Engram because the evidence is independent of the coding model's own narrative.

---

# 16. EXAMPLE FUTURE WORKFLOW

Suppose a PR changes four functions:

```text
Function A
CC = 3
Coverage = 92%
CRAP = low
PASS

Function B
CC = 8
Coverage = 75%
CRAP = low
PASS

Function C
CC = 12
Coverage = 10%
CRAP = 116.97
WARN

Function D
CC = 5
Coverage = 0%
CRAP = 30
```

The deterministic engine should stop there.

A downstream review system might:

1. prioritize Function C;
2. inspect the diff;
3. inspect dependency impact;
4. assess whether tests characterize the behavior;
5. ask an agent to add tests;
6. rerun coverage;
7. recompute CRAP;
8. verify the resulting evidence.

This is a possible future workflow, not a reason to implement it immediately.

---

# 17. COMPLETE POST-WP9 DECISION TREE

```text
                    WP9 CLOSED
                         |
                         v
                  WP10 Definition
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
       Product        Integration     Research
       unclear         priority       priority
          |              |              |
          v              v              v
      narrow          WP11/12       choose highest
      validation                       value gap
          |                              |
          +--------------+---------------+
                         |
                         v
                Is real-world value
                   demonstrated?
                         |
              +----------+----------+
              |                     |
             NO                    YES
              |                     |
              v                     v
         WP15 / research       Production path
              |                     |
              v                     v
       revise / stop         WP16 hardening
                                    |
                                    v
                              WP17 decision
                                    |
                +-------------------+------------------+
                |                   |                  |
                v                   v                  v
            Standalone           Engram             Research/
             product           integration           stop
```

This is a decision tree, not a mandatory waterfall.

---

# 18. RECOMMENDED PRIORITY

If no new evidence changes the situation:

### Priority 1

Complete and approve **WP9 closure**.

### Priority 2

Perform **WP10 capability/product definition**.

### Priority 3

Select the highest-value evidence branch:

- WP11/12 for integration;
- WP14 for required historical/delta capability;
- WP15 for practical usefulness;
- WP13 for strategically important language generality.

### Priority 4

Perform **WP16 production hardening** only after sufficient value is demonstrated.

### Priority 5

Make the **WP17 product/architecture decision**.

---

# 19. WHAT SHOULD NOT BECOME A ROADMAP REQUIREMENT

These remain optional unless evidence makes them necessary:

- universal language support;
- every coverage provider;
- every CI provider;
- every monorepo architecture;
- full historical analysis;
- real-time IDE integration;
- automated test generation;
- LLM-based risk classification;
- machine-learning risk prediction;
- an overall project-risk score;
- enterprise dashboards;
- cloud-hosted analysis;
- telemetry.

Each requires a concrete use case and evidence-based justification.

---

# 20. STOPPING RULE FOR EVERY FUTURE WP

Before implementation, every future work package should answer:

1. What uncertainty are we resolving?
2. What evidence would resolve it?
3. What will we do if the evidence is positive?
4. What will we do if the evidence is negative?
5. What is the minimum experiment or implementation required?
6. What would make us stop?

If those questions cannot be answered, the work package is probably premature.

---

# 21. FINAL STRATEGIC VIEW

The most important outcome of WP9 is not simply that the engine passes tests.

The project has established a disciplined separation between:

```text
FACT
  |
  v
DETERMINISTIC EVIDENCE
  |
  v
METRIC
  |
  v
RISK SIGNAL
  |
  v
INTERPRETATION
  |
  v
HUMAN DECISION
```

The long-term opportunity is potentially stronger if those boundaries remain explicit.

A future AI coding system could say:

> I think this change is safe.

The deterministic evidence engine could independently say:

> Complexity increased, coverage is low, CRAP is high, and the deterministic gate is WARN.

Those are different kinds of information.

The project's potential value may ultimately come from keeping them separate.

---

# 22. PROVISIONAL HAPPY-PATH ROADMAP

If the evidence is consistently positive:

```text
WP9
  |
  v
WP10
  |
  v
WP11
  |
  v
WP12
  |
  +--> WP13 if language breadth matters
  |
  +--> WP14 if historical delta matters
  |
  v
WP15
  |
  v
WP16
  |
  v
WP17
```

This is only a skeleton.

The actual order should change based on findings.

For example:

- If WP12 shows integration is easy but reviewers do not value the signal, move WP15 earlier.
- If WP10 establishes historical risk as a required product capability, move WP14 earlier.
- If WP13 reveals that the evidence contract is not language-neutral, architecture work moves ahead of productionization.
- If WP15 shows little practical value, stop rather than continuing to harden the engine.
- If WP16 discovers that performance is already acceptable, do not optimize simply because optimization is available.

---

# 23. FINAL GUIDING PRINCIPLE

> **Do not build the next capability because it is possible; build or test it because the evidence says it is necessary to answer the next important question.**

That principle should govern the project after WP9 just as rigorously as the deterministic evidence principle governed the project through WP9.
