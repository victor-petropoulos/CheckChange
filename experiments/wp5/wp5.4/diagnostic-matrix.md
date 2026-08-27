# Diagnostic Matrix

**Status:** EXECUTED — derived from implementation
**Date:** 2026-08-27
**Source:** `src/cli.ts`, `src/coverage.ts`, `src/evidence.ts`, `src/git.ts`, `src/execute.ts`

---

## Purpose

Document the CLI diagnostic output per condition: exit code, stderr, and relevant JSON fields. Matches the implemented behavior after WP5.4 corrections.

**PLANNING vs EXECUTED:** This matrix reflects the post-implementation diagnostic behavior. It was derived from the source code, not planned.

---

## Condition Matrix

### Valid Coverage, All PASS

| Field | Value |
|-------|-------|
| Exit code | 0 |
| Stderr | (none) |
| Stdout | `Analysis complete. Base: <ref>, Changed functions: N` |
| JSON `analysisStatus` | `'SUCCESS'` |
| JSON `gate` | `'PASS'` |
| JSON `completeness` | `'COMPLETE'` |
| JSON `coverageArtifact` | `'available'` |
| JSON `coverageErrorReason` | (not present) |

### Valid Coverage, Some WARN

| Field | Value |
|-------|-------|
| Exit code | 0 |
| Stderr | (none) |
| Stdout | `Analysis complete. Base: <ref>, Changed functions: N` |
| JSON `analysisStatus` | `'SUCCESS'` |
| JSON `gate` | `'WARN'` |
| JSON `completeness` | `'COMPLETE'` |
| JSON `coverageArtifact` | `'available'` |
| JSON `coverageErrorReason` | (not present) |

### Default Missing Coverage (no `--coverage-file`, no file on disk)

| Field | Value |
|-------|-------|
| Exit code | 0 |
| Stderr | (none) |
| Stdout | `Analysis complete. Base: <ref>, Changed functions: N` |
| JSON `analysisStatus` | `'SUCCESS'` |
| JSON `gate` | `'PASS'` |
| JSON `completeness` | `'INCOMPLETE'` |
| JSON `coverageArtifact` | `'absent'` |
| JSON `coverageErrorReason` | (not present) |

**FM-V01 fix:** Previously reported `'available'`. Now correctly reports `'absent'`.

### Explicit Missing Coverage (`--coverage-file /nonexistent/path`, TS change present)

| Field | Value |
|-------|-------|
| Exit code | 1 |
| Stderr | `Error: coverage artifact missing` |
| Stdout | (none) |
| JSON `analysisStatus` | `'FAILED'` |
| JSON `gate` | `null` |
| JSON `completeness` | `'INCOMPLETE'` |
| JSON `coverageArtifact` | `'failed'` |
| JSON `coverageErrorReason` | `'missing'` |

**FM-G06 fix:** Previously printed `"Error: coverage artifact malformed"`. Now correctly prints `"Error: coverage artifact missing"`.

### Malformed Coverage File (file exists, invalid JSON)

| Field | Value |
|-------|-------|
| Exit code | 1 |
| Stderr | `Error: coverage artifact malformed` |
| Stdout | (none) |
| JSON `analysisStatus` | `'FAILED'` |
| JSON `gate` | `null` |
| JSON `completeness` | `'INCOMPLETE'` |
| JSON `coverageArtifact` | `'failed'` |
| JSON `coverageErrorReason` | `'malformed'` |

### Unsupported (non-TS changes only)

| Field | Value |
|-------|-------|
| Exit code | 0 |
| Stderr | (none) |
| Stdout | `Analysis complete. Base: <ref>, Changed functions: 0` |
| JSON `analysisStatus` | `'UNSUPPORTED'` |
| JSON `gate` | `null` |
| JSON `completeness` | `'NOT_APPLICABLE'` |
| JSON `coverageArtifact` | `'available'` |
| JSON `coverageErrorReason` | (not present) |

### Git ENOENT (git binary not in PATH)

| Field | Value |
|-------|-------|
| Exit code | 1 |
| Stderr | `Error: Git executable not found` |
| Stdout | (none) |
| JSON | N/A (throws before evidence is built) |

**FM-D10 fix:** Previously printed `"Error: Not a git repository"`. Now correctly prints `"Error: Git executable not found"`.

### Not a Git Repo (git exists, directory has no .git)

| Field | Value |
|-------|-------|
| Exit code | 1 |
| Stderr | `Error: Not a git repository` |
| Stdout | (none) |
| JSON | N/A (throws before evidence is built) |

### Complexity Provider Failure

| Field | Value |
|-------|-------|
| Exit code | 0 |
| Stderr | (none) |
| Stdout | `Analysis complete. Base: <ref>, Changed functions: 0` |
| JSON `analysisStatus` | `'UNSUPPORTED'` |
| JSON `gate` | `null` |
| JSON `completeness` | `'NOT_APPLICABLE'` |
| JSON `complexity` | `'failed'` |

---

## PLANNING vs EXECUTED Distinction

This matrix was derived from the actual implementation code after WP5.4 fixes. It is not a plan — it documents what the code actually does. Each row corresponds to a production path through `src/cli.ts` → `src/git.ts`/`src/evidence.ts`/`src/coverage.ts`.
