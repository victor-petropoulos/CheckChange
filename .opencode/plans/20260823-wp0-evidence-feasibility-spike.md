---
task: "WP0 — Evidence Feasibility Spike (per docs/implementation/UGLY_PROTOTYPE_OPENCODE_PROJECT_PLAN.md §5)"
created: 2026-08-23T02:00:00+10:00
approved: false
tasks:
  - id: "1"
    description: |
      Step 0.1 — Controlled fixture. Inside experiments/wp0/fixture/ create tiny TS project:
      package.json (npm, ESM, Node 24), tsconfig.json (strict), vitest + coverage config,
      ESLint flat config, src with baseline function + modified function + new function,
      tests passing. Baseline = simple functions. Changed version introduces branching
      (enough to materially raise CRAP) while tests still pass.
      git init INSIDE fixture only. Commit baseline, then apply change as second commit
      so git diff base..HEAD shows the delta.
    agent: "implementer"
    files:
      - "experiments/wp0/fixture/**"
    acceptance: >
      cd experiments/wp0/fixture && npx tsc --noEmit exits 0; npx vitest run passes;
      git log shows >= 2 commits; baseline commit diffable vs HEAD.
      Raw command transcripts saved under experiments/wp0/notes/.
    depends_on: []

  - id: "2"
    description: |
      Steps 0.2–0.5 — Tool inspection. In fixture dir:
      (a) Install @barney-media/crap-typescript in FIXTURE ONLY (never target repos).
      (b) Run npx crap-typescript --format json AND npx crap-typescript --changed --format json.
          Preserve unmodified stdout to experiments/wp0/raw/crap-full.json / crap-changed.json.
          Document exact schema: function identifier, path form, complexity field,
          coverage field, CRAP field, thresholds/result fields, error shapes,
          unavailable-coverage representation, behavior for NEW vs CHANGED functions.
      (c) Run vitest coverage; capture output; decide: does crap-typescript already carry
          enough coverage data, or is direct coverage ingestion needed, or deferred?
          Prefer simplest option (plan §5 Step 0.3).
      (d) npx tsc --noEmit — record PASS/FAIL/UNAVAILABLE semantics + raw transcript.
      (e) ESLint machine-readable (-f json) — record PASS/FAIL semantics + finding counts value.
    agent: "implementer"
    files:
      - "experiments/wp0/raw/**"
      - "experiments/wp0/notes/**"
    acceptance: >
      Every raw tool output preserved byte-for-byte in experiments/wp0/raw/.
      notes/ contains field-by-field schema observations each citing the raw file they came from.
      No post-processing of raw files.
    depends_on: ["1"]

  - id: "3"
    description: |
      Step 0.6 — Git correlation experiment. Using fixture git history:
      correlate crap-typescript --changed output against git-changed files for:
      modified function, new function, renamed function (if easy), deleted function (if easy).
      Record match quality per case. CRITICAL: if reliable function-level correlation
      requires custom AST parsing → STOP that path, document limitation. NO AST PARSING EVER.
    agent: "implementer"
    files:
      - "experiments/wp0/raw/**"
      - "experiments/wp0/notes/**"
    acceptance: >
      Correlation matrix in notes/ covering all tested cases, each verdict backed by
      named raw output file + git command used.
    depends_on: ["2"]

  - id: "4"
    description: |
      Write docs/research/WP0_EVIDENCE_FEASIBILITY.md:
      method, per-step findings, evidence citations (raw file paths),
      limitations, and END WITH EXACTLY ONE recommendation line:
      GO | GO WITH CONSTRAINTS | STOP — supported by spike evidence only.
    agent: "implementer"
    files:
      - "docs/research/WP0_EVIDENCE_FEASIBILITY.md"
    acceptance: >
      Report exists; every factual claim cites a raw artifact or reproducible command;
      ends with exactly one recommendation token; no claims beyond spike evidence.
    depends_on: ["3"]

  - id: "5"
    description: "Reviewer pass over report + raw artifacts: verify evidence supports recommendation, no scope creep (no analyzer code, no abstractions), constraints honored."
    agent: "reviewer"
    files:
      - "docs/research/WP0_EVIDENCE_FEASIBILITY.md"
      - "experiments/wp0/**"
    acceptance: "Findings triaged; report revised if needed; final recommendation stands on cited evidence."
    depends_on: ["4"]

constraints:
  - "Node 24 active before any command (nvm use)"
  - "No production scaffolding, no WP1 work, no generalized abstractions"
  - "No source-code analysis / AST parsing / complexity or coverage instrumentation implemented by us"
  - "crap-typescript installed in fixture only"
  - "Raw outputs preserved unmodified"
  - "Report ends with exactly one: GO / GO WITH CONSTRAINTS / STOP"
