/// <reference types="vitest" />
import { describe, test, expect, vi, afterEach } from 'vitest'
import { buildEvidenceOutput } from '../../src/evidence.js'
import * as git from '../../src/git.js'
import * as complexity from '../../src/complexity.js'
import * as coverage from '../../src/coverage.js'
import * as attribution from '../../src/attribution.js'

// ponytail: helpers mirror test/contract/wp11.contract.spec.ts patterns
function createInterval(start: number, end: number) {
  return { start, end }
}

function createComplexityInfo(file: string, method: string, lineStart: number, lineEnd: number, cc: number) {
  return { file, method, lineStart, lineEnd, cc }
}

/**
 * 5×2 matrix: each coverage semantic (zero/null/missing/malformed/unavailable)
 * tested through two lenses:
 *   1. Pipeline data flow — what values propagate to changedFunctions
 *   2. Gate/status outcome — what ruleResults, gate, completeness, analysisStatus produce
 *
 * Plus critical combined test: 0+highCC→WARN vs null→NOT_EVALUATED in same file.
 */
describe('zero-null-missing-malformed-unavailable (mocked unit)', () => {
  afterEach(() => vi.restoreAllMocks())

  const base = 'abc123'
  const cwd = '/tmp'
  const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
  const fn1 = createComplexityInfo('test.ts', 'fn1', 1, 10, 10)

  // ─── ZERO ────────────────────────────────────────────────────────────────────
  describe('ZERO: coverage=0, available=true', () => {
    test('pipeline: coverage 0 propagates as numeric 0, crap computed, analyzerStatus passed', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: 0,
        coverageKind: 'lines'
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      const fn = out.changedFunctions[0]
      expect(fn.coverage).toBe(0) // 0, not null — INV-01
      expect(typeof fn.coverage).toBe('number')
      expect(fn.crap).toBeCloseTo(110) // 10²×1³+10 = 110
      expect(typeof fn.crap).toBe('number')
      expect(fn.analyzerStatus).toBe('passed')
    })

    test('gate: coverage 0 + high CC → crap > threshold → WARN, completeness COMPLETE', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: 0,
        coverageKind: 'lines'
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe('WARN')
      expect(out.completeness).toBe('COMPLETE')
      expect(out.ruleResults).toHaveLength(1)
      expect(out.ruleResults[0].result).toBe('WARN')
      expect(out.ruleResults[0].crap).toBeCloseTo(110)
      expect(out.ruleResults[0].coverage).toBe(0)
    })
  })

  // ─── NULL ────────────────────────────────────────────────────────────────────
  describe('NULL: coverage explicitly null (available=false, error=false)', () => {
    test('pipeline: coverage null → crap null, analyzerStatus skipped', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      const fn = out.changedFunctions[0]
      expect(fn.coverage).toBeNull()
      expect(fn.crap).toBeNull() // null → no CRAP calc
      expect(fn.analyzerStatus).toBe('skipped')
    })

    test('gate: crap null → NOT_EVALUATED, gate PASS, completeness INCOMPLETE', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe('PASS') // no WARN exists
      expect(out.completeness).toBe('INCOMPLETE') // NOT_EVALUATED present
      expect(out.ruleResults).toHaveLength(1)
      expect(out.ruleResults[0].result).toBe('NOT_EVALUATED')
      expect(out.ruleResults[0].crap).toBeNull()
    })
  })

  // ─── MISSING ─────────────────────────────────────────────────────────────────
  describe('MISSING: coverage file path provided but does not exist', () => {
    test('pipeline: readCoverage returns error+reason missing → coverageErrorReason=missing, analysisStatus FAILED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({
        available: false, coverageMap: null, error: true, reason: 'missing'
      })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30, '/nonexistent/coverage.json')

      expect(out.analysisStatus).toBe('FAILED')
      expect(out.coverageErrorReason).toBe('missing')
      expect(out.capabilities.coverageArtifact).toBe('failed')
    })

    test('gate: FAILED → gate null, completeness INCOMPLETE, changedFunctions empty', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({
        available: false, coverageMap: null, error: true, reason: 'missing'
      })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30, '/nonexistent/coverage.json')

      expect(out.gate).toBeNull()
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.changedFunctions).toHaveLength(0)
      expect(out.ruleResults).toHaveLength(0)
    })
  })

  // ─── MALFORMED ───────────────────────────────────────────────────────────────
  describe('MALFORMED: coverage file contains invalid JSON', () => {
    test('pipeline: readCoverage throws → coverageErrorReason=malformed, analysisStatus FAILED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockRejectedValue(new Error('Unexpected token in JSON'))

      const out = await buildEvidenceOutput(base, intervals, cwd, 30, '/bad/coverage.json')

      expect(out.analysisStatus).toBe('FAILED')
      expect(out.coverageErrorReason).toBe('malformed')
      expect(out.capabilities.coverageArtifact).toBe('failed')
    })

    test('gate: FAILED → gate null, completeness INCOMPLETE, changedFunctions empty', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockRejectedValue(new Error('Unexpected token'))

      const out = await buildEvidenceOutput(base, intervals, cwd, 30, '/bad/coverage.json')

      expect(out.gate).toBeNull()
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.changedFunctions).toHaveLength(0)
    })
  })

  // ─── UNAVAILABLE ─────────────────────────────────────────────────────────────
  describe('UNAVAILABLE: no coverage file provided, tool absent', () => {
    test('pipeline: available=false, error=false → coverage null, crap null, analyzerStatus skipped', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])

      // No coverageFile argument — tool simply not configured
      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      expect(out.capabilities.coverageArtifact).toBe('absent')
      const fn = out.changedFunctions[0]
      expect(fn.coverage).toBeNull()
      expect(fn.crap).toBeNull()
      expect(fn.analyzerStatus).toBe('skipped')
    })

    test('gate: absent coverage → NOT_EVALUATED, completeness INCOMPLETE', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe('PASS')
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.ruleResults[0].result).toBe('NOT_EVALUATED')
    })
  })

  // ─── CRITICAL: same-file contrast ────────────────────────────────────────────
  describe('same file: 0+highCC→WARN vs null→NOT_EVALUATED', () => {
    test('two functions in same file: fn_zero (coverage=0, cc=10) → WARN; fn_null (coverage=null, cc=10) → NOT_EVALUATED; gate=WARN, completeness=INCOMPLETE', async () => {
      const fnZero = createComplexityInfo('test.ts', 'fn_zero', 1, 10, 10)
      const fnNull = createComplexityInfo('test.ts', 'fn_null', 11, 20, 10)
      const bothIntervals = new Map([['test.ts', [createInterval(1, 10), createInterval(11, 20)]]])

      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fnZero, fnNull])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([
        { info: fnZero, coveragePercent: 0, coverageKind: 'lines' },
        { info: fnNull, coveragePercent: null, coverageKind: null }
      ])

      const out = await buildEvidenceOutput(base, bothIntervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      expect(out.changedFunctions).toHaveLength(2)

      // fn_zero: coverage=0 → crap=110 → WARN
      const rZero = out.ruleResults.find(r => r.method === 'fn_zero')!
      expect(rZero.coverage).toBe(0)
      expect(rZero.crap).toBeCloseTo(110)
      expect(rZero.result).toBe('WARN')

      // fn_null: coverage=null → crap=null → NOT_EVALUATED
      const rNull = out.ruleResults.find(r => r.method === 'fn_null')!
      expect(rNull.coverage).toBeNull()
      expect(rNull.crap).toBeNull()
      expect(rNull.result).toBe('NOT_EVALUATED')

      // Aggregate: any WARN → gate=WARN; any NOT_EVALUATED → completeness=INCOMPLETE
      expect(out.gate).toBe('WARN')
      expect(out.completeness).toBe('INCOMPLETE')
    })
  })

  // ─── DISTINCTNESS: verify semantics never conflate ───────────────────────────
  describe('semantic distinctness', () => {
    test('MISSING ≠ MALFORMED: different coverageErrorReason values', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])

      // MISSING
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({
        available: false, coverageMap: null, error: true, reason: 'missing'
      })
      const outMissing = await buildEvidenceOutput(base, new Map(), cwd, 30, '/missing.json')

      // MALFORMED
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([])
      vi.spyOn(coverage, 'readCoverage').mockRejectedValue(new Error('bad JSON'))
      const outMalformed = await buildEvidenceOutput(base, new Map(), cwd, 30, '/malformed.json')

      expect(outMissing.coverageErrorReason).toBe('missing')
      expect(outMalformed.coverageErrorReason).toBe('malformed')
      expect(outMissing.coverageErrorReason).not.toBe(outMalformed.coverageErrorReason)
    })

    test('ZERO ≠ NULL: coverage 0 is numeric, coverage null is null', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])

      // ZERO
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: {} })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1, coveragePercent: 0, coverageKind: 'lines'
      }])
      const outZero = await buildEvidenceOutput(base, intervals, cwd, 30)

      // NULL
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1, coveragePercent: null, coverageKind: null
      }])
      const outNull = await buildEvidenceOutput(base, intervals, cwd, 30)

      const fnZero = outZero.changedFunctions[0]
      const fnNull = outNull.changedFunctions[0]

      expect(fnZero.coverage).toBe(0)
      expect(typeof fnZero.coverage).toBe('number')
      expect(fnZero.crap).not.toBeNull()

      expect(fnNull.coverage).toBeNull()
      expect(fnNull.crap).toBeNull()
    })
  })
})
