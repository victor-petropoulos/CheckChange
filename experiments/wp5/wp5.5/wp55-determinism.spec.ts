import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile } from '../wp5.2/fixtures/helpers';
import { buildEvidenceOutput } from '../../../src/evidence';
import { execSync } from 'child_process';
import { join } from 'path';

describe('WP5.5 T5: Determinism + Status Propagation Matrix', () => {
  describe('A) Determinism', () => {
    it('should produce identical JSON output across 5 runs with identical inputs', async () => {
      const repo = createTempRepo();
      try {
        const sourceFile = join(repo.srcDir, 'test.ts');
        writeSourceFile(sourceFile, 'export function test() { return 1; }');
        // Initial commit
        execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
        execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });
        // Modify file
        writeSourceFile(sourceFile, 'export function test() { return 2; }');
        // Write valid coverage
        const coverageMap = new Map();
        coverageMap.set('src/test.ts', {
          '1': [1, 0, 0, 1],
          '2': [1, 0, 0, 1]
        });
        writeCoverageFile(repo.coverageDir, coverageMap);
        // Intervals covering the changed function
        const intervals = new Map();
        intervals.set('src/test.ts', [{ start: 1, end: 2 }]);
        // Run 5 times
        const outputs: any[] = [];
        for (let i = 0; i < 5; i++) {
          const output = await buildEvidenceOutput(
            'HEAD',
            intervals,
            repo.tempDir,
            30
          );
          outputs.push(output);
        }
        // Compare JSON strings (no durationMs in output)
        const jsonStrings = outputs.map(o => JSON.stringify(o));
        const first = jsonStrings[0];
        for (let i = 1; i < jsonStrings.length; i++) {
          expect(jsonStrings[i]).toBe(first);
        }
      } finally {
        repo.cleanup();
      }
    });
  });

  describe('B) Status Propagation Matrix', () => {
    // Helper to run condition and return output
    async function runCondition(
      setup: (repo: any) => void,
      intervals: Map<string, { start: number; end: number }[]> | undefined,
      coverageFile?: string
    ): Promise<any> {
      const repo = createTempRepo();
      try {
        if (setup) {
          setup(repo);
        }
        // Ensure we have a HEAD commit if not already done in setup
        // Check if HEAD exists
        try {
          execSync('git rev-parse --verify HEAD', { cwd: repo.tempDir, stdio: 'ignore' });
        } catch {
          // No commit yet, create initial commit
          execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
          execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });
        }
        // Call buildEvidenceOutput
        return await buildEvidenceOutput(
          'HEAD',
          intervals ?? new Map(),
          repo.tempDir,
          30,
          coverageFile
        );
      } finally {
        repo.cleanup();
      }
    }

it('condition 1: valid coverage PASS', async () => {
       const output = await runCondition(
         (repo) => {
           const sourceFile = join(repo.srcDir, 'test.ts');
           writeSourceFile(sourceFile, 'export function test() { return 1; }');
           writeSourceFile(sourceFile, 'export function test() { return 2; }');
           // Write valid coverage with absolute path and Istanbul object
           const absolutePath = join(repo.tempDir, 'src/test.ts');
           const coverageMap = new Map();
           const fullCoverage = {
             "statementMap": {
               "0": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 100 } }
             },
             "fnMap": {
               "0": {
                 name: "test",
                 line: 1
               }
             },
             "branchMap": {},
             "s": {
               "0": 1
             },
             "f": {
               "0": 1
             },
             "b": {},
             "_coverageSchema": "urn:schema:istanbul:coverage:2"
           };
           coverageMap.set(absolutePath, fullCoverage);
           writeCoverageFile(repo.coverageDir, coverageMap);
         },
         new Map([['src/test.ts', [{ start: 1, end: 2 }]]]),
         undefined
       );
       expect(output.analysisStatus).toBe('SUCCESS');
       expect(output.gate).toBe('PASS');
       expect(output.capabilities.coverageArtifact).toBe('available');
       expect(output.changedFunctions[0].coverage).not.toBeNull();
       expect(output.completeness).toBe('COMPLETE');
     });

