# Tasks: Keyboard presets

## US1 — Choose a layout

- [x] T001 [US1] [FR-001–004,006] Add failing domain/catalog contracts in tests/unit/domain/project/create-layout-preset-project.test.ts; verify red.
- [x] T002 [US1] [FR-001–004,006] Add preset types/creation to src/domain/project/ and static entries to src/catalog/presets/; verify counts, keycodes and immutable storage round trips.
- [x] T003 [US1] [FR-002,003,007] Add src/ui/shell/components/preset-picker.tsx and preset-preview.tsx, compose in project-dialogs.tsx; extend Dialog with wide size and scrolling.

## US2 — Keep and continue work

- [x] T004 [US2] [FR-005,006] Add rendered regression coverage in tests/unit/ui/integration/presets.test.ts and explicit creation in src/ui/project/logic/project-file-actions.ts; preserve starter and New history contract.
- [x] T005 [US2] [FR-002–007] Add tests/e2e/presets.spec.ts for native keyboard selection/focus, preview/cancel, save/import/reload, edit Undo/Redo, incomplete ZIP guard and starter export.

## Verification and completion

- [x] T006 Run make check, production build, full E2E, make zmk-build, three sequential preset runs and controlled saved-half mutation; record results/limits in specs/031-keyboard-presets/verification.md.
- [x] T007 Reconcile docs/roadmap.md, spec status and requirement evidence in tasks.md; keep pre-existing roadmap edits.
- [ ] T008 Perform manual accessibility checklist in docs/guidelines/frontend/accessibility.md; record any unperformed checks explicitly in verification.md.

## Dependencies

T001 → T002 → T003 → T004 → T005 → T006 → T007. T008 follows UI completion. No new setup/dependencies. Catalog static geometry and test scenario authoring can be reviewed independently; shared-file changes remain sequential. MVP is US1 plus safe replacement from US2; full delivery includes all checks.

Manual T008 remains unperformed; automated results and limits are explicit in [verification.md](verification.md).

## Requirement coverage

| Requirement / scenario | Tasks | Test/check | Evidence |
|---|---|---|---|
| FR-001 / SC-001 | T001,T002 | exact preset names/counts, source anchors | verification.md |
| FR-002 / SC-001 | T001–003,T005 | preview and saved geometry/half agreement | verification.md |
| FR-003 / SC-003 | T001–003,T005 | QWERTY keycodes, empty mode, limitations | verification.md |
| FR-004 / SC-003 | T001,T002,T005 | retained controller, reset fields, wiring ZIP guard | verification.md |
| FR-005 / SC-002 | T004,T005 | cancel preserves data/history, replace resets, starter | verification.md |
| FR-006 / SC-002 | T001,T004–006 | JSON round trips, reload, edit history, starter ZIP | verification.md |
| FR-007 / SC-004 | T003,T005,T008 | native keyboard/focus, geometry details, narrow dialog | verification.md |
