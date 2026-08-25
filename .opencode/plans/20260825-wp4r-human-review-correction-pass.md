---
task: "WP4R Human Review Correction Pass — fix 4 evidence issues without changing production code"
created: 2026-08-25T00:00:00Z
approved: true
tasks:
  - id: "1"
    description: "Replace all Target SHA: current with pinned SHAs, verify source/diff from exact revisions"
    agent: "researcher"
    files: ["experiments/wp4r-final/human-review-packet.md", "experiments/wp4r-final/human-review-diagnostics.md", "experiments/wp4r-final/aggregate-results.json"]
    acceptance: "No occurrence of 'Target SHA: current' remains; every case lists full SHA matching aggregate-results.json + per-case metadata.md + output-threshold JSON analysis.base/target (after correcting output JSON note); source/diff snippets verified via git show/diff against pinned SHAs; TARGET_SHA_UNRESOLVED marked if unresolvable (expected 0)"
    depends_on: []

  - id: "2"
    description: "Investigate Hono basePath routeIndex inconsistency at pinned target 81bda2e"
    agent: "researcher"
    files: ["experiments/wp4r-final/human-review-packet.md", "experiments/wp4r-final/human-review-diagnostics.md"]
    acceptance: "Packet shows complete basePath source from git show 81bda2e169ba26810c8044980f1cfea66912d720:src/helper/route/index.ts, exact diff 393ded9..81bda2e, and verdict: declared-elsewhere / genuinely undefined / truncation artifact / wrong revision — with UNRESOLVED if cannot determine; diagnostics records investigation steps"
    depends_on: ["1"]

  - id: "3"
    description: "Add complete evidence for hono-03 isAllowedSecFetchSite (source, diff, CC/coverage/CRAP, Istanbul)"
    agent: "researcher"
    files: ["experiments/wp4r-final/human-review-packet.md", "experiments/wp4r-final/human-review-diagnostics.md"]
    acceptance: "Packet entry for isAllowedSecFetchSite includes base d9f7b99, target 117d0a4, file path, line range from target SHA, complete function source, relevant diff hunks, changed lines, CC, coverage %, CRAP, Istanbul fnMap evidence, factual branch/validation description, blank classification"
    depends_on: ["1", "2"]

  - id: "4"
    description: "Redo Apollo diagnostics — identify Jest commands, exits, artifacts, reconcile with final-results"
    agent: "researcher"
    files: ["experiments/wp4r-final/human-review-packet.md", "experiments/wp4r-final/human-review-diagnostics.md", "docs/research/WP4R_FINAL_USEFULNESS_RESULTS.md"]
    acceptance: "Diagnostics/packet correctly identify Jest coverage commands (not Vitest) with exact command strings, coverage-exit.txt=1, stdout 0 bytes, stderr sizes 12128/8948/118679, no coverage/coverage-final.json artifact, prototype-exit 1 with analysisStatus SUCCESS gate PASS completeness values distinguished, existence at execution time stated, CONFIRMED/LIKELY/UNRESOLVED labels used, no overclaim beyond evidence, reconciled with WP4R_FINAL_USEFULNESS_RESULTS execution table"
    depends_on: ["1"]

  - id: "5"
    description: "Reconcile packet/diagnostics with WP4R_FINAL_USEFULNESS_RESULTS.md and record discrepancies"
    agent: "researcher"
    files: ["docs/research/WP4R_FINAL_USEFULNESS_RESULTS.md", "experiments/wp4r-final/human-review-packet.md", "experiments/wp4r-final/human-review-diagnostics.md"]
    acceptance: "Comparison table for pinned SHAs, coverage commands/exits, prototype exits, artifact paths, changed-function counts, completeness, PASS/WARN/NOT_EVALUATED counts, hono fallback; conflicts resolved to preserved evidence; if final-results doc has demonstrably wrong statement, discrepancy recorded with proposed correction and doc updated only if needed for internal consistency with exact change description"
    depends_on: ["1", "2", "3", "4"]

  - id: "6"
    description: "Verification gate — no production code changed, classifications blank, WP5 not started, evidence internally consistent"
    agent: "reviewer"
    files: ["experiments/wp4r-final/human-review-packet.md", "experiments/wp4r-final/human-review-diagnostics.md"]
    acceptance: "git diff --stat shows only packet/diagnostics (and conditionally final-results doc) touched; all classification fields remain [ ] blank; no threshold/behavior change; lint/test check passes; evidence verification commands reproducible"
    depends_on: ["5"]
---

# WP4R Human Review Correction Pass — Plan

## Context
WP4R final human-review packet augmented evidence but introduced 4 evidence-quality issues. Need narrow correction pass only. Production code freeze. WP5 not started.

