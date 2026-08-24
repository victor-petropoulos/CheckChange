import { join } from 'node:path';
import { access, constants } from 'node:fs/promises';
import { parseCoverageReport } from '@barney-media/crap-typescript-core';

export interface CoverageResult {
  available: boolean;
  coverageMap: Map<string, any> | null;
  error: boolean;
}

export async function readCoverage(cwd: string): Promise<CoverageResult> {
  const coveragePath = join(cwd, 'coverage/coverage-final.json');

  try {
    await access(coveragePath, constants.R_OK);
  } catch {
    // File does not exist or cannot be read
    return { available: false, coverageMap: null, error: false };
  }

  try {
    const coverageMap = await parseCoverageReport(coveragePath, cwd);
    return { available: true, coverageMap, error: false };
  } catch (error) {
    // Malformed or unreadable
    return { available: true, coverageMap: null, error: true };
  }
}
