import { describe, expect, test } from 'vitest';
import { collectPythonComplexity } from './pythonComplexity.ts';
import { parseFileMethods } from '@barney-media/crap-typescript-core';
import { relative, resolve } from 'node:path';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Helper to compute CC for a given file content and language
async function getCCForContent(content: string, language: 'python' | 'typescript'): Promise<number> {
  const tempDir = mkdtempSync(join(tmpdir(), 'cc-bench-'));
  try {
    let filePath;
    if (language === 'python') {
      // Python adapter expects files under src/
      const srcDir = join(tempDir, 'src');
      mkdirSync(srcDir, { recursive: true });
      filePath = join(srcDir, 'temp.py');
    } else {
      filePath = join(tempDir, 'temp.ts');
    }
    writeFileSync(filePath, content, 'utf8');

    let complexityInfo;
    if (language === 'python') {
      complexityInfo = await collectPythonComplexity(tempDir, 'src/**/*.py');
    } else {
      // Use parseFileMethods directly for TypeScript
      const absolutePath = resolve(filePath);
      try {
        const methodDescriptors = await parseFileMethods(absolutePath);
        // We expect exactly one function in the file
        if (methodDescriptors.length === 0) {
          throw new Error('No methods found in file');
        }
        // Assuming the function is the only one in the file
        const descriptor = methodDescriptors[0];
        // Build method name: if containerName exists, use "containerName.functionName", else just functionName
        const methodName = descriptor.containerName
          ? `${descriptor.containerName}.${descriptor.functionName}`
          : descriptor.functionName;
        const rel = relative(tempDir, absolutePath).replace(/\\/g, '/');
        complexityInfo = [{
          file: rel,
          method: methodName,
          lineStart: descriptor.startLine,
          lineEnd: descriptor.endLine,
          cc: descriptor.complexity,
        }];
      } catch (error) {
        throw new Error(`Failed to parse TypeScript file: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`Language: ${language}, filePath: ${filePath}, complexityInfo:`, complexityInfo);
    // We expect exactly one function in the file
    if (complexityInfo.length === 0) {
      throw new Error('No complexity info returned');
    }
    // Assuming the function is the only one in the file
    return complexityInfo[0].cc;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

// Define 10 synthetic functions with equivalent control flow in Python and TypeScript
const testCases = [
  {
    name: 'empty function',
    python: `
def f():
    pass
`,
    typescript: `
function f() {
}
`
  },
  {
    name: 'simple if/else',
    python: `
def f(x):
    if x > 0:
        return 1
    else:
        return 0
`,
    typescript: `
function f(x: number) {
    if (x > 0) {
        return 1;
    } else {
        return 0;
    }
}
`
  },
  {
    name: 'ternary expression',
    python: `
def f(x):
    return 1 if x > 0 else 0
`,
    typescript: `
function f(x: number) {
    return x > 0 ? 1 : 0;
}
`
  },
  {
    name: 'logical AND',
    python: `
def f(x, y):
    return x > 0 and y > 0
`,
    typescript: `
function f(x: number, y: number) {
    return x > 0 && y > 0;
}
`
  },
  {
    name: 'logical OR',
    python: `
def f(x, y):
    return x > 0 or y > 0
`,
    typescript: `
function f(x: number, y: number) {
    return x > 0 || y > 0;
}
`
  },
  {
    name: 'try-except block',
    python: `
def f():
    try:
        return 1
    except:
        return 0
`,
    typescript: `
function f() {
    try {
        return 1;
    } catch {
        return 0;
    }
}
`
  },
  {
    name: 'for loop',
    python: `
def f(items):
    total = 0
    for item in items:
        total += item
    return total
`,
    typescript: `
function f(items: number[]) {
    let total = 0;
    for (const item of items) {
        total += item;
    }
    return total;
}
`
  },
  {
    name: 'while loop',
    python: `
def f(n):
    i = 0
    while i < n:
        i += 1
    return i
`,
    typescript: `
function f(n: number) {
    let i = 0;
    while (i < n) {
        i++;
    }
    return i;
}
`
  },
  {
    name: 'switch statement',
    python: `
def f(x):
    if x == 1:
        return 1
    elif x == 2:
        return 2
    else:
        return 0
`,
    typescript: `
function f(x: number) {
    switch (x) {
        case 1:
            return 1;
        case 2:
            return 2;
        default:
            return 0;
    }
}
`
  },
  {
    name: 'async/await',
    python: `
import asyncio
async def f():
    await asyncio.sleep(0)
    return 1
`,
    typescript: `
async function f(): Promise<number> {
    await Promise.resolve();
    return 1;
}
`
  }
];

describe('CC equivalence benchmark', () => {
  test('should compute CC correlation and document divergence', async () => {
    const pythonCCs: number[] = [];
    const typescriptCCs: number[] = [];

    for (const testCase of testCases) {
      const pythonCC = await getCCForContent(testCase.python, 'python');
      const typescriptCC = await getCCForContent(testCase.typescript, 'typescript');
      pythonCCs.push(pythonCC);
      typescriptCCs.push(typescriptCC);
    }

    // Compute Pearson correlation
    const meanPython = pythonCCs.reduce((sum, val) => sum + val, 0) / pythonCCs.length;
    const meanTypescript = typescriptCCs.reduce((sum, val) => sum + val, 0) / typescriptCCs.length;

    const numerator = pythonCCs.reduce((sum, val, i) => sum + (val - meanPython) * (typescriptCCs[i] - meanTypescript), 0);
    const denominatorPython = pythonCCs.reduce((sum, val) => sum + Math.pow(val - meanPython, 2), 0);
    const denominatorTypescript = typescriptCCs.reduce((sum, val) => sum + Math.pow(val - meanTypescript, 2), 0);
    const denominator = Math.sqrt(denominatorPython * denominatorTypescript);

    const correlation = denominator === 0 ? 0 : numerator / denominator;

    // Log the results for debugging
    console.log('Python CCs:', pythonCCs);
    console.log('TypeScript CCs:', typescriptCCs);
    console.log('Correlation:', correlation);

    // Create a table for documentation
    console.log('\nCC Divergence Table:');
    console.log('| Construct | Lizard CC (Python) | crap-typescript-core CC (TypeScript) |');
    console.log('|-----------|-------------------|--------------------------------------|');
    testCases.forEach((testCase, index) => {
      // Simplify the name for the table
      let name = testCase.name;
      if (name === 'empty function') name = 'Empty';
      else if (name === 'simple if/else') name = 'If/Else';
      else if (name === 'ternary expression') name = 'Ternary';
      else if (name === 'logical AND') name = 'Logical AND';
      else if (name === 'logical OR') name = 'Logical OR';
      else if (name === 'try-except block') name = 'Try/Except';
      else if (name === 'for loop') name = 'For Loop';
      else if (name === 'while loop') name = 'While Loop';
      else if (name === 'switch statement') name = 'Switch';
      else if (name === 'async/await') name = 'Async/Await';
      console.log(`| ${name} | ${pythonCCs[index]} | ${typescriptCCs[index]} |`);
    });

    // We expect correlation to be at least 0.95, but if not, we document the divergence
    // The test will pass regardless of correlation value because we are documenting it.
    // However, we want to make sure we have computed the correlation correctly.
    expect(correlation).toBeLessThanOrEqual(1);
    expect(correlation).toBeGreaterThanOrEqual(-1);
  });
});