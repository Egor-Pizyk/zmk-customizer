# Tasks: JointJS Schematic editor

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [adapter contract](contracts/diagram-adapter.md), [quickstart.md](quickstart.md).
**Branch**: `feature/038-jointjs-schematic-editor`. All tasks below are pending implementation; the existing baseline is evidence to retain, not a completed migration task.

## Format and execution rules

`- [X] T001 [P?] [US1] [FR-001] Action in exact/path`

[P] identifies disjoint work that can run concurrently only after its stated prerequisites. It does not authorize creating workers by itself. Tests precede their owning implementation; domain/storage/generator changes and regressions require a demonstrated failing behavioral assertion. Real-library browser checks are mandatory. Existing pure operations may be reevaluated by React; assert one logical accepted transition/history/save, not a pure-function call count. Never consume a mutable gesture flag inside an updater.

No schema, generator, routing-policy or user-group expansion. If an implementation discovers such a need, amend the owning contract before code. No paid extension, graph-change commit, graph serialization or hidden second editor. Proposed new source/test files below are created only when their task starts. Feature-wide verification evidence lives only in [verification.md](verification.md); this file owns the sole requirement → task → check → evidence mapping.

## Phase 1 — Setup and adoption prerequisites

Goal: establish exact baseline, package and import boundaries without changing editor behavior.

- [X] T001 [FR-015, FR-016] Inspect current branch/diff and reconcile changes merged since base14d9d80, including overlapping PR29/30, against specs/038-jointjs-schematic-editor/spec.md and plan.md; record current base and scope in specs/038-jointjs-schematic-editor/verification.md without absorbing another feature.
- [X] T002 [FR-015, FR-016] Capture a paired current-base production baseline using tests/fixtures/schematic/large.json and specs/038-jointjs-schematic-editor/quickstart.md; retain navigation/nudge samples, known fixture output bytes and screenshots in ignored .check-logs/038-baseline/ and record exact SHA/image/browser in specs/038-jointjs-schematic-editor/verification.md.
- [X] T003 [FR-001, FR-002, FR-015] Add and run failing allow/deny package-origin tests in tests/tooling/check-architecture.test.mjs and tests/tooling/public-api-origins.test.mjs: only src/ui/schematic/diagram/logic may import @joint/core, no deep source import or runtime re-export escape, and no domain/storage/generator/Bindings allowance.
- [X] T004 [FR-001, FR-015] After T003, pin @joint/core4.3.3 in package.json/package-lock.json, implement the exact exception in scripts/check-architecture.mjs, and retain upstream license/notice in the shipped asset distribution; verify manifest has no added JointJS+/React/WASM dependency and retain baseline build sizes from T002 in specs/038-jointjs-schematic-editor/verification.md. Installation alone is not a migrated bundle-cost measurement; final integrated/post-cleanup delta belongs to T048.
- [X] T005 [FR-015] Confirm ADR0023 and owning rules match first production use in docs/architecture.md, docs/tooling.md, docs/folder-structure.md and docs/decisions/0023-jointjs-schematic-projection.md; confirm the exact diagram logic/components alias design for tsconfig.json, preserving no-cast/no-authored-class conventions; actual aliases/barrels are added with T009 first files.

## Phase 2 — Foundational surface and adapter

Goal: establish one shared viewport and a library-owned scene with no writes. Blocks every user story. No empty barrels or adapter folders are created before their first implementation task.

