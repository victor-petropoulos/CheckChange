import { describe, expect, test, beforeEach, afterAll, vi } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// The REAL vehicle (Crap4DotNet 0.1.1) is NEVER invoked here: `dotnet`/`dotnet-crap`
// are mocked per test and no test touches the network. What IS real is the fixture's
// SHAPE — the key set and field types recorded from an installed vehicle run
// (.opencode/validation/csharp-rich-vehicle-decision.md §4). The method RECORDS are
// authored: line numbers match the in-test SAMPLE_CS source so the join has real
// spans to hit, and `complexity` (4/5) is deliberately set DIFFERENT from the
// fallback parser's own CC for the same source (measured 2/3 — see the CC-parity
// test below), so a regression that silently kept the fallback value instead of
// the vehicle's would fail loudly rather than coincide. `coverage: 0` matches the
// recorded run (empty Coverlet report), so the vehicle's coverage arithmetic is
// UNVERIFIED and nothing here depends on it.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawnSync: vi.fn() };
});
const realSpawnSync = await vi.importActual<typeof import('node:child_process')>('node:child_process');

const FIXTURE = JSON.parse(readFileSync(new URL('./fixtures/csharp/rich-vehicle-sample.json', import.meta.url), 'utf8')) as {
  methods: { methodName: string; filePath: string; lineNumber: number; complexity: number }[];
};

type StubResult = { status?: number | null; error?: { code?: string; message?: string }; stdout?: string; stderr?: string };

const PROBE_OK: StubResult = { status: 0, stdout: '9.0.121\n' };

function stub(handler: (cmd: string, args: readonly string[]) => StubResult): void {
  vi.mocked(spawnSync).mockImplementation(((cmd: string, args: readonly string[] = []) => {
    if (cmd === 'dotnet' || cmd.endsWith('dotnet-crap') || cmd === 'dotnet-crap') return { pid: 0, output: [], signal: null, ...handler(cmd, args) } as never;
    return realSpawnSync.spawnSync(cmd, args as string[]) as never;
  }) as never);
}

/** Probe OK, vehicle returns `body` as stdout with `status`. */
function stubVehicle(body: unknown, status = 0): void {
  stub((cmd, args) => (args[0] === '--version' ? PROBE_OK : { status, stdout: typeof body === 'string' ? body : JSON.stringify(body) }));
}

// Same source as the recorded fixture run: Add at line 5, Classify at line 15.
// The fallback parser's CC for these is 2 and 3, so a rich-vs-fallback CC
// difference is visible rather than coincidental.
const SAMPLE_CS = `namespace Sample
{
    public class Calculator
    {
        public int Add(int a, int b)
        {
            if (a > b)
            {
                return a + b;
            }

            return b - a;
        }

        public string Classify(int value)
        {
            if (value < 0)
            {
                return "negative";
            }
            else if (value == 0)
            {
                return "zero";
            }

            return "positive";
        }
    }
}
`;

// Coverlet's real empty report, verbatim from the decision record §6.
const EMPTY_COBERTURA = `<?xml version="1.0" encoding="utf-8"?>
<coverage line-rate="0" branch-rate="0" version="1.9" timestamp="1791338062" lines-covered="0" lines-valid="0" branches-covered="0" branches-valid="0">
  <sources />
  <packages />
</coverage>
`;

let tmpDir: string;
let sampleFile: string;
// Every `beforeEach` mints a NEW temp dir, so cleanup must track all of them —
// removing only the last one leaked every earlier dir into os.tmpdir() for the
// life of the machine. Same shape as test/prepare-verify.test.ts:19-25.
let tmpDirs: string[] = [];

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'csharp-rich-'));
  tmpDirs.push(tmpDir);
  sampleFile = join(tmpDir, 'Calculator.cs');
  writeFileSync(sampleFile, SAMPLE_CS);
  vi.resetModules();
  vi.mocked(spawnSync).mockClear();
});

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

async function loadProvider() {
  return await import('../src/complexity-providers/csharpDescriptorProvider.js');
}

/**
 * The fixture with its `filePath` rewritten to this run's temp file —
 * `form` picks which of the two MEASURED shapes the payload carries (C-4):
 * absolute for a single-file target, root-relative for a directory target.
 */
