# WP4R Final — Repository Setup + Coverage Pre-flight + Case Lock

**WP4R.2 verification: COMPLETE — VERIFIED. Production frozen.**
**WP4R final usefulness rerun: in progress (Phase 1 of 3).**

This plan covers only the **setup phases** — repository verification,
nx coverage pre-flight, repository lock, and ~9 historical case lock.
Prototype execution at thresholds 30/15 happens in a follow-up plan
after this one is approved.

---

## Phase 0 — Verify / Re-clone Three Repositories

### Task 0.1: h3 @ `/tmp/wp4r1-h3`

- Check `git status`, `git log`, `git remote -v`, expected SHAs.
- Expected target SHA: `baef4b94af47c3c71024807824657db9336ae9ca` (serveStatic).
- Expected base SHA: `bd5cd6a7fd10028277786608065a90280f2fe2e0`.
- Known dirty state from prior WP4R.2: `package.json`, `pnpm-lock.yaml`
  (crap-typescript install). Both expected experiment artifacts.
- Clean: `git checkout -- package.json pnpm-lock.yaml`.
- If SHA missing or remote wrong → `git fetch origin && git checkout <sha>`.
- If directory missing → `git clone https://github.com/unjs/h3.git /tmp/wp4r1-h3`.
- **Do not** rely on temp dir persistence — re-clone if state untrustworthy.

### Task 0.2: Hono @ `/tmp/wp4r-repos/hono`

- Check `git status`, `git log`, `git remote -v`, expected SHAs.
- Expected target SHA: `241ae4c72b7ab732e425f40ea28cd3af2e78d8a2` (parseSigned).
- Expected base SHA: `c409d855d91d1f0904d19439692216fcf789e6cb`.
- Known dirty state from prior WP4R.2: `package.json` modified, untracked
  `package-lock.json` (crap-typescript install).
- Clean: `git checkout -- package.json && rm -f package-lock.json`.
- If SHA missing or remote wrong → `git fetch origin && git checkout <sha>`.
- If directory missing → `git clone https://github.com/honojs/hono.git /tmp/wp4r-repos/hono`.

### Task 0.3: nx @ `/tmp/wp4r-repos/nx`

- Check `git status`, `git log`, `git remote -v`.
- No prior WP4R.2 runs against nx. Tree should be clean.
- Confirm remote = `https://github.com/nrwl/nx.git`.
- If directory missing → `git clone https://github.com/nrwl/nx.git /tmp/wp4r-repos/nx`.

**Acceptance for Phase 0**: All three repos on correct remotes, clean
trees, expected history reachable. Git status reports `nothing to
commit, working tree clean` for each.

---

## Phase 1 — nx Coverage Pre-flight (ALLOWED before prototype runs)

### Task 1.1: Inspect nx test/coverage configuration

- Read `nx.json`, `jest.preset.js`, `jest.config.cts` (project-root configs).
- Read a sample `packages/*/project.json` or `packages/*/jest.config.ts`
  to identify the actual configured Nx test executor and Jest preset.
- Identify the canonical test target invocation, e.g. `nx test <project> --coverage`.
- Record: which project will be used for nx prototype runs (pick a
  small focused TypeScript package with a clear `test` target).

### Task 1.2: Generate Istanbul JSON via native `nx test --coverage`

**RESULT: EXECUTED. NOT VIABLE.**

Pre-flight findings (researcher + orchestrator verification):
- `jest.preset.js` sets `coverageReporters: ['html']` only — no JSON reporter.
- Caller-side flags `--coverage --coverageReporters=json --coverageDirectory=<path>`
  are valid and do NOT require committed config changes.
- However, running tests on candidate packages (`oxlint`, `plugin`, `eslint`)
  crashes during source transformation:
  `TypeError: minimatch is not a function` from `babel-plugin-istanbul`
  inside Jest's transform pipeline when instrumenting files that do
  `import minimatch from 'minimatch'` (CJS default import shape).
- All three packages produced `coverage-final.json` of size 3 bytes (`{}`)
  because no tests complete to collect coverage from.
- This is a toolchain-level crash in the repo's babel/swc instrumentation
  chain, not resolvable with caller-side CLI flags alone.
- Fixing it would require modifying the nx repo's committed config or
  installing different coverage provider — both forbidden by scope freeze.

**Verdict: UNSUITABLE for final usefulness experiment.**

### Task 1.3: Replacement selection (per locked decision rules)

**RESULT: EXECUTED. SELECTED apollo-client.**

Candidate survey performed (researcher):
| Candidate | Local? | Test Runner | Istanbul JSON viable? |
|-----------|--------|-------------|----------------------|
| nestjs/nest | cloned | Vitest v8 | NO (v8 provider, needs istanbul pkg + config change) |
| vuejs/core | cloned | Vitest v8 | NO (same issue) |
| reduxjs/redux | cloned | Vitest | NO (no coverage deps) |
| apollographql/apollo-client | cloned+installed | Jest+ts-jest | YES |

**Selected: `apollographql/apollo-client` @ `/tmp/wp4r-repos/apollo-client`**

Justification:
1. Proven Istanbul JSON output — validated `coverage-final.json` (1.3MB,
   236 entries) with all required keys (`s`, `f`, `b`, `statementMap`,
   `fnMap`, `branchMap`).
2. CLI-only coverage flags; zero committed coverage config in
   `config/jest.config.ts`. No repo modification required.
