/**
 * prepare-repo orchestrator (Tasks 2-7 of prepare-repo spec).
 *
 * 5-phase lifecycle: detect → plan → approve → install → verify.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { deriveRegistry, loadProviderConfig } from './config.js';
import type { ProviderConfig, ResolvedProvider, TestRunner } from './config.js';
import { resolveRunner, type ResolvedRunner } from './runner-detection.js';
import { createInterface } from 'node:readline';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

/** Options shared across prepare phases. */
export interface PrepareOptions {
  cwd: string;
  dryRun: boolean;
  json: boolean;
  yes: boolean;
}

/**
 * Phase 1 result: detected languages, resolved runners per language,
 * and lockfiles found per language (spec lines 58-62).
 */
export interface DetectedStack {
  languages: string[];
  runners: Map<string, ResolvedRunner>;
  lockfiles: Map<string, string | null>;
}

/** An ordered action a single install phase can execute. */
export type InstallActionKind = 'install' | 'create-venv' | 'install-lockfile' | 'verify-tool';

export interface InstallAction {
  kind: InstallActionKind;
  command?: string[];
  packages?: string[];
  description: string;
}

/**
 * Phase 2 result: per-language plan with ordered actions and
 * config file updates to flush (spec lines 63-71).
 */
export interface InstallPlan {
  language: string;
  actions: InstallAction[];
  configUpdates: Record<string, unknown>;
}

/** Per-language verification status after install. */
export type PrepareStatus = 'installed' | 'missing' | 'unfixable';

export interface PrepareReport {
  languages: string[];
  status: Map<string, PrepareStatus>;
  artifacts: Map<string, string[]>;
  exitHint: string;
  resumeHint: string;
}

/** Result of the approval phase (Task 5). */
export interface PromptApprovalResult {
  approved: boolean;
  preamble: string;
  /** Set when non-interactive without --yes or --dry-run. */
  refused?: boolean;
}

// ---- Phase 1: detect ----

/** Lockfile search order per language (first match wins). */
const LOCKFILES_BY_LANGUAGE: Record<string, string[]> = {
  javascript: ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'package.json'],
  typescript: ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'package.json'],
  python: ['pyproject.toml', 'pytest.ini', 'setup.cfg', 'requirements.txt'],
};

function detectLockfile(cwd: string, language: string): string | null {
  const candidates = LOCKFILES_BY_LANGUAGE[language];
  if (!candidates) return null;
  for (const file of candidates) {
    if (fs.existsSync(path.join(cwd, file))) return file;
  }
  return null;
}

/**
 * Detect available test runners and lockfiles for the repo at cwd.
 * Reuses resolveRunner from runner-detection.ts.
 */
export function detectStack(
  cwd: string,
  registry: Map<string, ResolvedProvider>,
): DetectedStack {
  const runners = resolveRunner(cwd, registry);
  const languages = Array.from(runners.keys());
  const lockfiles = new Map<string, string | null>();
  for (const language of languages) {
    lockfiles.set(language, detectLockfile(cwd, language));
  }
  return { languages, runners, lockfiles };
}

// ---- Phase 2: plan ----

/** Match a resolved runner's command back to its source TestRunner + provider in the registry. */
function findProviderAndRunner(
  registry: Map<string, ResolvedProvider>,
  language: string,
  command: string[],
): { provider: ResolvedProvider; runner: TestRunner } | null {
  const seen = new Set<ResolvedProvider>();
  for (const provider of registry.values()) {
    if (seen.has(provider)) continue;
    seen.add(provider);
    if (provider.language !== language) continue;
    if (!provider.testRunners) continue;
    for (const runner of provider.testRunners) {
      if (JSON.stringify(runner.command) === JSON.stringify(command)) {
        return { provider, runner };
      }
    }
  }
  return null;
}

/** Derive package-manager install command from lockfile precedence (pnpm > yarn > npm; python pip). */
function packageManagerCommand(lockfile: string | null, language: string): string[] | null {
  if (language === 'javascript' || language === 'typescript') {
    if (lockfile === 'pnpm-lock.yaml') return ['pnpm', 'add', '-D'];
    if (lockfile === 'yarn.lock') return ['yarn', 'add', '-D'];
    return ['npm', 'install', '-D'];
  }
  if (language === 'python') return ['pip', 'install'];
  return null;
}

/** Derive a --version probe from the runner's command. */
function verifyCommand(runnerCommand: string[]): string[] {
  const [first, second, third] = runnerCommand;
  if (first === 'npx' && second) {
    return ['npx', '--no-install', second, '--version'];
  }
  if (first === 'python3' && second === '-m' && third) {
    return ['python3', '-m', third, '--version'];
  }
  return [...runnerCommand, '--version'];
}

/**
 * Build an install plan per detected language by consulting the TestRunner
 * registry install field (single-source-of-truth, spec D1).
 */
