# Feature Specification: Layout editor

**Feature Branch**: `012-layout-editor`
**Created**: 2026-10-13
**Status**: Verified, including direct-manipulation follow-up
**Input**: Complete arbitrary physical layouts in Schematic, preserving the contracts of features 001–011 and 024 and targeting ZMK v0.3.

## User Scenarios & Testing

### User Story 1 — Edit physical geometry (Priority: P1)

A builder edits wide, tall and rotated keys around an absolute origin, using the canvas or numeric fields, and sees the same layout in Bindings.

**Why this priority**: Nonstandard geometry is the remaining core layout capability.
**Independent Test**: Set a key to 2.25u × 1.5u, 30°, origin (3u, 2u), inspect both workspaces, reload, undo and redo.
**Acceptance Scenarios**:
1. Given a 1u key, when width, height, angle or origin is committed, then the visible key uses those values, bindings and diode polarity stay attached to its identity, and one Undo restores each edit.
2. Given several selected keys, when moved, resized or rotated, then all selected keys change in one Undo step and unselected keys stay unchanged.
3. Given a draft gesture or field, when cancelled, then saved geometry and Redo stay unchanged.
4. Given touching or rotated keys, when their interiors overlap, then the affected keys have a repairable overlap problem; touching edges alone are allowed.

### User Story 2 — Build and organize a layout (Priority: P2)

A builder selects, duplicates, deletes and renumbers keys without losing actions or electrical references.

**Why this priority**: Repeating clusters and predictable key order avoid manual reconstruction.
**Independent Test**: Duplicate a selected cluster, renumber by position, delete a key, undo each operation and inspect all layers.
**Acceptance Scenarios**:
1. Given selected keys with bindings and diodes, when duplicated, then new stable identities are appended in source order with matching geometry, bindings on every layer and diode data, translated to the right of the existing layout, without copied wires.
2. Given reordered keys including a rotated cluster, when renumbered by position, then visible centers order top-to-bottom, then left-to-right, ties retain former order, and IDs, bindings and wire endpoint references stay unchanged.
3. Given a key deletion, then indices remain contiguous, bindings for that key disappear from all layers, and existing wire cleanup semantics remain intact.

### User Story 3 — Work without a mouse and export (Priority: P1)

A keyboard or screen-reader user edits every property, selects multiple keys and performs every operation through the Keys table and tools; the resulting export describes the same physical layout.

**Why this priority**: Accessibility and correct firmware output are product guarantees.
**Independent Test**: Complete move/resize/rotate/duplicate/renumber/delete using labeled controls and shortcuts; export a wired nonstandard layout and build it with ZMK v0.3.
**Acceptance Scenarios**:
1. Given a focused canvas key, arrows navigate keys, Shift+arrows nudge the selection by the existing grid step, Home/End navigate order, Mod+Space toggles selection, Delete removes selection and Escape cancels a draft before clearing selection.
2. Given focus in a numeric input, native typing and arrow stepping win; Enter/blur commits and Escape discards.
3. Given a previously stored project, loading preserves its former 1u, unrotated geometry and all data.
4. Given valid geometry, physical-layout export contains dimensions, position, clockwise angle and absolute origin in hundredths, in key-index order, identically across repeated exports.

### Edge Cases

Empty/stale selections and unchanged edits do nothing and preserve Redo. Duplication at the 512-key budget is refused atomically with a readable announcement. Zero/negative sizes and values outside ZMK signed 16-bit cell range are repairable problems and block export. Non-finite imported values are rejected. Rotated corners may extend outside the unrotated bounding box. Existing electrical intersections may change when endpoints move: references and bends survive; connectivity is reanalysed and conflicts block export. Extremely large exact IDs retain lossless allocation. No inferred row grouping is used by renumber.

## Requirements

### Functional Requirements

