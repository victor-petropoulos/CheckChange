import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { parseCliArgs } from '../src/cli.js';

describe('parseCliArgs', () => {
  let savedArgv: string[];
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    savedArgv = process.argv;
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    process.argv = savedArgv;
    vi.restoreAllMocks();
  });

  function setArgv(args: string[]) {
    process.argv = ['node', 'cli.js', ...args];
  }

  function expectExit(code: number) {
    expect(exitSpy).toHaveBeenCalledWith(code);
  }

  test('valid --base with value', () => {
    setArgv(['--base', 'HEAD', 'check']);
    const result = parseCliArgs();
    expect(result).toEqual({ base: 'HEAD', json: false, crapThreshold: 30, coverageFile: undefined, verbose: false });
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('valid --json flag boolean', () => {
    setArgv(['--base', 'HEAD', '--json', 'check']);
    const result = parseCliArgs();
    expect(result.json).toBe(true);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('valid --coverage-file with path', () => {
    setArgv(['--base', 'HEAD', '--coverage-file', 'coverage.json', 'check']);
    const result = parseCliArgs();
    expect(result.coverageFile).toBe('coverage.json');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('valid --crap-threshold numeric parsing', () => {
    setArgv(['--base', 'HEAD', '--crap-threshold', '50', 'check']);
    const result = parseCliArgs();
    expect(result.crapThreshold).toBe(50);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('valid --crap-threshold equals syntax', () => {
    setArgv(['--base', 'HEAD', '--crap-threshold=25', 'check']);
    const result = parseCliArgs();
    expect(result.crapThreshold).toBe(25);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('unknown flag exits with error', () => {
    setArgv(['--unknown', 'check']);
    parseCliArgs();
    expectExit(1);
  });

  test('missing value for --base exits with error', () => {
    setArgv(['--base', 'check']);
    parseCliArgs();
    expectExit(1);
  });

  test('missing value for --coverage-file exits with error', () => {
    setArgv(['--base', 'HEAD', '--coverage-file', 'check']);
    parseCliArgs();
    expectExit(1);
  });

  test('missing value for --crap-threshold exits with error', () => {
    setArgv(['--base', 'HEAD', '--crap-threshold', 'check']);
    parseCliArgs();
    expectExit(1);
  });

  test('--crap-threshold invalid number exits with error', () => {
    setArgv(['--base', 'HEAD', '--crap-threshold', 'abc', 'check']);
    parseCliArgs();
    expectExit(1);
  });

  test('--crap-threshold negative exits with error', () => {
    setArgv(['--base', 'HEAD', '--crap-threshold', '-1', 'check']);
    parseCliArgs();
    expectExit(1);
  });

  test('help flag exits with 0', () => {
    setArgv(['--help']);
    parseCliArgs();
    expectExit(0);
  });

  test('--verbose flag accepted', () => {
    setArgv(['--base', 'HEAD', '--verbose', 'check']);
    const result = parseCliArgs();
    expect(result.verbose).toBe(true);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('--debug flag accepted as verbose alias', () => {
    setArgv(['--base', 'HEAD', '--debug', 'check']);
    const result = parseCliArgs();
    expect(result.verbose).toBe(true);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('validation missing --base exits with error', () => {
    setArgv(['check']);
    parseCliArgs();
    expectExit(1);
  });

  test('validation missing positional "check" exits with error', () => {
    setArgv(['--base', 'HEAD', 'other']);
    parseCliArgs();
    expectExit(1);
  });

  test('multiple valid flags combined', () => {
    setArgv(['--base', 'main', '--json', '--verbose', '--crap-threshold', '20', '--coverage-file', 'cov.json', 'check']);
    const result = parseCliArgs();
    expect(result).toEqual({
      base: 'main',
      json: true,
      crapThreshold: 20,
      coverageFile: 'cov.json',
      verbose: true,
    });
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
