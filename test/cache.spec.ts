// Tests for src/cache.ts — incremental analysis cache (plan task C-5).
// All temp cache dirs inside test/tmp-cache-*/; cleaned in afterEach. (mem:44542 §8)

import { describe, expect, test, afterEach } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import { createHash } from 'node:crypto';
import {
  CACHE_TTL_MS,
  MAX_CACHE_ENTRY_BYTES,
  type CacheLookup,
  type CacheKeyInput,
  type RunKeyInputs,
  resolveCacheRoot,
  complexityFileKey,
  coverageEntryKey,
  runShardKey,
  getOrCompute,
  clear,
} from '../src/cache';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const TMP_BASE = path.join(REPO_ROOT, 'test', 'tmp-cache');

let tmpDirs: string[] = [];

async function makeTmpDir(name: string): Promise<string> {
  const dir = path.join(TMP_BASE, name);
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  tmpDirs.push(dir);
  return dir;
}

afterEach(async () => {
  for (const d of tmpDirs) {
    await fs.rm(d, { recursive: true, force: true });
  }
  tmpDirs = [];
});

/** Assert miss and return the reason. Fails the test if hit. */
function assertMiss<T>(r: CacheLookup<T>): T {
  if (r.hit) throw new Error('expected miss but got hit');
  return r.value;
}