- **FR-001**: Support x/y, width/height in u, clockwise angle in degrees and absolute rotation-origin x/y in u; 1u = 19.05mm. Default size 1u × 1u, angle and origin zero.
- **FR-002**: Preserve existing blank/preset, create, single/multi-selection, drag, delete, snap and history flows; extend geometry rather than recreate these capabilities.
- **FR-003**: Provide numeric editing for all seven properties, selection checkboxes and batch move/resize/rotate, duplicate, delete and renumber controls reachable without the canvas.
- **FR-004**: Move translates rotation origins along with x/y; numeric/batch resize holds unrotated top-left and rotation origin fixed; numeric angle alone rotates each selected key about its own visible center; explicitly editing an origin retains deliberate absolute-origin rotation (036 FR-034).
- **FR-005**: Switch bodies and pins rotate with the key, centered on its resized keycap. Attached wire endpoints follow the transformed pins; bends and free ends stay put. Preserve diode pin and polarity and reuse electrical analysis/crossing cleanup.
- **FR-006**: Detect overlaps using rotated keycap rectangles, allowing edge contact. Numeric edits may create conflicts; pointer placement retains existing conflict refusal with accurate geometry.
- **FR-007**: Duplicate geometry, bindings across every layer and diode, with fresh exact IDs, no wires, one translated cluster, appended in original key-index order; report budget refusal without a partial change.
- **FR-008**: Show key indices in both workspaces and renumber by transformed center Y then X at 0.0001u precision, stable on ties; preserve identity and all ID-based references.
- **FR-009**: Keep one user operation as one history step, transient preview/cancel unsaved, no-op identity and Redo preserved; exact saved/file round-trip and old-project migration preserve geometry.
- **FR-010**: Extend shared rendering, marquee, navigation and center-layout calculations to sized/rotated geometry in Schematic and Bindings.
- **FR-011**: Export all seven cells deterministically in key-index order for ZMK v0.3; validate rounded signed 16-bit ranges (−32768…32767), positive size cells, and block invalid export.
- **FR-012**: Retain the 512-key and existing data limits, exact key identities and protection from an obsolete import replacing newer work.

### Key Entities

- Key: stable identity, key-index position in ordered layout, seven geometry properties, optional diode.
- Layer binding: attached to key identity, independent of layout order.
- Wire: endpoint key identity and pin plus fixed world-coordinate bends; never implicitly cloned.
- Selection/draft: transient editing state, absent from saved project.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Every operation is reachable by keyboard; automated move and rotate flows persist the expected values and Undo/Redo restore exact project data.
- **SC-002**: Old projects and export/import round-trips preserve 100% of key positions, IDs, bindings, wiring and diode data.
- **SC-003**: Both workspaces show equal sized/rotated geometry; overlaps, marquee and navigation use the same visible geometry.
- **SC-004**: Renumber produces contiguous indices with no changed IDs/references; duplication up to 512 keys is atomic and deterministic.
- **SC-005**: Golden output matches seven physical cells and a real exported layout with nonstandard sizes and positive/negative rotation builds with pinned ZMK v0.3.

## Assumptions

Reuse existing presets and deletion wire cleanup. No KLE import, split, new wiring/kscan, behaviors or firmware settings. Numeric fields are exact; snap applies to pointer positions including selected-cluster dragging, size steps use the shared grid, angles use 1° steps. Existing scoped shortcut policy wins; no new global single-key shortcuts. Geometry rounding to a nonpositive size cell or beyond ZMK range is editable but invalid for export; 0.005u rounds to 1 centi-u and is accepted, 0.004u rounds to zero and is invalid.

## Clarifications

### Session 2026-10-13

- Repository resolves maximum key count: preserve the 024 budget of 512; enforce creation/duplication without exceeding it.
- Repository resolves shortcuts: existing accessibility arrows navigate, Shift+arrows nudge; typing targets remain native.
- Chosen default for rotated clusters: transformed visual center, rounded 0.0001u Y then X, former index on ties.
- Q: Rotate switch and pins with keycap? → A: Yes; rotation transforms switch/pins with keycap, retains world bends and revalidates intersections.
- Q: Duplicate bindings/diode without wires? → A: Yes; duplication copies bindings and diode but never wires.

## Follow-up: Direct canvas manipulation (2026-10-15)

User feedback: selected numeric properties were staged without visible feedback, and editing should primarily use familiar canvas manipulation.

- **FR-013**: A selected key displays a thin frame, eight resize handles on sides/corners, and exterior rotation zones at corners. Handles stay a usable screen size across zoom. Existing key/pin/wire gestures remain available outside those targets.
- **FR-014**: Drag a side to change one dimension; drag a corner to change both. The opposite edge/corner stays visually fixed, including for rotated keys. Dragging never flips the rectangle; minimum pointer size is 0.01u, and snap uses the existing grid. Existing smaller numeric geometry remains loadable.
- **FR-015**: Resize/rotate preview may overlap, but release refuses final interior overlap with other keys and announces the conflict; numeric edits remain repairable. Drag outside a corner to rotate about the key's visible center; Shift snaps rotation to 15°. The gesture previews continuously, pointer release commits once, Escape/cancel/capture loss discards it. No movement and stale gestures preserve identity/Redo. Multiple selected keys expose individual frames; manipulating a key changes that key, while existing selected-cluster movement remains available.
- **FR-016**: Simplify the selected-layout panel to actions and a collapsed precise-editing section. Numeric edits preview automatically on Enter/blur, with Apply/Cancel explicitly indicating unsaved state; table edits continue committing directly. Every pointer operation retains its numeric keyboard alternative.

