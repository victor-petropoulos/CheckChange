import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readCoverage } from '../../../src/coverage';
import { parseCoverageReport } from '@barney-media/crap-typescript-core';
import { join, relative } from 'node:path';
import * as path from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';

describe('wp56-f03-path-normalization', () => {
  let otherRepoDir: string;
  let currentCwd: string;
  let currentFilePath: string;
  let fakeCoverageFilePath: string;
  let relativePath: string;
  let otherRepoFilePath: string;

  beforeEach(async () => {
    relativePath = join('src', 'sample.ts');

    otherRepoDir = join(tmpdir(), `wp56-f03-other-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    currentCwd = join(tmpdir(), `wp56-f03-current-${Date.now()}-${Math.random().toString(36).slice(2)}`);

    otherRepoFilePath = join(otherRepoDir, relativePath);
    currentFilePath = join(currentCwd, relativePath);

    // Create directory + real TS file under currentCwd (the "replay" cwd).
    await mkdir(join(currentCwd, 'src'), { recursive: true });
    await writeFile(
      currentFilePath,
      [
        'export function sampleFunction(x: number): number {',
        '  if (x > 0) {',
        '    return x * 2;',
        '  }',
        '  return 0;',
        '}',
      ].join('\n'),
      'utf8'
    );

    // Synthetic Istanbul artifact: KEY is the absolute path as it would have
    // existed in the otherRepo cwd; path field is also absolute. parseCoverageReport
    // preserves the absolute path as the map key (per istanbul.js:76-80).
    const fakeCoverage = {
      [otherRepoFilePath]: {
        path: otherRepoFilePath,
        statementMap: { '1': { start: { line: 1, column: 0 }, end: { line: 6, column: 1 } } },
        s: { '1': 1 },
        branchMap: {},
        b: {},
        fnMap: {},
        f: {},
      },
    };

    fakeCoverageFilePath = join(tmpdir(), `wp56-f03-coverage-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
    await writeFile(fakeCoverageFilePath, JSON.stringify(fakeCoverage), 'utf8');
  });

  afterEach(async () => {
    try { await rm(fakeCoverageFilePath, { force: true }); } catch { /* noop */ }
    try { await rm(currentCwd, { recursive: true, force: true }); } catch { /* noop */ }
    try { await rm(otherRepoDir, { recursive: true, force: true }); } catch { /* noop */ }
  });

  it('rebases coverage keys onto the current cwd when a matching file exists there', async () => {
    expect(existsSync(currentFilePath)).toBe(true);

    // Get the raw key that parseCoverageReport would return without normalization.
    const raw = await parseCoverageReport(fakeCoverageFilePath, currentCwd);
    const rawKeys = Array.from(raw.keys());
    expect(rawKeys.length).toBeGreaterThan(0);
    const rawKey = rawKeys[0]!;
    // Sanity: the raw key is the absolute path from the other repo cwd.
    expect(path.basename(rawKey)).toBe('sample.ts');

    // After readCoverage, the key should be rebased onto currentCwd.
    const result = await readCoverage(currentCwd, fakeCoverageFilePath);
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    if (!result.coverageMap) return;

    const keys = Array.from(result.coverageMap.keys());
    expect(keys.length).toBeGreaterThan(0);

    // The rebased key must start with currentCwd and point to a real file.
    const rebasedKey = keys.find((k) => k.startsWith(currentCwd));
    expect(rebasedKey).toBeDefined();
    expect(existsSync(rebasedKey!)).toBe(true);

    // The rebased key's relative form should match the relative path used in
    // the coverage JSON.
    const rel = relative(currentCwd, rebasedKey!).replace(/\\/g, '/');
    expect(rel).toBe(relativePath.replace(/\\/g, '/'));
  });

  it('leaves coverage keys unchanged when no matching file exists under current cwd', async () => {
    // Remove the source file so normalization has no rebasing target.
    await rm(currentFilePath, { force: true });

    const result = await readCoverage(currentCwd, fakeCoverageFilePath);
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    if (!result.coverageMap) return;

    const keys = Array.from(result.coverageMap.keys());
    expect(keys.length).toBeGreaterThan(0);

    // No key should be rebased to currentCwd.
    for (const k of keys) {
      expect(k.startsWith(currentCwd)).toBe(false);
    }
  });
});
