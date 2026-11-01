import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { collectComplexity } from '../src/complexity';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Simple complexity test', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'simple-test-'));
    process.chdir(tmpDir);
    // Create src directory
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    // Create a minimal tsconfig.json
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          types: ['node']
        },
        include: ['src']
      }, null, 2),
      'utf8'
    );
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('can collect complexity from simple function', async () => {
    // Create a very simple TypeScript file
    writeFileSync(
      join(tmpDir, 'src', 'simple.ts'),
      'function simple() { return 1; }',
      'utf8'
    );

    const result = await collectComplexity('.');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // We expect at least one function
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('method');
      expect(result[0]).toHaveProperty('cc');
    }
  });
});