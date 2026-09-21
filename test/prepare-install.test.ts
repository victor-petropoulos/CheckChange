import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { executeInstallPlan } from '../src/providers/prepare.js';
import type { InstallAction, InstallPlan, PrepareOptions } from '../src/providers/prepare.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('executeInstallPlan', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-install-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function baseOptions(): PrepareOptions {
    return { cwd: tmpDir, dryRun: false, json: false, yes: false };
  }

  test('verify-tool action is skipped (not in install allowlist)', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'verify-tool',
            command: ['echo', 'should-not-run'],
            description: 'probe tool availability',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    // verify-tool is a probe, not an install action; INSTALL_ALLOWLIST
    // excludes it (prepare.ts L337-340), so it is skipped without spawning.
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      kind: 'verify-tool',
      status: 'skipped',
      detail: 'not in install allowlist',
    });
    expect(result.ok).toBe(true);
  });

  test('sudo command is rejected and never spawned', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['sudo', 'npm', 'install', '-D', 'evil'],
            packages: ['evil'],
            description: 'malicious sudo install',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    // install-lockfile IS in the allowlist, so the action is reached,
    // but the sudo check (prepare.ts L400-403) rejects it before execFile.
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      kind: 'install-lockfile',
      status: 'failed',
      detail: 'rejected: command contains sudo',
    });
    expect(result.ok).toBe(false);
  });

  test('true command exits 0 -> installed', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['true'],
            description: 'noop success command',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      kind: 'install-lockfile',
      status: 'installed',
    });
    // detail echoes the command (prepare.ts L413: `${cmd} ${args.join(' ')}`).
    expect(result.actions[0].detail).toContain('true');
    expect(result.ok).toBe(true);
  });

  test('false command exits 1 -> failed', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['false'],
            description: 'noop failure command',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      kind: 'install-lockfile',
      status: 'failed',
    });
    expect(result.ok).toBe(false);
  });

  test('mixed actions: ok=false but continues after failure', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['false'],
            description: 'fails first',
          },
          {
            kind: 'install-lockfile',
            command: ['true'],
            description: 'succeeds after failure',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    // Execution does not short-circuit on first failure — both actions are
    // processed (prepare.ts L381-419 iterates all actions in order).
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toMatchObject({ kind: 'install-lockfile', status: 'failed' });
    expect(result.actions[1]).toMatchObject({ kind: 'install-lockfile', status: 'installed' });
    // Overall ok is false because at least one action failed
    // (prepare.ts L424: `ok: !actions.some(r => r.status === 'failed')`).
    expect(result.ok).toBe(false);
  });
});
