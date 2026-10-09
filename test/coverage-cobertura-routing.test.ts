import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { readCoverage, detectCoverageFormat, scanCoberturaUnderTestResults } from '../src/coverage.js';
import { writeFileSync, mkdirSync, rmSync, mkdtempSync, utimesSync, statSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// `coverage json` must never be reachable from a .cobertura.xml path. The mock
// records every invocation so the assertions can prove the conversion path was
// NOT taken (rather than inferring it from an error string).
const spawnSyncMock = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({
  spawnSync: spawnSyncMock,
  execFile: vi.fn(), // ponytail: bare mock satisfies module-graph import from prepare.ts
}));

/**
 * Real Coverlet artifact shape: XML declaration, `<coverage>` root,
 * `<sources>`/`<packages>`/`<classes>` and `<line number hits>` — mirrors the
 * byte layout emitted by `dotnet test --collect:"XPlat Code Coverage"`.
 */
function coverletCobertura(sourceRoot: string, filename: string, lines: Array<[number, number]>): string {
  const lineTags = lines.map(([n, h]) => `            <line number="${n}" hits="${h}" branch="false"/>`).join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<coverage line-rate="0.6" branch-rate="0" version="1.9.2" timestamp="1759012345678">
  <sources>
    <source>${sourceRoot}</source>
  </sources>
  <packages>
    <package name="src" line-rate="0.6" branch-rate="0" complexity="0">
      <classes>
        <class name="${filename}" filename="${filename}" line-rate="0.6" branch-rate="0" complexity="0">
          <methods/>
          <lines>
${lineTags}
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
}

function hitsAt(map: Map<string, { statements: Array<{ span: { startLine: number }; hits: number }> }>, line: number): number | undefined {
  for (const entry of map.values()) {
    const unit = entry.statements.find((s) => s.span.startLine === line);
    if (unit) return unit.hits;
  }
  return undefined;
}

