# Tasks: Combos, macros and conditional layers

**Input**: spec.md, plan.md, data-model.md, research.md and contracts/keymap.md.

## Foundation

- [x] T001 Resolve requested 017 and read routed context; record scope/source research in specs/017-combos-macros-conditional-layers/plan.md and research.md.
- [x] T002 Analyze specs/017-combos-macros-conditional-layers/{spec,plan,tasks}.md and run the roadmap spec reviewer; resolve blockers.
- [x] T003 [FR-007] Write/run failing v9 compatibility/strict bounds/round-trip contracts in tests/unit/storage/project/advanced-keymap.test.ts with tests/fixtures/project/v9-advanced-legacy.json.
- [x] T004 [FR-007] Add typed arrays and macro Binding in src/domain/advanced-keymap-types.ts and src/domain/types.ts; strict schemas in src/storage/project/advanced-keymap-schema.ts and v9→v10 migration in src/storage/migrations/migrate-v9-to-v10.ts. Update creation/presets/current-version test expectations without altering historical inputs.

## US1 — Combo identity and action

- [x] T005 [US1] [FR-001,FR-002] Write/run failing immutable CRUD, 2–20 distinct key IDs, timeout 1–5000 ms, filter/deletion/reorder contracts in tests/unit/domain/advanced-keymap/combos.test.ts.
- [x] T006 [US1] [FR-001,FR-002,FR-008] Implement domain combo edits/validation in src/domain/advanced-keymap/ and typed combo editor in src/ui/bindings/advanced/{components,logic}/ with labeled checkboxes and layout selection/capture buttons.

## US2 — Macro sequence and references

- [x] T007 [US2] [FR-003,FR-004] Write/run failing macro CRUD/step reorder/reference/cycle/timing/budget contracts in tests/unit/domain/advanced-keymap/macros.test.ts; assert 1–64 stable steps, whole 0–5000 ms, ≤256 expanded DT bindings and ≤64 conservative queue events.
- [x] T008 [US2] [FR-003,FR-004,FR-008] Implement macro/step edits, ID reservation and combined reference validation in src/domain/advanced-keymap/; integrate macro picker/action/legends/clipboard in src/ui/bindings/ and typed step controls in src/ui/bindings/advanced/.

## US3 — Conditional activation

- [x] T009 [US3] [FR-005] Write/run failing conditional layer identity/chain/deletion/ordering/cycle/duplicate-target contracts in tests/unit/domain/advanced-keymap/conditional-layers.test.ts.
- [x] T010 [US3] [FR-005,FR-008] Implement conditional rule operations/validation in src/domain/advanced-keymap/ and labeled editor in src/ui/bindings/advanced/components/conditional-layer-editor.tsx; compose analysis and workspace issue routing.

## Shared export and interaction

- [x] T011 [US1] [FR-006] Write/run independent failing golden tests in tests/unit/generators/keymap/advanced-keymap.test.ts using tests/fixtures/expected/advanced-keymap/ for combos, macros/pause encoding and conditional rules, including nested actions and reordered positions/layers.
- [x] T012 [US1] [FR-006] Implement sorted nonempty sections, labels, complete action/header/inline-node collection in src/generators/keymap/; add advanced target to scripts/generate-build-fixtures.mjs.
- [x] T013 [US1] [FR-001–FR-008] Add UI flows in tests/unit/ui/integration/app-advanced-keymap.test.ts and real browser coverage in tests/e2e/advanced-keymap.spec.ts for all three editors, keyboard alternatives, saved/downloaded JSON/ZIP, key/layer deletion/reorder, problem focus and Undo/Redo.
- [x] T014 [US1] [FR-006,FR-008] Run roadmap ZMK reviewer for src/generators/keymap/ and src/catalog/bindings/ changes; resolve findings.

## Verification and completion

- [x] T015 Run make check, production build, full browser suite, three sequential changed-journey runs without retries, controlled behavioral mutation separately and make zmk-build. Record scenario → risk → existing coverage → new E2E → visible assertion → saved/exported assertion, results and limits in specs/017-combos-macros-conditional-layers/verification.md.
- [x] T016 Reconcile docs/domain-model.md, docs/folder-structure.md, docs/roadmap.md, specs/README.md and accurate requirements/tasks/evidence in specs/017-combos-macros-conditional-layers/tasks.md.

## Dependencies

T002 precedes implementation. T003 precedes T004; T005 precedes T006; T007 precedes T008; T009 precedes T010; T011 precedes T012. UI integration follows domain/schema/generator work. T013/T014 precede completion gates. Independent test authoring can be parallelized conceptually; production execution is sequential in this session. 016 completion checks precede 017 feature code.

## Requirement coverage

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001,FR-002 / US1; SC-003 | T005,T006,T011–T013 | combo identities, deletion/reorder, downloaded positions | [Passed; evidence](verification.md) |
| FR-003,FR-004 / US2; SC-003 | T007,T008,T011–T013 | ordered steps, timing/budgets, cross-reference deletion/cycles | [Passed; evidence](verification.md) |
| FR-005 / US3; SC-003 | T009,T010,T011–T013 | conditional chains/order/target identity | [Passed; evidence](verification.md) |
| FR-006 / US1–US3; SC-001 | T011,T012,T014,T015 | independent goldens and pinned firmware compile | [Passed; evidence](verification.md) |
| FR-007 / US1–US3; SC-002 | T003,T004,T013 | strict schema, unchanged v9 input, round trip/history | [Passed; evidence](verification.md) |
| FR-008 / US1–US3; SC-002 | T006,T008,T010,T013–T015 | explained keyboard controls, problem focus, invalid export block | [Passed; evidence](verification.md) |
