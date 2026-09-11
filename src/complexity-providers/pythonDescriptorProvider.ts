import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';

export interface MethodDescriptor {
  functionName: string;
  containerName: string | null;
  displayName: string;
  startLine: number;
  endLine: number;
  complexity: number;
  bodySpan: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  expectsStatementCoverage: boolean;
  expectsBranchCoverage: boolean;
}

function isValidFileName(file: string): boolean {
  const baseName = basename(file);
  const regex = /^[a-zA-Z0-9._\/\-]+$/;
  return regex.test(baseName) && !baseName.includes('..') && !baseName.includes('\n') && !baseName.includes(';') && !baseName.includes('|');
}

export async function parsePythonFileMethods(filePath: string): Promise<MethodDescriptor[]> {
  if (!isValidFileName(filePath)) {
    throw new Error(`Invalid file name: ${filePath}`);
  }

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
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            cc = compute_cc(node)
            name = node.name
            line_start = node.lineno
            line_end = getattr(node, 'end_lineno', line_start)
            col_offset = node.col_offset
            end_col_offset = getattr(node, 'end_col_offset', col_offset)
            
            # Determine container (class) name
            container_name = None
            for parent in ast.walk(tree):
                if isinstance(parent, ast.ClassDef):
                    for item in parent.body:
                        if item is node:
                            container_name = parent.name
                            break
                if container_name:
                    break
            
            display_name = f"{container_name}.{name}" if container_name else name
            
            results.append({
                'functionName': name,
                'containerName': container_name,
                'displayName': display_name,
                'startLine': line_start,
                'endLine': line_end,
                'complexity': cc,
                'bodySpan': {
                    'startLine': line_start,
                    'startColumn': col_offset,
                    'endLine': line_end,
                    'endColumn': end_col_offset
                },
                'expectsStatementCoverage': True,
                'expectsBranchCoverage': True
            })

    print(json.dumps(results))

if __name__ == '__main__':
    main()
`;

  const cmdResult = spawnSync('python3', ['-c', pythonScript, filePath], { encoding: 'utf8' });

  if (cmdResult.status !== 0) {
    throw new Error(`Python script failed with status ${cmdResult.status}: ${cmdResult.stderr}`);
  }

  let parsed: any[] = [];
  try {
    parsed = JSON.parse(cmdResult.stdout);
  } catch (e) {
    throw new Error(`Failed to parse Python AST output: ${cmdResult.stdout}`);
  }

  return parsed.map(item => ({
    functionName: item.functionName,
    containerName: item.containerName,
    displayName: item.displayName,
    startLine: item.startLine,
    endLine: item.endLine,
    complexity: item.complexity,
    bodySpan: item.bodySpan,
    expectsStatementCoverage: item.expectsStatementCoverage,
    expectsBranchCoverage: item.expectsBranchCoverage
  }));
}