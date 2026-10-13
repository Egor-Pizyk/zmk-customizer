# Tasks: Matrix Wiring Editor

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/wiring.md, quickstart.md.
**Tests**: Required by AGENTS.md §6.1/§8 and FR-017. Write domain/storage/generator tests first and observe intended failure. Each task is a logical reviewable change; no dependency additions.

## Phase 1: Setup

- [x] T001 Create specification, accepted clarification and design artifacts in specs/013-matrix-wiring-editor/; explicitly retain roadmap number 013 and record baseline make check.
- [x] T002 Run Spec Kit cross-artifact analysis and required read-only spec-reviewer on specs/013-matrix-wiring-editor/ before feature code; resolve blockers in the owning artifact.

## Phase 2: Foundation

- [x] T003 Add tests-first v7 trust-boundary and migration contracts in src/storage/migrate-v6-to-v7.test.ts and src/storage/parse-project-file.test.ts: valid old output byte-identical, incomplete topology loadable, dangling/duplicate terminal references rejected, current project unchanged on rejected import, old migration chain preserved.
- [x] T004 Add terminal/half/scan types in src/domain/types.ts, bounded strict schema in src/storage/project-schema.ts, migrate-v6-to-v7.ts and migration-chain integration; IDs t<number>, mutually exclusive terminal/legacy endpoint fields, terminal count bounded by 600, dimensions 1..255.
- [x] T005 Add failing actual-connectivity contracts in src/domain/get-nets.test.ts, src/domain/find-wire-contacts.test.ts and src/domain/route-wiring.test.ts: shared terminal joins, distinct half isolation, rejected explicit cross-half links, GND, collinear overlap refusal, crossing insulation, rotated/coincident key-pin coordinates, unaffected junction preservation and route resource refusal.
- [x] T006 Extend actual terminal connectivity/half ownership in src/domain/get-nets.ts and src/domain/find-wire-contacts.ts; implement deterministic bounded routing in src/domain/route-wiring.ts and prove exact intended memberships through getNets, never assignment-only assertions.

## Phase 3: US1 — Matrix editing (P1)

**Goal**: Grid/table operations change the actual circuitry, preserve axes and update generated output.
**Independent test**: Preset open → cell/pin preview → Cancel/Apply → Undo/Redo → real ZIP agrees.

- [x] T007 [US1] Add failing stable-axis/edit/auto contracts in src/domain/derive-wiring.test.ts, src/domain/edit-wiring.test.ts and src/domain/auto-assign-cells.test.ts: GPIO edit cannot renumber axes, cell edit changes both actual nets, dimensions reject occupied truncation, no-op preserves identity, geometry/layers/unaffected wires unchanged, rotated center/grid grouping and boundary tie are deterministic. Test auto-assignment on every available preset against independent expected cells/pin pairs; document exact or permutation-equivalent results in tests/fixtures/wiring/DIFFERENCES.md (FR-018).
- [x] T008 [US1] Implement ordered-terminal scan derivation in src/domain/derive-wiring.ts and matrix editing in src/domain/edit-wiring.ts; use legacy derivation to initialize valid circuits without rerouting, and enforce actual-net membership before export.
- [x] T009 [US1] Implement center-based grid-quantized assignment in src/domain/auto-assign-cells.ts and diode-direction preview rewiring in src/domain/edit-wiring.ts; preserve existing preset cells unless user requests reassignment.
- [x] T010 [US1] Add independent matrix-direction golden expectations in tests/fixtures/wiring/ with DIFFERENCES.md and src/generators/wiring-export.test.ts; assert byte-identical unchanged legacy output and independently reconstruct GPIO pairs from exported cells.
- [x] T011 [US1] Adapt src/generators/generate-overlay.ts and src/ui/export/get-export-preview.ts to validated explicit bus order while preserving legacy unibody bytes; generator functions receive validated domain output and never validate internally.
- [x] T012 [US1] Add real App/provider interaction contracts in src/ui/app-wiring.test.ts: preview/Cancel/Apply, exact one-step Undo/Redo, no-op Redo, stale-project cancellation, grid/table agreement, autosave/reload/JSON and actual ZIP bytes; run failures before UI implementation.
- [x] T013 [US1] Add typed option descriptions/docs in src/catalog/wiring-options.ts with adjacent catalog test; implement native grid/table/controls in src/ui/schematic/wiring-grid.tsx, wiring-table.tsx and wiring-controls.tsx.
- [x] T014 [US1] Implement local preview lifecycle in src/ui/schematic/use-wiring-preview.ts; compose preview into schematic-workspace.tsx, cancel competing layout previews, and extend Parts endpoint/pin controls to shared actual terminals.
- [x] T015 [US1] Add isolated production browser matrix/auto/direction/history/round-trip/download journeys in tests/e2e/wiring.spec.ts; assert visible cells/wires and independently parsed saved project/ZIP, not DOM flags alone.

