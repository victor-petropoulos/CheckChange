// Shared helpers for WP5.2 fixture tests
// Extracted from defect-repro.spec.ts

import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { writeFile, readFile } from 'fs/promises';
import { buildEvidenceOutput } from '../../../../src/evidence.ts';

/**
 * Creates a temporary git repo with src and coverage directories.
 * Returns an object with paths and a cleanup function.
 */
export function createTempRepo() {
  const tempDir = mkdtempSync(join(tmpdir(), 'crap-test-'));
  const srcDir = join(tempDir, 'src');
  const coverageDir = join(tempDir, 'coverage');
  // Create directories
  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
  }
  if (!existsSync(coverageDir)) {
    mkdirSync(coverageDir, { recursive: true });
  }
  // Initialize git repo
  const { execSync } = require('child_process');
  execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
  
  return {
    tempDir,
    srcDir,
    coverageDir,
    cleanup: () => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  };
}

/**
 * Writes a TypeScript source file.
 * @param filePath Absolute path to the file to write
 * @param content File content
 */
export function writeSourceFile(filePath: string, content: string): void {
  writeFileSync(filePath, content, 'utf8');
}

/**
 * Writes an Istanbul coverage JSON file.
 * @param coverageDir Directory where coverage-final.json will be written
 * @param coverageMap Map of file path (relative to coverageDir's parent? Actually we want relative to cwd) to Istanbul coverage object
 */
export function writeCoverageFile(coverageDir: string, coverageMap: Map<string, any>): string {
  // Convert map to plain object for JSON serialization
  const plainObj: Record<string, any> = {};
  for (const [path, cov] of coverageMap.entries()) {
    plainObj[path] = cov;
  }
  const coverageJson = JSON.stringify(plainObj, null, 2);
  const coverageFilePath = join(coverageDir, 'coverage-final.json');
  // Debug: log what we are writing
  console.log(`[helpers] Writing coverage file to: ${coverageFilePath}`);
  console.log(`[helpers] Coverage JSON: ${coverageJson}`);
  console.log(`[helpers] Plain obj keys: ${Object.keys(plainObj)}`);
  writeFileSync(coverageFilePath, coverageJson, 'utf8');
  return coverageFilePath;
}

/**
 * Stage changes placeholder - in our usage, we don't need to actually stage files
 * because buildEvidenceOutput uses the intervals map directly, not git diff.
 * We keep this function for consistency with the pattern.
 * @param tempDir Temporary directory (git repo root)
 * @param intervals Map of relative file path (from repo root) to line intervals [start, end]
 */
export async function stageChanges(tempDir: string, intervals: Map<string, { start: number; end: number }[]>): Promise<void> {
  // No-op: intervals are used directly by buildEvidenceOutput
  // We could create a dummy commit to have a defined HEAD, but not required.
  return;
}

/**
 * Calls buildEvidenceOutput with given parameters.
 * @param base Git base commit (e.g., 'HEAD')
 * @param intervals Map of relative file path to line intervals
 * @param tempDir Temporary directory (git repo root)
 * @param threshold CRAP threshold
 * @param extraArgs Optional extra arguments to pass through (not used currently)
 * @returns Promise resolving to the evidence output
 */
export async function callBuildEvidenceOutput(
  base: string,
  intervals: Map<string, { start: number; end: number }[]>,
  tempDir: string,
  threshold: number,
  extraArgs?: any
): Promise<any> {
  // Note: buildEvidenceOutput signature: (base: string, intervals: Map<string, [number, number][]>, cwd: string, threshold: number, logger?: Logger | undefined)
  // However, the actual implementation expects intervals as Map<string, {start:number, end:number}[]>.
  // We'll cast to any to satisfy TypeScript.
  return await buildEvidenceOutput(base, intervals as any, tempDir, threshold, undefined);
}

/**
 * Normalizes the output for easier assertion.
 * For example, we might want to convert changedFunctions to a map by method name.
 * @param output Raw output from buildEvidenceOutput
 * @returns Normalized output
 */
export function normalizeOutput(output: any): any {
  if (!output || !output.changedFunctions) {
    return output;
  }
  // Create a map of method name to function entry for easy lookup
  const funcMap: Record<string, any> = {};
  for (const func of output.changedFunctions) {
    if (func.method) {
      funcMap[func.method] = func;
    }
  }
  return {
    ...output,
    changedFunctionsMap: funcMap
  };
}