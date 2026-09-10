---
task: "Enable end-to-end Python coverage analysis"
created: "2026-09-09T14:16:13Z"
approved: true
tasks:
  - id: "1"
    description: "Extend readCoverage in src/coverage.ts to auto-detect and process Python coverage formats (.coverage, coverage.xml, coverage.json) with fallback to existing Istanbul JSON"
    agent: "implementer"
    files: ["src/coverage.ts", "src/coverage.test.ts"]
    acceptance: "Unit tests for new Python coverage parsing pass; existing LCOV/Istanbul tests still pass; size cap and symlink validation applied"
    depends_on: []
  - id: "2"
    description: "Add unit tests for XML and JSON coverage formats in src/coverage.test.ts"
    agent: "implementer"
    files: ["src/coverage.test.ts"]
    acceptance: "All coverage format tests pass; test coverage for new code >= 80%"
    depends_on: ["1"]
  - id: "3"
    description: "Perform end-to-end validation on omlx-review-mcp repository"
    agent: "implementer"
    files: [] # temporary validation, evidence output
    acceptance: "Evidence file shows Python functions with coverage percentages; checkchange runs successfully"
    depends_on: ["2"]
  - id: "4"
    description: "Run full test suite, typecheck, and lint to verify no regressions"
    agent: "tester"
    files: ["src/coverage.ts", "src/coverage.test.ts"]
    acceptance: "npm test passes; npx tsc --noEmit exits 0"
    depends_on: ["3"]
  - id: "5"
    description: "Update documentation with Python coverage inputs and close WP18 gap (a)"
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "Documentation added; WP18 gap (a) resolved note present"
    depends_on: ["4"]
---
# Python Coverage Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable end-to-end analysis of Python projects by reading coverage data from Python's coverage.py formats (.coverage binary, coverage.xml, coverage.json) without requiring manual conversion.

**Architecture:** Extend the existing `readCoverage` function in `src/coverage.ts` to auto-detect and process Python coverage formats, then normalize to the internal Istanbul JSON format used by the rest of the system. The existing `pythonASTComplexityProvider` will automatically use the enhanced `readCoverage` without modification.

**Tech Stack:** TypeScript, Node.js, coverage.py

## Global Constraints
- Preserve existing behavior for LCOV and Istanbul JSON coverage formats
- No changes to TypeScript/JavaScript coverage reading logic
- Unit tests must pass with 100% coverage for new code
- End-to-end validation on a real Python repository (omlx-review-mcp)
- File size limit: 100MB for generated coverage.json (same as LCOV guard)
- Symlink validation to prevent path traversal
---

### Task 1: Extend readCoverage for Python formats

**Files:**
- Modify: `src/coverage.ts`
- Create: `src/coverage.test.ts` (if not exists)

**Interfaces:**
- Consumes: cwd (string), optional coverageFile (string)
- Produces: CoverageResult object (available, coverageMap, error, reason)

**Steps:**
- [ ] Step 1: Write failing test for .coverage binary detection
  ```ts
  // In src/coverage.test.ts
  it('should detect .coverage binary and generate JSON', async () => {
    // Arrange: create mock .coverage file (simplified)
    // Act: call readCoverage(cwd)
    // Assert: coverageResult.available === true, coverageMap not null
  });
  ```
- [ ] Step 2: Run test to verify it fails
  Run: `pnpm test src/coverage.test.ts`
  Expected: FAIL with "test not found" or assertion error
- [ ] Step 3: Implement auto-detection precedence and .coverage handling
  Edit src/coverage.ts:
  - Add logic to check for .coverage, coverage.xml, coverage.json in order
  - For .coverage and .xml, spawn `coverage json -o <temp>` (fallback to `python3 -m coverage`)
  - Parse generated JSON with existing parseCoverageReport
  - Apply normalizeCoveragePaths and size/symlink checks
- [ ] Step 4: Run test to verify it passes
  Run: `pnpm test src/coverage.test.ts`
  Expected: PASS
- [ ] Step 5: Commit
  ```bash
  git add src/coverage.ts src/coverage.test.ts
  git commit -m "feat: add Python coverage format detection to readCoverage"
  ```

### Task 2: Add unit tests for XML and JSON formats

**Files:**
- Modify: `src/coverage.test.ts`

**Interfaces:**
- Consumes: same as Task 1
- Produces: comprehensive test suite

