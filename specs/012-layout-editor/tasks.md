# Tasks: Layout editor

Input: spec.md, plan.md, research.md, data-model.md, contracts/layout.md, quickstart.md.

## Phase 1 — Setup and gates

- [x] T001 Audit existing operations and contracts; create artifacts in specs/012-layout-editor/ on isolated branch.
- [x] T002 Run consistency analysis and project-specific spec-reviewer; record resolution in specs/012-layout-editor/analysis.md before feature code.

## Phase 2 — Foundation

- [x] T003 Write failing geometry/migration tests in src/domain/get-key-geometry.test.ts, get-key-corners.test.ts, get-key-pin-position.test.ts, is-key-position-free.test.ts, find-key-layout-center.test.ts and src/storage/migrate-v5-to-v6.test.ts; test default 1u/0°, transformed pins, edge contact, invalid cells and old round-trip.
- [x] T004 Implement pure geometry and schema v6/migration in src/domain/types.ts, get-key-geometry.ts, rotate-point.ts, get-key-corners.ts, get-key-center.ts, do-polygons-overlap.ts, get-key-pin-position.ts and src/storage/project-schema.ts, migrate-v5-to-v6.ts, migrate-project.ts; keep finite invalid cells repairable and preserve existing budgets/IDs.

## Phase 3 — US1 geometry editing (MVP)

- [x] T005 [US1] Write failing batch geometry/move/no-op/validation tests in src/domain/set-key-geometries.test.ts, move-keys.test.ts, validate-key-geometry.test.ts; ensure no mutation, bindings/diode/wire references retained, origin translated, batch crossing cleanup and rounded int16/positive cells.
- [x] T006 [US1] Implement src/domain/set-key-geometries.ts, move-keys.ts, validate-key-geometry.ts; integrate rotated collision in is-key-position-free.ts, schematic overlaps and single project analysis; update find-key-layout-center.ts.
- [x] T007 [US1] Write real App geometry/history/persistence/preview tests in src/ui/app-layout.test.ts before UI work.
- [x] T008 [US1] Extend numeric fields in src/ui/schematic/key-position-cells.tsx and selected-layout tool controls with local preview/apply/cancel in src/ui/schematic/layout-controls.tsx and schematic-workspace.tsx; one Apply commit, no stale preview after base changes.
- [x] T009 [US1] Render dimensions/rotation in src/ui/schematic/key-art.tsx, key-shape.tsx, src/ui/bindings/keycap-shape.tsx; transform switch center/pins/diode anchors consistently; update accessible geometry names in format-schematic-labels.ts.

## Phase 4 — US2 organization

- [x] T010 [US2] Write failing duplicate/renumber/delete contracts in src/domain/duplicate-keys.test.ts, renumber-keys.test.ts, remove-keys.test.ts and add-key.test.ts; IDs exact, 512 budget atomic, layers/diodes copied without wires, rotated center sort stable and no-op identity.
- [x] T011 [US2] Implement src/domain/duplicate-keys.ts, renumber-keys.ts, remove-keys.ts and cap-aware add-key.ts; update all creation callers with PROJECT_BUDGET.keys argument.
- [x] T012 [US2] Add behavioral multi-selection/duplicate/delete/renumber UI tests in src/ui/app-layout.test.ts and table selection/actions in src/ui/schematic/parts-keys-table.tsx; reuse existing delete focus contract.

## Phase 5 — US3 keyboard and export

- [x] T013 [US3] Write behavioral selected-cluster nudge/toggle, native numeric arrows/Escape, rotated marquee/navigation tests in src/ui/app-layout.test.ts, src/ui/canvas/marquee-select.test.ts, find-nearest-key.test.ts and geometry tests.
- [x] T014 [US3] Extend src/ui/schematic/use-key-keyboard.ts, use-schematic-keyboard.ts, schematic-workspace.tsx, pointer-select.ts and pointer-preview.ts; multi-nudge one step, accurate collision, origin translation, shared rotated marquee/center navigation and scoped shortcut help in src/ui/shortcuts.ts.
- [x] T015 [US3] Write independent seven-cell golden and deterministic tests in src/generators/layout-export.test.ts and tests/fixtures/generated/layout/; document differences in DIFFERENCES.md; include delete→export regression with n−1 bindings/transform/physical entries in matching order; observe failure before generator change.
- [x] T016 [US3] Emit seven physical attrs in src/generators/generate-overlay.ts using docs/zmk/physical-layout.md; run ZMK reviewer before commit.
- [x] T017 [US3] Extend scripts/generate-build-fixtures.mjs with valid actual-export nonstandard sized/rotated target while retaining eight board/direction targets; verify emitted geometry and matrix contracts.

