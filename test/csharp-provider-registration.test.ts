import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

// SD-1 tripwire (plan Task 4, acceptance item 2a). This file proves the csharp
// provider is REGISTERED AND REACHED — a Map entry alone proves neither.
//
// `dotnet` is NEVER invoked for real: the probe reports an SDK and the Roslyn
// vehicle REJECTS, so the run lands on the pure-TypeScript fallback parser and is
// deterministic whether or not a .NET SDK is installed on the host.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawnSync: vi.fn(actual.spawnSync) };
});
const realSpawnSync = await vi.importActual<typeof import('node:child_process')>('node:child_process');

type StubResult = { status?: number | null; error?: { code?: string; message?: string }; stdout?: string; stderr?: string };
const PROBE_OK: StubResult = { status: 0, stdout: '9.0.121\n' };
const VEHICLE_REJECTED: StubResult = { status: 1, stderr: 'dotnet-crap vehicle rejected by the stub\n' };

function stubDotnet(): void {
  vi.mocked(spawnSync).mockImplementation(((cmd: string, args: readonly string[] = []) => {
    if (cmd !== 'dotnet') return realSpawnSync.spawnSync(cmd, args as string[]) as never;
    return { pid: 0, output: [], signal: null, ...(args[0] === '--version' ? PROBE_OK : VEHICLE_REJECTED) } as never;
  }) as never);
}

// DEC-1: fixtures are FLAT in test/fixtures/, so these are `./fixtures/csharp-*.cs`.
const FIXTURE = {
  high: readFileSync(new URL('./fixtures/csharp-high-cc.cs', import.meta.url), 'utf8'),
  clean: readFileSync(new URL('./fixtures/csharp-clean.cs', import.meta.url), 'utf8'),
  zero: readFileSync(new URL('./fixtures/csharp-zero-coverage.cs', import.meta.url), 'utf8'),
};

/**
 * Remove the `else if (resolved.language === 'csharp')` branch from evidence.ts.
 * Returns the mutated source plus how many lines it removed, so a caller can tell
 * a REAL mutation from a no-op — a no-op mutation is what makes a tripwire test
 * vacuous (it would "pass" against a source that never had the branch).
 */
function deleteCsharpBranch(source: string): { mutated: string; removedLines: number } {
  const lines = source.split('\n');
  const start = lines.findIndex((l) => l.includes("resolved.language === 'csharp'"));
  if (start === -1) return { mutated: source, removedLines: 0 };
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim() === '}') {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error('tripwire: csharp branch has no closing brace');
  // The branch line starts with the `}` that CLOSES the previous else-if arm, so the
  // whole `} else if (…) { … }` construct collapses to a lone `}` — deleting it
  // verbatim would unbalance the enclosing `for` block and fail to parse.
  lines.splice(start, end - start + 1, '    }');
  return { mutated: lines.join('\n'), removedLines: end - start + 1 };
}

