# Tasks: Wiring and settings usability

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/wiring-interactions.md, quickstart.md.

All tasks remain unperformed. Observe required failing domain/storage/regression tests before their implementation. [P] marks disjoint work only after its stated prerequisites; it does not authorize concurrent mutations/checks.

## Foundation — dependency and contracts

- [ ] T001 Integrate final merged 032 from origin/main into feature/033-wiring-and-settings-usability, resolve 033 with .specify/scripts/bash/check-prerequisites.sh and compare final specs/032-project-creation-and-auto-wiring/spec.md with plan.md; preserve other work and record actual dependency state in specs/033-wiring-and-settings-usability/verification.md.
- [ ] T002 Amend specs/003-schematic-switches-wires/spec.md and contracts/project-schema.md and contracts/ui.md, specs/013-matrix-wiring-editor/contracts/wiring.md, specs/032-project-creation-and-auto-wiring/spec.md and specs/001-app-shell-ui/contracts/ui-regions.md per contracts/wiring-interactions.md; scope historical formats by schema version. Reconcile docs/guidelines/frontend/tailwind.md and admin-ui.md for these narrow/docked panels before code, then reanalyze 033 artifacts.
- [ ] T003 Add failing frozen-input contracts in tests/unit/domain/wires/get-key-pin-wires.test.ts, tests/unit/domain/keys/move-keys.test.ts and tests/unit/domain/keys/set-key-geometries.test.ts for three-key pass-through movement, fixed anchors, diode pin, split isolation and unrelated pin crossing; record observed failures in specs/033-wiring-and-settings-usability/verification.md.
- [ ] T004 Add independent v11 fixtures under tests/fixtures/project/ and failing migration/rejection/near-budget contracts in tests/unit/storage/migrations/migrate-v11-to-v12.test.ts and tests/unit/storage/project/large-schematic.test.ts; assert exact expected pin relationships, malformed contacts, future-version refusal and unchanged current project. Record failures before T005–T007.
- [ ] T005 Implement required Wire contacts and schemaVersion 12 in src/domain/types.ts and src/domain/project/create-project.ts; contacts have existing keyId, pin exactly 1 or 2, finite bounded at coordinates, no duplicate/endpoint pin pairs, at most two contacts per key per wire. Add get-wire-conductors.ts and extend get-wire-path.ts/get-key-pin-wires.ts under src/domain/wires/; endpoints/contacts replace geometric pin inference.
- [ ] T006 Align src/domain/wires/nets/get-nets.ts, src/domain/wires/find-wire-contacts.ts, src/domain/wiring/get-wire-half.ts, src/domain/wires/find-key-current-flow.ts, src/domain/project/get-project-resource-error.ts and src/ui/project/logic/project-state.ts with the common spine/lead representation; count nonzero leads toward existing segment limits, remap insulation by crossing provenance and preserve analysis-only UI restrictions. Cover regressions in mirrored tests/unit/domain/ paths.
- [ ] T007 Implement frozen v11 storage parsing, src/storage/migrations/migrate-v11-to-v12.ts and migration registry/version; update src/storage/project/project-schema.ts and serialization validation. Validate before geometry, capture old contacts deterministically without expanding wires, allow stored free/junction fragments, retain strict reference checks and existing budgets. Run T004 and all historical migration/project-file tests; update docs/domain-model.md with v12 semantics.

## US2 — Preserve intermediate connections (P1)

Independent acceptance: moving each key preserves the expected pin/terminal partition, fixed shared junctions and insulation across Undo/Redo/import/reload; fields and pointer agree.

- [ ] T008 [US2] [FR-005,FR-006] Add failing conductor/lead creation and transform contracts in tests/unit/domain/wires/editing/add-wire.test.ts, tests/unit/domain/keys/edit-layout.test.ts and tests/unit/domain/keys/move-key.test.ts; include multi-key move, rotation, resize, unrelated wire overlap/refusal, 0.0001u capture tolerance and resource refusal. Confirm intended failures.
- [ ] T009 [US2] [FR-005,FR-006,FR-007] Capture contacts only during wire creation/connection edits in src/domain/wires/editing/add-wire.ts; route all src/domain/keys/move-keys.ts, set-key-geometries.ts, move-key.ts and edit-layout.ts transforms through shared pure anchor/lead preservation, net/insulation/resource verification and atomic failure. Return original Project on refused/no-op edits and expose named refusal for pointer/field previews.
- [ ] T010 [US2] [FR-005,FR-006,FR-013] Render actual spine/leads/contact indicators in src/ui/schematic/rendering/components/wire-shape.tsx, wires-layer.tsx and pins-layer.tsx using domain geometry; surface named transform refusal through src/ui/schematic/interaction/ and layout/logic/ without separate electrical inference. Reinvoke local UI skill before these UI edits and record accepted guidance in plan.md.
- [ ] T011 [US2] [FR-007,FR-013] Add tests/unit/ui/integration/wiring-contacts.test.ts and tests/e2e/wiring-usability.spec.ts cases with real drawing, drag/fields, Undo/Redo/reload/file import and JSON/ZIP downloads; independently assert net/cell/GPIO results and unrelated bindings. Add Firefox/WebKit movement/SVG cases and record evidence in verification.md.