- [X] T006 [FR-001, FR-002, FR-012] Add failing shared-host/coordinate/Bindings regression contracts in tests/unit/ui/canvas/components/work-surface.test.ts and tests/unit/ui/canvas/logic/surface-content.test.ts for exclusive SVG/host modes, common bounds, one camera/grid/pan owner and unchanged SVG render/renderScreen semantics.
- [X] T007 [FR-001, FR-002, FR-012] After T006, add exclusive host-mode plumbing in src/ui/canvas/logic/surface-content.ts, src/ui/canvas/components/work-surface.tsx and surface-svg.tsx; generalize refs/input bounds in src/ui/canvas/logic/use-surface-viewport.ts only as needed, preserving existing Bindings mode and preference behavior.
- [X] T008 [FR-002, FR-004, FR-013] Add failing real-library lifecycle and projection-origin contracts in tests/unit/ui/schematic/diagram/logic/diagram-lifecycle.test.ts plus an isolated real-browser host spike in tests/e2e/jointjs-host.spec.ts: one host/scene, no Graph change commits, cleanup/remount, exact points and no remote calls.
- [X] T009 [FR-001, FR-002, FR-004, FR-013] After T008, implement private core factories/lifecycle in src/ui/schematic/diagram/logic/create-diagram.ts and disposal helpers, with a React-owned host in src/ui/schematic/diagram/components/schematic-diagram.tsx and exact named public barrels/aliases in tsconfig.json; synchronous Paper, interactive editing/magnets/automatic routing disabled, no library types in public contracts.
- [X] T010 [FR-001, FR-015, FR-016] Run the T008 real-browser spike and strict build/typecheck before expanding migration; register actual mount/sync effect files in docs/guidelines/frontend/react.md and inventory checks, resolve API/cancellation/focus failures in the adapter, and record go/no-go evidence in specs/038-jointjs-schematic-editor/verification.md. A failure blocks later phases without adding paid features.

## Phase 3 — US1: Open and inspect the same keyboard (P1)

Independent acceptance: opening/navigation reproduces known ordinary/rotated/split/direct/diode/encoder/invalid fixtures without a Project write, history step or geometry normalization.

- [X] T011 [P] [US1] [FR-001, FR-002, FR-011] Add independent expected descriptor/point/identity contracts in tests/unit/ui/schematic/diagram/logic/project-diagram.test.ts covering stable namespaced IDs, rotated artwork, diode display terminals, encoder push ownership, wire sections, crossings and incomplete conductors; expected geometry must not be calculated by the function under test.
- [X] T012 [P] [US1] [FR-002, FR-004, FR-011] Add real-provider no-write/open/import/table/history sync tests in tests/unit/ui/integration/jointjs-project-sync.test.ts, retaining legacy file acceptance and invalid-project repair/export status.
- [X] T013 [US1] [FR-001, FR-002, FR-007, FR-008] After T011, implement typed display descriptors and part/section projection in src/ui/schematic/diagram/logic/project-diagram.ts, diagram-node.ts and the project-diagram-* descriptors using cached analysis, getSchematicGeometry and getWireSections; retain layer order, exact routes and selective saved-insulation bridges without auto anchors/router or global jumpover.
- [X] T014 [US1] [FR-004, FR-012] Implement stable cell reconciliation, ARIA/data reference sync and focus preservation in src/ui/schematic/diagram/logic/sync-diagram.ts and sync-diagram-focus.ts; update/remove cells under a projection guard, never reset all on each pointer sample or focus incidental internal nodes.
- [X] T015 [US1] [FR-001, FR-004, FR-011] After T012–T014, compose the host and current scene/selection inputs in src/ui/schematic/components/schematic-canvas.tsx and src/ui/schematic/logic/use-schematic-workspace.ts; preserve tables, issues, current camera and Bindings output while external changes refresh the display.
- [X] T016 [US1] [FR-001, FR-004, FR-011, FR-016] Add/run real rendered open/navigation/issue-reveal tests in tests/e2e/jointjs-inspection.spec.ts for all US1 fixture families and empty state; compare stored Project/generated baseline bytes and verify no duplicated parts or load-time saves, recording reviewed screenshots in specs/038-jointjs-schematic-editor/verification.md.

## Phase 4 — US2: Complete or cancel one coherent gesture (P1)

Independent acceptance: real pointer and keyboard/numeric edits produce one logical transition; no-op/refusal/cancellation/stale events do not save or add history.

