# Tasks: Interactive onboarding

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [interaction contract](contracts/onboarding.md), [validation guide](quickstart.md).
**Status**: Implemented; automated gates passed, manual acceptance pending, 2026-10-25. Consolidated test ownership is reflected below; completion requires evidence.

Tests-first is mandatory for domain/storage and regressions. Record the intended failing assertion before implementing its behavior. All browser work uses isolated contexts and real app services under docs/testing.md. No new runtime dependency, provider context, Project schema change or generator change is planned.

## Format

`- [x] T001 [P?] [US1] [FR-001] Concrete action in exact/path`

`[P]` marks independent file work within an unblocked phase, not permission to skip prerequisites. Requirement tags may list multiple FRs. Paths for new modules are proposed implementation owners; create populated groups and explicit named indexes with their first implementation, not empty scaffolding.

## Setup — context and contract gate

- [x] T001 Recheck active feature with .specify/scripts/bash/check-prerequisites.sh, working-tree/PR state and docs/guidelines/git-flow.md; resolve 037 against current docs/roadmap.md and preserve the original checkout's unrelated staged 035 edits; record implementation base/scope in specs/037-interactive-onboarding/verification.md.
- [x] T002 Review spec.md, plan.md and contracts/onboarding.md against docs/workflow.md; run the speckit-analyze stage and resolve blocking findings in specs/037-interactive-onboarding/ before production edits. Read routed context in plan.md and pinned docs/zmk/{kscan,matrix-transform,keymap,kconfig-options,shield-files}.md before editing related copy/assertions.

## Foundation — completion and dependency boundaries

**Gate**: T001–T002. These are shared prerequisites; none claims a finished user story.

- [x] T003 Add failing immutable completion/transition tests in tests/unit/domain/onboarding/get-onboarding-progress.test.ts for nine unrotated 1u keys at unit pitch up to common translation, missing/extra keys, row-major stable-ID digit bindings, compatible board, diode/matrix/pin facts and invalid prerequisites after Undo; expected facts must be independent of the query under test.
- [x] T004 After T003, implement typed stable step/condition contracts and pure getOnboardingProgress in src/domain/onboarding/ with explicit index.ts; accept Project and supplied domain-shaped analysis/catalog facts, never DOM/I/O, catalog imports or UI types; distinguish project-result, acknowledgement, file-inspection and zip-download conditions.
- [x] T005 Register only needed public module aliases in tsconfig.json and onboarding shared UI ownership in docs/architecture.md, docs/folder-structure.md and scripts/check-architecture.mjs; extend architecture tooling tests in tests/tooling/ before changing the gate. Keep shared onboarding unable to import workspaces/app and preserve the sole UI analysis and generator bridges.

## US1 — Start once and protect existing work (P1)

**Independent acceptance**: first display is offered once; begin/exit/reload cannot replace the original Project; the original live Undo/Redo is restored exactly. Completion of the full exercise is not needed to verify this story.

- [x] T006 [US1] [FR-001,FR-002,FR-005] Add failing storage tests in tests/unit/storage/onboarding/onboarding-storage.test.ts for `version: 1`, `hasBeenShown: true`, missing/corrupt/future marker, unavailable/quota failures and independence from Project/preference resets; assert original stored bytes are untouched.
- [x] T007 [P] [US1] [FR-003,FR-004,FR-005] Add failing tests in tests/unit/storage/onboarding/onboarding-storage.test.ts for `version: 1`, `tutorialRevision: 1`, nested Project migrations, known stable stepId, acknowledgedStepIds bounded by the finite definition, and outcome `in-progress | closed | completed`; reject future versions, preserve malformed raw data, and test failed save/delete without normal-key writes.
- [x] T008 [US1] [FR-001–FR-005] After T006–T007, implement shown/session parsing and typed read/write/recovery results in src/storage/onboarding/onboarding-storage.ts and index.ts; reuse @storage/project parsing/migrations for nested Project, persist no timestamps/DOM/history and preserve corrupt/newer raw values until explicit recovery/discard.
- [x] T009 [US1] [FR-003–FR-005] Add failing real-provider session tests in tests/unit/ui/project/tutorial-session.test.ts for begin/resume, original past/present/future and backup flags, normal/tutorial writer routing for commit/undo/redo/replace, save-first tutorial acceptance, blocked damaged backup and failure before entry; verify normal autosave behavior remains unchanged.
- [x] T010 [US1] [FR-003–FR-005] After T009, extend src/ui/project/logic/project-state.ts and use-project-state.ts with discriminated `normal | tutorial` active session, parked original ProjectState and explicit persistence destination; save original and initial envelope before entry, publish tutorial candidate history only after successful save, and preserve previous accepted data on refusal.
- [x] T011 [US1] [FR-003,FR-004] Add failing switch/stale-action tests in tests/unit/ui/project/tutorial-session.test.ts for pending async imports, retained workspace drafts/previews and exact same-runtime original history restoration; after reload require ordinary original load and empty histories under the existing contract.
- [x] T012 [US1] [FR-003,FR-004] After T011, expose begin/resume/return actions in src/ui/project/logic/project-context.ts and src/ui/project/components/project-context.tsx; invalidate importSession on every switch and key workspace-local state by session identity in src/ui/app/components/workspace-view.tsx. Do not use history replace to park/restore original work.
- [x] T013 [US1] [FR-001,FR-002,FR-005] Add failing welcome integration tests in tests/unit/ui/integration/onboarding-navigation.test.ts for visible first offer, immediate marker, StrictMode, dismiss-before-practice, reload and marker-save warning; implement offer/start/error UI in src/ui/onboarding/components/onboarding-welcome.tsx and app composition in src/ui/app/components/app.tsx without render-time I/O.
- [x] T014 [US1] [FR-001–FR-005,FR-020] Add tests/e2e/onboarding-lifecycle.spec.ts using native UI import/edit/start/exit/reload; assert once-only welcome, ordinary original bytes, retained applied tutorial edits and original live Undo/Redo before reload. Start from both empty and nonempty ordinary projects.