## Phase 4: US2 — Conflict repair (P1)

**Goal**: Missing/duplicate/wrong assignments and routing contradictions identify affected entities and block download until repaired.
**Independent test**: Create each issue via supported edits/import, see both affected entities, repair and download.

- [x] T016 [US2] Add failing domain cases in src/domain/derive-wiring.test.ts for missing cells/used pins, duplicate cells/GPIO, unavailable contacts, wrong-axis/ground/half connections, malformed split topology, diode contradictions and resource limits; assert all affected key/terminal paths.
- [x] T017 [US2] Implement src/domain/derive-wiring.ts and integrate src/domain/validate-schematic.ts, validate-shield-project.ts and controller pin validation; no contradiction may enable assignment-only export.
- [x] T018 [US2] Add real App conflict navigation/repair contracts in src/ui/app-wiring.test.ts; wire actionable issue displays and marks in src/ui/schematic/schematic-marks.ts and src/ui/shell/issue-button.tsx with labeled focus targets in wiring controls.
- [x] T019 [US2] Add production conflict/repair journeys to tests/e2e/wiring.spec.ts: duplicate cells show both occupants, GPIO/missing assignments disable real download, repaired ZIP agrees with visible schematic.

## Phase 5: US3 — Direct scanning (P2)

**Goal**: Real input/GND connections produce a buildable direct scan.
**Independent test**: Convert small keyboard, inspect GND/pins, round-trip and build actual export.

- [x] T020 [US3] Add failing direct conversion/derivation contracts in src/domain/edit-wiring.test.ts and derive-wiring.test.ts: pin1 input/pin2 GND, explicit diode removal preview, one unique input per key, ground excluded from GPIO conflicts, cancel/no-op semantics, no stale hidden matrix assignments.
- [x] T021 [US3] Implement direct terminal routing/conversion/validation in src/domain/edit-wiring.ts, derive-wiring.ts and route-wiring.ts, preserving geometry/key order/bindings.
- [x] T022 [US3] Add direct golden files and DIFFERENCES.md under tests/fixtures/wiring/direct/ and assertions in src/generators/wiring-export.test.ts before updating generate-overlay.ts for input-gpios active-low/pull-up and RC(0,i).
- [x] T023 [US3] Add direct real App/provider interaction contracts in src/ui/app-wiring.test.ts, then expose direct per-key inputs/GND and mode conversion preview in src/ui/schematic/wiring-controls.tsx and Parts endpoint labels.
- [x] T024 [US3] Add direct native-interaction/download browser journey in tests/e2e/wiring.spec.ts and actual-export build target in scripts/generate-build-fixtures.mjs; no handcrafted-only firmware build fixture.

## Phase 6: US4 — BLE split (P2)

**Goal**: Two independent circuits share one whole-keyboard transform/keymap and build as two shields.
**Independent test**: Configure split → move a key between halves → same GPIO allowed across halves → ZIP compiles both.

