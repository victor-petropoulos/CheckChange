import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildEvidenceOutput } from '../src/evidence.js';

describe('diagnostics fingerprints (task 5)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'fingerprints-test-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    mkdirSync(join(tmpDir, 'coverage'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const createTsFile = (relPath: string, content: string) => {
    writeFileSync(join('src', relPath), content, 'utf8');
  };

  const createCoverage = (covObj: any) => {
    writeFileSync(join('coverage', 'coverage-final.json'), JSON.stringify(covObj, null, 2), 'utf8');
  };

  // Proven geometry (mirrors test/wp4.2.test.ts case 5 / quality.test.ts):
  // each statement spans the single-line function body at column 21.
  const coverageFor = (stmtLines: Record<string, number>, executed: Record<string, number>) => ({
    'src/mix.ts': {
      statementMap: Object.fromEntries(
        Object.entries(stmtLines).map(([idx, line]) => [
          idx,
          { start: { line, column: 21 }, end: { line, column: 34 } },
        ])
      ),
      s: executed,
    },
  });

  const intervals = (): Map<string, Array<{ start: number; end: number }>> => {
    const m = new Map<string, Array<{ start: number; end: number }>>();
    m.set('src/mix.ts', [{ start: 1, end: 10 }]);
    return m;
  };

  test('same function → same fingerprint across runs; SHA-256 hex shape; whole output deterministic', async () => {
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\n');
    createCoverage(coverageFor({ 0: 2 }, { 0: 1 }));

    const first = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;
    const second = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;

    // Key per diagnostics-schema-design.md: file:method:lineStart
    const key = 'src/mix.ts:covered:2';
    const f1 = first.diagnostics.fingerprints;
    const f2 = second.diagnostics.fingerprints;
    expect(f1[key]).toBeDefined();
    expect(f1[key]).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex digest
    expect(f1[key]).toEqual(f2[key]); // same function → same hash
    expect(JSON.stringify(first)).toBe(JSON.stringify(second)); // run determinism
  });

  test('different function content → different fingerprint (same key)', async () => {
    const key = 'src/mix.ts:covered:2';
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\n');
    createCoverage(coverageFor({ 0: 2 }, { 0: 1 }));
    const first = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;
    const firstHash = first.diagnostics.fingerprints[key];

    // Same file:method:lineStart key, but wider body → lineEnd/cc differ
    createTsFile('mix.ts', '\nfunction covered() {\n  return 1;\n}\n');
    const second = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;
    const secondHash = second.diagnostics.fingerprints[key];

    expect(secondHash).toBeDefined();
    expect(secondHash).not.toEqual(firstHash);
  });

  test('one key per changed function; values distinct between functions', async () => {
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\nfunction uncovered() { return 0; }\n');
    createCoverage(coverageFor({ 0: 2, 1: 3 }, { 0: 1, 1: 0 }));
    const out = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;

    const fp = out.diagnostics.fingerprints;
    expect(Object.keys(fp)).toHaveLength(2);
    expect(fp['src/mix.ts:covered:2']).toBeDefined();
    expect(fp['src/mix.ts:uncovered:3']).toBeDefined();
    expect(fp['src/mix.ts:covered:2']).not.toEqual(fp['src/mix.ts:uncovered:3']);
  });

  test('unchanged function not fingerprinted', async () => {
    // Only fn at line 2 falls inside interval 1..10; fn at line 20 is untouched
    createTsFile('mix.ts', '\nfunction changed() { return 1; }\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nfunction untouched() { return 2; }\n');
    createCoverage(coverageFor({ 0: 2 }, { 0: 1 }));
    const out = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;

    const fp = out.diagnostics.fingerprints;
    expect(fp['src/mix.ts:changed:2']).toBeDefined();
    expect(fp['src/mix.ts:untouched:20']).toBeUndefined();
  });

  test('no fingerprints field when no changed functions (unsupported analysis)', async () => {
    writeFileSync(join('src', 'README.md'), '# Unsupported\n', 'utf8');
    const m = new Map<string, Array<{ start: number; end: number }>>();
    m.set('src/README.md', [{ start: 1, end: 10 }]);
    const out = (await buildEvidenceOutput('HEAD', m, '.', 30)) as any;

    expect(out.diagnostics.fingerprints).toBeUndefined();
  });
});