export function createInstallPlan(
  stack: DetectedStack,
  registry: Map<string, ResolvedProvider>,
  config: ProviderConfig,
): InstallPlan[] {
  const plans: InstallPlan[] = [];
  // ponytail: cwd not carried in DetectedStack interface; use process.cwd() for .venv probe
  const cwd = process.cwd();

  for (const lang of stack.languages) {
    const runner = stack.runners.get(lang);
    if (!runner) continue;

    const found = findProviderAndRunner(registry, lang, runner.command);
    const testRunner = found?.runner ?? null;
    const provider = found?.provider ?? null;
    const lockfile = stack.lockfiles.get(lang) ?? null;
    const packages = testRunner?.install?.packages ?? [];

    const actions: InstallAction[] = [];

    // create-venv: python when no .venv exists (must precede install-lockfile
    // so executeInstallPlan can rewrite pip → venv python at spawn time)
    if (lang === 'python') {
      const venvPath = path.join(cwd, '.venv');
      if (!fs.existsSync(venvPath)) {
        actions.push({
          kind: 'create-venv',
          command: ['python3', '-m', 'venv', '.venv'],
          description: 'Create Python virtual environment at .venv',
        });
      }
    }

    // install-lockfile: install packages via lockfile-precedence package manager
    if (packages.length > 0) {
      const pmCmd = packageManagerCommand(lockfile, lang);
      if (pmCmd) {
        actions.push({
          kind: 'install-lockfile',
          command: [...pmCmd, ...packages],
          packages,
          description: `Install ${packages.join(', ')} via ${pmCmd[0]}`,
        });
      }
    }

    // verify-tool: probe tool availability
    actions.push({
      kind: 'verify-tool',
      command: verifyCommand(runner.command),
      description: `Verify ${testRunner?.name ?? runner.command.join(' ')} is installed`,
    });

    // configUpdates: pin install packages in checkchange.providers.json when source is builtin
    const configUpdates: Record<string, unknown> = {};
    if (packages.length > 0 && testRunner && provider?.source === 'builtin') {
      configUpdates['checkchange.providers.json'] = {
        version: config.version,
        providers: [
          {
            language: lang,
            testRunners: [
              {
                name: testRunner.name,
                install: { packages },
              },
            ],
          },
        ],
      };
    }

    plans.push({ language: lang, actions, configUpdates });
  }

  return plans;
}

// ---- Phase 3: approve ----

/**
 * Build a human-readable plain-English summary of an install plan.
 * Describes what each language will do, why, and the blast radius.
 * Used by promptApproval and agent callers.
 */
export function buildPreamble(plan: InstallPlan[]): string {
  if (plan.length === 0) {
    return 'No changes — all test runners already available.';
  }

  const lines: string[] = [];
  lines.push(
    `checkchange prepare — ${plan.length} language(s): ` +
      `${plan.map((p) => p.language).join(', ')}`,
  );

  for (const p of plan) {
    lines.push('', `${p.language}:`);
    for (const a of p.actions) {
      lines.push(`  - ${a.description}`);
      if (a.command) {
        lines.push(`    command: ${a.command.join(' ')}`);
      }
    }
    const configKeys = Object.keys(p.configUpdates);
    if (configKeys.length > 0) {
      lines.push(`  config pins: ${configKeys.join(', ')}`);
    }
  }

  // Blast radius
  const blasts = new Set<string>();
  for (const p of plan) {
    for (const a of p.actions) {
      if (a.kind === 'install-lockfile') blasts.add('package files (package.json + lockfile)');
      if (a.kind === 'create-venv') blasts.add('.venv directory');
    }
    if (Object.keys(p.configUpdates).length > 0) {
      blasts.add(`config file: ${Object.keys(p.configUpdates).join(', ')}`);
    }
  }
  if (blasts.size > 0) {
    lines.push('', `Blast radius: ${[...blasts].join(', ')}`);
  }

  return lines.join('\n');
}

