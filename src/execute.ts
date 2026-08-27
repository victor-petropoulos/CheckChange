import { execFile } from 'node:child_process';

export interface CommandResult {
  command: string;
  args: string[];
  cwd: string | undefined;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  errorCode: string | undefined;
}

/**
 * Wrapper around child_process.execFile that returns a CommandResult.
 * Handles ENOENT (command not found) by setting exitCode to null.
 * @param command The command to execute
 * @param args The arguments to pass to the command
 * @param options Options: cwd, timeout, maxBuffer
 * @returns Promise<CommandResult>
 */
export function execute(
  command: string,
  args: string[] = [],
  options: { cwd?: string; timeout?: number; maxBuffer?: number } = {}
): Promise<CommandResult> {
  const { cwd, timeout, maxBuffer } = options;
  const start = Date.now();

  return new Promise<CommandResult>((resolve) => {
    execFile(command, args, { cwd, timeout, maxBuffer }, (error, stdout, stderr) => {
      const end = Date.now();
      const durationMs = end - start;

      let exitCode: number | null = null;
      let timedOut = false;
      let errorCode: string | undefined;

      if (error) {
        if (error.name === 'TimeoutError') {
          timedOut = true;
        }
        let maybeExitCode: number | null = null;
        if ('exitCode' in error) {
          maybeExitCode = (error as any).exitCode;
        } else if ('code' in error && typeof error.code === 'number') {
          maybeExitCode = error.code;
        }
        if (maybeExitCode !== null) {
          exitCode = maybeExitCode;
        } else if (error.code === 'ENOENT') {
          exitCode = null;
          errorCode = error.code;
        } else {
          exitCode = null;
          // If error.code is a string (but not ENOENT), we still want to capture it
          if (typeof error.code === 'string') {
            errorCode = error.code;
          }
        }
      } else {
        exitCode = 0;
      }

      resolve({
        command,
        args,
        cwd,
        exitCode,
        stdout: stdout ?? '',
        stderr: stderr ?? '',
        durationMs,
        timedOut,
        errorCode
      });
    });
  });
}