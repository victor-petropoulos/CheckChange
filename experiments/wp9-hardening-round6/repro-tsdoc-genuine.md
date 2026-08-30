# Repro: microsoft/tsdoc genuine Jest/v8 provider

**Repo**: https://github.com/microsoft/tsdoc  
**Base SHA**: cc1dbc604dd056d250879138407596cd23d42f8d (parent of e11ec0b736cc624334f02c893d662cb6914919ae fix/eslint-plugin-tsdoc)  
**HEAD SHA**: e11ec0b736cc624334f02c893d662cb6914919ae  
**Changed files**: `git diff --name-only cc1dbc6..e11ec0b` shows `eslint-plugin/src/index.ts`  

## Coverage command
From `/tmp/tsdoc/eslint-plugin`:
1. Create `jest.custom.json` extending `./config/jest.config.json` and adding `"json"` reporter:
   ```json
   {
     "extends": "./config/jest.config.json",
     "coverageReporters": ["json"]
   }
   ```
2. Run: `npx heft test --jest:config ./jest.custom.json`  
   (This produced `coverage-final.json` with Jest v8 provider via heft-web-rig, outputting Cobertura+HTML+JSON; we overrode to keep only JSON.)

**Coverage provider**: Jest + v8 provider  
**Artifact size**: 29210 bytes (Istanbul-compatible JSON, contains `statementMap`, `fnMap`, `branchMap`)

## Analysis command
```bash
cd /tmp/tsdoc && node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base cc1dbc6 --json --coverage-file /tmp/tsdoc/eslint-plugin/coverage/coverage-final.json
```

## Threshold
- CRAP threshold: 30 (default)  
- Coverage threshold: 15 (from `docs/contracts.md`)

## Result
- Changed functions: 2  
- Gate: WARN (exit code 1)  
- analysisStatus: SUCCESS  
- completeness: COMPLETE  
- capabilities: git=available, complexity=available, coverageArtifact=available  
- Rule results:
  - `getRootDirectoryFromContext`: CRAP 116.976 > 30 → WARN
  - `plugin.rules.syntax.create`: CRAP 18.348 ≤ 30 → PASS

## INV-01..04 checks
- **INV-01 ZERO≠NULL preserved**:  
  Both functions have non-null coverage (10% and 30% branch coverage) → covered lines exist, not missing.
- **INV-02 MISSING≠MALFORMED preserved**:  
  Coverage artifact is valid JSON with `statementMap`, `fnMap`, `branchMap` present → not malformed.
- **INV-03 GIT≠REPO preserved**:  
  `git` capability is available → engine can run in a git repository.
- **INV-04 ANALYZER TRUTHFUL preserved**:  
  Both functions passed their analyzer checks (analyzerStatus: passed). The WARN gate correctly reflects the high CRAP of one function → analyzer truthful.

## Env
- Node: v24.18.1  
- Engine commit: 2972e5ea82b89e9840345062c043acc9e1bac4b6  
- Date: 2026-08-30  
- Coverage artifact size: 29210 bytes  

## Repro steps
1. Clone: `git clone https://github.com/microsoft/tsdoc /tmp/tsdoc`  
2. Checkout HEAD: `cd /tmp/tsdoc && git checkout e11ec0b736cc624334f02c893d662cb6914919ae`  
3. Install deps: `rush install --bypass-policy`  
4. Generate coverage:  
   ```bash
   cd /tmp/tsdoc/eslint-plugin
   cat > jest.custom.json << 'EOF'
   {
     "extends": "./config/jest.config.json",
     "coverageReporters": ["json"]
   }
   EOF
   npx heft test --jest:config ./jest.custom.json
   ```
5. Run engine check:  
   ```bash
   cd /tmp/tsdoc
   node /Users/victorpetropoulos/Cursor\ Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base cc1dbc6 --json --coverage-file /tmp/tsdoc/eslint-plugin/coverage/coverage-final.json
   ```

## Evidence path
`experiments/wp9-hardening-round6/evidence/tsdoc-genuine.json`