- [X] T017 [P] [US2] [FR-003, FR-004] Add failing session-state contracts in tests/unit/ui/schematic/diagram/logic/diagram-gesture-session.test.ts for captured Project+generation, synchronous consume-before-dispatch, duplicate completion, Undo→Redo ABA, read-only entry, lost capture/touchcancel and unmount invalidation. Add tests/unit/ui/project/logic/import-session.test.ts for read-only getRevision(), synchronous revision advancement across batched Undo→Redo before effects, and unchanged request IDs/in-flight import ownership when gestures capture/cancel.
- [X] T018 [P] [US2] [FR-003, FR-005] Add actual-provider history/autosave/focus regression cases in tests/unit/ui/integration/jointjs-gestures.test.ts for key/multi-key/encoder placement and movement, own-center/magnetic/Shift rotation, numeric alternatives, no-op and domain refusal; assert results, not pure function invocation counts.
- [X] T019 [US2] [FR-003, FR-004] After T017, add the side-effect-free getRevision() getter to src/ui/project/logic/import-session.ts (existing revision counter only; no begin()/request/invalidation changes), then implement transient generation/session logic in src/ui/schematic/diagram/logic/diagram-gesture-session.ts and normalize typed native input in diagram-pointer-input.ts; no fabricated SyntheticEvent, casts, mutable token in updater or graph-event commit pipeline.
- [X] T020 [US2] [FR-003, FR-005] After T018/T019, adapt event plumbing in src/ui/schematic/interaction/pointer-types.ts, use-schematic-pointer.ts, pointer-select.ts and pointer-encoder.ts to existing domain reducers and explicit capture/focus callbacks; preserve all current tool and snap policies while routing host/native-overlay input through one controller.
- [X] T021 [US2] [FR-003, FR-004, FR-005] Wire session cancellation/invalidation and keyboard dispatch into src/ui/schematic/logic/use-schematic-workspace.ts and src/ui/schematic/diagram/components/schematic-diagram.tsx, supplying getProjectRevision from the existing useProject().importSession getter, comparing revision plus Project identity before dispatch and inside commit, and cancelling obsolete sessions before capture release/disposal; use local generation for tool/preview/disposal changes.
- [X] T022 [US2] [FR-003, FR-004, FR-005, FR-016] Add/run production gesture tests in tests/e2e/jointjs-gestures.spec.ts for actual capture/lost-capture, Escape precedence, refusal, duplicate release, New/Open/Undo during drag, ABA, focus and pointer/numeric equivalence; verify Undo/Redo and saved JSON for each gesture family.

## Phase 5 — US3: Draw and edit real conductors (P1)

Independent acceptance: pass-through A–B–C, junctions, selective insulation and manual corners keep expected contacts and geometry after independent movement, history and reload.

