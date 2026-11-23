import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { detectStack } from '../src/providers/prepare.js';
import { builtinConfig, deriveRegistry } from '../src/providers/index.js';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('detectStack', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-detect-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('TS project (package.json + app.ts + vitest.config.ts) detects typescript', () => {
    writeFileSync(join(tmpDir, 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vitest: '^1.0.0' } }),
      'utf8',
    );

    const registry = deriveRegistry(builtinConfig());

    const stack = detectStack(tmpDir, registry);

    expect(stack.languages).toContain('typescript');
    expect(stack.languages).not.toContain('javascript');
    expect(stack.lockfiles.get('typescript')).toBe('package.json');
  });

  test('Python project (app.py + pytest.ini) detects python', () => {
    writeFileSync(join(tmpDir, 'app.py'), 'print(1)\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\n', 'utf8');

    const registry = deriveRegistry(builtinConfig());

    const stack = detectStack(tmpDir, registry);

    expect(stack.languages).toContain('python');
    expect(stack.lockfiles.get('python')).toBe('pytest.ini');
  });

  test('Mixed TS + Python (both file sets) detects both languages', () => {
    writeFileSync(join(tmpDir, 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vitest: '^1.0.0' } }),
      'utf8',
    );
    writeFileSync(join(tmpDir, 'app.py'), 'print(1)\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\n', 'utf8');

    const registry = deriveRegistry(builtinConfig());

    const stack = detectStack(tmpDir, registry);

    expect(stack.languages).toContain('typescript');
    expect(stack.languages).toContain('python');
    expect(stack.lockfiles.get('typescript')).toBe('package.json');
    expect(stack.lockfiles.get('python')).toBe('pytest.ini');
  });

  test('Empty dir detects no languages', () => {
    const registry = deriveRegistry(builtinConfig());

    const stack = detectStack(tmpDir, registry);

    expect(stack.languages).toEqual([]);
  });
});