**Steps:**
- [ ] Step 1: Write failing tests for coverage.xml and coverage.json
  ```ts
  // Additional test cases in src/coverage.test.ts
  it('should parse coverage.xml (Cobertura format)', async () => { /* ... */ });
  it('should parse coverage.json (Istanbul format)', async () => { /* ... */ });
  it('should handle missing coverage files gracefully', async () => { /* ... */ });
  it('should enforce 100MB size limit on generated JSON', async () => { /* ... */ });
  ```
- [ ] Step 2: Run tests to verify they fail
  Run: `pnpm test src/coverage.test.ts`
  Expected: FAIL on new tests
- [ ] Step 3: Implement XML and JSON parsing paths
  Edit src/coverage.test.ts fixtures and update readCoverage logic to handle:
  - coverage.xml: treat as Istanbul JSON after conversion (same as .coverage)
  - coverage.json: parse directly with parseCoverageReport
  - Use fixtures from test/fixtures/coverage/ directory
- [ ] Step 4: Run tests to verify they pass
  Run: `pnpm test src/coverage.test.ts`
  Expected: PASS
- [ ] Step 5: Commit
  ```bash
  git add src/coverage.test.ts
  git commit -m "feat: add unit tests for XML and JSON coverage formats"
  ```

### Task 3: End-to-end validation on omlx-review-mcp

**Files:**
- None (temporary validation)
- Evidence: `evidence/omlx-review-mcp.txt`

**Interfaces:**
- Consumes: local clone of omlx-review-mcp
- Produces: evidence file showing successful analysis

**Steps:**
- [ ] Step 1: Clone omlx-review-mcp (if not present)
  ```bash
  git clone https://github.com/omlx/omlx-review-mcp.git /tmp/omlx-review-mcp
  ```
- [ ] Step 2: Run coverage and check
  ```bash
  cd /tmp/omlx-review-mcp
  coverage run -m pytest
  npx checkchange --coverage-file .coverage
  ```
- [ ] Step 3: Capture evidence output
  ```bash
  npx checkchange --coverage-file .coverage --json > /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/evidence/omlx-review-mcp.txt
  ```
- [ ] Step 4: Verify evidence contains Python functions with coverage
  Check: grep for \"python\" and \"coverage\" in evidence file, expect non-zero
- [ ] Step 5: Commit evidence
  ```bash
  git add evidence/omlx-review-mcp.txt
  git commit -m "feat: record E2E evidence for Python coverage on omlx-review-mcp"
  ```

### Task 4: Test, lint, and typecheck

**Files:**
- None

**Interfaces:**
- Consumes: all modified files
- Produces: clean build

**Steps:**
- [ ] Step 1: Run full test suite
  Run: `pnpm test`
  Expected: ALL TESTS PASS
- [ ] Step 2: Run TypeScript compiler
  Run: `pnpm tsc --noEmit`
  Expected: EXIT CODE 0
- [ ] Step 3: Run linter
  Run: `pnpm lint`
  Expected: NO ERRORS
- [ ] Step 4: Commit
  ```bash
  git add -u
  git commit -m "chore: verify build passes after Python coverage changes"
  ```

### Task 5: Update documentation

**Files:**
- Modify: `docs/contracts/evidence-contract.md` (or appropriate location)

**Interfaces:**
- Consumes: none
- Produces: updated documentation

**Steps:**
- [ ] Step 1: Add section on Python coverage inputs
  Edit docs/contracts/evidence-contract.md:
  ```
  ## Python Coverage Inputs
  The analyzer automatically detects coverage data from Python's coverage.py tool in the following order of precedence:
  1. `.coverage` (SQLite binary)
  2. `coverage.xml` (Cobertura format)
  3. `coverage.json` (JSON format)
  4. Fallback to `coverage/coverage-final.json` (Istanbul JSON)
  
  For `.coverage` and `.coverage.xml` files, the analyzer will spawn `coverage json` to generate intermediate Istanbul JSON for processing.
  ```
- [ ] Step 2: Close WP18 gap (a) note
  Add: `WP18 GAP (a) RESOLVED: Python coverage formats now supported end-to-end.`
- [ ] Step 3: Commit
  ```bash
  git add docs/contracts/evidence-contract.md
  git commit -m "docs: add Python coverage inputs and close WP18 gap (a)"
  ```