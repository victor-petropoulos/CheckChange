--- 
name: using-checkchange
description: Use when running checkchange check to enforce quality gates. Ensures correct invocation, WARN block invariant, coverage artifact validation, base branch handling, and CRAP literacy.

# Overview
Correct use of `checkchange check`: prevents hallucination, enforces WARN blocks merge, validates artifact, handles base, ensures CRAP understanding.

# When to Use
- Running `checkchange check` in PR/CI.
- Verifying changed functions within CRAP thresholds.
- Validating coverage artifact before gate eval.
- Auto-detecting base or specifying --base.

# What It Entails
1. `pnpm vitest run --coverage` → `coverage/coverage-final.json` (or jest coverage) — required before check
2. `checkchange check [--base <ref>] [--json] [--verbose]` — auto-detects base if omitted (origin/HEAD → origin/master/main → master/main)
3. Read gate + changedFunctions

# Requires
- `checkchange` CLI in PATH.
- Coverage artifact (JSON with `analysisStatus`, `coverageArtifact`).
- Git repo with detectable base (origin/master, origin/main, master, main) unless --base.

# Returns
```json
{
  "gate":"PASS|WARN","completeness":"COMPLETE|INCOMPLETE",
  "capabilities":{"coverageArtifact":"available|absent"},
  "changedFunctions":[{"file","method","lineStart","cc","crap","coverage","coverageKind":"branch|stmt|N/A"}],
  "ruleResults":[{"ruleId":"changed-function-high-crap","result":"PASS|WARN|NOT_EVALUATED","crap","threshold":30}]
}
```

# Quick Reference
- Command: `checkchange check [--base <ref>] [--verbose]`
- Gate: WARN = FAIL (blocks merge).
- Artifact: requires `analysisStatus` and `coverageArtifact`.
- Base: auto-detects origin/master, origin/main, master, main.
- CRAP: = CC + uncovered lines; 0% coverage → high CRAP.

# Implementation
```bash
checkchange check --verbose   # with verbose
checkchange check --base origin/main   # explicit base
if ! checkchange check --base $BASE_REF; then exit 1; fi   # CI gate
```

# Common Mistakes
- Expecting lint/test/SonarQube output (not produced).
- Treating WARN as pass or lowering thresholds.
- Skipping artifact validation.
- Assuming base without verification.

# Rationalization Table
| Rationalization | Reality |
|-----------------|---------|
| Tests suffice; checkchange redundant. | Checkchange predicts risk from changed functions; tests incomplete. |
| WARN is just a warning. | WARN blocks merge; ignoring risks quality escape. |
| Artifact probably fine; skip check. | Missing artifact → false PASS; gate requires artifact. |
| Base is main; no auto-detect. | Auto-detection avoids errors in repos with master/main. |

# Red Flags
- "WARN is just warning": ignoring WARN risks escape (WARN blocks).
- "Lower threshold to pass": gate evasion.
- "Skip coverage artifact": missing artifact invalidates gate.
- "Shrink diff via HEAD~1 gaming": base manipulation.
- "Claim false positive": dismissing WARN/FAIL without fix.

# Dealing With Feedback
| Status/Condition          | Action                                                                 |
|---------------------------|------------------------------------------------------------------------|
| PASS                      | Merge.                                                                 |
| WARN                      | Fix CRAP; don't lower thresholds.                                      |
| INCOMPLETE                | Check artifact and analysisStatus.                                     |
| absent artifact           | Run tests with coverage.                                               |
| failed artifact           | Fix tests/coverage.                                                    |
| NOT_EVALUATED in tests/** | Ignore.                                                                |
