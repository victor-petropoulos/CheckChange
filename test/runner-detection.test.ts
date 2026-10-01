import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { resolveRunner, deriveRegistry, builtinConfig } from '../src/providers/index.js';
import type { ProviderConfig } from '../src/providers/index.js';
import {
  writeFileSync,
  mkdirSync,
  rmSync,
  mkdtempSync,
  chmodSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('resolveRunner', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'runner-detection-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('TS project with vitest.config + package.json dep resolves typescript vitest', () => {
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vitest: '^1.0.0' } }),
      'utf8'
    );

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('typescript')).toBe(true);
    const runner = result.get('typescript')!;
    expect(runner.command).toEqual(['npx', 'vitest', 'run', '--coverage']);
    expect(runner.artifact).toBe('coverage/coverage-final.json');
    expect(runner.provenance).toContain('vitest.config');
  });

  test('JS project with jest.config resolves javascript jest', () => {
    writeFileSync(join(tmpDir, 'app.js'), 'console.log(1);\n', 'utf8');
    writeFileSync(join(tmpDir, 'jest.config.js'), 'module.exports = {};\n', 'utf8');

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('javascript')).toBe(true);
    const runner = result.get('javascript')!;
    expect(runner.command).toEqual(['npx', 'jest', '--coverage']);
    expect(runner.artifact).toBe('coverage/coverage-final.json');
    expect(runner.provenance).toContain('jest.config');
  });

  test('Python project with pytest.ini + .py + fake .venv/bin/pytest resolves python pytest, provenance mentions .venv', () => {
    writeFileSync(join(tmpDir, 'test_main.py'), 'def test_x():\n    pass\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\ntestpaths = tests\n', 'utf8');

    const venvBin = join(tmpDir, '.venv', 'bin');
    mkdirSync(venvBin, { recursive: true });
    const venvPytestPath = join(venvBin, 'pytest');
    writeFileSync(venvPytestPath, '#!/bin/sh\necho pytest\n', 'utf8');
    chmodSync(venvPytestPath, 0o755);

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('python')).toBe(true);
    const runner = result.get('python')!;
    expect(runner.command).toEqual(['python3', '-m', 'pytest', '--cov', '--cov-report=xml']);
    expect(runner.artifact).toBe('coverage.xml');
    expect(runner.provenance).toContain('.venv');
  });

  test('Mixed TS + Python project resolves both languages', () => {
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');

    writeFileSync(join(tmpDir, 'main.py'), 'print(1)\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\n', 'utf8');

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('typescript')).toBe(true);
    expect(result.has('python')).toBe(true);
  });

  test('Future language (rust) with custom provider config resolves rust, no src edits needed', () => {
    writeFileSync(
      join(tmpDir, 'Cargo.toml'),
      '[package]\nname = "test"\nversion = "0.1.0"\n',
      'utf8'
    );
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');

    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            {
              name: 'cargo test',
              configFiles: ['Cargo.toml'],
              binaryProbes: ['cargo test --version'],
              command: ['cargo', 'test'],
              artifact: 'target/coverage.json',
            },
          ],
        },
      ],
    };

    const registry = deriveRegistry(config);

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('rust')).toBe(true);
    const runner = result.get('rust')!;
    expect(runner.command).toEqual(['cargo', 'test']);
    expect(runner.artifact).toBe('target/coverage.json');
    expect(runner.provenance).toContain('Cargo.toml');
  });

  test('Empty tmp dir resolves empty Map', () => {
    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.size).toBe(0);
  });
});
