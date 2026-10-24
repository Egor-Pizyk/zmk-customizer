# Wiring Interaction and Output Contracts

## Editor and preview

Schematic exposes Wiring controls after controller selection, with scanning/topology/direction, per-half grid and assignments table, row/column or input pins, and Auto assign. All controls have native labels and v0.3 explanation/docs. Grid cells show every occupant, empty cells and conflicts; selecting a key then activating a cell drafts reassignment. The table offers equivalent numeric row/column and half controls. Pin names use selected board catalog; unavailable values remain visibly repairable, reserved contacts are explanatory rather than selectable GPIO.

Drafting a connection edit renders a circuit preview and summary of rerouted connections, diode changes and dropped incompatible assignments. Apply commits once, Cancel/Escape restores exact project, external project changes invalidate preview. Refused routing shows a named actionable reason and cannot Apply. Validation issues in a draft do not replace saved-project problems or accidentally enable saved-project download. Wiring and layout previews cannot coexist; activating one cancels the other.

Automatic assignment uses physical centers and current grid step, groups quantized y into rows, sorts x per row and retains key order. Sparse manual cells remain sparse; shrinking dimensions cannot silently discard occupied cells. Increasing dimensions creates empty unassigned buses. Split center-x midpoint chooses initial halves, ties left. Empty halves block export. Direction change previews diode reversal while preserving axes/pins. Direct conversion previews pin1 input/pin2 GND and diode removal.

## Manual schematic agreement

Parts endpoint controls can choose the same terminal identities as the editor; editing GPIO edits the shared terminal assignment. Existing legacy endpoints remain editable during repair. Drawing/removing wires refreshes derived cell membership. A key connected to two same-axis nets, several terminals of one axis, a ground in matrix mode, or wrong-half terminal is invalid. Joining distinct controller GPIOs on one net is a short. No fallback generated output overrides actual nets.

## Export

Only a domain-validated derived scan enters generators. Preview and ZIP contain identical bytes. Unibody matrix legacy formatting remains unchanged. Direct emits active-low/pull-up inputs in explicit input order and RC(0,i). Split has shared whole-keyboard transform/layout, local GPIO lists per half, right col-offset equal to left width/input count, two exact v0.3 board targets, left-only name/central role and shared split defaults. No chosen matrix-transform is emitted. config/<name>.keymap and conf remain shared; all layers and physical attributes follow project.keys globally. No mixed scanning/different boards/wired split output.

Source contracts: docs/zmk/{kscan,matrix-transform,shield-files,physical-layout,boards}.md.

## Coverage matrix

| Scenario | Risk | Existing coverage | New E2E | Visible assertion | Saved/exported assertion |
|---|---|---|---|---|---|
| Matrix grid/table move + pin edit | axis renumbering, schematic divergence | legacy net/matrix units | wiring.spec.ts matrix | cell and pin labels, changed wires | terminal membership and ZIP RC/GPIO |
| Auto assign rotated/staggered keys | geometry mutation, shorts | layout browser geometry | wiring.spec.ts auto | preview connections/cells | exact geometry/bindings retained and actual nets |
| Cancel/Apply/Undo/Redo/reload | partial commits/lost data | existing history/storage | wiring.spec.ts persistence | preview/cancel and restored grid | exact project and JSON round-trip |
| Duplicate cell/GPIO, missing assignments | false valid export | validation/export units | wiring.spec.ts repair | both occupants and named issues, disabled download | repaired ZIP and clear issues |
| Matrix direction change | wrong GPIO flags/diodes | current matrix goldens | wiring.spec.ts direction | direction and diode preview | diodes and exported flags |
| Direct configure | fake ground/wrong key order | none | wiring.spec.ts direct | per-key inputs and GND | input GPIO order/RC, compile fixture |
| Split configure/reassign | cross-half GPIO collision, wrong offset | upstream corne fixture | wiring.spec.ts split | half assignments/pins | both overlays/Kconfig/build targets |
| Native keyboard/focus and SVG preview | browser differences | existing focused cross-browser tests | wiring-cross-browser.spec.ts | keyboard selection, preview, focus and key corners | accepted project |

Add controlled browser regressions for lost rewiring, preview saved before Apply and missing split offset; require visible/saved/downloaded assertion failures. Run separately with exact file restoration. Browser paint snapshots only where they independently detect wiring paint mistakes; inspect references before accepting them.

## Feature 032 extension

[032](../../032-project-creation-and-auto-wiring/spec.md) extends explicit Auto assign with free catalog GPIO proposals, retaining valid assignments and reserving per-controller encoder/retained manual contacts. Invalid/conflicting pins or insufficient capacity refuse atomically with repair guidance. Existing center/grid grouping remains; users may change the grid or manually group rows. Outward row/input outputs use left/right per half; column/ground outputs choose top/bottom clearance with deterministic spacing/fallback outside rotated key geometry. Existing preview/Apply/Cancel, actual connectivity, storage/history and export contracts remain. Other wiring edits do not implicitly fill missing GPIOs.

## Feature 033 interaction extension

Complete wiring is additive: retain each existing known axis, half, GPIO and deliberate conductor, filling only missing compatible connections with preview. Rebuild wiring is a separate explicit action with the former Auto assign replacement behavior and 032 output/allocation rules. Refused/cancelled proposals do not write saved state. Actual schematic connectivity remains authoritative.

### 036 items 7–8 preview inspection amendment

Read-only wiring proposals allow selection against the displayed proposal, including a keyboard wire-section inspector. Select and refused editing-tool/shortcut attempts preserve that proposal. Canvas edits require Apply/Cancel; explicit Cancel/Escape/editor dismissal announces saved-circuit restoration. Preview connection marks describe the proposal, while saved Problems/export eligibility remain unchanged. See 036 FR-019–021 and its verification journal.
