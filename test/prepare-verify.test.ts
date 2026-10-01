import { describe, expect, test, afterEach } from 'vitest';
import { verifyInstall, detectStack } from '../src/providers/prepare.js';
import type { DetectedStack, PrepareOptions, VerifyReport, VerifyAnalyzer } from '../src/providers/prepare.js';
import { builtinConfig, deriveRegistry } from '../src/providers/index.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** verifyInstall ignores its `stack` param (re-derives from cwd), so a stub suffices. */
function stubStack(): DetectedStack {
  return {
    languages: [],
    runners: new Map(),
    lockfiles: new Map(),
  };
}

describe('verifyInstall', () => {
  let tmpDirs: string[] = [];

  afterEach(() => {
    for (const d of tmpDirs) {
      rmSync(d, { recursive: true, force: true });
    }
    tmpDirs = [];
  });

  test('this repo: all analyzers ok and overall ok true (live probes)', async () => {
    const cwd = process.cwd();
    const registry = deriveRegistry(builtinConfig());
    const stack = detectStack(cwd, registry);
    const options: PrepareOptions = { cwd, dryRun: false, json: false, yes: false };

    const result = await verifyInstall(stack, options);

    expect(result.ok).toBe(true);
    expect(result.analyzers).toHaveLength(3);
    for (const a of result.analyzers) {
      expect(a.status).toBe('ok');
    }
  }, 30_000);

  test('unknown empty tmp dir: report shape with reDetected.languages []', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'prepare-verify-test-'));
    tmpDirs.push(tmpDir);
    const options: PrepareOptions = { cwd: tmpDir, dryRun: false, json: false, yes: false };

    const result = await verifyInstall(stubStack(), options);

    // Shape: reDetected, analyzers, ok
    expect(result).toHaveProperty('reDetected');
    expect(result).toHaveProperty('analyzers');
    expect(result).toHaveProperty('ok');

    // re-detected stack has no languages (empty dir, no source files)
    expect(result.reDetected.languages).toEqual([]);

    // Loose status check: each analyzer is ok or unfixable
    expect(result.analyzers).toHaveLength(3);
    for (const a of result.analyzers) {
      expect(['ok', 'unfixable']).toContain(a.status);
    }
  }, 30_000);

  test('report fields present on each analyzer and reDetected', async () => {
    const cwd = process.cwd();
    const registry = deriveRegistry(builtinConfig());
    const stack = detectStack(cwd, registry);
    const options: PrepareOptions = { cwd, dryRun: false, json: false, yes: false };

    const result = await verifyInstall(stack, options);

    // reDetected sub-fields
    expect(result.reDetected).toHaveProperty('languages');
    expect(result.reDetected).toHaveProperty('runners');
    expect(result.reDetected).toHaveProperty('lockfiles');
    expect(Array.isArray(result.reDetected.languages)).toBe(true);

    // Each analyzer has name (string), status ('ok'|'unfixable'), detail (string)
    expect(result.analyzers.length).toBeGreaterThan(0);
    for (const a of result.analyzers) {
      expect(typeof a.name).toBe('string');
      expect(a.name.length).toBeGreaterThan(0);
      expect(['ok', 'unfixable']).toContain(a.status);
      expect(typeof a.detail).toBe('string');
      expect(a.detail.length).toBeGreaterThan(0);
    }

    // ok is a boolean
    expect(typeof result.ok).toBe('boolean');
  }, 30_000);
});
