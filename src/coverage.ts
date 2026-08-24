import { join, isAbsolute, resolve } from 'node:path';
import { access, constants } from 'node:fs/promises';
import { parseCoverageReport } from '@barney-media/crap-typescript-core';

export interface CoverageResult {
  available: boolean;
  coverageMap: Map<string, any> | null;
  error: boolean;
}

export async function readCoverage(cwd: string, coverageFile?: string): Promise<CoverageResult> {
  let coveragePath: string;
  if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
    // If coverageFile is provided, use it (resolve if relative)
    coveragePath = isAbsolute(coverageFile) ? coverageFile : resolve(cwd, coverageFile);
  } else {
        // No coverageFile provided, use default
        coveragePath = join(cwd, 'coverage/coverage-final.json');
    }

  try {
    await access(coveragePath, constants.R_OK);
  } catch {
    // File does not exist or cannot be read
    if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
        // Explicitly provided file missing -> error:true to trigger FAILED semantics
        return { available: true, coverageMap: null, error: true };
    } else {
        // Default file missing -> existing behavior: available:false, error:false
        return { available: false, coverageMap: null, error: false };
    }
  }

  try {
    const coverageMap = await parseCoverageReport(coveragePath, cwd);
    return { available: true, coverageMap, error: false };
  } catch (error) {
    // Malformed or unreadable
    return { available: true, coverageMap: null, error: true };
  }
}
