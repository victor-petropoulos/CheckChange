import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGenericCommandProvider } from './genericCommand.js';
import type { ResolvedProvider } from './config.js';
import type { ComplexityInfo } from '../complexity.js';

// Mock child_process.execFile
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile } from 'node:child_process';
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- mock typing workaround
const mockExecFile = vi.mocked(execFile) as unknown as ReturnType<typeof vi.fn>;

function fakeResolved(overrides?: Partial<ResolvedProvider>): ResolvedProvider {
  return {
    language: 'test-lang',
    extensions: ['.tl'],
    complexityCmd: 'mytool {cwd} {out} {ext}',
    coverageFiles: [],
    coverageCmd: null,
    testRunners: null,
    source: 'test',
    ...overrides,
  };
}

const SAMPLE_OUTPUT: ComplexityInfo[] = [
  { file: 'src/a.tl', method: 'foo', lineStart: 1, lineEnd: 10, cc: 3 },
  { file: 'src/b.tl', method: 'bar', lineStart: 15, lineEnd: 20, cc: 7 },
];

// Helper: trigger the callback of the last execFile call
function triggerLastCallback(error: any, stdout: string, stderr: string) {
  const calls = mockExecFile.mock.calls;
  const last = calls[calls.length - 1]!;
  const cb = last[last.length - 1] as Function;
  cb(error, stdout, stderr);
}

beforeEach(() => {
  vi.resetModules();
  mockExecFile.mockReset();
});

describe('createGenericCommandProvider', () => {
  it('returns null when no complexityCmd', () => {
    const provider = createGenericCommandProvider(fakeResolved({ complexityCmd: null }), '/tmp');
    expect(provider).toBeNull();
  });

  it('throws when complexityCmd contains {files} token', () => {
    expect(() =>
      createGenericCommandProvider(
        fakeResolved({ complexityCmd: 'tool {cwd} {files} {out}' }),
        '/tmp',
      ),
    ).toThrow('{files} token is not supported');
  });

  it('expands {cwd} {out} {ext} tokens with shell-escaped values', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'tool {cwd} {out} {ext}' }),
      '/my/cwd',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/work');

    const callArgs = mockExecFile.mock.calls[0]!;
    const args = callArgs[1] as string[];
    const opts = callArgs[2] as any;
    // args[1] is the command string passed to sh -c
    expect(args[0]).toBe('-c');
    expect(args[1]).toBe("tool '/my/cwd' 'complexity-out.json' '.tl'");
    // cwd is the dir parameter
    expect(opts.cwd).toBe('/work');
    // env has only PATH
    expect(opts.env).toHaveProperty('PATH');
    expect(Object.keys(opts.env!)).toEqual(['PATH']);
  });

  it('uses first extension only, not join', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({
        extensions: ['.ts', '.tsx', '.js'],
        complexityCmd: 'tool {ext}',
      }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/tmp');

    const callArgs = mockExecFile.mock.calls[0]!;
    const args = callArgs[1] as string[];
    expect(args[1]).toBe("tool '.ts'");
  });

  it('shell-escapes single quotes in cwd', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'tool {cwd}' }),
      "/tmp/it's a dir",
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/tmp');

    const callArgs = mockExecFile.mock.calls[0]!;
    const args = callArgs[1] as string[];
    // ' inside value becomes '\'' inside single-quoted string
    expect(args[1]).toBe("tool '/tmp/it'\\''s a dir'");
  });

  it('parses JSON array into ComplexityInfo[]', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'echo' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, JSON.stringify(SAMPLE_OUTPUT), '');
    });

    const result = await provider.collectComplexity('/tmp');
    expect(result).toEqual(SAMPLE_OUTPUT);
    expect(result).toHaveLength(2);
    expect(result[0]!.cc).toBe(3);
  });

  it('throws on non-zero exit code', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'failing-tool' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      const err = new Error('Command failed') as any;
      err.code = 1;
      cb(err, '', 'error output');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('exited 1');
  });

  it('throws on timeout and passes correct timeout value', async () => {
    process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS = '100';
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'sleep 10' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      const err = new Error('killed') as any;
      err.killed = true;
      cb(err, '', '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('timed out');

    const callArgs = mockExecFile.mock.calls[0]!;
    const opts = callArgs[2] as any;
    expect(opts.timeout).toBe(100);
    delete process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS;
  });

  it('throws when stdout is not valid JSON', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'bad-tool' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, 'not json at all', '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow();
  });

  it('throws when stdout is JSON object instead of array', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'obj-tool' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, '{"key": "value"}', '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('not a JSON array');
  });

  it('throws on invalid ComplexityInfo shape', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'bad-shape' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      // Missing lineStart and lineEnd
      cb(null, JSON.stringify([{ file: 'a.tl', method: 'x', cc: 5 }]), '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('invalid ComplexityInfo shape');
  });

  it('describe() returns command string', () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'mytool {cwd}' }),
      '/tmp',
    )!;
    expect(provider.describe()).toBe('genericCommand(mytool {cwd})');
  });

  it('uses 30s default timeout when env not set', async () => {
    delete process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS;
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'echo' }),
      '/tmp',
    )!;
    mockExecFile.mockImplementation((_cmd: any, _args: any, _opts: any, cb: any) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/tmp');

    const callArgs = mockExecFile.mock.calls[0]!;
    const opts = callArgs[2] as any;
    expect(opts.timeout).toBe(30_000);
  });
});
