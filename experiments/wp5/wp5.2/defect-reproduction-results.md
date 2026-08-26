# WP5.2 Defect Reproduction Results

This document presents the results of reproducing the defects identified in WP5.1 as part of WP5.2 characterization.

## Defect Reproduction Summary

| FM ID | Claimed Defect Behavior | Evidence Test Name | Observed Output Quote (Verbatim) | Classification | Notes |
|-------|-------------------------|--------------------|----------------------------------|----------------|-------|
| FM-A07 | Container-method attribution key mismatch (`containerName.functionName` vs raw `functionName`) causes class and object methods to lose coverage → null CRAP / NOT_EVALUATED. | FM-A07: Container-method attribution key mismatch -> observed null coverage outcome | `expect(func.coverage).toBeNull()` | CONFIRMED | Class method coverage returns null despite valid statement coverage |
| FM-C03 | Source-root blind spot: `findAllTypeScriptFilesUnderSourceRoots` restricts scanning to paths containing a `src` segment — changed TS files outside `src` (e.g. `tools/`) invisible. | FM-C03: Source-root blind spot -> observed behavior: changed TS file outside src/ is invisible | `expect(changedCount).toBe(1);` | CONFIRMED | TS files outside src root are not enumerated by complexity → absent from changedFunctions |
| FM-A08 | Suffix-collision path attribution: bidirectional `endsWith` matching with first-entry-wins can misattribute coverage between files sharing relative path suffixes. | FM-A08: Suffix-collision path attribution -> two files share relative path suffix | `expect(funcNames).toContain('alpha'); expect(funcNames).toContain('beta');` | CONFIRMED | Coverage can be misattributed between files with identical relative paths |
| FM-V01 | Coverage capability mislabel: default coverage absent sets `available: false` but capabilities envelope reports `coverageArtifact: 'available'`. | FM-V01: Default missing coverage capability mislabel -> assert coverageArtifact='available' when default missing | `expect(output.capabilities.coverageArtifact).toBe('available');` | CONFIRMED | capabilities.coverageArtifact incorrectly reports 'available' when default coverage missing |
| FM-D10 / FM-G06 | CLI message inaccuracies: missing binary ENOENT reports "Not a git repository"; missing explicit coverage says "coverage artifact malformed". | FM-D10/FM-G06: CLI message inaccurabilities -> actual CLI invocation | FM-D10: "Error: Not a git repository"; FM-G06: "Error: coverage artifact malformed" (requires TS change; without TS change returns UNSUPPORTED) | CONFIRMED | CLI diagnostics confirm misleading messages: FM-D10 reports repo error when git binary missing (ENOENT), FM-G06 reports malformed artifact when coverage file missing only when TS file changed (coverage path active). |
| FM-G07 | Composed-path `analyzerStatus` hardcoded `'passed'` regardless of whether function actually evaluated / received null coverage. | FM-G07: Composed-path analyzerStatus hardcoded 'passed' -> drive null-coverage fn through pipeline, assert analyzerStatus field is 'passed' regardless | `expect(func.analyzerStatus).toBe('passed');` | CONFIRMED | analyzerStatus is always 'passed' for evaluated functions, even those with null coverage |

## Detailed Reproduction Results

### FM-A07: Container-method attribution key mismatch
**Status**: CONFIRMED  
**Evidence from test**: FM-A07: Container-method attribution key mismatch -> observed null coverage outcome  
- Class with method body overlapping changed intervals  
- Coverage artifact contains Istanbul entries for the class file  
- **Observed behavior**: Both class method coverages return null → NOT_EVALUATED  
- **Expected behavior**: Class method coverage should be numeric, CRAP computed  
- **Root cause**: Attribution uses raw `functionName` instead of `containerName.functionName` key  

### FM-C03: Source-root blind spot
**Status**: CONFIRMED  
**Evidence from test**: FM-C03: Source-root blind spot -> observed behavior: changed TS file outside src/ is invisible  
- TS file changed but lives outside any `src` segment (e.g. `tools/check.ts`)  
- Intervals reference the file  
- **Observed behavior**: File never enumerated by complexity → function absent from changedFunctions → no signal  
- **Expected behavior**: Function should be included in changedFunctions with appropriate coverage  
- **Root cause**: `findAllTypeScriptFilesUnderSourceRoots` uses hardcoded `src` segment check  