/** Prompt the user with a yes/no question via node:readline. */
function askProceed(query: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Present plan for approval or auto-decide based on flags.
 * - dryRun: return preamble, no prompt, approved=false (exit-0 semantics)
 * - yes: auto-approve
 * - TTY: print preamble, prompt 'Proceed? [y/N]'
 * - non-TTY no flags: refused=true
 */
export async function promptApproval(
  plan: InstallPlan[],
  options: PrepareOptions,
): Promise<PromptApprovalResult> {
  const preamble = buildPreamble(plan);

  if (options.dryRun) {
    return { approved: false, preamble };
  }

  if (options.yes) {
    return { approved: true, preamble };
  }

  if (process.stdin.isTTY) {
    process.stdout.write(preamble + '\n');
    const answer = await askProceed('Proceed? [y/N] ');
    const approved = /^y(es)?$/i.test(answer.trim());
    return { approved, preamble };
  }

  return { approved: false, preamble, refused: true };
}

// ---- Phase 4: install ----

/** Install action kinds the install phase may execute (Task 6 trimmed allowlist).
 * Maps to createInstallPlan kinds: install-lockfile (npm/pnpm/yarn/pip) + create-venv
 * (== venv-create). verify-tool is a probe, not an install action. */
const INSTALL_ALLOWLIST: ReadonlySet<InstallActionKind> = new Set<InstallActionKind>([
  'install-lockfile',
  'create-venv',
]);

const INSTALL_TIMEOUT_MS = 60_000;
const execFileAsync = promisify(execFile);

/** Per-action outcome of the install phase. */
export interface InstallActionResult {
  kind: InstallActionKind;
  status: 'installed' | 'skipped' | 'failed';
  detail: string;
}

/** Aggregate result of executing an install plan. */
export interface ExecuteResult {
  actions: InstallActionResult[];
  ok: boolean;
}

/** Rewrite a bare `pip install` command to run through the venv interpreter when a
 * `.venv` exists, else `python3 -m pip`. Never uses --user (plain pip per lockfile). */
function resolvePipCommand(command: string[], cwd: string): string[] {
  const packages = command.slice(2); // drop ['pip', 'install']
  const venvPython = path.join(cwd, '.venv', 'bin', 'python');
  if (fs.existsSync(venvPython)) {
    return [venvPython, '-m', 'pip', 'install', ...packages];
  }
  return ['python3', '-m', 'pip', 'install', ...packages];
}

/**
 * Execute allowlisted install actions per plan. 60s timeout per action, no shell
 * (execFile directly). Actions outside the install allowlist (e.g. verify-tool probes)
 * are skipped. Commands containing sudo are rejected.
 */
export async function executeInstallPlan(
  plan: InstallPlan[],
  options: PrepareOptions,
): Promise<ExecuteResult> {
  const cwd = options.cwd;
  const actions: InstallActionResult[] = [];

  for (const entry of plan) {
    for (const action of entry.actions) {
      if (!INSTALL_ALLOWLIST.has(action.kind)) {
        actions.push({ kind: action.kind, status: 'skipped', detail: 'not in install allowlist' });
        continue;
      }

      const command = action.command;
      if (!command || command.length === 0) {
        actions.push({ kind: action.kind, status: 'skipped', detail: 'no command' });
        continue;
      }

      let resolved = command;
      // pip installs route through the venv interpreter when present, else python3 -m pip
      if (action.kind === 'install-lockfile' && command[0] === 'pip') {
        resolved = resolvePipCommand(command, cwd);
      }

      if (resolved.includes('sudo')) {
        actions.push({ kind: action.kind, status: 'failed', detail: 'rejected: command contains sudo' });
        continue;
      }

      const [cmd, ...args] = resolved;
      if (!cmd) {
        actions.push({ kind: action.kind, status: 'skipped', detail: 'no command' });
        continue;
      }

      try {
        await execFileAsync(cmd, args, { cwd, timeout: INSTALL_TIMEOUT_MS, maxBuffer: 10_000_000 });
        actions.push({ kind: action.kind, status: 'installed', detail: `${cmd} ${args.join(' ')}` });
      } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException & { killed?: boolean };
        const detail = err.killed ? 'timed out after 60s' : err.message ?? 'failed';
        actions.push({ kind: action.kind, status: 'failed', detail });
      }
    }
  }

  return {
    actions,
    ok: !actions.some((r) => r.status === 'failed'),
  };
}

/** Minimal shape of a config pin: version + providers (language → testRunner name → install). */
interface ConfigPin {
  version?: number;
  providers?: Array<{
    language: string;
    testRunners?: Array<{ name: string; install?: { packages: string[] } }>;
  }>;
}

/**
 * Flush config pins (provider install specs) to disk after a successful install.
 * Reads the existing config file (JSON.parse if present, else empty {}), merges
 * pin provider entries by language → testRunner name (updating `install` on match,
 * appending otherwise), and writes atomically via tmp file + rename.
 * Returns the config-file keys that were written.
 */
