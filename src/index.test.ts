import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildEvidenceOutput } from './index.js';

describe('buildEvidenceOutput (barrel)', () => {
  test('is a function', () => {
    expect(typeof buildEvidenceOutput).toBe('function');
  });
});

describe('buildEvidenceOutput (hermetic)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'index-test-hermetic-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(
      join(tmpDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext' },
        include: ['src'],
      }),
      'utf8',
    );
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('positive: empty src, no coverage, empty intervals -> 0.5/PASS/SUCCESS', async () => {
    const intervals = new Map();
    const threshold = 30;
    const result = await buildEvidenceOutput('HEAD', intervals, tmpDir, threshold);

    expect(result.schemaVersion).toBe('0.5');
    expect(result.gate).toBe('PASS');
    expect(result.analysisStatus).toBe('SUCCESS');
  });

  test('negative: malformed .coverage -> FAILED/null/INCOMPLETE/coverageErrorReason malformed', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    const intervals = new Map();
    const threshold = 30;
    const result = await buildEvidenceOutput('HEAD', intervals, tmpDir, threshold);

    expect(result.schemaVersion).toBe('0.5');
    expect(result.gate).toBeNull();
    expect(result.analysisStatus).toBe('FAILED');
    expect(result.completeness).toBe('INCOMPLETE');
    // coverageErrorReason is a conditional-spread field on an untyped output object
    expect(result).toHaveProperty('coverageErrorReason', 'malformed');
  });
});