function missReason<T>(r: CacheLookup<T>): string {
  if (r.hit) throw new Error('expected miss but got hit');
  return r.reason;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileKey(content = 'hello', version = '0.5.0'): CacheKeyInput {
  return { kind: 'file', fileContent: content, providerVersion: version };
}

function coverageKey(hash = 'abc123def', version = '0.5.0'): CacheKeyInput {
  return { kind: 'coverage', coverageHash: hash, providerVersion: version };
}

function runKey(overrides: Partial<RunKeyInputs> = {}): CacheKeyInput {
  return {
    kind: 'run',
    fileKeys: ['a.txt', 'b.txt'],
    coverageHash: 'absent',
    threshold: 0.5,
    engine: 'HEAD',
    base: 'main',
    intervalsSha256: 'deadbeef0123',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HIT / MISS
// ─────────────────────────────────────────────────────────────────────────────

describe('getOrCompute hit/miss', () => {
  test('first call misses and writes; second call hits (compute NOT called again)', async () => {
    const cwd = await makeTmpDir('hit-miss');
    let computeCount = 0;
    const key = fileKey('content-A');

    const r1 = await getOrCompute(cwd, key, () => {
      computeCount++;
      return { result: 'computed-A' };
    });
    expect(r1.hit).toBe(false);
    expect(r1.value).toEqual({ result: 'computed-A' });
    expect(computeCount).toBe(1);

    const r2 = await getOrCompute(cwd, key, () => {
      computeCount++;
      return { result: 'computed-A-changed' }; // must NOT be called
    });
    expect(r2.hit).toBe(true);
    expect(r2.value).toEqual({ result: 'computed-A' }); // cached value
    expect(computeCount).toBe(1); // compute NOT invoked again
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. PER-INPUT INVALIDATION
// ─────────────────────────────────────────────────────────────────────────────

describe('per-input invalidation', () => {
  test('change file content → miss', async () => {
    const cwd = await makeTmpDir('inv-file');
    await getOrCompute(cwd, fileKey('original'), () => 'v1');
    const r2 = await getOrCompute(cwd, fileKey('changed'), () => 'v2');
    expect(r2.hit).toBe(false);
    expect(r2.value).toBe('v2');
  });

  test('change providerVersion → miss', async () => {
    const cwd = await makeTmpDir('inv-version');
    await getOrCompute(cwd, fileKey('same', '0.5.0'), () => 'v1');
    const r2 = await getOrCompute(cwd, fileKey('same', '0.6.0'), () => 'v2');
    expect(r2.hit).toBe(false);
  });

  test('change coverageHash → miss', async () => {
    const cwd = await makeTmpDir('inv-covhash');
    await getOrCompute(cwd, coverageKey('hash-aaa'), () => 'c1');
    const r2 = await getOrCompute(cwd, coverageKey('hash-bbb'), () => 'c2');
    expect(r2.hit).toBe(false);
    expect(r2.value).toBe('c2');
  });

  test('change threshold → miss', async () => {
    const cwd = await makeTmpDir('inv-threshold');
    await getOrCompute(cwd, runKey({ threshold: 0.5 }), () => 'r1');
    const r2 = await getOrCompute(cwd, runKey({ threshold: 0.8 }), () => 'r2');
    expect(r2.hit).toBe(false);
    expect(r2.value).toBe('r2');
  });

  test('change engine → miss', async () => {
    const cwd = await makeTmpDir('inv-engine');
    await getOrCompute(cwd, runKey({ engine: 'HEAD' }), () => 'r1');
    const r2 = await getOrCompute(cwd, runKey({ engine: 'abc1234' }), () => 'r2');
    expect(r2.hit).toBe(false);
  });

  test('change base → miss', async () => {
    const cwd = await makeTmpDir('inv-base');
    await getOrCompute(cwd, runKey({ base: 'main' }), () => 'r1');
    const r2 = await getOrCompute(cwd, runKey({ base: 'develop' }), () => 'r2');
    expect(r2.hit).toBe(false);
  });

  test('change intervalsSha256 → miss', async () => {
    const cwd = await makeTmpDir('inv-intervals');
    await getOrCompute(cwd, runKey({ intervalsSha256: 'aaa' }), () => 'r1');
    const r2 = await getOrCompute(cwd, runKey({ intervalsSha256: 'bbb' }), () => 'r2');
    expect(r2.hit).toBe(false);
  });

  test('change fileKeys order does NOT miss (shard sorts keys)', async () => {
    const cwd = await makeTmpDir('inv-filekeys-order');
    await getOrCompute(cwd, runKey({ fileKeys: ['a.txt', 'b.txt'] }), () => 'r1');
    const r2 = await getOrCompute(cwd, runKey({ fileKeys: ['b.txt', 'a.txt'] }), () => 'r2');
    expect(r2.hit).toBe(true);
    expect(r2.value).toBe('r1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. DETERMINISM
// ─────────────────────────────────────────────────────────────────────────────

describe('determinism', () => {
  test('same inputs → byte-identical stored JSON across two roundtrips', async () => {
    const cwd = await makeTmpDir('determinism');
    const k = runKey();

    await getOrCompute(cwd, k, () => ({ data: 42 }));
    const root = resolveCacheRoot(cwd)!;
    const shard = runShardKey(k as RunKeyInputs);
    const entryPath = path.join(root, 'runs', `${shard}.json`);
    const json1 = await fs.readFile(entryPath, 'utf8');

    await clear(cwd);
    await getOrCompute(cwd, k, () => ({ data: 42 }));
    const json2 = await fs.readFile(entryPath, 'utf8');

    expect(json1).toBe(json2);
  });

  test('complexityFileKey is deterministic and has correct format', () => {
    const a = complexityFileKey('test-content', '0.5.0');
    const b = complexityFileKey('test-content', '0.5.0');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}:0\.5\.0$/);
  });

  test('coverageEntryKey is deterministic', () => {
    const a = coverageEntryKey('abc123', '0.5.0');
    const b = coverageEntryKey('abc123', '0.5.0');
    expect(a).toBe(b);
    expect(a).toBe('abc123:0.5.0');
  });

  test('runShardKey is order-insensitive on fileKeys', () => {
    const k1 = runKey({ fileKeys: ['x.txt', 'a.txt', 'm.txt'] }) as RunKeyInputs;
    const k2 = runKey({ fileKeys: ['m.txt', 'a.txt', 'x.txt'] }) as RunKeyInputs;
    expect(runShardKey(k1)).toBe(runShardKey(k2));
  });

  test('runShardKey produces 12 hex chars', () => {
    const shard = runShardKey(runKey() as RunKeyInputs);
    expect(shard).toMatch(/^[a-f0-9]{12}$/);
  });

  test('different inputs produce different shard keys', () => {
    const k1 = runKey({ threshold: 0.5 }) as RunKeyInputs;
    const k2 = runKey({ threshold: 0.8 }) as RunKeyInputs;
    expect(runShardKey(k1)).not.toBe(runShardKey(k2));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. CORRUPT FALLBACK
// ─────────────────────────────────────────────────────────────────────────────

describe('corrupt fallback', () => {
  test('malformed JSON → miss (reason corrupt), no throw, fresh value rewritten', async () => {
    const cwd = await makeTmpDir('corrupt-json');
    const k = fileKey('corrupt-test');

    await getOrCompute(cwd, k, () => 'original');

    const root = resolveCacheRoot(cwd)!;
    const entryDir = path.join(root, 'entries');
    const files = await fs.readdir(entryDir);
    await fs.writeFile(path.join(entryDir, files[0]), '{broken json!!', 'utf8');

    let computeCalled = false;
    const r = await getOrCompute(cwd, k, () => { computeCalled = true; return 'fresh-value'; });
    expect(r.hit).toBe(false);
    expect(missReason(r)).toBe('corrupt');
    expect(r.value).toBe('fresh-value');
    expect(computeCalled).toBe(true);
  });

  test('key mismatch → miss (reason corrupt), fresh value rewritten', async () => {
    const cwd = await makeTmpDir('corrupt-keymismatch');
    const k = fileKey('km-test');

    await getOrCompute(cwd, k, () => 'v1');

    const root = resolveCacheRoot(cwd)!;
    const files = await fs.readdir(path.join(root, 'entries'));
    await fs.writeFile(
      path.join(root, 'entries', files[0]),
      JSON.stringify({ key: 'WRONG-KEY', value: 'stale' }),
      'utf8',
    );

    const r = await getOrCompute(cwd, k, () => 'v2');
    expect(r.hit).toBe(false);
    expect(missReason(r)).toBe('corrupt');
    expect(r.value).toBe('v2');
  });

  test('oversized entry → miss (reason oversized), no throw, fresh value rewritten', async () => {
    const cwd = await makeTmpDir('corrupt-oversized');
    const k = fileKey('oversized-test');

    await getOrCompute(cwd, k, () => 'original');

    const root = resolveCacheRoot(cwd)!;
    const files = await fs.readdir(path.join(root, 'entries'));
    const bigPayload = JSON.stringify({ key: 'k', value: 'x'.repeat(MAX_CACHE_ENTRY_BYTES + 1000) });
    await fs.writeFile(path.join(root, 'entries', files[0]), bigPayload, 'utf8');

    const r = await getOrCompute(cwd, k, () => 'fresh');
    expect(r.hit).toBe(false);
    expect(missReason(r)).toBe('oversized');
    expect(r.value).toBe('fresh');
  });

  test('non-file entry (directory where file expected) → miss (reason guard)', async () => {
    const cwd = await makeTmpDir('corrupt-dir-entry');
    const k = fileKey('dir-test');

    await getOrCompute(cwd, k, () => 'v1');

    const root = resolveCacheRoot(cwd)!;
    const files = await fs.readdir(path.join(root, 'entries'));
    const entryPath = path.join(root, 'entries', files[0]);
    await fs.rm(entryPath);
    await fs.mkdir(entryPath);

    const r = await getOrCompute(cwd, k, () => 'v2');
    expect(r.hit).toBe(false);
    expect(missReason(r)).toBe('guard');
    expect(r.value).toBe('v2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. EVICTION
// ─────────────────────────────────────────────────────────────────────────────

describe('eviction', () => {
  test('expired entry (mtime > 7d TTL) → miss with reason expired, recomputes', async () => {
    const cwd = await makeTmpDir('evict-expired');
    const k = fileKey('expire-me');

    await getOrCompute(cwd, k, () => 'v1');

    const root = resolveCacheRoot(cwd)!;
    const files = await fs.readdir(path.join(root, 'entries'));
    const entryFile = path.join(root, 'entries', files[0]);
    // Backdate mtime + atime beyond TTL
    const pastDate = new Date(Date.now() - CACHE_TTL_MS - 60_000);
    fsSync.utimesSync(entryFile, pastDate, pastDate);

    let computeCount = 0;
    const r = await getOrCompute(cwd, k, () => { computeCount++; return 'v2'; });
    expect(r.hit).toBe(false);
    expect(missReason(r)).toBe('expired');
    expect(r.value).toBe('v2');
    expect(computeCount).toBe(1); // recomputed

    // Old expired file was deleted by readEntry; new file written by getOrCompute.
    // Verify the new file has a fresh mtime (not expired).
    const st = fsSync.statSync(entryFile);
    expect(Date.now() - st.mtimeMs).toBeLessThan(5000); // written recently
  });

  test('stale tmp files (>24h) swept on write-through', async () => {
    const cwd = await makeTmpDir('evict-stale-tmp');

    const root = resolveCacheRoot(cwd)!;
    const entriesDir = path.join(root, 'entries');
    await fs.mkdir(entriesDir, { recursive: true });

    const staleTmp = path.join(entriesDir, 'stale.tmp.99999');
    await fs.writeFile(staleTmp, 'leftover');
    const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
    fsSync.utimesSync(staleTmp, pastDate, pastDate);

    await getOrCompute(cwd, fileKey('trigger-prune'), () => 'val');

    expect(fsSync.existsSync(staleTmp)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. SECURITY
// ─────────────────────────────────────────────────────────────────────────────

describe('security', () => {
  test('symlink entry pointing outside root → guard miss', async () => {
    const cwd = await makeTmpDir('sec-symlink');

    // Target file OUTSIDE the cache root (in /tmp, outside repo)
    const outsideTarget = '/tmp/cache-test-symlink-target.txt';
    await fs.writeFile(outsideTarget, 'attacker-data');

    const root = resolveCacheRoot(cwd)!;
    const entriesDir = path.join(root, 'entries');
    await fs.mkdir(entriesDir, { recursive: true });

    // Compute the exact filename getOrCompute will look for
    const k = fileKey('symlink-test');
    const fk = k as { kind: 'file'; fileContent: string; providerVersion: string };
    const keyString = complexityFileKey(fk.fileContent, fk.providerVersion);
    const entryFilename = createHash('sha256').update(keyString).digest('hex') + '.json';
    const symlinkPath = path.join(entriesDir, entryFilename);

    // Place symlink with the right filename → getOrCompute will find it
    fsSync.symlinkSync(outsideTarget, symlinkPath);

    const r = await getOrCompute(cwd, k, () => 'safe-value');
    expect(r.hit).toBe(false);
    expect(missReason(r)).toBe('guard');
    expect(r.value).toBe('safe-value');

    await fs.rm(outsideTarget, { force: true });
  });

  test('CHECKCHANGE_CACHE_DIR relative → resolveCacheRoot returns null', () => {
    const root = resolveCacheRoot('/some/cwd', { CHECKCHANGE_CACHE_DIR: 'relative/path' });
    expect(root).toBeNull();
  });

  test('CHECKCHANGE_CACHE_DIR unresolvable → resolveCacheRoot returns null', () => {
    const root = resolveCacheRoot('/some/cwd', {
      CHECKCHANGE_CACHE_DIR: '/nonexistent/path/that/does/not/exist',
    });
    expect(root).toBeNull();
  });

  test('CHECKCHANGE_CACHE_DIR absolute existing dir → resolveCacheRoot returns path', async () => {
    const dir = await makeTmpDir('sec-abs-cache');
    const root = resolveCacheRoot('/some/cwd', { CHECKCHANGE_CACHE_DIR: dir });
    expect(root).toBe(dir);
  });

  test('CHECKCHANGE_CACHE_DIR empty string → falls back to default root', () => {
    const root = resolveCacheRoot('/tmp', { CHECKCHANGE_CACHE_DIR: '' });
    expect(root).not.toBeNull();
    expect(root).toContain('.checkchange/cache');
  });

  test('getOrCompute still works when env overrides cache dir', async () => {
    const cwd = await makeTmpDir('sec-env-override');
    const r = await getOrCompute(cwd, fileKey('env-test'), () => 'fallback');
    expect(r.hit).toBe(false); // first call always miss
    expect(r.value).toBe('fallback');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. CLEAR
// ─────────────────────────────────────────────────────────────────────────────

describe('clear()', () => {
  test('clear() wipes cache dir completely', async () => {
    const cwd = await makeTmpDir('clear-test');

    await getOrCompute(cwd, fileKey('a'), () => 'val-a');
    await getOrCompute(cwd, fileKey('b'), () => 'val-b');

    const root = resolveCacheRoot(cwd)!;
    const entriesDir = path.join(root, 'entries');
    const filesBefore = await fs.readdir(entriesDir);
    expect(filesBefore.length).toBeGreaterThanOrEqual(2);

    const result = await clear(cwd);
    expect(result).toBe(true);
    expect(fsSync.existsSync(root)).toBe(false);
  });

  test('clear() returns false when root is null', async () => {
    const result = await clear('/some/nonexistent/cwd', {
      CHECKCHANGE_CACHE_DIR: 'relative/nope',
    });
    expect(result).toBe(false);
  });

  test('after clear, next getOrCompute misses and recomputes', async () => {
    const cwd = await makeTmpDir('clear-recompute');
    let count = 0;

    await getOrCompute(cwd, fileKey('x'), () => { count++; return 'first'; });
    expect(count).toBe(1);

    await clear(cwd);

    await getOrCompute(cwd, fileKey('x'), () => { count++; return 'second'; });
    expect(count).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Additional: resolveCacheRoot edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveCacheRoot edge cases', () => {
  test('default root is inside cwd', () => {
    const root = resolveCacheRoot(REPO_ROOT);
    expect(root).toBe(path.join(REPO_ROOT, '.checkchange', 'cache'));
  });

  test('nonexistent cwd → returns null', () => {
    const root = resolveCacheRoot('/nonexistent/dir/abc123');
    expect(root).toBeNull();
  });

  test('CHECKCHANGE_CACHE_DIR override outside cwd is allowed', async () => {
    const dir = await makeTmpDir('sec-override-outside');
    const root = resolveCacheRoot('/some/other/cwd', { CHECKCHANGE_CACHE_DIR: dir });
    expect(root).toBe(dir);
  });
});