Acceptance: real provider UI tests must show resize/rotate feedback before release, saved data unchanged during preview, saved/exported geometry after release, exact one-step Undo/Redo, Escape/capture cancellation, live numeric feedback, and handles hidden outside the Select tool. Domain tests cover rotated anchors, side/corner snapping/minimum, center rotation rebasing, no-op/unknown IDs, preserved wiring/bindings/diodes. No schema or generator format change.

## Follow-up: Standard keycap sizes in Bindings (2026-10-21)

Owning branch: `feature/012-standard-keycap-sizes`; extends 004 without a new feature number.

- **FR-017**: In Bindings, right-click a keycap or press ContextMenu/Shift+F10 on a focused keycap to open a contextual “Keycap size” chooser. The Keys table provides a labeled “Keycap size for key N” button for the same chooser. Opening an unselected key targets it alone; opening a selected key retains the selected group. Empty canvas has no size action. Existing Bindings selection/action shortcuts remain unchanged; no arbitrary resize handles or numeric dimensions are introduced there. Schematic precise/pointer editing remains unchanged.
- **FR-018**: Offer rectangular width × height choices (u): 1×1, 1.25×1, 1.5×1, 1.75×1, 2×1, 2.25×1, 2.75×1, 3×1, 6.25×1 and 7×1. Name 6.25/7 as spacebars and display units for every choice. This deliberately bounded catalog is based on Signature Plastics SA individual-keycap and spacebar references; it is not a universal compatibility list. Vertical and shaped ISO keys are outside this follow-up; existing such/custom geometry remains supported. The current matching size is pressed and includes visible “Current”; unmatched geometry reads “Custom: W × H u”; groups with unequal dimensions read “Mixed sizes”.
- **FR-019**: Selecting a size applies to all targeted keys atomically, holding each visible center, rotation and absolute rotation origin fixed. Preserve IDs, all layers/bindings, diode, switch/contact positions and electrical connectivity. Existing polygon overlap validation reports overlaps and blocks export until repaired; warn before selection that larger sizes may overlap. Do not move neighbors or silently round existing custom dimensions. One selection is one Undo step; unchanged/empty/stale targets preserve history/Redo. Persist and export actual geometry through existing flows; schema and generator syntax stay unchanged.
- **FR-020**: Use the existing native modal dialog for the contextual chooser: focus enters, Tab reaches clearly named size buttons, Escape/Close cancels without edits and returns focus to the opener. Capture targets and base project when opening; a changed base invalidates application. Show selected-key count and current/custom/mixed status, using existing theme tokens and focus styles. The bounded chooser scrolls within the viewport at 1024px and equivalent 200% reflow; no animation is required. Success is announced once. No new dependencies or runtime network requests.

Acceptance: right-click and keyboard context invocation select a standard size; table alternative changes the same physical geometry; rotated center/contact coordinates remain fixed; multi-selection is one history step; repeated current selection and cancellation preserve Redo; custom JSON loads unmodified; Undo/Redo, reload, downloaded JSON and ZMK physical-layout cells agree. Exercise light/dark, narrow/reflow, focus restoration and reduced motion with isolated Playwright. OS/screen-reader manual checks remain separately recorded.

Sources checked 2026-10-21: https://spkeyboards.com/collections/sa-individual-keycaps (1–3u named sizes above); https://spkeyboards.com/collections/sa-individual-keycaps/products/sp-sa-spacebars (6.25u and 7u). Nominal footprint does not establish stabilizer, switch-hole or enclosure compatibility.

## Switch sizing correction (2026-10-21)

FR-021 supersedes earlier Schematic sizing requirements (FR-003/004/013/014/016/017): Schematic offers no switch resize handles or editable width/height, either in the Keys table or Precise properties. Retain selection frame, four exterior rotation targets, numeric rotation/origin, movement and history. Existing/custom project dimensions remain unchanged and loadable. Bindings keycap size chooser remains the only size-editing UI.

Acceptance: select a switch; no Resize controls or width/height inputs appear, including after opening Precise properties. Rotate from an exterior corner: visible center and dimensions stay fixed, preview remains unsaved, release commits once, Undo/Redo restore exact projects. Rotation remains keyboard-editable. Change keycap size in Bindings and return: dimensions persist with no Schematic size editor.

036 FR-012 extends pointer rotation: approved slow magnetic capture at 0/90/120/180 degrees with Snap enabled; Shift retains 15-degree priority. See 036 US2 for thresholds, hysteresis and wrap. Numeric/batch contracts are unchanged.

2026-10-26 user refinement (032 FR-010): the Schematic Layout actions and collapsed Precise properties editor from FR-016 are removed, including their hint and Tools opener. Parts per-key numeric fields and pointer rotation remain. Existing Copy/Paste, Delete/Backspace, nudge and Undo/Redo shortcuts remain; renumbering and the deleted batch editor had no shortcuts. Retired UI-only batch-preview acceptance does not remove domain geometry/history tests or change old project data.
