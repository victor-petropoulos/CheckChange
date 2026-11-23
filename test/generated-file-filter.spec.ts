import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  buildEvidenceOutput,
  initProviderConfig,
  registerProvider,
  type EvidenceOutput,
} from '../src/evidence.js';
import { loadProviderConfig } from '../src/providers/config.js';

// TDD red (plan task 2): the generated-file filter does not exist yet
// (src/generated-filter.ts is created in plan task 3). Expected: behavioral
// failures (red), not hangs. Contract:
// docs/superpowers/specs/2026-11-23-generated-file-filter-design.md §3/§4/§5.

type ExcludedEntry = { file: string; reason: string };
type DiagnosticsWithExcluded = NonNullable<EvidenceOutput['diagnostics']> & {
  excludedGeneratedFiles?: ExcludedEntry[];
};

function excludedGeneratedFiles(out: EvidenceOutput): ExcludedEntry[] {
  return (out.diagnostics as DiagnosticsWithExcluded | undefined)?.excludedGeneratedFiles ?? [];
}

function stubReadCoverage() {
  return async () => ({ available: false, coverageMap: null, error: false });
}

describe('generated-file filter pipeline (buildEvidenceOutput)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-filter-spec-'));
    process.chdir(tmpDir);
    initProviderConfig();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    initProviderConfig();
  });

  test('all diffed files generated → NOT_EVALUATED/all-files-generated + exclusions + coverage lineage', async () => {
    const collect = vi.fn(async () => []);
    registerProvider('.js', { collectComplexity: collect, readCoverage: stubReadCoverage() });

    const intervals = new Map<string, { start: number; end: number }[]>([
      ['dist/bundle.js', [{ start: 1, end: 1 }]],
    ]);
    const out = await buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

    expect(out.gate).toBe('NOT_EVALUATED');
    expect(out.gateReason).toBe('all-files-generated');
    expect(out.analysisStatus).toBe('UNSUPPORTED');
    expect(out.completeness).toBe('INCOMPLETE');
    expect(out.schemaVersion).toBe('0.5');

    const excluded = excludedGeneratedFiles(out);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]!.file).toBe('dist/bundle.js');
    expect(typeof excluded[0]!.reason).toBe('string');
    expect(excluded[0]!.reason.length).toBeGreaterThan(0);

    // reviewer C2 / guardrail: early return still read coverage and pushed lineage
    expect(out.diagnostics?.lineage?.some((e) => e.stage === 'coverage')).toBe(true);
  });

  test('mixed diff: human file analyzed, bundle excluded', async () => {
    let received: ReadonlySet<string> | undefined;
    const collect = vi.fn(async (_cwd: string, _trace?: unknown, changedFiles?: ReadonlySet<string>) => {
      received = changedFiles;
      return [{ file: 'src/human.ts', method: 'humanFn', lineStart: 1, lineEnd: 2, cc: 1 }];
    });
    registerProvider('.ts', { collectComplexity: collect, readCoverage: stubReadCoverage() });

    const intervals = new Map<string, { start: number; end: number }[]>([
      ['src/human.ts', [{ start: 1, end: 2 }]],
      ['dist/bundle.js', [{ start: 1, end: 1 }]],
    ]);
    const out = await buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

    // collectComplexity must receive only non-generated files
    expect(received).toEqual(new Set(['src/human.ts']));

    const excluded = excludedGeneratedFiles(out);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]!.file).toBe('dist/bundle.js');

    expect(out.changedFunctions.some((f) => f.file === 'src/human.ts')).toBe(true);
    expect(out.changedFunctions.some((f) => f.file === 'dist/bundle.js')).toBe(false);
    expect(out.schemaVersion).toBe('0.5');
  });
});

