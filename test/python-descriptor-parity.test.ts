import { describe, expect, test } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parsePythonFileMethods } from '../src/complexity-providers/pythonDescriptorProvider.js';

// PARITY LOCK for Cycle-2 Task 11: replace the spawnSync('python3') AST seam in
// pythonDescriptorProvider.ts with a pure-TS parser, WITHOUT changing observable output.
//
// Every value below was captured VERBATIM from the current spawnSync
// implementation (python3 3.14.7) via a tsx probe against the real module --
// not hand-derived. A replacement must reproduce these EXACTLY, including
// endColumn (Python 0-based exclusive end offset of the last token) and the
// ast.walk BFS ordering.
//
// CC semantics locked by these fixtures (from the embedded script's compute_cc):
//   base 1; +1 each If/For/While/With/IfExp/ExceptHandler/Assert;
//   BoolOp adds len(values)-1. `else` is NOT a node of its own.
//
// complex_sample.py additionally locks the constructs a regex/indent parser
// gets wrong: class containerName, async def, decorator, multi-line signature,
// one-liner def, for/while, try/except, BoolOp, ternary, and `def` text living
// inside strings. ORDER MATTERS: `ast.walk` is BFS, so the class methods (lines
// 14-24, i.e. ABOVE every module function) come LAST in the result array.
// syntax_error.py locks SyntaxError -> [].
//
// See docs/adr/0022-task11-descriptor-subprocess-deferred.md

const HERE = dirname(fileURLToPath(import.meta.url));
const CALC_PY = join(HERE, 'fixtures', 'python-only', 'src', 'calc.py');
const TEST_MATH_PY = join(HERE, 'fixtures', 'python-only', 'tests', 'test_math.py');
const COMPLEX_SAMPLE_PY = join(HERE, 'fixtures', 'python-only', 'src', 'complex_sample.py');
const SYNTAX_ERROR_PY = join(HERE, 'fixtures', 'python-only', 'syntax_error.py');