## US3 — Select and delete sections (P1)

Independent acceptance: pointer/list single and multiple selection deletes exactly highlighted spans, retaining keys, controller endpoints and unselected branches with one-step history.

- [ ] T012 [US3] [FR-008,FR-009] Add failing tests/unit/domain/wires/get-wire-sections.test.ts and tests/unit/domain/wires/editing/remove-wire-sections.test.ts for bends, connected junctions, insulated crossings, shared collinear spans, repeated refs, stale refs, endpoint pins, branch survival and split/resource refusal; assert independent surviving geometry/partitions, not query-generated expectations.
- [ ] T013 [US3] [FR-008] Implement src/domain/wires/get-wire-sections.ts and its UI-safe public export in src/domain/wires/index.ts; derive spine/lead sections with stable base-relative span refs, electrical boundaries and shared overlap contributors; keep net derivation private to domain/shared analysis.
- [ ] T014 [US3] [FR-009,FR-007,FR-013] Implement src/domain/wires/editing/remove-wire-sections.ts and public index export, deterministic fragment allocation and junction/contact/insulation remapping. Update src/domain/wires/remove-orphan-wires.ts and related key/wire removal callers so surviving fragments remain repairable rather than cascading away; preserve endpoint GPIOs and refuse budget overflow atomically. Extend mirrored removal/validation and serialization tests.
- [ ] T015 [US3] [FR-008,FR-009,FR-012] Extend src/ui/schematic/interaction/schematic-selection.ts, read-canvas-hit.ts, pointer-select.ts and schematic-shortcut-handlers.ts with section-only multiple selection, Shift toggle, exact extent hits, stale selection guard and key-only marquee. Update rendering/components/wires-layer.tsx and wire-shape.tsx for extent/endpoints and control hit priority; native text shortcuts remain untouched.
- [ ] T016 [US3] [FR-008,FR-009,FR-012] Add src/ui/schematic/parts/components/parts-wire-sections-table.tsx with labeled roving checkboxes, endpoint descriptions, Delete selected sections and focus fallback; compose in parts-list.tsx and update src/ui/shortcuts/ help definitions. Add tests/unit/ui/integration/wire-sections.test.ts for selection exclusivity, scopes, dense disambiguation, Undo announcement and surviving branches.
- [ ] T017 [US3] [FR-008,FR-009,FR-013] Extend tests/e2e/wiring-usability.spec.ts with real section clicks/Shift selection and keyboard/list deletion, crossing control priority, exact saved fragments, history/reload, validation and downloaded output; cover Firefox/WebKit SVG hit/focus behavior and record evidence in verification.md.

## US1 — Complete rather than rebuild wiring (P1)

Independent acceptance: complete partial matrix/direct/split circuits without replacing valid manual cells/pins/conductors; rebuild is separately explained; Cancel/refusal/no-op writes nothing.

