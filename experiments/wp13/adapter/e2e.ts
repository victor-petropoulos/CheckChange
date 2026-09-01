import { collectPythonComplexity } from './pythonComplexity.js';
import { readPythonCoverage } from './pythonCoverage.js';
import { calculateCrap } from '../../../src/crapCalc.js';
import { evaluateHighCrap } from '../../../src/rules.js';

// Re-export types from evidence.ts since we can't import directly (ts-nocheck)
interface ComplexityInfo {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
}

interface CoverageResult {
  available: boolean;
  coverageMap: Map<string, any> | null;
  error: boolean;
  reason?: string;
}

interface AttributedComplexity {
  info: ComplexityInfo;
  coveragePercent: number | null;
  coverageKind: string | null;
}

interface ChangedFunction {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  crap: number | null;
  coverage: number | null;
  coverageKind: string;
  analyzerStatus: 'passed' | 'failed' | 'skipped';
  source: { tool: string; version: string; };
}

interface RuleResult {
  ruleId: 'changed-function-high-crap';
  result: 'PASS' | 'WARN' | 'NOT_EVALUATED';
  file: string;
  method: string;
  crap: number | null;
  threshold: number;
  cc: number;
  coverage: number | null;
}

interface EvidenceOutput {
  schemaVersion: string;
  analysis: { base: string; target: string };
  capabilities: {
    git: string;
    complexity: string;
    coverageArtifact: string;
  };
  changedFunctions: ChangedFunction[];
  policy: { crapThreshold: number };
  ruleResults: RuleResult[];
  analysisStatus: string;
  gate: 'PASS' | 'WARN' | null;
  completeness: string;
  coverageErrorReason?: string;
}

async function runE2E(cwd: string, thresholds: number[]): Promise<void> {
  console.log(`\n=== WP13 Python Adapter E2E Test ===`);
  console.log(`Working dir: ${cwd}\n`);

  // Step 1: Collect complexity
  console.log('Step 1: Collecting Python complexity with lizard...');
  const complexityInfo = await collectPythonComplexity(cwd);
  console.log(`Found ${complexityInfo.length} Python functions:\n`);
  for (const info of complexityInfo) {
    console.log(`  ${info.file}:${info.method} (cc=${info.cc}, lines ${info.lineStart}-${info.lineEnd})`);
  }

  // Step 2: Read coverage
  console.log('\nStep 2: Reading Python coverage.json...');
  const coverageResult = await readPythonCoverage(cwd);
  console.log(`Coverage available: ${coverageResult.available}`);
  console.log(`Coverage error: ${coverageResult.error}`);
  if (coverageResult.error && coverageResult.reason) {
    console.log(`Coverage error reason: ${coverageResult.reason}`);
  }

  if (coverageResult.coverageMap) {
    console.log(`\nCoverage map entries: ${coverageResult.coverageMap.size}`);
    for (const [key, val] of coverageResult.coverageMap.entries()) {
      const cd = val?.coverageData;
      if (cd) {
        console.log(`  ${key}: percent=${cd.percent}%, stmt/branch=${cd.branchCoverage.percent}%`);
      }
    }
  }

  // Step 3: Skip coverage attribution for Python (TS analyzer won't parse Python)
  // For demo, use summary coverage % directly from coverageMap
  console.log('\nStep 3: Skipping attribution - Python files not supported by TS analyzer');
  const summaryCoverage = coverageResult.coverageMap?.get('src/sample.py')?.coverageData?.percent || null;
  const attributed = complexityInfo.map(info => ({
    info,
    coveragePercent: summaryCoverage,
    coverageKind: 'stmt'
  }));
  for (const ac of attributed) {
    console.log(`  ${ac.info.method}: cov=${ac.coveragePercent}%, kind=${ac.coverageKind}`);
  }

  // Step 4: Calculate CRAP
  console.log('\nStep 4: Calculating CRAP values...');
  const crapped = attributed.map(ac => ({
    ...ac.info,
    crap: calculateCrap(ac.info.cc, ac.coveragePercent),
    coverage: ac.coveragePercent,
    coverageKind: ac.coverageKind ?? 'N/A',
    analyzerStatus: ac.coveragePercent !== null ? 'passed' : 'skipped',
    source: { tool: 'lizard@1.8.0+coverage.py', version: '7.16.0' }
  }));

  for (const c of crapped) {
    console.log(`  ${c.method}: cc=${c.cc}, cov=${c.coverage}%, crap=${c.crap?.toFixed(2)}`);
  }

  // Step 5: Evaluate rules for each threshold
  for (const threshold of thresholds) {
    console.log(`\n=== Threshold: ${threshold} ===`);
    const ruleResults = evaluateHighCrap(crapped as ChangedFunction[], threshold);
    console.log('Rule results:');
    for (const r of ruleResults) {
      console.log(`  ${r.result}: ${r.file}:${r.method} (crap=${r.crap?.toFixed(2)}, threshold=${r.threshold}, cc=${r.cc}, cov=${r.coverage}%)`);
    }

    // Build EvidenceOutput (schema 0.2)
    const gate = ruleResults.some((r: RuleResult) => r.result === 'WARN') ? 'WARN' : 'PASS';
    const completeness = ruleResults.some((r: RuleResult) => r.result === 'NOT_EVALUATED') ? 'INCOMPLETE' : 'COMPLETE';

    const output: EvidenceOutput = {
      schemaVersion: '0.2',
      analysis: { base: 'HEAD~1', target: 'current' },
      capabilities: {
        git: 'available',
        complexity: 'available',
        coverageArtifact: coverageResult.available && !coverageResult.error ? 'available' : 'absent'
      },
      changedFunctions: crapped as ChangedFunction[],
      policy: { crapThreshold: threshold },
      ruleResults: ruleResults as RuleResult[],
      analysisStatus: 'SUCCESS',
      gate: gate,
      completeness: completeness,
      coverageErrorReason: coverageResult.error ? coverageResult.reason : undefined
    };

    console.log(`\nEvidenceOutput (threshold=${threshold}):`);
    console.log(`  gate: ${output.gate}`);
    console.log(`  completeness: ${output.completeness}`);
    console.log(`  changedFunctions: ${output.changedFunctions.length}`);
    console.log(`  ruleResults: ${output.ruleResults.length}`);

    // Print JSON for verification
    console.log('\n--- JSON Output ---');
    console.log(JSON.stringify(output, null, 2));
  }
}

// Run with fixture cwd
const fixtureCwd = 'experiments/wp13/fixtures/python-sample';
const thresholds = [30, 15];

runE2E(fixtureCwd, thresholds).catch(console.error);
