---
task: "WP4R Final Phase 4: 18 prototype runs, aggregation, human-review packet"
created: 2026-08-24T23:58:00Z
approved: true
approved_at: 2026-08-25T00:00:00Z
---

# WP4R Final — Phase 4: Prototype Runs, Aggregation, Human-Review Packet

**Phase 0–2: COMPLETE.** Repository selection + 9 historical cases locked in
`experiments/wp4r-final/repository-selection.md`. nx replaced by apollo-client
(unsuitable: babel-plugin-istanbul crash). All base/target SHAs pinned.

This plan covers the execution phase only. Production code remains frozen.

---

## Prerequisites (caller-side, per repo)

1. Ensure target repo deps installed:
   - h3: `pnpm install`
   - hono: `npm install`
   - apollo-client: already installed
2. Install `crap-typescript` into each target repo (prototype runs
   `npx --no-install crap-typescript --format json` from target CWD):
   - h3: `pnpm add -D @barney-media/crap-typescript@0.5.0`
   - hono: `npm install -D @barney-media/crap-typescript@0.5.0`
   - apollo: `npm install -D @barney-media/crap-typescript@0.5.0`
   - These modify package.json/lockfile → documented as caller-side
     evidence-production prerequisite; re-cleaned after the experiment.
   - `node_modules` is gitignored in all three repos → git tree stays clean.
3. Confirm prototype built: `dist/cli.js` exists (verified present).

---

## Per-Case Execution Sequence (9 cases × 2 thresholds = 18 runs)

For each case, in order:

1. `cd <repo> && git checkout <target-sha>`
2. Confirm working tree clean (ignore untracked `node_modules/`, `coverage/`)
3. Generate coverage externally (command per repo below)
4. Confirm artifact path exists + valid Istanbul JSON
   (`jq 'keys | length' <artifact> > 0`)
5. Run prototype threshold 30:
   ```
   cd <repo> && node "<PROTO>/dist/cli.js" check \
     --base <base-sha> --coverage-file <artifact-rel-path> \
     --crap-threshold 30 --json
   ```
   Capture: stdout → `output-threshold-30.json`, stderr → `prototype-stderr-30.txt`,
   exit code, runtime (epoch before/after).
6. Run prototype threshold 15 (same, `--crap-threshold 15`):
   Capture: `output-threshold-15.json`, `prototype-stderr-15.txt`, exit, runtime.
7. Restore repo to a stable HEAD after its 3 cases (avoid cross-case drift).

`<PROTO>` = `/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode`

### Coverage generation commands

**h3** (`/tmp/wp4r1-h3`):
```bash
npx vitest --run --coverage.enabled --coverage.provider=v8 \
  --coverage.reporter=json --coverage.reportsDirectory=coverage \
  --coverage.reportOnFailure
```
Artifact: `coverage/coverage-final.json`

**hono** (`/tmp/wp4r-repos/hono`):
```bash
npm run coverage
```
Artifact: `coverage/raw/default/coverage-final.json`

**apollo-client** (`/tmp/wp4r-repos/apollo-client`) — scoped per case:
```bash
node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning \
  ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts \
  --coverage --coverageReporters=json --coverageDirectory=coverage \
  --runInBand --watchAll=false --testPathPattern="<scope>"
```
Scope per case: apollo-01 → `src/cache/core`; apollo-02 → `src/react/hooks`;
apollo-03 → `src/react/hooks`.
Artifact: `coverage/coverage-final.json`

---

## Output Artifacts (per spec)

Per case directory `experiments/wp4r-final/<repo>/<case>/`:
- `metadata.md` — repo, case, base/target SHA, coverage cmd, artifact path,
  coverage gen exit code, prototype exit codes, runtimes, changed-fn count,
  PASS/WARN/NOT_EVALUATED counts, max CRAP, max CC, coverage availability rate
- `coverage-generation-stdout.txt`
- `coverage-generation-stderr.txt`
- `output-threshold-30.json`
- `output-threshold-15.json`
- `prototype-stderr-30.txt`
- `prototype-stderr-15.txt`
- `review.md` — blank classification fields for each WARN + sampled PASSes

Root:
- `experiments/wp4r-final/aggregate-results.json`
- `experiments/wp4r-final/human-review-packet.md` — every WARN + sampled PASSes,
  NO usefulness classifications (template from
  `docs/research/WP4R_FINAL_HUMAN_REVIEW_TEMPLATE.md`)

---

## Subagent Dispatch

3 × `implementer` subagents (one per repo), each executes its 3 cases × 2
thresholds, captures all artifacts into the correct directories. Each must:
- Verify paths exist before running (bad-data guardrails)
- Use absolute prototype path, CWD = target repo
- Record runtimes and exit codes
- Return a concise per-case summary

After all 3 complete, 1 × `documenter` subagent:
- Aggregates into `aggregate-results.json`
- Builds `human-review-packet.md` with NO classifications

Parallelism: 3 repo subagents dispatched concurrently (repos independent).

---

## Acceptance

- 18 prototype runs executed, all artifacts captured
- `aggregate-results.json` valid JSON with all 9 cases
- `human-review-packet.md` complete with WARN + PASS samples, no classifications
- No production code modified
- Final report ends exactly `AWAITING HUMAN REVIEW`

---

## Hard Constraints (unchanged)

- No production code modifications
- No autonomous usefulness classification
- Thresholds only 30 and 15, no per-repo tuning
- No baseline/delta, new rules, discovery, new coverage formats, CC-only
  warnings, threshold changes, CI, plugins, or LLM analysis
- Reuse WP4R.2 knowledge only (coverage commands, artifact paths) — not its
  CRAP results for case selection (already excluded)

---

## Post-Execution

After runs complete and packet built, re-clean target repos:
- h3: `git checkout -- package.json pnpm-lock.yaml`
- hono: `git checkout -- package.json && rm -f package-lock.json`
- apollo: `git checkout -- package.json && rm -f package-lock.json`
(docs/experiment artifacts in the prototype repo are preserved)
