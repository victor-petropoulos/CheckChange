/**
 * Generic command provider — runs a shell command to collect complexity.
 * Tokens: {cwd} {out} {ext}. {files} is NOT supported — throws if present.
 * Env: PATH only, no ambient authority. 30s timeout.
 */
import { execFile } from 'node:child_process';
import type { ResolvedProvider } from './config.js';
import type { ComplexityProvider } from '../complexity-providers.js';
import type { ComplexityInfo } from '../complexity.js';

const DEFAULT_TIMEOUT_MS = 30_000;

/** Single-quote wrap a value for safe shell interpolation. Escapes ' as '\'' . */
function shellEscape(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

export function createGenericCommandProvider(
  entry: ResolvedProvider,
  cwd: string,
): ComplexityProvider | null {
  if (!entry.complexityCmd) return null;

  // Throw early if template contains unsupported {files} token
  if (entry.complexityCmd.includes('{files}')) {
    throw new Error(
      'genericCommand: {files} token is not supported in complexityCmd template; ' +
      'use {cwd}, {out}, or {ext} instead',
    );
  }

  return {
    extensions: [...entry.extensions],

    async collectComplexity(dir: string): Promise<ComplexityInfo[]> {
      const timeout = Number(process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
      const out = 'complexity-out.json';
      const ext = entry.extensions[0] ?? '';
      const cmd = entry.complexityCmd!
        .replaceAll('{cwd}', shellEscape(cwd))
        .replaceAll('{out}', shellEscape(out))
        .replaceAll('{ext}', shellEscape(ext));

      const stdout = await execPromise(cmd, {
        cwd: dir,
        timeout,
        env: { PATH: process.env.PATH ?? '' },
      });

      const parsed: unknown = JSON.parse(stdout);
      if (!Array.isArray(parsed)) {
        throw new Error('genericCommand: stdout is not a JSON array');
      }

      return parsed.map((item) => {
        if (
          typeof item !== 'object' || item === null ||
          typeof (item as any).file !== 'string' ||
          typeof (item as any).method !== 'string' ||
          typeof (item as any).lineStart !== 'number' ||
          typeof (item as any).lineEnd !== 'number' ||
          typeof (item as any).cc !== 'number'
        ) {
          throw new Error('genericCommand: invalid ComplexityInfo shape');
        }
        return item as ComplexityInfo;
      });
    },

    describe(): string {
      return `genericCommand(${entry.complexityCmd})`;
    },
  };
}

function execPromise(
  cmd: string,
  opts: { cwd: string; timeout: number; env: NodeJS.ProcessEnv },
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use shell: true to support pipes/redirects in the command string
    execFile(
      'sh',
      ['-c', cmd],
      { cwd: opts.cwd, timeout: opts.timeout, env: opts.env },
      (error, stdout, stderr) => {
        if (error) {
          if ('code' in error && (error as any).code !== undefined && (error as any).code !== 0) {
            reject(new Error(`genericCommand: exited ${(error as any).code}: ${stderr || stdout || error.message}`));
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
