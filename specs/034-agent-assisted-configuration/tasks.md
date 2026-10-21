# Tasks: Agent-assisted configuration

**Input**: spec.md, plan.md, research.md and contracts/agent-package.md.

## US1 — Download current product knowledge

- [x] T001 [US1] [FR-002, FR-003] Write and observe failing source-parity/schema/determinism contracts in tests/unit/storage/agent/build-agent-package.test.ts.
- [x] T002 [US1] [FR-002, FR-003] Implement src/storage/project/get-project-json-schema.ts and src/storage/agent/build-agent-package.ts with current catalogs and package instructions; add public aliases/exports.
- [x] T003 [US1] [FR-001, FR-006, FR-007] Cover download, no project/history edits, failure/retry, busy and close in tests/unit/ui/integration/agent-package.test.ts; implement src/ui/shell/components/create-with-agent-dialog.tsx and project-bar/dialog wiring.
- [x] T004 [US1] [FR-001, FR-006, FR-007] Add real keyboard/download/focus/theme/reflow coverage in tests/e2e/agent-package.spec.ts and perform rendered UI review.

## US2 — Create and safely review complete projects

- [x] T005 [US2] [FR-004, FR-005] Assert prompt/guide boundaries and independently parse/analyze/export both examples in tests/unit/storage/agent/build-agent-package.test.ts before implementing example assembly and instructions in src/storage/agent/.
- [x] T006 [US2] [FR-005] Extend tests/e2e/agent-package.spec.ts to open the actual downloaded example through normal confirmation and download firmware configuration; preserve existing invalid-import/export gate coverage.

## Verification and completion

- [x] T007 Run staged npm run check:changed and diagnostic sensitivity test as applicable; record exact tree/logs/results in verification.md.
- [x] T008 Review with ui-ux-pro-max after implementation; fix findings and record rendered evidence in verification.md.
- [x] T009 Reconcile docs/roadmap.md, specs/README.md and task status; prepare one draft PR under docs/guidelines/git-flow.md (delivery evidence in the PR).
- [ ] T010 Perform required manual keyboard/screen-reader/OS acceptance from docs/testing.md; remains open until actual evidence is supplied (draft PR meanwhile).

## Dependencies

T001 → T002. T005 tests precede example/instruction implementation in T002. T003 tests precede its UI implementation. T004/T006 follow working UI/package; T007/T008 after implementation; T009 after checks. T010 requires a real manual environment. No worker parallelism needed for implementation; required spec-reviewer runs read-only before it. Independent review and test authoring can overlap without source edits.

## Requirement coverage

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001 / US1 navigation | T003–T004 | App + Playwright labeled action and modal | [journal](verification.md) |
| FR-002 / US1 package | T001–T002, T005 | ZIP paths, deterministic bytes, complete examples | [journal](verification.md) |
| FR-003 / US1/US2 current facts | T001–T002 | source identifier/schema parity, importer/analysis | [journal](verification.md) |
| FR-004 / US2 generation instructions | T005 | prompt/guide contract, example exports | [journal](verification.md) |
| FR-005 / US2 review | T005–T006 | real Open confirmation/export; existing malformed-file and invalid-export regressions | [journal](verification.md) |
| FR-006 / US1 failure/cancel | T003–T004 | denied download, lock, close, unchanged history/storage | [journal](verification.md) |
| FR-007 / US1 accessibility | T003–T004, T008, T010 | keyboard/focus/reflow/themes; separate manual limits | [journal](verification.md) |
