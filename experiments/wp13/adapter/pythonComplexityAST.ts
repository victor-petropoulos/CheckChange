import { pythonASTComplexityProvider } from '../../../src/complexity-providers/pythonASTComplexityProvider';
import type { ComplexityInfo } from '../../../src/complexity.ts';

export async function collectPythonComplexityAST(cwd: string): Promise<ComplexityInfo[]> {
  return pythonASTComplexityProvider.collectComplexity(cwd);
}

// For compatibility with the existing index.ts, we can export an object with the same shape
export const pythonComplexityASTProvider = {
  collectComplexity: (cwd: string) => collectPythonComplexityAST(cwd),
  describe: () => pythonASTComplexityProvider.describe()
};