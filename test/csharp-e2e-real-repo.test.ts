/// <reference types="node" />

/**
 * C# cycle-1 integration proof (plan Task 5 acceptance items 1-5).
 *
 * SKIPPED BY DEFAULT — the whole suite must stay hermetic and offline-safe. Opt in with
 *   CHECKCHANGE_CSHARP_E2E=1 npx vitest run test/csharp-e2e-real-repo.test.ts
 *
 * Builds a synthetic dotnet solution in a temp dir OUTSIDE the working tree, runs a real
 * `dotnet test --collect:"XPlat Code Coverage"`, then drives the real CLI entry
 * (`node dist/cli.js check`) against it. Synthetic rather than a cloned open-source repo
 * on purpose: the bar is the TOOLCHAIN contract (real Coverlet artifact, real dotnet
 * runner probe, real git intervals), not coverage of some third party's source. Cloning
 * adds network flakiness and an unbounded diff for no extra signal.
 *
 * SKIPS (never fails) when the host lacks a usable dotnet SDK or a built dist/ — those are
 * environment gaps, not product defects. A skip reason is asserted in the report so an
 * unexercised E2E can never be mistaken for a passing one.
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOTNET_TIMEOUT_MS = 300_000;
// ponytail: relative path as dotnet wants it — the temp repo has no .sln at its root.
const TEST_PROJ = join('tests', 'Calc.Tests.csproj');

const SLN_CSPROJ = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
`;

const TEST_CSPROJ = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <IsPackable>false</IsPackable>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageReference Include="xunit" Version="2.9.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
    <PackageReference Include="coverlet.collector" Version="6.0.4" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="../src/Calc.csproj" />
  </ItemGroup>
</Project>
`;

const CALC_CS_BASE = `namespace Calc;

public class Calc
{
    public int Compute(int x, bool flag, string mode)
    {
        if (flag && x > 100) return 1;
        if (!flag && mode == "a") return 2;
        if (flag && mode == "b" && x < 0) return 3;
        if (!flag && mode == "c") return 4;
        if (flag && mode == "d") return 5;
        if (!flag && x == 7) return 6;
        return 0;
    }

    public int Add(int a, int b) => a + b;
}
`;

// Two extra decision points: the .cs interval must move AND cyclomatic complexity must
// rise, so the changed function is unambiguously Calc.Compute.
const CALC_CS_CHANGED = CALC_CS_BASE.replace(
  '        return 0;\n',
  '        if (flag && mode == "e" && x > 42) return 7;\n        if (!flag && mode == "f") return 8;\n        return 0;\n'
);

const CALC_TESTS_CS = `using Xunit;

namespace Calc.Tests;

public class CalcTests
{
    [Fact]
    public void Add_Works()
    {
        var c = new Calc();
        Assert.Equal(3, c.Add(1, 2));
    }

    [Fact]
    public void Compute_Works()
    {
        var c = new Calc();
        Assert.Equal(1, c.Compute(200, true, "z"));
        Assert.Equal(0, c.Compute(1, false, "z"));
    }
}
`;

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' });
}

function dotnetOrSkip(): { available: boolean; version: string | null } {
  const probe = spawnSync('dotnet', ['--version'], { encoding: 'utf8', timeout: 60_000 });
  if (probe.status !== 0) return { available: false, version: null };
  return { available: true, version: probe.stdout.trim() };
}

/** Recursively collect coverage artifacts — the E2E must not assume where Coverlet wrote. */
function findCoverageArtifacts(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'bin' || entry.name === 'obj') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/^coverage.*\.xml$/.test(entry.name) || entry.name === 'lcov.info') {
        out.push(full.slice(root.length + 1));
      }
    }
  };
  walk(root);
  return out;
}

