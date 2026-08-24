repository: pmndrs/zustand
url: https://github.com/pmndrs/zustand
license: MIT
base commit: 1f531ba45f7494f3fcd1de002c44fe55f786172b
target commit: 3febf8c6d4f6670f886cc6b628b01a128d2888bd
changed TS files:
- src/middleware/devtools.ts
- src/middleware/immer.ts
rationale: Moderate change - fix for persist middleware to clear storage and invalidate concurrent async rehydration, touching two middleware files.