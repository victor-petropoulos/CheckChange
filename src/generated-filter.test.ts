import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { isGenerated, filterDiffedFiles } from './generated-filter.js';

// TDD red (plan task 2): these tests import src/generated-filter.ts, which does
// not exist until plan task 3. Expected: module-missing failure (red).
// Behavior contract: docs/superpowers/specs/2026-11-23-generated-file-filter-design.md §2/§5.

describe('isGenerated', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'generated-filter-unit-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('.min.js suffix is generated', () => {
    expect(isGenerated('panel/main.min.js')).toBe(true);
  });

  test('ordinary source file is not generated', () => {
    expect(isGenerated('src/main.ts')).toBe(false);
  });

  test('/dist/ path segment delegated to core isAnalyzableFile', () => {
    // core EXCLUDED_PATH_SEGMENTS includes /dist/ (verified against
    // @barney-media/crap-typescript-core/dist/fileSelection.js:8-14)
    expect(isGenerated('dist/main.js')).toBe(true);
  });

  test('/node_modules/ path segment delegated to core isAnalyzableFile', () => {
    expect(isGenerated('node_modules/pkg/index.js')).toBe(true);
  });

  test('.js with sibling .js.map sidecar is generated', () => {
    const panelDir = path.join(tmpDir, 'panel');
    fs.mkdirSync(panelDir, { recursive: true });
    const bundle = path.join(panelDir, 'main.js');
    fs.writeFileSync(bundle, 'console.log(1);\n', 'utf8');
    fs.writeFileSync(`${bundle}.map`, '{}\n', 'utf8');
    expect(isGenerated(bundle)).toBe(true);
  });

  test('.js without sibling .js.map sidecar is not generated', () => {
    const panelDir = path.join(tmpDir, 'panel');
    fs.mkdirSync(panelDir, { recursive: true });
    const bundle = path.join(panelDir, 'main.js');
    fs.writeFileSync(bundle, 'console.log(1);\n', 'utf8');
    expect(isGenerated(bundle)).toBe(false);
  });

  test('@generated banner marker is generated', () => {
    // core DEFAULT_GENERATED_MARKERS includes '@generated'
    // (@barney-media/crap-typescript-core/dist/sourceExclusions.js:19-27)
    const banner = path.join(tmpDir, 'banner.ts');
    fs.writeFileSync(banner, '// @generated\nexport const value = 1;\n', 'utf8');
    expect(isGenerated(banner)).toBe(true);
  });

  test('generatedIgnorePatterns re-include forces inclusion', () => {
    // Q4 safety valve: config escape hatch overrides default exclusion
    expect(isGenerated('panel/main.min.js', { generatedIgnorePatterns: ['panel/main.min.js'] })).toBe(false);
  });
});

describe('filterDiffedFiles', () => {
  test('partitions generated files out of intervals', () => {
    const intervals = new Map<string, { start: number; end: number }[]>([
      ['src/human.ts', [{ start: 1, end: 2 }]],
      ['panel/main.min.js', [{ start: 1, end: 1 }]],
    ]);
    const { filtered, excluded } = filterDiffedFiles(intervals);
    expect(filtered instanceof Map).toBe(true);
    expect(Array.from(filtered.keys())).toEqual(['src/human.ts']);
    expect(excluded).toHaveLength(1);
    expect(excluded[0]!.file).toBe('panel/main.min.js');
    expect(typeof excluded[0]!.reason).toBe('string');
    expect(excluded[0]!.reason.length).toBeGreaterThan(0);
  });

  test('excludes /dist/ bundle intervals', () => {
    const intervals = new Map<string, { start: number; end: number }[]>([
      ['dist/bundle.js', [{ start: 1, end: 1 }]],
    ]);
    const { filtered, excluded } = filterDiffedFiles(intervals);
    expect(filtered.size).toBe(0);
    expect(excluded.map((e: { file: string; reason: string }) => e.file)).toEqual(['dist/bundle.js']);
  });

  test('re-include keeps a generated file and reports no exclusions', () => {
    const intervals = new Map<string, { start: number; end: number }[]>([
      ['panel/main.min.js', [{ start: 1, end: 1 }]],
    ]);
    const { filtered, excluded } = filterDiffedFiles(intervals, {
      generatedIgnorePatterns: ['panel/main.min.js'],
    });
    expect(Array.from(filtered.keys())).toEqual(['panel/main.min.js']);
    expect(excluded).toEqual([]);
  });

  test('empty input yields empty output', () => {
    const { filtered, excluded } = filterDiffedFiles(new Map());
    expect(filtered.size).toBe(0);
    expect(excluded).toEqual([]);
  });
});

// Fix unit 8: test files keep being excluded from CRAP analysis, but with their
// OWN classification reason ('test file') — never the core-segment fallthrough.
// Raw *.js.map diffed files are classified generated ('source map file (.map)').

describe('test-file classification reason (fix unit 8)', () => {
  test('.test.ts is generated with reason "test file"', () => {
    expect(isGenerated('src/foo.test.ts')).toBe(true);
    const { filtered, excluded } = filterDiffedFiles(new Map([['src/foo.test.ts', [{ start: 1, end: 2 }]]]));
    expect(filtered.size).toBe(0);
    expect(excluded).toEqual([{ file: 'src/foo.test.ts', reason: 'test file' }]);
  });

  test('.spec.ts is generated with reason "test file"', () => {
    expect(isGenerated('a.spec.ts')).toBe(true);
    const { excluded } = filterDiffedFiles(new Map([['a.spec.ts', [{ start: 1, end: 2 }]]]));
    expect(excluded).toEqual([{ file: 'a.spec.ts', reason: 'test file' }]);
  });
});

describe('raw source map classification (fix unit 8)', () => {
  test('.js.map diffed file is generated with reason "source map file (.map)"', () => {
    expect(isGenerated('panel/main.js.map')).toBe(true);
    const { filtered, excluded } = filterDiffedFiles(new Map([['panel/main.js.map', [{ start: 1, end: 1 }]]]));
    expect(filtered.size).toBe(0);
    expect(excluded).toEqual([{ file: 'panel/main.js.map', reason: 'source map file (.map)' }]);
  });
});
