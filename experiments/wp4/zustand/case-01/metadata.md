repository: pmndrs/zustand
url: https://github.com/pmndrs/zustand
license: MIT
base commit: 6213fc11bdf096301a82ae5c236b5a666a4ee3ca
target commit: 5561e9bc2555b6e98ac2c6292219f3f9cd7e9bcc
changed TS files:
- src/middleware/persist.ts
rationale: Small change - fixing indentation in documentation (index.md) but the actual change in TS is only in persist.ts (likely a minor fix). However, note that the commit message says "Fix indentation for actions in index.md (#3406)" but the diff shows a change in persist.ts. We'll trust the diff.