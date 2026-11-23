import { describe, expect, test } from 'vitest';
import { buildPreamble, promptApproval } from '../src/providers/prepare.js';
import type { InstallAction, InstallPlan, PrepareOptions, PromptApprovalResult } from '../src/providers/prepare.js';

/** A realistic single-language python plan exercising install-lockfile + a config pin.
 *  install-lockfile -> blast radius 'package files'; configUpdates -> 'config file'. */
function samplePlan(): InstallPlan[] {
  const action: InstallAction = {
    kind: 'install-lockfile',
    command: ['pip', 'install', 'pytest-cov'],
    packages: ['pytest-cov'],
    description: 'Install pytest-cov via pip',
  };
  return [
    {
      language: 'python',
      actions: [action],
      configUpdates: {
        'checkchange.providers.json': {
          version: 1,
          providers: [
            {
              language: 'python',
              testRunners: [{ name: 'pytest', install: { packages: ['pytest-cov'] } }],
            },
          ],
        },
      },
    },
  ];
}

describe('promptApproval', () => {
  test('dryRun: no prompt, approved=false', async () => {
    const plan = samplePlan();
    const options: PrepareOptions = {
      cwd: process.cwd(),
      dryRun: true,
      json: false,
      yes: false,
    };

    const result = await promptApproval(plan, options);

    // dryRun short-circuits before any TTY/prompt logic (prepare.ts L314-L316).
    expect(result.approved).toBe(false);
    expect(result.refused).toBeUndefined();
    // preamble is still produced for display, even though unapproved.
    expect(result.preamble).toContain('python');
  });

  test('yes: approved=true', async () => {
    const plan = samplePlan();
    const options: PrepareOptions = {
      cwd: process.cwd(),
      dryRun: false,
      json: false,
      yes: true,
    };

    const result = await promptApproval(plan, options);

    // yes auto-approves, checked before TTY (prepare.ts L318-L320).
    expect(result.approved).toBe(true);
    expect(result.refused).toBeUndefined();
    expect(result.preamble).toContain('python');
  });

  test('dryRun+yes: dryRun wins', async () => {
    const plan = samplePlan();
    // dryRun is evaluated first in promptApproval, so yes must be ignored.
    const options: PrepareOptions = {
      cwd: process.cwd(),
      dryRun: true,
      json: false,
      yes: true,
    };

    const result = await promptApproval(plan, options);

    expect(result.approved).toBe(false);
  });
});

describe('buildPreamble', () => {
  test('contains language, an action, and blast radius', () => {
    const preamble = buildPreamble(samplePlan());

    // language name appears in the header line.
    expect(preamble).toContain('python');
    // action description appears as a bulleted line item.
    expect(preamble).toContain('Install pytest-cov via pip');
    // install-lockfile action + config pin produce a blast-radius line.
    expect(preamble).toContain('Blast radius');
  });

  test('empty plan preamble mentions no changes', () => {
    const preamble = buildPreamble([]);

    expect(preamble).toBe('No changes — all test runners already available.');
  });
});
