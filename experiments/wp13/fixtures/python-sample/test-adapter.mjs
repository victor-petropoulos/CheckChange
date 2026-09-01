import { collectPythonComplexity } from '/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp13/adapter/pythonComplexity.js';
import { readPythonCoverage } from '/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp13/adapter/pythonCoverage.js';

const cwd = '/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp13/fixtures/python-sample';

console.log('=== Python Complexity ===');
const complexity = await collectPythonComplexity(cwd);
console.log(JSON.stringify(complexity, null, 2));

console.log('\n=== Python Coverage ===');
const coverage = await readPythonCoverage(cwd);
console.log('Available:', coverage.available);
console.log('Error:', coverage.error);
console.log('Map entries:', coverage.coverageMap?.size || 0);
if (coverage.coverageMap) {
  for (const [path, data] of coverage.coverageMap) {
    console.log(`File: ${path}`);
    console.log('  Functions:', Object.keys(data?.statementMap || {}).length);
  }
}