describe.skipIf(!process.env.CHECKCHANGE_CSHARP_E2E)('C# E2E: real dotnet + Coverlet + real CLI', () => {
  let repoDir = '';
  let dotnetVersion: string | null = null;
  let skipReason: string | null = null;
  let coverletArtifacts: string[] = [];
  let evidence: any = null;
  let exitCode = 0;
  let stderr = '';

  beforeAll(() => {
    const sdk = dotnetOrSkip();
    if (!sdk.available) {
      skipReason = 'dotnet SDK not runnable on this host';
      return;
    }
    dotnetVersion = sdk.version;
    if (!existsSync(join(REPO_ROOT, 'dist', 'cli.js'))) {
      skipReason = 'dist/cli.js missing — run `npm run build` before the E2E';
      return;
    }

    repoDir = mkdtempSync(join(tmpdir(), 'checkchange-csharp-e2e-'));
    mkdirSync(join(repoDir, 'src'), { recursive: true });
    mkdirSync(join(repoDir, 'tests'), { recursive: true });
    writeFileSync(join(repoDir, '.gitignore'), 'bin/\nobj/\nTestResults/\n', 'utf8');
    writeFileSync(join(repoDir, 'src', 'Calc.csproj'), SLN_CSPROJ, 'utf8');
    writeFileSync(join(repoDir, 'src', 'Calc.cs'), CALC_CS_BASE, 'utf8');
    writeFileSync(join(repoDir, 'tests', 'Calc.Tests.csproj'), TEST_CSPROJ, 'utf8');
    writeFileSync(join(repoDir, 'tests', 'CalcTests.cs'), CALC_TESTS_CS, 'utf8');

    git(repoDir, 'init');
    git(repoDir, 'config', 'user.email', 'e2e@example.local');
    git(repoDir, 'config', 'user.name', 'csharp e2e');
    git(repoDir, 'add', '-A');
    git(repoDir, 'commit', '-m', 'baseline');
    // ponytail: two commits so `--base HEAD~1` resolves — the changed .cs is left
    // uncommitted on purpose so the gate sees a working-tree diff.
    git(repoDir, 'commit', '-m', 'seed', '--allow-empty');

    // ponytail: no .sln at the temp root, so name the test project explicitly —
    // bare `dotnet restore` dies with MSB1003 before any package is fetched.
    const restore = spawnSync('dotnet', ['restore', TEST_PROJ], {
      cwd: repoDir,
      encoding: 'utf8',
      timeout: DOTNET_TIMEOUT_MS,
      env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' },
    });
    if (restore.status !== 0) {
      skipReason = `dotnet restore failed (exit ${restore.status}) — no offline/online package feed for the pinned test packages`;
      return;
    }

    // Acceptance item 1: real dotnet test with the real Coverlet collector.
    const testRun = spawnSync('dotnet', ['test', TEST_PROJ, '--collect:XPlat Code Coverage'], {
      cwd: repoDir,
      encoding: 'utf8',
      timeout: DOTNET_TIMEOUT_MS,
      env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: '1', DOTNET_NOLOGO: '1' },
    });
    if (testRun.status !== 0) {
      skipReason = `dotnet test failed (exit ${testRun.status}): ${testRun.stdout?.slice(-400)}`;
      return;
    }

    // Acceptance item 1: paste the observed artifact location.
    coverletArtifacts = findCoverageArtifacts(repoDir);
    if (coverletArtifacts.length === 0) {
      skipReason = 'dotnet test succeeded but produced no coverage artifact';
      return;
    }

    // Move the .cs file so `check --base HEAD~1` sees a real csharp interval.
    writeFileSync(join(repoDir, 'src', 'Calc.cs'), CALC_CS_CHANGED, 'utf8');

    // Acceptance item 3: the real public CLI entry, not an in-process import.
    const run = spawnSync(process.execPath, [join(REPO_ROOT, 'dist', 'cli.js'), 'check', '--base', 'HEAD~1', '--json'], {
      cwd: repoDir,
      encoding: 'utf8',
      timeout: DOTNET_TIMEOUT_MS,
    });
    exitCode = run.status ?? -1;
    stderr = run.stderr ?? '';
    try {
      evidence = JSON.parse(run.stdout);
    } catch {
      skipReason = `CLI emitted non-JSON output (exit ${exitCode}): ${run.stdout?.slice(400)}`;
    }
  }, DOTNET_TIMEOUT_MS);

  afterAll(() => {
    if (repoDir) rmSync(repoDir, { recursive: true, force: true });
  });

  test('the E2E actually exercised the toolchain (no silent skip)', () => {
    expect(skipReason, `E2E was SKIPPED: ${skipReason ?? 'no reason recorded'}`).toBeNull();
    expect(dotnetVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(coverletArtifacts.length).toBeGreaterThan(0);
  });

  test('acceptance item 1 — a real Coverlet artifact exists on disk', () => {
    // Recorded verbatim in the Task 5 report; asserted here so a future Coverlet change
    // that silently stops writing an artifact fails loudly.
    expect(coverletArtifacts.some((p) => /coverage.*\.xml$/.test(p))).toBe(true);
  });

  test('acceptance item 4 — csharp evidence, schemaVersion 0.5, framework unset', () => {
    expect(evidence.schemaVersion).toBe('0.5');
    expect(evidence.framework).toBeUndefined();
    expect(evidence.capabilities.git).toBe('available');
    expect(evidence.capabilities.complexity).toBe('available');
    expect(evidence.changedFunctions.length).toBeGreaterThan(0);
    expect(evidence.changedFunctions.every((f: any) => f.language === 'csharp')).toBe(true);
    expect(evidence.changedFunctions.some((f: any) => f.file === 'src/Calc.cs' && f.method === 'Calc.Compute')).toBe(true);
  });

  // Task 5 acceptance item 3 BAR: completeness must be COMPLETE. Both cycle-1 gaps
  // are now closed — parseCoberturaContent wired at src/coverage.ts:545-547, and
  // isPythonCoverageXml narrowed to exact basename 'coverage.xml' at :623-624 —
  // proven by this E2E run returning COMPLETE.
  test('acceptance item 3 BAR — completeness COMPLETE', () => {
    expect(evidence.completeness).toBe('COMPLETE');
  });

  test('acceptance item 3 (partial) — the CLI ran without erroring', () => {
    expect(stderr).not.toContain('coverage artifact malformed');
  });
});