## Phase 6 — Verification

- [x] T018 Run formatter, relevant regression tests and production build; fix failures within scope; record in specs/012-layout-editor/verification.md.
- [x] T019 Run make zmk-build, including nonstandard geometry; record actual pinned firmware compilation result in specs/012-layout-editor/verification.md.
- [x] T020 Run make test-mutations alone after production edits; record sensitivity in specs/012-layout-editor/verification.md.
- [x] T021 Complete review, record limitations and remaining manual accessibility checks in specs/012-layout-editor/verification.md; run final make check and commit Conventional Commits (no push/PR).

## Dependencies and delivery

T001→T002→T003→T004→T005→T006. US1 T007→T008→T009 proves editable geometry. US2 T010→T011→T012 builds organization on geometry. US3 T013→T014; T015→T016→T017 establishes firmware correctness. T018→T019→T020→T021 completes checks. Every implementation task follows its failing contract tests. All user stories integrated before completion, no stop after MVP.

## Parallel opportunities

Read-only review/research can run independently. Within US1 UI tests and domain tests can be authored in separate files after contracts are fixed; within US2 operation test files are independent; within US3 golden fixture review and accessibility test review are independent. Execute production edits sequentially to protect shared files and mutation checks. No deployment.

## Follow-up — direct canvas manipulation

- [x] T022 Update scenarios/design, analyze follow-up consistency and complete spec review before implementation.
- [x] T023 Write failing pure domain pointer resize/rotate contracts; implement snapped positive dimensions, rotated fixed anchors, center pivot/no-op and reference preservation.
- [x] T024 Write real App failing live-number and pointer feedback/history/cancel tests before UI changes.
- [x] T025 Implement thin screen-space frame, eight sides/corners and exterior corner rotation targets; intercept pointer gestures with immutable transient preview and one commit, preserve existing gestures and stale/cancel handling.
- [x] T026 Collapse precise controls and auto-preview numeric changes; keep accessible table/actions and simplify redundant Preview controls.
- [x] T027 Run full make check/coverage, production build and actual ZMK builds; run mutations separately after production edits; record results and commit without push/PR.

Dependencies: T022 → T023 → T024 → T025 → T026 → T027. No schema/output change; prior migrations/goldens remain regression gates.

## Standard keycap sizes follow-up (2026-10-21)

- [x] K001 Resolve 012/004 ownership, dedicated branch, source references and pre-implementation UI/UX/specification; amend affected contracts and analyze consistency.
- [x] K002 FR-018/019: failing domain tests, then finite catalog and pure center-preserving batch size operation.
- [x] K003 FR-017/020: contextual canvas/keyboard chooser and labeled table alternative; shared captured targets/base, current/custom/mixed feedback and focus return.
- [x] K004 FR-017–020: real browser coverage for pointer/keyboard/table, history, persistence/JSON/export, rotated geometry, overlaps/custom sizes, themes/reflow; prove behavioral regression sensitivity.
- [x] K005 Post-implementation UI/UX guidance rendered review, changed checks and single [verification journal](standard-keycap-verification.md); update roadmap and deliver one PR.
- [x] K006 Actual manual OS keyboard/screen-reader/200% zoom acceptance; user-reported acceptance recorded in the verification journal.

Dependencies: K001 → K002 tests → K002 implementation → K003 → K004 → K005; K006 requires actual manual evidence. No historical feature checks are reclassified as current evidence.

## Switch sizing correction

- [x] S001 FR-021: failing UI regression for absent resize controls, retained rotation and keycap sizing.
- [x] S002 FR-021: remove Schematic size controls only; preserve data/domain/output.
- [x] S003 FR-021: update superseded UI journeys, post-skill rendered review and changed checks; record [evidence](switch-sizing-verification.md).

- [x] S004 FR-021: actual OS keyboard/screen-reader/native 200% zoom acceptance (draft delivery; UX-SS-03).

- [x] S005 FR-015: reproduce PR #21 Firefox/WebKit exact-angle failure; use native Shift snapping in the cancellation/history journey, verify all rotation journeys across engines and changed checks; update the existing PR. Evidence: [switch sizing journal](switch-sizing-verification.md).

K006/S004 closure: user-reported manual acceptance on 2026-10-21; see the dated addenda in the two linked verification journals. No agent-observed manual rerun is claimed.
