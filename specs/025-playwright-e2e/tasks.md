# Tasks: Real browser behavioral coverage

## Setup and foundation

- [x] T001 Record tooling ADR and isolated production browser runner in package.json, playwright.config.ts, tsconfig.e2e.json, Dockerfile.e2e, compose.e2e.yaml.
- [x] T002 Add UI-import fixtures, read-only saved/geometry and actual download observations in tests/e2e/helpers.ts.

## US1 — Physical layout (P0)

- [x] T003 [US1] Author real eight-direction resize and four-corner rotation, rotated-anchor tests in tests/e2e/layout-gestures.spec.ts.
- [x] T004 [US1] Add snapping, pan/zoom, preview/history/cancel/stale/overlap tests in tests/e2e/layout-gestures.spec.ts.
- [x] T005 [US1] Add numeric stages/cancel, identity duplicate/delete/renumber, matching workspaces/reload/export tests in tests/e2e/layout-data.spec.ts.
- [x] T006 [US1] Reproduce failures before narrowly repairing owning src/ui files; record failing assertion and cause in specs/025-playwright-e2e/verification.md.
- [x] T007 [US1] Inspect and accept focused rotated paint references in tests/e2e and record tolerances/review evidence.

## US2 — Product journeys

- [x] T008 [US2] Add new/layout/wiring/bindings/export and problem navigation journeys in tests/e2e/product.spec.ts.
- [x] T009 [US2] Add layers, actual JSON roundtrip/reload and malformed import protection in tests/e2e/product.spec.ts.

## US3 — Keyboard and diagnostics

- [x] T010 [US3] Add keyboard table/property and native dialog focus tests in tests/e2e/accessibility.spec.ts.
- [x] T011 [US3] Add and separately run six byte-restored seeds in scripts/check-e2e-mutations.py.

## Verification and delivery

- [x] T012 Wire documented commands and mandatory CI with retained artifacts in Makefile, docs/testing.md, .github/workflows/ci.yml.
- [x] T013 Complete specs/025-playwright-e2e/coverage-matrix.md and verification.md with scenario mapping, make check/build, all E2E, three sequential Chromium runs, cross-browser and conditional ZMK build results.
- [ ] T014 Review diff and commit logical changes with Conventional Commits; no push/PR.

## Dependencies and implementation strategy

T001 → T002 → US1 tests → repairs; US2/US3 reuse foundation. T011 runs alone after production edits, followed by T013. MVP is US1 but requested delivery includes all stories. Independent test checkpoint per story. Parallel examples: after foundation, product/accessibility test authoring could be separate files; this execution remains serial except read-only planning research. No concurrent mutation runs or production edits.
