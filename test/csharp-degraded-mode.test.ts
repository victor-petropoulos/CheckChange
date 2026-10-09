import { describe, expect, test, beforeEach, afterAll, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { coverageForMethods } from '@barney-media/crap-typescript-core';
import { parseCoberturaContent } from '../src/coverage-providers/coberturaProvider.js';

// C# dispatcher (plan Task 3). `dotnet` is NEVER invoked for real here: the whole
// point of this file is the degraded path, so the SDK is mocked per test and the
// `find` walk is delegated to the real implementation so the repo walk is real.
vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, spawnSync: vi.fn() };
});
const realSpawnSync = await vi.importActual<typeof import('node:child_process')>('node:child_process');

type StubResult = { status?: number | null; error?: { code?: string; message?: string }; stdout?: string; stderr?: string };

// Intercepts BOTH the SDK probe (`dotnet`) and the Roslyn VEHICLE, which is
// spawned as the `dotnet-crap` executable directly — resolved by absolute path
// when `dotnet tool install -g` put it in ~/.dotnet/tools, else by bare name.
// Keyed on argv, not on the command, because the probe is `dotnet --version` and
// the vehicle is `dotnet-crap analyze <file> --coverage <cov>`.
function stubDotnet(handler: (args: readonly string[]) => StubResult): void {
  vi.mocked(spawnSync).mockImplementation(((cmd: string, args: readonly string[] = []) => {
    if (cmd !== 'dotnet' && !(cmd === 'dotnet-crap' || cmd.endsWith('/dotnet-crap'))) {
      return realSpawnSync.spawnSync(cmd, args as string[]) as never;
    }
    return { pid: 0, output: [], signal: null, ...handler(args) } as never;
  }) as never);
}

const PROBE_OK: StubResult = { status: 0, stdout: '9.0.121\n' };
const PROBE_ENOENT: StubResult = { status: null, error: { code: 'ENOENT', message: 'spawnSync dotnet ENOENT' } };
const PROBE_NONZERO: StubResult = { status: 145, stderr: 'A fatal error occurred. SDK not found.\n' };

// The vehicle's REAL payload shape (measured): a top-level object whose `methods`
// carry a declaration lineNumber, a complexity, and NO span fields. `file` must be
// the analysed file so the adapter's file+line+name join can match it to the
// fallback parser's spans.
function vehiclePayload(file: string, methods: { name: string; line: number; cc: number }[]): string {
  return JSON.stringify({
    schemaVersion: '1.0',
    threshold: 30,
    methods: methods.map((m) => ({
      namespace: 'Sample',
      className: 'Widget',
      methodName: m.name,
      signature: '()',
      fullName: `Sample.Widget.${m.name}()`,
      filePath: file,
      lineNumber: m.line,
      crap: 30,
      complexity: m.cc,
      coverage: 0,
      crapLoad: 0,
      isCrappy: false,
      severity: 'elevated',
    })),
  });
}

// One class, two methods, both with a real `if` so CC is 2 — enough shape for the
// descriptor/attribution binding check, and small enough that a CC regression is
// unambiguous.
const SAMPLE_CS = `namespace Sample
{
    public class Widget
    {
        public int Grow(int value)
        {
            if (value > 0)
            {
                return value * 2;
            }

            return 0;
        }

        public bool IsReady(bool flag)
        {
            if (flag)
            {
                return true;
            }

            return false;
        }
    }
}
`;

let tmpDir: string;
let sampleFile: string;

// Coverlet's empty report. The vehicle REQUIRES a Cobertura artifact: without one
// it exits 2 with no methods at all, so the adapter degrades before it ever
// spawns (csharpDescriptorProvider.ts findCobertura). Every test below that means
// to exercise a VEHICLE failure mode must therefore have one on disk.
const EMPTY_COBERTURA = `<?xml version="1.0" encoding="utf-8"?>
<coverage line-rate="0" branch-rate="0" version="1.9" timestamp="0" lines-covered="0" lines-valid="0" branches-covered="0" branches-valid="0">
  <sources />
  <packages />
</coverage>
`;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'csharp-degraded-'));
  sampleFile = join(tmpDir, 'Widget.cs');
  writeFileSync(sampleFile, SAMPLE_CS);
  writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), EMPTY_COBERTURA);
  vi.resetModules();
  vi.mocked(spawnSync).mockClear();
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function loadDescriptorProvider() {
  return await import('../src/complexity-providers/csharpDescriptorProvider.js');
}

