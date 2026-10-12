# Tasks: Controller boards

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/controller.md, quickstart.md.
**Tests**: Tests first required by AGENTS and spec. Existing uncommitted 008–010 work must be preserved.

## Phase 1: Setup

- [x] T001 Verify pinned board facts and record decisions in specs/011-controller-boards/research.md (FR001/002/007/008).
- [x] T002 Verify existing .gitignore/.dockerignore and run spec-reviewer on specs/011-controller-boards/ before implementation.

## Phase 2: Foundational

- [x] T003 Write failing catalog and v4 migration tests in src/catalog/controller-boards.test.ts and src/storage/migrate-v4-to-v5.test.ts: all ids/maps/docs and board analog aliases, malformed legacy inputs, raw conversion, unknown ids and exclusive dropped field (FR001/002/007/009).
- [x] T004 Add typed catalog in src/catalog/controller-boards.ts, src/catalog/get-controller-board.ts; update src/domain/types.ts, src/storage/project-schema.ts, src/storage/migrate-project.ts, src/storage/migrate-v4-to-v5.ts, factory/preset/current-schema tests for v5. boardPin integer 0–31; droppedBoardPin nonempty string <=160; both cannot coexist (FR001/002/003/007/009).

## Phase 3: US1 — Choose and persist controller

Independent test: select all four boards, verify descriptions/docs/pins, saved state and history.

- [x] T005 [US1] Write failing selector tests in src/ui/schematic/controller-panel.test.tsx and src/ui/schematic/board-pin-select.test.tsx for labels, descriptions, usable-only pins, controlled change, used-pin suffix and invalid current option (FR001/002/010).
- [x] T006 [US1] Add src/ui/schematic/controller-panel.tsx to src/ui/schematic/schematic-workspace.tsx; update src/ui/schematic/board-pin-select.tsx and canvas/Bindings D labels; implement selected-board catalog lookup/commit integration in src/ui/project-state.ts. Controls remain native, Field errors described (FR001/002/003/010).

## Phase 4: US2 — Safe board changes

Independent test: same-family preservation, cross-family clearing, dropped issue focus, geometry and undo/redo/round trip.

- [x] T007 [US2] Write failing src/domain/change-controller.test.ts and src/domain/validate-controller-pins.test.ts and src/domain/validate-controller-bindings.test.ts for Bluetooth capability and family compatibility, no-op, unknown id, missing indices, metadata persistence/clear, unchanged geometry/bindings and endpoint paths (FR004/005/006/011).
- [x] T008 [US2] Implement src/domain/validate-controller-bindings.ts and src/domain/change-controller.ts and src/domain/validate-controller-pins.ts; integrate in src/domain/validate-shield-project.ts, src/domain/set-wire-end-board-pin.ts, and selected-board issues with existing src/ui/shell/workspace-issue.ts focus paths (FR004/005/006/011).
- [x] T009 [US2] Test and integrate undo/redo, autosave and JSON roundtrip for v1/v2/v3 fixture imports and changed/dropped projects in src/storage/parse-project-file.test.ts, src/ui/project-state.test.ts, src/ui/schematic/controller-panel.test.tsx and src/storage/migrate-v4-to-v5.test.ts; show previous labels and actionable error text in src/ui/schematic/board-pin-select.tsx (FR003/005/007/009/010).

## Phase 5: US3 — Export selected board

Independent test: full deterministic repository output for each board and invalid-project blocking.

- [x] T010 [US3] Author expected overlay/build.yaml for every board under tests/fixtures/generated/controllers/ with DIFFERENCES.md before implementation; write failing src/generators/controller-boards.test.ts, update expected baseline connector syntax tests in src/generators/generate-shield-files.test.ts (FR008/SC004).
- [x] T011 [US3] Pass connector through src/generators/generate-overlay.ts, src/generators/generate-shield-files.ts, src/generators/generate-repository-files.ts; wire selected board in src/ui/export/get-export-preview.ts and catalog default target in src/catalog/shield-target.ts (FR008).
- [x] T012 [US3] Add export regression assertions to src/ui/export/export-controller.test.tsx for selected XIAO board, incompatible Bluetooth actions and drops disabling download; run repository/ZIP golden tests with updated expected connector baseline (FR005/008/010).

## Phase 6: Final validation

- [x] T013 Run zmk-reviewer against catalog/generators and update docs/zmk/boards.md and docs/roadmap.md implementation notes; record automated accessibility coverage and unperformed manual checks in specs/011-controller-boards/validation.md.
- [x] T014 Run formatter, make check, production build and git diff --check; record results in specs/011-controller-boards/validation.md.

## Dependencies and parallel opportunities

T001→T002→T003→T004; US1 tests and US2 tests can be authored independently after foundation. US1 depends on T008 for commits; execute T007/T008 before T006 to integrate safely. US2 integration follows US1. US3 golden authorship can occur independently of UI; generation implementation requires foundation/selected board. T013/T014 follow all stories. No concurrent edits to shared type/schema/generator files.

## Implementation strategy

Deliver catalog/storage foundation, domain board switching, then native UI, then all selected-board exports. Test failures must be observed before corresponding implementation. MVP is US1 with the domain change prerequisite; continue all three stories under user's full-flow authorization. Review agents are read-only. No publication or automatic commit needed.
