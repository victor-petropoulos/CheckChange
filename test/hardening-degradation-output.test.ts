import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { formatOutput, type CheckArgs } from '../src/cli.js';

// H2 (plan task 4): surface `csharp-analysis-failed` in the check TEXT output.
// The defect this pins: a .cs run whose Roslyn vehicle failed degrades to the
// pure-TypeScript approximation, but the text path printed nothing — the run
// reported gate PASS / changed-functions count over measurements that were never
// taken by the C# analyzer. The code already existed (`diagnostics.lineage`'s
// complexity `inputs.degradationCodes`); nothing reached the terminal.
//
// formatOutput is exported and takes the output as a parameter, so no engine
// mocks are needed — the seam under test is the text branch itself.

const ARGS: CheckArgs = {
  base: 'abc123',
  json: false,
  crapThreshold: 30,
  coverageFile: undefined,
  verbose: false,
  allowExternalConfig: false,
};

function output(over: Record<string, unknown> = {}): Parameters<typeof formatOutput>[0] {
  return {
    analysisStatus: 'SUCCESS',
    gate: 'NOT_EVALUATED',
    completeness: 'INCOMPLETE',
    changedFunctions: [{}, {}],
    ruleResults: [],
    capabilities: {},
    ...over,
  } as Parameters<typeof formatOutput>[0];
}

function complexityLineage(degradationCodes?: string[]): Parameters<typeof formatOutput>[0] {
  return output({
    diagnostics: {
      lineage: [
        { stage: 'git', inputs: {} },
        {
          stage: 'complexity',
          inputs: { quality: 'FALLBACK', ...(degradationCodes ? { degradationCodes } : {}) },
        },
      ],
    },
  });
}

let logSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;
let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('H2: csharp-analysis-failed surfaces in check text output', () => {
  test('a degraded complexity stage warns on stderr, naming the provider code', () => {
    formatOutput(complexityLineage(['csharp-analysis-failed']), ARGS, 'abc123', false);
    const stderr = errorSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(stderr).toContain('csharp-analysis-failed');
    expect(stderr).toContain('degraded');
  });

  test('the warning does NOT change the stdout summary line (machine-readable path untouched)', () => {
    formatOutput(complexityLineage(['csharp-analysis-failed']), ARGS, 'abc123', false);
    expect((logSpy.mock.calls[0] ?? [''])[0]).toBe(
      'Analysis complete. Base: abc123, Changed functions: 2',
    );
  });

  test('H1 pairing: the degraded run still exits 0 — NOT_EVALUATED is not a failure', () => {
    formatOutput(complexityLineage(['csharp-analysis-failed']), ARGS, 'abc123', false);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('a native TypeScript run prints no degradation warning (silent by default)', () => {
    formatOutput(complexityLineage(), ARGS, 'abc123', false);
    expect(errorSpy).not.toHaveBeenCalled();
    expect((logSpy.mock.calls[0] ?? [''])[0]).toBe(
      'Analysis complete. Base: abc123, Changed functions: 2',
    );
  });

  test('a run with no diagnostics at all prints no degradation warning', () => {
    formatOutput(output(), ARGS, 'abc123', false);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('every degradation code in the list is surfaced, not just the first', () => {
    formatOutput(
      complexityLineage(['csharp-analysis-failed', 'csharp-vehicle-timeout']),
      ARGS,
      'abc123',
      false,
    );
    const stderr = errorSpy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(stderr).toContain('csharp-analysis-failed');
    expect(stderr).toContain('csharp-vehicle-timeout');
  });

  test('--json is unaffected: the warning is text-path only, JSON stdout stays one object', () => {
    formatOutput(complexityLineage(['csharp-analysis-failed']), { ...ARGS, json: true }, 'abc123', false);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls).toHaveLength(1);
    expect(JSON.parse(String(logSpy.mock.calls[0]?.[0])).gate).toBe('NOT_EVALUATED');
  });
});