3. Substantial TypeScript implementation source (~379 `.ts` src files).
4. Active commit history (recent commits Aug 2026), mixed change sizes.
5. Single-package structure (not monorepo) → simpler case attribution.
6. Already installed (`npm install` done), node_modules present.

Alternatives rejected:
- `nestjs/nest`: v8 provider, needs `@vitest/coverage-istanbul`
  install + committed config change.
- `vuejs/core`: same v8-only limitation.
- `reduxjs/redux`: no coverage deps at all, would require config creation.

Why nx was replaced:
babel-plugin-istanbul instrumentation crash (`minimatch is not a function`)
during source transformation in Jest runtime — toolchain-level failure,
no caller-side CLI flag workaround.

### Native coverage command (apollo-client)

```bash
cd /tmp/wp4r-repos/apollo-client && \
node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning \
  ./node_modules/jest/bin/jest.js \
  --config ./config/jest.config.ts \
  --coverage \
  --coverageReporters=json \
  --coverageDirectory=coverage \
  --runInBand \
  --watchAll=false
```

Caller-side prerequisites documented:
- `--coverage` enables collection
- `--coverageReporters=json` overrides default HTML reporter to Istanbul JSON
- `--coverageDirectory=coverage` sets output location
- No committed config modifications required

Note: full suite is ~134 test files. Estimated runtime per case: 5–30 min.
Will use targeted `--testPathPattern` scoping per historical case where
appropriate to keep runtime manageable while still covering changed
functions under test.

### Acceptance for Phase 1

- [x] nx unsuitability documented (this plan amendment).
- [x] Replacement selected + justified + alternatives rejected.
- [x] Istanbul JSON artifact confirmed valid at
      `/tmp/wp4r-repos/apollo-client/coverage/coverage-final.json`.
- [x] Coverage command + caller-side prerequisites recorded.
- [ ] `experiments/wp4r-final/repository-selection.md` updated with
      apollo-client as Repo C (Phase 2 task).

---

## Phase 2 — Repository Lock

### Task 2.1: Repository Selection (`repository-selection.md`)

Fill in all three repos with:
- Name, URL, why selected, coverage command, artifact path.

Repos now locked:
- A: h3 @ `/tmp/wp4r1-h3`
- B: hono @ `/tmp/wp4r-repos/hono`
- C: apollo-client @ `/tmp/wp4r-repos/apollo-client` (replaces nx)

### Task 2.2: Historical case lock — 9 cases total (3 per repo)

Case size classification per locked decision:
- **Small**: 1 changed function
- **Moderate**: 2–3 changed functions
- **Non-trivial**: ≥4 changed functions
- Diff LOC = descriptive metadata only, not classification input.

Selection rules:
- Pick from real commits reachable in repo history.
- Pin base + target SHAs.
- Classify each by counting changed functions in `git diff <base>..<target>`.
- Per repo: 1 small, 1 moderate, 1 non-trivial.
- **Do not** choose based on prior CRAP results we have observed.
- Hono/h3 verification changes from WP4R.2 may be reused only if their
  CRAP results are not yet known to bias selection. Since CRAP results
  ARE known for those two (h3 serveStatic WARN CRAP 39.14; Hono parseSigned
  PASS CRAP 6.0) — **discard those** and pick fresh changes.
- apollo-client has no prior CRAP results — any historical change is fair game.

For each case:
- Record base SHA, target SHA, commit subject.
- Count changed functions in `git diff <base>..<target> --stat` then
  verify per-file by inspecting `git diff <base>..<target> -- <file>`.
- Record diff LOC stat as metadata.

### Task 2.3: Update `repository-selection.md` with case SHAs

Fill in `Case 01/02/03 base/target` rows for each repo.

### Acceptance for Phase 2

- `repository-selection.md` complete with all repos + all 9 cases + SHAs.
- Cases are pre-prototype observation — selection confirmed YES.
- No case uses a commit previously observed to produce a specific CRAP gate.

---

## Phase 3 — Plan Approval Gate

**HALT.** Do not begin prototype runs. Wait for explicit user approval
of this plan. After approval, Phase 4 (prototype runs at thresholds 30
and 15) is drafted as a follow-up plan with separate approval.

---

## Out of Scope (Phase 4+, not this plan)

- Prototype execution at threshold 30 or 15.
- Aggregate results JSON.
- Human-review packet.
- WP4R_FINAL_USEFULNESS_RESULTS.md.
- Any production code change.

## Hard Constraints (unchanged from WP4R scope)

- No production code modifications.
- No autonomous usefulness classification.
- No baseline/delta, new rules, discovery, new coverage formats,
  CC-only warnings, threshold changes, CI, plugins, or LLM analysis.
- Thresholds used only at 30 and 15, no per-repo tuning.
- Use real historical changes only; pin SHAs.

---

## Subagent Dispatch Plan

All work in this plan executes in the orchestrator (setup, not coding).
Parallel where independent:
- Phase 0 — `bash` directly (3 quick verifications, all in one shell).
- Phase 1 — `task researcher` to inspect nx configs + generate Istanbul
  artifact (read-only on repo + one coverage run).
- Phase 2 — orchestrator + `cavecrew-investigator` for diff function counts.

## Verification

- `git status` clean on all three repos before Phase 1 ends.
- Istanbul JSON key schema validated (jq `.statementMap | type == "object"`).
- 9 cases counted via `git diff --stat` + per-file inspection.
- `repository-selection.md` complete + `YES` on selection confirmation line.
- Plan approval gate passed before Phase 4.