# Reviewer Grounding Protocol – No Claim Without Tool Evidence

## Purpose

This document defines the mandatory protocol for any reviewer subagent (Engram or cavecrew-reviewer) to produce a grounded review. Prose approval without tool evidence is invalid.

---

## 1. Mandatory Pre-Flight: Bind Target

Before any review call, bind the absolute repository path:

```bash
engram_bind_target targetRepo: "/absolute/path/to/repo"
```

This ensures review logs, delta markers, and knowledge entries store under the correct `.engram/` directory.

---

## 2. Mandatory Review Call

Invoke `engram_review_changes` with all required fields:

```json
{
  "diff": "<git diff --cached or git diff HEAD>",
  "task": "Review staged changes before commit",
  "files": ["src/cli.ts", "src/coverage.ts"],
  "context": "TypeScript CLI tool, Node 24, no network surface",
  "designIntent": "Fix case-insensitive path matching and remove @ts-nocheck",
  "layer": "cli"
}
```

Capture the returned `sessionId` — every finding references this.

---

## 3. Mandatory Bash Evidence

Run and capture output for each check. Cite file:line for every finding.

| Check | Command | Expected Output |
|-------|---------|-----------------|
| Type check | `npx tsc --noEmit` | `SUCCESS (0)` |
| Unit tests | `npx vitest run --no-coverage` | `XX passed, 0 failed` |
| Security audit | `npm audit --json` | `0 vulnerabilities` |
| Diff summary | `git diff --stat` | File list with +/- lines |

If any command fails, the review is incomplete — do not approve.

---

## 4. Finding Evaluation Protocol

For each finding returned by Engram:

1. **Read full finding** — all seven fields: `finding`, `evidence`, `risk`, `recommendation`, `confidence`, `severity`, `category`
2. **Verify evidence in code** — `read` the cited file:line. Wrong evidence = unreliable finding
3. **Assess confidence + severity** — Confidence ≥ 0.9: investigate seriously. 0.7–0.89: verify before acting. < 0.7: speculative, reject unless independently verified
4. **Decide** — `accept` (apply fix), `modify` (real problem, different fix), or `reject` (false positive)
5. **Report** — `engram_report_review_action` with `sessionId`, `status`, `note`
6. **Re-review** — If any fix applied, re-stage, re-run `engram_review_changes` on delta only

---

## 5. Prohibition: Prose PASS Without Evidence

A review that states "PASS" or "approved" without:

- `sessionId` from `engram_review_changes`
- Tool output from §3 checks
- File:line citations for each finding

…is **invalid**. The reviewer must redo with tools.

If Engram MCP is unavailable, the reviewer must state explicitly:

> "MCP not available – fallback cavecrew-reviewer file:line + bash"

And then execute the fallback: read cited files, run bash checks, produce findings table with evidence.

---

## 6. Orchestrator Dispatch Template

When spawning a reviewer subagent, include this preamble:

```
STEP 0: Read the plan file; verify paths exist (`ls -d` or glob) and line numbers match; if not, STOP and report — do not guess.

STEP 1: Bind target repo
  engram_bind_target targetRepo: "<ABSOLUTE_REPO_PATH>"

STEP 2: Run review
  engram_review_changes with diff, files, task, context, designIntent, layer
  Capture sessionId and findings

STEP 3: Run mandatory bash evidence
  npx tsc --noEmit
  npx vitest run --no-coverage
  npm audit --json
  git diff --stat

STEP 4: Evaluate each finding
  Read cited file:line
  Decide accept/modify/reject
  engram_report_review_action for each

STEP 5: If fixes applied, re-stage and re-review delta

STEP 6: Output findings table

| Finding | Severity | Confidence | Evidence (file:line) | Verified | Decision |
|---------|----------|------------|----------------------|----------|----------|
| ...     | ...      | ...        | ...                  | Y/N      | accept/modify/reject |
```

---

## 7. Example Grounded Review Output

```markdown
## Review Result: PASS (grounded)

**sessionId**: rev-1788208834901-2

### Tool Evidence
- `npx tsc --noEmit`: SUCCESS (0)
- `npx vitest run --no-coverage`: 191 passed, 0 failed
- `npm audit --json`: 0 vulnerabilities
- `git diff --stat`: 3 files changed, 45 insertions(+), 12 deletions(-)

### Findings Table
| Finding | Severity | Confidence | Evidence (file:line) | Verified | Decision |
|---------|----------|------------|----------------------|----------|----------|
| Dynamic require in ESM | High | 0.95 | src/coverage.ts:63 | Y | accept |
| @ts-nocheck on CLI parser | Medium | 0.90 | src/cli.ts:1 | Y | accept |
| TOCTOU in normalizeCoveragePaths | Medium | 0.85 | src/coverage.ts:54-65 | Y | accept |
| Case-insensitive path match | Low | 0.60 | src/attribution.ts:62 | Y | reject |

### Actions Taken
- `engram_report_review_action` called for each finding with sessionId
- No re-review needed (no fixes applied in this review)
```

---

## 8. Quick Reference Checklist

- [ ] `engram_bind_target` called with absolute path
- [ ] `engram_review_changes` invoked, `sessionId` captured
- [ ] `npx tsc --noEmit` run, output captured
- [ ] `npx vitest run --no-coverage` run, counts captured
- [ ] `npm audit --json` run, output captured
- [ ] `git diff --stat` run, output captured
- [ ] Every finding cites file:line verified via `read`
- [ ] Decision (accept/modify/reject) recorded per finding
- [ ] `engram_report_review_action` called for each finding
- [ ] If fixes applied: re-stage, re-review delta
- [ ] Final output includes findings table with evidence

---

## 9. Anti-Patterns to Avoid

| Anti-Pattern | Why Invalid |
|--------------|-------------|
| "Tests pass" without counts | No evidence |
| "No issues found" without tool output | No evidence |
| Finding cites file but not line | Unverifiable |
| Confidence/severity missing from decision | Uncalibrated |
| Accepting finding without reading cited code | Blind trust |
| Rejecting finding without independent verification | Dismissive |

---

*End of protocol. No prose approval without tool evidence.*