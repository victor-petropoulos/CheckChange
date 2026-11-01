import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { createInstallPlan, detectStack, executeInstallPlan, verifyInstall } from '../src/providers/prepare.js';
import type { DetectedStack, InstallPlan, PrepareOptions } from '../src/providers/prepare.js';
import { builtinConfig, deriveRegistry } from '../src/providers/index.js';
import type { ProviderConfig } from '../src/providers/index.js';

// `dotnet` is NEVER invoked for real in this file: probe (d) is the whole point, so
// execFile is mocked at the module boundary prepare.ts:12 imports it from. The mock
// keeps promisify's callback contract (prepare.ts:358 `promisify(execFile)`), so
// prepare.ts still destructures `{ stdout }` exactly as it does for probes (b)/(c).
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execFile: vi.fn() };
});

type ExecResult = { ok: boolean; stdout?: string; message?: string };

/** Route `dotnet --version` to a stub; let probes (b)/(c) succeed so only (d) is under test. */
function stubDotnet(res: ExecResult): void {
  vi.mocked(execFile).mockImplementation(((
    file: string,
    _args: readonly string[],
    _options: unknown,
    cb: (err: Error | null, value?: { stdout: string; stderr: string }) => void,
  ) => {
    if (file === 'dotnet') {
      if (res.ok) cb(null, { stdout: res.stdout ?? '', stderr: '' });
      else cb(Object.assign(new Error(res.message ?? 'spawn failed'), { code: 'ENOENT' }));
      return;
    }
    cb(null, { stdout: '', stderr: '' });
  }) as never);
}

/**
 * csharp provider whose runner DOES declare an install spec. The builtin DOTNET_RUNNER
 * (config.ts:90-96) declares none, so the positive install half needs a synthesized config
 * — same shape as test/prepare-plan.test.ts:15 pythonWithPackagesConfig.
 */
function csharpWithPackagesConfig(): ProviderConfig {
  return {
    version: 1,
    providers: [
      {
        language: 'csharp',
        extensions: ['.cs'],
        testRunners: [
          {
            name: 'dotnet',
            configFiles: ['*.csproj'],
            binaryProbes: [],
            command: ['dotnet', 'test'],
            artifact: 'TestResults/coverage.cobertura.xml',
            install: { packages: ['Crap4DotNet'] },
          },
        ],
      },
    ],
  };
}

function stubStack(): DetectedStack {
  return { languages: [], runners: new Map(), lockfiles: new Map() };
}

