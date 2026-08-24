repository: sindresorhus/p-limit
url: https://github.com/sindresorhus/p-limit
license: MIT
base commit: 9da5934aaf15c22fceca470ad28ed5720b3c7340
target commit: d76231bMake `.map()` method accept an iterable, not just array
changed TS files:
- index.d.ts
- index.js
- index.test-d.ts
- readme.md
- test.js
rationale: Non-trivial logic change - modifying the `.map()` method to accept iterables, involves significant logic changes in core functionality.
