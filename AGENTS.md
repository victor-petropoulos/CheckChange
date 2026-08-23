# AGENTS.md — agent instructions
## Engram Review Gate

Priority: review work at unit boundaries, not just before commit, so findings
land before large amounts of work are built on top.

Engram runs as an MCP server providing independent code review. Its tools
(`review_plan`, `review_changes`, `review_delta`, `explain_finding`,
`report_review_action`, `bind_target`) are available through your coding
agent's MCP integration.

### Target repo

By default Engram detects the project from the parent process. For a
deterministic target, call `bind_target` once with the absolute repo path;
review logs, delta markers, and knowledge entries are then stored under that
repo's `.engram/` until rebound.

### Workflow

1. **Plan review** — Before coding, call `review_plan` to validate approach
2. **Code** — Implement the approved plan
3. **Unit-boundary review** — At each unit boundary (completed feature,
   complete file, green test run), call `review_delta` with `task`
   describing the unit. The server computes the delta since the last review
   — do not reconstruct diffs manually.
4. **Pre-commit review** — Before every commit:
   a. Stage changes: `git add -A`
   b. Get staged diff: `git diff --cached` or `git diff HEAD`
   c. Call `review_changes` with:
      - `task`: "Review staged changes before commit"
      - `diff`: staged diff
      - `files`: array of changed file paths
      - `context`: language, framework, project area (e.g. "Python CLI, no HTTP")
      - `designIntent`: what the change does and why
      - `layer`: architecture layer (e.g. cli, data-layer, api-gateway)
   d. Evaluate findings using the Finding Evaluation Protocol:
      - Read the full finding (evidence + confidence + severity)
      - Verify evidence in the code
      - Decide: accept | modify | reject
      - Call `explain_finding` if uncertain (requires sessionId from the review call)
      - Report action via `report_review_action`
      - Re-stage and re-review if any changes were made
   e. Commit only after all Critical/High findings are resolved (a finding
      explicitly rejected via `report_review_action` counts as resolved)
5. **Follow up** — Use `explain_finding` for detail on any finding, and
   `report_review_action` to log resolution

### Edge cases

- `review_delta` returns `no_delta` → nothing changed since last review, continue.
- Empty diff (no changes) → no review needed, commit directly
- Review timeout or error → log warning, proceed with commit
- Can't resolve a finding → add `engram-review: unfixed <finding>` as
  git trailer
- Fix introduces new code → re-stage, re-review the delta only

### Finding Evaluation Protocol

Apply the following to every finding before taking any action.

1. **Read the full finding** — All seven fields: `finding`, `evidence`, `risk`, `recommendation`, `confidence`, `severity`, `category`. Do not skip `evidence` and `confidence`.
2. **Verify the evidence** — Evidence references a file:line? Read that location. Quotes a diff line? Confirm the meaning. Describes a pattern? Check sibling files. Wrong evidence = unreliable finding.
3. **Assess confidence + severity** — Confidence ≥ 0.9: investigate seriously. 0.7–0.89: likely correct, verify before acting. 0.5–0.69: speculative, strongly consider rejecting unless independently verified. < 0.5: suggestion, not an action item. **Severity measures impact if correct, not confidence it is correct.**
4. **Decide action** — `accept` (apply fix), `modify` (real problem, different fix), or `reject` (false positive). Report via `report_review_action`.
5. **When uncertain, call `explain_finding(findingId)`** — ID is `sessionId:index`, sessionId from the review call. Returns the finding's structured fields for focused evaluation.
