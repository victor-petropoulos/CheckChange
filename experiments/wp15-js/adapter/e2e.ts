import { buildEvidenceOutput } from '../../../dist/evidence.js';

// Create intervals map for the fixture files with wide ranges to cover the functions
const intervals = new Map([
  ['js-sample/low.js', [{start: 1, end: 1000}]],
  ['js-sample/med.js', [{start: 1, end: 1000}]],
  ['js-sample/high.js', [{start: 1, end: 1000}]],
  ['jsx-sample/Component.jsx', [{start: 1, end: 1000}]],
  ['jsx-sample/useHook.jsx', [{start: 1, end: 1000}]]
]);

// Call buildEvidenceOutput with cwd set to the fixtures directory
// We'll use a base commit of 'HEAD' (or any dummy base) since we are not in a real git repo for this test?
// The function expects a base (commit) and intervals and cwd.
// We'll pass an empty string for base? Let's look at how it's used in the tests.

// From the test files, we see that they call buildEvidenceOutput with base, intervals, cwd.
// We'll assume we can pass a dummy base.

(async () => {
  try {
    const result = await buildEvidenceOutput('HEAD', intervals, '/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp15-js/fixtures');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();