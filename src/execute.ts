import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';

// ---- Tracing seam (plan task 7) ----
export interface TraceSpan {
  stage: string;
  durationMs: number;
  status: string;
  correlationId: string;
}

export interface TraceExecSpan extends TraceSpan {
  stage: 'exec';
  command: string;
  args: string[];
  exitCode: number | null;
}

/**
 * In-memory trace collector for one pipeline run. Holds the per-run
 * correlation ID and every span recorded (stage spans from the evidence
 * pipeline, exec spans from execute()). Never leaves the process — the
 * deterministic EvidenceOutput (evidence-contract.md:341) carries no timing.
 */
export class TraceRun {
  readonly correlationId: string;
  readonly spans: Array<TraceSpan | TraceExecSpan> = [];

  constructor(correlationId: string = randomUUID()) {
    this.correlationId = correlationId;
  }

  /** Records one pipeline-stage span (git, complexity, ..., evidence). */
  recordStage(stage: string, durationMs: number, status: string): void {
    this.spans.push({ stage, durationMs, status, correlationId: this.correlationId });
  }

  /** Records one child-process span; wired from execute() when given a TraceRun. */
  recordExec(command: string, args: string[], durationMs: number, exitCode: number | null): void {
    this.spans.push({ stage: 'exec', command, args, durationMs, exitCode, status: 'ok', correlationId: this.correlationId });
  }
}

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
  options: { cwd?: string; timeout?: number; maxBuffer?: number } = {},
  trace?: TraceRun
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
      // Tracing seam: record the exec span into the per-run trace (in-memory only).
      if (trace) trace.recordExec(command, args, durationMs, exitCode);
    });
  });
}