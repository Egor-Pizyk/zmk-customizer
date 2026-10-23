# Tasks — item 1

- [x] E001 [FR-001–006] Specify approved button/contact model and pre-UI guidance in spec.md/plan.md.
- [x] E002 [FR-001–003] Tests first, pure placement/association/geometry/wire-net operations and validation in src/domain and tests/unit/domain.
- [x] E003 [P] [FR-004] Tests first, schema 13 migration and ownership/endpoint parser in src/storage and tests/unit/storage.
- [x] E004 [P] [FR-001, FR-005] Tests first, encoder tool/rendering/editor and pointer/keyboard alternatives in src/ui/schematic and tests/unit/ui.
- [x] E005 [FR-006] Wire-derived generator golden/no-encoder compatibility and actual exported build validation in tests/unit/generators and existing build fixtures.
- [x] E006 [FR-001–006] Real browser lifecycle/download/geometry/connection cases, sensitive behavioral regression and rendered pre/post skill review; record verification.md.
- [ ] E007 Verify changed checks, review diff, make one item-1 commit, deliver manual checklist and stop. No subsequent item until user approval.
- [ ] E008 User manual keyboard/speech/native zoom and physical wiring review; record supplied results only.
- [x] E009 [FR-008] Show and drag handles for every saved or derived right-angle wire corner; verify the rendered and persisted result, commit separately, and stop for manual acceptance.

Dependencies: E001→E002/E003/E004→E005→E006→E007. Storage and presentation groups may run as parallel agent work under the implementation skill; shared types and nets have one owner. E008 is manual, not inferred from automated tests. Traceability is this task mapping with exact checks in verification.md.

- [x] E010 [FR-008] Deduplicate coincident corner handles across saved/derived points and wires; reproduce rendering regression, fix and verify separately.

- [x] E011 [FR-008] Remove redundant collinear handles, retain one handle on a straight wire and preserve actual turns; red/green rendering tests and browser regression checks.

- [x] E012 [FR-008] Fix corner expansion without obsolete-waypoint loops; test adjacent-corner movement, both turn orientations, fixed anchors and browser Undo.

- [x] E013 [FR-009] Add Encoder E shortcut and shared icon/help hint, verify real keyboard placement and guards, review rendered tooltip, commit and update existing PR; leave contact labels and wire highlight for subsequent steps.

- [x] E014 [FR-010] Remove Bindings contact text; verify encoder artwork and push binding remain, Schematic labels remain; inspect rendered result.
- [x] E015 [FR-011] Reproduce lost bend-drag highlight, render whole-wire selection during/after drag, verify section guards, Escape and existing history; record checks and update PR. Both follow-ups explicitly authorized together.

## Item 2

- [x] R001 [FR-012] Tests first: speed/capture/hold/release/wrap/Snap-off/Shift and center-preserving explicit key angle.
- [x] R002 [FR-012] Integrate shared pure rotation queries into key and encoder transient pointer gestures; preserve numeric editing and history.
- [x] R003 [FR-012] Real key/encoder slow rotation, release/cancel/Undo/Redo and rendered UI/UX review; prove behavioral sensitivity.
- [x] R004 [FR-012] Changed snapshot checks, journal, one item-2 commit and existing draft PR update; stop before topology work. Manual E008 stays open.

## Item 3

- [x] T001 [FR-013] Reproduce automatic-wiring unibody→split→unibody without closing Wiring; fix owning routing/preview layer with regression coverage.
- [x] T002 [FR-013] Verify immediate canvas/table agreement, Cancel/Apply, history/reload and rendered UI/UX review.
- [x] T003 [FR-013] Changed checks, journal, one item-3 commit and existing PR update; stop before panel resizing.

## Items 4–5

- [x] P001 [FR-014–016] Specify limits/persistence; storage regressions first, implement additive preference and live pointer/keyboard resize with responsive layout.
- [x] P002 [FR-014–016] Browser drag/limits/cancel/reload/keyboard/viewport persistence and rendered light/dark review; sensitivity check, changed checks, journal and item-4 commit.
- [x] P003 [FR-017] Remove global Collapse/Close modes/buttons and obsolete reveal listener; preserve individual sections and repair focus; update integration/browser checks.
- [x] P004 [FR-017] Changed checks, final rendered review, journal and item-5 commit; update existing PR and deliver manual acceptance steps.

## Item 6

- [x] D001 [FR-018] Specify the shared matrix/diode link, reproduce duplicate destinations in the real browser, remove the duplicate and retain catalog/topology sources.
- [x] D002 [FR-018] Verify mode/topology/link focus, unchanged project, light/dark desktop/narrow rendered review and changed checks; record evidence, one commit, update draft PR and stop.

## Items 7–8

- [x] W001 [FR-019] Audit existing wired/unwired Rebuild/Complete route preview→Apply/history and record what already passes; reproduce remaining pointer selection/tool/feedback failures before fixing.
- [x] W002 [FR-019–020] Repair wired proposal inspection, preview-scoped selection/marks and mutation guards; verify pointer/keyboard/Select behavior, render review, checks, journal and item-7 commit.
- [x] W003 [FR-021] Verify fresh/no-wire matrix/direct Rebuild/Complete inspection, explicit cancellation and applied lifecycle; fix any remaining item-8 gaps without changing routing unless reproduced.
- [x] W004 [FR-021] Sensitivity, relevant cross-engine/rendered checks, changed checks, accurate evidence/task status, item-8 commit and existing draft PR update; stop before item 9.