// ------------------------------------------------- probeDotnetSdk contract ----
describe('probeDotnetSdk', () => {
  test('an absent binary (ENOENT) degrades to csharp-sdk-missing naming `dotnet` in the fix', async () => {
    stubDotnet(() => PROBE_ENOENT);
    const { probeDotnetSdk } = await loadDescriptorProvider();

    const probe = probeDotnetSdk();
    expect(probe.available).toBe(false);
    expect(probe.version).toBeNull();
    expect(probe.diagnostic?.code).toBe('csharp-sdk-missing');
    // The fix must be actionable AND name the literal the plan requires.
    expect(probe.diagnostic?.fix).toContain('dotnet');
    // The detail is the observed evidence, not a guess.
    expect(probe.diagnostic?.detail).toBe('dotnet --version: spawn failed (ENOENT)');
  });

  test('a non-zero exit also degrades to csharp-sdk-missing, and is distinct from a spawn failure', async () => {
    stubDotnet(() => PROBE_NONZERO);
    const { probeDotnetSdk } = await loadDescriptorProvider();

    const probe = probeDotnetSdk();
    expect(probe.available).toBe(false);
    expect(probe.diagnostic?.code).toBe('csharp-sdk-missing');
    expect(probe.diagnostic?.detail).toContain('exit code 145');
    expect(probe.diagnostic?.detail).toContain('SDK not found');
  });

  test('a healthy SDK reports the version and NO diagnostic', async () => {
    stubDotnet(() => PROBE_OK);
    const { probeDotnetSdk } = await loadDescriptorProvider();

    const probe = probeDotnetSdk();
    expect(probe.available).toBe(true);
    expect(probe.version).toBe('9.0.121');
    expect(probe.diagnostic).toBeNull();
  });

  test('spawns argv-only with a bounded timeout, and never through a shell', async () => {
    stubDotnet(() => PROBE_OK);
    const { probeDotnetSdk } = await loadDescriptorProvider();
    probeDotnetSdk();

    const call = vi.mocked(spawnSync).mock.calls[0]!;
    expect(call[0]).toBe('dotnet');
    expect(call[1]).toEqual(['--version']);
    expect(typeof call[2]).toBe('object');
    expect((call[2] as { timeout?: number }).timeout).toBeGreaterThan(0);
    // Deny-by-default: no shell string is ever constructed.
    expect(call[0]).not.toBe('sh');
    expect(call[0]).not.toBe('bash');
    expect(call[1]).not.toContain('-c');
  });

  test('probes once and memoises the result', async () => {
    stubDotnet(() => PROBE_OK);
    const { probeDotnetSdk } = await loadDescriptorProvider();

    expect(probeDotnetSdk()).toBe(probeDotnetSdk());
    const dotnetCalls = vi.mocked(spawnSync).mock.calls.filter((c) => c[0] === 'dotnet');
    expect(dotnetCalls).toHaveLength(1);
  });
});

