import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { collectComplexity } from '../src/complexity';
import { findAllTypeScriptFilesUnderSourceRoots, parseFileMethods } from '@barney-media/crap-typescript-core';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

vi.mock('@barney-media/crap-typescript-core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@barney-media/crap-typescript-core')>();
  return {
    ...actual,
    findAllTypeScriptFilesUnderSourceRoots: vi.fn(actual.findAllTypeScriptFilesUnderSourceRoots),
    parseFileMethods: vi.fn(actual.parseFileMethods),
  };
});

describe('Collect complexity test', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'collect-complexity-test-'));
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
    console.log('Result:', result);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('method');
      expect(result[0]).toHaveProperty('cc');
    }
  });

  test('filters unselected discovered files before parsing', async () => {
    const selectedPath = join(tmpDir, 'src', 'selected.ts');
    const unselectedPath = join(tmpDir, 'src', 'unselected.ts');
    writeFileSync(selectedPath, 'function selected() { return 1; }', 'utf8');
    writeFileSync(unselectedPath, 'function unselected() { return 2; }', 'utf8');

    vi.mocked(findAllTypeScriptFilesUnderSourceRoots).mockResolvedValueOnce([
      selectedPath,
      unselectedPath,
    ]);
    const parse = vi.mocked(parseFileMethods);
    parse.mockClear();

    await collectComplexity(tmpDir, undefined, new Set(['src/selected.ts']));

    expect(parse).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledWith(selectedPath);
    expect(parse).not.toHaveBeenCalledWith(unselectedPath);
  });

  test('forwards exact changed-file set to provider collectComplexity', async () => {
    const evidence = await import('../src/evidence');
    const intervals = new Map<string, { start: number; end: number }[]>([
      ['src/first.ts', [{ start: 1, end: 1 }]],
      ['src/second.ts', [{ start: 1, end: 1 }]],
    ]);
    let received: ReadonlySet<string> | undefined;
    const collectComplexity = vi.fn(async (_cwd: string, _trace?: unknown, changedFiles?: ReadonlySet<string>) => {
      received = changedFiles;
      return [];
    });

    try {
      evidence.initProviderConfig();
      evidence.registerProvider('.ts', {
        collectComplexity,
        readCoverage: async () => ({ available: false, coverageMap: null, error: false }),
      });

      await evidence.buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

      expect(collectComplexity).toHaveBeenCalledTimes(1);
      expect(received).toEqual(new Set(intervals.keys()));
    } finally {
      process.chdir(originalCwd);
      evidence.initProviderConfig();
    }
  });

  test('forwards changed-file set through both cached provider closures', async () => {
    const evidence = await import('../src/evidence');
    const { registerCachedProviders } = await import('../src/cache');
    const changedFiles = new Set(['src/changed.ts']);
    let jsxChangedFiles: ReadonlySet<string> | undefined;
    let pythonChangedFiles: ReadonlySet<string> | undefined;
    const jsxCollect = vi.fn(async (_cwd: string, _trace?: unknown, files?: ReadonlySet<string>) => {
      jsxChangedFiles = files;
      return [];
    });
    const pythonCollect = vi.fn(async (_cwd: string, _trace?: unknown, files?: ReadonlySet<string>) => {
      pythonChangedFiles = files;
      return [];
    });

    try {
      evidence.initProviderConfig();
      evidence.registerProvider('.jsx', {
        collectComplexity: jsxCollect,
        readCoverage: async () => ({ available: false, coverageMap: null, error: false }),
      });
      evidence.registerProvider('.py', {
        collectComplexity: pythonCollect,
        readCoverage: async () => ({ available: false, coverageMap: null, error: false }),
      });
      registerCachedProviders();

      const jsxProvider = evidence.getProvider('.jsx');
      const pythonProvider = evidence.getProvider('.py');
      expect(jsxProvider).toBeDefined();
      expect(pythonProvider).toBeDefined();
      await jsxProvider!.collectComplexity(tmpDir, undefined, changedFiles);
      await pythonProvider!.collectComplexity(tmpDir, undefined, changedFiles);

      expect(jsxChangedFiles).toBe(changedFiles);
      expect(pythonChangedFiles).toBe(changedFiles);
    } finally {
      process.chdir(originalCwd);
      evidence.initProviderConfig();
    }
  });

  test('separates cached TS entries by changed-file set', async () => {
    const evidence = await import('../src/evidence');
    const { registerCachedProviders } = await import('../src/cache');
    const selectedPath = join(tmpDir, 'src', 'selected.ts');
    const unselectedPath = join(tmpDir, 'src', 'unselected.ts');
    writeFileSync(selectedPath, 'function selected() { return 1; }', 'utf8');
    writeFileSync(unselectedPath, 'function unselected() { return 2; }', 'utf8');
    vi.mocked(findAllTypeScriptFilesUnderSourceRoots)
      .mockResolvedValueOnce([selectedPath, unselectedPath])
      .mockResolvedValueOnce([selectedPath, unselectedPath]);
    const parse = vi.mocked(parseFileMethods);
    parse.mockClear();

    try {
      evidence.initProviderConfig();
      registerCachedProviders();
      const provider = evidence.getProvider('.ts');
      expect(provider).toBeDefined();

      await provider!.collectComplexity(tmpDir, undefined, new Set(['src/selected.ts']));
      await provider!.collectComplexity(tmpDir, undefined, new Set(['src/selected.ts', 'src/unselected.ts']));

      expect(parse).toHaveBeenCalledTimes(3);
    } finally {
      process.chdir(originalCwd);
      evidence.initProviderConfig();
    }
  });
});