describe('Cobertura routing in detectCoverageFormat', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'cobertura-routing-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    spawnSyncMock.mockReset();
    spawnSyncMock.mockImplementation(() => ({ status: 1, stdout: '', stderr: 'command not found', error: null }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('.cobertura.xml basename routes to the Cobertura parser, not the python/istanbul path', async () => {
    const artifact = join(tmpDir, 'TestResults', 'aaaaaaaa-1111-2222-3333-444444444444', 'coverage.cobertura.xml');
    mkdirSync(join(tmpDir, 'TestResults', 'aaaaaaaa-1111-2222-3333-444444444444'), { recursive: true });
    const xml = coverletCobertura(tmpDir, 'src/Calc.cs', [[6, 2], [7, 3], [8, 1]]);
    writeFileSync(artifact, xml, 'utf8');

    const map = await detectCoverageFormat(xml, artifact, tmpDir, false, false);

    expect(map.size).toBe(1);
    expect(hitsAt(map, 6)).toBe(2);
    expect(hitsAt(map, 7)).toBe(3);
    expect(hitsAt(map, 8)).toBe(1);
  });

  test('coverage.xml exact basename keeps the existing python-coverage path', async () => {
    // Same Cobertura document, python filename. It is NOT routed to the Cobertura
    // parser: it still takes the `coverage json` conversion route, which the mock
    // refuses — so the result is the pre-existing refusal shape, and spawnSync
    // proves the conversion path was entered.
    const xml = coverletCobertura(tmpDir, 'src/example.py', [[1, 10], [2, 5]]);
    const artifact = join(tmpDir, 'coverage.xml');
    writeFileSync(artifact, xml, 'utf8');

    const result = await readCoverage(tmpDir);

    expect(spawnSyncMock).toHaveBeenCalled();
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
    expect(result.coverageMap).toBeNull();
  });

  test('misroute regression: coverage.cobertura.xml content is NOT python-converted', async () => {
    // Pre-fix `isPythonCoverageXml` was `basename.startsWith('coverage')`, which also
    // claimed `coverage.cobertura.xml`: the artifact went to `coverage json` and
    // returned reason 'malformed' at the conversion guard, never reaching any format
    // dispatch. Post-fix it parses. Both the result AND the untouched spawnSync mock
    // are asserted — the second is the non-vacuous half, and it is the half that
    // fails if the conversion path is entered again.
    //
    // Passed as an explicit path because `coverage.cobertura.xml` at the repo root is
    // only an auto-detect candidate under the config-driven registry (config.ts:123),
    // and providerRegistry() is null in unit tests — see the scan suite below for the
    // auto-detect route.
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    const xml = coverletCobertura(tmpDir, 'src/Calc.cs', [[10, 7], [11, 0]]);
    writeFileSync(join(tmpDir, 'coverage.cobertura.xml'), xml, 'utf8');

    const result = await readCoverage(tmpDir, 'coverage.cobertura.xml');

    expect(spawnSyncMock).not.toHaveBeenCalled();
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.reason).toBeUndefined();
    expect(result.coverageMap).not.toBeNull();
    expect(result.coverageMap!.size).toBe(1);
    expect(hitsAt(result.coverageMap!, 10)).toBe(7);
    expect(hitsAt(result.coverageMap!, 11)).toBe(0);
  });

  test('end-to-end: real Coverlet artifact under TestResults reaches readCoverage with hits', async () => {
    const runDir = join(tmpDir, 'TestResults', '99999999-aaaa-bbbb-cccc-dddddddddddd');
    mkdirSync(runDir, { recursive: true });
    const xml = coverletCobertura(tmpDir, 'src/Calc.cs', [[6, 2], [7, 3], [8, 1]]);
    writeFileSync(join(runDir, 'coverage.cobertura.xml'), xml, 'utf8');

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    expect(result.coverageMap!.size).toBe(1);
    expect(hitsAt(result.coverageMap!, 6)).toBe(2);
    expect(hitsAt(result.coverageMap!, 7)).toBe(3);
    expect(hitsAt(result.coverageMap!, 8)).toBe(1);
    // SHA-256 lineage input is computed on the bytes actually read
    expect(result.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });
});

describe('TestResults scan fallback', () => {
  let tmpDir: string;
  let originalCwd: string;

  function placeArtifact(relDir: string, mtimeSeconds: number, filename = 'src/Calc.cs'): string {
    const dir = join(tmpDir, relDir);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'coverage.cobertura.xml');
    writeFileSync(file, coverletCobertura(tmpDir, filename, [[6, mtimeSeconds]]), 'utf8');
    utimesSync(file, mtimeSeconds, mtimeSeconds);
    return file;
  }

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'cobertura-scan-'));
    process.chdir(tmpDir);
    spawnSyncMock.mockReset();
    spawnSyncMock.mockImplementation(() => ({ status: 1, stdout: '', stderr: 'command not found', error: null }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // Plan 20261007T182709Z task 5 / H3 — the real GuardClauses layout. `dotnet test`
  // run from a REPO ROOT writes the artifact under the TEST PROJECT's directory, not
  // the root: `test/GuardClauses.UnitTests/TestResults/<guid>/coverage.cobertura.xml`
  // (verified live at /tmp/GuardClauses, SHA f96b823e). Same shape in stateless
  // (`test/Stateless.Tests/TestResults/<guid>/`, SHA 588f1a1a). Before the depth-3
  // widening the scan stopped at `<cwd>/<child>/TestResults`, so `test/` matched but
  // `test/<Proj>.UnitTests/` did NOT — doctor reported `missing` on a repo that HAS
  // a perfectly good artifact. Depth 3 is the measured worst case across the three
  // pinned corpus repos (`NCrontab.Tests/TestResults/<guid>/` is depth 2 and already
  // worked), so the bound is widened to exactly 3, not "until found".
  test('finds a TestResults dir nested under a test PROJECT dir at depth 3 (GuardClauses layout)', async () => {
    placeArtifact(
      'test/GuardClauses.UnitTests/TestResults/91437213-274a-48f1-894c-5fee4936ac28',
      1_700_000_000,
      'src/GuardClauses/Guard.cs',
    );

    expect(scanCoberturaUnderTestResults(tmpDir)).toBe(
      join(tmpDir, 'test/GuardClauses.UnitTests/TestResults/91437213-274a-48f1-894c-5fee4936ac28/coverage.cobertura.xml'),
    );

    // Same shape through the public entry point doctor actually calls, so the
    // assertion covers the seam rather than the helper alone.
    const result = await readCoverage(tmpDir);
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
  });

  // The widening must stay BOUNDED: depth 4 is outside the contract, so an artifact
  // there is NOT discovered. Without this row a future "just go deeper" edit would
  // pass every positive case above while turning the scan into an unbounded walk.
  test('does NOT scan past depth 3 (the bound holds, not "until found")', () => {
    placeArtifact('test/Unit.Tests/nested/deeper/TestResults/run', 1_700_000_000);

    expect(scanCoberturaUnderTestResults(tmpDir)).toBeNull();
  });

  // Newest-mtime-wins must survive the widening across depths: a stale depth-1 run dir
  // and a fresh depth-3 one, so the widening cannot silently prefer the cheap dir.
  test('newest mtime wins ACROSS depths (a fresh depth-3 run beats a stale depth-1 run)', () => {
    placeArtifact('TestResults/stale-root-run', 1_600_000_000);
    // placeArtifact already returns the artifact path, not its directory.
    const fresh = placeArtifact('test/Proj.Tests/TestResults/fresh-run', 1_700_000_000);

    expect(scanCoberturaUnderTestResults(tmpDir)).toBe(fresh);
  });

  // node_modules is a plausible artifact home for a vendored run and is unbounded in
  // size, so the widening must prune it or it turns a bounded scan into a full walk.
  // Pruned at BOTH levels: the depth-1 skip keeps us out of the tree entirely, and
  // the assertion on a nested copy proves the depth-3 pass cannot re-enter it.
  test('the widening prunes node_modules at depth 1 and depth 3', () => {
    placeArtifact('node_modules/pkg/TestResults/run', 1_700_000_000);
    placeArtifact('test/node_modules/pkg/TestResults/run', 1_700_000_000);

    expect(scanCoberturaUnderTestResults(tmpDir)).toBeNull();
  });

  test('finds TestResults/<guid>/coverage.cobertura.xml when no literal candidate exists', async () => {
    placeArtifact('TestResults/11111111-1111-1111-1111-111111111111', 1_700_000_000);

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.coverageMap!.size).toBe(1);
    expect(hitsAt(result.coverageMap!, 6)).toBe(1_700_000_000);
  });

  test('finds a nested TestResults at depth 2 (e.g. tests/TestResults/<guid>/)', async () => {
    placeArtifact('tests/TestResults/22222222-2222-2222-2222-222222222222', 1_700_000_100);

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.coverageMap!.size).toBe(1);
    expect(hitsAt(result.coverageMap!, 6)).toBe(1_700_000_100);
  });

  test('newest mtime wins across multiple GUID directories', async () => {
    // hits encodes the mtime, so the assertion identifies WHICH artifact was read.
    placeArtifact('TestResults/old-run', 1_700_000_000, 'src/Old.cs');
    placeArtifact('TestResults/new-run', 1_700_000_900, 'src/New.cs');

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.coverageMap!.size).toBe(1);
    const [key] = [...result.coverageMap!.keys()];
    expect(key).toContain('New.cs');
    expect(key).not.toContain('Old.cs');
    expect(hitsAt(result.coverageMap!, 6)).toBe(1_700_000_900);
  });

  test('absent: no TestResults dir leaves the no-artifact shape untouched', async () => {
    const result = await readCoverage(tmpDir);

    expect(result.available).toBe(false);
    expect(result.error).toBe(false);
    expect(result.coverageMap).toBeNull();
    expect(result.reason).toBeUndefined();
  });

  test('absent: TestResults present but holding no cobertura artifact → no artifact', async () => {
    mkdirSync(join(tmpDir, 'TestResults', 'deadbeef-0000-0000-0000-000000000000'), { recursive: true });

    const result = await readCoverage(tmpDir);

    expect(result.available).toBe(false);
    expect(result.error).toBe(false);
    expect(result.coverageMap).toBeNull();
  });

  test('explicit --coverage-file still wins over the scan', async () => {
    placeArtifact('TestResults/scanned-run', 1_700_000_900, 'src/Scanned.cs');
    const explicit = join(tmpDir, 'explicit.cobertura.xml');
    writeFileSync(explicit, coverletCobertura(tmpDir, 'src/Explicit.cs', [[6, 42]]), 'utf8');

    const result = await readCoverage(tmpDir, 'explicit.cobertura.xml');

    expect(result.error).toBe(false);
    expect(result.coverageMap!.size).toBe(1);
    const [key] = [...result.coverageMap!.keys()];
    expect(key).toContain('Explicit.cs');
    expect(hitsAt(result.coverageMap!, 6)).toBe(42);
  });

  test('a readable literal candidate keeps precedence over the scan (artifactFound short-circuit)', async () => {
    placeArtifact('TestResults/scanned-run', 1_700_000_900, 'src/Scanned.cs');
    // coverage.xml IS a literal candidate (PYTHON_COVERAGE_FILES, src/coverage.ts:29),
    // so artifactFound is already true and the scan must never run. Make it
    // CONVERTIBLE-false on purpose: the literal is entered, refuses, and the existing
    // "found but unconvertible → malformed" taxonomy stands. A scan fallback that ran
    // here would instead return the Scanned.cs artifact with error:false.
    writeFileSync(join(tmpDir, 'coverage.xml'), coverletCobertura(tmpDir, 'src/Literal.cs', [[6, 7]]), 'utf8');

    const result = await readCoverage(tmpDir);

    expect(spawnSyncMock).toHaveBeenCalled();
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
    expect(result.coverageMap).toBeNull();
  });

  test('a convertible literal candidate wins over the scan', async () => {
    placeArtifact('TestResults/scanned-run', 1_700_000_900, 'src/Scanned.cs');
    const literalJson = {
      'src/Literal.ts': {
        statementMap: { '0': { start: { line: 6, column: 0 }, end: { line: 6, column: 10 } } },
        s: { '0': 3 },
        branchMap: {}, b: {}, fnMap: {}, f: {},
      },
    };
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(literalJson), 'utf8');

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    // parseCoverageReport lowercases keys, hence the case-insensitive compare.
    const [key] = [...result.coverageMap!.keys()];
    expect(key.toLowerCase()).toContain('literal.ts');
    expect(key.toLowerCase()).not.toContain('scanned.cs');
    expect(hitsAt(result.coverageMap!, 6)).toBe(3);
  });

  test('depth bound: a TestResults at depth 4 is NOT scanned', async () => {
    // Guarantees the walk stays bounded — the artifact is deliberately too deep.
    // Plan 20261007T182709Z task 5 / H3 widened the bound from 2 to 3 (measured:
    // `test/GuardClauses.UnitTests/TestResults/<guid>/`, SHA f96b823e), so this row
    // previously asserted "depth 3 is too deep" and now asserts depth 4. Same intent,
    // one level deeper: 3 is the measured worst case across the pinned corpus, 4 is
    // outside the contract.
    placeArtifact('a/b/c/TestResults/33333333-3333-3333-3333-333333333333', 1_700_000_000);

    const result = await readCoverage(tmpDir);

    expect(result.available).toBe(false);
    expect(result.coverageMap).toBeNull();
  });
});

