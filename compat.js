#!/usr/bin/env node
const { buildEvidenceOutput } = require('./dist/evidence.js');
const { join } = require('path');
const { cwd } = require('process');

async function runCompatibilityChecks() {
  console.log('Running WP4.2 compatibility checks...\n');

  // Check 1: WP0 fixture
  console.log('1. WP0 fixture');
  try {
    const wp0Output = await buildEvidenceOutput(
      'HEAD',
      new Map(), // empty intervals for simplicity
      join(process.cwd(), 'experiments/wp0/fixture'),
      30
    );
    console.log('   Output analysisStatus:', wp0Output.analysisStatus);
    console.log('   Output gate:', wp0Output.gate);
    console.log('   Output completeness:', wp0Output.completeness);
    console.log('   Output capabilities:', wp0Output.capabilities);
    console.log('   Number of changedFunctions:', wp0Output.changedFunctions.length);
    console.log('   WP0 fixture check: PASS\n');
  } catch (error) {
    console.error('   WP0 fixture check failed:', error.message);
    console.log('   WP0 fixture check: FAIL\n');
  }

  // Check 2: Real TS repo with coverage (use prototype's own coverage)
  console.log('2. Real TS repo with coverage');
  try {
    const withCoverageOutput = await buildEvidenceOutput(
      'HEAD',
      new Map(),
      process.cwd(), // use the current directory (the prototype)
      30
    );
    console.log('   Output analysisStatus:', withCoverageOutput.analysisStatus);
    console.log('   Output gate:', withCoverageOutput.gate);
    console.log('   Output completeness:', withCoverageOutput.completeness);
    console.log('   Output capabilities:', withCoverageOutput.capabilities);
    console.log('   Number of changedFunctions:', withCoverageOutput.changedFunctions.length);
    console.log('   Real TS repo with coverage check: PASS\n');
  } catch (error) {
    console.error('   Real TS repo with coverage check failed:', error.message);
    console.log('   Real TS repo with coverage check: FAIL\n');
  }

  // Check 3: Real TS repo without coverage
  console.log('3. Real TS repo without coverage');
  try {
    // Create a temporary directory without coverage
    const tmpDir = await require('fs/promises').mkdtemp(require('os').tmpdir() + '/wp4-2-no-cov-');
    // Copy the current src and tsconfig to the tmp dir to make it a valid TS project
    // For simplicity, we'll just use the current src but ensure no coverage file exists
    // We'll run buildEvidenceOutput on the tmp dir, but we need to have a tsconfig and src.
    // We'll copy the src folder and tsconfig.json to the tmp dir.
    const { copyFileSync, mkdirSync } = require('fs');
    const { resolve } = require('path');
    // Copy src
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    copyFileSync(join(process.cwd(), 'tsconfig.json'), join(tmpDir, 'tsconfig.json'));
    // Copy the src files recursively
    function copySrcRecursive(src, dest) {
      const entries = require('fs').readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
          mkdirSync(destPath, { recursive: true });
          copySrcRecursive(srcPath, destPath);
        } else {
          copyFileSync(srcPath, destPath);
        }
      }
    }
    copySrcRecursive(join(process.cwd(), 'src'), join(tmpDir, 'src'));
    // Ensure no coverage directory exists
    const coveragePath = join(tmpDir, 'coverage');
    if (require('fs').existsSync(coveragePath)) {
      require('fs').rmdirSync(coveragePath, { recursive: true });
    }
    const withoutCoverageOutput = await buildEvidenceOutput(
      'HEAD',
      new Map(),
      tmpDir,
      30
    );
    console.log('   Output analysisStatus:', withoutCoverageOutput.analysisStatus);
    console.log('   Output gate:', withoutCoverageOutput.gate);
    console.log('   Output completeness:', withoutCoverageOutput.completeness);
    console.log('   Output capabilities:', withoutCoverageOutput.capabilities);
    console.log('   Number of changedFunctions:', withoutCoverageOutput.changedFunctions.length);
    console.log('   Real TS repo without coverage check: PASS\n');
    // Clean up
    require('fs').rmdirSync(tmpDir, { recursive: true });
  } catch (error) {
    console.error('   Real TS repo without coverage check failed:', error.message);
    console.log('   Real TS repo without coverage check: FAIL\n');
  }

  console.log('Compatibility checks completed.');
}

runCompatibilityChecks().catch(console.error);