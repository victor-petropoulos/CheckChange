import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { resolveRunner, deriveRegistry, builtinConfig } from '../src/providers/index.js';
import type { ProviderConfig } from '../src/providers/index.js';
import {
  writeFileSync,
  mkdirSync,
  rmSync,
  mkdtempSync,
  chmodSync,
  readFileSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('resolveRunner', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'runner-detection-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('TS project with vitest.config + package.json dep resolves typescript vitest', () => {
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vitest: '^1.0.0' } }),
      'utf8'
    );

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('typescript')).toBe(true);
    const runner = result.get('typescript')!;
    expect(runner.command).toEqual(['npx', 'vitest', 'run', '--coverage']);
    expect(runner.artifact).toBe('coverage/coverage-final.json');
    expect(runner.provenance).toContain('vitest.config');
  });

  test('JS project with jest.config resolves javascript jest', () => {
    writeFileSync(join(tmpDir, 'app.js'), 'console.log(1);\n', 'utf8');
    writeFileSync(join(tmpDir, 'jest.config.js'), 'module.exports = {};\n', 'utf8');

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('javascript')).toBe(true);
    const runner = result.get('javascript')!;
    expect(runner.command).toEqual(['npx', 'jest', '--coverage']);
    expect(runner.artifact).toBe('coverage/coverage-final.json');
    expect(runner.provenance).toContain('jest.config');
  });

  test('Python project with pytest.ini + .py + fake .venv/bin/pytest resolves python pytest, provenance mentions .venv', () => {
    writeFileSync(join(tmpDir, 'test_main.py'), 'def test_x():\n    pass\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\ntestpaths = tests\n', 'utf8');

    const venvBin = join(tmpDir, '.venv', 'bin');
    mkdirSync(venvBin, { recursive: true });
    const venvPytestPath = join(venvBin, 'pytest');
    writeFileSync(venvPytestPath, '#!/bin/sh\necho pytest\n', 'utf8');
    chmodSync(venvPytestPath, 0o755);

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('python')).toBe(true);
    const runner = result.get('python')!;
    expect(runner.command).toEqual(['python3', '-m', 'pytest', '--cov', '--cov-report=xml']);
    expect(runner.artifact).toBe('coverage.xml');
    expect(runner.provenance).toContain('.venv');
  });

  test('Mixed TS + Python project resolves both languages', () => {
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');

    writeFileSync(join(tmpDir, 'main.py'), 'print(1)\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\n', 'utf8');

    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('typescript')).toBe(true);
    expect(result.has('python')).toBe(true);
  });

  test('Future language (rust) with custom provider config resolves rust, no src edits needed', () => {
    writeFileSync(
      join(tmpDir, 'Cargo.toml'),
      '[package]\nname = "test"\nversion = "0.1.0"\n',
      'utf8'
    );
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');

    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            {
              name: 'cargo test',
              configFiles: ['Cargo.toml'],
              binaryProbes: ['cargo test --version'],
              command: ['cargo', 'test'],
              artifact: 'target/coverage.json',
            },
          ],
        },
      ],
    };

    const registry = deriveRegistry(config);

    const result = resolveRunner(tmpDir, registry);

    expect(result.has('rust')).toBe(true);
    const runner = result.get('rust')!;
    expect(runner.command).toEqual(['cargo', 'test']);
    expect(runner.artifact).toBe('target/coverage.json');
    expect(runner.provenance).toContain('Cargo.toml');
  });

  test('Empty tmp dir resolves empty Map', () => {
    const registry = deriveRegistry(builtinConfig());

    const result = resolveRunner(tmpDir, registry);

    expect(result.size).toBe(0);
  });

  // ---- Missing-branch characterization tests (Slice A) ----
  // Pin CURRENT verbatim behavior of src/providers/runner-detection.ts.
  // A failure against current src is a backprop finding, NOT a src edit here.

  test(':44 SKIP_DIRS — sources only under node_modules do not count for detection', () => {
    mkdirSync(join(tmpDir, 'node_modules'), { recursive: true });
    writeFileSync(join(tmpDir, 'node_modules', 'lib.go'), 'package lib\n', 'utf8');
    writeFileSync(join(tmpDir, 'go.mod'), 'module x\n', 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'go',
          extensions: ['.go'],
          testRunners: [
            {
              name: 'gotest',
              configFiles: ['go.mod'],
              binaryProbes: [],
              command: ['go', 'test'],
              artifact: 'cover.out',
            },
          ],
        },
      ],
    };
    // Without SKIP_DIRS walk would find node_modules/lib.go → resolve go.
    // With :44 continue, node_modules is skipped → hasSourceFiles false → provider never probed.
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.size).toBe(0);

    // Positive control: same source at repo root DOES resolve
    writeFileSync(join(tmpDir, 'lib.go'), 'package lib\n', 'utf8');
    const result2 = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result2.has('go')).toBe(true);
  });

  test(':70-74 matchConfigFile — directory named like config pattern is not a file, no match', () => {
    mkdirSync(join(tmpDir, 'Cargo.toml')); // DIRECTORY, not a file
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            {
              name: 'cargo',
              configFiles: ['Cargo.toml'],
              binaryProbes: [],
              command: ['cargo', 'test'],
              artifact: 'target/coverage.json',
            },
          ],
        },
      ],
    };
    // statSync succeeds but isFile() false → :71 does not return → no config match
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.size).toBe(0);
  });

  test(':70-74 matchConfigFile — broken symlink matching config pattern hits catch, skipped', () => {
    symlinkSync(join(tmpDir, 'does-not-exist'), join(tmpDir, 'Cargo.toml'));
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            {
              name: 'cargo',
              configFiles: ['Cargo.toml'],
              binaryProbes: [],
              command: ['cargo', 'test'],
              artifact: 'target/coverage.json',
            },
          ],
        },
      ],
    };
    // statSync throws on dangling symlink → :72-73 catch → skipped
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.size).toBe(0);
  });

  test(':137 VIRTUAL_ENV probe — env var alone resolves runner when no config file', () => {
    writeFileSync(join(tmpDir, 'main.py'), 'print(1)\n', 'utf8');
    const prev = process.env.VIRTUAL_ENV;
    process.env.VIRTUAL_ENV = tmpDir;
    try {
      const config: ProviderConfig = {
        version: 1,
        providers: [
          {
            language: 'python',
            extensions: ['.py'],
            testRunners: [
              {
                name: 'pytest',
                configFiles: [],
                binaryProbes: ['VIRTUAL_ENV'],
                command: ['python3', '-m', 'pytest'],
                artifact: 'coverage.xml',
              },
            ],
          },
        ],
      };
      const result = resolveRunner(tmpDir, deriveRegistry(config));
      expect(result.has('python')).toBe(true);
      expect(result.get('python')!.provenance).toContain('VIRTUAL_ENV');
    } finally {
      if (prev === undefined) delete process.env.VIRTUAL_ENV;
      else process.env.VIRTUAL_ENV = prev;
    }
  });

  test(':141 npx dep-only — package.json dep without config file resolves runner', () => {
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { vitest: '^1.0.0' } }),
      'utf8'
    );
    // NO vitest.config — forces the npx binaryProbe path, not configMatches
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'typescript',
          extensions: ['.ts'],
          testRunners: [
            {
              name: 'vitest',
              configFiles: [],
              binaryProbes: ['npx vitest'],
              command: ['npx', 'vitest', 'run', '--coverage'],
              artifact: 'coverage/coverage-final.json',
            },
          ],
        },
      ],
    };
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.has('typescript')).toBe(true);
    expect(result.get('typescript')!.provenance).toContain('npx vitest');
    expect(result.get('typescript')!.command).toEqual(['npx', 'vitest', 'run', '--coverage']);
  });

  test(':141-144 npx without dep and without config → not resolved', () => {
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'package.json'), JSON.stringify({}), 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'typescript',
          extensions: ['.ts'],
          testRunners: [
            {
              name: 'vitest',
              configFiles: [],
              binaryProbes: ['npx vitest'],
              command: ['npx', 'vitest', 'run', '--coverage'],
              artifact: 'coverage/coverage-final.json',
            },
          ],
        },
      ],
    };
    // configMatches empty AND hasPackageDep false → :144 if fails → no binaryMatches
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.size).toBe(0);
  });

  test(':148 literal absolute path — executable resolves, non-executable does not', () => {
    const bin = join(tmpDir, 'myrunner');
    writeFileSync(bin, '#!/bin/sh\necho ok\n', 'utf8');
    chmodSync(bin, 0o755);
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');
    const mkConfig = (probe: string): ProviderConfig => ({
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            {
              name: 'custom',
              configFiles: [],
              binaryProbes: [probe], // absolute, no space → else branch :148
              command: ['custom'],
              artifact: 'a.out',
            },
          ],
        },
      ],
    });

    const ok = resolveRunner(tmpDir, deriveRegistry(mkConfig(bin)));
    expect(ok.has('rust')).toBe(true);
    expect(ok.get('rust')!.provenance).toContain(bin);

    const noexec = join(tmpDir, 'noexec');
    writeFileSync(noexec, 'not executable', 'utf8');
    chmodSync(noexec, 0o644);
    const bad = resolveRunner(tmpDir, deriveRegistry(mkConfig(noexec)));
    expect(bad.size).toBe(0); // accessSync X_OK throws → catch → no match
  });

  test(':193 seen dedupe — same ResolvedProvider under two ext keys probes once', () => {
    const logPath = join(tmpDir, 'probe.log');
    const scriptPath = join(tmpDir, 'probe.sh');
    writeFileSync(scriptPath, `#!/bin/sh\necho x >> "${logPath}"\nexit 0\n`, 'utf8');
    chmodSync(scriptPath, 0o755);
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');

    const shared = {
      language: 'rust',
      extensions: ['.rs'],
      complexityCmd: null,
      coverageFiles: [],
      coverageCmd: null,
      testRunners: [
        {
          name: 'custom',
          configFiles: [],
          binaryProbes: [`${scriptPath} --version`], // space → commandProbeAvailable spawns script
          command: ['true'],
          artifact: 'a.out',
        },
      ],
      source: 'builtin' as const,
    };
    // Same provider object under two extension keys — deriveRegistry's map.set(ext, resolved) shape
    const registry = new Map([
      ['.rs', shared],
      ['.rlib', shared],
    ]);

    const result = resolveRunner(tmpDir, registry);
    expect(result.has('rust')).toBe(true);

    const log = readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    // Deduped: probe ran once despite two registry entries
    expect(log).toHaveLength(1);
  });

  test(':197 testRunners null — provider with sources but no runners is skipped', () => {
    writeFileSync(join(tmpDir, 'main.go'), 'package main\n', 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }], // no testRunners → null
    };
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.size).toBe(0);
  });

  test(':199 first-runner-wins — first config match short-circuits later runners', () => {
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');
    writeFileSync(join(tmpDir, 'a.conf'), '', 'utf8');
    writeFileSync(join(tmpDir, 'b.conf'), '', 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            { name: 'first', configFiles: ['a.conf'], binaryProbes: [], command: ['first'], artifact: 'a.out' },
            { name: 'second', configFiles: ['b.conf'], binaryProbes: [], command: ['second'], artifact: 'b.out' },
          ],
        },
      ],
    };
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    // :207 break — first successful probe wins; second never consulted
    expect(result.get('rust')!.command).toEqual(['first']);
    expect(result.get('rust')!.provenance).toContain('a.conf');
  });

  test(':199 first-runner-wins — first misses, second match still resolves', () => {
    writeFileSync(join(tmpDir, 'main.rs'), 'fn main() {}\n', 'utf8');
    writeFileSync(join(tmpDir, 'b.conf'), '', 'utf8');
    const config: ProviderConfig = {
      version: 1,
      providers: [
        {
          language: 'rust',
          extensions: ['.rs'],
          testRunners: [
            { name: 'first', configFiles: ['missing.conf'], binaryProbes: [], command: ['first'], artifact: 'a.out' },
            { name: 'second', configFiles: ['b.conf'], binaryProbes: [], command: ['second'], artifact: 'b.out' },
          ],
        },
      ],
    };
    const result = resolveRunner(tmpDir, deriveRegistry(config));
    expect(result.get('rust')!.command).toEqual(['second']);
  });

  // Task 4r acceptance (d) deferred this to Task 5: does builtinConfig's DOTNET_RUNNER
  // actually resolve for a repo holding a .csproj? configFiles:['*.csproj','*.sln'] is
  // matched by matchConfigFile (runner-detection.ts:63-64 regex-escapes the pattern and
  // readdir's the ROOT), and binaryProbes:['dotnet --version'] takes the command branch
  // (runner-detection.ts:144-146) — a bare 'dotnet' would have taken the literal-path
  // branch at :150-156 and could never match.
  test('synthetic repo with a .csproj resolves the csharp dotnet runner', () => {
    writeFileSync(join(tmpDir, 'Widget.cs'), 'namespace W { public class W { public int A(int x) => x > 0 ? 1 : 0; } }\n', 'utf8');
    writeFileSync(join(tmpDir, 'Widget.csproj'), '<Project Sdk="Microsoft.NET.Sdk" />\n', 'utf8');

    const result = resolveRunner(tmpDir, deriveRegistry(builtinConfig()));

    expect(result.has('csharp')).toBe(true);
    const runner = result.get('csharp')!;
    expect(runner.command).toEqual(['dotnet', 'test', '--collect:XPlat Code Coverage']);
    expect(runner.artifact).toBe('TestResults/coverage.cobertura.xml');
    expect(runner.provenance).toContain('Widget.csproj');
  });

  // Two-sided: probeRunner (runner-detection.ts:166-168) resolves on EITHER a configFile
  // match OR a binaryProbe hit, so the positive above is hermetic (Widget.csproj alone
  // satisfies it) while this one must defeat BOTH halves — no config file, and no dotnet
  // on PATH so commandProbeAvailable (runner-detection.ts:100-110) returns false. Guards
  // against the positive passing for the wrong reason.
  test('synthetic .cs repo with no .csproj and no dotnet on PATH does not resolve csharp', () => {
    writeFileSync(join(tmpDir, 'Widget.cs'), 'namespace W { public class W { public int A(int x) => x; } }\n', 'utf8');
    const prevPath = process.env.PATH;
    process.env.PATH = tmpDir; // empty dir: `dotnet` is not resolvable
    try {
      const result = resolveRunner(tmpDir, deriveRegistry(builtinConfig()));
      expect(result.has('csharp')).toBe(false);
    } finally {
      if (prevPath === undefined) delete process.env.PATH;
      else process.env.PATH = prevPath;
    }
  });
});
