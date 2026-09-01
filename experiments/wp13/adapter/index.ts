import { collectPythonComplexity } from './pythonComplexity.js';
import { readPythonCoverage } from './pythonCoverage.js';

import type { ComplexityInfo } from './pythonComplexity.js';
import type { CoverageResult } from './pythonCoverage.js';

export function getPythonProviders(cwd: string) {
  return {
    async collectComplexity(): Promise<ComplexityInfo[]> {
      return collectPythonComplexity(cwd);
    },
    async readCoverage(coverageFile?: string): Promise<CoverageResult> {
      return readPythonCoverage(cwd, coverageFile);
    }
  };
}