// ------------------------------------------- both modes, one descriptor shape ----
describe('parseCsharpDescriptors: one shape in both modes', () => {
  test('SDK absent → fallback mode, csharp-sdk-missing, CC still returned', async () => {
    stubDotnet(() => PROBE_ENOENT);
    const { analyzeCsharpFile, parseCsharpDescriptors } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.code).toBe('csharp-sdk-missing');
    // NOT a silent empty result: the run still produces real CC values.
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Widget.Grow', 'Widget.IsReady']);
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual([2, 2]);
    expect(await parseCsharpDescriptors(sampleFile)).toHaveLength(2);
  });

  test('SDK present but the vehicle is unusable → csharp-analysis-failed, NOT a silent empty list', async () => {
    // dotnet --version succeeds; the Roslyn vehicle does not. This is the real
    // cycle-1 outcome on the implementing machine.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 1, stderr: 'dotnet-dotnet-crap does not exist.\n' }));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('exit code 1');
    // Delegates to the fallback parser rather than reporting nothing — an empty
    // list here would be a zero-scored phantom PASS.
    expect(analysis.mode).toBe('fallback');
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual([2, 2]);
  });

  test('the vehicle fix text names BOTH the install step and the verify step — installing alone is not clearance', async () => {
    // Review C1(b): the old text was "install the package" only, which implied
    // that `dotnet tool install -g Crap4DotNet` alone clears csharp-analysis-failed.
    // It does not: the spawn form `dotnet dotnet-crap <file>` fails even with the
    // tool on PATH, and the documented form carries an `analyze` subcommand this
    // adapter never passes. Asserted on the literal `dotnet-crap analyze` substring
    // so the test fails if the text drops back to install-only.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 1, stderr: 'dotnet-dotnet-crap does not exist.\n' }));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const fix = (await analyzeCsharpFile(sampleFile)).diagnostic?.fix ?? '';
    expect(fix).toContain('dotnet tool install -g Crap4DotNet');
    expect(fix).toContain('dotnet-crap analyze');
    // The fallback must be named as an acceptable outcome, not a defect to chase.
    expect(fix).toContain('approximation');
  });

  test('SDK present, vehicle exits 0 with unparseable output → csharp-analysis-failed', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: 'MethodComplexity = 3\n' }));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('not JSON');
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('SDK present, vehicle spawn fails outright → csharp-analysis-failed naming the spawn error', async () => {
    // Sibling of the exit-code case above: the binary is absent, not failing.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : PROBE_ENOENT));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('spawn failed');
    expect(analysis.diagnostic?.detail).toContain('ENOENT');
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('SDK present, vehicle exits 0 with a JSON object carrying no `methods` → csharp-analysis-failed', async () => {
    // The real payload is an OBJECT (C-5), so `methods` — not array-ness — is the
    // discriminator. A bare object must degrade, not be mistaken for a result.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: '{"complexity":3}' }));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('no `methods` array');
    expect(analysis.descriptors).toHaveLength(2);
  });

  test('SDK present, vehicle emits methods:[null] → csharp-analysis-failed, NOT a cast that throws later', async () => {
    // Element-level shape failure. `methods: []` still accepts (an empty method
    // list is legal — the vehicle simply found nothing); entries that are not
    // method records do not.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: '{"methods":[null]}' }));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.mode).toBe('fallback');
    expect(analysis.diagnostic?.code).toBe('csharp-analysis-failed');
    expect(analysis.diagnostic?.detail).toContain('malformed records');
    expect(analysis.descriptors.map((d) => d.complexity)).toEqual([2, 2]);
  });

  test('SDK present, vehicle emits a real-shaped payload → rich mode, no diagnostic', async () => {
    // STUBBED vehicle output in the MEASURED shape (an object with `methods`, each
    // record carrying a DECLARATION line and no spans — see
    // .opencode/validation/csharp-rich-vehicle-decision.md §4). It is not a
    // measurement of dotnet-crap; it proves the rich branch is reachable and
    // shape-compatible. Spans come from the fallback parser, not this payload.
    const richPayload = vehiclePayload(sampleFile, [{ name: 'Grow', line: 5, cc: 2 }]);
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: richPayload }));
    const { analyzeCsharpFile } = await loadDescriptorProvider();

    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.mode).toBe('rich');
    expect(analysis.diagnostic).toBeNull();
    expect(analysis.descriptors.map((d) => d.displayName)).toEqual(['Widget.Grow']);
    // The descriptor keys stay byte-identical across modes — I2 of the parity file.
    expect(Object.keys(analysis.descriptors[0]!).sort()).toEqual(
      [
        'bodySpan',
        'complexity',
        'containerName',
        'displayName',
        'endLine',
        'expectsBranchCoverage',
        'expectsStatementCoverage',
        'functionName',
        'startLine',
      ].sort()
    );
  });

  test('the two diagnostic codes are DISTINCT — a failed SDK probe is never reported as a failed analysis', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_ENOENT : PROBE_OK));
    const { analyzeCsharpFile, probeDotnetSdk } = await loadDescriptorProvider();
    expect(probeDotnetSdk().diagnostic?.code).toBe('csharp-sdk-missing');
    const analysis = await analyzeCsharpFile(sampleFile);
    expect(analysis.diagnostic?.code).toBe('csharp-sdk-missing');
    expect(analysis.diagnostic?.code).not.toBe('csharp-analysis-failed');
  });
});

