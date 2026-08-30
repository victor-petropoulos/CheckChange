# Repro: microsoft/tsdoc full Rush monorepo vs subset (Round7)

**Repo**: https://github.com/microsoft/tsdoc  
**Base SHA**: cc1dbc604dd056d250879138407596cd23d42f8d (parent of e11ec0b736cc624334f02c893d662cb6914919ae fix/eslint-plugin-tsdoc)  
**HEAD SHA**: e11ec0b736cc624334f02c893d662cb6914919ae  
**Changed file**: `git diff --name-only cc1dbc6..e11ec0b` → `eslint-plugin/src/index.ts` (only file), same as Round6  
**Rush projects**: 7 (api-demo, playground, @microsoft/tsdoc, @microsoft/tsdoc-config, tsdoc-build-rig, eslint-plugin-tsdoc, plus spec) — from rush.json

## Why this round
Round6 validated subset coverage (eslint-plugin only, 29210 bytes, 3 entries). Limitation "monorepo untested" remained: engine's getGitTrackedTsFiles + normalizeCoveragePaths theoretically monorepo-capable but unvalidated at scale (64 files, 1.6MB). This round validates full union artifact vs subset — same repo, same provider (Jest v8 via heft-web-rig), no new provider.

## Coverage generation
Rush rig default `coverageReporters: ["cobertura","html"]` → no Istanbul JSON for full repo. Fix per project:

For each project that lacked JSON (tsdoc, tsdoc-config), create `jest.custom.json` extending its jest config:
```json
{
  "extends": "./config/jest.config.json",
  "coverageReporters": ["json"]
}
```
(For tsdoc which extends tsdoc-build-rig, same pattern works.)

Then per project:
```bash
cd /tmp/tsdoc/tsdoc && npx heft test --jest:config ./jest.custom.json
cd /tmp/tsdoc/tsdoc-config && npx heft test --jest:config ./jest.custom.json
cd /tmp/tsdoc/eslint-plugin && npx heft test --jest:config ./jest.custom.json  # already done in Round6
```
Result artifacts:
- /tmp/tsdoc/tsdoc/coverage/coverage-final.json — 1273823 bytes, 59 entries
- /tmp/tsdoc/tsdoc-config/coverage/coverage-final.json — 92188 bytes, 2 entries
- /tmp/tsdoc/eslint-plugin/coverage/coverage-final.json — 29210 bytes, 3 entries
- /tmp/tsdoc/api-demo/coverage/coverage-final.json — 3 bytes {} (empty, no coverage for this project, expected)

Merge via python union of top-level keys:
```python
union = {}
for f in files: union.update(json.loads(open(f).read()))
open("full-union-coverage.json","w").write(json.dumps(union))
```
Full union: 64 entries, 1621110 bytes (1.6MB) — saved as `experiments/wp9-hardening-round7/evidence/full-union-coverage.json`

## Analysis commands
Subset (Round6 repro):
```bash
cd /tmp/tsdoc && node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base cc1dbc6 --json --coverage-file /tmp/tsdoc/eslint-plugin/coverage/coverage-final.json
```
Full union (Round7):
```bash
cd /tmp/tsdoc && node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base cc1dbc6 --json --coverage-file /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/experiments/wp9-hardening-round7/evidence/full-union-coverage.json
```

## Results (identical gates — validates boundary)
Both produce:
- Changed functions: 2 (same file `eslint-plugin/src/index.ts`)
- `getRootDirectoryFromContext`: cc12 crap116.97 cov10 branch → WARN (threshold 30)
- `plugin.rules.syntax.create`: cc6 crap18.34 cov30 branch → PASS
- `analysisStatus`: SUCCESS, `gate`: WARN (exit 0 per CLI? actually JSON gate WARN, CLI exit 0 — check evidence.ts), `completeness`: COMPLETE, `capabilities`: git/available complexity/available coverageArtifact/available

No ambiguous matches despite 64 entries — attribution correctly finds single match per changed file via endsWith, declines ambiguous only if multiple suffix matches (not triggered here). normalizeCoveragePaths rebases absolute keys onto cwd, works at scale.

## INV checks
- INV-01 ZERO≠NULL preserved: both funcs have non-null coverage (10,30)
- INV-02 MISSING≠MALFORMED preserved: valid JSON with statementMap/fnMap/branchMap present in all 64 entries
- INV-03 GIT≠REPO preserved: git available in /tmp/tsdoc
- INV-04 ANALYZER TRUTHFUL preserved: analyzerStatus passed, gate WARN reflects high CRAP

## Env
- Node v24.18.1
- Engine commit 2972e5e + uncommitted Round6 docs
- Date 2026-08-30
- Subset 29210 bytes, Full 1621110 bytes (55x larger)

## Packages covered in union
- @microsoft/tsdoc (59 files, 1.2M)
- @microsoft/tsdoc-config (2 files, 90K)
- eslint-plugin-tsdoc (3 files, 29K)
- api-demo (0, empty) — expected, no TS coverage
- playground — no coverage file (no tests needing coverage)
- tsdoc-build-rig — build rig, not tested

## Evidence paths
- subset: `experiments/wp9-hardening-round6/evidence/tsdoc-genuine.json` (29K)
- full union: `experiments/wp9-hardening-round7/evidence/full-union-coverage.json` (1.62M, 64 entries)
