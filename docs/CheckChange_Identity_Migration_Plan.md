# CheckChange Identity Migration Plan

**Project:** CheckChange  
**Current development state:** Mid-WP12, paused at the approval gate pending the product/repository rename  
**Rename status:** Not yet executed  
**WP11:** Complete  
**WP12:** Planned/partially prepared, implementation paused  
**Scope:** Identity, repository, documentation, metadata, and naming migration only

## 1. Executive Decision

The project is now named:

> **CheckChange**

Preferred positioning:

> **CheckChange is an independent, deterministic evidence and verification layer for AI-assisted software development.**

Preferred tagline:

> **AI writes. We check the change.**

The rename is intentionally being performed **before development resumes**.

This is important because the repository is now beyond the experimental prototype stage. WP10 established capability/product direction and WP11 established a production evidence contract. WP12 is validating the integration boundary in real CI. The rename should therefore establish the durable product identity before additional implementation accumulates under the old name.

The rename is still **not** a functional enhancement pass.

## 2. Current Project State

The latest project-state material establishes:

- WP10 Capability and Product Definition is complete.
- WP11 Production Evidence Contract is complete.
- Schema 0.2 is frozen.
- Thresholds 30/15 are frozen.
- INV-01 through INV-04 are preserved.
- WP11 contract tests are 10/10, with 191/191 repository tests passing.
- TypeScript passes.
- Build passes.
- No source changes were made by WP11.
- WP12 is the next active work package.
- WP12 is focused on CI integration validation.
- The selected WP12 path is Fork A: two GitHub Actions pipelines in this repository.
- P1 represents the default coverage path.
- P2 represents explicit `--coverage-file` plus `--crap-threshold`.
- WP12's purpose is to measure the real integration boundary, not to improve the engine prematurely.
- The WP12 plan has five tasks covering CI scaffolding, local dry run documentation, a measurement specification, evidence/results packets, and regression guards.
- Implementation is paused at the explicit approval gate.
- No WP12 source implementation has started.
- The intended WP12 scope is `.github/workflows/` plus documentation/evidence, with no `src/` change unless evidence later demonstrates that the engine itself is the problem.

The rename should preserve this exact state.

Relevant project instructions explicitly say to execute only the next roadmap step, build the human-review packet, avoid autonomous usefulness classification, and stop at approval gates. fileciteturn22file0L4-L20

The current project status also records WP10 and WP11 as complete and WP12 CI integration validation as the next work package. fileciteturn22file1L38-L58

## 3. Critical Constraint: Rename Before WP12 Resumes

Development is currently paused specifically so the rename can be completed cleanly.

Therefore:

1. Do not resume WP12 implementation during the rename.
2. Do not flip the WP12 approval gate.
3. Do not create the WP12 workflows as part of this rename.
4. Do not modify WP12 measurement results because none should exist yet.
5. Do not begin WP13, WP14, or WP15.
6. Complete and verify the identity migration first.
7. Only after the rename is accepted should the normal WP12 approval-gate process resume.

The latest `OPENCODE_START_HERE.md` explicitly records the WP12 state as planned and paused at the approval gate, with no implementation started and `src/` clean. fileciteturn22file0L28-L33

## 4. What the Rename Must NOT Change

Do not change:

- schema 0.2;
- threshold 30;
- threshold 15;
- INV-01;
- INV-02;
- INV-03;
- INV-04;
- evidence semantics;
- changed-function detection;
- complexity calculations;
- coverage attribution;
- deterministic CRAP;
- PASS/WARN behavior;
- error vocabulary;
- provenance semantics;
- contract semantics;
- WP11 contract tests;
- WP12 scope;
- WP12 fork selection;
- WP12 measurement questions;
- WP12 approval-gate state;
- WP9/WP11 historical conclusions.

The expected result is:

> **Same engine, same contract, same evidence semantics, same WP11 state, same WP12 plan, new product identity.**

## 5. Repository-Wide Identity Inventory

Before changing anything, search the entire repository for all known forms of the old identity.

Search:

- source files;
- package metadata;
- CLI metadata;
- README;
- documentation;
- `docs/`;
- `experiments/`;
- `.opencode/`;
- agent instructions;
- CI;
- scripts;
- Docker/devcontainer configuration;
- environment examples;
- badges;
- repository URLs;
- issue/PR templates;
- examples;
- filenames and directory names.

Use case-insensitive searches and likely punctuation variants.

For example:

    git grep -n -i "<old-name>"

Also search for old repository/package/CLI identifiers separately.

Every occurrence must be classified as one of:

