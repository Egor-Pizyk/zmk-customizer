# Tasks: Shield generators

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/generation.md.
**Tests**: Required tests first; run and record failures before implementation.

## Phase 1: Setup

- [x] T001 Read project rules/current 008, verify pinned ZMK sources and baseline `make check`; preserve existing work.
- [x] T002 Complete specify → clarify → plan → tasks → analyze and spec-reviewer for specs/009-shield-generators before feature code.

## Phase 2: Foundation / blockers (US2)

Goal: a pure matrix and stable actionable errors. Independent test: both diode directions, disconnected parts and odd cycle.

- [x] T003 [US2] Write failing tests in src/domain/derive-shield-matrix.test.ts and src/domain/validate-shield-project.test.ts for graph orientation/order, cells, diode attachment/polarity, mixed directions, odd cycles, missing diodes/empty, unsupported GPIO, existing electrical blockers, unused nets, escaping restrictions, layer/geometry limits; use tests/helpers/build-matrix-project.ts.
- [x] T004 [US2] Add src/catalog/shield-target.ts, src/domain/derive-shield-matrix.ts and src/domain/validate-shield-project.ts; extend issue codes in src/domain/types.ts without schema change.

## Phase 3: Generate complete shield (US1, P1)

Goal: five correct deterministic files. Independent test: exact golden comparisons plus layer reorder/all kinds.

- [x] T005 [US1] Independently author approved five golden files at tests/fixtures/generated/unibody/ and DIFFERENCES.md against verbatim Reviung41; write failing src/generators/generate-shield-files.test.ts for all files, all kinds, custom deduplication, reordered layers/keys, both diode directions, negative positions, escaping, missing &none and repeated-byte/newline stability.
- [x] T006 [US1] Implement src/generators/generate-kconfig-shield.ts, generate-kconfig-defconfig.ts and generate-conf.ts with verified escaping.
- [x] T007 [US1] Implement src/generators/generate-overlay.ts and rendering functions for kscan/matrix-transform/physical-layout.
- [x] T008 [US1] Implement src/generators/generate-keymap.ts and binding/stroke/custom behavior renderers; layer ids resolve to indices, semantic definitions deduplicate in first-use order.
- [x] T009 [US1] Implement src/generators/generate-shield-files.ts aggregate; run golden/domain tests and fix against approved contracts.

## Phase 4: Complete preset (US3, P2)

Goal: New yields a complete project. Independent test: schema roundtrip, no issues, matching golden, fresh immutable replacement.

- [x] T010 [US3] Write failing src/domain/create-preset-project.test.ts and src/ui/project-file-actions.test.ts covering preset validation/schema roundtrip/history/save and empty New.
- [x] T011 [US3] Bundle src/catalog/unibody-preset.ts, implement src/domain/create-preset-project.ts, add New preset action in src/ui/project-file-actions.ts and choice in src/ui/shell/project-dialogs.tsx.

## Phase 5: Preview and integration (US1/US2)

Goal: readonly files or linked blockers; same shared problems/badges. Independent test: valid→invalid→undo restores output.

- [x] T012 [US1] [US2] Write failing src/ui/export/export-workspace.test.tsx for five labelled readonly sections, target explanation, issue links, zero stale files and recovery.
- [x] T013 [US1] [US2] Integrate validation in src/ui/project-state.ts, map issues in src/ui/shell/workspace-issue.ts, implement src/ui/export/export-workspace.tsx using existing navigation/focus; no business rules in UI.

## Phase 6: Review and verification

- [x] T014 Run zmk-reviewer against src/generators, catalog, expected fixtures and specs; resolve every finding and add regression tests where needed.
- [x] T015 Run available quickstart checks, attempt browser verification (record environment blockers), formatter and production app build; update specs/009-shield-generators validation record and docs/roadmap.md status with actual evidence and limitations.
- [x] T016 Run `make check` and fix all failures. Mark completed tasks only after checks; no commit/publish.

## Dependencies & Execution Order

T001→T002→T003→T004→T005→T006–T008→T009→T010→T011→T012→T013→T014→T015→T016.
US2 supplies validated input for US1. US3 independently validates its project and integrates with generation. Preview connects all stories after pure functions pass.

## Parallel Opportunities

Independent read-only source research can run during planning. T006/T007/T008 are independent files once T005 tests exist; no parallel edits to shared files. User explicitly requested the two review agents; implementation remains sequential to preserve tests-first checkpoints.

## Implementation Strategy

Establish electrical and validation contract first; watch domain tests fail then pass. Author golden expectations independently before generator implementation. Add bundled preset and history flow, then preview and shared issues. Finish reviewer fixes and required make check. No firmware build claim without actual firmware build.