## US2 — Create and download the real macropad (P1)

**Independent acceptance**: all practical conditions work through normal editors, reject previews/failed edits and produce a ZIP matching the current nine-key project. The final full-tour E2E is completed after US3's discovery cards are integrated.

- [x] T015 [US2] [FR-008–FR-012] Add failing tests in tests/unit/ui/project/tutorial-actions.test.ts for auto-advance exactly once after accepted edits, explicit acknowledgement of already-correct values, no preview/rejected-save advancement, Back/Undo prerequisite invalidation and no duplicate entities on revisits.
- [x] T016 [US2] [FR-008–FR-012] After T015, integrate pure condition evaluation into accepted actions in src/ui/project/logic/ and implement step definitions/copy in src/ui/onboarding/logic/onboarding-steps.ts; pass cached getProjectAnalysis facts instead of invoking electrical engines from UI. Track IDs, derive number/count and require explicit informational acknowledgements.
- [x] T017 [US2] [FR-007,FR-008] Establish typed target metadata in src/ui/onboarding/logic/onboarding-steps.ts and real anchors in src/ui/app/components/app.tsx, src/ui/shell/components/project-bar.tsx, src/ui/schematic/wiring/components/controller-panel.tsx and src/ui/schematic/components/schematic-editor-panel.tsx; include normal Add key/position keyboard path and real Apply/Cancel in composite targets.
- [x] T018 [US2] [FR-008,FR-009] Implement practical guidance for name, nine positions, board, diodes, matrix and six GPIO lines in src/ui/onboarding/logic/onboarding-steps.ts; use catalog-backed labels and ordinary controls, allow valid supported board alternatives, acknowledge already-correct pins, and never auto-insert a preset or silently apply wiring.
- [x] T019 [US2] [FR-007–FR-011] Integrate Bindings, Problems repair and Firmware inspection targets through src/ui/bindings/components/bindings-workspace.tsx, src/ui/firmware/components/firmware-workspace.tsx and src/ui/shell/components/issues-panel.tsx; show base-layer digits 1–9, valid empty Problems state and explicit confirmation of compatible firmware defaults without mandatory overrides.
- [x] T020 [US2] [FR-010,FR-012] Add failing tests in tests/unit/ui/project/tutorial-actions.test.ts and tests/unit/ui/export/logic/use-export-actions.test.ts for file inspection, blocked export, ZIP failure/retry, same-project success, changed-project stale success and session-switch stale success. Require actual keymap/.conf/shield inspection, not their initially open DOM or status-text matching.
- [x] T021 [US2] [FR-010,FR-012] After T020, report typed inspection and successful browser-handoff signals from src/ui/export/components/file-preview.tsx and src/ui/export/logic/use-export-actions.ts, compose via export-workspace.tsx and existing ProjectContext; capture session/Project identity and ignore stale results. Preserve existing ZIP lock, failure messages and the sole generator bridge.
- [x] T022 [US2] [FR-008–FR-012,FR-020] Add tests/e2e/onboarding-macropad.spec.ts performing normal nine-key editing, wiring Apply, bindings, Problems, firmware, file inspection and actual ZIP download; unzip and compare paths/bytes to displayed preview and independent matrix/digit expectations. Add cancel-preview, Undo/repair and ZIP retry assertions; wire final discovery/finish expectations after T037.

