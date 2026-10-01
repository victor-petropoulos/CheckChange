/**
 * Generic command provider — executes an allowlisted argv command to collect complexity.
 * Tokens: {cwd} {out} {ext}. {files} is NOT supported — throws if present.
 * Env: PATH only, no ambient authority. 30s timeout.
 */
import { execFile } from 'node:child_process';
import type { ResolvedProvider } from './config.js';
import type { ComplexityProvider } from '../complexity-providers.js';
import type { ComplexityInfo } from '../complexity.js';

const DEFAULT_TIMEOUT_MS = 30_000;

function buildArgv(command: string, cwd: string, out: string, ext: string): string[] {
  const argv = command.trim().split(/\s+/);
  if (argv.length === 1 && argv[0] === '') {
    throw new Error('genericCommand: complexityCmd is empty');
  }
  return argv.map((token) =>
    token
      .replaceAll('{cwd}', cwd)
      .replaceAll('{out}', out)
      .replaceAll('{ext}', ext),
  );
}

function sameArgv(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function createGenericCommandProvider(
  entry: ResolvedProvider,
  cwd: string,
  allowedArgv: readonly (readonly string[])[] = [],
): ComplexityProvider | null {
  if (!entry.complexityCmd) return null;

  // Throw early if template contains unsupported {files} token
  if (entry.complexityCmd.includes('{files}')) {
    throw new Error(
      'genericCommand: {files} token is not supported in complexityCmd template; ' +
      'use {cwd}, {out}, or {ext} instead',
    );
  }

  const out = 'complexity-out.json';
  const ext = entry.extensions[0] ?? '';
  const argv = buildArgv(entry.complexityCmd, cwd, out, ext);
  if (!allowedArgv.some((allowed) => sameArgv(argv, allowed))) {
    throw new Error('genericCommand: command is not allowlisted');
  }

  return {
    extensions: [...entry.extensions],

    async collectComplexity(dir: string): Promise<ComplexityInfo[]> {
      const timeout = Number(process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
      const stdout = await execPromise(argv, {
        cwd: dir,
        timeout,
        env: { PATH: process.env.PATH ?? '' },
      });

      const parsed: unknown = JSON.parse(stdout);
      if (!Array.isArray(parsed)) {
        throw new Error('genericCommand: stdout is not a JSON array');
      }

      return parsed.map((item) => {
        const info = item as ComplexityInfo;
        if (
          typeof item !== 'object' || item === null ||
          typeof info.file !== 'string' ||
          typeof info.method !== 'string' ||
          typeof info.lineStart !== 'number' ||
          typeof info.lineEnd !== 'number' ||
          typeof info.cc !== 'number'
        ) {
          throw new Error('genericCommand: invalid ComplexityInfo shape');
        }
        return info;
      });
    },

    describe(): string {
      return `genericCommand(${entry.complexityCmd})`;
    },
  };
}

function execPromise(
  argv: readonly string[],
  opts: { cwd: string; timeout: number; env: NodeJS.ProcessEnv },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const [command, ...args] = argv;
    if (!command) {
      reject(new Error('genericCommand: executable is empty'));
      return;
    }
    execFile(
      command,
      args,
      { cwd: opts.cwd, timeout: opts.timeout, env: opts.env },
      (error, stdout, stderr) => {
        if (error) {
          if ('code' in error && error.code !== undefined && error.code !== 0) {
            reject(new Error(`genericCommand: exited ${error.code}: ${stderr || stdout || error.message}`));
          } else if (error.killed) {
            reject(new Error('genericCommand: timed out'));
          } else {
            reject(new Error(`genericCommand: ${error.message}`));
          }
          return;
        }
        resolve(stdout);
      },
    );
  });
}