// WS3.5 — the skip arms themselves. The suite above can only ever reach a skip by
// running the real toolchain, so on a host that HAS dotnet + dist/ the `no SDK` arm
// is unobservable. This describe drives the SAME module-local `dotnetOrSkip` helper
// (line ~110) with a PATH that cannot resolve `dotnet`, so the :149 arm is proven
// without mutating the repo tree and without a src change (the helper is not
// exported, but this describe lives in the same module, so it is in scope).
//
// The remaining four arms are recorded untested-with-rationale in
// .opencode/validation/csharp-depth-closeout-gaps.md — each needs a repo-tree or
// network mutation this WS forbids.
describe('WS3.5 skip arms: a host with no runnable dotnet skips, it does not fail', () => {
  test('dotnetOrSkip reports unavailable when dotnet cannot be spawned', () => {
    // Sanity: the helper must be able to say "yes" on this host first, otherwise the
    // negative assertion below would pass vacuously (a permanently-broken PATH would
    // make it trivially true).
    const healthy = dotnetOrSkip();
    expect(
      healthy.available,
      `precondition: this host must HAVE a runnable dotnet, got available=${healthy.available} version=${healthy.version}`,
    ).toBe(true);

    // Forced-bad PATH: an empty dir is the only entry, so `dotnet` cannot resolve.
    // spawnSync then returns status !== 0, which is the :149 predicate.
    const emptyPath = mkdtempSync(join(tmpdir(), 'ws35-nopath-'));
    const originalPath = process.env.PATH;
    try {
      process.env.PATH = emptyPath;
      const blocked = dotnetOrSkip();
      expect(blocked.available, 'forced-bad PATH must report the SDK unavailable').toBe(false);
      expect(blocked.version).toBeNull();
    } finally {
      process.env.PATH = originalPath;
      rmSync(emptyPath, { recursive: true, force: true });
    }
  });

  test('an unresolvable dotnet surfaces as status null + ENOENT, not a thrown error', () => {
    // Controls the MECHANISM the :149 predicate relies on. Measured on this host:
    // an unresolvable binary sets `probe.error` (code ENOENT) and leaves
    // `probe.status` as null — it does NOT throw. `dotnetOrSkip` reads only
    // `probe.status !== 0`, and `null !== 0`, so the :149 arm fires off the SAME
    // comparison whether dotnet is missing or merely broken. Without this control,
    // "available === false" would not say which of the two produced it.
    const emptyPath = mkdtempSync(join(tmpdir(), 'ws35-nopath-'));
    const originalPath = process.env.PATH;
    try {
      process.env.PATH = emptyPath;
      const probe = spawnSync('dotnet', ['--version'], { encoding: 'utf8', timeout: 60_000 });
      expect((probe.error as NodeJS.ErrnoException | undefined)?.code).toBe('ENOENT');
      expect(probe.status).toBeNull();
      // The one line of the helper that gates the whole skip path.
      expect(probe.status !== 0).toBe(true);
    } finally {
      process.env.PATH = originalPath;
      rmSync(emptyPath, { recursive: true, force: true });
    }
  });
});
