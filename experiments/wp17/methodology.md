# WP17 Validation Methodology

**Selection Criteria Frozen Before Runs** — Answer Q1–Q7 before executing any case

---

## Seven Selection Criteria Questions (Frozen Before Execution)

### Q1. Repository Selection
**Which repositories will be used, and why?**
- Criteria: size, language coverage, application type, availability of historical changes, CI accessibility
- Must include at least 2, ideally 3 independent repositories
- At least one repository not previously used in CheckChange development

### Q2. Case Selection Method
**How are individual changes (commits/PRs) chosen within each repository?**
- Sampling strategy: random, stratified by change type, targeted historical
- Minimum 8 cases, maximum 12
- Categories covered: behavioral, mechanical, test-only, prod-without-test, high-complexity, low-complexity, historical, AI-generated
- Selection performed blind to CheckChange output (no preview of evidence before selection)

### Q3. Ground Truth Definition
**What constitutes "correct" or "useful" evidence for each case?**
- Human reviewer judgment protocol (WP17.4 reviewer questions 1–7)
- Noise/signal classification taxonomy (WP17.5 categories)
- Reproducibility thresholds (WP17.6 stability metrics)
- Downstream consumption test definition (WP17.7 consumer spec)

### Q4. AI-Agent Independence Protocol
**How is agent independence validated?**
- Coding agent(s) used for generating changes
- Invocation pattern: agent produces change → CheckChange runs independently
- No agent-specific configuration or integration in CheckChange pipeline
- Evidence that pipeline operates identically regardless of upstream agent

### Q5. Reproducibility Protocol
**How is reproducibility measured and what thresholds apply?**
- Run 1 → preserve evidence → Run 2 → compare
- Metrics: function attribution stability, complexity stability, coverage stability, status stability, schema stability
- Acceptable nondeterminism: explicitly documented only (e.g., timestamp metadata)
- Any other nondeterminism = finding

### Q6. Workflow Cost Measurement
**What overhead metrics are captured and what thresholds trigger concern?**
- Setup/install time
- Runtime per case
- Required inputs (coverage files, config, etc.)
- CI configuration complexity
- Failure diagnostic clarity (time to diagnose)
- Evidence output size
- Human interpretation time (reviewer self-report)

### Q7. Human Review Protocol
**How are human reviewers engaged and their judgments recorded?**
- Reviewer selection (familiarity with codebase, CheckChange experience)
- Blind vs. informed review conditions
- Standardized questionnaire (WP17.4 Q1–7)
- Recording format: structured notes + classification per WP17.5 taxonomy
- Aggregation method for Q1–Q7 gate answers

---

## Execution Order

1. **Freeze criteria** — Complete Q1–Q7 above, sign off
2. **Select repositories** — Per Q1
3. **Select cases** — Per Q2, record in corpus.md
4. **Run CheckChange** — Per reproducibility protocol (Q5)
5. **Capture evidence** — Store in evidence/
6. **Human review** — Per Q7, store in human-review/
7. **Noise/signal analysis** — Per WP17.5
8. **Downstream test** — Per Q4, Q7
9. **Cost measurement** — Per Q6
10. **Decision gate** — Answer WP17 seven questions

---

## Evidence Artifacts Produced

| Artifact | Location | Description |
|----------|----------|-------------|
| Raw CheckChange output | evidence/ | Per-case JSON evidence |
| Reproducibility diffs | reproducibility/ | Run1 vs Run2 comparisons |
| Human review notes | human-review/ | Per-case structured reviews |
| Case metadata | cases/ | Per-case context, selection rationale |
| Aggregate results | WP17_RESULTS.md | Gate answers + overall outcome |

---

## Sign-off

Selection criteria frozen by: orchestrator-wp17 Date: 2026-09-08

No changes to criteria after this point without documented amendment.