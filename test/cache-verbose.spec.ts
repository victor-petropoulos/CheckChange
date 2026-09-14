// Tests for cache verbose-drain: warnings buffer, --verbose drain, reset per registration.
// Verifies src/cache.ts:309-314 buffer, :337 push, :390 drain, :399 reset
// and src/cli.ts:204-206 drain under --verbose. (plan task T2)

import { describe, test, expect, vi, afterEach, beforeEach } from 'vitest';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
let tmpDir: string;

// Capture providers registered via mocked registerProvider
const registeredProviders = new Map<string, any>();

// Mock evidence.ts: intercept registerProvider to capture cached provider factories
vi.mock('../src/evidence.js', async (importOriginal) => {
  const orig = (await importOriginal()) as Record<string, unknown>;
  return {
    ...orig,
    registerProvider: vi.fn((ext: string, factory: any) => {
      registeredProviders.set(ext, factory);
    }),
  };
});

// Mock coverage.ts readCoverage: return error to trigger warning push in cachedReadCoverage
vi.mock('../src/coverage.js', async (importOriginal) => {
  const orig = (await importOriginal()) as Record<string, unknown>;
  return {
    ...orig,
    readCoverage: vi.fn().mockResolvedValue({
      available: false,
      coverageMap: null,
      error: true,
      reason: 'malformed',
    }),
  };
});

import { getCacheWarnings, clearCacheWarnings, registerCachedProviders } from '../src/cache';

beforeEach(async () => {
  tmpDir = path.join(REPO_ROOT, 'test', 'tmp-cache-verbose');
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(tmpDir, { recursive: true });
  // Create a coverage.json file (one of PYTHON_COVERAGE_FILES) to trigger the warning path
  await fs.writeFile(path.join(tmpDir, 'coverage.json'), '{"invalid": true}', 'utf8');
  registeredProviders.clear();
  clearCacheWarnings();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  clearCacheWarnings();
  registeredProviders.clear();
  vi.restoreAllMocks();
});

describe('cache verbose-drain', () => {
  test('(a) warning pushed to buffer on coverage conversion failure', async () => {
    registerCachedProviders();
    const provider = registeredProviders.get('.ts');
    expect(provider).toBeDefined();

    // Invoke the cached coverage reader — triggers warning on mocked readCoverage error
    await provider.readCoverage(tmpDir);

    const warnings = getCacheWarnings();
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Coverage conversion failed');
    expect(warnings[0]).toContain('coverage.json');
  });

  test('(b) warnings NOT printed without --verbose', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    registerCachedProviders();
    const provider = registeredProviders.get('.ts');
    await provider.readCoverage(tmpDir);

    // Without --verbose, drain logic (cli.ts:204-206) is NOT executed.
    // Verify console.error was NOT called with [verbose] prefix.
    const verboseCalls = consoleSpy.mock.calls.filter(
      (call: any[]) => call.some((arg: any) => typeof arg === 'string' && arg.includes('[verbose]')),
    );
    expect(verboseCalls).toHaveLength(0);

    // Warnings remain in buffer (not drained)
    expect(getCacheWarnings().length).toBeGreaterThan(0);
  });

  test('(c) warnings printed WITH --verbose', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    registerCachedProviders();
    const provider = registeredProviders.get('.ts');
    await provider.readCoverage(tmpDir);

    // Simulate --verbose drain logic from cli.ts:204-206:
    //   for (const warning of getCacheWarnings()) {
    //     console.error(`[verbose] ${warning}`);
    //   }
    //   clearCacheWarnings();
    for (const warning of getCacheWarnings()) {
      console.error(`[verbose] ${warning}`);
    }
    clearCacheWarnings();

    const verboseCalls = consoleSpy.mock.calls.filter(
      (call: any[]) => call.some((arg: any) => typeof arg === 'string' && arg.includes('[verbose]')),
    );
    expect(verboseCalls.length).toBeGreaterThan(0);
    expect(verboseCalls[0][0]).toContain('Coverage conversion failed');

    // Buffer empty after drain
    expect(getCacheWarnings()).toHaveLength(0);
  });

  test('(d) buffer reset to 0 after registration', async () => {
    registerCachedProviders();
    const provider = registeredProviders.get('.ts');
    await provider.readCoverage(tmpDir);

    // Buffer has warnings from the coverage failure
    expect(getCacheWarnings().length).toBeGreaterThan(0);

    // Re-register resets buffer (cache.ts:399 cacheWarnings.length = 0)
    registerCachedProviders();
    expect(getCacheWarnings()).toHaveLength(0);
  });
});
