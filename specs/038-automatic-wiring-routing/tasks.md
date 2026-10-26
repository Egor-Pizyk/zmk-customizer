# Tasks: Automatic wiring with grouped outputs

## Setup/foundation

- [x] T001 Specify/design and analyze feature artifacts in specs/038-automatic-wiring-routing/ (FR-001–006).

## US1 — Local connected lines

- [x] T002 [US1] Add tests-first net/length/determinism/rotation/refusal contracts in tests/unit/domain/wiring/editing/matrix-routing.test.ts (FR-001/002/004/005).
- [x] T003 [US1] Implement pure tree router and safe candidate paths in src/domain/wiring/editing/{route-matrix-wiring,find-matrix-route,get-route-path-cost,get-matrix-route-context,route-matrix-tree}.ts; integrate edit-wiring.ts (FR-001/002/004/005).

## US2 — Two output blocks

- [x] T004 [US2] Add tests-first aligned/split/clearance/output-count cases in tests/unit/domain/wiring/editing/matrix-routing.test.ts (FR-003).
- [x] T005 [US2] Implement src/domain/wiring/editing/get-grouped-output-positions.ts and update superseded matrix output tests/contracts in tests/unit/domain/wiring/editing/auto-wiring-outputs.test.ts and specs/032-project-creation-and-auto-wiring/spec.md (FR-003).

## US3 — Preview and delivery

- [x] T006 [US3] Update Wiring/onboarding explanation in src/ui/schematic/wiring/components/wiring-controls.tsx and src/ui/onboarding/logic/onboarding-steps.ts; render outward labels in src/ui/canvas/logic/get-board-pin-labels.ts and src/ui/schematic/rendering/components/schematic-screen-layer.tsx; E2E tests/e2e/matrix-routing.spec.ts covers actual preview/Cancel/Apply/history/persistence/download (FR-005/006).
- [x] T007 Review real rendered output groups and keyboard behavior; record findings and exact changed/full-check receipts in specs/038-automatic-wiring-routing/verification.md (FR-001–006).
- [x] T008 Update docs/roadmap.md, specs/README.md, inspect final selected diff and update existing PR for user-requested branch (FR-001–006).

## Dependencies / strategy

T001 → T002 → T003; T004 precedes T005, then T006 → T007 → T008. T002/T004 tests can be authored together; run mutation/verification sequentially with no concurrent browser output directories. Start with macropad, then irregular/split and failure cases. Requirement → task → check above; verification.md holds one evidence journal, avoiding duplicate receipts.

## Output placement refinement

- [x] T009 Tests first: equal 1u row/top and column/side gaps, exterior split columns, upward row lead geometry and obstacle clearance (FR-002/003).
- [x] T010 Implement independent top/side placement, upward label layout and safe vertical row output leads (FR-002/003/006).
- [x] T011 Review rendered themes/viewports and preview/history; run changed checks and update PR/evidence (FR-005/006).

Analysis: this supersedes only 038 output placement, leaves cells/GPIO/schema/history unchanged, and preserves atomic refusal when geometry is infeasible. T009 → T010 → T011.

## Straight and separate routes

- [x] T012 Tests first: direct local lines on aligned grids and no positive-length wire overlap, including same-net/output-lead overlaps (FR-001/002/004).
- [x] T013 Build key trees before outputs, prefer valid direct aligned paths, and forbid shared wire sections while allowing intended key-contact joins (FR-001/002/004).
- [ ] T014 Review rendered layouts/themes and preview/history, run changed checks and update journal/PR (FR-005/006).
