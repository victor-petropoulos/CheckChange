# WP8 Reproducibility Log

## Environment
- Node version: v24.18.1
- Engine (@barney-media/crap-typescript) version: 0.5.0
- Coverage command: npx vitest run --coverage
- Coverage artifact size: 157230 bytes
- Repository: code-risk-prototype

## Cases
### Case 1: base=HEAD~1, target=HEAD
- Repository: code-risk-prototype
- Commit (target): d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Parent (base): 298e1bef9ddcef697851dd2416ebe7b43cf09bde
- Engine commit: d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Node version: v24.18.1
- Coverage command: npx vitest run --coverage
- Artifact size: 157230 bytes
- Analysis command: node dist/cli.js check --base 298e1bef9ddcef697851dd2416ebe7b43cf09bde --json --coverage-file coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed function count: 3
- Result: gate=PASS, analysisStatus=SUCCESS, exit code=0

### Case 2: base=HEAD~2, target=HEAD
- Repository: code-risk-prototype
- Commit (target): d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Parent (base): 21daa57efcc659687020e0ee7fad125d7cf4161e
- Engine commit: d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Node version: v24.18.1
- Coverage command: npx vitest run --coverage
- Artifact size: 157230 bytes
- Analysis command: node dist/cli.js check --base 21daa57efcc659687020e0ee7fad125d7cf4161e --json --coverage-file coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed function count: 4
- Result: gate=PASS, analysisStatus=SUCCESS, exit code=0

### Case 3: base=HEAD~3, target=HEAD
- Repository: code-risk-prototype
- Commit (target): d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Parent (base): 7ab2301d54067880f7cf036af531d096764a36e9
- Engine commit: d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Node version: v24.18.1
- Coverage command: npx vitest run --coverage
- Artifact size: 157230 bytes
- Analysis command: node dist/cli.js check --base 7ab2301d54067880f7cf036af531d096764a36e9 --json --coverage-file coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed function count: 4
- Result: gate=PASS, analysisStatus=SUCCESS, exit code=0

### Case 4: base=HEAD~4, target=HEAD
- Repository: code-risk-prototype
- Commit (target): d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Parent (base): 6c690a7fe03f2557229cab3d8a60f624bbb58e20
- Engine commit: d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Node version: v24.18.1
- Coverage command: npx vitest run --coverage
- Artifact size: 157230 bytes
- Analysis command: node dist/cli.js check --base 6c690a7fe03f2557229cab3d8a60f624bbb58e20 --json --coverage-file coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed function count: 4
- Result: gate=PASS, analysisStatus=SUCCESS, exit code=0

### Case 5: base=HEAD~1 (298e1be), target=HEAD, missing coverage
- Repository: code-risk-prototype
- Commit (target): d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Parent (base): 298e1bef9ddcef697851dd2416ebe7b43cf09bde
- Engine commit: d98046c1b59f30cde66990690b3ba9d0ff90dbaa
- Node version: v24.18.1
- Coverage command: npx vitest run --coverage
- Artifact size: 0 bytes (missing)
- Analysis command: node dist/cli.js check --base 298e1bef9ddcef697851dd2416ebe7b43cf09bde --json --coverage-file /non/existent/file.json
- Threshold (crapThreshold): 30
- Changed function count: 0
- Result: gate=null, analysisStatus=FAILED, exit code=1

## Summary
- Total cases executed: 5
- Cases with coverage (1-4): PASS (gate=PASS, analysisStatus=SUCCESS)
- Case 5 (missing coverage): FAILED (gate=null, analysisStatus=FAILED)
- Invariant checks validated:
  - INV-01 (ZERO≠NULL): In case 1, function with crap=null (skipped) preserved as null, not converted to 0.
  - INV-02 (MISSING≠MALFORMED): Case 5 distinguishes missing coverage (coverageArtifact=failed, coverageErrorReason=missing) from malformed.
  - INV-04 (analyzer truthful): Analyzer reports accurate status (skipped/passed/failed) based on artifact availability.
- Artifact sizes: coverage/coverage-final.json = 157230 bytes
- Failures: Case 5 shows analysisStatus=FAILED due to missing coverage.
- External validation: attempted /tmp/wp8-zod (not found), deferred due to network/time constraints, fallback local validation used per plan minimality, future work to re-evaluate Zod/Fastify.