- [X] T023 [P] [US3] [FR-006, FR-007, FR-008] Add independent wire/control projection regressions in tests/unit/ui/schematic/diagram/logic/diagram-conductors.test.ts for pin/free/junction hit refs, intermediate anchors, overlaps, multiple crossings, diode external terminals and encoder contacts. Reuse owning domain fixture assertions; do not introduce another net engine.
- [X] T024 [P] [US3] [FR-006, FR-008] Add failing real-provider wire/corner gesture cases in tests/unit/ui/integration/jointjs-wire-editing.test.ts for click-click/free completion, snapping, derived/collocated corners, fixed endpoints and no contact creation from moving a pin across unrelated wire.
- [X] T025 [US3] [FR-006, FR-007] After T023, preserve explicit section/pin/junction hit mappings and saved-crossing bridge projection in src/ui/schematic/diagram/logic/project-diagram-sections.ts, project-diagram-bridges.ts and diagram-hit-reference.ts; never derive contact identity from a library anchor ratio or geometry coincidence during part movement.
- [X] T026 [US3] [FR-006, FR-008] After T024, connect normalized wire drafting and completion to src/ui/schematic/interaction/reduce-wire-draft.ts, pointer-create.ts and existing add-wire operation; draw domain-owned preview/hover feedback from src/ui/schematic/rendering/components/ without saving preview or library coordinates.
- [X] T027 [US3] [FR-007, FR-008, FR-012] Adapt native crossing/corner controls in src/ui/schematic/rendering/components/bend-handles.tsx and existing screen-layer components to the host overlays; preserve 24px screen targets, one square per coincident corner, existing getBendDragBends/setWireBends behavior and keyboard/field alternatives. Do not substitute stock Segments tools.
- [X] T028 [US3] [FR-006, FR-007, FR-008] Verify and repair only adapter-related geometry/attachment gaps in src/ui/schematic/interaction/get-schematic-geometry.ts and src/ui/schematic/diagram/logic/project-diagram.ts, preserving display-only diode offsets, fixed bus leads, saved insulation refs and encoder/push identity; any domain extension first needs an owning failing regression and amended scope when behavior changes.
- [X] T029 [US3] [FR-006, FR-007, FR-008, FR-016] Add/run tests/e2e/jointjs-conductors.spec.ts: draw and independently move A/B/C, compare connected/insulated/overlapping cases, multiple crossings, diode polarity, encoder A/COM/B/SW and corner cancel/commit; assert partitions/independent expected geometry plus JSON reload and exact Undo/Redo.

## Phase 6 — US4: Select and delete exactly the intended entities (P1)

Independent acceptance: section/whole-wire scopes, both crossing sides, Shift/list/marquee mixed selection and one-step deletion preserve keys and independent branches.

- [X] T030 [P] [US4] [FR-009] Add failing section/base reference, dense-hit priority, mixed marquee and exact deletion contracts in tests/unit/ui/integration/jointjs-selection.test.ts, using current domain cleanup and independent expected survivors; cover stale/missing refs and native text Delete.
- [X] T031 [P] [US4] [FR-009, FR-012] Add focused diagram highlight/hit tests in tests/unit/ui/schematic/diagram/logic/diagram-selection.test.ts for one wire with several domain sections, both L-crossing sides, bend whole-wire scope and low zoom; library segment identity must not replace electrical section identity.
- [X] T032 [US4] [FR-009] After T030/T031, connect diagram selection intents to src/ui/schematic/interaction/press-key-or-section.ts, end-marquee-drag.ts and existing schematic-selection.ts; retain workspace selection as sole owner, labeled list synchronization, mixed deletion resolution and immutable base guards.
- [X] T033 [US4] [FR-009, FR-012] Implement selection/extent/highlight projection in src/ui/schematic/diagram/logic/project-diagram.ts and sync-diagram.ts with existing native endpoint markers and list controls; use no JointJS+ Selection or separate saved grouping model.
- [X] T034 [US4] [FR-009, FR-011, FR-016] Run tests/e2e/wire-marquee.spec.ts, crossing-sections.spec.ts and jointjs-conductors.spec.ts for pointer/keyboard/list equivalence, exact mixed deletion/Undo/reload, surviving controller ends, dense crossings and text-field precedence; verify reported issue/export changes match surviving circuitry.

## Phase 7 — US5: Review proposals and save with confidence (P1)

Independent acceptance: only accepted Project affects storage/history/export, previews stay isolated and recoverable diagram failures preserve data/save access.