describe('prepare-repo csharp install-kind parity (plan Task 7)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-csharp-install-'));
    vi.mocked(execFile).mockReset();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  /** A stock C# repo: source file + a .csproj at root so resolveRunner's configFiles glob matches. */
  function stockCsharpRepo(): void {
    writeFileSync(join(tmpDir, 'Program.cs'), 'namespace App { class P { static void Main() {} } }\n', 'utf8');
    writeFileSync(join(tmpDir, 'App.csproj'), '<Project Sdk="Microsoft.NET.Sdk" />\n', 'utf8');
  }

  function options(): PrepareOptions {
    return { cwd: tmpDir, dryRun: false, json: false, yes: false };
  }

  // ---- D13 TRIPWIRE: NEGATIVE half (SD-2). The builtin runner declares no install
  // spec, so `packages` is [] and prepare.ts:194 gates emission. An implementation that
  // emits `dotnet restore` unconditionally fails this test.
  test('builtin DOTNET_RUNNER: stock C# repo emits ZERO install-lockfile actions', () => {
    stockCsharpRepo();
    const config = builtinConfig();
    const registry = deriveRegistry(config, 'builtin');

    const stack = detectStack(tmpDir, registry);
    expect(stack.languages).toContain('csharp');

    const plans = createInstallPlan(stack, registry, config, tmpDir);
    const actions = plans.find((p) => p.language === 'csharp')!.actions;

    expect(actions.filter((a) => a.kind === 'install-lockfile')).toHaveLength(0);
    // verify-tool is language-agnostic (prepare.ts:206-212) and MUST survive.
    expect(actions.filter((a) => a.kind === 'verify-tool')).toHaveLength(1);
  });

  // ---- D13 TRIPWIRE: POSITIVE half. Declared packages make the gate fire.
  test('config-declared install.packages: exactly one install-lockfile, command[0] is dotnet', () => {
    stockCsharpRepo();
    const config = csharpWithPackagesConfig();
    const registry = deriveRegistry(config, 'builtin');

    const stack = detectStack(tmpDir, registry);
    const plans = createInstallPlan(stack, registry, config, tmpDir);
    const actions = plans.find((p) => p.language === 'csharp')!.actions;
    const installs = actions.filter((a) => a.kind === 'install-lockfile');

    expect(installs).toHaveLength(1);
    // Plan item 3 literal: command[0] === 'dotnet'.
    expect(installs[0]!.command!.at(0)).toBe('dotnet');
    // C# packages are .NET GLOBAL TOOLS. `dotnet restore` takes a PROJECT OR SOLUTION,
    // never a package name — spreading packages onto it yields `dotnet restore Crap4DotNet`,
    // which is MSB1009 "Project file does not exist", i.e. an install action that can
    // NEVER succeed. prepare.ts:138-147 therefore returns null for csharp and
    // buildInstallPlan emits `dotnet tool install -g <pkg>` per package instead.
    expect(installs[0]!.command).toEqual(['dotnet', 'tool', 'install', '-g', 'Crap4DotNet']);
    expect(installs[0]!.packages).toEqual(['Crap4DotNet']);
    // MSB1009 unreachable by construction: the verb is `tool install`, never `restore`.
    expect(installs[0]!.command).not.toContain('restore');
  });

  // D13 tripwire for the per-package shape: TWO declared packages must produce TWO
  // actions. An implementation that collapsed them into one `restore` carrying both ids
  // (the pre-fix form) fails here.
  test('config-declared install.packages: ONE `dotnet tool install -g` action PER package', () => {
    stockCsharpRepo();
    const config = csharpWithPackagesConfig();
    const config2: ProviderConfig = {
      ...config,
      providers: config.providers.map((p) => ({
        ...p,
        testRunners: (p.testRunners ?? []).map((r) => ({
          ...r,
          install: { packages: ['Crap4DotNet', 'dotnet-format'] },
        })),
      })),
    };
    const registry = deriveRegistry(config2, 'builtin');

    const stack = detectStack(tmpDir, registry);
    const plans = createInstallPlan(stack, registry, config2, tmpDir);
    const installs = plans.find((p) => p.language === 'csharp')!.actions.filter((a) => a.kind === 'install-lockfile');

    expect(installs).toHaveLength(2);
    expect(installs.map((a) => a.command)).toEqual([
      ['dotnet', 'tool', 'install', '-g', 'Crap4DotNet'],
      ['dotnet', 'tool', 'install', '-g', 'dotnet-format'],
    ]);
    // Each action carries exactly its own package — never the full list.
    expect(installs.map((a) => a.packages)).toEqual([['Crap4DotNet'], ['dotnet-format']]);
  });

  // ---- Allowlist gate still bites: `dotnet` was added to install-lockfile ONLY.
  test('dotnet under create-venv is REJECTED by the binary allowlist', async () => {
    const plan: InstallPlan[] = [
      {
        language: 'csharp',
        actions: [
          {
            kind: 'create-venv',
            command: ['dotnet', 'new', 'console'],
            description: 'must be refused: create-venv allows python/python3 only',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, options());

    expect(result.actions[0]).toMatchObject({
      kind: 'create-venv',
      status: 'failed',
      detail: 'rejected: binary not allowed: dotnet',
    });
    // execFile was never reached.
    expect(execFile).not.toHaveBeenCalled();
  });

  // `dotnet` IS reachable under install-lockfile (the allowlist addition works end to end).
  test('dotnet under install-lockfile is ALLOWED by the binary allowlist', async () => {
    stubDotnet({ ok: true, stdout: '9.0.121\n' });
    const plan: InstallPlan[] = [
      {
        language: 'csharp',
        actions: [
          {
            kind: 'install-lockfile',
            command: ['dotnet', 'restore'],
            packages: ['Crap4DotNet'],
            description: 'repo restore',
          },
        ],
        configUpdates: {},
      },
    ];

    const result = await executeInstallPlan(plan, options());

    expect(result.actions[0]).toMatchObject({ kind: 'install-lockfile', status: 'installed' });
    expect(result.ok).toBe(true);
  });

  // ---- Probe (d): dotnet-sdk verifier.
  test('verifyInstall probe (d) dotnet-sdk: ok when `dotnet --version` exits 0', async () => {
    stubDotnet({ ok: true, stdout: '9.0.121\n' });

    const result = await verifyInstall(stubStack(), options());

    expect(result.analyzers).toHaveLength(4);
    const sdk = result.analyzers.find((a) => a.name === 'dotnet-sdk');
    expect(sdk).toBeDefined();
    expect(sdk!.status).toBe('ok');
    expect(sdk!.detail).toContain('9.0.121');
  });

  test('verifyInstall probe (d) dotnet-sdk: unfixable on ENOENT, remediation names the SDK URL', async () => {
    stubDotnet({ ok: false, message: 'spawnSync dotnet ENOENT' });

    const result = await verifyInstall(stubStack(), options());

    const sdk = result.analyzers.find((a) => a.name === 'dotnet-sdk');
    expect(sdk!.status).toBe('unfixable');
    expect(sdk!.detail).toMatch(/https:\/\//);
    expect(result.ok).toBe(false);
  });

  test('verifyInstall probe (d) dotnet-sdk: ok with empty detail when dotnet prints nothing', async () => {
    stubDotnet({ ok: true, stdout: '' });

    const result = await verifyInstall(stubStack(), options());

    const sdk = result.analyzers.find((a) => a.name === 'dotnet-sdk');
    expect(sdk!.status).toBe('ok');
    expect(sdk!.detail).toBe('exit 0: ');
  });

  test('probe (d) spawns dotnet argv-only with --version (never sh -c)', async () => {
    stubDotnet({ ok: true, stdout: '9.0.121\n' });

    await verifyInstall(stubStack(), options());

    const dotnetCalls = vi.mocked(execFile).mock.calls.filter((c) => c[0] === 'dotnet');
    expect(dotnetCalls).toHaveLength(1);
    expect(dotnetCalls[0]![1]).toEqual(['--version']);
    expect(JSON.stringify(dotnetCalls[0])).not.toContain('sh -c');
  });
});
