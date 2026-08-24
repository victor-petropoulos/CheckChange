# WP4R.2 — Real Artifact Verification

## Status
**CURRENT — VERIFICATION ONLY**

## Goal
Prove the frozen prototype consumes real externally generated Istanbul JSON from h3 and Hono via `--coverage-file`.

For **each** repository, acceptance requires:

```text
real artifact generated/found
explicit path consumed
changedFunctions > 0
at least one changed function with coverage:number
at least one changed function with crap:number
production changes: NONE
```

No WARN is required; PASS is sufficient.

## Freeze
Before starting:

```bash
git status
npx vitest run
npx tsc --noEmit
```

Record prototype commit/status. Do not modify `src/`.

## h3

Use the same h3 revision/environment used in WP4R.1a where practical.

Generate coverage externally with the proven command:

```bash
npx vitest --run   --coverage.enabled   --coverage.provider=v8   --coverage.reporter=json   --coverage.reportsDirectory=coverage   --coverage.reportOnFailure
```

A non-zero test exit is acceptable if the known unrelated test still fails and the artifact is produced.

Confirm:

```text
coverage/coverage-final.json
```

exists and record command, cwd, exit code, artifact size, test counts.

Use one previously pinned real h3 historical change that produces changed TypeScript functions.

Run the prototype with the real artifact:

```bash
tool check   --base <base-sha>   --coverage-file coverage/coverage-final.json   --crap-threshold 30   --json
```

Capture stdout/stderr/exit/output JSON.

Required:

```text
analysisStatus = SUCCESS
changedFunctions.length > 0
at least one coverage:number
at least one crap:number
```

## Hono

Use the same Hono environment/revisions from WP4R where practical.

Generate its real native artifact and confirm:

```text
coverage/raw/default/coverage-final.json
```

Do **not** move/copy it to the prototype default location.

Use one pinned real Hono historical change that produces changed TS functions.

Run:

```bash
tool check   --base <base-sha>   --coverage-file coverage/raw/default/coverage-final.json   --crap-threshold 30   --json
```

Required:

```text
analysisStatus = SUCCESS
changedFunctions.length > 0
at least one coverage:number
at least one crap:number
```

## Controls

Do not:

- manufacture coverage JSON;
- use synthetic functions;
- move the Hono artifact;
- edit target source/tests/config;
- modify prototype production code;
- add discovery/fallback/formats.

If a repository fails, diagnose and document only.

## Required Artifacts

```text
experiments/wp4r.2-verification/
  h3/
    metadata.md
    coverage-command-stdout.txt
    coverage-command-stderr.txt
    prototype-stdout.txt
    prototype-stderr.txt
    output.json
    artifact-summary.md
  hono/
    metadata.md
    coverage-command-stdout.txt
    coverage-command-stderr.txt
    prototype-stdout.txt
    prototype-stderr.txt
    output.json
    artifact-summary.md

docs/research/WP4R.2_REAL_ARTIFACT_VERIFICATION_RESULTS.md
```

## Results Requirements

Include the frozen prototype commit/baseline; exact repo revisions; exact coverage commands; artifact paths/sizes; base/target SHAs; changed-function counts; at least one real numeric coverage + CRAP example per repo; NOT_EVALUATED cases/reasons; and confirmation that production code was unchanged.

Include this matrix:

| Check | h3 | Hono |
|---|---|---|
| Real artifact generated/found | YES/NO | YES/NO |
| Explicit path consumed | YES/NO | YES/NO |
| Changed functions > 0 | YES/NO | YES/NO |
| Numeric coverage on real changed function | YES/NO | YES/NO |
| Numeric CRAP on real changed function | YES/NO | YES/NO |
| Production changes required | NO/YES | NO/YES |

End with exactly one:

```text
VERIFIED — READY FOR WP4R RERUN
VERIFIED WITH CONSTRAINTS
STOP
```

Use `VERIFIED — READY FOR WP4R RERUN` only if both repositories satisfy every acceptance row. Then stop; do not start the usefulness rerun.