1. **CURRENT_PRODUCT_IDENTITY**
2. **HISTORICAL_REFERENCE**
3. **TECHNICAL_TERM**
4. **THIRD_PARTY_REFERENCE**
5. **COMPATIBILITY_IDENTIFIER**
6. **FALSE_POSITIVE**

Do not perform a blind global replacement.

## 6. Historical Evidence Rule

WP0-WP9 and earlier experiment artifacts are historical records.

The rename should not falsify their provenance.

If an old project name appears in an experiment or historical report, it may remain.

Where current documentation needs to explain the relationship, use wording such as:

> This project, now named CheckChange, was referred to as `<old-name>` at the time of the experiment.

Do not rewrite historical experiment conclusions simply to normalize branding.

Do not rename historical evidence artifacts merely for aesthetic consistency.

Preserve:

- commit SHAs;
- engine versions;
- artifact names;
- historical filenames;
- reproduction instructions;
- historical conclusions;
- timestamps;
- experiment terminology.

## 7. WP10/WP11 Documentation

Current-facing WP10 and WP11 references should use CheckChange where they describe the current product.

The WP11 contract should remain technically identical.

In particular, preserve the documented contract for:

- input;
- output;
- error vocabulary;
- CLI behavior;
- determinism;
- provenance;
- compatibility;
- validation;
- INV-01..04.

Do not modify contract semantics merely because the product name changes.

## 8. WP12 Documentation and Planning

The WP12 plan is now the immediate future execution artifact.

The rename should ensure it describes CheckChange as the product being integrated into CI.

However, the rename must not alter the actual WP12 experimental design.

Preserve the current WP12 design:

### Fork A

Two GitHub Actions pipelines in this repository:

- P1: default coverage path.
- P2: explicit `--coverage-file` + `--crap-threshold`.

The WP12 measurement objective remains the integration boundary.

The planned measurement areas include:

- setup complexity;
- failure modes;
- evidence completeness;
- developer comprehension;
- CI cost;
- reproducibility.

The roadmap's planned nine metrics must remain whatever is specified by the authoritative WP12 measurement specification/roadmap. Do not invent or alter them during the rename.

The rename should not create the workflows prematurely.

## 9. Project Status

Update `PROJECT_STATUS.md` to reflect the latest state.

It must no longer imply that the project is at WP5.6, WP6, or merely WP9.

It should accurately reflect:

    Project: CheckChange

    WP10: COMPLETE
    WP11: COMPLETE
    Current work package: WP12 — CI Integration Validation

    Current state:
    WP12 planned and paused at explicit human approval gate

    WP12 Fork:
    Fork A — two GitHub Actions pipelines in this repository

    Implementation:
    Not started / paused pending approval

    Source state:
    src/ clean

    WP11 regression baseline:
    191/191 tests passing
    TypeScript: 0 errors
    Build: passing

    Contract:
    schema 0.2 frozen
    thresholds 30/15 frozen
    INV-01..04 preserved

Do not state that WP12 is complete.

Do not state that WP12 implementation has begun if it has not.

Do not claim CI evidence exists until it actually exists.

The current status source explicitly records WP12 as the next work package and says the implementation is paused at the approval gate. fileciteturn22file1L55-L58

## 10. OpenCode Start-Here Instructions

Update `OPENCODE_START_HERE.md`.

The document should continue to direct the LLM to read the authoritative roadmap and current-state materials before acting.

It should state the current step accurately:

> **WP12 — CI Integration Validation, paused at explicit human approval gate pending rename completion.**

After the rename is complete, the document should direct OpenCode to resume through the existing WP12 approval process rather than treating the rename as WP12 implementation.

Preserve the existing rules:

- execute only the next roadmap step;
- build the human-review packet;
- do not autonomously classify usefulness;
- end results with `AWAITING HUMAN REVIEW` where human review has not been supplied;
- after human review, use `CONTINUE`, `CONTINUE WITH CONSTRAINTS`, or `STOP` as directed.

These are existing project controls and should not be weakened by the rename. fileciteturn22file0L12-L28

## 11. README / Product Positioning

The README should establish:

    # CheckChange

    Independent, deterministic evidence for AI-assisted software development.

    AI writes. We check the change.

Describe CheckChange as an evidence/verification layer, not merely a CRAP calculator.

Explain that it consumes measurable evidence such as:

- changed functions;
- complexity;
- coverage;
- deterministic CRAP;
- evidence completeness;
- provenance;
- contract-defined outputs.

Avoid unsupported claims.

Do not claim:

- defect prediction;
- proof of correctness;
- autonomous approval;
- replacement for human review;
- universal language support;
- universal coverage-provider support;
- universal monorepo support;
- complete historical per-commit coverage validation.