- [ ] T018 [US1] [FR-001,FR-002,FR-003,FR-004] Add failing tests/unit/domain/wiring/editing/complete-wiring.test.ts and extend auto-wiring.test.ts for partial known axes/rowPin, stable terminals, direct inputs, compatible manual net reuse, retained encoder/manual pins, duplicates/capacity, no-op identity, deterministic routing and unchanged geometry/bindings. Observe intended failures.
- [ ] T019 [US1] [FR-001,FR-004] Implement src/domain/wiring/editing/complete-wiring.ts and route-missing-connections.ts; preserve each known axis/half/diode assignment, fill only missing candidate cells, reject occupied candidates/ambiguous manual nets, reuse compatible terminals/conductors in project order and insulate unrelated new crossings. Extend 032 assign-auto-pins.ts reservation inputs for all completion-retained conductors; do not apply rebuild-only retention filtering to completion.
- [ ] T020 [US1] [FR-001,FR-002,FR-003,FR-004] Add complete edit to src/domain/wiring/editing/edit-wiring.ts and public index, retain auto as explicit rebuild with 032 output rules, add pure proposal-summary query; verify actual pin/terminal partitions and resource limits before returning candidate. No-op preserves original reference; failures return named repair guidance atomically.
- [ ] T021 [US1] [FR-002,FR-003,FR-012] Update src/ui/schematic/wiring/components/wiring-controls.tsx and wiring-options-controls.tsx plus wiring/logic/use-wiring-preview.ts for Complete wiring/Rebuild wiring, replacement explanation, retained/added/rerouted/removed summary, no-op feedback, disabled refused Apply and base-identity invalidation. Add tests/unit/ui/integration/wiring-completion.test.ts for Cancel/Apply/history and saved-project export isolation.
- [ ] T022 [US1] [FR-001,FR-002,FR-003,FR-004,FR-013] Extend tests/e2e/wiring-usability.spec.ts and existing tests/e2e/wiring.spec.ts for partial completion, rebuild/retention, refusal/no-op, preview/cancel/external invalidation and exact JSON/ZIP GPIO/RC agreement; update old Auto assign labels without dropping electrical assertions. Record evidence in verification.md.

## US4 — Compact panels and Settings (P2)

Independent acceptance: specified canvas/panel budgets, reachable actions and focus hold at all viewports/themes/zoom; opening/closing panels does not change Project/history.

- [ ] T023 [US4] [FR-010,FR-011,FR-012] Reinvoke ui-ux-pro-max for bounded panels/focus and inspect current primitives/styles before UI edits; record accepted/rejected guidance in plan.md. Add tests/unit/ui/integration/schematic-panels.test.ts and tests/e2e/schematic-panels.spec.ts failing regressions for combined editor obstruction, selection/preview states, viewport budgets, focus/scroll and Settings size. Domain/storage tests remain separate from layout measurements.
- [ ] T024 [US4] [FR-010,FR-012] Add src/ui/schematic/components/schematic-editor-panel.tsx; update schematic-workspace.tsx and logic/use-schematic-workspace.ts to own one active editor with collapse/close/reopen, cancel hidden wiring previews, retain Tools and shell landmarks, use composition slots and preserve field commit/cancel. Adapt Layout/Wiring/Controller/Encoders/Parts content inside existing components rather than duplicating forms.
- [ ] T025 [US4] [FR-010,FR-012] Implement named component sizing utilities in src/styles.css and apply them to the local editor host: desktop <=min(360px,35%) and >=60% canvas width; narrow <=45% editor and >=50% canvas height, independent scrolling and no horizontal page overflow. Use base/xl layout and existing tokens/density; measure 1440,1280,1024,768,390 viewports and effective 200% layout.
- [ ] T026 [US4] [FR-011,FR-012] Add a Settings-only compact size variant in src/ui/components/components/dialog.tsx and use it in src/ui/shell/components/settings-dialog.tsx; cap <=480px with viewport margins/internal scroll and preserve native modality/Escape/focus return. Add interaction tests proving Settings/panel UI changes leave Project/history unchanged and other dialogs retain their existing sizing contract.
- [ ] T027 [US4] [FR-010,FR-011,FR-012] Complete tests/e2e/schematic-panels.spec.ts across viewport matrix/both themes, preview action reachability, collapse/reopen/close, long labels/errors, Settings keyboard scroll/native focus and reduced motion; add focused Firefox/WebKit dialog cases. Inspect rendered screenshots and retain meaningful evidence in verification.md.

## Verification and completion

- [ ] T028 Reinvoke ui-ux-pro-max after implementation; review rendered sections/leads/panels against spec.md, fix in-scope findings and record actual screenshots/checks/limits in specs/033-wiring-and-settings-usability/verification.md.
- [ ] T029 Run make check, Docker npm run build, make test-e2e and make zmk-build; run changed tests/e2e/wiring-usability.spec.ts and schematic-panels.spec.ts cases three sequential times without retries, recording actual commands/results in specs/033-wiring-and-settings-usability/verification.md. Preserve independent golden expectations and update any 032 label assertions without weakening them.
- [ ] T030 Prove controlled sensitivity separately/alone: temporarily remove contact persistence, broaden section deletion and violate panel height in their owning production files; require saved-net, surviving-branch and canvas-budget assertions to fail, restore exact bytes and record failures/restoration in specs/033-wiring-and-settings-usability/verification.md.
- [ ] T031 Complete actual manual keyboard, VoiceOver/Safari, OS theme/reduced-motion and 200% zoom acceptance for changed flows; record who/when/results in specs/033-wiring-and-settings-usability/verification.md. Automated checks do not complete this task; unresolved required acceptance blocks completion/merge.
- [ ] T032 Reconcile this tasks.md requirement mapping, all amended owning contracts, specs/README.md and docs/roadmap.md; re-read docs/guidelines/git-flow.md, inspect scoped diff, and deliver one complete feature PR with release:minor and explicit compatibility/evidence limits only after applicable gates. Submit squash auto-merge immediately when ready; do not poll CI or claim publication without evidence.