describe('parsePythonFileMethods parity: calc.py', () => {
  // Flat module-level defs, one `if` in divide, eight `if`s in complex_function.
  test('reproduces exact descriptors for the 5 flat functions', async () => {
    expect(await parsePythonFileMethods(CALC_PY)).toEqual([
      {
        functionName: 'add',
        containerName: null,
        displayName: 'add',
        startLine: 1,
        endLine: 2,
        complexity: 1,
        bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 16 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'subtract',
        containerName: null,
        displayName: 'subtract',
        startLine: 4,
        endLine: 5,
        complexity: 1,
        bodySpan: { startLine: 4, startColumn: 0, endLine: 5, endColumn: 16 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'multiply',
        containerName: null,
        displayName: 'multiply',
        startLine: 7,
        endLine: 8,
        complexity: 1,
        bodySpan: { startLine: 7, startColumn: 0, endLine: 8, endColumn: 16 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'divide',
        containerName: null,
        displayName: 'divide',
        startLine: 10,
        endLine: 13,
        complexity: 2,
        bodySpan: { startLine: 10, startColumn: 0, endLine: 13, endColumn: 16 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'complex_function',
        containerName: null,
        displayName: 'complex_function',
        startLine: 15,
        endLine: 37,
        complexity: 8,
        bodySpan: { startLine: 15, startColumn: 0, endLine: 37, endColumn: 33 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
    ]);
  });
});

describe('parsePythonFileMethods parity: test_math.py', () => {
  // assert/with CC paths + a comment line inside a body (line 23).
  // test_divide_by_zero is cc=2 (one `with`, no assert) -- NOT 3.
  test('reproduces exact descriptors for the 6 test functions', async () => {
    expect(await parsePythonFileMethods(TEST_MATH_PY)).toEqual([
      {
        functionName: 'test_add',
        containerName: null,
        displayName: 'test_add',
        startLine: 6,
        endLine: 7,
        complexity: 2,
        bodySpan: { startLine: 6, startColumn: 0, endLine: 7, endColumn: 30 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'test_subtract',
        containerName: null,
        displayName: 'test_subtract',
        startLine: 9,
        endLine: 10,
        complexity: 2,
        bodySpan: { startLine: 9, startColumn: 0, endLine: 10, endColumn: 35 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'test_multiply',
        containerName: null,
        displayName: 'test_multiply',
        startLine: 12,
        endLine: 13,
        complexity: 2,
        bodySpan: { startLine: 12, startColumn: 0, endLine: 13, endColumn: 36 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'test_divide',
        containerName: null,
        displayName: 'test_divide',
        startLine: 15,
        endLine: 16,
        complexity: 2,
        bodySpan: { startLine: 15, startColumn: 0, endLine: 16, endColumn: 34 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'test_divide_by_zero',
        containerName: null,
        displayName: 'test_divide_by_zero',
        startLine: 18,
        endLine: 20,
        complexity: 2,
        bodySpan: { startLine: 18, startColumn: 0, endLine: 20, endColumn: 26 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'test_complex_function',
        containerName: null,
        displayName: 'test_complex_function',
        startLine: 22,
        endLine: 31,
        complexity: 9,
        bodySpan: { startLine: 22, startColumn: 0, endLine: 31, endColumn: 49 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
    ]);
  });
});

describe('parsePythonFileMethods parity: complex_sample.py', () => {
  // ORDER IS LOAD-BEARING. The class sits at lines 13-24, ABOVE every module
  // function, yet its three methods are emitted LAST: ast.walk is BFS, so all
  // module-level FunctionDefs (level 1) precede class methods (level 2). A
  // source-order parser fails this array even with every field correct.
  test('reproduces exact descriptors and BFS order for all 9 functions', async () => {
    expect(await parsePythonFileMethods(COMPLEX_SAMPLE_PY)).toEqual([
      // multi-line signature; `if a and b` = If(+1) + BoolOp And(+1) -> cc 3
      {
        functionName: 'multi_line_signature',
        containerName: null,
        displayName: 'multi_line_signature',
        startLine: 27,
        endLine: 32,
        complexity: 3,
        bodySpan: { startLine: 27, startColumn: 0, endLine: 32, endColumn: 12 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // decorated (@functools.lru_cache); docstring prose contains "def ghost"
      {
        functionName: 'cached',
        containerName: null,
        displayName: 'cached',
        startLine: 36,
        endLine: 38,
        complexity: 1,
        bodySpan: { startLine: 36, startColumn: 0, endLine: 38, endColumn: 12 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // one-liner def: startLine === endLine, endColumn past the trailing `42`
      {
        functionName: 'one_liner',
        containerName: null,
        displayName: 'one_liner',
        startLine: 41,
        endLine: 41,
        complexity: 1,
        bodySpan: { startLine: 41, startColumn: 0, endLine: 41, endColumn: 26 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // async def; `while`(+1) + `if`(+1) -> cc 3
      {
        functionName: 'fetch',
        containerName: null,
        displayName: 'fetch',
        startLine: 44,
        endLine: 49,
        complexity: 3,
        bodySpan: { startLine: 44, startColumn: 0, endLine: 49, endColumn: 14 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // for(+1) if(+1) and(+1) while(+1) and(+1) ternary(+1) -> cc 7
      {
        functionName: 'loops_and_boolop',
        containerName: null,
        displayName: 'loops_and_boolop',
        startLine: 52,
        endLine: 61,
        complexity: 7,
        bodySpan: { startLine: 52, startColumn: 0, endLine: 61, endColumn: 31 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // try/except: ExceptHandler(+1) + `if b == 0`(+1) -> cc 3
      {
        functionName: 'guarded_divide',
        containerName: null,
        displayName: 'guarded_divide',
        startLine: 64,
        endLine: 70,
        complexity: 3,
        bodySpan: { startLine: 64, startColumn: 0, endLine: 70, endColumn: 16 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // class methods: containerName set, displayName qualified, col_offset 4
      {
        functionName: '__init__',
        containerName: 'Calculator',
        displayName: 'Calculator.__init__',
        startLine: 14,
        endLine: 15,
        complexity: 1,
        bodySpan: { startLine: 14, startColumn: 4, endLine: 15, endColumn: 26 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      {
        functionName: 'add_to',
        containerName: 'Calculator',
        displayName: 'Calculator.add_to',
        startLine: 17,
        endLine: 20,
        complexity: 2,
        bodySpan: { startLine: 17, startColumn: 4, endLine: 20, endColumn: 25 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
      // decorated method (@property)
      {
        functionName: 'doubled',
        containerName: 'Calculator',
        displayName: 'Calculator.doubled',
        startLine: 23,
        endLine: 24,
        complexity: 1,
        bodySpan: { startLine: 23, startColumn: 4, endLine: 24, endColumn: 29 },
        expectsStatementCoverage: true,
        expectsBranchCoverage: true,
      },
    ]);
  });

  // Guards the "def inside a string is not a definition" requirement directly:
  // the module docstring holds two decoy `def` lines, one at column 0.
  test('ignores def text inside the module docstring', async () => {
    const names = (await parsePythonFileMethods(COMPLEX_SAMPLE_PY)).map(
      (d) => d.functionName
    );
    expect(names).not.toContain('not_a_function');
    expect(names).not.toContain('also_not_a_function');
    expect(names).not.toContain('ghost');
    expect(names).toHaveLength(9);
  });
});

describe('parsePythonFileMethods parity: syntax_error.py', () => {
  test('returns [] for unparseable Python', async () => {
    expect(await parsePythonFileMethods(SYNTAX_ERROR_PY)).toEqual([]);
  });
});