- [X] T035 [P] [US5] [FR-010, FR-011] Reuse the existing proposal isolation and actual saved-output parity cases in tests/unit/ui/integration/app-wiring.test.ts and app-files.test.ts, alongside jointjs-recovery.test.ts for Rebuild, topology round trip, Apply/Cancel, read-only inspection/mutation guards, stale proposal and no restoration of Complete wiring UI.
- [X] T036 [P] [US5] [FR-013] Add failing renderer failure/retry contracts in tests/unit/ui/schematic/diagram/logic/diagram-recovery.test.ts: only supported capability failures/guarded DOMException InvalidStateError or NotSupportedError recover; programmer TypeError/domain errors propagate; latest Project/history/save controls survive and Retry never commits or loops.
- [X] T037 [US5] [FR-010, FR-011] After T035, wire displayed versus accepted Project and analysis in src/ui/schematic/components/schematic-canvas.tsx and src/ui/schematic/logic/use-schematic-previews.ts; retain current preview guards, persistent footer, saved Problems/export eligibility and atomic Apply/Cancel, with no library reroute/allocation.
- [X] T038 [US5] [FR-013] After T036, implement narrowly classified recovery in src/ui/schematic/diagram/logic/diagram-recovery.ts and Retry diagram feedback in src/ui/schematic/diagram/components/schematic-diagram.tsx; keep application/domain code outside the catch and root error boundary unchanged.
- [X] T039 [US5] [FR-010, FR-011, FR-013, FR-016] Add/run tests/e2e/jointjs-proposals.spec.ts covering saved-data isolation, scroll-visible Apply/Cancel, topology/Undo/reload, actual ZIP versus preview/baseline bytes and injected supported renderer failure/retry with working Save; assert invalid projects still block export.

## Phase 8 — US6: Accessible, responsive and offline editing (P1)

Independent acceptance: all operations have working keyboard/list alternatives; viewports/themes/offline/onboarding and lifecycle/performance gates pass using the migrated production interface.

- [X] T040 [P] [US6] [FR-012, FR-014] Add browser acceptance tests in tests/e2e/jointjs-accessibility.spec.ts and tests/e2e/jointjs-onboarding.spec.ts for graphics-symbol names/roving focus, native text precedence, fixed targets, issue focus and actual 3×3 onboarding→ZIP with project protection/exit/restore. First capture failures against incomplete integration.
- [X] T041 [P] [US6] [FR-013, FR-016] Add paired performance/lifecycle/offline protocol in tests/e2e/jointjs-performance.spec.ts using tests/fixtures/schematic/large.json: same environment/revision receipts, three warm loads, five accepted alternating nudges, 25 lifecycle cycles, no remote calls, samples and p95 trace comparison. Assert <=25% warm-load/nudge median and input-to-second-animation-frame p95 regression, baseline-environment first navigation<=2s, and no application main-thread long task>200ms in controlled gesture windows. Implement the exact event/sample/long-task protocol in specs/038-jointjs-schematic-editor/quickstart.md; no renderer-only attribution or actual-paint claim. Retain historical profiler acceptance limits separately.
- [X] T042 [US6] [FR-012] After T040, adapt native keyboard/focus/view semantics in src/ui/schematic/diagram/logic/sync-diagram-focus.ts and existing src/ui/schematic/interaction/use-schematic-shortcuts.ts; preserve current help/roles, list alternatives, focus return and one live status announcement without extra Paper tab stops.
- [X] T043 [US6] [FR-012] Adapt structural host CSS and token-driven scene/control styling in src/styles.css and src/ui/schematic/diagram/components/schematic-diagram.tsx; verify every spec viewport, both themes, low zoom, reduced motion and 200% equivalent reflow, with shared toolbar/panel budgets and no horizontal page overflow.
- [X] T044 [US6] [FR-014] Update only affected targets/instructions in src/ui/onboarding/logic/ and existing onboarding browser coverage after T040; retain stable targets when proven sufficient and record their evidence instead of introducing duplicate tutorial state.
- [X] T045 [US6] [FR-012, FR-013, FR-014, FR-016] Run migrated native-event/focus cases in Chromium plus targeted Firefox/WebKit using playwright.config.ts, actual network-disabled editing/onboarding and T041 paired comparison; record all samples, screenshots, trace findings and actual timing limits in specs/038-jointjs-schematic-editor/verification.md, fixing in-scope regressions without claiming FPS from wall-clock timings.
- [ ] T046 [US6] [FR-012, FR-016] Perform and record required real keyboard-only, screen-reader speech, focus, OS/text zoom and text-spacing/reduced-motion acceptance from docs/guidelines/frontend/accessibility.md in specs/038-jointjs-schematic-editor/verification.md; unperformed portions remain open and block claiming full acceptance.