// ------------------------------------------------- describe() carries the note ----
describe('csharpComplexityProvider.describe()', () => {
  test('degraded mode states what degraded and proposes the fix', async () => {
    stubDotnet(() => PROBE_ENOENT);
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    const note = csharpComplexityProvider.describe();
    expect(note).toContain('DEGRADED');
    expect(note).toContain('csharp-sdk-missing');
    expect(note).toContain('fallback parser');
    expect(note).toContain('Fix:');
    expect(note).toContain('dotnet');
  });

  test('healthy SDK reports the version and does not claim degradation', async () => {
    stubDotnet(() => PROBE_OK);
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    const note = csharpComplexityProvider.describe();
    expect(note).toContain('9.0.121');
    expect(note).not.toContain('DEGRADED');
  });

  test('a healthy SDK that prints nothing still names a version, not a blank', async () => {
    stubDotnet(() => ({ status: 0, stdout: '\n' }));
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    const note = csharpComplexityProvider.describe();
    expect(note).toContain('dotnet unknown');
    expect(note).not.toContain('DEGRADED');
  });

  test('SDK present but the vehicle was REJECTED → DEGRADED [csharp-analysis-failed], not a healthy claim', async () => {
    // This is the real cycle-1 outcome on this machine: the SDK answers
    // `--version`, the Roslyn vehicle does not. describe() must NOT report
    // "dotnet 9.0.121 detected" over files that measured with the fallback.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 1, stderr: 'dotnet-dotnet-crap does not exist.\n' }));
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    // The analyze path is what learns the vehicle is rejected; describe() plumbs
    // that outcome rather than re-probing (the probe is memoised, the vehicle is
    // per-file, so a re-probe could not learn it).
    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(info.map((i) => i.cc)).toEqual([2, 2]);

    const note = csharpComplexityProvider.describe();
    expect(note).toContain('DEGRADED');
    expect(note).toContain('csharp-analysis-failed');
    expect(note).toContain('Fix:');
    expect(note).toContain('dotnet-crap');
    expect(note).toContain('exit code 1');
    expect(note).not.toContain('detected;');
  });

  test('the rich path clears a prior rejection, so a later healthy note is not stuck DEGRADED', async () => {
    let healthy = false;
    // Minimal valid payload: only the four fields the dispatcher reads. That the
    // rich path ACCEPTS this is what pins the element guard to those four.
    // Minimal valid payload in the measured shape: only the fields the adapter
    // reads. That the rich path ACCEPTS this pins the element guard to them.
    const ok = vehiclePayload(sampleFile, [{ name: 'Grow', line: 5, cc: 2 }]);
    stubDotnet((args) => {
      if (args[0] === '--version') return PROBE_OK;
      return healthy ? { status: 0, stdout: ok } : { status: 1, stderr: 'dotnet-dotnet-crap does not exist.\n' };
    });
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(csharpComplexityProvider.describe()).toContain('DEGRADED');

    healthy = true;
    await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(csharpComplexityProvider.describe()).not.toContain('DEGRADED');
  });

  test('readCoverage is delegated to src/coverage.ts, not re-implemented here', async () => {
    stubDotnet(() => PROBE_OK);
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    expect(csharpComplexityProvider.extensions).toEqual(['.cs']);

    // An empty dir reports no coverage — only src/coverage.ts's auto-detect can
    // produce that specific {available:false, error:false} pair.
    const none = await csharpComplexityProvider.readCoverage(tmpDir);
    expect(none).toMatchObject({ available: false, error: false });

    // An explicit artifact is parsed by src/coverage.ts and comes back as a real
    // coverageMap keyed on the .cs file. A local stub could not do this.
    // NB: LCOV, not Cobertura — src/coverage.ts:516 routes any `coverage*.xml`
    // to the PYTHON converter, and Task 4 is what registers Cobertura. Reading
    // a Cobertura artifact here would be testing a Task 4 capability.
    const artifact = join(tmpDir, 'coverage.info');
    writeFileSync(
      artifact,
      ['SF:Widget.cs', 'DA:5,1', 'DA:6,1', 'BRDA:6,0,0,1', 'BRF:1', 'BRH:1', 'LF:2', 'LH:2', 'end_of_record'].join('\n')
    );
    const found = await csharpComplexityProvider.readCoverage(tmpDir, artifact);
    expect(found.available).toBe(true);
    expect(found.error).toBe(false);
    expect(found.coverageMap?.size).toBe(1);
    expect([...(found.coverageMap?.keys() ?? [])][0]).toContain('Widget.cs');
  });
});

