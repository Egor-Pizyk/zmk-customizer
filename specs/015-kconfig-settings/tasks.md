# Tasks: Firmware Kconfig settings

## Foundation

- [x] T001 Resolve feature015, author spec/clarification/design contracts in specs/015-kconfig-settings/ and preserve014.
- [x] T002 Run independent read-only spec and pinned-ZMK reviews; resolve blockers in specs/015-kconfig-settings/analysis.md.

## US1 — Configure and retain typed settings

- [x] T003 [US1] [FR-001,FR-003,FR-008] Add failing domain/catalog/history and v7 migration contracts in tests/unit/domain/firmware/firmware.test.ts and tests/unit/storage/project/firmware.test.ts; confirm intended failure.
- [x] T004 [US1] [FR-001,FR-003,FR-008] Add catalog/firmware definitions, pure domain/firmware operations, Project v8 schema/migration and creation updates in src/; preserve legacy fixtures through migration.
- [x] T005 [US1] [FR-001,FR-002,FR-007] Implement native typed/grouped/searchable Firmware form in src/ui/firmware/ with default/range/docs/reset and draft commit/cancel.
- [x] T006 [US1] [FR-002,FR-003,FR-007] Add real App integration in tests/unit/ui/integration/app-firmware.test.ts and browser lifecycle in tests/e2e/firmware.spec.ts with actual JSON values.

## US2 — Validate and repair

- [x] T007 [US2] [FR-004] Add failing domain range/kind/choice/string/unknown/dependency/hardware tests in tests/unit/domain/firmware/firmware.test.ts then implement validation and shared analysis in src/domain/firmware/ and src/domain/analysis/.
- [x] T008 [US2] [FR-005,FR-007] Wire inline errors, Firmware badges and issue focus in src/ui/{firmware,issues,shell}/; cover filtered focus, malformed import and blocked/repaired export in App/browser tests.

## US3 — Export intentional changes

- [x] T009 [US3] [FR-006,FR-008] Add failing independent conf golden and split repository contracts in tests/unit/generators/firmware.test.ts plus tests/fixtures/expected/firmware/.
- [x] T010 [US3] [FR-006,FR-008] Implement sorted non-default rendering and split per-half config routing in src/generators/{generate-conf,repository}/. Ensure no shared config conf in central-only mode.
- [x] T011 [US3] [FR-006] Assert actual downloaded ZIP/preview paths/content and split routing in tests/e2e/firmware.spec.ts; extend pinned build fixture and resulting .config assertions in scripts/.

## Verification and completion

- [x] T012 Run make check, production build, full make test-e2e, three sequential focused E2E passes, controlled behavioral regression sensitivity and make zmk-build; record commands/results/limits in specs/015-kconfig-settings/verification.md.
- [ ] T013 Manual accessibility pass in docs/guidelines/frontend/accessibility.md (pending explicit browser authorization/user assistance; sole remaining completion gate; do not claim automated equivalence).
- [x] T014 Reconcile docs/roadmap.md, specs/README.md and task status/evidence in specs/015-kconfig-settings/.

## Dependencies

T001→T002→tests T003/T007/T009→their implementations. US1 foundation precedes shared UI/analysis and generator consumers. T012 runs after edits stop; sensitivity alone with exact restoration. No production delegation; independent reviewers read-only. All three stories required; no scope truncation.

## Requirement coverage

| Requirement/scenario | Tasks | Test/check | Evidence |
|---|---|---|---|
| FR-001,FR-008 inventory/pin | T002–T005,T009–T011 | catalog metadata, pinned review, conf goldens/build | verification.md |
| FR-002 search/empty | T005,T006 | app-firmware, firmware browser | verification.md |
| FR-003 migration/history/save | T003,T004,T006 | firmware domain/storage, downloaded JSON/reload | verification.md |
| FR-004 validation | T007,T008 | semantic domain matrix, malformed storage, app/browser recovery | verification.md |
| FR-005 badge/focus | T008 | app/browser filtered problem focus | verification.md |
| FR-006 output | T009–T012 | independent goldens, ZIP bytes/paths, pinned build .config | verification.md |
| FR-007 keyboard/drafts | T005,T006,T008,T013 | native browser inputs/focus; manual gate pending | verification.md |
