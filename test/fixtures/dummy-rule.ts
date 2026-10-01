import type { Rule } from '../../src/rules.js';

export const dummyRule: Rule = {
  ruleId: 'dummy-fixture-rule',
  evaluate: (changed, threshold) => changed.map((cf) => ({
    ruleId: 'dummy-fixture-rule',
    result: 'PASS',
    file: cf.file,
    method: cf.method,
    crap: cf.crap,
    threshold,
    cc: cf.cc,
    coverage: cf.coverage,
  })),
};