it('condition 2: valid coverage WARN', async () => {
       const output = await runCondition(
         (repo) => {
           const sourceFile = join(repo.srcDir, 'test.ts');
           // Function body lines (without leading newline)
           let functionBody = `export function test() {
   let x = 0;
   if (false) { x++; }
 `;
           for (let i = 1; i < 40; i++) {
             functionBody += `  else if (false) { x++; }\n`;
           }
           functionBody += `  return x;\n}`;
           // Write initial and modified (same function for coverage purposes)
           writeSourceFile(sourceFile, functionBody);
           writeSourceFile(sourceFile, functionBody); // modified same as initial for this condition

           // Build coverage object for zero coverage: each line in the function body is a statement with count 0
           const lines = functionBody.split('\n');
           // We'll ignore empty lines at the start and end if any, but our functionBody has no leading/trailing newline now.
           const statementMap = {};
           const fnMap = {};
           let statementIdx = 0;
           let fnIdx = 0;
           // We know the function starts at line 1 (since no leading newline)
           // We'll create a statement for each line that is not empty and not just braces? We'll do every line.
           lines.forEach((line, lineIndex) => {
             const lineNumber = lineIndex + 1; // 1-indexed
             // Skip empty lines
             if (line.trim() === '') {
               return;
             }
             // Each line is a statement (simplification)
             statementMap[statementIdx] = {
               start: { line: lineNumber, column: 0 },
               end: { line: lineNumber, column: 100 } // large column to cover the line
             };
             statementIdx++;
           });
           // Function name and line: we know the function statement is the first line (the 'export function test() {')
           fnMap[fnIdx] = {
             name: 'test',
             line: 1
           };

           const absolutePath = join(repo.tempDir, 'src/test.ts');
           const coverageMap = new Map();
           const zeroCoverage = {
             statementMap,
             fnMap,
             branchMap: {},
             s: {}, // will fill below
             f: {}, // will fill below
             b: {},
             "_coverageSchema": "urn:schema:istanbul:coverage:2"
           };
           // Initialize s and f with zeros for each statement and function
           for (let i = 0; i < statementIdx; i++) {
             zeroCoverage.s[i.toString()] = 0;
           }
           for (let i = 0; i < fnIdx; i++) {
             zeroCoverage.f[i.toString()] = 0;
           }

           coverageMap.set(absolutePath, zeroCoverage);
           writeCoverageFile(repo.coverageDir, coverageMap);
         },
         new Map([['src/test.ts', [{ start: 1, end: 100 }]]]), // Cover a wide range to capture the function
         undefined
       );
       expect(output.analysisStatus).toBe('SUCCESS');
       expect(output.gate).toBe('WARN');
       expect(output.changedFunctions[0].crap).toBeGreaterThan(30);
       expect(output.completeness).toBe('COMPLETE');
       expect(output.capabilities.coverageArtifact).toBe('available');
     });

    it('condition 3: default missing coverage', async () => {
      const output = await runCondition(
        (repo) => {
          const sourceFile = join(repo.srcDir, 'test.ts');
          writeSourceFile(sourceFile, 'export function test() { return 1; }');
          writeSourceFile(sourceFile, 'export function test() { return 2; }');
        },
        new Map([['src/test.ts', [{ start: 1, end: 2 }]]]),
        undefined
      );
      expect(output.analysisStatus).toBe('SUCCESS');
      expect(output.gate).toBe('PASS');
      expect(output.capabilities.coverageArtifact).toBe('absent');
    });

    it('condition 4: explicit missing coverage', async () => {
      const output = await runCondition(
        (repo) => {
          const sourceFile = join(repo.srcDir, 'test.ts');
          writeSourceFile(sourceFile, 'export function test() { return 1; }');
          writeSourceFile(sourceFile, 'export function test() { return 2; }');
        },
        new Map([['src/test.ts', [{ start: 1, end: 2 }]]]),
        '/nonexistent/path/coverage-final.json'
      );
      expect(output.analysisStatus).toBe('FAILED');
      expect(output.gate).toBeNull();
      expect(output.capabilities.coverageArtifact).toBe('failed');
      expect(output.coverageErrorReason).toBe('missing');
    });

    it('condition 5: malformed coverage', async () => {
      const output = await runCondition(
        (repo) => {
          const sourceFile = join(repo.srcDir, 'test.ts');
          writeSourceFile(sourceFile, 'export function test() { return 1; }');
          writeSourceFile(sourceFile, 'export function test() { return 2; }');
          // Write invalid JSON to default coverage file
          const coverageFile = join(repo.coverageDir, 'coverage-final.json');
          require('fs').writeFileSync(coverageFile, '{ not valid json', 'utf8');
        },
        new Map([['src/test.ts', [{ start: 1, end: 2 }]]]),
        undefined
      );
      expect(output.analysisStatus).toBe('FAILED');
      expect(output.gate).toBeNull();
      expect(output.capabilities.coverageArtifact).toBe('failed');
      expect(output.coverageErrorReason).toBe('malformed');
    });

    it('condition 6: unsupported (non-TS changes only)', async () => {
      const output = await runCondition(
        (repo) => {
          // Create initial commit with a dummy file
          const dummyFile = join(repo.tempDir, 'dummy.txt');
          require('fs').writeFileSync(dummyFile, 'dummy', 'utf8');
          execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
          execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });
        },
        new Map([['script.js', [{ start: 1, end: 1 }]]]), // Non-TS file
        undefined
      );
      expect(output.analysisStatus).toBe('UNSUPPORTED');
      expect(output.gate).toBeNull();
      expect(output.completeness).toBe('NOT_APPLICABLE');
      expect(output.changedFunctions).toHaveLength(0);
    });
  });
});