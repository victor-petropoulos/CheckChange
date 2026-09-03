/// <reference types="vitest" />
import { describe, expect, test } from 'vitest';
import { collectComplexity } from '../../src/complexity';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('collectComplexity', () => {
  test('collectComplexity includes .js', async () => {
const testDir = resolve('/tmp/js-sample');
     const originalCwd = process.cwd();
     // setup
     execSync(`mkdir -p "${testDir}"`);
     process.chdir(testDir);
     execSync('git init');
     execSync('echo "function low(a){return a+1}" > low.js');
     // Create a tsconfig.json to include JS files
     execSync('echo {\"compilerOptions\":{\"target\":\"ES2020\",\"module\":\"commonjs\"},\"include\":[\"**/*\"]} > tsconfig.json');
     execSync('git add low.js tsconfig.json');
     execSync('git commit -m "initial"');
     
     try {
       const result = await collectComplexity(testDir);
       const filePaths = result.map(info => info.file);
       expect(filePaths).toContain('low.js');
     } finally {
       // cleanup
       process.chdir(originalCwd);
       execSync(`rm -rf "${testDir}"`);
     }
  });
});
