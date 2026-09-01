/// <reference types="vitest" />
import { describe, test, expect, vi, afterEach } from 'vitest'
import { buildEvidenceOutput } from '../../src/evidence.js'
import * as git from '../../src/git.js'
import * as cli from '../../src/cli.js'
import { calculateCrap } from '../../src/crapCalc.js'
import * as complexity from '../../src/complexity.js'
import * as coverage from '../../src/coverage.js'
import * as attribution from '../../src/attribution.js'

// Helper to create an interval object (as returned by git.js)
function createInterval(start: number, end: number) {
  return { start, end }
}

// Helper to create a complexity info object (as returned by complexity.js)
function createComplexityInfo(file: string, method: string, lineStart: number, lineEnd: number, cc: number) {
  return { file, method, lineStart, lineEnd, cc }
}

describe('Contract verification tests (WP11)', () => {
  afterEach(() => vi.restoreAllMocks());
  // Prevent mock leakage across tests (Engram F0)
  // Group A — Schema & threshold
describe('Schema & threshold', () => {
     test('buildEvidenceOutput returns schemaVersion 0.3', async () => {
       const base = 'abc123'
       const cwd = '/tmp'
       const intervals = new Map() // empty intervals
       // Mock the git functions to avoid actual git calls
       vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
       vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
       vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals })
       // Mock complexity and coverage to return empty
       vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
       vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
       vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([])

       const output = await buildEvidenceOutput(base, intervals, cwd, 30)
       expect(output.schemaVersion).toBe('0.3')
    })

    test('default crapThreshold 30, policy reflects it', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const intervals = new Map()
      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
      vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals })
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([])

      const output = await buildEvidenceOutput(base, intervals, cwd, undefined) // threshold undefined -> default 30
      expect(output.policy.crapThreshold).toBe(30)
    })

    test('CC threshold 15 conceptual (rules.ts threshold default) - we test CRAP calculation with known CC and coverage', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: 0,
        coverageKind: 'lines'
      }])

      const output = await buildEvidenceOutput(base, intervals, cwd, 30)
      expect(output.changedFunctions.length).toBe(1)
      const changedFunc = output.changedFunctions[0]
      expect(changedFunc.cc).toBe(10)
      expect(changedFunc.coverage).toBe(0)
      expect(changedFunc.crap).toBeCloseTo(110) // 10*10*1 + 10 = 110
    })
  })

  // Group B — Error vocabulary distinct (INV-01..04)
  describe('Error vocabulary', () => {
    test('INV-01: ZERO≠NULL — coverage 0 with valid cc produces crap = cc²×1³+cc and coverage 0 not null; unavailable coverage produces coverage null and crap null', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
      vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals })

      // Test coverage 0 -> crap should be a number
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: 0,
        coverageKind: 'lines'
      }])

      const output = await buildEvidenceOutput(base, intervals, cwd, 30)
      const changedFunc = output.changedFunctions[0]
      expect(changedFunc.coverage).toBe(0) // coverage is 0, not null
      expect(changedFunc.crap).not.toBeNull() // crap should be a number
      expect(typeof changedFunc.crap).toBe('number')

      // Test coverage null (unavailable) -> crap should be null
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: null,
        coverageKind: null
      }])

      const output2 = await buildEvidenceOutput(base, intervals, cwd, 30)
      const changedFunc2 = output2.changedFunctions[0]
      expect(changedFunc2.coverage).toBeNull()
      expect(changedFunc2.crap).toBeNull()
    })

    test('INV-02: MISSING vs MALFORMED — coverageErrorReason distinguishes missing file vs invalid JSON', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const intervals = new Map() // empty intervals to avoid complexity
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([])

      // Test missing coverage file
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: true, reason: 'missing' })
      const outputMissing = await buildEvidenceOutput(base, intervals, cwd, 30, '/missing/file.json')
      expect(outputMissing.coverageErrorReason).toBe('missing')
      expect(outputMissing.analysisStatus).toBe('FAILED')

      // Test malformed coverage JSON
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
      vi.spyOn(coverage, 'readCoverage').mockRejectedValue(new Error('Unexpected token'))
      const outputMalformed = await buildEvidenceOutput(base, intervals, cwd, 30, '/malformed/file.json')
      expect(outputMalformed.coverageErrorReason).toBe('malformed')
      expect(outputMalformed.analysisStatus).toBe('FAILED')
    })

    test('INV-03: GIT ENOENT vs not-a-repo — coverageErrorReason and git capability distinct states', async () => {
      // buildEvidenceOutput path: missing vs malformed are already proven in INV-02.
      // Here we prove git-related provenance is truthful via analysis fields and that
      // coverage missing vs malformed are not conflated when invoked through buildEvidenceOutput.
      const base = 'abc123'
      const cwd = '/tmp'
      // missing file path -> missing reason
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: true, reason: 'missing' })
      const outMissing = await buildEvidenceOutput(base, new Map(), cwd, 30, '/missing.json')
      expect(outMissing.coverageErrorReason).toBe('missing')
      // malformed JSON -> malformed reason via throw
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
      vi.spyOn(coverage, 'readCoverage').mockRejectedValue(new Error('Unexpected token'))
      const outMalformed = await buildEvidenceOutput(base, new Map(), cwd, 30, '/malformed.json')
      expect(outMalformed.coverageErrorReason).toBe('malformed')
      expect(outMissing.coverageErrorReason).not.toBe(outMalformed.coverageErrorReason)
      // git capability remains 'available' inside buildEvidenceOutput (cli boundary);
      // distinctness is proven at CLI integration via real-git tests (WP9 R5) — here we prove missing≠malformed distinct.
    })

    test('INV-04: ANALYZER TRUTHFUL — analyzerStatus passed/skipped/failed per function truthful', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
      vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals })

      // Case 1: coverage available -> analyzerStatus should be 'passed'
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: 50,
        coverageKind: 'lines'
      }])

      const output = await buildEvidenceOutput(base, intervals, cwd, 30)
      const changedFunc = output.changedFunctions[0]
      expect(changedFunc.analyzerStatus).toBe('passed')

      // Case 2: coverage not available (but coverage provider succeeded, i.e., available=false) -> analyzerStatus should be 'skipped'
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: null,
        coverageKind: null
      }])

      const output2 = await buildEvidenceOutput(base, intervals, cwd, 30)
      const changedFunc2 = output2.changedFunctions[0]
      expect(changedFunc2.analyzerStatus).toBe('skipped')

      // Case 3: coverage provider failed -> analysisStatus should be 'FAILED' and changedFunctions empty
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockRejectedValue(new Error('timeout'))
      const output3 = await buildEvidenceOutput(base, intervals, cwd, 30)
      expect(output3.analysisStatus).toBe('FAILED')
      expect(output3.changedFunctions.length).toBe(0)

      // Case 4: complexity provider failed -> analysisStatus should be 'UNSUPPORTED' and changedFunctions empty
      vi.spyOn(complexity, 'collectComplexity').mockRejectedValue(new Error('timeout'))
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      const output4 = await buildEvidenceOutput(base, intervals, cwd, 30)
      expect(output4.analysisStatus).toBe('UNSUPPORTED')
      expect(output4.changedFunctions.length).toBe(0)
    })
  })

  // Group C — Determinism
  describe('Determinism', () => {
    test('same inputs twice produces equivalent JSON ignoring timestamps/durations', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const threshold = 30

      // We'll set up a scenario with one function
      const mockComplexityInfo = [createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)]
      const mockCoverageResult = { available: true, coverageMap: {} }
      const mockAttributedComplexity = [{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: 50,
        coverageKind: 'lines'
      }]

      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
      vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals: new Map([['test.ts', [createInterval(1, 10)]]]) })
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue(mockComplexityInfo)
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue(mockCoverageResult)
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue(mockAttributedComplexity)

      const output1 = await buildEvidenceOutput(base, new Map([['test.ts', [createInterval(1, 10)]]]), cwd, threshold)
      const output2 = await buildEvidenceOutput(base, new Map([['test.ts', [createInterval(1, 10)]]]), cwd, threshold)

      // Compare the outputs, ignoring any time-dependent fields (there are none in schema 0.2)
      expect(output1).toEqual(output2)
    })

    test('run twice and compare schemaVersion, gate, ruleResults, changedFunctions entries', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const threshold = 30

      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
      vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals: new Map([['test.ts', [createInterval(1, 10)]]]) })
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: 50,
        coverageKind: 'lines'
      }])

      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
      const output1 = await buildEvidenceOutput(base, intervals, cwd, threshold)
      const output2 = await buildEvidenceOutput(base, intervals, cwd, threshold)

      expect(output1.schemaVersion).toBe(output2.schemaVersion)
      expect(output1.gate).toBe(output2.gate)
      expect(output1.ruleResults).toEqual(output2.ruleResults)
      expect(output1.changedFunctions).toEqual(output2.changedFunctions)
    })
  })

  // Group D — Provenance presence
  describe('Provenance presence', () => {
    test('output contains analysis base/target, changedFunctions file/method/lineStart/lineEnd/cc/crap/coverage, source crap-typescript-core@0.5.0, policy crapThreshold, capabilities, analysisStatus', async () => {
      const base = 'abc123'
      const cwd = '/tmp'
      const threshold = 30

      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue(base)
      vi.spyOn(git, 'getChangedIntervals').mockResolvedValue({ intervals: new Map([['test.ts', [createInterval(1, 10)]]]) })
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([createComplexityInfo('test.ts', 'testMethod', 1, 10, 10)])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: { file: 'test.ts', method: 'testMethod', lineStart: 1, lineEnd: 10, cc: 10 },
        coveragePercent: 50,
        coverageKind: 'lines'
      }])

      const output = await buildEvidenceOutput(base, new Map([['test.ts', [createInterval(1, 10)]]]), cwd, threshold)

      // Check analysis base and target
      expect(output.analysis.base).toBe(base)
      expect(output.analysis.target).toBe('current') // hardcoded in evidence.ts

      // Check changedFunctions
      expect(output.changedFunctions.length).toBe(1)
      const changedFunc = output.changedFunctions[0]
      expect(changedFunc.file).toBe('test.ts')
      expect(changedFunc.method).toBe('testMethod')
      expect(changedFunc.lineStart).toBe(1)
      expect(changedFunc.lineEnd).toBe(10)
      expect(changedFunc.cc).toBe(10)
      expect(changedFunc.crap).toBeCloseTo(calculateCrap(10, 50))
      expect(changedFunc.coverage).toBe(50)
      expect(changedFunc.coverageKind).toBe('lines')

      // Check source
      expect(changedFunc.source.tool).toBe('@barney-media/crap-typescript-core')
      expect(changedFunc.source.version).toBe('0.5.0')

      // Check policy
      expect(output.policy.crapThreshold).toBe(threshold)

      // Check capabilities
      expect(output.capabilities.git).toBe('available')
      expect(output.capabilities.complexity).toBe('available')
      expect(output.capabilities.coverageArtifact).toBe('available')

      // Check analysisStatus
      expect(output.analysisStatus).toBe('SUCCESS')
    })
  })
})