## Prior findings to cite
- mem search: prior packet diagnostics gaps (h3 coverage cleaned, apollo 0-byte coverage, Istanbul None line mapping) — cite mem:obsid in subagent reports if found
- Preserved evidence: aggregate-results.json + per-case metadata.md have authoritative pinned target SHAs; output-threshold JSONs currently show analysis.target=current (stale) — reconcile

## Scope guardrails
- Do not change prototype behavior, CRAP arithmetic, thresholds, changed-function detection, coverage attribution, gate, test orchestration
- Do not classify samples; keep [ ] EXPECTED_PASS / [ ] QUESTIONABLE_PASS / [ ] UNDETERMINED blank
- Do not rerun full experiment unless needed to verify source/diff at pinned SHA
- Historical repos may be inspected via git show/diff at pinned SHA, not committed

## Task 1 — Target SHA correction (all 9 cases)
For each case (h3-01, h3-02, h3-03, hono-01, hono-02, hono-03, apollo-01, apollo-02, apollo-03):
- Replace Target SHA: current with full SHA from aggregate-results.json / metadata.md:
  - h3-01: 708a3aad41d8b17955af335a8b1dffac92e09d81
  - h3-02: d1da262a4f535f17e5a8ac2dd9dc4817d79ce9fc
  - h3-03: 6c773a4444adb6bd7f2aeefbe7abc3fd5030ebfa
  - hono-01: c4577e93746c4642d5e663509febcb803d20f47e
  - hono-02: 81bda2e169ba26810c8044980f1cfea66912d720
  - hono-03: 117d0a413fb021804e4996c3c79cdbac56e17b43
  - apollo-01: f6d0efac4d99375c67255aee6d9b2981753b6f55
  - apollo-02: db8a04b193c157d57d6fe0f187b1892afdda1b7d
  - apollo-03: 71f2517132a34563a14934f3971666b3691710f9
- Verify base SHAs match too
- For each PASS sample, re-extract source via git -C <repo> show <target>:<file> and diff via git diff <base>..<target> -- <file>; replace truncated/wrong-revision snippets; note TARGET_SHA_UNRESOLVED if cannot establish

## Task 2 — Hono basePath / routeIndex
- At hono repo, pinned target 81bda2e169ba... (check /tmp/wp4r-repos/hono or other preserved checkout; if not present, clone/fetch)
- Extract complete basePath function: git show 81bda2e:src/helper/route/index.ts | sed -n '...p' (determine exact lines via grep -n basePath)
- Extract diff: git diff 393ded9..81bda2e -- src/helper/route/index.ts
- Determine if routeIndex is declared elsewhere in valid scope, genuinely undefined, truncation artifact, or wrong revision
- Record corrected source/diff in packet; full investigation in diagnostics

## Task 3 — isAllowedSecFetchSite complete evidence
- At pinned target 117d0a4, extract full fn source, line range, diff hunks for src/middleware/csrf/index.ts
- Pull CC/coverage/CRAP from output-threshold-30.json: CC 3, coverage 100, CRAP 3 (verify per file)
- Istanbul evidence from hono-03 coverage/raw/default/coverage-final.json fnMap (expect None lines)
- Add factual description: branches, validation, optsSecFetchSite fn support, secFetchSite handling
- Blank classification

## Task 4 — Apollo diagnostics redo (Jest)
- For apollo-01/02/03: identify exact Jest coverage command from metadata.md / aggregate-results.json (node --expose-gc ... jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=... --runInBand --watchAll=false --testPathPatterns="...")
- Record coverage-exit.txt (all 1), stdout 0 bytes, stderr sizes 12128/8948/118679, artifact path coverage/coverage-final.json nonexistent, prototype-exit 1 with analysisStatus SUCCESS gate PASS
- Distinguish coverage-command exit vs prototype exit vs analysisStatus vs gate vs completeness
- Explain prototype exit 1 semantics from preserved evidence (SUCCESS despite exit 1 — likely indicates INCOMPLETE or non-zero due to NOT_EVALUATED handling; investigate prototype code/docs for exit semantics)
- Use CONFIRMED/LIKELY/UNRESOLVED appropriately; correct all Vitest-for-Apollo assertions

## Task 5 — Reconcile with WP4R_FINAL_USEFULNESS_RESULTS.md
- Compare pinned SHAs, coverage commands/exits, prototype exits, artifact paths, changed-fn counts, completeness, PASS/WARN/NOT_EVAL counts, hono fallback statements
- If conflict, preserved evidence (metadata/aggregate/coverage-exit.txt/prototype-exit) wins; record discrepancy + proposed correction
- Update final-results doc only if needed for internal consistency; describe exact change

## Verification
- Check no production code touched: git diff --stat
- Check classifications blank: rg "EXPECTED_PASS" packet (should be only blank checklist)
- Check no 'current' target SHA remains: rg "Target SHA: current" (0 hits)
- Check WP5 not started: no specs for WP5
