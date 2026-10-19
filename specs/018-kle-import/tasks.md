# Tasks: KLE layout import

**Input**: spec.md, plan.md, research.md, contracts/import.md.

## US1 — Reuse an existing layout

- [x] T001 [US1] [FR-001, FR-002] Write all storage contracts (including T005 malformed/types/limits/decals/warnings/read failures) before T002, with independent preset/cluster fixtures in tests/fixtures/kle/ and failing contracts in tests/unit/storage/kle/parse-kle-layout.test.ts; observe red.
- [x] T002 [US1] [FR-001, FR-002, FR-003] Implement src/storage/kle/ schema/decoder/parser and public alias in tsconfig.json.
- [x] T003 [US1] [FR-005, FR-006] Write failing immutable/history/round-trip tests in tests/unit/domain/project/replace-project-layout.test.ts, then implement src/domain/project/replace-project-layout.ts and index export.
- [x] T004 [US1] [FR-005, FR-007] Add src/ui/schematic/layout/logic/use-kle-import.ts and components/kle-import.tsx; integrate Schematic, cover review/apply/undo/save in tests/unit/ui/integration/app-kle-import.test.ts.

## US2 — Recover safely

- [x] T005 [US2] [FR-003, FR-004] Test malformed/types/limits/decals/warnings and failed reads in tests/unit/storage/kle/parse-kle-layout.test.ts; implement src/storage/kle/read-kle-file.ts and rejection paths.
- [x] T006 [US2] [FR-005, FR-007] Cover cancellation, project-change invalidation, superseded reads and retry in tests/unit/ui/integration/app-kle-import.test.ts; implement guards in use-kle-import.ts.
- [x] T007 [US1] [FR-006, FR-007] Add tests/e2e/kle-import.spec.ts with visible imported keys, saved/downloaded geometry, cancellation, undo/redo and malformed retry; include native-input focus cases across browsers.

## Verification and completion

- [ ] T008 Run make check, production build, full browser suite and changed browser scenarios three times; prove behavioral test sensitivity with controlled mutation. Record commands/results/limits in specs/018-kle-import/verification.md. Preserve assertions while narrowing project-file inputs in tests/unit/ui/integration/app-{files,project-files}.test.ts and making existing native select-all/undo shortcuts platform-aware in tests/e2e/accessibility.spec.ts for host verification; wait for the existing deferred post-deletion focus in tests/unit/ui/integration/app-layout.test.ts before the next keyboard scenario.
- [x] T009 Reconcile requirement evidence and task status in tasks.md; update docs/roadmap.md, docs/folder-structure.md and specs/README.md.
- [ ] T010 Perform manual accessibility checklist in docs/guidelines/frontend/accessibility.md; record any unavailable manual checks in verification.md and leave this task open.

## Dependencies

T001 → T002; T003 tests before operation; T002+T003 → T004; T005 test portion executes with T001 before T002; T005 implementation follows red; T004 → T006 → T007 → T008 → T009. Independent storage/domain contracts can run in parallel, but mutations run alone. T010 requires human/native accessibility inspection; terminal browser checks do not substitute for it.

## Requirement coverage

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001, FR-002 / US1 | T001–T002 | preset and exact cluster geometry storage contracts | [verification.md](verification.md) |
| FR-003, FR-004 / US2 | T002, T005 | ignored-feature warnings, invalid input/limits/read failure | [verification.md](verification.md) |
| FR-005 / US1–US2 | T003–T004, T006 | frozen project, one-step history, stale/cancel races | [verification.md](verification.md) |
| FR-006 / US1 | T003–T004, T007 | round trip, saved/exported JSON, unwired export blocked | [verification.md](verification.md) |
| FR-007 / US1–US2 | T004, T006–T008, T010 | labeled native input/review, announcements, browser keyboard | [verification.md](verification.md) |

## Outstanding gates (2026-10-19)

T008: final complete check/coverage passed (1165 tests); changed browser journeys passed three times (30/30), and geometry mutation was detected. Full browser suite is 127/134: existing rotated-preview baseline mismatch and six macOS WebKit Bindings click-focus assertions remain. See verification.md; references/assertions were not relaxed. T010 remains unperformed.
