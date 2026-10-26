# Tasks: Rotary encoders

## Setup

- [x] T001 Verify pinned EC11 sources and record `docs/zmk/encoders.md`; resolve feature 019 and create spec/plan/contracts.

## US1 — Hardware (FR-001–003, FR-006, FR-008)

- [x] T002 [US1] Add failing immutable edit, limits, channel/terminal/manual wire conflict and controller retention tests in `tests/unit/domain/encoders/encoders.test.ts`.
- [x] T003 [US1] Implement encoder types/operations/validation in `src/domain/encoders/`, catalog in `src/catalog/encoders/`, analysis/controller/resource integration.
- [x] T004 [US1] Add failing schema migration, malformed/duplicate/map reference and round-trip tests in `tests/unit/storage/project/encoders.test.ts`, using an independent v10-format fixture.
- [x] T005 [US1] Implement `src/storage/project/encoder-schema.ts`, `src/storage/migrations/migrate-v10-to-v11.ts`, update current builders and metadata without rewriting historical fixtures.
- [x] T006 [US1] Add Schematic hardware editor/marker and problem focus in `src/ui/schematic/encoders/components/` and schematic rendering.

## US2 — Layer actions (FR-004–005, FR-008; depends on US1)

- [x] T007 [US2] Add failing per-layer identity, deletion cleanup and deleted action reference tests in `tests/unit/domain/encoders/encoders.test.ts`.
- [x] T008 [US2] Implement layer binding operations/collection and selected-layer rotation editor in `src/ui/bindings/encoders/components/`; integrate workspace issues.

## US3 — Export and lifecycle (FR-006–007; depends on US1/US2)

- [x] T009 [US3] Copy pinned Sofle upstream fixtures with provenance and hand-authored encoder goldens in `tests/fixtures/expected/encoders/`; add failing golden/no-encoder tests in `tests/unit/generators/encoders.test.ts`.
- [x] T010 [US3] Implement EC11/sensors/half enable/default output in `src/generators/shield/` and rotation output in `src/generators/keymap/`; add encoder projects to `scripts/generate-build-fixtures.mjs` and `infra/zmk-build.sh`.
- [x] T011 [US3] Add rendered integration and browser lifecycle/repair/export coverage in `tests/unit/ui/integration/app-encoders.test.ts` and `tests/e2e/encoders.spec.ts`.

## Completion

- [x] T012 Run spec-reviewer before implementation and zmk-reviewer after generators; record findings and resolutions in `specs/019-encoders/verification.md`.
- [x] T013 Run required static/unit/coverage/build/complete browser/three focused runs/cross-browser checks, controlled regression and firmware builds; record actual evidence in `specs/019-encoders/verification.md`.
- [ ] T014 Perform manual accessibility checklist from `docs/guidelines/frontend/accessibility.md`; keep unperformed items explicit in `specs/019-encoders/verification.md`.
- [x] T015 Update `docs/domain-model.md`, `docs/folder-structure.md`, `docs/roadmap.md`, `docs/zmk/README.md` and `specs/README.md` to reflect delivered scope and verified limits.

## Traceability

| Requirement | Tasks | Check / evidence |
|---|---|---|
| FR-001–003 | T002–T006 | domain encoders; integration; browser hardware/repair; verification.md |
| FR-004–005 | T007–T008 | domain layer lifecycle; browser selected layer/actions; verification.md |
| FR-006 | T004–T005, T011 | historical migration/schema/roundtrip; browser persistence/history/download; verification.md |
| FR-007 | T009–T010, T013 | independent goldens, no-encoder regression, firmware builds and ZIP bytes; verification.md |
| FR-008 | T006, T008, T011, T014 | labels/issues/keyboard/focus; manual limits; verification.md |

All steps are sequential; no parallel implementation planned. Automated checks do not establish physical encoder direction, manual screen-reader speech or full hardware operation.

## Parts organization follow-up (FR-009–011)

- [x] T016 Amend artifacts; move Encoders under Parts and make Keys/Encoders independently collapsible, preserving controls and updating onboarding (FR-009–011).
- [x] T017 Add app/browser folding/add/edit/delete/history/nested-repair coverage and update existing editor journeys; inspect rendered themes/reflow (FR-009–011), evidence in parts-verification.md.
- [ ] T018 Run staged changed checks, inspect diff and update existing draft PR #29; disclose manual limits (FR-009–011).
