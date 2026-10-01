import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';
import type { ExecException, ExecFileOptions } from 'node:child_process';
import { createGenericCommandProvider } from './genericCommand.js';
import type { ResolvedProvider } from './config.js';
import type { ComplexityInfo } from '../complexity.js';

// Mock child_process.execFile
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

import { execFile } from 'node:child_process';
type ExecFileCallback = (error: ExecException | null, stdout: string, stderr: string) => void;
type ExecFileMock = (
  command: string,
  args: readonly string[],
  options: ExecFileOptions,
  callback: ExecFileCallback,
) => void;
const mockExecFile = vi.mocked(execFile) as unknown as MockedFunction<ExecFileMock>;

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

function allow(...argv: string[]): readonly (readonly string[])[] {
  return [argv];
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

  it('executes exact allowed argv without a shell', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'tool {cwd} {out} {ext}' }),
      '/my/cwd',
      allow('tool', '/my/cwd', 'complexity-out.json', '.tl'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/work');

    const [command, args, options] = mockExecFile.mock.calls[0]!;
    expect(command).toBe('tool');
    expect(args).toEqual(['/my/cwd', 'complexity-out.json', '.tl']);
    expect(options.cwd).toBe('/work');
    expect(options.env).toHaveProperty('PATH');
    expect(Object.keys(options.env!)).toEqual(['PATH']);
  });

  it('rejects argv that is not an exact allowlist tuple', () => {
    expect(() =>
      createGenericCommandProvider(
        fakeResolved({ complexityCmd: 'tool {cwd}' }),
        '/tmp',
        allow('tool', '/other'),
      ),
    ).toThrow('command is not allowlisted');
  });

  it('denies repo-config commands without an explicit allowlist', () => {
    expect(() =>
      createGenericCommandProvider(
        fakeResolved({ complexityCmd: 'tool {cwd}', source: 'repo-config' }),
        '/tmp',
      ),
    ).toThrow('command is not allowlisted');
  });

  it('uses first extension only, not join', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({
        extensions: ['.ts', '.tsx', '.js'],
        complexityCmd: 'tool {ext}',
      }),
      '/tmp',
      allow('tool', '.ts'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/tmp');

    const [command, args] = mockExecFile.mock.calls[0]!;
    expect(command).toBe('tool');
    expect(args).toEqual(['.ts']);
  });

  it('passes substituted cwd literally as one argv value', async () => {
    const cwd = "/tmp/it's a dir; echo unsafe";
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'tool {cwd}' }),
      cwd,
      allow('tool', cwd),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/tmp');

    const [command, args] = mockExecFile.mock.calls[0]!;
    expect(command).toBe('tool');
    expect(args).toEqual([cwd]);
  });

  it('parses JSON array into ComplexityInfo[]', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'echo' }),
      '/tmp',
      allow('echo'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
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
      allow('failing-tool'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      const err = new Error('Command failed') as ExecException;
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
      allow('sleep', '10'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      const err = new Error('killed') as ExecException;
      err.killed = true;
      cb(err, '', '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('timed out');

    const callArgs = mockExecFile.mock.calls[0]!;
    const opts = callArgs[2]!;
    expect(opts.timeout).toBe(100);
    delete process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS;
  });

  it('throws when stdout is not valid JSON', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'bad-tool' }),
      '/tmp',
      allow('bad-tool'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, 'not json at all', '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow();
  });

  it('throws when stdout is JSON object instead of array', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'obj-tool' }),
      '/tmp',
      allow('obj-tool'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, '{"key": "value"}', '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('not a JSON array');
  });

  it('throws on invalid ComplexityInfo shape', async () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'bad-shape' }),
      '/tmp',
      allow('bad-shape'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      // Missing lineStart and lineEnd
      cb(null, JSON.stringify([{ file: 'a.tl', method: 'x', cc: 5 }]), '');
    });

    await expect(provider.collectComplexity('/tmp')).rejects.toThrow('invalid ComplexityInfo shape');
  });

  it('describe() returns command string', () => {
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'mytool {cwd}' }),
      '/tmp',
      allow('mytool', '/tmp'),
    )!;
    expect(provider.describe()).toBe('genericCommand(mytool {cwd})');
  });

  it('uses 30s default timeout when env not set', async () => {
    delete process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS;
    const provider = createGenericCommandProvider(
      fakeResolved({ complexityCmd: 'echo' }),
      '/tmp',
      allow('echo'),
    )!;
    mockExecFile.mockImplementation((_cmd, _args, _opts, cb) => {
      cb(null, '[]', '');
    });

    await provider.collectComplexity('/tmp');

    const callArgs = mockExecFile.mock.calls[0]!;
    const opts = callArgs[2]!;
    expect(opts.timeout).toBe(30_000);
  });
});
