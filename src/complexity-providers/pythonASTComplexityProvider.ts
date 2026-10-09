import { spawnSync } from 'node:child_process';
import { basename, relative } from 'node:path';
import type { ComplexityInfo, MeasurementProvenance } from '../complexity.ts';
import { readCoverage, type CoverageResult } from '../coverage.js';

// ponytail: `as const` is deliberately NOT used — ComplexityInfo.provenance is a
// mutable optional field, and a readonly const would not assign cleanly.
const PYTHON_AST_PROVENANCE = {
  tool: 'python stdlib ast',
  version: 'unknown',
  mode: 'NATIVE',
} as const satisfies MeasurementProvenance;

export interface PythonASTComplexityProvider {
  extensions: string[];
  collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>;
  describe(): string;
  readCoverage: (cwd: string, file?: string) => Promise<CoverageResult>;
}

export const pythonASTComplexityProvider: PythonASTComplexityProvider = {
  extensions: ['.py'],
  collectComplexity: (cwd: string): Promise<ComplexityInfo[]> => {
    return new Promise((resolve) => {
try {
         // Find all Python files in the cwd, pruning node_modules and .git directories
         const findResult = spawnSync('find', [cwd, '-path', `${cwd}/node_modules`, '-prune', '-o', '-path', `${cwd}/.git`, '-prune', '-o', '-name', '*.py', '-type', 'f', '-print'], { encoding: 'utf8' });

         if (findResult.status !== 0) {
           resolve([]);
           return;
         }

         const files = findResult.stdout
           .trim()
           .split('\n')
           .filter(f => f.trim().length > 0);

         if (files.length === 0) {
           resolve([]);
           return;
         }

         // Validate file names to avoid problematic characters
         const isValidFileName = (file: string) => {
           const baseName = basename(file);
           const regex = /^[a-zA-Z0-9._/-]+$/;
           return regex.test(baseName) && !baseName.includes('..') && !baseName.includes('\n') && !baseName.includes(';') && !baseName.includes('|');
         };

         const validFiles = files.filter(isValidFileName);

         if (validFiles.length === 0) {
           resolve([]);
           return;
         }

         // Validate file names to avoid problematic characters
         // const isValidFileName = (file: string) => {
         //   const regex = /^[a-zA-Z0-9._\/\-]+$/;
         //   return regex.test(file) && !file.includes('..') && !file.includes('\n') && !file.includes(';') && !file.includes('|');
         // };

         // const validFiles = files.filter(isValidFileName);

         // if (validFiles.length === 0) {
         //   resolve([]);
         //   return;
         // }

const complexityInfo: ComplexityInfo[] = [];

         for (const file of validFiles) {
          // We'll create a Python script that uses ast to compute CC for each function in the file
          const pythonScript = `
import ast
import json
import sys

def compute_cc(node):
    """Compute cyclomatic complexity for a given AST node."""
    cc = 1  # Base complexity
    for child in ast.walk(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.IfExp)):
            cc += 1
        elif isinstance(child, ast.ExceptHandler):
            cc += 1
        elif isinstance(child, ast.Assert):
            cc += 1
        elif isinstance(child, ast.BoolOp):
            # Each And or Or inside a BoolOp adds one point per operator
            if isinstance(child.op, (ast.And, ast.Or)):
                cc += len(child.values) - 1
    return cc

def main():
    if len(sys.argv) < 2:
        print(json.dumps([]))
        return

    filename = sys.argv[1]
    try:
        with open(filename, 'r') as f:
            content = f.read()
    except Exception as e:
        print(json.dumps([]))
        return

    try:
        tree = ast.parse(content)
    except SyntaxError:
        print(json.dumps([]))
        return

    results = []
    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda)):
            # For lambdas, we don't have a name? We'll skip lambdas for now because they are anonymous.
            if isinstance(node, ast.Lambda):
                continue
            cc = compute_cc(node)
            # Get function name
            name = node.name if hasattr(node, 'name') else '<lambda>'
            # Get line numbers (1-indexed in AST)
            line_start = node.lineno
            line_end = getattr(node, 'end_lineno', line_start)
            results.append({
                'file': filename,
                'method': name,
                'lineStart': line_start,
                'lineEnd': line_end,
                'cc': cc
            })

    print(json.dumps(results))

if __name__ == '__main__':
    main()
`;
          const cmdResult = spawnSync('python3', ['-c', pythonScript, file], { encoding: 'utf8' });

          if (cmdResult.status !== 0) {
            // If there's an error, skip this file
            continue;
          }

          let parsed: ComplexityInfo[] = [];
          try {
            parsed = JSON.parse(cmdResult.stdout);
          } catch {
            // If parsing fails, skip this file
            continue;
          }

          for (const info of parsed) {
            // Convert to relative path for consistency with other providers
            const rel = relative(cwd, info.file);
            complexityInfo.push({
              file: rel.replace(/\\/g, '/'),
              method: info.method,
              lineStart: info.lineStart,
              lineEnd: info.lineEnd,
              cc: info.cc,
              // GAP 8: these CC values come from the CPython `ast` module run in a
              // `python3 -c` subprocess (pythonDescriptorProvider.ts:118), NOT from
              // @barney-media/crap-typescript-core — which is what evidence reported
              // before, a false provenance claim on every .py function. `version` is
              // 'unknown' because the interpreter version is not probed: the script's
              // stdout contract carries descriptors only, and widening it to carry a
              // version is a bigger change than this. NATIVE, not FALLBACK — `ast` is
              // a real AST parser for Python, so diagnostics.quality stays NATIVE for
              // a .py run and the only delta is the honest tool name.
              provenance: PYTHON_AST_PROVENANCE
            });
          }
        }

        resolve(complexityInfo);
      } catch {
        resolve([]);
      }
    });
  },
  describe(): string {
    return 'Python AST-based complexity provider';
  },
  readCoverage: (cwd: string, file?: string) => readCoverage(cwd, file)
};