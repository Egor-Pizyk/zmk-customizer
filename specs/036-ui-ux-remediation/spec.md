# 036 — UI/UX remediation

**Branch**: `feature/036-ui-ux-remediation`. **Date**: 2026-10-22. **Status**: Items 1–5 implemented; manual acceptance remains open; later items require user approval.

## Goal and scope

Resolve the 21 original roadmap reports and two additional 035 observations sequentially. User delivery contract: one original numbered item per commit, stop after each with manual acceptance instructions and wait for approval before the next unless the user explicitly authorizes consecutive items together. Items 1–5 are authorized for implementation; item 2 thresholds approved 2026-10-23. Research basis: PR #23 / 035-R01; audit remains a separate draft PR. Starting a second active branch is explicitly authorized by the user's request to implement itemwise; branch starts from current origin/main, not an audit stack.

Preserve existing projects and electrical wiring, stable IDs, per-layer actions, one-step Undo/Redo, deterministic v0.3.0 exports, static/offline operation and keyboard alternatives. No new dependency or visual identity. Items 4–5 are now explicitly authorized together; items 6–23 remain roadmap/research scope.

## User scenarios and acceptance

### US1 — Place and connect an encoder with a push switch (P1)

1. Given Schematic, choose Encoder in Tools and click a free location: a numbered encoder with A/COM/B contacts and an enabled ordinary push key appears in one Undo step. Add encoder in the Encoders editor is the keyboard/non-drag alternative.
2. Select and drag the body; position and contacts move together, pointer preview is unsaved, release commits once and Escape/pointer cancellation leaves the project unchanged. Numeric X/Y and angle controls offer equivalent positioning and rotation about its own center. Magnetic pointer snap is governed by US2.
3. A/COM/B are symbolic contacts, explicitly not a physical footprint. A/B connect through actual schematic wires to distinct controller GPIOs, COM to same-half GND. Crossings, branches and shorts follow normal electrical semantics. Invalid/missing/mixed-half/shorted connections block export with repairable issues. Legacy encoders keep their existing direct A/B assignments until explicitly switched to schematic wiring; do not silently invent actual hardware wires.
4. The optional push switch is a stable ordinary key with two normal key contacts, shown with the encoder. It participates in matrix/direct wiring, diodes, per-layer binding and physical-layout output. Turning the option off/removing encoder removes only its owned push key and affected references/wires in one undoable edit. Undo restores bindings and wiring. Moving/rotating the encoder carries the associated push key; editing the ordinary push key geometry keeps encoder rendering aligned rather than creating two sources of geometry.
5. Save/Open/reload preserve geometry, associations and electrical contacts; old v12 and earlier files migrate without adding a button or changing existing A/B GPIOs. Invalid/dangling/duplicate ownership imports are rejected without replacing the current project.
6. Labeled editor controls, symbolic contact descriptions, table wire creation and keyboard access remain available in light/dark, at existing desktop and 033 narrow sizes. No new effects/animation; reduced motion is unchanged. Deleting returns focus to Add encoder. Existing Bindings key chooser edits the push key; rotary actions remain separate.
7. The part is visually one encoder in Schematic and Bindings. A/COM/B and optional SW1/SW2 use the existing connected/unconnected pin language at their wire attachment points. The linked push key does not render a second keycap or expose keycap resizing. Selecting a key or encoder immediately reveals the same corner rotation affordances; numeric rotation remains the non-drag alternative.
8. Every visible 90-degree wire corner shows a square drag handle, including corners derived automatically between endpoints. Dragging a derived corner creates the required saved bend and commits the gesture once.

### US2 — Slow-rotation magnetic snap