- [x] T025 [US4] Add failing split contracts in src/domain/edit-wiring.test.ts, derive-wiring.test.ts and wiring-controller.test.ts: initial midpoint/left tie, empty-half issue, BLE-only board restriction, distinct half GPIO namespaces, max row/summed column bounds <=255, unequal dimensions and direct split offset.
- [x] T026 [US4] Implement topology/half preview rewiring in src/domain/edit-wiring.ts and full-key-order split derivation in derive-wiring.ts; update src/domain/change-controller.ts and find-board-pin-user.ts for terminal assignments and per-half pin ownership.
- [x] T027 [US4] Add independent matrix/direct split golden files under tests/fixtures/wiring/split-matrix/ and split-direct/ and src/generators/wiring-export.test.ts for shared dtsi, both overlays, offset, name/role/defaults, common keymap/conf and exactly two build.yaml entries; cite upstream corne and DIFFERENCES.md before generation changes.
- [x] T028 [US4] Implement split output in src/generators/generate-shield-files.ts, generate-kconfig-shield.ts, generate-kconfig-defconfig.ts, generate-overlay.ts and generate-repository-files.ts; keep chosen physical layout and shared config resolution correct for v0.3.
- [x] T029 [US4] Add real App half/native-focus/board-switch preservation contracts in src/ui/app-wiring.test.ts before integrating half controls and per-half grids/pins in src/ui/schematic/wiring-controls.tsx, wiring-grid.tsx and wiring-table.tsx.
- [x] T030 [US4] Add split visible/downloaded-data browser journey in tests/e2e/wiring.spec.ts and actual-export left/right matrix/direct targets in scripts/generate-build-fixtures.mjs.

## Phase 7: Verification and completion

- [x] T031 Add focused Firefox/WebKit native controls, keyboard focus, grid selection and SVG wiring preview cases in tests/e2e/wiring.spec.ts; check visible geometry and saved project, with independent paint references only where justified.
- [x] T032 Add browser sensitivity seeds for lost actual rewiring, premature preview save and omitted split offset in scripts/check-e2e-mutations.py; run alone after baseline, require intended visible/saved/ZIP assertion failures and exact restoration.
- [x] T033 Run required read-only zmk-reviewer after catalog/generator work and feature review; resolve material findings and record evidence in specs/013-matrix-wiring-editor/verification.md.
- [x] T034 Run production build and make test-e2e, plus three sequential no-retry runs of new wiring browser tests; inspect failures and record commands/scenario coverage/remaining limits in specs/013-matrix-wiring-editor/verification.md.
- [x] T035 Run make zmk-build on actual exports for matrix both directions, direct and each split half; retain useful DTS/.config/build evidence and update docs/roadmap.md with specified/completed status supported by evidence.
- [x] T036 Run final make check after all edits and standalone regression probes, retain passing coverage floors and record final results in specs/013-matrix-wiring-editor/verification.md; only then mark feature complete.

## Dependencies and execution order

T001 → T002 → T003–T006 → US1 → US2 → US3 → US4 → final verification. Within each story, failing contracts precede implementation. US2 intentionally depends on editor entry points; US3 and US4 reuse routing and validation but each has an independent configured fixture/journey. Do not mark any user story complete until its UI, saved data and export assertions pass.

## Parallel opportunities

Separate read-only spec and ZMK reviews can run independently. Once contracts are fixed, test authoring in independent domain, generator and browser files may proceed concurrently; implementation edits to shared types/derivation/edit/generator files remain sequential. No [P] mutation task is marked because the stories share these files. Examples: US1 T010 golden fixture review alongside T012 App test design; US2 T016 validation scenarios alongside T019 browser scenario design; US3 T020 electrical test design alongside T022 golden review; US4 T025 topology tests alongside T027 upstream golden comparison. Do not run mutation probes alongside edits or other checks.

## Implementation strategy

First prove legacy compatibility and actual-net safe routing, then deliver unibody matrix editing with conflict repair as the first usable increment. Add direct and split without changing unrelated layout/binding contracts. All four stories remain feature scope; the first increment is not feature completion. Each task/group should fit one logical Conventional Commit; no automatic push/publish.

Implementation organization: validation and scan derivation share `derive-wiring.ts` so they cannot disagree; actual-net routing and controller contracts have adjacent dedicated tests. App/provider interactions are consolidated in `app-wiring.test.ts`; direct/split native interaction and downloaded-data contracts run in the production browser suite. Cross-browser cases share `wiring.spec.ts` with `@cross-browser` tags. Existing App export/download/JSON tests provide the real-provider archive plumbing contract; new browser tests assert wiring-specific saved/ZIP bytes. These file consolidations change no requirement or story scope.
