import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { executeInstallPlan } from '../src/providers/prepare.js';
import type { InstallAction, InstallPlan, PrepareOptions } from '../src/providers/prepare.js';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('executeInstallPlan', () => {
  let tmpDir: string;
  // Marker lives OUTSIDE tmpDir (the spawn cwd) so its absence proves the
  // process never ran, not merely that it ran somewhere harmless.
  let markerDir: string;
  let marker: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-install-test-'));
    markerDir = mkdtempSync(join(tmpdir(), 'prepare-install-marker-'));
    marker = join(markerDir, 'spawned');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    rmSync(markerDir, { recursive: true, force: true });
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
    // excludes it (prepare.ts L338-341), so it is skipped without spawning.
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
    // but the sudo check (prepare.ts L412-415) rejects it before execFile.
    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({
      kind: 'install-lockfile',
      status: 'failed',
      detail: 'rejected: command contains sudo',
    });
    expect(result.ok).toBe(false);
    expect(existsSync(marker)).toBe(false);
  });

  test('allowlisted command exits 0 -> installed', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['python3', '-c', 'import sys'],
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
    // detail echoes the command (prepare.ts L437: `${cmd} ${args.join(' ')}`).
    expect(result.actions[0].detail).toContain('python3');
    expect(result.ok).toBe(true);
  });

  test('allowlisted command exits 1 -> failed', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['python3', '-c', 'import sys; sys.exit(1)'],
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
            command: ['python3', '-c', 'import sys; sys.exit(1)'],
            description: 'fails first',
          },
          {
            kind: 'install-lockfile',
            command: ['python3', '-c', 'import sys'],
            description: 'succeeds after failure',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    // Execution does not short-circuit on first failure — both actions are
    // processed (prepare.ts L392-441 iterates all actions in order).
    expect(result.actions).toHaveLength(2);
    expect(result.actions[0]).toMatchObject({ kind: 'install-lockfile', status: 'failed' });
    expect(result.actions[1]).toMatchObject({ kind: 'install-lockfile', status: 'installed' });
    // Overall ok is false because at least one action failed
    // (prepare.ts L449: `ok: !actions.some(r => r.status === 'failed')`).
    expect(result.ok).toBe(false);
  });

  // Every in-repo producer emits one of these basenames:
  //   packageManagerCommand (prepare.ts L131-143) -> pnpm | yarn | npm | pip | dotnet restore
  //   create-venv         (prepare.ts L187)        -> python3
  //   install-lockfile    (prepare.ts L199)        -> [...pmCmd, ...packages]
  //   resolvePipCommand   (prepare.ts L371-378)    -> python (venv) | python3
  // Anything else must be refused at the exec boundary: InstallPlan literals are
  // caller-constructible, so a producer-side check would be bypassable.
  const REJECTED: ReadonlyArray<{ label: string; command: (marker: string) => string[] }> = [
    { label: 'absolute sudo path', command: () => ['/usr/bin/sudo', 'npm', 'install', '-D', 'evil'] },
    { label: 'relative sudo path', command: () => ['./sudo', 'npm', 'install'] },
    { label: 'sudo prefix', command: () => ['sudoku', 'install'] },
    { label: 'npx', command: () => ['npx', 'evil'] },
    { label: 'sh', command: (m) => ['sh', '-c', `touch ${m}`] },
    { label: '/bin/sh', command: (m) => ['/bin/sh', '-c', `touch ${m}`] },
    { label: 'curl', command: () => ['curl', 'http://x'] },
    { label: 'absolute path to unknown binary', command: () => ['/abs/path/to/evil', 'x'] },
  ];

  for (const { label, command } of REJECTED) {
    test(`install-lockfile rejects ${label} without spawning`, async () => {
      const plan: InstallPlan[] = [
        {
          language: 'typescript',
          actions: [
            {
              kind: 'install-lockfile',
              command: command(marker),
              packages: [],
              description: 'non-allowlisted binary',
            },
          ],
          configUpdates: {},
        },
      ];

      const result = await executeInstallPlan(plan, baseOptions());

      // detail must come from the guard, not from a child process's failure —
      // an ENOENT or non-zero exit is also 'failed', so match the prefix.
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]).toMatchObject({ kind: 'install-lockfile', status: 'failed' });
      expect(result.actions[0].detail).toMatch(/^rejected:/);
      expect(result.ok).toBe(false);
      expect(existsSync(marker)).toBe(false);
    });
  }

  test('create-venv accepts the venv interpreter (python3)', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'python',
        actions: [
          {
            kind: 'create-venv',
            command: ['python3', '-m', 'venv', '.venv'],
            description: 'Create Python virtual environment at .venv',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, baseOptions());

    expect(result.actions).toHaveLength(1);
    expect(result.actions[0]).toMatchObject({ kind: 'create-venv', status: 'installed' });
    expect(result.ok).toBe(true);
  });
});