## US4 — Keyboard, focus and accessible spotlight (P1)

**Independent acceptance**: a real step's controls remain usable inside the spotlight; keyboard can reach its target, explanation and exit; scrolling/resize and missing targets never trap the user. Final full keyboard journey depends on US3 integration.

- [x] T023 [US4] [FR-006,FR-017–FR-019] Add failing interaction tests in tests/e2e/onboarding-accessibility.spec.ts for composite-target reachability, unrelated commands blocked, visible Exit, nested Escape precedence, focus restoration, workspace heading coordination, missing-target Retry/Exit and observer/listener/inert cleanup.
- [x] T024 [US4] [FR-006,FR-019] After T023, implement target lookup/reveal/measurement in src/ui/onboarding/logic/use-onboarding-target.ts using typed anchor IDs, rendered readiness and ResizeObserver/scroll listeners; use normal workspace/panel state and never inject edit events or infer success from missing targets.
- [x] T025 [US4] [FR-006,FR-007,FR-019] Implement non-modal src/ui/onboarding/components/onboarding-spotlight.tsx and onboarding-panel.tsx with SVG geometry mask/shield, named semantic scrim token in src/styles.css if needed, readable explanation/progress and a reserved lower panel on constrained screens; preserve target/focus/Apply visibility, text 200% and reduced motion.
- [x] T026 [US4] [FR-017,FR-018] Implement focus/inert lifecycle in src/ui/onboarding/logic/use-onboarding-focus.ts and coordinate workspace heading behavior in src/ui/app/components/workspace-view.tsx; inert only unrelated branches, preserve target/tooltip/status/nested-dialog ancestors, move focus only on real step change and announce through existing shell status.
- [x] T027 [US4] [FR-006,FR-017] Update src/ui/app/logic/use-global-shortcuts.ts and applicable scoped dispatchers in src/ui/schematic/interaction/use-schematic-shortcuts.ts and src/ui/bindings/interaction/use-bindings-shortcuts.ts so dimmed New/Open and unrelated shortcuts cannot alter the active session; preserve native text editing and nested draft/dialog Escape before safe tour exit.
- [ ] T028 [US4] [FR-017–FR-021] Add tests/e2e/onboarding-accessibility.spec.ts for native keyboard target/action/exit, focus restoration, scroll/resize, missing targets and no covered controls; include representative Firefox/WebKit focus/geometry cases and Chromium light/dark, 1024/1280px, constrained panel, 200% text and reduced-motion checks.
- [x] T029 [US4] [FR-019,FR-021] Update the production effect inventory in docs/guidelines/frontend/react.md for the actual shown-marker, target-observer and focus/inert synchronization files introduced; document purposes/cleanup and verify no derived progression/autosave effects or new context were added.

## US3 — Control the pace, discover and replay (P2)

**Independent acceptance**: Back changes only the step; Skip/Exit never certify completion; lower replay offers safe new/resume; every FR-015 area is introduced without editing the macropad; adoption is explicit and safe.

- [x] T030 [US3] [FR-013,FR-014,FR-016] Add failing tests in tests/unit/ui/integration/onboarding-navigation.test.ts for Back/Next gating, skip vs complete, retained/new-draft confirmation, canceled exit/adoption, replay after dismissal/completion and lower control availability in every workspace.
- [x] T031 [P] [US3] [FR-016] Add failing adoption/cleanup tests in tests/unit/ui/project/tutorial-actions.test.ts for offering original-file save, explicit confirmation, failed ordinary save, successful write-before-replacement, canceled replacement and cleanup failure; original data/history must survive every failed/canceled transition.
- [x] T032 [US3] [FR-016] After T031, implement adoption in src/ui/project/logic/ and expose through src/ui/project/components/project-context.tsx: normal save succeeds before activating replacement or deleting draft; failure retains both sessions; successful replacement uses ordinary replacement history rules and later cleanup failure cannot roll back saved Project.
- [x] T033 [US3] [FR-013,FR-016] After T030/T032, implement retain/discard exit, finished-result and adoption confirmations in src/ui/onboarding/components/onboarding-session-dialogs.tsx; use existing Dialog and concrete action names, preserve data on cancel/failure, restore original workspace/focus and explain external build/flash.
- [x] T034 [US3] [FR-014] Add the permanent `Take the tour again` action to src/ui/shell/components/tab-bar.tsx via app composition props; implement new/resume choice with confirmed retained-draft discard in src/ui/onboarding/components/onboarding-welcome.tsx, including narrow labeled icon/focus tooltip and every workspace.
- [x] T035 [US3] [FR-015] Add complete informational content/targets in src/ui/onboarding/logic/onboarding-steps.ts covering presets, Project/KLE import, save/open, agent creation, layers/conditional layers, standard/custom behaviors, combos/macros, encoders, supported board/topology/scan alternatives, app settings and firmware; exclude deferred features and execute no destructive advanced action.
- [x] T036 [US3] [FR-013,FR-015] Add coverage in tests/unit/ui/integration/onboarding-discovery.test.ts asserting every FR-015 area has concise what/why/action copy and a current entry-point target, can continue without Project mutation and appears before final ZIP; use ordinary labels and keyboard alternatives.
- [x] T037 [US3] [FR-013–FR-016,FR-020] Extend tests/e2e/onboarding-lifecycle.spec.ts with replay after skip/completion, safe fresh/resume choice, Back and adopt/cancel; finish the complete real-project→discovery→ZIP journey in tests/e2e/onboarding-macropad.spec.ts and full keyboard-only export in tests/e2e/onboarding-accessibility.spec.ts.