## 12. Canonical Product Description

Use:

> CheckChange is an independent, deterministic evidence and verification layer for AI-assisted software development. It analyzes software changes using caller-provided evidence such as changed functions, complexity, coverage, and deterministic CRAP calculations, producing machine-readable evidence and risk signals for human or AI-assisted review.

Short form:

> Independent, deterministic evidence for software changes.

Primary tagline:

> AI writes. We check the change.

Optional supporting humor:

> Because “trust me, I tested it” isn't evidence.

Use humor sparingly. The technical positioning must remain clear.

## 13. Package Metadata

Inspect:

- `package.json`;
- lockfiles;
- npm package metadata;
- `bin`;
- scripts;
- repository/homepage/bugs fields.

If the package is internal/unpublished and safe to rename, use the CheckChange identity.

If already externally consumed, do not make a breaking package rename without understanding the compatibility implications.

If a compatibility alias is required:

- make CheckChange canonical;
- preserve the old identifier deliberately;
- document the compatibility reason.

## 14. CLI Identity

Preferred future-facing CLI:

    checkchange

If the current CLI has another name:

1. determine whether it is externally consumed;
2. determine whether it is published;
3. determine whether a compatibility alias is required;
4. only then rename.

Do not alter:

- command behavior;
- flags;
- output schema;
- error behavior;
- threshold semantics.

The existing WP12 design specifically depends on CLI behavior and flags, so the rename must not accidentally invalidate the experiment.

## 15. Source Code

Search `src/` and related implementation files.

Only rename product-facing identifiers where necessary.

Do not rename generic technical identifiers such as:

- `crap`;
- `complexity`;
- `coverage`;
- `evidence`;
- `analyzer`.

Do not refactor the engine.

The latest project status establishes that the current engine has had no source changes since the later WP9 hardening rounds and that WP11 was deliberately doc-only. fileciteturn22file1L43-L52

Keep that property intact.

## 16. Tests

Update tests only when they explicitly assert the old product identity.

Do not alter test logic or expected technical behavior.

The WP11 contract test suite must remain semantically unchanged.

Current baseline:

- 191/191 repository tests;
- 10/10 WP11 contract tests;
- TypeScript 0 errors;
- build passes.

After the rename, all must still pass.

## 17. CI / Configuration

Inspect:

- `.github/workflows/`;
- scripts;
- `.env.example`;
- Docker files;
- devcontainer files;
- configuration.

The important distinction is:

> **Do not create WP12 CI workflows as part of this rename unless they already exist.**

The latest state says `.github` is missing and no WP12 implementation has started.

The rename should therefore prepare names/documentation for the upcoming workflows without accidentally performing WP12.

If an identity change is required in a configuration file, make only that change.

## 18. Repository URL and GitHub Identity

Search for the current repository URL and references.

If the GitHub repository itself is being renamed, prefer:

    checkchange

Update current-facing references, badges, package metadata, and documentation.

Do not rewrite historical URLs that are intentionally part of archived evidence unless there is a concrete reason.

Use GitHub redirects/compatibility behavior where applicable rather than rewriting history.

## 19. Directory / File Naming

Consider renaming current product-facing directories/files if the old name is embedded in them.

However:

- do not rename historical evidence files merely for aesthetics;
- do not rename files referenced by historical reproduction procedures unless necessary;
- do not create broad path churn;
- update all current references if a current file is renamed.

Prefer the smallest coherent rename.

## 20. Graphify

After the repository's final identity state is established, run the normal Graphify refresh procedure.

Do this once after the rename rather than repeatedly during editing.

Verify that the resulting graph reflects the final repository state.

## 21. Git History

Do not rewrite history.

Use a focused commit such as:

    chore: rename project to CheckChange

Keep functional changes out of the rename commit.

If the repository itself is renamed on GitHub, treat that as repository metadata rather than a reason to rewrite Git history.

## 22. Verification Strategy

The rename must be verified at three levels.

### A. Identity verification

Confirm:

- CheckChange appears in current product-facing documentation;
- current repository metadata is consistent;
- current CLI/package identity is addressed;
- current agent instructions are consistent.

### B. Historical verification

Confirm:

- historical WP0-WP9 artifacts remain traceable;
- old names retained for provenance are intentional;
- no historical claim has been silently rewritten.

### C. Technical verification

Run:

- full test suite;
- WP11 contract tests;
- TypeScript;
- build;
- CLI smoke test.

Then verify that the WP11 baseline remains:

    191/191
    tsc = 0 errors
    build = pass
    contract = schema 0.2
    thresholds = 30/15
    INV-01..04 = preserved