// ====================== WS3.2: uppercase `.COBERTURA.XML` =======================
describe('WS3.2 case-insensitive Cobertura basename', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'cobertura-case-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    spawnSyncMock.mockReset();
    spawnSyncMock.mockImplementation(() => ({ status: 1, stdout: '', stderr: 'command not found', error: null }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // src/coverage.ts:409 — `path.basename(filePath).toLowerCase().endsWith('.cobertura.xml')`.
  // Coverlet on Windows and some CI images emit an UPPERCASE basename; without the
  // `.toLowerCase()` the artifact falls through to the python/Istanbul route, which
  // refuses it, so an otherwise-valid C# repo reports 0% coverage.
  test.each([
    ['UPPERCASE', 'COVERAGE.COBERTURA.XML'],
    ['mixed case', 'Coverage.Cobertura.XML'],
  ])('a %s basename `.COBERTURA.XML` routes to the Cobertura parser, not python', async (_label, basename) => {
    const artifact = join(tmpDir, basename);
    const xml = coverletCobertura(tmpDir, 'src/Calc.cs', [[6, 4], [7, 9]]);
    writeFileSync(artifact, xml, 'utf8');

    const map = await detectCoverageFormat(xml, artifact, tmpDir, false, false);

    // Parsed as Cobertura: real hits, and the map is keyed on the .cs source file.
    expect(map.size).toBe(1);
    expect(hitsAt(map, 6)).toBe(4);
    expect(hitsAt(map, 7)).toBe(9);
    // The python-conversion route (`coverage json`) is the misroute this guards;
    // the untouched spawnSync mock is the non-vacuous half of the proof.
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });

  // The negative half: an uppercase NON-cobertura basename must still be refused by
  // the python route. Without this, a mutation that lowercases the WHOLE basename
  // (or drops `.endsWith`) would still pass the test above.
  test('an uppercase COVERAGE.XML (no .cobertura segment) still takes the python path', async () => {
    const artifact = join(tmpDir, 'COVERAGE.XML');
    const xml = coverletCobertura(tmpDir, 'src/Calc.cs', [[6, 4]]);
    writeFileSync(artifact, xml, 'utf8');

    const result = await readCoverage(tmpDir);

    // Entered the conversion route (the mock refuses), so the malformed taxonomy stands.
    expect(spawnSyncMock).toHaveBeenCalled();
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });
});

// ====================== WS3.3: mtime-tie determinism ==========================
describe('WS3.3 mtime tie-break is deterministic', () => {
  let tmpDir: string;
  let originalCwd: string;

  function placeTiedArtifact(runDirName: string, hits: number): string {
    const dir = join(tmpDir, 'TestResults', runDirName);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'coverage.cobertura.xml');
    writeFileSync(file, coverletCobertura(tmpDir, 'src/Calc.cs', [[6, hits]]), 'utf8');
    // Identical atime AND mtime on BOTH artifacts — the exact tie the clause exists for.
    utimesSync(file, 1_700_000_500, 1_700_000_500);
    return file;
  }

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'cobertura-tie-'));
    process.chdir(tmpDir);
    spawnSyncMock.mockReset();
    spawnSyncMock.mockImplementation(() => ({ status: 1, stdout: '', stderr: 'command not found', error: null }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // src/coverage.ts:469 — `(mtimeMs === newest.mtimeMs && file < newest.file)`.
  // Measured BEFORE this test: `467|binary-expr[3] = 0`, i.e. `file < newest.file`
  // was NEVER evaluated, because every pre-existing scan test used strictly
  // increasing mtimes so the first two disjuncts decided the winner. Without the
  // clause the result would be whichever readdirSync happened to yield first —
  // which differs across filesystems, hence "deterministic" is the contract.
  test('equal mtimes pick the lexicographically smaller absolute path', async () => {
    // 'aaa-run' sorts before 'zzz-run'; hits encode which artifact was read.
    const smaller = placeTiedArtifact('aaa-run', 111);
    const larger = placeTiedArtifact('zzz-run', 222);
    expect(smaller < larger).toBe(true);

    // Sanity: the fixture really is a tie, not an accidental ordering.
    expect(statSync(smaller).mtimeMs).toBe(statSync(larger).mtimeMs);

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.coverageMap!.size).toBe(1);
    // 111 is the aaa-run artifact: the smaller absolute path won the tie.
    expect(hitsAt(result.coverageMap!, 6)).toBe(111);
  });

  // Determinism is a property of the ORDER, not of the filesystem: run the same tie
  // with the directories created in the OPPOSITE order and the winner must not move.
  // A tie-break that silently depended on readdir order would flip here.
  test('the tie-break is order-independent — reversed creation order picks the same artifact', async () => {
    const larger = placeTiedArtifact('zzz-run', 222);
    const smaller = placeTiedArtifact('aaa-run', 111);
    expect(smaller < larger).toBe(true);

    const result = await readCoverage(tmpDir);

    expect(hitsAt(result.coverageMap!, 6)).toBe(111);
    expect(larger).toContain('zzz-run');
  });

  // The clause must not OVERRIDE a genuinely newer artifact: the tie-break is only
  // consulted when the first two disjuncts are false.
  test('a strictly newer artifact still beats a lexicographically smaller tied one', async () => {
    placeTiedArtifact('zzz-run', 222);            // older
    const newer = join(tmpDir, 'TestResults', 'aaa-run');
    mkdirSync(newer, { recursive: true });
    const newerFile = join(newer, 'coverage.cobertura.xml');
    writeFileSync(newerFile, coverletCobertura(tmpDir, 'src/Calc.cs', [[6, 333]]), 'utf8');
    utimesSync(newerFile, 1_700_000_900, 1_700_000_900); // strictly newer

    const result = await readCoverage(tmpDir);

    // aaa-run is smaller, so a tie-break-only implementation would pick zzz-run here.
    expect(hitsAt(result.coverageMap!, 6)).toBe(333);
  });
});

