# Tasks: Project creation and automatic wiring

## Foundation

- [x] T001 Specify agreed behavior and UI guidance in specs/032-project-creation-and-auto-wiring/spec.md; resolve feature and inspect tree.
- [x] T002 Reconcile owning 013/031 contracts before code; analyze spec/plan/tasks and project-specific review before code in specs/032-project-creation-and-auto-wiring/.

## US1 — Start a project

- [x] T003 [US1] [FR-001,FR-002,FR-003] Add creation and old-file acceptance checks in tests/unit/ui/integration/presets.test.ts and tests/e2e/presets.spec.ts and tests/e2e/project-creation.spec.ts.
- [x] T004 [US1] [FR-001,FR-002,FR-003] Implement three equal actions in src/ui/shell/components/preset-picker.tsx and project-dialogs.tsx; remove six-key creation API from src/ui/project/logic/.
- [x] T005 [US1] [FR-002] Relocate historical six-key data from src/catalog/presets/ to tests/helpers/ and update test/build fixture consumers; remove obsolete domain clone operation.

## US2 — Review automatic pins

- [x] T006 [US2] [FR-004,FR-005,FR-007] Add exact retained/replaced net and failing allocation contracts in tests/unit/domain/wiring/editing/auto-wiring.test.ts; verify intended failures.
- [x] T007 [US2] [FR-004,FR-005] Implement src/domain/wiring/editing/assign-auto-pins.ts and integrate edit-wiring.ts only for explicit Auto assign.
- [x] T008 [US2] [FR-007,FR-008] Explain proposed GPIOs in src/ui/schematic/wiring/ and add real preview/Apply/Cancel/history/reload/export coverage in tests/e2e/wiring.spec.ts.

## US3 — Outward outputs

- [x] T009 [US3] [FR-005,FR-006,FR-007] Add failing rotated/unibody/split/Corne/Lily58 endpoint and label-clearance contracts in tests/unit/domain/wiring/editing/auto-wiring.test.ts.
- [x] T010 [US3] [FR-006,FR-007] Implement per-half placement in src/domain/wiring/editing/get-output-position.ts and route-wiring.ts, retaining electrical/resource proof.

## Verification and completion

- [x] T011 Reinvoke UI/UX guidance, inspect isolated rendered UI and record findings in specs/032-project-creation-and-auto-wiring/verification.md.
- [x] T012 Run make check, build, full E2E, changed tests three times, controlled sensitivity and make zmk-build; record actual results/limits in specs/032-project-creation-and-auto-wiring/verification.md.
- [x] T013 Verify final consistency of specs/013-matrix-wiring-editor/contracts/wiring.md and specs/031-keyboard-presets/spec.md with 032 and update specs/README.md/docs/roadmap.md without including pre-existing edits.
- [x] T014 Re-read docs/guidelines/git-flow.md and prepare the scoped diff, release:minor PR description and local verification evidence; delivery gates are tracked by the PR checks and final delivery report.

- [x] T015 Complete the required manual accessibility pass (keyboard, VoiceOver/Safari, OS theme/reduced motion and zoom) before marking the feature done. Automated browser evidence does not replace it. On 2026-10-20 the user chose to perform this pass personally; User confirmed on 2026-10-20: “проверил, все ок”; manual acceptance is complete.

## Dependencies

T001→T002 before production. T003→T004→T005 for US1. T006→T007 before automatic allocation. T009→T010 before new routing; T008 combines US2/US3. T011–T014 after implementation. Independent tests may be authored in parallel; execution remains sequential to avoid shared-tree/runner conflicts.

## Requirement coverage

| Requirement | Tasks | Check | Evidence |
|---|---|---|---|
| FR-001,FR-003 | T003,T004,T011,T012 | Creation labels/order/dimensions, keyboard/Escape/focus, themes/reflow | verification.md |
| FR-002 | T003,T005,T012 | Existing fixture import/export and absence of shipped starter | verification.md |
| FR-004,FR-005 | T006,T007,T009,T010,T012 | Exact free GPIOs, invalid/duplicate/capacity refusal, independent halves | verification.md |
| FR-006 | T009,T010,T011,T012 | Rotated corner/output label clearance, real rendered preview | verification.md |
| FR-007,FR-008 | T006,T008,T009,T010,T012 | Proposal copy, unchanged preview storage, Apply/history/reload/JSON/ZIP | verification.md |

Git delivery follows local completion: push the scoped commit, open a main-based PR, require all five final-head checks, then verify squash merge and its release. External delivery evidence belongs to the PR/final report, avoiding a self-referential verification commit. Manual acceptance was reported passed by the user on 2026-10-20; see verification.md.

## Manual acceptance handoff (T015)

Use the production app with an existing saved project backed up. Follow the complete accessibility checklist in `docs/guidelines/frontend/accessibility.md`, scoped to the changed flows:

1. Keyboard: open New; inspect preset and QWERTY/empty choices; Tab through Create/Empty/Cancel; Escape and Cancel preserve data and return focus. Create an empty and a preset project.
2. Import the saved circuit or create a macropad. Auto assign proposes GPIOs; inspect outputs with canvas pan/zoom. Cancel preserves saved state; Apply changes it once; Undo/Redo restores it. Check a capacity/conflict error is readable and leaves the project unchanged.
3. VoiceOver/Safari: verify workspace headings, key names, action names, focus changes and status/error announcements without duplicate speech.
4. OS theme/reduced motion and 200% zoom: inspect both themes, visible/unobscured focus, readable actions and absence of horizontal page overflow. No new color-token pairs were introduced.

Record actual pass/fail observations here or in PR #13. Do not check T015 merely because automated CI is green.
