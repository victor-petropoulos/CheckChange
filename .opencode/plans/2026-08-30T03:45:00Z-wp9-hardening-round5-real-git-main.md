---
task: "WP9 Hardening Round 5 — Real-git main() integration test (Candidate A)"
created: "2026-08-30T03:45:00Z"
approved: true
tasks:
  - id: "1"
    description: "Implement real-git integration test file test/cli.real-git.spec.ts covering: (a) valid repo with real git init/commit, main() returns PASS exit 0; (b) not-a-repo (temp dir without .git) throws 'Not a git repository' distinct from ENOENT; (c) invalid base ref throws 'Cannot resolve base reference'; (d) ENOENT via PATH hack or execFile stub returning ENOENT throws 'Git executable not found'; (e) verifies schema 0.2 contract output (analysisStatus, gate, completeness, capabilities.git/complexity/coverageArtifact) and exit codes 0/1 per INV-01..04. NO vi.mock on git/evidence modules — uses real temp git repos via tmp dir."
    agent: "implementer"
    files: ["test/cli.real-git.spec.ts"]
    acceptance: "New test file created; all test cases pass with real git calls; no vi.mock on ../src/git.js or ../src/evidence.js; uses fs.mkdtemp + git init + commit for valid repo; uses temp dir without .git for not-a-repo; uses invalid ref for base error; ENOENT tested via modified PATH or execFile stub; schema 0.2 output verified; exit codes 0 (PASS/UNSUPPORTED w/ gate=null,completeness=NOT_APPLICABLE) and 1 (WARN/FAILED/git errors) verified"
    depends_on: []
  - id: "2"
    description: "Run verification suite: tsc --noEmit (0 errors), vitest --no-coverage (all tests pass, target >= 180 including new real-git tests), npm run build (dist/cli.js exists), confirm INV-01..04 preserved. Add threshold addendum note (threshold unchanged at 30/15). Write wp9-hardening-round5-report.md with AWAITING HUMAN REVIEW gate."
    agent: "tester"
    files: ["test/cli.real-git.spec.ts", "experiments/wp9-hardening-round5/wp9-hardening-round5-report.md"]
    acceptance: "tsc exit 0; vitest passes all tests (174 + new real-git tests); build ok; report documents real-git test results, FM-D10 distinction proven (ENOENT vs not-a-repo), schema 0.2 contract verified, exit codes match INV-04, threshold addendum notes no change; report ends with explicit AWAITING HUMAN REVIEW"
    depends_on: ["1"]
---