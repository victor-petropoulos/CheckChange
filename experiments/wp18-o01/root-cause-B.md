# Root Cause B — OICP-MCP UNSUPPORTED null gate (T1)

Mem:41224.

Date: 2026-09-11.

## Verbatim Outputs

### Auto-base reproduction (reproducible → UNSUPPORTED)
```command
$ node dist/cli.js check --json --verbose
[verbose] auto-detected base: master
{
  "schemaVersion": "0.4",
  "analysis": {
    "base": "81ceffafc3990f81d59ee578c498246fba25609c"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [],
  "analysisStatus": "UNSUPPORTED",
  "gate": null,
  "completeness": "NOT_APPLICABLE"
}
```

### --base HEAD reproduction (replicable → SUCCESS/PASS)
```command
$ node dist/cli.js check --json --base HEAD
{
  "schemaVersion": "0.4",
  "analysis": {
    "base": "d906c56fb400cc71f9eaf95179ddbef7a3afcffe",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "absent"
  },
  "changedFunctions": [],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

### Git evidence chain
```command
$ git remote -v              # No remotes → fallback to candidates
$ git rev-parse master       # master = 81ceffafc3990f...
$ git rev-parse HEAD         # HEAD   = d906c56fb400c...
$ git merge-base master HEAD # d906c56 (HEAD) → master is descendant
$ git diff --name-only master # README.md only
$ git log --oneline -1 master # 81ceffa fix: correct architecture link in README
```

```json
{
  "master": "81ceffafc3990f81d59ee578c498246fba25609c",
  "HEAD": "d906c56fb400cc71f9eaf95179ddbef7a3afcffe",
  "merge-base": "d906c56fb400cc71f9eaf95179ddbef7a3afcffe",
  "diff_master_vs_worktree": ["README.md"],
  "master_commit_msg": "fix: correct architecture link in README"
}
```

## Evidence Summary

| Check | Result | Evidence File:Line |
|-------|--------|--------------------|
| dist build not stale vs bridge | PASS | bash: dist/cli.js mtime Sep 10 09:08 > e4dadd3 commit time Sep 10 08:53; src/coverage.ts mtime Sep 9 16:22. Bridge built into dist. |
| Python provider registered in dist | PASS | dist/ e4dadd3 commit; dist/complexity-providers/pythonASTComplexityProvider.js:4-5; dist/evidence.js:21. |
| coverageArtifact truth check (absent) | PASS | grep: no .coverage/coverage.xml/coverage.json in OICP-MCP. |
| capabilities.coverageArtifact = 'available' in UNSUPPORTED output | PASS | match fields: "coverageArtifact": "available". Not runtime-absent truth. |
| isUnsupportedIntervals precedence code path | PASS | refs: evidence.ts:172-192 includes hardcoded coverageArtifact: 'available' at 182. |
| changedFunctions = [] in UNSUPPORTED output | PASS | fields match evidence.ts:184. |
| git diff between base and worktree | PASS | git diff master vs worktree = README.md only. |
| intervals set contents (non-code only) | PASS | intervals = {README.md} only (.md, no .py/.ts/.js). |

## Verdict

**BASE-AUTO-DETECT WRONG-BRANCH (FIXED-AHEAD)**

NOT stalediff, NOT provider missing, NOT coverage-absent trigger.

1. **Tool base detection** (ref:git.ts:47-85): no remotes → candidate list → `master` resolves → base = 81ceffaf.
2. **Base vs HEAD relation**: `git merge-base master HEAD` = HEAD (d906c56f) → master is descendant, NOT ancestor. Tool compared descendant commit 81ceffaf against ancestor working tree d906c56f.
3. **Diff contents**: diff 81ceffaf → worktree = README.md only (1 file). Non-code extension = 📝 .md.
4. **Code path**: intervals = {README.md} → all non-supported extensions → `isUnsupportedIntervals` (evidence.ts:172→192) → UNSUPPORTED/null/NOT_APPLICABLE branch.
5. **Hardcoded capability lies**: `coverageArtifact: 'available'` hardcoded at evidence.ts:182 (NOT actual coverage presence). `changedFunctions: []` hardcoded at 184.

## Root Cause Chain

```
[repo]: no remotes
       ↓
[detectDefaultBase]: candidates → 'master' resolves
       ↓
[base commit]: master = 81ceffaf (descendant of HEAD)
       ↓
[git diff]: works vs 81ceffaf → README.md only
       ↓
[intervals]: {README.md} (non-code)
       ↓
[isUnsupportedIntervals] TRIGGERED
       ↓
[output]: UNSUPPORTED/gate=null/completeness=NOT_APPLICABLE
```

**Reference lines:**
- git.ts:47-85 (detectDefaultBase)
- evidence.ts:172-192 (isUnsupportedIntervals branch, coverageArtifact='available' at 182, changedFunctions='[]' at 184)
- cli.ts:10-103 (base=auto from args + detectDefaultBase)

## Why History Looks Weird

OICP-MCP created on feature branch `wp18-case-010` (d906c56f) which is ancestor of local `master`. No `origin` remote → tool falls back to `master` (a descendant commit 1 ahead: README). Feature branch not yet merged to default branch → historical workflow mismatch. `wp18-case-010` remained local, `master` was not pushed/merged. "Dirty tree" state = untracked files (new .py + unrelated dirs), NO tracked modifications, so diff remains README-only.

## No Coverage Artifacts Matter Here

Coverage is absent in OICP-MCP (verified: no .coverage, coverage.xml, coverage.json), but coverageArtifact='available' in output is a hardcoded side effect of the isUnsupportedIntervals branch - NOT a runtime truth. This is a **secondary misreporting bug** (out of scope: no src edits), but evidence proves no real coverage data exists.

## Runnable Checks (.copy to TASKS)

- [ ] `git remote -v` → empty in OICP-MCP (reproducible)
- [ ] `git rev-parse master`+`HEAD`→ merge-base=HEAD (verifies descendant)
- [ ] `git diff --name-only master` → repro: README.md only
- [ ] `node dist/cli.js check --json --verbose` → reproduces `[verbose] auto-detected base: master`
- [ ] `node dist/cli.js check --json --base HEAD` → reproducible SUCCESS/PASS (empty diff baseline)
- [ ] ls .coverage* coverage* → confirms absence

## Next Decision (Task B output to T2 planner)

Options for OICP-MCP T2:
- lock base ref to `HEAD` (fix detectDefaultBase; `--base HEAD` from CLI + fallback: `HEAD` when no remotes exist)
- skip OICP-MCP (replicate Code-Index-MCP behavior by running T2 only if branch unmerged with default)
- note as error-mode artifact in reproducibility test (memo field: "git API detected base = master (1 commit ahead: description fix)") + accept mis-match as WP18 historical workflow.

Mem cite: mem:41224.