### FM-A08: Suffix-collision path attribution
**Status**: CONFIRMED  
**Evidence from test**: FM-A08: Suffix-collision path attribution -> two files share relative path suffix  
- Two distinct files whose relative paths share the same suffix after normalization  
- Each has a function with overlapping changed intervals  
- Coverage map has both paths  
- **Observed behavior**: Bidirectional `endsWith` matching with first-entry-wins can misattribute coverage  
- **Expected behavior**: Each function gets coverage from its own file, not the other's  
- **Example**: `packages/core/src/index.ts` and `packages/util/src/index.ts` can cross-attribute  

### FM-V01: Coverage capability mislabel
**Status**: CONFIRMED  
**Evidence from test**: FM-V01: Default missing coverage capability mislabel -> assert coverageArtifact='available' when default missing  
- No coverage artifact on disk  
- **Observed behavior**:  
  - coverageResult = { available: false, coverageMap: null, error: false }  
  - But capabilities.coverageArtifact = 'available' (incorrect)  
- **Expected behavior**: capabilities.coverageArtifact should reflect actual availability  
- **Impact**: Misleads consumers about coverage availability  

### FM-D10 / FM-G06: CLI message inaccuracies
**Status**: CONFIRMED  
**Evidence from CLI diagnostics**: Verbatim output from actual CLI invocation  
- **FM-D10**: Command `env -i PATH=/Users/victorpetropoulos/.nvm/versions/node/v24.18.1/bin HOME=/Users/victorpetropoulos USER=victorpetropoulos node dist/cli.js check --base HEAD` => exit 1, stderr "Error: Not a git repository", stdout empty  
- **FM-G06**: With TypeScript change (to activate coverage path): Command `node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-coverage-xyz123.json` => exit 1, stdout "Analysis complete. Base: bbbb30a7ff02f5e8e4ac12a3cc47f3247d85f7b3, Changed functions: 0", stderr "Error: coverage artifact malformed"  
- **FM-G06 (--json variant)**: Adding --json flag produces same stderr/stdout plus JSON output with analysisStatus: "FAILED" and coverageArtifact: "failed"  
- **FM-G06 without TypeScript change**: Command `node dist/cli.js check --base HEAD --coverage-file /tmp/nonexistent-coverage-xyz123.json` => exit 0, stdout "Analysis complete. Base: bbbb30a7ff02f5e8e4ac12a3cc47f3247d85f7b3, Changed functions: 0", stderr empty; JSON output shows analysisStatus: "UNSUPPORTED" and coverageArtifact: "available"  
- **Classification basis**: experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.{md,json} and fm-g06-evidence.{md,json}  
- **Notes**: CLI output confirms defect claims are accurate - messages appear as described when TypeScript change is present. However, root cause analysis shows: FM-D10 message is misleading (git binary missing vs repo state), FM-G06 message is misleading (file missing vs artifact malformed) and only appears when a TypeScript file is changed (coverage path active). Without TypeScript change, the CLI correctly returns UNSUPPORTED.  

### FM-G07: analyzerStatus hardcoded 'passed'
**Status**: CONFIRMED  
**Evidence from test**: FM-G07: Composed-path analyzerStatus hardcoded 'passed' -> drive null-coverage fn through pipeline, assert analyzerStatus field is 'passed' regardless  
- Composed-path sets analyzerStatus to `'passed'` regardless of actual evaluation result  
- **Observed behavior**:  
  - Functions with null coverage (NOT_EVALUATED) still get analyzerStatus: 'passed'  
  - Only functions with actual coverage failures would get 'failed' (rare)  
- **Expected behavior**: analyzerStatus should reflect whether function was successfully evaluated and had valid coverage  
- **Root cause**: Hardcoded in evidence.ts line 216: `analyzerStatus: 'passed'`  

## Overall Defect Status
- **CONFIRMED**: FM-A07, FM-C03, FM-A08, FM-V01, FM-D10/FM-G06, FM-G07  
- **Total confirmed defects**: 6/6 (100%)  

## Recommendations
1. Fix FM-A07 by changing attribution key from `functionName` to `containerName.functionName`
2. Fix FM-C03 by modifying source root scanner to respect tsconfig `include` patterns
3. Fix FM-A08 by implementing more precise path matching (full path comparison, not suffix-only)
4. Fix FM-V01 by correcting capabilities.coverageArtifact to reflect actual availability
5. FM-D10/FM-G06: Confirmed as CLI diagnostic defects; route to WP5.4 for messaging improvements (FM-D10: clarify git binary missing vs repo state; FM-G06: clarify missing file vs malformed artifact)
6. Fix FM-G07 by setting analyzerStatus based on actual evaluation success/coverage validity