/// <reference types="vitest" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { main } from '../../src/cli.js'

// ponytail: mock pattern mirrors cli-dispatcher.test.ts
vi.mock('../../src/execute.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/execute.js')>()
  return { ...actual, execute: vi.fn() }
})
vi.mock('../../src/git.js', () => ({
  validateGitRepo: vi.fn(),
  resolveBaseRef: vi.fn(),
  getChangedIntervals: vi.fn(),
  detectDefaultBase: vi.fn(),
}))
vi.mock('../../src/evidence.js', () => ({ buildEvidenceOutput: vi.fn() }))
vi.mock('../../src/coverage.js', () => ({ readCoverage: vi.fn() }))

import * as git from '../../src/git.js'

/**
 * 3 taxonomy: git error classes mapped to CLI exit behavior.
 * All propagate through main() try/catch → stderr + exit(1).
 */
describe('git-errors (mocked unit)', () => {
  let savedArgv: string[]
  let exitSpy: ReturnType<typeof vi.spyOn>
  let logSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    savedArgv = process.argv
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.argv = savedArgv
    vi.restoreAllMocks()
  })

  function setArgv(args: string[]) {
    process.argv = ['node', 'cli.js', ...args]
  }

  // ─── GIT_EXECUTABLE_UNAVAILABLE ──────────────────────────────────────────────
  describe('GIT_EXECUTABLE_UNAVAILABLE', () => {
    test('validateGitRepo throws "Git executable not found" → exit 1, stderr contains error', async () => {
      vi.spyOn(git, 'detectDefaultBase').mockResolvedValue('origin/main')
      vi.spyOn(git, 'validateGitRepo').mockRejectedValue(new Error('Git executable not found'))

      setArgv(['check', '--base', 'main'])
      await main()

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalledWith('Error: Git executable not found')
    })

    test('resolveBaseRef throws "Git executable not found" → exit 1, stderr contains error', async () => {
      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockRejectedValue(new Error('Git executable not found'))

      setArgv(['check', '--base', 'main'])
      await main()

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalledWith('Error: Git executable not found')
    })
  })

  // ─── NOT_A_GIT_REPOSITORY ────────────────────────────────────────────────────
  describe('NOT_A_GIT_REPOSITORY', () => {
    test('validateGitRepo throws "Not a git repository" → exit 1, stderr contains error', async () => {
      vi.spyOn(git, 'detectDefaultBase').mockResolvedValue('origin/main')
      vi.spyOn(git, 'validateGitRepo').mockRejectedValue(new Error('Not a git repository'))

      setArgv(['check', '--base', 'main'])
      await main()

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalledWith('Error: Not a git repository')
    })
  })

  // ─── GIT_COMMAND_FAILED ──────────────────────────────────────────────────────
  describe('GIT_COMMAND_FAILED', () => {
    test('resolveBaseRef throws "Cannot resolve base reference" → exit 1, stderr contains error', async () => {
      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockRejectedValue(new Error('Cannot resolve base reference: nonexistent-branch'))

      setArgv(['check', '--base', 'nonexistent-branch'])
      await main()

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalledWith('Error: Cannot resolve base reference: nonexistent-branch')
    })

    test('getChangedIntervals throws "Git diff failed" → exit 1, stderr contains error', async () => {
      vi.spyOn(git, 'validateGitRepo').mockResolvedValue(undefined)
      vi.spyOn(git, 'resolveBaseRef').mockResolvedValue('abc123')
      vi.spyOn(git, 'getChangedIntervals').mockRejectedValue(new Error('Git diff failed: fatal: bad revision'))

      setArgv(['check', '--base', 'main'])
      await main()

      expect(exitSpy).toHaveBeenCalledWith(1)
      expect(errorSpy).toHaveBeenCalledWith('Error: Git diff failed: fatal: bad revision')
    })
  })
})
