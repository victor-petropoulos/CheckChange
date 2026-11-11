import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { pythonASTComplexityProvider } from '../src/complexity-providers/pythonASTComplexityProvider';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Helper to compute Pearson correlation coefficient
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0;
  let sumX2 = 0, sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return 0;
  
  return numerator / denominator;
}

describe('Python AST Complexity Provider CC Correlation', () => {
  const tempDir = resolve(__dirname, '../test/temp/python-cc-correlation');
  
  beforeAll(() => {
    // Clean up and create temp directory
    rmSync(tempDir, { recursive: true, force: true });
    mkdirSync(tempDir, { recursive: true });
  });
  
  afterAll(() => {
    // Clean up
    rmSync(tempDir, { recursive: true, force: true });
  });
  
  test('should achieve CC correlation >= 0.95 on synthetic benchmark', async () => {
    // Define test cases: each case is a Python function string and its expected CC
    const testCases: Array<{ code: string; expectedCC: number; name: string }> = [
      // 1. Empty function
      {
        code: 'def empty():\n    pass',
        expectedCC: 1,
        name: 'empty'
      },
      // 2. Single if
      {
        code: 'def single_if(x):\n    if x > 0:\n        return 1\n    return 0',
        expectedCC: 2,
        name: 'single_if'
      },
      // 3. If-else
      {
        code: 'def if_else(x):\n    if x > 0:\n        return 1\n    else:\n        return 0',
        expectedCC: 2,
        name: 'if_else'
      },
      // 4. Ternary (conditional expression)
      {
        code: 'def ternary(x):\n    return 1 if x > 0 else 0',
        expectedCC: 2,
        name: 'ternary'
      },
      // 5. AND condition (two conditions in if)
      {
        code: 'def and_cond(x, y):\n    if x > 0 and y > 0:\n        return 1\n    return 0',
        expectedCC: 3,
        name: 'and_cond'
      },
      // 6. OR condition (two conditions in if)
      {
        code: 'def or_cond(x, y):\n    if x > 0 or y > 0:\n        return 1\n    return 0',
        expectedCC: 3,
        name: 'or_cond'
      },
      // 7. Try-except
      {
        code: 'def try_except():\n    try:\n        return 1/0\n    except ZeroDivisionError:\n        return 0',
        expectedCC: 2,
        name: 'try_except'
      },
      // 8. For loop
      {
        code: 'def for_loop(items):\n    total = 0\n    for item in items:\n        total += item\n    return total',
        expectedCC: 2,
        name: 'for_loop'
      },
      // 9. While loop
      {
        code: 'def while_loop(n):\n    i = 0\n    while i < n:\n        i += 1\n    return i',
        expectedCC: 2,
        name: 'while_loop'
      },
      // 10. Nested if (if inside if)
      {
        code: 'def nested_if(x, y):\n    if x > 0:\n        if y > 0:\n            return 1\n        return 0\n    return 0',
        expectedCC: 3, // We expect: outer if (1) + inner if (1) + base 1 = 3
        name: 'nested_if'
      }
    ];
    
    // Write each test case to a separate file
    const fileData = testCases.map(({ code, name }, index) => {
      const fileName = `${index}_${name}.py`;
      const filePath = join(tempDir, fileName);
      writeFileSync(filePath, code, 'utf8');
      return { filePath, expectedCC: testCases[index].expectedCC, name };
    });
    
    // Collect complexity using our provider
    const complexityInfo = await pythonASTComplexityProvider.collectComplexity(tempDir);
    
    console.log('Complexity Info:', complexityInfo);
    
    // Map the complexity info by file and function name
    const actualMap = new Map<string, number>();
    for (const info of complexityInfo) {
      const key = `${info.file}:${info.method}`;
      actualMap.set(key, info.cc);
    }
    
    // Prepare arrays for correlation
    const expectedCCs: number[] = [];
    const actualCCs: number[] = [];
    
    for (const { filePath, expectedCC, name } of fileData) {
      const fileName = filePath.split('/').pop() || '';
      const key = `${fileName}:${name}`;
      const actualCC = actualMap.get(key);
      if (actualCC === undefined) {
        throw new Error(`Could not find complexity for ${key}`);
      }
      expectedCCs.push(expectedCC);
      actualCCs.push(actualCC);
    }
    
    console.log('Expected CCs:', expectedCCs);
    console.log('Actual CCs:', actualCCs);
    
    const correlation = pearsonCorrelation(expectedCCs, actualCCs);
    console.log('Correlation:', correlation);
    
    expect(correlation).toBeGreaterThanOrEqual(0.95);
  });
});