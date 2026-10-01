import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    coverage: {
      exclude: ['.worktrees/**', 'experiments/**', 'dist/**', 'coverage/**', 'node_modules/**', 'vitest.config.*']
    }
  }
});
