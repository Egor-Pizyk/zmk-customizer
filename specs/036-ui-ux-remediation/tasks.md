# Tasks — item 1

- [x] E001 [FR-001–006] Specify approved button/contact model and pre-UI guidance in spec.md/plan.md.
- [x] E002 [FR-001–003] Tests first, pure placement/association/geometry/wire-net operations and validation in src/domain and tests/unit/domain.
- [x] E003 [P] [FR-004] Tests first, schema 13 migration and ownership/endpoint parser in src/storage and tests/unit/storage.
- [x] E004 [P] [FR-001, FR-005] Tests first, encoder tool/rendering/editor and pointer/keyboard alternatives in src/ui/schematic and tests/unit/ui.
- [x] E005 [FR-006] Wire-derived generator golden/no-encoder compatibility and actual exported build validation in tests/unit/generators and existing build fixtures.
- [x] E006 [FR-001–006] Real browser lifecycle/download/geometry/connection cases, sensitive behavioral regression and rendered pre/post skill review; record verification.md.
- [x] E007 Changed checks, item-1 delivery and subsequent authorized itemwise work are recorded in verification.md; stale checkbox reconciled 2026-10-25.
- [x] E008 User reported all requested manual testing passed on 2026-10-25. Environment details were not supplied; this records user acceptance, not agent-observed speech/zoom or firmware/hardware certification.
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

## Item 9

- [x] M001 [FR-022] Reproduce hand-drawn 2×2 horizontal refusal with vertical/automatic controls; repair domain crossing continuity, retain partition/overlap/resource protection.
- [x] M002 [FR-022] Real pointer preview/cancel/history/reload, numeric/nudge coverage, rendered review, changed checks, evidence and separate item-9 commit; then item 10 is authorized.

## Item 10

- [x] C001 [FR-023] Audit connected L crossings on both arms and both sides; add independent section/net regressions, repair only reproduced failures.
- [x] C002 [FR-023] Real pointer/Shift/list selection, safe deletion/Undo, insulated continuity, rendered light/dark review and changed checks; record results, separate item-10 commit and update existing draft PR. Stop before item 11.

## Item 11

- [x] Q001 [FR-024, FR-026] Failing segment/marquee and immutable mixed-deletion/stale/refusal/free-conductor regressions before owning-layer fixes.
- [x] Q002 [FR-024–026] Shared mixed selection, intersecting/Shift marquee, pointer/keyboard/list parity, rendering/counts and atomic deletion feedback.
- [x] Q003 [FR-024–026] Real wire/mixed/Shift/cancel/list/delete/history/reload browser scenarios, sensitivity and rendered review.
- [x] Q004 [FR-024–026] Changed checks, journal/manual acceptance status, one item-11 commit and existing draft PR update; stop before item 12.


## Items 12–15 (jointly authorized)

- [x] U012 [FR-027] Remove Reset view UI/shortcut/helper/icon and reconcile 001 contracts/tests; real browser viewport/history preservation and rendered review; separate item-12 commit.
- [x] U013 [FR-028] Gear SVG; keyboard Settings/focus/theme review; separate item-13 commit.
- [x] U014 [FR-029] Record exact user-selected Wiring action, remove redundant entry point, preserve retained lifecycle and compatibility; separate item-14 commit.
- [x] U015 [FR-030] Reproduce/audit Key Escape, repair owning interaction only if failing; draft/dialog precedence and real browser Select/no-placement/history assertions; separate item-15 commit.
- [x] U016 [FR-027–030] Changed checks, final rendered review/evidence, update existing PR and deliver combined manual checklist; stop before item 16.

## Items 16–17 (jointly authorized)

- [x] V016 [FR-031] Reproduce missing/state/clipped hints; implement canvas hover/focus hints, empty-state explanation and viewport alignment; browser/rendered review, changed checks and separate item-16 commit.
- [x] V017 [FR-032] Move agent action after history, secondary outline/AI badge with stable name; keyboard/dialog/focus and wrapped light/dark rendered verification, changed checks and separate item-17 commit; update PR, stop before 18–19.

## Items 18–19 (jointly authorized)

- [x] B018 [FR-033] Tests-first clipboard snapshot/filter/paste and shortcut scope; implement domain/UI/help, real Meta/Ctrl/native-field/Bindings/history/persistence verification and rendered review; changed checks, separate item-18 commit.
- [x] B019 [FR-034] Reproduce numeric displacement, pure own-center/table/batch fix with explicit-origin compatibility; audit encoders, real browser centers/corners/history/cancel/reload and themes; changed checks, separate item-19 commit, journal and update draft PR.


## Items 20–21 (jointly authorized)

- [x] H020 [FR-035] Remove Bindings Snap only, preserve shared Settings/Schematic preference/shortcuts; browser persistence/history/hints and rendered review, changed checks, separate commit.
- [x] H021 [FR-036] Conditional danger Problems text/count, neutral zero; browser live count/theme/keyboard panel and rendered review, changed checks, separate commit and existing PR update.


## Items 22–23 (jointly authorized)

- [x] J022 [FR-037] Reproduce Tools overlap in real browser; reserve toolbar space, verify moved/expanded Tools, painted pointer/keyboard controls, hints/themes/reflow and unchanged project; separate commit.
- [x] J023 [FR-038] Reproduce hidden preview actions while nested editor scrolls; compose persistent status/actions, preserve refusal/Cancel/Apply/history, browser rendered review and staged changed checks; separate commit, journal and existing draft PR update. User-reported manual acceptance recorded 2026-10-25; see verification.md.

## CI delivery repair (explicitly authorized)

- [x] CI036 Diagnose run 40180032666; restore current mutation anchors and actual detection, cover missing 036 UI branches without lowering thresholds, reproduce/repair native Firefox/WebKit bend/rotated-key failures with meaningful assertions. Run focused/full CI-equivalent checks where needed and final staged checks; record evidence. Update existing PR, retain exactly release:minor, mark ready and enable protected squash auto-merge. Local repair/check evidence is in verification.md; external ready/auto-merge state is recorded in PR #24 on delivery. Do not bypass checks or claim a release before publication.

## Right-docked Editors follow-up

- [x] RD001 [FR-014–017] Right desktop dock, left-edge pointer/keyboard resize and matching content/footer clearance; retain narrow layout and saved width.
- [x] RD002 [FR-014–017] Update real-browser geometry/resize coverage, inspect light/dark desktop/narrow renders, run staged changed checks and record verification/manual limits.

## Editors hierarchy

- [x] H039 [FR-039] Normalize peer section sizing and nested Layout properties; review rendered themes/narrow layout, run staged checks and record evidence in verification.md.

## CI resize regression — 2026-10-26

- [x] CI-R01 [FR-014–016] Diagnose Firefox drag-limit failure from run 40218946787 and reproduce before repair. Keep native pointer trajectories inside the viewport while still exceeding both width limits; preserve all clamp/cancel/persistence/keyboard assertions. Run targeted cross-engine tests, required changed checks and record evidence in verification.md.