function payload(form: 'abs' | 'rel' = 'abs') {
  return {
    ...FIXTURE,
    methods: FIXTURE.methods.map((m) => ({
      ...m,
      filePath: form === 'abs' ? sampleFile : `./${m.filePath.split('/').pop()}`,
    })),
  };
}

describe('fixture integrity: the recorded payload SHAPE, not a hand-rolled one', () => {
  test('top level is an OBJECT carrying `methods` — the shape the adapter reads', () => {
    expect(Array.isArray(FIXTURE)).toBe(false);
    expect(Array.isArray((FIXTURE as { methods: unknown }).methods)).toBe(true);
    expect(FIXTURE.methods.map((m) => m.methodName)).toEqual(['Add', 'Classify']);
  });

  test('no method record carries a span field — the reason the hybrid join exists', () => {
    // C-6: if a future payload version adds spans, this test is the tripwire
    // that says the join can be revisited.
    for (const m of FIXTURE.methods) {
      expect(Object.keys(m)).not.toContain('startLine');
      expect(Object.keys(m)).not.toContain('endLine');
      expect(Object.keys(m)).not.toContain('bodySpan');
    }
  });
});

describe('argv form: the direct executable with the `analyze` subcommand', () => {
  test('spawns `dotnet-crap analyze <file> --coverage <cobertura>` — never the dotnet mux', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload());
    const { runRichSdkAnalysis } = await loadProvider();
    await runRichSdkAnalysis(sampleFile);

    const call = vi.mocked(spawnSync).mock.calls.find((c) => String(c[0]).endsWith('dotnet-crap'))!;
    expect(String(call[0])).not.toBe('dotnet');
    expect(call[1]?.[0]).toBe('analyze');
    expect(call[1]?.[1]).toBe(sampleFile);
    expect(call[1]?.[2]).toBe('--coverage');
    // Coverage is MANDATORY: the flag and a real path, never a bare `--coverage`.
    expect(String(call[1]?.[3])).toBe(join(tmpDir, 'coverage.cobertura.xml'));
    // argv-only, bounded timeout, deny-by-default: no shell string is built.
    expect(call[0]).not.toBe('sh');
    expect(call[1]).not.toContain('-c');
    expect((call[2] as { timeout?: number }).timeout).toBeGreaterThan(0);
  });

  test('vehicleCommand resolves the shim, never through the dotnet mux (C-1)', async () => {
    const { vehicleCommand } = await loadProvider();
    const cmd = vehicleCommand();
    // Whatever it resolves to, it is the vehicle itself or its absolute shim
    // path — never `dotnet`, which is measured to fail on the mux form.
    expect(cmd).not.toBe('dotnet');
    expect(cmd === 'dotnet-crap' || cmd.endsWith('/dotnet-crap')).toBe(true);
    // Deterministic within a process — it is read once per call, never cached
    // differently between two reads.
    expect(vehicleCommand()).toBe(cmd);
  });

  test('finds coverage under TestResults/<run>/ when no in-tree artifact exists', async () => {
    // The locator is coverage.ts's own `scanCoberturaUnderTestResults`; the
    // in-tree name is deliberately absent here, so only that path can satisfy it.
    mkdirSync(join(tmpDir, 'TestResults', 'cffa3fe2-dead-beef'), { recursive: true });
    writeFileSync(join(tmpDir, 'TestResults', 'cffa3fe2-dead-beef', 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload());
    const { runRichSdkAnalysis } = await loadProvider();
    await runRichSdkAnalysis(sampleFile);

    const call = vi.mocked(spawnSync).mock.calls.find((c) => String(c[0]).endsWith('dotnet-crap'))!;
    expect(call[1]).toContain('--coverage');
    expect(String(call[1]?.[3])).toBe(join(tmpDir, 'TestResults', 'cffa3fe2-dead-beef', 'coverage.cobertura.xml'));
  });
});

