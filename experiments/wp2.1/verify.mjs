import { buildOutput } from '../../src/evidence';
import { parseCrapJson } from '../../src/crap';

async function main() {
  const results = [];

  // Helper to deep compare preserving null vs undefined? We'll just check value and type.
  function checkPreserved(original, parsed, path) {
    if (original === null && parsed === null) {
      return { pass: true, message: `${path} null preserved` };
    }
    if (original === 0 && parsed === 0) {
      return { pass: true, message: `${path} zero preserved` };
    }
    if (typeof original === 'number' && original !== 0 && typeof parsed === 'number' && parsed === original) {
      return { pass: true, message: `${path} number ${original} preserved` };
    }
    return { pass: false, message: `${path} expected ${JSON.stringify(original)} got ${JSON.stringify(parsed)}` };
  }

  // Case 1: crap 0, coverage 100
  const changed1 = [{
    file: 'test.ts',
    method: 'testMethod',
    lineStart: 1,
    lineEnd: 10,
    cc: 1,
    crap: 0,
    coverage: 100,
    coverageKind: 'stmt',
    analyzerStatus: 'passed',
    source: {
      tool: '@barney-media/crap-typescript',
      version: '0.5.0'
    }
  }];
  const output1 = buildOutput('base', changed1);
  const json1 = JSON.stringify(output1);
  const parsed1 = JSON.parse(json1);
  const cf1 = parsed1.changedFunctions[0];
  results.push({
    case: 'crap 0, coverage 100',
    crapCheck: checkPreserved(0, cf1.crap, 'crap'),
    coverageCheck: checkPreserved(100, cf1.coverage, 'coverage')
  });

  // Case 2: crap null, coverage null (with coverageKind N/A, status skipped)
  const changed2 = [{
    file: 'test.ts',
    method: 'testMethod',
    lineStart: 1,
    lineEnd: 10,
    cc: 1,
    crap: null,
    coverage: null,
    coverageKind: 'N/A',
    analyzerStatus: 'skipped',
    source: {
      tool: '@barney-media/crap-typescript',
      version: '0.5.0'
    }
  }];
  const output2 = buildOutput('base', changed2);
  const json2 = JSON.stringify(output2);
  const parsed2 = JSON.parse(json2);
  const cf2 = parsed2.changedFunctions[0];
  results.push({
    case: 'crap null, coverage null',
    crapCheck: checkPreserved(null, cf2.crap, 'crap'),
    coverageCheck: checkPreserved(null, cf2.coverage, 'coverage')
  });

  // Case 3: coverage 0, crap 5
  const changed3 = [{
    file: 'test.ts',
    method: 'testMethod',
    lineStart: 1,
    lineEnd: 10,
    cc: 2,
    crap: 5,
    coverage: 0,
    coverageKind: 'stmt',
    analyzerStatus: 'passed',
    source: {
      tool: '@barney-media/crap-typescript',
      version: '0.5.0'
    }
  }];
  const output3 = buildOutput('base', changed3);
  const json3 = JSON.stringify(output3);
  const parsed3 = JSON.parse(json3);
  const cf3 = parsed3.changedFunctions[0];
  results.push({
    case: 'coverage 0, crap 5',
    crapCheck: checkPreserved(5, cf3.crap, 'crap'),
    coverageCheck: checkPreserved(0, cf3.coverage, 'coverage')
  });

  // Case 4: coverage null, crap null
  const changed4 = [{
    file: 'test.ts',
    method: 'testMethod',
    lineStart: 1,
    lineEnd: 10,
    cc: 3,
    crap: null,
    coverage: null,
    coverageKind: 'stmt',
    analyzerStatus: 'passed',
    source: {
      tool: '@barney-media/crap-typescript',
      version: '0.5.0'
    }
  }];
  const output4 = buildOutput('base', changed4);
  const json4 = JSON.stringify(output4);
  const parsed4 = JSON.parse(json4);
  const cf4 = parsed4.changedFunctions[0];
  results.push({
    case: 'coverage null, crap null',
    crapCheck: checkPreserved(null, cf4.crap, 'crap'),
    coverageCheck: checkPreserved(null, cf4.coverage, 'coverage')
  });

  // Now test parseCrapJson with fake JSON strings
  // Fake JSON for crap 0
  const fakeJson0 = `{"methods":[{"src":"test.ts","method":"testMethod","lineStart":1,"lineEnd":10,"cc":1,"crap":0,"cov":50,"covKind":"stmt","status":"passed"}]}`;
  const parsedMethods0 = parseCrapJson(fakeJson0);
  if (parsedMethods0.length > 0) {
    const m0 = parsedMethods0[0];
    results.push({
      case: 'parseCrapJson crap 0',
      crapCheck: checkPreserved(0, m0.crap, 'crap'),
      coverageCheck: checkPreserved(50, m0.coverage, 'coverage')
    });
  } else {
    results.push({
      case: 'parseCrapJson crap 0',
      crapCheck: { pass: false, message: 'No method evidence parsed' },
      coverageCheck: { pass: false, message: 'No method evidence parsed' }
    });
  }

  // Fake JSON for crap null
  const fakeJsonNull = `{"methods":[{"src":"test.ts","method":"testMethod","lineStart":1,"lineEnd":10,"cc":1,"crap":null,"cov":null,"covKind":"N/A","status":"skipped"}]}`;
  const parsedMethodsNull = parseCrapJson(fakeJsonNull);
  if (parsedMethodsNull.length > 0) {
    const mn = parsedMethodsNull[0];
    results.push({
      case: 'parseCrapJson crap null',
      crapCheck: checkPreserved(null, mn.crap, 'crap'),
      coverageCheck: checkPreserved(null, mn.coverage, 'coverage')
    });
  } else {
    results.push({
      case: 'parseCrapJson crap null',
      crapCheck: { pass: false, message: 'No method evidence parsed' },
      coverageCheck: { pass: false, message: 'No method evidence parsed' }
    });
  }

  // Determine overall pass: all checks must pass
  const allPass = results.every(r => r.crapCheck.pass && r.coverageCheck.pass);

  const finalResult = {
    cases: results,
    overallPass: allPass
  };

  // Write to file
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, './serialization-verification.json');
  fs.writeFileSync(outPath, JSON.stringify(finalResult, null, 2));
  console.log(`Serialization verification written to ${outPath}`);
  console.log(`Overall pass: ${allPass}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});