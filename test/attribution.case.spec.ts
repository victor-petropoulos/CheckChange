import { describe, expect, test, vi, afterEach } from 'vitest';
import { attachCoverage } from '../src/attribution'
import { parseFileMethods, coverageForMethods, type MethodDescriptor } from '@barney-media/crap-typescript-core'

vi.mock('@barney-media/crap-typescript-core')

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
})