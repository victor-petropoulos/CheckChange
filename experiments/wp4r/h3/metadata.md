# h3 — Historical Cases

| Case | Base | Target | Changed TS files | Rationale |
|------|------|--------|----------------|-----------|
| case-01 | 75fd2de | f05b374 | src/rules/handlers/_utils.ts, src/rules/match.ts, test/rules/compiler.test.ts, test/rules/match.test.ts, test/rules/merge.test.ts | small: lint tweaks in rules handlers (7 lines) |
| case-02 | bd5cd6a | baef4b9 | src/utils/static.ts, test/security.test.ts | moderate: fix(static) refuse non-canonical pathname (81 lines + tests) |
| case-03 | 61b1548 | 3a57939 | src/utils/ws.ts, test/ws.test.ts | non-trivial: fix(ws) keep WebSocket hooks reachable (59 lines + 132 test) |