## Phase 9 — Cross-cutting verification and delivery

- [X] T047 [FR-001, FR-002, FR-015] Remove only replaced bespoke Schematic scene paths/barrel exports and obsolete tests after US1–US6 parity, within src/ui/schematic/rendering/ and src/ui/schematic/components/schematic-canvas.tsx; retain live geometry/native overlays, Bindings and specific gesture policies, with no permanent dual editor/fallback flag.
- [X] T048 [FR-015, FR-016] Reconcile all changed ownership/effect/import/license documentation in docs/architecture.md, docs/tooling.md, docs/folder-structure.md, docs/guidelines/frontend/react.md and specs/038-jointjs-schematic-editor/plan.md; amend owning behavior contracts only for explicitly approved scope changes and keep this coverage table current. After T047 cleanup, build base and final revisions identically and record actual final raw/per-file-gzip JS/CSS totals/deltas in verification.md using the quickstart bundle protocol; package installation or the earlier host spike is not the final cost.
- [ ] T049 [FR-016] Stage explicit feature paths and run npm run check:changed under docs/commands.md, then inspect final diff and record exact checked tree/SHA, logs, local outcomes and limits in specs/038-jointjs-schematic-editor/verification.md. New changes invalidate affected receipts; full CI remains comprehensive and no firmware build is claimed for unchanged output.
- [ ] T050 [FR-016] Audit every task/FR/SC against actual evidence in specs/038-jointjs-schematic-editor/tasks.md and verification.md; keep failures/manual gaps unchecked, verify onboarding/bundle/offline/legacy/output parity and reconcile plan versus final implementation before delivery.
- [ ] T051 [FR-016] Commit logical explicit feature changes on feature/038-jointjs-schematic-editor, push and create/update the single PR to main using a body file under /tmp; describe final behavior, dependency boundary, evidence and remaining limits, linking specs/038-jointjs-schematic-editor/verification.md. Use draft if required acceptance is outstanding; do not merge or poll CI.
- [ ] T052 [FR-016] Verify the PR is on the intended branch/base and has release:minor as its sole release label (the 0.x significant migration default), report PR/check/manual status and stop under docs/guidelines/git-flow.md; record delivery link in specs/038-jointjs-schematic-editor/verification.md without claiming unobserved CI/merge/release.

## Dependencies and safe parallel work

Setup: T001 → T002/T003 → T004 → T005. Foundation: T006 → T007; after T004/T007, T008 → T009 → T010. No story work before T010 passes.

Story order: US1 → US2 → US3 → US4 → US5 → US6 → cross-cutting/delivery. US1 is the smallest reviewable read-only increment, not a releasable migration. Each story can be validated independently on the established foundation using its stated acceptance fixtures. Preserve one feature branch/PR, no story PR stacks.

- US1: T011 and T012 can run in parallel after T010; T013/T014/T015 then T016 are sequential.
- US2: T017 and T018 can run in parallel after US1; implementation T019–T021 precedes T022.
- US3: T023 and T024 can run in parallel after US2; T025–T028 are sequential because projection and interaction files overlap; T029 validates the result.
- US4: T030 and T031 can run in parallel after US3; T032/T033 precede T034.
- US5: T035 and T036 can run in parallel after US4; T037/T038 precede T039.
- US6: T040 and T041 can run in parallel after US5; T042–T044 then T045 are sequential. T046 manual acceptance follows the implemented result; unavailable manual checks do not become passed tasks.

T047 follows automated parity T045; it may proceed while manual T046 is pending but must rerun affected checks and review the final revision. T048–T050 follow cleanup. Delivery may be draft-only with manual gaps; completion requires those acceptance tasks, and no other requirement failure is waived by draft delivery. No delegation is implied by [P].

