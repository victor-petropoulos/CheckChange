---
task: "WP4R.2 Explicit Istanbul Coverage Path — --coverage-file <path>"
created: "2026-08-24T12:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Add --coverage-file <path> CLI flag to src/cli.ts parseCliArgs() and main(). Parse optional --coverage-file with value (supports --coverage-file=PATH or --coverage-file PATH). Return coverageFile in parsed args object. Update help text to include the new flag. Validate: if --coverage-file provided without value, print error and exit(1). No fallback/search logic — pass raw string through."
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "tsc --noEmit passes; --help output includes --coverage-file line; --coverage-file without value exits with error; parsed args object includes coverageFile property (string | undefined)"
    depends_on: []
  - id: "2"
    description: "Thread coverageFile through evidence.ts → coverage.ts. Change readCoverage(cwd, coverageFile?) signature to accept optional coverageFile string. If coverageFile provided: resolve as absolute path (path.isAbsolute or path.resolve(cwd, coverageFile)), then access + parse. Explicit missing file → {available:true, error:true} (error=true, NOT available=false — this triggers FAILED semantics). Explicit malformed → {available:true, error:true}. If coverageFile omitted: use existing default join(cwd, 'coverage/coverage-final.json') with existing behavior (missing → available:false, error:false). Update buildEvidenceOutput(base, intervals, cwd, threshold, coverageFile?) to pass coverageFile to readCoverage. Update buildFailedOutput to accept threshold parameter."
    agent: "implementer"
    files: ["src/coverage.ts", "src/evidence.ts"]
    acceptance: "tsc --noEmit passes; readCoverage(cwd) with no second arg retains existing default behavior; readCoverage(cwd, '/nonexistent') returns error:true; readCoverage(cwd, 'coverage/coverage-final.json') resolves from cwd; buildEvidenceOutput signature updated with optional coverageFile param"
    depends_on: ["1"]
  - id: "3"
    description: "Update main() in src/cli.ts to pass coverageFile to buildEvidenceOutput. After parsing args, pass coverageFile from parsed result to buildEvidenceOutput call. Verify exit(1) on analysisStatus FAILED still works with explicit coverage file."
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "tsc --noEmit passes; main() call to buildEvidenceOutput includes coverageFile arg; existing FAILED exit(1) behavior preserved"
    depends_on: ["2"]
  - id: "4"
    description: "Write tests for WP4R.2 coverage-file semantics in test/wp4r2-coverage-file.test.ts. Cover: (1) explicit valid relative path consumed correctly, (2) explicit valid absolute path consumed correctly, (3) explicit valid Hono-style path consumed correctly, (4) explicit missing file → analysisStatus FAILED, (5) explicit malformed JSON → analysisStatus FAILED, (6) no --coverage-file flag → existing default behavior preserved, (7) relative path resolves from cwd (not from process.cwd() of caller), (8) --coverage-file without value → CLI error exit(1), (9) explicit path with valid coverage but no changed functions → SUCCESS/PASS/COMPLETE, (10) explicit path with coverage attribution working end-to-end. Use mocked fs/promises access and parseCoverageReport where needed to avoid needing real coverage artifacts."
    agent: "tester"
    files: ["test/wp4r2-coverage-file.test.ts"]
    acceptance: "vitest run test/wp4r2-coverage-file.test.ts — 0 failing tests, 0 TypeScript errors; all 10 cases pass"
    depends_on: ["3"]
  - id: "5"
    description: "Run full test suite and typecheck. Execute: npx vitest run (full suite), npx tsc --noEmit. Verify 0 failing tests and 0 TypeScript errors. Fix any regressions from the coverage-file threading."
    agent: "tester"
    files: ["test/wp4.2.test.ts", "src/crap.test.ts", "src/git.test.ts", "src/coverage.ts", "src/evidence.ts", "src/cli.ts"]
    acceptance: "npx vitest run — 0 failing tests; npx tsc --noEmit — 0 errors"
    depends_on: ["4"]
  - id: "6"
    description: "Create docs/research/WP4R.2_IMPLEMENTATION_RESULTS.md with 14 sections: (1) Executive Summary, (2) Implementation Changes, (3) CLI Interface, (4) Coverage Reader Changes, (5) Evidence Pipeline Changes, (6) Test Results, (7) Typecheck Results, (8) Explicit Path Semantics Verification, (9) Default Path Semantics Verification, (10) h3 Artifact Compatibility (manual run note), (11) Hono Artifact Compatibility (manual run note), (12) Edge Cases Handled, (13) What Was NOT Implemented, (14) Final Decision. End with exactly: READY FOR WP4R RERUN / READY WITH CONSTRAINTS / STOP."
    agent: "documenter"
    files: ["docs/research/WP4R.2_IMPLEMENTATION_RESULTS.md"]
    acceptance: "File exists with all 14 sections; final three lines are exactly 'READY FOR WP4R RERUN', 'READY WITH CONSTRAINTS', 'STOP'; content matches implementation work done in tasks 1-5"
    depends_on: ["5"]
---

## Plan Notes

- **Scope**: Only add `--coverage-file <path>` CLI flag + threading. No coverage generation, no artifact discovery, no LCOV parsing, no Vitest config changes.
- **Semantics**: Explicit missing/malformed → `error=true` → `coverageCapability='failed'` → `analysisStatus='FAILED'`. Omitted flag → existing default `coverage/coverage-final.json` behavior unchanged.
- **Path resolution**: If relative, resolve from `cwd` (not from CLI working directory). If absolute, use as-is.
- **No schema bump**: Output schema version stays `0.2` — no structural changes to output.
- **Tests**: New file `test/wp4r2-coverage-file.test.ts` for coverage-file specific tests. Existing `test/wp4.2.test.ts` tests remain untouched (they test default behavior).
- **h3/Hono artifacts**: Compatibility checks are manual runs outside the prototype (Phase 6-7 of playbook). Not part of automated tests.
