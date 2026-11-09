import { describe, expect, test, vi, afterEach } from 'vitest';
import { attachCoverage } from '../src/attribution'
import { parseFileMethods, coverageForMethods, type MethodDescriptor } from '@barney-media/crap-typescript-core'
import { parsePythonFileMethods } from '../src/complexity-providers/pythonDescriptorProvider.js'

vi.mock('@barney-media/crap-typescript-core')
vi.mock('../src/complexity-providers/pythonDescriptorProvider.js', () => ({
  parsePythonFileMethods: vi.fn(),
}))

describe('attachCoverage case-insensitive', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  test('lowercased coverage key vs capital complexity file should still attribute', async () => {
    // Mock parseFileMethods to return a descriptor for calculateCrap
    const mockDescriptor: MethodDescriptor = {
      containerName: undefined,
      functionName: 'calculateCrap',
      startLine: 1,
      endLine: 8,
      // ... other fields if needed, but the function only uses containerName, functionName, startLine
    }

    ;(parseFileMethods as mock.Mock).mockResolvedValue([mockDescriptor])

    // Mock coverageForMethods to return full coverage
    ;(coverageForMethods as mock.Mock).mockReturnValue([{
      coverage: { percent: 100 },
      statementCoverage: { percent: 100 },
      branchCoverage: { percent: 100 }
    }])

    const complexityInfo = [{
      file: 'src/crapCalc.ts',
      method: 'calculateCrap',
      lineStart: 1,
      lineEnd: 8,
      cc: 2
    }]

    // Create a coverageMap with a lowercased path
    const coverageMap = new Map()
    // We'll use a path that is lowercased but ends with src/crapCalc.ts
    coverageMap.set(
      '/tmp/lower/synthetic/src/crapcalc.ts', // note: lowercased 'crapcalc.ts'
      {
        // We don't need to fill in the actual coverage structure because we are mocking coverageForMethods
        // But the function expects fileCoverage to be passed to coverageForMethods.
        // We can put any value because we are mocking coverageForMethods to ignore it and return our mock.
        // However, to be safe, we can put a dummy object.
        // Let's put an empty object.
        statements: {},
        functions: {},
        branches: {},
      }
    )

    const coverageResult = {
      available: true,
      error: false,
      coverageMap
    }

    const result = await attachCoverage(complexityInfo, coverageResult)

    expect(result.length).toBe(1)
    expect(result[0].coveragePercent).not.toBeNull()
    expect(result[0].coverageKind).not.toBeNull()
  })

  test('exact lower-case file still works (src/rules.ts)', async () => {
    // Similar to above but for src/rules.ts and exact case
    const mockDescriptor: MethodDescriptor = {
      containerName: undefined,
      functionName: 'someMethod', // we don't know the method in rules.ts, but we can make one up
      startLine: 1,
      endLine: 10,
    }

    ;(parseFileMethods as mock.Mock).mockResolvedValue([mockDescriptor])
    ;(coverageForMethods as mock.Mock).mockReturnValue([{
      coverage: { percent: 80 },
      statementCoverage: { percent: 80 },
      branchCoverage: { percent: 80 }
    }])

    const complexityInfo = [{
      file: 'src/rules.ts',
      method: 'someMethod',
      lineStart: 1,
      lineEnd: 10,
      cc: 1
    }]

    const coverageMap = new Map()
    coverageMap.set(
      '/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/src/rules.ts', // exact case
      {}
    )

    const coverageResult = {
      available: true,
      error: false,
      coverageMap
    }

    const result = await attachCoverage(complexityInfo, coverageResult)

    expect(result.length).toBe(1)
    expect(result[0].coveragePercent).not.toBeNull()
    expect(result[0].coverageKind).not.toBeNull()
  })

   test('case-insensitive suffix predicate direct (no mocks)', () => {
     const providerKey = '/tmp/lower/synthetic/src/crapcalc.ts'; // lowercased by provider
     const complexityRel = 'src/crapCalc.ts'; // preserves capital C
     // This is the exact predicate fixed in src/attribution.ts:62
     expect(providerKey.toLowerCase().endsWith(complexityRel.toLowerCase())).toBe(true);
     expect(providerKey.endsWith(complexityRel)).toBe(false); // proves case-sensitive would fail
     // also verify exact lower case still works
     expect('/users/.../src/rules.ts'.toLowerCase().endsWith('src/rules.ts'.toLowerCase())).toBe(true);
   })
})

// ---- Missing-branch characterization tests (Slice A) ----
// These pin CURRENT verbatim behavior of src/attribution.ts. Any failure against
// current src is a backprop finding, NOT a src edit in this slice.