export function flushConfigUpdates(plan: InstallPlan[], cwd: string): string[] {
  const written = new Set<string>();
  for (const entry of plan) {
    for (const [configKey, pin] of Object.entries(entry.configUpdates)) {
      if (!pin) continue;
      const pinConfig = pin as ConfigPin;
      const pinProviders = pinConfig.providers;
      if (!pinProviders?.length) continue;
      const configPath = path.resolve(cwd, configKey);
      let existing: ConfigPin;
      try {
        existing = JSON.parse(fs.readFileSync(configPath, 'utf8')) as ConfigPin;
      } catch {
        existing = {};
      }
      if (!Array.isArray(existing.providers)) existing.providers = [];
      if (existing.version === undefined) existing.version = pinConfig.version ?? 1;
      const existingProviders = existing.providers!;
      for (const pinProvider of pinProviders) {
        const match = existingProviders.find((p) => p.language === pinProvider.language);
        if (match) {
          const runners = match.testRunners ??= [];
          for (const pinRunner of pinProvider.testRunners ?? []) {
            const rm = runners.find((r) => r.name === pinRunner.name);
            if (rm) {
              if (pinRunner.install) rm.install = pinRunner.install;
            } else {
              runners.push(pinRunner);
            }
          }
        } else {
          existingProviders.push(pinProvider);
        }
      }
      const tmpPath = `${configPath}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(existing, null, 2));
      fs.renameSync(tmpPath, configPath);
      written.add(configKey);
    }
  }
  return [...written];
}

// ---- Phase 5: verify ----

/** Per self-analyzer probe result. */
export interface VerifyAnalyzer {
  name: string;
  status: 'ok' | 'unfixable';
  detail: string;
}

/** Phase 5 report: re-detected stack + analyzer self-probes + aggregate ok. */
export interface VerifyReport {
  reDetected: DetectedStack;
  analyzers: VerifyAnalyzer[];
  ok: boolean;
}

/** Resolve the Python interpreter venv-aware:
 *  `.venv/bin/python` > $VIRTUAL_ENV/bin/python > `python3`. */
function resolvePython(cwd: string): [string, ...string[]] {
  const venvLocal = path.join(cwd, '.venv', 'bin', 'python');
  if (fs.existsSync(venvLocal)) return [venvLocal];
  const venvEnv = process.env.VIRTUAL_ENV;
  if (venvEnv) return [path.join(venvEnv, 'bin', 'python')];
  return ['python3'];
}

/**
 * Re-detect stack and run resolveRunner-independent self-analyzer probes:
 *  (a) Node import probe: `@barney-media/crap-typescript-core` resolvable
 *  (b) CLI version probe: `npx --no-install crap-typescript --version` exit 0
 *  (c) Python stdlib probe: venv-aware `python -c "import ast"`
 * Returns re-detected stack, per-probe status, and aggregate `ok`.
 */
export async function verifyInstall(
  stack: DetectedStack,
  options: PrepareOptions,
): Promise<VerifyReport> {
  const cwd = options.cwd;
  // Phase 5 re-runs detection (spec §1 Phase 5); re-derive registry from config.
  const { config, source } = loadProviderConfig(cwd);
  const registry = deriveRegistry(config, source);
  const reDetected = detectStack(cwd, registry);

  const analyzers: VerifyAnalyzer[] = [];

  // (a) Node import probe — @barney-media/crap-typescript-core resolvable?
  try {
    const mod = await import('@barney-media/crap-typescript-core');
    const exports = Object.keys(mod);
    analyzers.push({
      name: 'crap-typescript-core-import',
      status: 'ok',
      detail: `resolvable: ${exports.length ? exports.join(', ') : 'no exports'}`,
    });
  } catch {
    analyzers.push({ name: 'crap-typescript-core-import', status: 'unfixable', detail: 'reinstall checkchange' });
  }

  // (b) CLI availability probe — npx --no-install crap-typescript --help exit 0.
  // NOTE: `--version` is unsupported by the binary (exits 1 "Unknown option");
  // `--help` exits 0 per the tool's own usage contract (matches src/crap.ts:30 npx shape).
  try {
    const { stdout } = await execFileAsync('npx', ['--no-install', 'crap-typescript', '--help'], { cwd, timeout: 60_000 });
    const line = (stdout as string).split('\n')[0]?.trim() ?? '';
    analyzers.push({ name: 'crap-typescript-cli', status: 'ok', detail: `exit 0: ${line}` });
  } catch {
    analyzers.push({ name: 'crap-typescript-cli', status: 'unfixable', detail: 'reinstall checkchange' });
  }

  // (c) Python stdlib probe — venv-aware python -c "import ast"
  const pyCmd = resolvePython(cwd);
  const [pyBin, ...pyArgs] = pyCmd;
  try {
    await execFileAsync(pyBin, [...pyArgs, '-c', 'import ast'], { cwd, timeout: 60_000 });
    analyzers.push({ name: 'python-stdlib-ast', status: 'ok', detail: 'import ast ok' });
  } catch {
    const guidance = pyBin === 'python3'
      ? 'python3 not found on PATH; install Python 3 and re-run prepare-repo'
      : `${pyBin} not found; create .venv via "python3 -m venv .venv" and re-run`;
    analyzers.push({ name: 'python-stdlib-ast', status: 'unfixable', detail: guidance });
  }

  return {
    reDetected,
    analyzers,
    ok: !analyzers.some((a) => a.status === 'unfixable'),
  };
}
