---
name: using-checkchange
description: Use when running checkchange check to enforce quality gates. Ensures correct invocation, WARN block invariant, coverage artifact validation, base branch handling, and CRAP literacy.
---

# Overview
Correct use of `checkchange check`: prevents hallucination, enforces WARN blocks merge, validates artifact, handles base, ensures CRAP understanding.

# When to Use
- Running `checkchange check` in PR/CI.
- Verifying changed functions within CRAP thresholds.
- Validating coverage artifact before gate eval.
- Auto-detecting base or specifying --base.
- Diagnosing environment with `doctor`.
- Explaining rule derivation with `explain`.
- Tracing pipeline spans with `trace`.
- Comparing evidence runs with `delta`.

# What It Entails
1. `pnpm vitest run --coverage` → `coverage/coverage-final.json` (or jest coverage) — required before check
2. `checkchange check [--base <ref>] [--json] [--cache] [--auto-coverage] [--crap-threshold <n>] [--coverage-file <path>] [--format github|junit|sarif] [--provider-config <path>] [--allow-external-config] [--verbose]` — auto-detects base if omitted (origin/HEAD → origin/master/main → master/main)
3. Read gate + changedFunctions

# Requires
- `checkchange` CLI in PATH.
- Coverage artifact (JSON with `analysisStatus`, `coverageArtifact`).
- Git repo with detectable base (origin/master, origin/main, master, main) unless --base.

# Returns
```json
{
  "schemaVersion": "0.5",
  "analysis": { "base": "...", "target": "current" },
  "capabilities": { "git": "available", "complexity": "available|failed", "coverageArtifact": "available|absent|failed" },
  "changedFunctions": [{"file","method","lineStart","lineEnd","cc","crap","coverage","coverageKind","analyzerStatus","source":{"tool","version"},"language?","framework?"}],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [{"ruleId":"changed-function-high-crap","result":"PASS|WARN|NOT_EVALUATED","crap","threshold":30}],
  "analysisStatus": "SUCCESS|FAILED|UNSUPPORTED",
  "gate": "PASS|WARN|NOT_EVALUATED|FAILED",
  "completeness": "COMPLETE|INCOMPLETE|NOT_APPLICABLE",
  "diagnostics?": {
    "lineage": [{"stage","tool","version","inputs"}],
    "quality": {"coverage":"DIRECT|UNAVAILABLE","complexity":"NATIVE|UNAVAILABLE","score":0-100|null,"stageComplete":{...},"uncoveredFunctions?":[{file,method,lineStart,lineEnd}]},
    "fingerprints?": {"file:method:lineStart": "sha256hex"}
  }
}
```

# Quick Reference
- Command: `checkchange check [--base <ref>] [--json] [--cache] [--crap-threshold <n>] [--coverage-file <path>] [--format github|junit|sarif] [--verbose]`
- Subcommands: `check` | `doctor` | `explain` | `trace` | `delta` | `prepare-repo`
- Flags are per-command (since 0.5.1): top-level `--help` lists only `--help`/`--version`; run `checkchange check --help` for `--format`, `--base`, etc. Unknown flags on any subcommand are rejected with `Error: Unknown option <arg>` (exit 1) — never silently ignored.
- Gate: WARN = FAIL (blocks merge). FAILED = analysis failed (exit 1). UNSUPPORTED → gate NOT_EVALUATED (gateReason explains why). Gate never null since 0.5.0.
- Artifact: `coverageArtifact` = available|absent|failed. Missing → absent; malformed → failed.
- Base: auto-detects origin/master, origin/main, master, main. Outside a git repo the error is `Not a git repository` (0.5.1), not `Cannot resolve base reference`.
- CRAP: = CC + uncovered lines; 0% coverage → high CRAP.
- Cache: `--cache` opt-in (default off). Also `CHECKCHANGE_CACHE=1` env.
- Format: `--format github|junit|sarif` (sidecar, separate from --json). Valid only on `check`. SARIF sidecar emits canonical `$schema` key (`https://json.schemastore.org/sarif-2.1.0.json`) since 0.5.1 — strict SARIF validators accept it.
- Value flags: inline (`--base=HEAD`) and next-token (`--base HEAD`) both honored; bare or empty-inline (`--base`, `--base=`) errors `<flag> requires a value`; `--crap-threshold abc` errors instead of producing NaN.
- Threshold: default 30 via `--crap-threshold <n>`.
- Exit codes: FAILED→1, SUCCESS+WARN→1, UNSUPPORTED+NOT_APPLICABLE→0.
- Malformed artifact: analysisStatus=FAILED, gate=FAILED, completeness=INCOMPLETE.
- Trace sidecar: `{command:"trace", correlationId, spans:[{stage,durationMs,status}]}`.

# Implementation
```bash
checkchange check --verbose                    # with verbose
checkchange check --base origin/main           # explicit base
checkchange check --cache                      # incremental cache (opt-in)
checkchange check --format github              # formatter sidecar
checkchange check --format junit --json        # formatter + JSON
checkchange doctor                             # environment probes
checkchange explain --crap-threshold 25        # rule derivation
checkchange trace --json                       # pipeline spans
checkchange delta --baseline a.json --current b.json --json  # compare runs

# CI gate (FAILED or WARN → exit 1)
if ! checkchange check --base $BASE_REF; then exit 1; fi
```

# Common Mistakes
- Expecting lint/test/SonarQube output (not produced).
- Treating WARN as pass or lowering thresholds.
- Skipping artifact validation.
- Assuming base without verification.
- Probing top-level `--help` for `--format`/`--base` — flags are per-command (0.5.1); `checkchange delta --format sarif` is an error, not a hidden feature.
- Using `--cache` without coverage data (no benefit).
- Using `--format` without understanding sidecar output is separate from `--json`.

# Rationalization Table
| Rationalization | Reality |
|-----------------|---------|
| Tests suffice; checkchange redundant. | Checkchange predicts risk from changed functions; tests incomplete. |
| WARN is just a warning. | WARN blocks merge; ignoring risks quality escape. |
| Artifact probably fine; skip check. | Missing artifact → false PASS; gate requires artifact. |
| Base is main; no auto-detect. | Auto-detection avoids errors in repos with master/main. |
| Cache default-on is fine. | Default OFF; cache only helps repeat runs with same inputs. |
| --format replaces --json. | --format emits sidecar; --json emits EvidenceOutput. Both can run together. |

# Red Flags
- "WARN is just warning": ignoring WARN risks escape (WARN blocks).
- "Lower threshold to pass": gate evasion.
- "Skip coverage artifact": missing artifact invalidates gate.
- "Shrink diff via HEAD~1 gaming": base manipulation.
- "Claim false positive": dismissing WARN/FAIL without fix.
- "Enable cache by default": cache is opt-in; default OFF.

# Dealing With Feedback
| Status/Condition          | Action                                                                 |
|---------------------------|------------------------------------------------------------------------|
| PASS                      | Merge.                                                                 |
| WARN                      | Fix CRAP; don't lower thresholds.                                      |
| FAILED                    | Check coverageErrorReason (missing|malformed); fix artifact.           |
| UNSUPPORTED               | Non-code changes only; gate=NOT_EVALUATED (+gateReason), merge allowed.                       |
| INCOMPLETE                | Check artifact and analysisStatus.                                     |
| absent artifact           | Run tests with coverage.                                               |
| failed artifact           | Fix tests/coverage (malformed JSON, truncation, etc.).                 |
| NOT_EVALUATED in tests/** | Ignore.                                                                |

(End of file)