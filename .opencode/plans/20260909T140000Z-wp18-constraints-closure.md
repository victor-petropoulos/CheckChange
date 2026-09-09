---
task: "WP18 Constraints Closure — human review Q7 + 8→12 expansion"
created: "2026-09-09T14:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Documenter: sync WP17_RESULTS.md Q7 PENDING→ACCEPTED 2026-09-09 + constraints update (b CLOSED, a/c/d remain) + Outcome addendum"
    agent: "documenter"
    files: ["experiments/wp17/WP17_RESULTS.md"]
    acceptance: "grep -c DRAFT experiments/wp17/human-review/case-00*.md = 0; WP17_RESULTS.md Q7 row = ACCEPTED; Engram review_delta approved"
    depends_on: []
  - id: "2"
    description: "Implementer: 8→12 expansion packet — 2 multi-repo selections (Q1) + 1 high-CRAP/complex-fn + 1 random/stratified-sampled case (closes a/c/d)"
    agent: "implementer"
    files: ["experiments/wp17/corpus.md", "experiments/wp18/"]
    acceptance: "12 cases listed in corpus.md; evidence/ + reproducibility/ artifacts present for new cases; deterministic rerun 0-line diff"
    depends_on: ["1"]
  - id: "3"
    description: "Tester: verify gate — npx tsc --noEmit exit 0, grep -c DRAFT 0, git diff --stat docs-only"
    agent: "tester"
    files: ["package.json", "experiments/wp17/"]
    acceptance: "npx tsc --noEmit exit 0; grep -c DRAFT experiments/wp17/human-review/case-00*.md = 0; git diff --stat shows docs-only changes"
    depends_on: ["2"]
---