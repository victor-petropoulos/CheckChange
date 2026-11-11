import type { ComplexityInfo } from './complexity.ts';

export interface ComplexityProvider {
  extensions: string[];
  collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>;
  describe(): string;
}