describe('attachCoverage missing branches', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  const fullCov = (stmt: number | null, branch: number | null) => [{
    coverage: { percent: stmt ?? branch ?? 50 },
    statementCoverage: { percent: stmt },
    branchCoverage: { percent: branch },
  }]

  const mkInfo = (file: string, method: string, lineStart: number, lineEnd: number) => ({
    file, method, lineStart, lineEnd, cc: 1,
  })

  test(':86 backslash-normalized coverage path still suffix-matches forward-slash complexity rel', async () => {
    const desc: MethodDescriptor = {
      containerName: null,
      functionName: 'calculateCrap',
      startLine: 1,
      endLine: 8,
      displayName: 'calculateCrap',
      complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 8, endColumn: 1 },
      expectsStatementCoverage: true,
      expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(100, 100) as never)

    const coverageMap = new Map()
    // Windows-style provider path; :86 replaces \ with / before endsWith
    coverageMap.set('C:\\proj\\src\\crapCalc.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/crapCalc.ts', 'calculateCrap', 1, 8)],
      { available: true, error: false, coverageMap } as never,
    )

    expect(result).toHaveLength(1)
    expect(result[0]!.coveragePercent).toBe(100)
    expect(result[0]!.coverageKind).toBe('stmt')
  })

  test(':98 ambiguous multi-match declines attribution for the coverage file (both rels null)', async () => {
    const coverageMap = new Map()
    // BOTH 'src/crapCalc.ts' and 'crapCalc.ts' suffix-match this path → matches.length > 1
    coverageMap.set('/tmp/proj/src/crapCalc.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [
        mkInfo('src/crapCalc.ts', 'f1', 1, 2),
        mkInfo('crapCalc.ts', 'f2', 1, 2),
      ],
      { available: true, error: false, coverageMap } as never,
    )

    expect(result).toHaveLength(2)
    expect(result[0]!.coveragePercent).toBeNull()
    expect(result[0]!.coverageKind).toBeNull()
    expect(result[1]!.coveragePercent).toBeNull()
    expect(result[1]!.coverageKind).toBeNull()
    // declined before descriptor parse
    expect(vi.mocked(parseFileMethods)).not.toHaveBeenCalled()
  })

  test(':98 else-if false arm — zero suffix matches also declines attribution', async () => {
    // coverage path matches NO complexity rel → :96 false, :98 false (0 > 1 is false), :101 else
    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/unrelated.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )

    expect(result).toHaveLength(1)
    expect(result[0]!.coveragePercent).toBeNull()
    expect(result[0]!.coverageKind).toBeNull()
    expect(vi.mocked(parseFileMethods)).not.toHaveBeenCalled()
  })

  test(':124 descriptorCache hit — same filePath yielded twice parses descriptors once', async () => {
    const desc: MethodDescriptor = {
      containerName: null,
      functionName: 'foo',
      startLine: 1,
      endLine: 2,
      displayName: 'foo',
      complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true,
      expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(100, 100) as never)

    // CoverageMap is iterated by attachCoverage; array-of-pairs yields the same key twice
    const duplicatePairs = [
      ['/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} }],
      ['/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} }],
    ]

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap: duplicatePairs } as never,
    )

    expect(result).toHaveLength(1)
    expect(result[0]!.coveragePercent).toBe(100)
    // cache hit on second yield — parseFileMethods NOT called twice
    expect(vi.mocked(parseFileMethods)).toHaveBeenCalledTimes(1)
  })

  test(':129 python branch — .py coverage path routes to parsePythonFileMethods, not parseFileMethods', async () => {
    const desc: MethodDescriptor = {
      containerName: null,
      functionName: 'get_health_status',
      startLine: 3,
      endLine: 10,
      displayName: 'get_health_status',
      complexity: 2,
      bodySpan: { startLine: 3, startColumn: 0, endLine: 10, endColumn: 1 },
      expectsStatementCoverage: true,
      expectsBranchCoverage: true,
    }
    vi.mocked(parsePythonFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(100, 100) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/health.py', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/health.py', 'get_health_status', 3, 10)],
      { available: true, error: false, coverageMap } as never,
    )

    expect(result).toHaveLength(1)
    expect(result[0]!.coveragePercent).toBe(100)
    expect(vi.mocked(parsePythonFileMethods)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(parseFileMethods)).not.toHaveBeenCalled()
  })

  test(':164 coverageForMethods falsy ([undefined]) → null coverage entry', async () => {
    const desc: MethodDescriptor = {
      containerName: null,
      functionName: 'foo',
      startLine: 1,
      endLine: 2,
      displayName: 'foo',
      complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true,
      expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue([undefined] as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )

    expect(result).toHaveLength(1)
    expect(result[0]!.coveragePercent).toBeNull()
    expect(result[0]!.coverageKind).toBeNull()
  })

  test(':174-175 ladder — stmt null AND branch null → coverageKind null', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(null, null) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result[0]!.coverageKind).toBeNull()
  })

  test(':176-177 ladder — stmt null, branch set → coverageKind branch', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(null, 80) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result[0]!.coverageKind).toBe('branch')
  })

  test(':178-179 ladder — branch null, stmt set → coverageKind stmt', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(80, null) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result[0]!.coverageKind).toBe('stmt')
  })

  test(':180-181 ladder — stmt < branch → coverageKind stmt', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(30, 60) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result[0]!.coverageKind).toBe('stmt')
  })

  test(':182-183 ladder — branch < stmt → coverageKind branch', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(60, 30) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result[0]!.coverageKind).toBe('branch')
  })

  test(':184-185 ladder — equal percents → coverageKind stmt (arbitrary choice)', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockReturnValue(fullCov(50, 50) as never)

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result[0]!.coverageKind).toBe('stmt')
  })

  test(':191 catch arm — coverageForMethods throws → null coverage entry, no throw out', async () => {
    const desc: MethodDescriptor = {
      containerName: null, functionName: 'foo', startLine: 1, endLine: 2,
      displayName: 'foo', complexity: 1,
      bodySpan: { startLine: 1, startColumn: 0, endLine: 2, endColumn: 1 },
      expectsStatementCoverage: true, expectsBranchCoverage: true,
    }
    vi.mocked(parseFileMethods).mockResolvedValue([desc])
    vi.mocked(coverageForMethods).mockImplementation(() => {
      throw new Error('coverage boom')
    })

    const coverageMap = new Map()
    coverageMap.set('/tmp/proj/src/a.ts', { statements: {}, functions: {}, branches: {} })

    const result = await attachCoverage(
      [mkInfo('src/a.ts', 'foo', 1, 2)],
      { available: true, error: false, coverageMap } as never,
    )
    expect(result).toHaveLength(1)
    expect(result[0]!.coveragePercent).toBeNull()
    expect(result[0]!.coverageKind).toBeNull()
  })
})