## Verification and completion

- [x] T038 [FR-022] Add the maintenance rule to docs/agent-rules.md: when adding/changing/removing features or user flows, update affected tutorial steps, targets, text and verification in the same change; otherwise record why no update is needed in that feature's verification evidence. Verify exact scope against FR-022 and owning docs/workflow.md.
- [x] T039 [FR-020] Add/execute one controlled user-visible onboarding regression using the established browser mutation approach in scripts/check-e2e-mutations.mjs and scripts/mutation-runner.mjs, or a focused one-off isolated probe if the runner cannot isolate it; require the expected progression/focus assertion to fail and restore exact original bytes. Run alone; record mutation, assertion and restoration in specs/037-interactive-onboarding/verification.md.
- [ ] T040 [FR-021] Perform rendered review using isolated Playwright against spec/contract and frontend guidelines; record stable finding IDs, fixes and screenshots in specs/037-interactive-onboarding/verification.md for empty/error/disabled/success states, target geometry, focus, themes, narrow layout, text zoom and reduced motion. Resolve acceptance failures before completion.
- [ ] T041 [FR-017–FR-021] Perform actual keyboard-only and VoiceOver/Safari or NVDA/Firefox smoke checks under docs/guidelines/frontend/accessibility.md; record actual steps/results and unperformed checks honestly in specs/037-interactive-onboarding/verification.md. Do not equate automated DOM checks to spoken screen-reader evidence.
- [x] T042 Reconcile only relevant 037 index/status and obsolete 038 dependency wording in specs/README.md and docs/roadmap.md after inspecting current ownership and the original checkout's staged corrections; preserve the user's cancellation and final README closeout scope without absorbing unrelated 035 changes.
- [x] T043 [FR-020,FR-021] Stage explicit final implementation/test/docs paths and run npm run check:changed using docs/commands.md; record exact SHA/tree, complete log paths, actual results and remaining manual limits in specs/037-interactive-onboarding/verification.md. Broaden/repeat only for changed code, failures or unresolved concerns; do not claim firmware builds or CI results not observed.
- [ ] T044 Reconcile this requirement mapping, task status and specs/037-interactive-onboarding/{spec,plan,quickstart}.md against delivered behavior; review final diff and git-flow gates, then commit/push and open one feature PR (draft if manual acceptance is outstanding), link its single verification journal, set the appropriate release label and stop without merge/CI polling.

## Dependencies

T001 → T002 → T003 → T004 → T005 establishes contracts and module boundaries. T006 and T007 share the consolidated storage test file and run sequentially after foundation; both precede T008. US1 T009–T014 depends on the validated storage APIs. No tutorial may ship active before writer routing is safe.

US2 depends on US1's session/state API; T015 precedes T016, and T020 precedes T021. US4 can start after the session contract and typed target anchors are ready; T023 precedes T024–T027. US3 navigation/adoption tests precede implementation; T030 and T031 may run in parallel in separate files, but shared project-context/session implementation stays sequential. T037 joins US2, US4 and US3 before final end-to-end acceptance.

Cross-cutting T038–T042 follow implemented stories; T039 runs alone. Final fixes precede T043; T044 follows valid check evidence and disclosure of manual limits. No feature stacks, automatic merge or unrelated roadmap work.

### Parallel examples