1. With Snap enabled, slowly approach absolute 0°, 90°, 120° or 180° using any key/encoder rotation handle. Capture within 4° at at most 45°/s (shortest angular change between consecutive pointer samples divided by elapsed event time). Keep the visible center fixed; preview remains unsaved.
2. Once captured, hold the target until the raw pointer angle differs by more than 7°, regardless of speed; then release to free rotation. Normalize equivalent angles across ±180°/360°. Only the listed target angles and their full-turn equivalents apply.
3. Fast movement does not acquire a target. Snap off disables magnetic capture/hold immediately. Shift takes priority and rounds to 15° for keys and encoders independently of Snap; releasing Shift resets magnetic capture. Nonpositive sample time never acquires a target.
4. Pointer release commits the displayed angle once; Escape/pointercancel discards it. No movement preserves history. Numeric controls remain exact, unchanged keyboard alternatives. No new animation, layout or theme tokens; existing selection frame and live geometry preview provide feedback in both themes. Shortcut help explains slow Snap and Shift rotation.

### US3 — Round-trip automatic wiring topology

1. With automatic matrix/direct wiring and Wiring open, choose split: the table and canvas immediately show separate left/right circuits in an unsaved preview. Choose unibody again: both immediately show a unified circuit using all keys and the appropriate unibody rows/columns/output placement. No panel collapse, tool change or unrelated action is needed. A topology-only round trip restores the pre-switch project/preview exactly, including GPIO assignments of axes temporarily absent in split mode; it introduces no history entry. Other explicit wiring edits establish a new starting point and are not silently rolled back.
2. Menu changes remain preview-only. Cancel/Escape restore the saved circuit exactly; Apply commits the displayed topology once. Applied split → unibody also recomputes immediately; Undo/Redo and reload preserve the committed circuit. Geometry, bindings and unrelated manual circuits remain unchanged; existing capacity/controller restrictions remain explicit refusals.
3. Retain labeled native topology selection, preview summary and Apply/Cancel, focus, themes, narrow-panel behavior and reduced motion. This is a lifecycle/routing repair, not a change to automatic GPIO allocation or the later Rebuild/Complete preview reports.

## Requirements

- **FR-001**: Encoder placement tool and numeric alternative, stable IDs, center-preserving move/rotation, one-step gesture history and cancellation (US1.1–2).
- **FR-002**: Model visible A/COM/B endpoints in real wire nets; derive schematic A/B GPIOs and validate ground, shorts, independent channels and half ownership. Keep legacy direct assignment mode explicit (US1.3).
- **FR-003**: Optional ordinary-key push switch with stable association and shared displayed geometry; preserve normal bindings/wiring/export and atomic deletion/undo (US1.4).
- **FR-004**: Versioned migration, safe structural/ownership parsing and round-trip compatibility, including legacy direct-mode encoders (US1.5).
- **FR-005**: Keyboard/field/wire-list alternatives, labels/feedback, themes/responsive review and retained focus/rotary-action semantics (US1.6).
- **FR-006**: Verified pinned output uses wire-derived GPIOs for schematic encoders and ordinary kscan for push keys, with independent golden/export/build evidence. Zero-encoder output and legacy assignments remain unchanged.
- **FR-007**: Render an integrated five-contact encoder when push is enabled, distinguish rotary and switch contacts in Schematic; Bindings shows encoder artwork and binding legends without electrical contact text, and show selected-part corner rotation controls without hover discovery (US1.7).
- **FR-008**: Keep a square drag handle visible at every right-angle wire corner and let derived corners become editable bends through a single drag gesture (US1.8). Coincident handles at the same coordinates render as one square. Collinear intermediary points do not add handles between real turns; a wholly straight wire with saved bends exposes one handle. Moving a corner shifts its adjacent straight sections together, preserving the turn orientation and fixed endpoints/contact anchors without returning through obsolete waypoints.

- **FR-009**: With Schematic canvas focus, `E` (case-insensitive) activates Encoder, using the same draft cancellation as other tools. The icon shows `Encoder (E)` on hover and keyboard focus; shortcut help lists it. Typing, dialogs, modifiers and Bindings do not activate this tool. Tool selection alone does not edit the project or history.

