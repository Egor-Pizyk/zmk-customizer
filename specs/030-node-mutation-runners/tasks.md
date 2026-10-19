# Tasks

- [x] Implement Node runners and focused runner contracts; preserve Python originals.
- [x] Run Node unit and browser mutations sequentially; inspect detection and restoration.
- [x] Run original Python runners afterwards with report observation; compare all seeds and failures.
- [x] After parity, switch Makefile, remove Python and document results.
- [x] Run final make check, production build and browser suite.

## Release maintenance — 2026-10-19

- [x] Restore the layer-target mutation anchor after the binding renderer refactor; add a preflight regression in tests/tooling/mutation-runners.test.mjs, run all 29 unit mutations alone, and record checks in verification.md. Preserved contract: original shifted-layer behavior probe and exact source restoration; no product changes.