describe('provider config version acceptance', () => {
  let cfgDir: string;

  beforeEach(() => {
    cfgDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-filter-config-'));
  });

  afterEach(() => {
    fs.rmSync(cfgDir, { recursive: true, force: true });
  });

  function writeConfig(raw: unknown): void {
    fs.writeFileSync(path.join(cfgDir, 'checkchange.providers.json'), JSON.stringify(raw), 'utf8');
  }

  test('version 1 config loads (existing configs keep working)', () => {
    writeConfig({ version: 1, providers: [{ language: 'typescript', extensions: ['.ts'] }] });
    const loaded = loadProviderConfig(cfgDir);
    expect(loaded.source).toBe('repo-root');
    expect(loaded.config.version).toBe(1);
  });

  test('version 2 config loads', () => {
    writeConfig({ version: 2, providers: [{ language: 'typescript', extensions: ['.ts'] }] });
    const loaded = loadProviderConfig(cfgDir);
    expect(loaded.source).toBe('repo-root');
    expect(loaded.config.version).toBe(2);
  });

  test('absent version treated as version 1', () => {
    writeConfig({ providers: [{ language: 'typescript', extensions: ['.ts'] }] });
    const loaded = loadProviderConfig(cfgDir);
    expect(loaded.config.version).toBe(1);
  });

  test('version 3 rejected', () => {
    writeConfig({ version: 3, providers: [{ language: 'typescript', extensions: ['.ts'] }] });
    expect(() => loadProviderConfig(cfgDir)).toThrow(/unsupported version 3/);
  });
});

describe('test-only diff gate reason (fix unit 8)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-filter-spec-test-'));
    process.chdir(tmpDir);
    initProviderConfig();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    initProviderConfig();
  });

  test('test-only diff -> NOT_EVALUATED with gateReason "test-files-excluded" (never all-files-generated)', async () => {
    const collect = vi.fn(async () => []);
    registerProvider('.ts', { collectComplexity: collect, readCoverage: stubReadCoverage() });

    const intervals = new Map<string, { start: number; end: number }[]>([
      ['src/human.test.ts', [{ start: 1, end: 1 }]],
    ]);
    const out = await buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

    expect(out.gate).toBe('NOT_EVALUATED');
    expect(out.gateReason).toBe('test-files-excluded');

    const excluded = excludedGeneratedFiles(out);
    expect(excluded).toEqual([{ file: 'src/human.test.ts', reason: 'test file' }]);

    // nothing analyzable remains -> provider never invoked
    expect(collect).not.toHaveBeenCalled();
  });

  test('mixed diff: test file excluded with reason "test file"; only human file collected', async () => {
    let received: ReadonlySet<string> | undefined;
    const collect = vi.fn(async (_cwd: string, _trace?: unknown, changedFiles?: ReadonlySet<string>) => {
      received = changedFiles;
      return [{ file: 'src/human.ts', method: 'humanFn', lineStart: 1, lineEnd: 2, cc: 1 }];
    });
    registerProvider('.ts', { collectComplexity: collect, readCoverage: stubReadCoverage() });

    const intervals = new Map<string, { start: number; end: number }[]>([
      ['src/human.ts', [{ start: 1, end: 2 }]],
      ['src/human.test.ts', [{ start: 1, end: 1 }]],
    ]);
    const out = await buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

    expect(received).toEqual(new Set(['src/human.ts']));
    const excluded = excludedGeneratedFiles(out);
    expect(excluded).toEqual([{ file: 'src/human.test.ts', reason: 'test file' }]);
    expect(out.changedFunctions.some((f) => f.file === 'src/human.test.ts')).toBe(false);
  });
});

describe('generatedIgnorePatterns validation (fix unit 8)', () => {
  let cfgDir: string;

  beforeEach(() => {
    cfgDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-filter-config-validation-'));
  });

  afterEach(() => {
    fs.rmSync(cfgDir, { recursive: true, force: true });
  });

  function writeConfig(raw: unknown): void {
    fs.writeFileSync(path.join(cfgDir, 'checkchange.providers.json'), JSON.stringify(raw), 'utf8');
  }

  test('non-string entries in generatedIgnorePatterns rejected', () => {
    writeConfig({ version: 2, generatedIgnorePatterns: [1], providers: [] });
    expect(() => loadProviderConfig(cfgDir)).toThrow(/generatedIgnorePatterns must be an array of strings/);
  });
});