## Implementation strategy

First prove package/host viability, then switch inspection projection (US1), then gestures/wiring/selection/preview/recovery, and finally accessible/offline/onboarding parity. Keep current electrical/geometry helpers and controls where needed; minimize adapter-specific abstractions. No production adoption/completion declaration based on an isolated host spike. Run speckit-analyze on spec/plan/tasks before starting implementation, resolve blocking findings and maintain tests-first for any domain/regression change. Every accepted logical command goes through provider commit; Graph setters/events remain presentation operations.

## Requirement coverage

This table is the only requirement → task → check → evidence map. Evidence column is pending until execution and points to the single journal; source research and baseline receipts alone do not satisfy migration acceptance.

| Requirement / scenario | Tasks | Test or check | Evidence |
| --- | --- | --- | --- |
| FR-001 / core rendering, US1 | T003–T016, T047 | import gate, real host build/spike, inspection fixtures | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-002 / state authority, US1/US5 | T003, T006–T015, T047 | deny imports, no graph-change commit, no-write provider assertions | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-003 / gesture/history, US2 | T017–T022 | actual provider/gesture browser cancellation/no-op/one-transition assertions | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-004 / stale/lifecycle, US1/US2 | T008–T022 | project sync, generation/ABA, disposal and stale callback tests | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-005 / geometry/snap, US2 | T018, T020–T022 | pointer/numeric own-center/magnetic/Shift equivalence and refusal | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-006 / durable wires, US3 | T023–T029 | A–B–C/junction/free-end contacts, partitions/history/reload | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-007 / crossings, US3 | T013, T023, T025, T027–T029 | independent selective insulation/overlap/multiple-crossing geometry | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-008 / corners/parts, US3 | T013, T023–T024, T026–T029 | derived/coincident corners, fixed anchors, diode/encoder push identity | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-009 / section deletion, US4 | T030–T034 | both L-crossing sides, mixed marquee/list/text precedence, exact survivors | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-010 / previews, US5 | T035, T037, T039 | Rebuild/topology/read-only/stale proposal and Apply/Cancel | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-011 / files/output, US1/US5 | T011–T012, T015–T016, T034–T035, T037, T039 | legacy/import/no-write/JSON, actual ZIP/baseline byte equality, invalid export | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-012 / accessibility/layout, US6 | T006–T007, T014, T027, T031, T033, T040, T042–T043, T045–T046 | native keyboard/focus, viewport/theme/reflow matrix, manual screen-reader/OS checks | Automated keyboard/layout receipts pass; manual T046 pending in [verification.md](verification.md) |
| FR-013 / offline/recovery/performance, US5/US6 | T008–T009, T036, T038–T039, T041, T045 | classified recovery, 25 cycles, paired timings/traces, no remote calls | Offline/recovery receipts pass; final paired measurement pending in [verification.md](verification.md) |
| FR-014 / onboarding, US6 | T040, T044–T045 | protected actual 3×3-to-ZIP journey/exit/restore | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-015 / dependency/decision | T001–T005, T010, T047–T048 | exact manifest/notice/bundle and import/API/ADR/effect gate review | Automated receipts pass; final gate pending in [verification.md](verification.md) |
| FR-016 / evidence/completion | T001–T002, T010, T016, T022, T029, T034, T039, T041, T045–T046, T048–T052 | exact-tree changed check, rendered/manual/paired comparison receipts and final coverage audit | Exact staged gate passes; final integration/delivery and manual T046 pending in [verification.md](verification.md) |

SC coverage: SC-001 via US1/US5; SC-002 via US2–US4; SC-003 via US3/US4; SC-004 via US6; SC-005 via US6 offline/onboarding; SC-006 via T002/T041/T045; SC-007 via T048–T052. Do not mark a scenario passed without its actual acceptance evidence.
