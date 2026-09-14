---
task: "Clean up type-only nits in src/evidence.ts and update docs for constraints"
created: "2026-09-14T17:43:47Z"
approved: true
repo_conventions:
  gate: "npx tsc --noEmit && npm test"
  entry_points: ["src/cli.ts"]
  review_hook: "none"
  graph_tool: "graphify"
risks:
  - { risk: "Accidentally changing logic while fixing nits", mitigation: "Run gate after each task and verify byte-identical output for unchanged inputs", signal: "Gate passes and npm test shows 87/391" }
  - { risk: "Missing other redundant unions", mitigation: "Grepping src/ for redundant | undefined after changes", signal: "Only the targeted union is removed" }
  - { risk: "Indent changes affect logic", mitigation: "Check that only whitespace changes", signal: "git diff shows only whitespace changes" }
  - { risk: "Docs change alters meaning", mitigation: "Verify that WP17_DECISION.md flag remains and no usefulness reclassification", signal: "Flag still present" }
guardrails: ["No runtime logic changes", "Only whitespace and type-only edits"]
max_rounds: 3
tasks:
  - id: "1"
    description: "Remove redundant | undefined in src/evidence.ts:210 (fingerprints?: already optional)"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts:210 — required for src-touching tasks; rejected: none (no alternative seam needed)"
    acceptance: "npx tsc --noEmit exit 0, npm test 87/391, git diff --stat src/ shows only evidence.ts with -1 line change (removal of ' | undefined'), and the line now reads 'fingerprints?: Record<string, string>'"
    impact: "consumers: [src/evidence.ts:210]; interface diff: -|undefined; migration: none"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Replace {} as Capabilities with {} satisfies Capabilities at src/evidence.ts:292"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts:292 — required for src-touching tasks; rejected: {} as Capabilities (redundant cast)"
    acceptance: "npx tsc --noEmit exit 0, npm test 87/391, git diff --stat src/ shows only evidence.ts with change from '{} as Capabilities' to '{} satisfies Capabilities' (or equivalent safe default), and the line still compiles"
    impact: "consumers: [src/evidence.ts:292]; interface diff: -as Capabilities +satisfies Capabilities; migration: none"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Indent cleanup at src/evidence.ts:219,227,504,536,662 to 2-space baseline"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts:219,227,504,536,662 — required for src-touching tasks; rejected: none (indent only)"
    acceptance: "npx tsc --noEmit exit 0, npm test 87/391, git diff --stat src/ shows only evidence.ts with changes limited to whitespace (no logic change), and the lines now conform to 2-space indent"
    impact: "consumers: [src/evidence.ts:219,227,504,536,662]; interface diff: none; migration: none"
    open_questions: "none"
    depends_on: ["2"]
  - id: "4"
    description: "Docs-only constraints touch: verify WP17_DECISION.md flag stays, no usefulness reclassification"
    agent: "implementer"
    files: ["experiments/wp17/WP17_DECISION.md"]
    seam: "experiments/wp17/WP17_DECISION.md:60 — required for docs-touching tasks; rejected: none"
    acceptance: "git diff shows no change to the flag line (or additive only if needed), and the file still contains the sentence 'This is a recommendation pending human decision.'"
    impact: "consumers: [experiments/wp17/WP17_DECISION.md:60]; interface diff: none; migration: none"
    open_questions: "none"
    depends_on: ["3"]
---