describe('payload → MethodDescriptor[] with fallback spans (C-5, C-6)', () => {
  test('absolute filePath: CC from the vehicle, spans from the fallback parser', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload('abs'));
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('rich');
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Calculator.Add', 'Calculator.Classify']);
    // Vehicle CC (4, 5) — the payload's numbers, NOT the fallback's 2/3. The
    // fixture is authored with these values precisely so this compare is a real
    // discriminator; see the CC-provenance test below for the measured fallback.
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual([4, 5]);
    // Spans are the FALLBACK parser's real output, on the SAME file.
    const { parseCsharpFileMethods } = await import('../src/complexity-providers/csharpFallbackParser.js');
    const fallback = await parseCsharpFileMethods(sampleFile);
    expect(analysis.descriptors.map((d) => d.startLine)).toEqual(fallback.map((d) => d.startLine));
    expect(analysis.descriptors.map((d) => d.endLine)).toEqual(fallback.map((d) => d.endLine));
    expect(analysis.descriptors.map((d) => d.bodySpan)).toEqual(fallback.map((d) => d.bodySpan));
    // The descriptor key set is byte-identical to the fallback's — one shape.
    expect(Object.keys(analysis.descriptors[0]!).sort()).toEqual(Object.keys(fallback[0]!).sort());
  });

  test('descriptor CC is the VEHICLE value, provably not the fallback span value', async () => {
    // The join spreads the fallback span and then overrides `complexity`. If that
    // override were dropped, `span.complexity` (2/3) would flow through — and a
    // fixture whose CC happened to equal the fallback's would still pass. So this
    // test MEASURES the fallback CC for the same source and asserts the two
    // differ, which makes every `complexity` assertion above discriminating.
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload());
    const { runRichSdkAnalysis } = await loadProvider();
    const { parseCsharpFileMethods } = await import('../src/complexity-providers/csharpFallbackParser.js');

    const fallbackCc = (await parseCsharpFileMethods(sampleFile)).map((d) => d.complexity);
    const vehicleCc = payload().methods.map((m) => m.complexity);
    expect(fallbackCc).toEqual([2, 3]); // measured, pins the premise above
    expect(vehicleCc).toEqual([4, 5]);
    expect(vehicleCc).not.toEqual(fallbackCc);

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('rich');
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual(vehicleCc);
  });

  test('a symlinked cwd still joins: the vehicle reports the realpath, we were given the link', async (ctx) => {
    // Measured on macOS: a caller-supplied `/tmp/...` and the vehicle-reported
    // `/private/tmp/...` are the same file, so a `resolve()`-only compare drops
    // every method and degrades. Mirrors it directly: analyse through a symlink,
    // report the realpath back, and require a rich join.
    const realDir = join(tmpDir, 'real');
    mkdirSync(realDir);
    writeFileSync(join(realDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    const realFile = join(realDir, 'Calculator.cs');
    writeFileSync(realFile, SAMPLE_CS);

    const linkDir = join(tmpDir, 'link');
    try {
      symlinkSync(realDir, linkDir, 'dir');
    } catch (err) {
      // Gate on the ACTUAL failure (EPERM/EACCES on Windows or a sandbox), not
      // on a platform sniff: `ctx.skip(false)` skips only this test.
      ctx.skip(false, `symlink creation unavailable here: ${(err as Error).message}`);
      return;
    }
    const linkFile = join(linkDir, 'Calculator.cs');
    expect(linkFile).not.toBe(realFile); // the premise: two distinct strings
    // The vehicle echoes what it walked — the canonical path, not the link.
    const payloadViaRealpath = {
      ...FIXTURE,
      methods: FIXTURE.methods.map((m) => ({ ...m, filePath: realFile })),
    };
    stubVehicle(payloadViaRealpath);
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(linkFile);
    expect(analysis.mode).toBe('rich');
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Calculator.Add', 'Calculator.Classify']);
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual([4, 5]);
  });

  test('root-relative `./X.cs` filePath joins identically (C-4)', async () => {
    // Without normalisation this is the silent-zero case the decision record
    // names: a directory-target payload matches nothing and yields no descriptors
    // with no error.
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload('rel'));
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('rich');
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Calculator.Add', 'Calculator.Classify']);
  });

  test('displayName keeps the `Container.Name` convention, NOT the signed fullName', async () => {
    // The payload's `fullName` is `Sample.Calculator.Add(int, int)`. Attribution
    // keys on `containerName.functionName` (src/attribution.ts:155), so a signed
    // displayName would miss every lookup and silently null coverage.
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload());
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    for (const d of analysis.descriptors) expect(d.displayName).not.toContain('(');
    expect(analysis.descriptors.map((d) => d.containerName)).toEqual(['Calculator', 'Calculator']);
  });

  test('a method with no fallback span partner is DROPPED, never given invented spans', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    // Valid filePath, bogus line: the join must miss on the LINE, proving spans
    // are never back-filled from `lineNumber` alone.
    stubVehicle({ ...FIXTURE, methods: [{ ...payload().methods[0], lineNumber: 999 }] });
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    // One bogus method ⇒ nothing joins ⇒ degrade loudly rather than report a
    // phantom descriptor at an invented line.
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('none joined');
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Calculator.Add', 'Calculator.Classify']);
  });

  test('a PARTIAL join keeps the joined methods and reports the drop count', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    const ok = payload().methods;
    stubVehicle({
      ...FIXTURE,
      methods: [ok[0], { ...ok[1], lineNumber: 999 }],
    });
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('rich');
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Calculator.Add']);
    // The drop is VISIBLE, never silent.
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('1 of 2');
  });
});

