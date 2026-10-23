# 036 — UI/UX remediation

**Branch**: `feature/036-ui-ux-remediation`. **Date**: 2026-10-22. **Status**: Item 1 in progress; all later items require user approval.

## Goal and scope

Resolve the 21 original roadmap reports and two additional 035 observations sequentially. User delivery contract: one original numbered item per commit, stop after each with manual acceptance instructions, and wait for approval before the next. Only item 1 is authorized for implementation now. Research basis: PR #23 / 035-R01; audit remains a separate draft PR. Starting a second active branch is explicitly authorized by the user's request to implement itemwise; branch starts from current origin/main, not an audit stack.

Preserve existing projects and electrical wiring, stable IDs, per-layer actions, one-step Undo/Redo, deterministic v0.3.0 exports, static/offline operation and keyboard alternatives. No new dependency or visual identity. Items 2–23 remain roadmap/research scope, not implicit authorization in this plan.

## User scenarios and acceptance

### US1 — Place and connect an encoder with a push switch (P1)

1. Given Schematic, choose Encoder in Tools and click a free location: a numbered encoder with A/COM/B contacts and an enabled ordinary push key appears in one Undo step. Add encoder in the Encoders editor is the keyboard/non-drag alternative.
2. Select and drag the body; position and contacts move together, pointer preview is unsaved, release commits once and Escape/pointer cancellation leaves the project unchanged. Numeric X/Y and angle controls offer equivalent positioning and rotation about its own center. Rotation does not implement item 2 magnetic snap.
3. A/COM/B are symbolic contacts, explicitly not a physical footprint. A/B connect through actual schematic wires to distinct controller GPIOs, COM to same-half GND. Crossings, branches and shorts follow normal electrical semantics. Invalid/missing/mixed-half/shorted connections block export with repairable issues. Legacy encoders keep their existing direct A/B assignments until explicitly switched to schematic wiring; do not silently invent actual hardware wires.
4. The optional push switch is a stable ordinary key with two normal key contacts, shown with the encoder. It participates in matrix/direct wiring, diodes, per-layer binding and physical-layout output. Turning the option off/removing encoder removes only its owned push key and affected references/wires in one undoable edit. Undo restores bindings and wiring. Moving/rotating the encoder carries the associated push key; editing the ordinary push key geometry keeps encoder rendering aligned rather than creating two sources of geometry.
5. Save/Open/reload preserve geometry, associations and electrical contacts; old v12 and earlier files migrate without adding a button or changing existing A/B GPIOs. Invalid/dangling/duplicate ownership imports are rejected without replacing the current project.
6. Labeled editor controls, symbolic contact descriptions, table wire creation and keyboard access remain available in light/dark, at existing desktop and 033 narrow sizes. No new effects/animation; reduced motion is unchanged. Deleting returns focus to Add encoder. Existing Bindings key chooser edits the push key; rotary actions remain separate.
7. The part is visually one encoder in Schematic and Bindings. A/COM/B and optional SW1/SW2 use the existing connected/unconnected pin language at their wire attachment points. The linked push key does not render a second keycap or expose keycap resizing. Selecting a key or encoder immediately reveals the same corner rotation affordances; numeric rotation remains the non-drag alternative.
8. Every visible 90-degree wire corner shows a square drag handle, including corners derived automatically between endpoints. Dragging a derived corner creates the required saved bend and commits the gesture once.

## Requirements

- **FR-001**: Encoder placement tool and numeric alternative, stable IDs, center-preserving move/rotation, one-step gesture history and cancellation (US1.1–2).
- **FR-002**: Model visible A/COM/B endpoints in real wire nets; derive schematic A/B GPIOs and validate ground, shorts, independent channels and half ownership. Keep legacy direct assignment mode explicit (US1.3).
- **FR-003**: Optional ordinary-key push switch with stable association and shared displayed geometry; preserve normal bindings/wiring/export and atomic deletion/undo (US1.4).
- **FR-004**: Versioned migration, safe structural/ownership parsing and round-trip compatibility, including legacy direct-mode encoders (US1.5).
- **FR-005**: Keyboard/field/wire-list alternatives, labels/feedback, themes/responsive review and retained focus/rotary-action semantics (US1.6).
- **FR-006**: Verified pinned output uses wire-derived GPIOs for schematic encoders and ordinary kscan for push keys, with independent golden/export/build evidence. Zero-encoder output and legacy assignments remain unchanged.
- **FR-007**: Render an integrated five-contact encoder when push is enabled, distinguish rotary and switch contacts in both workspaces, and show selected-part corner rotation controls without hover discovery (US1.7).
- **FR-008**: Keep a square drag handle visible at every right-angle wire corner and let derived corners become editable bends through a single drag gesture (US1.8). Coincident handles at the same coordinates render as one square. Collinear intermediary points do not add handles between real turns; a wholly straight wire with saved bends exposes one handle.

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