// ---------------------------------------- collectComplexity repo walk + attribution ----
describe('collectComplexity → attribution binding', () => {
  test('every emitted ComplexityInfo hits attribution descriptor lookup on real values', async () => {
    stubDotnet(() => PROBE_ENOENT);
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(info.map((i) => i.method)).toEqual(['Widget.Grow', 'Widget.IsReady']);
    expect(info.map((i) => i.cc)).toEqual([2, 2]);

    // src/attribution.ts:143-144 keys descriptors exactly like this.
    const { parseCsharpDescriptors } = await loadDescriptorProvider();
    const descriptorMap = new Map(
      (await parseCsharpDescriptors(sampleFile)).map((d) => [
        `${d.containerName ? d.containerName + '.' : ''}${d.functionName}:${d.startLine}`,
        d,
      ])
    );

    // src/attribution.ts:161 performs precisely this lookup; a miss silently
    // nulls coverage attribution, which is the failure this assertion exists for.
    for (const entry of info) {
      expect(descriptorMap.has(`${entry.method}:${entry.lineStart}`)).toBe(true);
    }
  });

  test('descriptors carry real coverage through the core coverageForMethods call attribution makes', async () => {
    stubDotnet(() => PROBE_ENOENT);
    const { parseCsharpDescriptors } = await loadDescriptorProvider();
    const descriptors = await parseCsharpDescriptors(sampleFile);
    const grow = descriptors.find((d) => d.displayName === 'Widget.Grow')!;

    // Real Cobertura XML → real FileCoverage (Task 1's parser), then the same
    // `coverageForMethods([descriptor], fileCoverage)` call attribution.ts:165 makes.
      const cobertura = [
      '<?xml version="1.0"?>',
      '<coverage line-rate="1" branch-rate="1" version="1.9" timestamp="0">',
      '  <sources><source>/src</source></sources>',
      '  <packages><package name="Sample">',
      '    <classes>',
      `      <class name="Sample.Widget" filename="Widget.cs" line-rate="1" branch-rate="1">`,
      '        <lines>',
      '          <line number="5" hits="1" branch="false"/>',
      '          <line number="6" hits="1" branch="true" condition-coverage="50% (1/2)"/>',
      '          <line number="7" hits="1" branch="true" condition-coverage="50% (1/2)"/>',
      '        </lines>',
      '      </class>',
      '    </classes>',
      '  </package></packages>',
      '</coverage>',
    ].join('\n');
    const coverageMap = parseCoberturaContent(cobertura, tmpDir);
    // One entry keyed by the Cobertura filename; the key form is Task 1's
    // concern, so this test takes the single value rather than pinning it.
    const fileCoverage = [...coverageMap.values()][0]!;
    expect(fileCoverage).toBeDefined();
    expect(fileCoverage.statements.length).toBeGreaterThan(0);

    const attributed = coverageForMethods([grow], fileCoverage)[0]!;
    expect(attributed.coverage.percent).toBe(100);
    expect(attributed.statementCoverage.percent).toBe(100);
  });

  test('a malformed vehicle array never reaches the dispatcher catch — the file is still measured', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: '{"methods":[null]}' }));
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    // Without the element guard, `d.displayName` threw on the null element and the
    // bare `catch {}` swallowed it: a silently SKIPPED file, whose empty result is
    // indistinguishable from "this file has no methods".
    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(info.map((i) => i.method)).toEqual(['Widget.Grow', 'Widget.IsReady']);
    expect(info.map((i) => i.cc)).toEqual([2, 2]);
  });

  // F-E1. The prior version of this test walked `join(tmpDir, '..', 'etc')`, a path
  // that does not exist — so `find` exited non-zero, `findCsharpFiles` returned []
  // (csharpComplexityProvider.ts:81) and the batch loop never ran: the assertion was
  // tautological, and the `catch` at :110 that this test names was never reached.
  // Measured, not assumed: that payload yields `RESULT=[]`, `find` exit status 1.
  //
  // Replacement drives the SAME branch for real: a `.cs` file whose basename fails
  // `isValidFileName` (csharpFallbackParser.ts:69-73 — the regex has no space) throws
  // at :258, so the per-file `catch` at :110 must skip exactly that file while its
  // good sibling still measures. If the guard were removed the bad file would parse
  // and the batch would report 4 methods, failing the assertion — so this is a real
  // tripwire, not a shape check.
  test('a guard-rejected file is skipped, never aborting the batch', async () => {
    // Vehicle returns a malformed element so the provider falls back to the pure
    // TypeScript parser — that is the parser owning the guard under test.
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: '{"methods":[null]}' }));
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');

    // Same SAMPLE_CS content, so the ONLY difference is the basename: `Widget Bad.cs`
    // fails the regex on its space, `Widget.cs` (written by beforeEach) passes.
    writeFileSync(join(tmpDir, 'Widget Bad.cs'), SAMPLE_CS);
    expect(sampleFile).toContain('Widget.cs');

    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    // The good sibling survived the batch; the rejected one contributed nothing.
    expect(info.map((i) => i.method)).toEqual(['Widget.Grow', 'Widget.IsReady']);
    expect(info.map((i) => i.cc)).toEqual([2, 2]);
  });
});
// ------------------------- GAP 8 / GAP 9: per-language provenance on the wire ----
// Before Task 9 a degraded C# measurement was indistinguishable from a native one:
// the evidence builder reported the TypeScript analyzer for every language and
// called the stage NATIVE. These tests pin the three derived answers — `source.tool`,
// quality, and the reason codes — against REAL collectComplexity output in BOTH modes,
// so a hardcoded NATIVE or a hardcoded tool id fails here.
describe('ComplexityInfo.provenance: GAP 8 source.tool + GAP 9 quality', () => {
  const rich = () => vehiclePayload(sampleFile, [{ name: 'Grow', line: 5, cc: 2 }]);

  test('SDK absent → every measurement is FALLBACK, names the fallback tool, and carries the reason code', async () => {
    stubDotnet(() => PROBE_ENOENT);
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    const { measurementProvenance, measurementQuality, measurementDegradations } = await import('../src/complexity.js');

    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(info.length).toBeGreaterThan(0);

    // Per-measurement: NATIVE is never claimed on the degraded path.
    for (const i of info) expect(i.provenance?.mode).toBe('FALLBACK');
    // Stage-level: one approximate file makes the whole stage non-native.
    expect(measurementQuality(info)).toBe('FALLBACK');
    // `source.tool` on the evidence record names the tool that actually ran.
    const source = measurementProvenance(info[0]);
    expect(source.tool).not.toBe('@barney-media/crap-typescript-core');
    expect(source.version.length).toBeGreaterThan(0);
    // WHY, machine-readable and distinct from `describe()` prose.
    expect(measurementDegradations(info)).toEqual(['csharp-sdk-missing']);
    // `degradation` is NOT part of the published Source shape.
    expect(Object.keys(source).sort()).toEqual(['tool', 'version']);
  });

  test('SDK present, vehicle unusable → FALLBACK with the csharp-analysis-failed code, NOT sdk-missing', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 1, stderr: 'boom\n' }));
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    const { measurementQuality, measurementDegradations } = await import('../src/complexity.js');

    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(info.length).toBeGreaterThan(0);
    expect(measurementQuality(info)).toBe('FALLBACK');
    expect(measurementDegradations(info)).toEqual(['csharp-analysis-failed']);
  });

  test('rich path → NATIVE, no degradation code, and the vehicle tool id', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: rich() }));
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    const { measurementQuality, measurementDegradations, measurementProvenance } = await import('../src/complexity.js');

    const info = await csharpComplexityProvider.collectComplexity(tmpDir);
    expect(info).toHaveLength(1);
    expect(info[0]!.provenance?.mode).toBe('NATIVE');
    expect(measurementQuality(info)).toBe('NATIVE');
    // Empty ⇒ the lineage key is spread in only when non-empty, so a native stage's
    // inputs key-set is unchanged.
    expect(measurementDegradations(info)).toEqual([]);
    expect(measurementProvenance(info[0]).tool).toBe(info[0]!.provenance!.tool);
  });

  test('the two csharp source.tool values DIFFER — the fallback never impersonates the vehicle', async () => {
    const { measurementProvenance } = await import('../src/complexity.js');

    stubDotnet(() => PROBE_ENOENT);
    const { csharpComplexityProvider: fallbackProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    const fallbackInfo = await fallbackProvider.collectComplexity(tmpDir);
    const fallbackTool = measurementProvenance(fallbackInfo[0]).tool;

    vi.resetModules();
    vi.mocked(spawnSync).mockClear();
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 0, stdout: rich() }));
    const { csharpComplexityProvider: richProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    const richInfo = await richProvider.collectComplexity(tmpDir);
    const richTool = measurementProvenance(richInfo[0]).tool;

    expect(fallbackTool).not.toBe(richTool);
    expect(richInfo).toHaveLength(1);
  });
});