describe('degradation: exit status is NOT the success signal (C-7)', () => {
  test('exit 0 with HELP TEXT (unrecognised flag) degrades, never reports a measurement', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    const help = 'Usage:\n  dotnet-crap analyze <path> [options]\n\nOptions:\n  --coverage <coverage>\n';
    stubVehicle(help); // status 0 — measured behaviour for a bad flag
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('not JSON');
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('exit 2 COVERAGE_FILE_NOT_FOUND names the vehicle error code in the detail', async () => {
    // The artifact EXISTS here, so the vehicle IS spawned and the exit-2 body is
    // the vehicle's own error — the case the adapter must surface, not hide.
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stub((cmd, args) =>
      args[0] === '--version' ? PROBE_OK : { status: 2, stdout: JSON.stringify({ error: { code: 'COVERAGE_FILE_NOT_FOUND', message: 'No coverage files found.' } }) }
    );
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.detail).toContain('COVERAGE_FILE_NOT_FOUND');
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('NO coverage artifact ⇒ degraded without spawning the vehicle at all', async () => {
    stubVehicle(payload());
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('no Cobertura coverage artifact found');
    // Nothing to run: the vehicle is not spawned when its mandatory input is absent.
    expect(vi.mocked(spawnSync).mock.calls.filter((c) => String(c[0]).endsWith('dotnet-crap'))).toHaveLength(0);
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('a JSON object WITHOUT `methods` degrades (the old Array.isArray guard passed this)', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle({ complexity: 3 });
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.detail).toContain('no `methods` array');
  });

  test('`methods: [null]` degrades loudly instead of throwing inside the join', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle({ ...FIXTURE, methods: [null] });
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.detail).toContain('malformed records');
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('a spawn failure (binary absent) degrades naming the error', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stub((cmd, args) =>
      args[0] === '--version' ? PROBE_OK : { status: null, error: { code: 'ENOENT', message: 'spawnSync ENOENT' } }
    );
    const { runRichSdkAnalysis } = await loadProvider();

    const analysis = await runRichSdkAnalysis(sampleFile);
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('spawn failed');
    expect(analysis.diagnostic?.detail).toContain('ENOENT');
  });

  test('the fix text names the install, the invocation form AND the coverage requirement', async () => {
    const { runRichSdkAnalysis } = await loadProvider();
    stubVehicle(payload());
    const fix = (await runRichSdkAnalysis(sampleFile)).diagnostic?.fix ?? '';
    expect(fix).toContain('dotnet tool install -g Crap4DotNet');
    expect(fix).toContain('dotnet-crap analyze');
    expect(fix).toContain('--coverage');
  });
});

describe('fallback stays the default when the vehicle is absent', () => {
  test('SDK absent ⇒ csharp-sdk-missing, vehicle never spawned, CC still returned', async () => {
    stub((cmd, args) => (args[0] === '--version' ? { status: null, error: { code: 'ENOENT', message: 'spawnSync dotnet ENOENT' } } : PROBE_OK));
    const { analyzeCsharpFile } = await loadProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.code).toBe('csharp-sdk-missing');
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual([2, 3]);
    expect(vi.mocked(spawnSync).mock.calls.filter((c) => String(c[0]).endsWith('dotnet-crap'))).toHaveLength(0);
  });

  test('rich mode reports the vehicle as the tool and FALLBACK never impersonates it', async () => {
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
    stubVehicle(payload());
    const { provenanceForMode } = await loadProvider();
    expect(provenanceForMode('rich').tool).toBe('dotnet-crap');
    expect(provenanceForMode('fallback').tool).not.toBe('dotnet-crap');
    expect(provenanceForMode('rich').mode).toBe('NATIVE');
  });
});