// ================== WS3.4: unreadable-dir catch arms (portable) ================
// The plan (risk 3) forbids a chmod-000 trigger because it claims chmod is
// "ineffective for the owning user on macOS". MEASURED on this host (node 24.18.1,
// darwin): chmod 000 DOES produce EACCES for the owning user, so it IS used — for
// the one arm that has no other trigger, and only ever inside try/finally with the
// mode restored so cleanup cannot wedge.
//
// Per-arm trigger decisions, all MEASURED rather than assumed:
//   arm :440/:449  ENOTDIR — a FILE where a directory is expected. Portable.
//   arm :458       chmod 000 on a real `TestResults` dir. NOT reachable by a
//                  file-or-symlink stand-in: `addIfTestResults` pushes only when
//                  `Dirent.isDirectory()` (:437), and withFileTypes is lstat-based,
//                  so both a file and a DANGLING SYMLINK report isDirectory()===false
//                  and are never pushed. Corrects the plan's risk-3 trigger choice.
//   arm :473       ENOENT — `statSync` of a missing `coverage.cobertura.xml`. An
//                  EISDIR variant is impossible: `statSync` of a directory SUCCEEDS.
//   stmt :462      a loose FILE inside `TestResults/`.
describe('WS3.4 unreadable-dir catch arms degrade without throwing', () => {
  let originalCwd: string;
  const created: string[] = [];

  function tempDir(prefix: string): string {
    const d = mkdtempSync(join(tmpdir(), prefix));
    created.push(d);
    return d;
  }

  beforeEach(() => {
    originalCwd = process.cwd();
    spawnSyncMock.mockReset();
    spawnSyncMock.mockImplementation(() => ({ status: 1, stdout: '', stderr: 'command not found', error: null }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    for (const d of created.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  // Arm :440 (addIfTestResults catch) + :449 (unreadable-cwd catch).
  // A cwd that is a FILE makes `readdirSync(cwd)` throw ENOTDIR at both :437
  // (inside addIfTestResults, whose catch swallows it) and :446 (the depth-2 walk,
  // whose catch swallows it too). Observable outcome: no throw, null scan.
  test('a cwd that is a file returns null instead of throwing', () => {
    const filePath = join(tempDir('cobertura-armfile-'), 'not-a-dir');
    writeFileSync(filePath, 'a regular file', 'utf8');

    expect(scanCoberturaUnderTestResults(filePath)).toBeNull();
  });

  // Arm :440 alone: cwd is a real DIRECTORY, so the :446 walk succeeds, but one of
  // its children is a FILE... except the walk filters non-directories at :447
  // (`if (entry.isDirectory())`) before calling addIfTestResults. So a file child
  // cannot reach :437. The reachable shape is a child DIRECTORY whose readdir
  // fails — which on macOS-as-owner needs an unreadable dir (chmod, ruled out) or a
  // dangling entry. Instead: a child directory containing a nested `TestResults`
  // proves :440's true side, and the ENOTDIR cwd test above proves :440's catch.
  // This test pins the true side of :437 so the catch test cannot pass vacuously.
  test('a readable child dir with TestResults is collected (the :437 true side)', () => {
    const cwd = tempDir('cobertura-armtrue-');
    const child = join(cwd, 'tests');
    mkdirSync(join(child, 'TestResults'), { recursive: true });

    // No artifact inside, so the scan completes but finds nothing — the observable
    // proof that :437 matched and pushed the dir, rather than the catch swallowing it.
    expect(scanCoberturaUnderTestResults(cwd)).toBeNull();
  });

  // Arm :458/:459 — `readdirSync(resultsDir)` throws where
  // resultsDir = <cwd>/TestResults, and the catch `continue`s (src/coverage.ts:459).
  //
  // MEASURED portability result (node 24.18.1, darwin), which CORRECTS the plan's
  // risk-3 assumption:
  //   - A `TestResults` that is a FILE does NOT reach :457. `addIfTestResults` pushes
  //     only when `Dirent.isDirectory()` is true (:437), so a file never enters
  //     `testResultsDirs` at all. (Measured: `some()` over the parent returns false.)
  //   - A DANGLING SYMLINK named `TestResults` is also `isDirectory() === false`
  //     (`withFileTypes` reports lstat semantics), so it is likewise never pushed.
  //     (Measured: `dir=false,sym=true`.)
  // The only way :437 pushes a dir and :457 then fails is a permission change on a
  // real directory. `chmod 000` DOES work for the owning user on this host —
  // measured EACCES, contradicting the plan's claim that it is ineffective — so it is
  // used here, with the mode restored in `finally` so cleanup can never wedge.
  test('a TestResults directory that cannot be listed is skipped, not fatal', () => {
    const cwd = tempDir('cobertura-armtr-');
    const resultsDir = join(cwd, 'TestResults');
    mkdirSync(resultsDir, { recursive: true });

    try {
      chmodSync(resultsDir, 0o000);
      // Portable trigger unavailable on Windows (POSIX modes only), so skip there
      // rather than assert a false outcome. This suite is POSIX-first; the guard is
      // what keeps a Windows CI run honest.
      const scanned = process.platform === 'win32' ? null : scanCoberturaUnderTestResults(cwd);
      if (process.platform !== 'win32') {
        expect(scanned).toBeNull();
      }
    } finally {
      // Restore BEFORE rm, or the temp dir is undeletable and the run leaks.
      chmodSync(resultsDir, 0o755);
    }
  });

  // The complement of the arm above, and the reason the arm's test is not vacuous:
  // the SAME directory shape, readable, is collected and a real artifact is found.
  test('a readable TestResults directory IS scanned (so the :458 skip is not the norm)', () => {
    const cwd = tempDir('cobertura-armtr-ok-');
    const goodDir = join(cwd, 'TestResults', 'run');
    mkdirSync(goodDir, { recursive: true });
    const file = join(goodDir, 'coverage.cobertura.xml');
    writeFileSync(file, coverletCobertura(cwd, 'src/Calc.cs', [[6, 77]]), 'utf8');
    utimesSync(file, 1_700_000_000, 1_700_000_000);

    expect(scanCoberturaUnderTestResults(cwd)).toBe(file);
  });

  // Arm :473 — `statSync(<runDir>/coverage.cobertura.xml)` throws ENOENT because the
  // run directory holds no artifact. The catch skips it and the scan continues to the
  // NEXT run dir, so a sibling artifact is still found — that is what proves the catch
  // continued instead of aborting.
  test('a run dir with no cobertura artifact is skipped and a sibling still wins', () => {
    const cwd = tempDir('cobertura-armenoent-');
    mkdirSync(join(cwd, 'TestResults', 'empty-run'), { recursive: true });
    const goodDir = join(cwd, 'TestResults', 'good-run');
    mkdirSync(goodDir, { recursive: true });
    const goodFile = join(goodDir, 'coverage.cobertura.xml');
    writeFileSync(goodFile, coverletCobertura(cwd, 'src/Calc.cs', [[6, 55]]), 'utf8');
    utimesSync(goodFile, 1_700_000_000, 1_700_000_000);

    expect(scanCoberturaUnderTestResults(cwd)).toBe(goodFile);
  });

  // Arm :473 via a stat that is NOT ENOENT: `coverage.cobertura.xml` exists as a
  // DIRECTORY. Measured: `statSync` of a directory SUCCEEDS (returns isDirectory), so
  // this arm cannot be driven by EISDIR — ENOENT above is the only portable trigger.
  // Pinned here as an explicit non-portability record rather than a fake test.
  test('a cobertura.xml that is a directory is stat-able, so that arm has no portable trigger', () => {
    const cwd = tempDir('cobertura-armdir-');
    mkdirSync(join(cwd, 'TestResults', 'run', 'coverage.cobertura.xml'), { recursive: true });

    // The stat SUCCEEDS (no throw), so :473 is not entered; the scan then returns the
    // directory path. Recorded so a future reader does not assume EISDIR was tested.
    const found = scanCoberturaUnderTestResults(cwd);
    expect(found).toBe(join(cwd, 'TestResults', 'run', 'coverage.cobertura.xml'));
    expect(statSync(found!).isDirectory()).toBe(true);
  });

  // src/coverage.ts:462 — `if (!runDir.isDirectory()) continue`. A Coverlet run dir is
  // a directory, but `TestResults/` also accumulates loose FILES (logs, attachments).
  // Without the guard the code would stat `<file>/coverage.cobertura.xml` and get ENOENT,
  // so the catch would absorb it — but the loop must skip it explicitly.
  test('a loose FILE inside TestResults is skipped and a sibling run dir still wins', () => {
    const cwd = tempDir('cobertura-runfile-');
    mkdirSync(join(cwd, 'TestResults'), { recursive: true });
    writeFileSync(join(cwd, 'TestResults', 'msbuild.log'), 'noise', 'utf8');
    const goodDir = join(cwd, 'TestResults', 'run');
    mkdirSync(goodDir, { recursive: true });
    const file = join(goodDir, 'coverage.cobertura.xml');
    writeFileSync(file, coverletCobertura(cwd, 'src/Calc.cs', [[6, 88]]), 'utf8');
    utimesSync(file, 1_700_000_000, 1_700_000_000);

    expect(scanCoberturaUnderTestResults(cwd)).toBe(file);
  });

  // End-to-end shape: a cwd that is a file must not change readCoverage's observable
  // contract — it degrades to the no-artifact shape rather than throwing out of the
  // scan and aborting the whole read.
  test('readCoverage over a file-as-cwd degrades to the no-artifact shape', async () => {
    const filePath = join(tempDir('cobertura-e2earm-'), 'cwd-is-a-file');
    writeFileSync(filePath, 'not a directory', 'utf8');

    const result = await readCoverage(filePath);

    expect(result.available).toBe(false);
    expect(result.error).toBe(false);
    expect(result.coverageMap).toBeNull();
  });
});
