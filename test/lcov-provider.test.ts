import { describe, expect, test } from 'vitest';
import { parseLcovContent } from '../src/coverage-providers/lcovProvider';

// Statements carry a source span, not a line-number key. Look a unit up by its
// start line so these assertions stay keyed to what the DA record described.
function hitsFor(
  statements: ReadonlyArray<{ span: { startLine: number }; hits: number }>,
  startLine: number
): number | undefined {
  return statements.find(u => u.span.startLine === startLine)?.hits;
}

describe('LCOV provider parsing', () => {
  test('should parse valid LCOV with line data', () => {
    const lcov = `
TN:
SF:src/example.ts
FN:3,anonymous_0
FNDA:1,anonymous_0
FN:4,exampleFunction
FNDA:1,exampleFunction
DA:1,10
DA:2,5
DA:3,0
DA:4,8
LH:3
LF:4
end_of_record
`;
    const coverageMap = parseLcovContent(lcov, '/project');
    expect(coverageMap).toBeInstanceOf(Map);
    expect(coverageMap.size).toBe(1);
    const fileKey = '/project/src/example.ts'; // normalized to absolute
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    expect(fileCoverage).toHaveProperty('statements');
    expect(fileCoverage).toHaveProperty('branches');
    expect(fileCoverage).toHaveProperty('functions');
    // Check statements: one unit per DA line, in source line order
    expect(fileCoverage.statements).toHaveLength(4); // 4 statements
    expect(hitsFor(fileCoverage.statements, 1)).toBe(10);
    expect(hitsFor(fileCoverage.statements, 2)).toBe(5);
    expect(hitsFor(fileCoverage.statements, 3)).toBe(0);
    expect(hitsFor(fileCoverage.statements, 4)).toBe(8);
  });

  test('should handle empty LCOV', () => {
    const lcov = '';
    const coverageMap = parseLcovContent(lcov, '/project');
    expect(coverageMap.size).toBe(0);
  });

  test('should handle malformed LCOV (should still return what it can)', () => {
    const lcov = `
SF:src/file.ts
DA:1,invalid
DA:2,5
`;
    const coverageMap = parseLcovContent(lcov, '/project');
    expect(coverageMap.size).toBe(1);
    const fileKey = '/project/src/file.ts';
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    // Only the valid DA line should be parsed
    expect(fileCoverage.statements).toHaveLength(1); // only line 2
    expect(hitsFor(fileCoverage.statements, 2)).toBe(5);
    // line 1 should be skipped because hitCount is not a number
    expect(hitsFor(fileCoverage.statements, 1)).toBeUndefined();
  });

  test('should handle LCOV with function coverage (ignore FN/FNDA)', () => {
    const lcov = `
TN:
SF:src/fn.ts
FN:1,myFunc
FNDA:1,myFunc
DA:1,10
DA:2,0
LH:1
LF:2
end_of_record
`;
    const coverageMap = parseLcovContent(lcov, '/project');
    const fileKey = '/project/src/fn.ts';
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    // Should have two statements (lines 1 and 2)
    expect(fileCoverage.statements).toHaveLength(2);
    expect(hitsFor(fileCoverage.statements, 1)).toBe(10);
    expect(hitsFor(fileCoverage.statements, 2)).toBe(0);
    // Function and branch data are ignored, so those arrays should be empty
    expect(fileCoverage.functions).toHaveLength(0);
    expect(fileCoverage.branches).toHaveLength(0);
  });

test('should normalize paths correctly', () => {
     const lcov = `
     SF:src/foo.ts
     DA:1,5
     end_of_record
     `;
     const coverageMap = parseLcovContent(lcov, '/home/user/project');
     const fileKey = '/home/user/project/src/foo.ts';
     expect(coverageMap.has(fileKey)).toBe(true);
     // Also test that a relative path in LCOV is made absolute
     const lcov2 = `
     SF:foo.ts
     DA:1,5
     end_of_record
     `;
     const coverageMap2 = parseLcovContent(lcov2, '/home/user/project');
     const fileKey2 = '/home/user/project/foo.ts';
     expect(coverageMap2.has(fileKey2)).toBe(true);
   });

   test('should skip LCOV entries that escape cwd', () => {
     // Test relative path that escapes
     const lcovRelative = `
     SF:../../../etc/passwd
     DA:1,10
     end_of_record
     `;
     const coverageMap = parseLcovContent(lcovRelative, '/project');
     expect(coverageMap.size).toBe(0);

     // Test absolute path that escapes
     const lcovAbsolute = `
     SF:/etc/passwd
     DA:1,10
     end_of_record
     `;
     const coverageMap2 = parseLcovContent(lcovAbsolute, '/project');
     expect(coverageMap2.size).toBe(0);

     // Test a valid file still works
     const lcovValid = `
     SF:src/valid.ts
     DA:1,10
     end_of_record
     `;
     const coverageMap3 = parseLcovContent(lcovValid, '/project');
     expect(coverageMap3.size).toBe(1);
     expect(coverageMap3.has('/project/src/valid.ts')).toBe(true);
   });

  test('should throw error when LCOV content exceeds size limit', () => {
    const overLimit = 'x'.repeat(100 * 1024 * 1024 + 1); // 100MB + 1 byte
    expect(() => parseLcovContent(overLimit, '/project')).toThrowError(/LCOV content exceeds maximum allowed size of 104857600 bytes/);
  });

  test('should throw error when LCOV contains too many lines', () => {
    // Create 1,000,002 lines (each line empty, plus newline)
    let content = '';
    for (let i = 0; i < 1000002; i++) {
      content += '\n';
    }
    expect(() => parseLcovContent(content, '/project')).toThrowError(/LCOV contains too many lines \(over 1,000,000\)/);
  });
});