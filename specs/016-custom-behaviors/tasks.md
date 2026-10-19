# Tasks: Custom behaviors

**Input**: spec.md, plan.md, data-model.md and contracts/keymap.md.

## Foundation

- [x] T001 Resolve 016, inspect dirty tree and read routed context; capture design in specs/016-custom-behaviors/plan.md.
- [x] T002 Review specs/016-custom-behaviors/{spec,plan,tasks}.md against constitution and resolve blockers before code.

## US1 — Configure and assign

- [x] T003 [US1] [FR-001,FR-002,FR-003,FR-004] Write and run failing immutable library/parameter contracts in tests/unit/domain/behaviors/behaviors.test.ts.
- [x] T004 [US1] [FR-001,FR-002,FR-003,FR-004] Implement five definition variants and custom reference in src/domain/types.ts; library edits/default parameters in src/domain/behaviors/; catalog properties in src/catalog/bindings/; register exact aliases in tsconfig.json.
- [x] T005 [US1] [FR-004,FR-008] Add labeled library editors in src/ui/bindings/behaviors/{components,logic}/ and custom options/parameter editing in src/ui/bindings/picker/; adapt binding legends and copied references.
- [x] T006 [US1] [FR-001,FR-004,FR-008] Add real application interactions in tests/unit/ui/integration/app-custom-behaviors.test.ts and browser journey in tests/e2e/behaviors.spec.ts for creation, shared assignment, editing, keyboard access, persistence and generated preview.

## US2 — Repair broken references

- [x] T007 [US2] [FR-006,FR-007] Write and run failing contracts in tests/unit/domain/behaviors/validate-behaviors.test.ts for missing targets, invalid parameters, cycles, empty lists, modifiers, timing and deleted position/layer references.
- [x] T008 [US2] [FR-006,FR-007] Implement validation in src/domain/behaviors/ and compose src/domain/analysis/analyze-project.ts; route issues via src/ui/issues/ and focus owning fields/keys.
- [x] T009 [US2] [FR-007] Extend tests/e2e/behaviors.spec.ts with delete/error/export-block/Undo/Redo and exact saved-data assertions.

## US3 — Preserve and export

- [x] T010 [US3] [FR-009] Write and run failing old-file, round-trip and malformed/bounded input tests in tests/unit/storage/project/behaviors.test.ts with tests/fixtures/project/v8-behaviors-legacy.json.
- [x] T011 [US3] [FR-009] Implement schema v9 and migration in src/storage/project/ and src/storage/migrations/migrate-v8-to-v9.ts; update creation/presets and current-schema expectations without changing historical fixtures.
- [x] T012 [US3] [FR-005] Write and run failing independent golden contracts in tests/unit/generators/keymap/behaviors.test.ts with tests/fixtures/expected/behaviors/; cover all five types and legacy output.
- [x] T013 [US3] [FR-005] Implement rendering/collection/includes in src/generators/keymap/ and add all five types to scripts/generate-build-fixtures.mjs for real pinned firmware compilation.
- [x] T014 [US3] [FR-005,FR-008] Run the roadmap-required ZMK reviewer over catalog/generator diff and address findings.

## Verification and completion

- [x] T015 Run make check, production build, full browser suite and three sequential new-journey runs; controlled behavioral regression separately; make zmk-build. Record scenario → risk → existing coverage → new E2E → visible assertion → saved/exported assertion and actual outputs/limits in specs/016-custom-behaviors/verification.md.
- [x] T016 Reconcile docs/domain-model.md, docs/folder-structure.md, specs/README.md and docs/roadmap.md; audit coverage and task status in specs/016-custom-behaviors/tasks.md.

## Dependencies

T002 → T003 → T004 → T007 → T008 → T010 → T011 → T012 → T013 → T014. UI T005/T006/T009 follows domain/schema implementation; T015/T016 follow all implementation. Independent storage/golden test authoring is safe in parallel conceptually, but execution remains sequential in this session.

## Requirement coverage

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001 / US1,US3 | T003–T006,T010–T011 | immutable edits, history, saved round trip | [verification.md](verification.md) |
| FR-002,FR-003 / US1 | T003–T005,T007–T008,T012–T013 | five typed configurations and parameter arity | [verification.md](verification.md) |
| FR-004 / US1 | T004–T006 | custom picker and shared reference | [verification.md](verification.md) |
| FR-005 / US3; SC-001 | T012–T015 | independent golden bytes and pinned build | [verification.md](verification.md) |
| FR-006 / US2 | T007–T008 | timing/modifiers/cycles/missing targets | [verification.md](verification.md) |
| FR-007 / US2; SC-003 | T007–T009 | every affected key and blocked export/Undo | [verification.md](verification.md) |
| FR-008 / US1 | T004–T006,T014 | catalog-backed explained controls | [verification.md](verification.md) |
| FR-009 / US3; SC-002 | T010–T011,T006 | strict schema, legacy fixture, round trip | [verification.md](verification.md) |