- US1: storage contracts T006/T007 share a file and run sequentially; session browser assertions can be prepared separately after the API is stable.
- US2: after T016 and agreeing target IDs, Schematic anchors T017 and export tests T020 have separate owners/files; T021 waits for T020. T018 shares step content with T016/T035 and stays sequential.
- US4: after T023/T024, visual overlay T025 and shortcut handling T027 can proceed independently only while app composition/target APIs remain stable; focus integration T026 coordinates with both before T028.
- US3: T030 navigation tests and T031 adoption tests are explicitly parallel; T032–T034 share provider/dialog contracts and execute in order. Final discovery content precedes T036/T037.

These are scheduling opportunities, not a request to spawn agents during implementation. Reassess file conflicts against the live tree.

## Implementation strategy

First deliver a safe vertical slice of US1: first offer, isolated practice and return/reload with exact original preservation. This is the MVP checkpoint for review, not permission to omit the rest of 037. Add practical editing/export, accessible interaction and discovery/replay incrementally, retaining one feature branch and one complete PR. All P1 acceptance and requested P2 scope remain required before marking the feature complete.

## Requirement coverage

This is the single requirement → task → check → evidence mapping. Evidence links to executed results in the single `verification.md` journal; the specification checklist and planning receipts are not implementation evidence.

| Requirement / scenario | Tasks | Test or check / observable assertion | Evidence |
| --- | --- | --- | --- |
| FR-001 / US1.1,3 | T006,T008,T013,T014 | shown-record + first-visit + lifecycle; one offer including StrictMode/reload | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-002 / US1.3 | T006,T008,T013,T014 | marker unaffected by Project import/reset/history | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-003 / US1.2 / SC-004 | T007–T012,T014 | original bytes/history untouched by tutorial edits or failed entry | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-004 / US1.4 / SC-004 | T007–T012,T014 | normal reload, retained accepted draft, exact same-runtime original Undo/Redo | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-005 / US1.5 | T006–T010,T013 | unavailable/quota/damaged backup refusal and readable exit | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-006 / US4.1,3 | T023–T028 | real target clickable/focusable; unrelated commands blocked | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-007 / US2,US4.2 | T017–T019,T025 | adjacent what/why/action, current number/count and unmet condition | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-008 / US2 table / SC-002 | T003,T004,T015–T019,T022 | nine real 1u keys, board/diodes/applied matrix/pins, digit bindings | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-009 / US2.2,3 / SC-003 | T015,T016,T018,T022 | exactly one transition after accepted result; no preview success | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-010 / US3.1 / SC-003 | T003,T004,T015,T016,T020–T022 | Undo/Back recomputation, no duplicates/stale async receipt | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-011 / US2.4 | T015,T019,T022 | ordinary Problems, repair links, empty state and no validation bypass | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-012 / US2.1,5 / SC-002,3 | T020–T022,T037 | real ZIP bytes match preview; failed/stale download cannot finish | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-013 / US3.1–3 | T030,T033,T035–T037 | Back/Next gating; skip/exit do not complete | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-014 / US3.5 | T030,T034,T037 | permanent lower replay in every workspace and safe new/resume | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-015 / US3.4 / SC-005 | T035–T037 | complete area inventory with real targets; no advanced edits required | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-016 / US3.3,6 / SC-004 | T030–T033,T037 | explicit replace/save-original opportunity; save-before-adopt; safe cancel/failure | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-017 / US4.1,5 / SC-006 | T023,T026–T028,T037,T041 | full keyboard ZIP path, nested Escape and restored focus | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-018 / US4.2 / SC-006 | T023,T026,T028,T041 | single status, meaningful names, screen-reader speech and safe exit | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-019 / US4.3,4 / SC-007 | T024–T029,T040 | no covered target/control under themes/zoom/scroll/reduced motion | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-020 / all stories / SC-001–6,8 | T014,T022,T028,T037,T039,T043 | lifecycle + full export; controlled assertion failure; exact-tree checks | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-021 / US4 / SC-007,8 | T028,T040,T041,T043 | rendered/manual review with observed results and explicit limits | [Automated results and limits](verification.md#final-automated-results-and-rebase) |
| FR-022 / SC-008 | T038,T044 | owning agent-rule text and final traceability/content review | [Automated results and limits](verification.md#final-automated-results-and-rebase) |

T028 is partial: native keyboard/cross-browser/theme/viewport/reduced-motion checks passed; actual 200% text acceptance remains with T040. T040 and T041 remain open until the manual checks documented in the verification journal are performed. Automated results do not close these acceptance tasks.
