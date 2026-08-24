# WP4R.1a — V8 Reporter Resolution

## Status
**CURRENT — NARROW RESEARCH PASS**

## Purpose
Resolve why h3 and Hono, both using Vitest 4.1.11 and `@vitest/coverage-v8` 4.1.11, behaved differently. Determine whether h3 can emit compatible `coverage-final.json` with existing dependencies only.

No production changes, dependency installs, target config edits, source edits, or test edits are authorized.

## Known Evidence
- h3: 2,732 tests, one failure, coverage enabled, no artifact.
- Hono: v8 provider, JSON reporter configured, valid Istanbul `coverage-final.json`.
- Vitest documentation: v8 supports `json`; `coverage.reportOnFailure` defaults false.

## Hypotheses

### H1 — Failed test suppressed the report
Repeat h3 coverage with JSON requested and `--coverage.reportOnFailure`.

### H2 — Existing v8 can emit JSON
Request JSON plus a known reports directory using h3's installed v8 provider only.

### H3 — CLI option composition matters
Test a fully explicit documented invocation, conceptually:

```bash
npx vitest --run   --coverage.enabled   --coverage.provider=v8   --coverage.reporter=json   --coverage.reportsDirectory=coverage   --coverage.reportOnFailure
```

Use the installed version's documented equivalent syntax if necessary and record it exactly.

### H4 — Passing subset emits JSON
If the unrelated full-suite failure remains, run an existing passing h3 test subset that exercises source code with the same explicit v8 JSON settings.

## Required Experiments

1. **Baseline reproduction** — exact original command, exit code, test state, filesystem artifacts.
2. **Report-on-failure** — same operation with JSON + reportOnFailure.
3. **Explicit v8 JSON** — explicit enablement/provider/reporter/directory/reportOnFailure.
4. **Passing subset** — same v8 JSON configuration against an existing passing subset.

Capture exact command, cwd, stdout, stderr, exit code, test counts and artifact tree for each.

## Artifact Validation
For any JSON artifact:
- record exact path and size;
- confirm filename;
- inspect representative entries;
- confirm Istanbul-compatible `path`, `s`, `f`, `b`, `fnMap`, `branchMap`;
- determine whether current `parseCoverageReport()` data model can consume it without parser changes.

Do not change prototype code to test this.

## Decision Logic

If existing v8 emits compatible JSON, reject the WP4R.1 conclusion that h3 requires `@vitest/coverage-istanbul`.

If it emits JSON only when reportOnFailure is enabled, document failed-test suppression as root cause.

Only retain the target-coverage-change conclusion after both explicit-v8 and passing-subset tests fail.

## Forbidden
Do not modify `src/`, install coverage dependencies, edit h3 config/tests/source, add `--coverage-file`, add discovery/parsers, run WP4R.2, or change rules/thresholds.

## Required Artifacts
```text
experiments/wp4r.1a/h3/
  environment.md
  baseline-stdout.txt
  baseline-stderr.txt
  report-on-failure-stdout.txt
  report-on-failure-stderr.txt
  explicit-v8-json-stdout.txt
  explicit-v8-json-stderr.txt
  passing-subset-stdout.txt
  passing-subset-stderr.txt
  artifact-inventory.md

docs/research/WP4R.1a_V8_REPORTER_RESOLUTION_RESULTS.md
```

## Results Report
Include exact commands, versions, exit codes, test counts, artifact trees, reportOnFailure effect, explicit-v8 result, passing-subset result, format validation, parser compatibility, corrected root cause, whether WP4R.1's h3 dependency conclusion stands, and next-step recommendation.

End with exactly one:

```text
V8 JSON CONFIRMED — ADD EXPLICIT ISTANBUL PATH
V8 JSON REQUIRES REPORT-ON-FAILURE — ADD EXPLICIT ISTANBUL PATH
H3 REQUIRES TARGET COVERAGE CHANGE — ADD EXPLICIT ISTANBUL PATH
RESULT INCONCLUSIVE — STOP
```

Then stop. Do not implement.