// ---------------------- acceptance 5 at the EVIDENCE level, both halves ----------
// The unit tests above prove the three derived answers. This one proves they reach
// the PUBLIC JSON — the defect it pins is real and was found by this very task:
// `buildQuality` hardcoded `complexity: 'NATIVE'`, so the lineage said FALLBACK
// while `diagnostics.quality.complexity` still said NATIVE. Acceptance 5 requires
// BOTH to read FALLBACK.
describe('evidence output: diagnostics.quality.complexity is FALLBACK, not NATIVE', () => {
  test('a degraded .cs run publishes FALLBACK in quality AND names the reason code in lineage', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 1, stderr: 'vehicle rejected\n' }));
    const { buildEvidenceOutput, registerProvider } = await import('../src/evidence.js');
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    registerProvider('.cs', csharpComplexityProvider);

    const intervals = new Map<string, { start: number; end: number }[]>([[sampleFile.replace(tmpDir + '/', ''), [{ start: 1, end: 30 }]]]);
    const out = (await buildEvidenceOutput('HEAD', intervals, tmpDir, 30)) as {
      changedFunctions: { source: { tool: string; version: string } }[];
      diagnostics: {
        quality: { complexity: string; stageComplete: { complexity: boolean } };
        lineage: { stage: string; tool: string; version: string; inputs: Record<string, unknown> }[];
      };
    };

    // GAP 9: no false NATIVE. Both sinks, not one.
    expect(out.diagnostics.quality.complexity).toBe('FALLBACK');
    const lineage = out.diagnostics.lineage.find((l) => l.stage === 'complexity')!;
    expect(lineage.inputs.quality).toBe('FALLBACK');
    expect(lineage.inputs.degradationCodes).toEqual(['csharp-analysis-failed']);
    // GAP 8: per-function source.tool is the tool that ran, and the published
    // Source shape stays exactly { tool, version } — no `mode`, no `degradation`.
    expect(out.changedFunctions.length).toBeGreaterThan(0);
    for (const f of out.changedFunctions) {
      expect(f.source.tool).not.toBe('@barney-media/crap-typescript-core');
      expect(Object.keys(f.source).sort()).toEqual(['tool', 'version']);
    }
    // A FALLBACK stage still RAN, so it still earns its 20-point completeness
    // weight — folding quality into stageComplete would silently rescore every
    // degraded repo. Pinned here so that widening is a deliberate future change.
    expect(out.diagnostics.quality.stageComplete.complexity).toBe(true);
  });

  // F2 (Task 9r): the coverage-failed early return (resolveCoverageFailure →
  // evidence.ts:802) publishes buildQuality too. It runs AFTER complexity was
  // collected, so a degraded vehicle must reach this sink as FALLBACK as well —
  // otherwise the same run reports FALLBACK in the complexity lineage and NATIVE
  // in diagnostics.quality. The attribution-throw sibling (attachCoverageWithTracking
  // :842) is threaded identically; this test pins the reachable one.
  test('degraded .cs + coverage-failed early return: quality.complexity FALLBACK matches lineage', async () => {
    stubDotnet((args) => (args[0] === '--version' ? PROBE_OK : { status: 1, stderr: 'vehicle rejected\n' }));
    const { buildEvidenceOutput, registerProvider } = await import('../src/evidence.js');
    const { csharpComplexityProvider } = await import('../src/complexity-providers/csharpComplexityProvider.js');
    registerProvider('.cs', csharpComplexityProvider);

    const intervals = new Map<string, { start: number; end: number }[]>([[sampleFile.replace(tmpDir + '/', ''), [{ start: 1, end: 30 }]]]);
    // Explicit coverageFile that does not exist → readCoverageFile returns
    // { error: true, reason: 'missing' } (coverage.ts:613) → capability 'failed'
    // → resolveCoverageFailure takes the non-autoGenerated FAILED early return.
    const out = (await buildEvidenceOutput('HEAD', intervals, tmpDir, 30, join(tmpDir, 'no-such-coverage.xml'))) as {
      analysisStatus: string;
      diagnostics: {
        quality: { complexity: string };
        lineage: { stage: string; inputs: Record<string, unknown> }[];
      };
    };

    expect(out.analysisStatus).toBe('FAILED');
    // Both sinks agree: the early return must not claim a native measurement.
    expect(out.diagnostics.quality.complexity).toBe('FALLBACK');
    const lineage = out.diagnostics.lineage.find((l) => l.stage === 'complexity')!;
    expect(lineage.inputs.quality).toBe('FALLBACK');
    expect(out.diagnostics.quality.complexity).toBe(lineage.inputs.quality);
  });
});

