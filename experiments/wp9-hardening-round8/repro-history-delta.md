# WP9 Hardening Round 8 Evidence Generation

## Commit 00203d4

### Steps
1. Checkout commit:
    ```bash
    cd /tmp/tsdoc
    git checkout 00203d4
    git reset --hard
    git clean -fdx
    ```
2. Attempt to run heft test for eslint-plugin with jest.custom.json:
    ```bash
    cd /tmp/tsdoc/eslint-plugin
    # Create jest.custom.json if missing
    echo '{"extends":"./config/jest.config.json","coverageReporters":["json"]}' > jest.custom.json
    # Run heft test (this failed due to Node.js version incompatibility)
    # Command: node common/scripts/install-run-rush.js run -p eslint-plugin -- test
    # Error: Node.js version 24.18.1 not supported by rush.json (requires >=16.13.0 <17.0.0 || >=18.15.0 <19.0.0 || >=20.9.0 <21.0.0)
    ```
3. Due to the failure, reused full-union coverage from Round7 (1621110 bytes, 64 entries) as fallback:
    ```bash
    # The full union coverage is already present in the evidence directory from Round7
    # No copy needed; we use the existing file as-is.
    ```
4. Run engine check with base c908cc8 (parent of 00203d4):
    ```bash
    cd /tmp/tsdoc
    node /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base c908cc830b18c2bedb56ee93f436066a51822b2d --json --coverage-file /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp9-hardening-round8/evidence/00203d4-coverage.json > experiments/wp9-hardening-round8/evidence/00203d4-engine.json
    ```
    - Note: Engine run while checked out at 00203d4. Coverage file is the full union from Round7, so coverage metrics are not per-commit but complexity metrics are accurate.

### Expected Outputs
- Coverage file: Valid Istanbul JSON, size 1621110 bytes, 64 entries (full union from Round7).
- Engine file: JSON with schemaVersion 0.2, analysis shows 11 changedFunctions.
  Key function: `eslint-plugin/src/index.ts` `plugin.rules.syntax.create`: cc=5, crap=15.54, coverage=25, result=PASS.
  Gate status: PASS, completeness: INCOMPLETE (due to skipped configs).

## Commit e11ec0b

### Steps
1. Checkout commit:
    ```bash
    cd /tmp/tsdoc
    git checkout e11ec0b
    git reset --hard
    git clean -fdx
    ```
2. Attempt to run heft test for eslint-plugin with jest.custom.json:
    ```bash
    cd /tmp/tsdoc/eslint-plugin
    # Create jest.custom.json if missing
    echo '{"extends":"./config/jest.config.json","coverageReporters":["json"]}' > jest.custom.json
    # Run heft test (this failed due to Node.js version incompatibility)
    # Command: node common/scripts/install-run-rush.js run -p eslint-plugin -- test
    # Error: Same Node.js version issue as above.
    ```
3. Due to the failure, reused full-union coverage from Round7 (1621110 bytes, 64 entries) as fallback:
    ```bash
    # The full union coverage is already present in the evidence directory from Round7
    # No copy needed; we use the existing file as-is.
    ```
4. Run engine check with base cc1dbc6 (parent of e11ec0b):
    ```bash
    cd /tmp/tsdoc
    node /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js check --base cc1dbc604dd056d250879138407596cd23d42f8d --json --coverage-file /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp9-hardening-round8/evidence/e11ec0b-coverage.json > experiments/wp9-hardening-round8/evidence/e11ec0b-engine.json
    ```
    - Note: Engine run while checked out at e11ec0b. Coverage file is the full union from Round7.

### Expected Outputs
- Coverage file: Valid Istanbul JSON, size 1621110 bytes, 64 entries (full union from Round7).
- Engine file: JSON with schemaVersion 0.2, analysis shows 2 changedFunctions.
  Key functions:
    1. `eslint-plugin/src/index.ts` `getRootDirectoryFromContext`: cc=12, crap=116.97, coverage=10, result=WARN.
    2. `eslint-plugin/src/index.ts` `plugin.rules.syntax.create`: cc=6, crap=18.34, coverage=30, result=PASS.
  Gate status: WARN, completeness: COMPLETE.

## Notes
- Due to Node.js version incompatibility (v24.18.1) with the repository's rush.json constraints, heft tests could not be executed.
- Coverage files are the full union from Round7 (not per-commit), so coverage delta is not reflective of real changes; complexity delta is real.
- All evidence files are actual engine outputs (not dummy) but with coverage from Round7.
- In a compatible environment, heft would generate per-commit coverage and engine check would use it.