## 23. Before/After Evidence Check

If practical, execute one existing deterministic case before and after the rename.

Compare:

- changed functions;
- intervals;
- complexity;
- coverage;
- CRAP;
- status;
- gate;
- schema;
- provenance.

Expected:

    product identity: changed
    technical evidence: unchanged

Any unexpected technical difference is a blocker and must be investigated before development resumes.

## 24. WP12 Resume Gate

After the rename is complete, **do not automatically resume WP12**.

The normal process remains:

1. human confirms the rename is acceptable;
2. existing WP12 plan approval state is handled according to the project instructions;
3. only then does the WP12 implementer execute Tasks 1–5;
4. WP12 produces its human-review packet;
5. results end with `AWAITING HUMAN REVIEW` when required.

This preserves the project's deliberate stop-at-gate discipline.

## 25. Fork Awareness After WP12

The rename must not prejudge WP12 outcomes.

Possible evidence-driven outcomes remain:

### Outcome A — Integration is reliable

Potential next direction:

- continue toward real-world validation/usefulness study.

### Outcome B — Integration is fragile but caller-side

Potential action:

- improve caller/workflow documentation or integration tooling;
- do not modify the engine unless evidence requires it.

### Outcome C — Integration is fragile because of contract design

Potential action:

- revisit the evidence contract;
- document the defect;
- modify the contract only through a new controlled work package.

### Outcome D — Provider-format problem

Potential action:

- define/validate provider adapters or caller normalization;
- do not prematurely generalize the engine.

### Outcome E — Engine defect

Potential action:

- isolate a reproducible engine defect;
- create a narrowly scoped corrective work package;
- preserve the frozen contract unless evidence requires a versioned change.

### Outcome F — Insufficient usefulness signal

Potential action:

- move toward the planned usefulness/human-review study;
- do not automatically conclude that the product is useful or not useful.

The rename must leave all of these paths open.

## 26. Engram Relationship

Keep CheckChange independently branded.

Potential future relationship:

    AI Coding Agent
          |
          v
      CheckChange
          |
    deterministic evidence
          |
          v
        Engram
          |
    interpretation/review
          |
          v
        Human

Do not rename CheckChange as an Engram component.

## 27. Acceptance Criteria

### Identity

- [ ] CheckChange is the canonical product/project name.
- [ ] `checkchange` is the canonical lowercase machine identifier where appropriate.
- [ ] README is updated.
- [ ] current documentation is updated.
- [ ] package identity is addressed.
- [ ] CLI identity is addressed.
- [ ] current repository metadata is addressed.

### Current-State Accuracy

- [ ] WP10 remains complete.
- [ ] WP11 remains complete.
- [ ] WP12 is identified as the current work package.
- [ ] WP12 is identified as paused at its approval gate.
- [ ] no claim says WP12 implementation has begun.
- [ ] no WP12 CI results are fabricated.
- [ ] `src/` remains unchanged by the rename unless a genuinely product-facing identifier requires it.

### Historical Integrity

- [ ] WP9 evidence remains unchanged.
- [ ] WP10/WP11 historical records remain traceable.
- [ ] Round 8 evidence remains traceable.
- [ ] historical terminology is preserved where needed.
- [ ] historical limitations remain explicit.

### Technical Integrity

- [ ] 191/191 tests pass.
- [ ] WP11 contract tests pass.
- [ ] TypeScript passes with 0 errors.
- [ ] build passes.
- [ ] CLI works.
- [ ] schema 0.2 remains unchanged.
- [ ] thresholds 30/15 remain unchanged.
- [ ] INV-01..04 remain intact.
- [ ] CRAP remains unchanged.
- [ ] coverage attribution remains unchanged.
- [ ] PASS/WARN remains unchanged.

### Repository Integrity

- [ ] no unexplained current-facing old-name references remain;
- [ ] remaining old-name references are classified;
- [ ] URLs are consistent;
- [ ] agent instructions are consistent;
- [ ] Graphify is refreshed after final changes.

## 28. Final Principle

This migration should establish CheckChange as the durable identity immediately before WP12 resumes.

Do not use the rename as an excuse to refactor.

If a functional improvement is discovered:

1. document it;
2. do not implement it;
3. finish the rename;
4. report it separately.

If an identity change would alter behavior, stop and investigate.

The desired end state is:

> **CHECKCHANGE IDENTITY ESTABLISHED**  
> **WP12 STILL PAUSED AT APPROVAL GATE**  
> **ENGINE AND CONTRACT UNCHANGED**  
> **DEVELOPMENT READY TO RESUME THROUGH THE EXISTING WP12 GATE**