// ================== WS3.6: constructor `.ctor` join safe-degrade ===============
// The fallback parser reports a constructor as `Foo.Foo` (functionName === the type
// name, csharpFallbackParser.ts:36-38 and :299). A Roslyn-based rich vehicle may
// instead report `.ctor` — documented, UNVERIFIED, at
// test/csharp-fallback-parity.test.ts:475-477 (I2's one known exception, F-F).
//
// This does NOT resolve F-F. It pins the SAFE-DEGRADE contract: when a descriptor
// keyed by a name the complexity entry does not carry meets attribution's join, the
// run must (a) not throw, (b) record NO phantom coverage for it, and (c) still
// attribute its siblings. Without that pin, adopting a `.ctor`-naming vehicle later
// could silently corrupt attribution for constructors only.
//
// The join under test, verbatim:
//   src/attribution.ts:155  `${containerName ? containerName + '.' : ''}${functionName}:${startLine}`
//   src/attribution.ts:169  `descriptorMap.get(`${info.method}:${info.lineStart}`)`
//   src/attribution.ts:170  `if (!descriptor) { coverageMap.set(key, nullCoverageEntry()); continue; }`
describe('WS3.6 constructor `.ctor` naming degrades safely at the coverage join', () => {
  // One .cs file, one class, a constructor plus a normal method, so the constructor
  // is a SIBLING that must survive as an unattributed entry rather than take the
  // batch down with it.
  const CTOR_CS = `namespace Sample
{
    public class Repo
    {
        public Repo()
        {
            if (DateTime.Now.Year > 2000)
            {
                Seeded = true;
            }
        }

        public int Compute(int x, bool flag)
        {
            if (flag && x > 3) return 1;
            return 0;
        }
    }
}
`;
  const CTOR_CS_FILE = 'Repo.cs';

  let ctorDir: string;
  let ctorFile: string;

  beforeEach(() => {
    ctorDir = mkdtempSync(join(tmpdir(), 'csharp-ctor-'));
    ctorFile = join(ctorDir, CTOR_CS_FILE);
    writeFileSync(ctorFile, CTOR_CS);
  });

  afterAll(() => {
    rmSync(ctorDir, { recursive: true, force: true });
  });

  // Cobertura over Repo.cs with a hit on the constructor body AND on Compute, so a
  // mixed result (one attributed, one not) is observable rather than all-null.
  function ctorCobertura(sourceRoot: string): string {
    return [
      '<?xml version="1.0"?>',
      '<coverage line-rate="1" branch-rate="0" version="1.9" timestamp="0">',
      `  <sources><source>${sourceRoot}</source></sources>`,
      '  <packages><package name="Sample">',
      '    <classes>',
      '      <class name="Sample.Repo" filename="Repo.cs" line-rate="1" branch-rate="0">',
      '        <lines>',
      '          <line number="6" hits="1" branch="false"/>',
      '          <line number="7" hits="1" branch="true" condition-coverage="50% (1/2)"/>',
      '          <line number="14" hits="1" branch="true" condition-coverage="50% (1/2)"/>',
      '        </lines>',
      '      </class>',
      '    </classes>',
      '  </package></packages>',
      '</coverage>',
    ].join('\n');
  }

  test('the fallback names a constructor Foo.Foo — the key this join expects', async () => {
    // Baseline: with the CURRENT parser the constructor DOES find its descriptor, so
    // this test establishes that the safe-degrade test below is measuring a real
    // divergence and not a permanently-unmatched key.
    const { parseCsharpDescriptors } = await loadDescriptorProvider();
    const descriptors = await parseCsharpDescriptors(ctorFile);
    const names = descriptors.map((d) => d.displayName);
    expect(names).toContain('Repo.Repo');
    expect(names).toContain('Repo.Compute');
    // `.ctor` is NOT what the fallback emits — that is the whole F-F question.
    expect(names).not.toContain('.ctor');

    const descriptorMap = new Map(
      descriptors.map((d) => [`${d.containerName ? d.containerName + '.' : ''}${d.functionName}:${d.startLine}`, d])
    );
    // This is the exact key attribution builds for the constructor (attribution.ts:155).
    expect(descriptorMap.has('Repo.Repo:5')).toBe(true);
  });

  test('a `.ctor`-keyed method is dropped with NO phantom coverage and NO throw', async () => {
    // Drive the REAL join: `attachCoverage` with a coverage map keyed on the .cs
    // file and a complexity entry whose method name a `.ctor`-naming vehicle would
    // produce (`Repo..ctor`), which no descriptor key can match.
    const { attachCoverage } = await import('../src/attribution.js');
    const { parseCoberturaContent } = await import('../src/coverage-providers/coberturaProvider.js');

    const coverageMap = parseCoberturaContent(ctorCobertura(ctorDir), ctorDir);
    expect(coverageMap.size).toBe(1);

    // Two entries on the same file: one a `.ctor`-style name that CANNOT join, one
    // the normal method that CAN. Line numbers are the real ones from CTOR_CS:
    // `public Repo()` at :5 and `public int Compute(...)` at :13 — these MUST equal
    // the descriptor's startLine, because the join key is `${method}:${lineStart}`
    // (src/attribution.ts:169). An off-by-one here does not fail loudly; it makes the
    // CONTROL sibling miss its descriptor too, so both entries come back null and
    // `expect(compute.coveragePercent).not.toBeNull()` proves nothing.
    const complexityInfo = [
      { file: CTOR_CS_FILE, method: 'Repo..ctor', cc: 2, lineStart: 5, lineEnd: 11, language: 'csharp' },
      { file: CTOR_CS_FILE, method: 'Repo.Compute', cc: 2, lineStart: 13, lineEnd: 16, language: 'csharp' },
    ] as never[];

    // (a) NO THROW — the call returning at all is the first assertion.
    const attributed = await attachCoverage(complexityInfo, {
      available: true,
      error: false,
      coverageMap,
      contentSha256: 'f'.repeat(64),
    } as never);

    // (b) Every entry is present (nothing is silently dropped from the RESULT).
    expect(attributed).toHaveLength(2);

    const byMethod = new Map(attributed.map((a) => [a.info.method, a]));

    // The `.ctor` entry carries NO phantom coverage — not 0%, not 100%, null.
    const ctor = byMethod.get('Repo..ctor')!;
    expect(ctor).toBeDefined();
    expect(ctor.coveragePercent).toBeNull();
    expect(ctor.coverageKind).toBeNull();

    // (c) Its SIBLING still attributes — the degrade is local, not a batch abort.
    const compute = byMethod.get('Repo.Compute')!;
    expect(compute).toBeDefined();
    expect(compute.coveragePercent).not.toBeNull();
    expect(compute.coverageKind).not.toBeNull();
  });

  test('the same `.ctor` entry is matched when its name agrees with the parser', async () => {
    // The control: swapping ONLY the method name to the parser's `Repo.Repo` turns
    // the null-coverage entry into a real one. Proves the null above came from the
    // NAME MISMATCH and not from the coverage artifact or the file matching.
    const { attachCoverage } = await import('../src/attribution.js');
    const { parseCoberturaContent } = await import('../src/coverage-providers/coberturaProvider.js');

    const coverageMap = parseCoberturaContent(ctorCobertura(ctorDir), ctorDir);

    const complexityInfo = [
      { file: CTOR_CS_FILE, method: 'Repo.Repo', cc: 2, lineStart: 5, lineEnd: 12, language: 'csharp' },
    ] as never[];

    const attributed = await attachCoverage(complexityInfo, {
      available: true,
      error: false,
      coverageMap,
      contentSha256: 'f'.repeat(64),
    } as never);

    expect(attributed).toHaveLength(1);
    // Real attribution, not the null entry — the delta is the NAME, nothing else.
    expect(attributed[0]!.coveragePercent).not.toBeNull();
    expect(attributed[0]!.coverageKind).not.toBeNull();
  });

  test('a `.ctor` entry under an unavailable coverage result is null without touching the join', async () => {
    // The sibling path: `nullCoverageForAll` (attribution.ts:81) short-circuits before
    // the descriptor join entirely, so a `.ctor` name is equally safe there.
    const { attachCoverage } = await import('../src/attribution.js');

    const complexityInfo = [
      { file: CTOR_CS_FILE, method: 'Repo..ctor', cc: 2, lineStart: 5, lineEnd: 12, language: 'csharp' },
      { file: CTOR_CS_FILE, method: 'Repo.Compute', cc: 2, lineStart: 14, lineEnd: 17, language: 'csharp' },
    ] as never[];

    const attributed = await attachCoverage(complexityInfo, {
      available: false,
      error: false,
      coverageMap: null,
    } as never);

    expect(attributed).toHaveLength(2);
    for (const a of attributed) {
      expect(a.coveragePercent).toBeNull();
      expect(a.coverageKind).toBeNull();
    }
  });
});
