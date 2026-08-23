import js from '@eslint/js';
import typescriptESLint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  { ignores: ['node_modules/**', 'dist/**'] },
  js.configs.recommended,
  ...typescriptESLint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parser: typescriptParser, ecmaVersion: 2022, sourceType: 'module' }
  }))
];