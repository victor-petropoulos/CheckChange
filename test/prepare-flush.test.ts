import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { flushConfigUpdates } from '../src/providers/prepare.js';
import type { InstallPlan } from '../src/providers/prepare.js';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** A plan with a single python pin (mirrors prepare-approve.test.ts samplePlan). */
function pythonPinPlan(): InstallPlan[] {
  return [
    {
      language: 'python',
      actions: [],
      configUpdates: {
        'checkchange.providers.json': {
          version: 1,
          providers: [
            {
              language: 'python',
              testRunners: [{ name: 'pytest', install: { packages: ['pytest-cov'] } }],
            },
          ],
        },
      },
    },
  ];
}

describe('flushConfigUpdates', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-flush-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('creates checkchange.providers.json when absent', () => {
    const written = flushConfigUpdates(pythonPinPlan(), tmpDir);
    expect(written).toEqual(['checkchange.providers.json']);

    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    expect(content.version).toBe(1);
    expect(content.providers).toHaveLength(1);
    expect(content.providers[0].language).toBe('python');
    expect(content.providers[0].testRunners[0].name).toBe('pytest');
    expect(content.providers[0].testRunners[0].install.packages).toEqual(['pytest-cov']);
  });

  test('merges into existing file, updates install on matching runner', () => {
    writeFileSync(
      join(tmpDir, 'checkchange.providers.json'),
      JSON.stringify({
        version: 1,
        providers: [
          {
            language: 'python',
            extensions: ['.py'],
            testRunners: [{ name: 'pytest', configFiles: [], binaryProbes: [], command: [], artifact: 'coverage.xml', install: { packages: ['old-pkg'] } }],
          },
        ],
      }),
    );

    const written = flushConfigUpdates(pythonPinPlan(), tmpDir);
    expect(written).toHaveLength(1);

    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    // install updated on matching runner
    expect(content.providers[0].testRunners[0].install.packages).toEqual(['pytest-cov']);
    // existing fields preserved
    expect(content.providers[0].extensions).toEqual(['.py']);
  });

  test('adds new provider when language differs', () => {
    writeFileSync(
      join(tmpDir, 'checkchange.providers.json'),
      JSON.stringify({
        version: 1,
        providers: [
          {
            language: 'python',
            extensions: ['.py'],
            testRunners: [{ name: 'pytest', install: { packages: ['pytest-cov'] } }],
          },
        ],
      }),
    );

    const tsPlan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [],
        configUpdates: {
          'checkchange.providers.json': {
            version: 1,
            providers: [
              { language: 'typescript', testRunners: [{ name: 'vitest', install: { packages: ['vitest'] } }] },
            ],
          },
        },
      },
    ];

    flushConfigUpdates(tsPlan, tmpDir);
    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    expect(content.providers).toHaveLength(2);
    expect(content.providers.map((p: { language: string }) => p.language)).toEqual(['python', 'typescript']);
  });

  test('appends new testRunner to existing provider', () => {
    writeFileSync(
      join(tmpDir, 'checkchange.providers.json'),
      JSON.stringify({
        version: 1,
        providers: [
          {
            language: 'typescript',
            extensions: ['.ts'],
            testRunners: [{ name: 'vitest', install: { packages: ['vitest'] } }],
          },
        ],
      }),
    );

    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [],
        configUpdates: {
          'checkchange.providers.json': {
            version: 1,
            providers: [
              { language: 'typescript', testRunners: [{ name: 'jest', install: { packages: ['jest'] } }] },
            ],
          },
        },
      },
    ];

    flushConfigUpdates(plan, tmpDir);
    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    expect(content.providers[0].testRunners).toHaveLength(2);
    const names = content.providers[0].testRunners.map((r: { name: string }) => r.name);
    expect(names).toContain('vitest');
    expect(names).toContain('jest');
  });

  test('no configUpdates -> no write, no file created', () => {
    const plan: InstallPlan[] = [{ language: 'python', actions: [], configUpdates: {} }];
    const written = flushConfigUpdates(plan, tmpDir);
    expect(written).toEqual([]);
  });

  test('empty providers array -> no write', () => {
    const plan: InstallPlan[] = [
      {
        language: 'python',
        actions: [],
        configUpdates: { 'checkchange.providers.json': { version: 1, providers: [] } },
      },
    ];
    const written = flushConfigUpdates(plan, tmpDir);
    expect(written).toEqual([]);
  });
});