- **FR-010**: Bindings encoder artwork omits A/COM/B/SW1/SW2 text, preserving the encoder body, rotary legs, binding legend, selection and accessible key name. Schematic retains electrical contact labels.
- **FR-011**: Selecting a wire by its bend keeps all of that wire’s visible sections accented and thicker during preview and after release, including derived bends. Other wires remain unselected; Escape clears highlighting. Section-only selection retains its existing scope and stale-project guard. Gesture persistence, cancellation and one-step Undo/Redo remain unchanged.

- **FR-012**: Apply the approved slow magnetic rotation contract US2.1–4 equally to keys and encoders, preserving center, connections, preview/cancel, one-step history and existing exact numeric alternatives.

- **FR-013**: Restore immediate, coherent topology round trips under US3 without dismissing Wiring, preserving existing preview/Apply/Cancel and history contracts (033 FR-003/013).

## Edge cases

No encoders/keys; 16-encoder and key budget; last encoder deletion; missing COM; A/B joined together/ground; reused controller pin or switch net; wrong half; dangling endpoint; deleted push key; duplicate push ownership; independent ordinary key edits; unsaved cancelled gesture; no button; older files with no contacts or new fields; invalid counts remain repairable as in 019.

## Key entities

Encoder retains its identity/actions. Optional schematic mode adds orientation and associated push-key identity; when linked, the ordinary key owns displayed geometry. Encoder-pin endpoint identifies encoder plus A/COM/B, independent of current location. Electrical nets include encoder contacts as well as key pins/terminals/board pins.

## Success criteria

- **SC-001**: A user places, moves, rotates, wires and binds a push-enabled encoder using pointer and labeled alternatives, with exact Undo/Redo and file round trips.
- **SC-002**: All invalid connection and ownership categories are rejected or reported at the responsible controls; export never emits undefined/shorted channels.
- **SC-003**: Legacy projects retain content and output; new schematic channels and push bindings agree across persisted JSON and actual downloaded files.

## Assumptions and open questions

User approved optional button after being offered A/COM/B plus two switch contacts and symbolic layout. New encoders start with push enabled; it can be disabled explicitly. Existing encoders remain direct mode and buttonless. COM is electrical GND, not a GPIO. Button contacts are ordinary kscan contacts; no physical manufacturer pinout is asserted. All later original items remain unimplemented until separately approved.

## US4 — Resizable Schematic editors (items 4–5)

- **FR-014**: The existing Schematic Editors block docks to the left of the canvas at widths ≥1280px. Default width is 448 CSS px, minimum 320px, maximum 640px, additionally capped to 45% of the editing area so the canvas retains at least 55%. Drag its right edge with the primary pointer; show a live width preview, save once on release. Escape, pointer cancellation and lost capture restore the saved size. Resizing changes no project data, wiring preview or Undo/Redo history.
- **FR-015**: Save the preferred width in app preferences, preserving it across reload/workspace switches. Missing or invalid older preferences use 448px without resetting other fields. A smaller viewport temporarily constrains the display without overwriting the preferred width. Below 1280px retain the full-width lower panel, its existing ≤45% height budget and ≥50% canvas height; hide the horizontal resize control.
- **FR-016**: The resize control has an accessible name, visible focus and keyboard alternatives: Right/Left grow/shrink by 16px (64px with Shift), Home/End choose available limits, double-click resets to default. Controls and labels wrap, tables scroll within the panel, no horizontal page overflow, both themes and 200% zoom remain usable. No new motion or dependencies.
- **FR-017**: Remove editor-wide Collapse/Close and their reopen controls after item 4. Keep the Editors heading and existing individual section summaries. Switching sections retains preview cancellation and issue repair focus. Editors remain available in empty and populated projects without an extra opener.

Acceptance: drag 448→smaller/larger and verify limits plus canvas budget; cancel a drag; use all resize keys; reload and switch workspaces; shrink then widen viewport and recover preferred size; inspect long fields/tables in both themes and 390/768/1024/1280/1440px; verify individual summaries and issue navigation, unchanged saved project/history, and absent editor-wide buttons.