## Dependencies and implementation strategy

T001–T007 form the compatibility foundation. T008–T011 deliver US2; T012–T017 then provide safe section operations. US1 T018–T022 builds on the durable conductor/section contracts; US4 T023–T027 composes the resulting editors. Each story is independently verifiable at its completion, but all four remain required in one feature PR. First usable increment is the US2 connection-preservation fix with migrations; it is not a separately released MVP.

T003 and T004 may be prepared in parallel in different test/fixture paths; run required failing checks sequentially before implementing. After foundation, US4 styling/test work can be prepared alongside domain-only US1 work, but shared workspace/selection files must be serialized. Within US2 keep rendering after geometry; within US3 list work can follow the selection contract while domain fragment tests run separately; within US1 browser fixture preparation can proceed alongside allocation tests after expected scenarios are frozen. No [P] task markers are used because tasks deliberately bundle test/run or integration boundaries that need sequential coordination. Mutation probes run alone after normal checks.

## Requirement coverage

Evidence paths below are planned destinations, not passing results. Only this table owns requirement → task → check → evidence mapping.

| Requirement / scenario | Tasks | Test or check | Evidence |
|---|---|---|---|
| FR-001 / US1.1–4 | T018–T022 | complete-wiring.test.ts; wiring-usability.spec.ts retained partial axes/circuits | verification.md, US1 results pending |
| FR-002 / US1.5 | T018,T020–T022 | auto-wiring.test.ts; rebuild explanation and exact replaced output | verification.md, US1 results pending |
| FR-003 / US1.4–7 | T018,T020–T022 | no-op/refusal/base identity/Cancel/atomic history | verification.md, US1 results pending |
| FR-004 / US1.3,7 | T006,T018–T020,T022 | expected partitions, insulation, split/manual occupancy | verification.md, US1 results pending |
| FR-005 / US2.1–2 | T003,T005–T006,T008–T011 | add-wire/move/edit-layout contracts; real drag and fixed bus | verification.md, US2 results pending |
| FR-006 / US2.3 | T003,T006,T008–T011 | unrelated pin/overlap/insulation movement | verification.md, US2 results pending |
| FR-007 / US2.4–5 | T004,T007,T009,T011,T014,T017 | v1–v11 fixtures, rejection, round trip, history, field parity | verification.md, compatibility results pending |
| FR-008 / US3.1–3 | T012–T013,T015–T017 | exact sections/overlap refs; pointer/checkbox keyboard multi-selection | verification.md, US3 results pending |
| FR-009 / US3.4–6 | T012,T014–T017 | fragment/reference preservation, resources, focus/scopes, saved output | verification.md, US3 results pending |
| FR-010 / US4.1–3,6 | T023–T025,T027 | schematic-panels.spec.ts DOM budgets/scroll/panel switches | verification.md, US4 results pending |
| FR-011 / US4.4 | T023,T026–T027 | Settings native dialog margins/size/Escape/focus | verification.md, US4 results pending |
| FR-012 / US4.5–6 | T010,T015–T017,T021,T023–T028,T031 | keyboard, themes, errors, real zoom/manual screen reader | verification.md, accessibility results pending |
| FR-013 / all wiring stories | T006,T010–T011,T014,T017,T022,T029 | visible leads/nets, independent GPIO/RC/ZIP goldens, zmk-build | verification.md, export results pending |
| SC-001 | T018–T022,T029–T030 | retained completion/refusal exact saved state | verification.md, final acceptance pending |
| SC-002 | T003–T011,T029–T030 | independent intermediate/insulated fixture sequences | verification.md, final acceptance pending |
| SC-003 | T012–T017,T029–T030 | exact deletion and independent surviving branches | verification.md, final acceptance pending |
| SC-004 | T023–T031 | viewport matrix, themes, actual zoom/focus | verification.md, final acceptance pending |
| SC-005 | T028–T032 | dated automated/rendered/manual evidence and accurate open gates | verification.md, final acceptance pending |