describe('csharp provider registration (SD-1)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    stubDotnet();
    vi.resetModules();
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'csharp-registration-'));
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('initProviderConfig() registers a csharp provider for .cs', async () => {
    const ev = await import('../src/evidence.js');
    ev.initProviderConfig();

    const provider = ev.getProvider('.cs');
    expect(provider).toBeDefined();
    // Not just "something is in the Map": it actually measures .cs methods.
    writeFileSync(join(tmpDir, 'Widget.cs'), FIXTURE.clean);
    const info = await provider!.collectComplexity(tmpDir);
    expect(info.map((i) => i.method)).toEqual(['LowComplexity.Add']);
    expect(info.map((i) => i.cc)).toEqual([4]);
  });

  test('acceptance 2a NEGATIVE: the UNSUPPORTED shape of SD-1 is ABSENT for a .cs-only repo', async () => {
    const ev = await import('../src/evidence.js');
    writeFileSync(join(tmpDir, 'HighComplexity.cs'), FIXTURE.high);

    const intervals = new Map<string, { start: number; end: number }[]>();
    // The method spans lines 7-42 (measured from the fallback parser).
    intervals.set('HighComplexity.cs', [{ start: 7, end: 42 }]);
    const out = await ev.buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

    expect(out.changedFunctions.length).toBeGreaterThan(0);
    expect(out.analysisStatus).not.toBe('UNSUPPORTED');
    expect(out.changedFunctions[0]).toMatchObject({ method: 'HighComplexity.Compute', cc: 32, language: 'csharp' });
  });

  test('the auto-derived LANGUAGE_MAP needs zero edits: getLanguageForFile("X.cs") === "csharp"', async () => {
    const ev = await import('../src/evidence.js');
    ev.initProviderConfig();
    expect(ev.getLanguageForFile('X.cs')).toBe('csharp');
    expect(ev.providerRegistry()!.get('.cs')!.language).toBe('csharp');
  });

  test('builtinConfig() carries csharp LAST, so .cs takes the highest extension priority', async () => {
    const ev = await import('../src/evidence.js');
    const { builtinConfig } = await import('../src/providers/config.js');
    const providers = builtinConfig().providers;
    expect(providers[providers.length - 1]!.language).toBe('csharp');
    expect(providers[providers.length - 1]!.extensions).toEqual(['.cs']);

    ev.initProviderConfig();
    const priority = ev.extensionPriority();
    expect(priority[0]).toBe('.cs');
    expect(priority.indexOf('.cs')).toBeLessThan(priority.indexOf('.ts'));
    expect(priority.indexOf('.cs')).toBeLessThan(priority.indexOf('.js'));
  });

  test('acceptance 9 PRE-INIT: the module-load fallbacks already know .cs before initProviderConfig()', async () => {
    // vi.resetModules() in beforeEach ⇒ a module-fresh import, so initProviderConfig()
    // has NOT run and both calls below must be served by DEFAULT_SUPPORTED_EXTENSIONS /
    // DEFAULT_LANGUAGE_MAP, which are derived from builtinConfig() at module load.
    const ev = await import('../src/evidence.js');
    expect(ev.providerRegistry()).toBeNull();
    expect(ev.supportedExtensions().has('.cs')).toBe(true);
    expect(ev.getLanguageForFile('X.cs')).toBe('csharp');
    expect(ev.isUnsupportedIntervals(new Map([['X.cs', [{ start: 1, end: 2 }]]]))).toBe(false);
  });

  test('acceptance 2a POSITIVE: deleting the csharp branch removes the provider — RED if the branch is already absent', async () => {
    const realPath = fileURLToPath(new URL('../src/evidence.ts', import.meta.url));
    const { mutated, removedLines } = deleteCsharpBranch(readFileSync(realPath, 'utf8'));

    // A zero-line mutation proves nothing: the assertions below would hold against a
    // source that never had the branch. Fail here instead, with a readable message.
    expect(removedLines).toBeGreaterThan(0);
    expect(mutated).toContain("resolved.language === 'typescript'");
    expect(mutated).toContain("resolved.language === 'python'");
    expect(mutated).not.toContain("resolved.language === 'csharp'");

    // A COPY, never src/evidence.ts itself: mutating the shared file mid-run would
    // race every other test file that imports it.
    const copy = fileURLToPath(
      new URL(`../src/evidence.tripwire-${process.pid}.ts`, import.meta.url),
    );
    writeFileSync(copy, mutated, 'utf8');
    try {
      const mutant = await import(/* @vite-ignore */ pathToFileURL(copy).href);
      mutant.initProviderConfig();

      // The branch was the ONLY thing registering .cs: with it deleted, the config
      // entry reaches no branch and the provider is absent.
      expect(mutant.getProvider('.cs')).toBeUndefined();
      // …and the config entry is INDEPENDENT of the branch (SD-1: neither substitutes
      // for the other) — the map still resolves .cs without the wiring.
      expect(mutant.getLanguageForFile('X.cs')).toBe('csharp');
      expect(mutant.extensionPriority()[0]).toBe('.cs');
    } finally {
      rmSync(copy, { force: true });
    }
  });
});
