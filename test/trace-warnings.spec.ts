// Tests for TraceRun warning buffer + complexity/coverage fallback.
// Verifies src/execute.ts:31-53 TraceRun/recordWarning, src/complexity.ts:73-77
// fallback, src/coverage.ts:323-327 fallback. (Engram gap + T3 sidecar)
//
// Coverage of runTrace JSON sidecar shape (cli.ts:431-445) is NOT VERIFIED
// unit-side — runTrace is unexported; tested via TraceRun + shape assertion
// mirroring cli.ts:440 status shape.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { TraceRun } from '../src/execute.js';

describe('TraceRun.recordWarning', () => {
  let trace: TraceRun;

  beforeEach(() => {
    trace = new TraceRun();
  });

  test('(a) buffers {source, message, correlationId} with stable correlationId', () => {
    trace.recordWarning('complexity', 'parse failed');
    trace.recordWarning('coverage', 'conversion failed');

    expect(trace.warnings).toHaveLength(2);
    expect(trace.warnings[0]).toEqual({
      source: 'complexity',
      message: 'parse failed',
      correlationId: trace.correlationId,
    });
    expect(trace.warnings[1]).toEqual({
      source: 'coverage',
      message: 'conversion failed',
      correlationId: trace.correlationId,
    });
    // correlationId stable across calls
    expect(trace.warnings[0].correlationId).toBe(trace.correlationId);
    expect(trace.warnings[1].correlationId).toBe(trace.correlationId);
  });

  test('(a2) default constructor generates correlationId', () => {
    const t = new TraceRun();
    expect(t.correlationId).toBeTruthy();
    expect(typeof t.correlationId).toBe('string');
    expect(t.correlationId.length).toBeGreaterThan(0);
  });

  test('(a3) custom correlationId preserved', () => {
    const t = new TraceRun('custom-id-123');
    t.recordWarning('test', 'msg');
    expect(t.warnings[0].correlationId).toBe('custom-id-123');
  });
});

describe('complexity fallback — trace present', () => {
  test('(b) parse-fail with trace → buffered, console.error NOT called', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const trace = new TraceRun();

    // Mock the parseFileMethods to throw, triggering the catch block
    vi.mock('@barney-media/crap-typescript-core', () => ({
      findAllTypeScriptFilesUnderSourceRoots: vi.fn().mockResolvedValue(['/fake/file.ts']),
      parseFileMethods: vi.fn().mockRejectedValue(new Error('syntax error')),
    }));

    const { collectComplexity } = await import('../src/complexity.js');
    await collectComplexity('/tmp', trace);

    // Warning buffered in trace
    expect(trace.warnings.length).toBeGreaterThan(0);
    const warning = trace.warnings.find((w) => w.source === 'complexity');
    expect(warning).toBeDefined();
    expect(warning!.message).toContain('failed to parse');
    expect(warning!.message).toContain('syntax error');
    expect(warning!.correlationId).toBe(trace.correlationId);

    // console.error NOT called (trace captured the warning)
    const errorCalls = errorSpy.mock.calls.filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('failed to parse')),
    );
    expect(errorCalls).toHaveLength(0);

    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });
});

describe('complexity fallback — no trace', () => {
  test('(c) parse-fail without trace → console.error called, nothing buffered', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mock('@barney-media/crap-typescript-core', () => ({
      findAllTypeScriptFilesUnderSourceRoots: vi.fn().mockResolvedValue(['/fake/file.ts']),
      parseFileMethods: vi.fn().mockRejectedValue(new Error('syntax error')),
    }));

    const { collectComplexity } = await import('../src/complexity.js');
    await collectComplexity('/tmp');

    // console.error called with the warning message
    const errorCalls = errorSpy.mock.calls.filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('failed to parse')),
    );
    expect(errorCalls.length).toBeGreaterThan(0);
    expect(errorCalls[0][0]).toContain('syntax error');

    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });
});

describe('coverage fallback — trace present', () => {
  test('(d) conversion-fail with trace → buffered source "coverage"', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const trace = new TraceRun();

    // Create a temp dir with a malformed Python coverage file to trigger conversion failure
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const tmpDir = path.join(import.meta.dirname, 'tmp-trace-cov');
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
    // Write a file that will trigger the conversion-failure warning path
    // .coverage binary that can't be converted → triggers warning in readCoverage
    await fs.writeFile(path.join(tmpDir, '.coverage'), 'NOT_A_REAL_COVERAGE', 'utf8');

    try {
      const { readCoverage } = await import('../src/coverage.js');
      await readCoverage(tmpDir, undefined, trace);

      // Warning buffered with source 'coverage'
      const covWarning = trace.warnings.find((w) => w.source === 'coverage');
      expect(covWarning).toBeDefined();
      expect(covWarning!.message).toContain('Coverage conversion failed');
      expect(covWarning!.correlationId).toBe(trace.correlationId);

      // console.warn NOT called
      const warnCalls = warnSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Coverage conversion')),
      );
      expect(warnCalls).toHaveLength(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
      warnSpy.mockRestore();
    }
  });
});

describe('coverage fallback — no trace', () => {
  test('(e) conversion-fail without trace → console.warn called', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const tmpDir = path.join(import.meta.dirname, 'tmp-trace-cov-notrace');
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, '.coverage'), 'NOT_A_REAL_COVERAGE', 'utf8');

    try {
      const { readCoverage } = await import('../src/coverage.js');
      await readCoverage(tmpDir);

      // console.warn called with conversion failure message
      const warnCalls = warnSpy.mock.calls.filter((call) =>
        call.some((arg) => typeof arg === 'string' && arg.includes('Coverage conversion')),
      );
      expect(warnCalls.length).toBeGreaterThan(0);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
      warnSpy.mockRestore();
    }
  });
});

describe('runTrace sidecar shape (unit-level assertion)', () => {
  test('(f) TraceRun status shape mirrors cli.ts:440', () => {
    const trace = new TraceRun();
    trace.recordStage('git', 100, 'ok');
    trace.recordWarning('complexity', 'parse failed');

    // Mirror cli.ts:440 status shape: { command, correlationId, spans, warnings }
    const status = {
      command: 'trace',
      correlationId: trace.correlationId,
      spans: trace.spans,
      warnings: trace.warnings,
    };

    expect(status.command).toBe('trace');
    expect(typeof status.correlationId).toBe('string');
    expect(Array.isArray(status.spans)).toBe(true);
    expect(Array.isArray(status.warnings)).toBe(true);
    expect(status.warnings[0]).toEqual({
      source: 'complexity',
      message: 'parse failed',
      correlationId: trace.correlationId,
    });

    // JSON roundtrip stability
    const json = JSON.parse(JSON.stringify(status));
    expect(json.warnings).toEqual(status.warnings);
    expect(json.correlationId).toBe(status.correlationId);
  });
});
