# WP4R Decision Summary

## Decision

**INCONCLUSIVE — COVERAGE CONTRACT FAILED**

WP4R detected 44 changed functions across the real-repository corpus, so changed-function acquisition is no longer the principal blocker. However, all 44 functions were `NOT_EVALUATED`: none of the coverage-present-intent cases yielded the exact `coverage/coverage-final.json` artifact expected by the prototype.

WP4R therefore did not answer whether changed-function CRAP evidence is useful on real TypeScript changes. It exposed an unverified portability assumption: whether requiring an already-existing `coverage/coverage-final.json` is a practical evidence contract.

### Established

- Real changed TypeScript functions are detected.
- Complexity evidence is available.
- High-CC changed functions were found.
- Missing coverage is honestly represented as `NOT_EVALUATED`.
- The single-path coverage contract prevented all CRAP evaluation.

### Not established

- whether coverage was truly absent after the external coverage commands;
- whether it existed elsewhere or in another format;
- whether CLI reporter configuration can emit suitable Istanbul JSON;
- whether target-project modification is required;
- whether real CRAP warnings are useful.

## Next Step

Do not modify production code.

Run **WP4R.1 — Coverage Artifact Discovery Research** to determine the smallest viable external coverage contract.
