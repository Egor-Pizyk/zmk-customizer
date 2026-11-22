# 036 — UI/UX remediation

**Branch**: `feature/036-ui-ux-remediation`. **Date**: 2026-10-22. **Status**: Items 1–23 implemented or regression-verified (10 and 15 required no production repair); user reported all requested manual tests passed on 2026-10-25; delivery/CI gates remain separate. See the latest verification entry for attribution and limits.

## Goal and scope

Resolve the 21 original roadmap reports and two additional 035 observations sequentially. User delivery contract: one original numbered item per commit, stop after each with manual acceptance instructions and wait for approval before the next unless the user explicitly authorizes consecutive items together. Items 1–21 are authorized for implementation; item 2 thresholds approved 2026-10-23. Research basis: PR #23 / 035-R01; audit remains a separate draft PR. Starting a second active branch is explicitly authorized by the user's request to implement itemwise; branch starts from current origin/main, not an audit stack.

Preserve existing projects and electrical wiring, stable IDs, per-layer actions, one-step Undo/Redo, deterministic v0.3.0 exports, static/offline operation and keyboard alternatives. No new dependency or visual identity. Items 4–5 are now explicitly authorized together; item 6 is now separately authorized; items 7–8 are now jointly authorized after an audit of existing behavior; items 9–10 are now jointly authorized; item 11 is now authorized; items 12–15 are jointly authorized with one combined manual acceptance after delivery; items 16–17 are jointly authorized; items 18–19 are jointly authorized; items 20–21 are jointly authorized; items 22–23 are jointly authorized for implementation (2026-10-24).

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

User approved optional button after being offered A/COM/B plus two switch contacts and symbolic layout. New encoders start with push enabled; it can be disabled explicitly. Existing encoders remain direct mode and buttonless. COM is electrical GND, not a GPIO. Button contacts are ordinary kscan contacts; no physical manufacturer pinout is asserted. Later numbered items require user authorization; current approvals and implementation status are recorded above.

## US4 — Resizable Schematic editors (items 4–5)

- **FR-014**: The existing Schematic Editors block docks to the right of the canvas at widths ≥1280px. Default width is 448 CSS px, minimum 320px, maximum 640px, additionally capped to 45% of the editing area so the canvas retains at least 55%. Drag its left edge with the primary pointer; show a live width preview, save once on release. Escape, pointer cancellation and lost capture restore the saved size. Resizing changes no project data, wiring preview or Undo/Redo history.
- **FR-015**: Save the preferred width in app preferences, preserving it across reload/workspace switches. Missing or invalid older preferences use 448px without resetting other fields. A smaller viewport temporarily constrains the display without overwriting the preferred width. Below 1280px retain the full-width lower panel, its existing ≤45% height budget and ≥50% canvas height; hide the horizontal resize control.
- **FR-016**: The resize control has an accessible name, visible focus and keyboard alternatives: Right/Left grow/shrink by 16px (64px with Shift), Home/End choose available limits, double-click resets to default. Controls and labels wrap, tables scroll within the panel, no horizontal page overflow, both themes and 200% zoom remain usable. No new motion or dependencies.
- **FR-017**: Remove editor-wide Collapse/Close and their reopen controls after item 4. Keep the Editors heading and existing individual section summaries. Switching sections retains preview cancellation and issue repair focus. Editors remain available in empty and populated projects without an extra opener.

Acceptance: drag 448→smaller/larger and verify limits plus canvas budget; cancel a drag; use all resize keys; reload and switch workspaces; shrink then widen viewport and recover preferred size; inspect long fields/tables in both themes and 390/768/1024/1280/1440px; verify individual summaries and issue navigation, unchanged saved project/history, and absent editor-wide buttons.

## US5 — Wiring documentation without duplicate destinations (item 6)

- **FR-018**: Below the wiring options show exactly two distinct documentation destinations: the current scanning driver and the current keyboard topology, using existing pinned v0.3 catalog URLs. Matrix uses a single shared Matrix Driver link explaining both scanning and diode direction; its accessible name and hover title name both topics. Direct uses the Direct GPIO Driver link with no diode topic. Remove the redundant separate diode-direction link. Keep topology-specific documentation for unibody and split. Existing labeled options, inline explanations, icon style, focus, new-tab indication and rel behavior remain. Links fit/wrap in both themes at 390px and desktop without changing project/history, previews or exports.

Acceptance: open Wiring for Matrix and see two links with distinct hrefs and an explicitly named shared scanning/diode source; change diode direction and retain the same two destinations; change Direct and see the direct-driver source without diode text; choose BLE split and see the split source. Keyboard focus reaches each retained link. No new loading/error/disabled states or motion. Screen-reader speech/native zoom remain manual E008.

## US6 — Inspect automatic wiring without losing the proposal (items 7–8)

- **FR-019**: Audit existing Rebuild/Complete rendering and history behavior before changing it. For wired and initially unwired projects, immediately render one coherent proposal with unchanged key geometry. Preview wire paths must match the same proposal after Apply; terminal/diode/connection feedback must use the displayed proposal, while saved-project Problems/export eligibility continue to use saved data. Reuse existing deterministic routing if the original scattered-path report no longer reproduces; do not rewrite routing without a failing domain case.
- **FR-020**: Starting a wiring proposal activates Select and clears obsolete selection/gesture state. The preview permits selecting keys, encoders, wire sections (including Shift toggle), whole wires via bends and endpoints without changing routes, saving or cancelling. Selection uses the displayed proposal identity. It cannot drag/move/rotate/create/delete or toggle diode/crossing wiring until Apply/Cancel. Keyboard focus/navigation and selection remain; mutation shortcuts give an actionable Apply/Cancel hint. Select via icon/shortcut preserves the proposal; choosing an editing tool keeps the proposal/Select and gives the same hint. No silent loss when clicking an entity or tool.
- **FR-021**: Complete wiring and Rebuild wiring from no initial wires produce inspectable proposals under FR-019–020 for matrix/direct. A persistent Preview marker in the Wiring summary and visible instructions explain inspection, Apply/Cancel/Escape and cancellation when opening another editor. Apply commits exactly once and the displayed circuit survives selection/tool changes, reload and Undo/Redo; Cancel/Escape restore saved data/routes without a history entry, announce cancellation, and never resurrect on Undo. Explicit editor dismissal still cancels (033 contract), with feedback. Applied results are not cancelled by tool changes. External saved-project changes invalidate stale proposals as before. Refusal/no-op semantics, retained manual circuits, topology rules and existing field alternatives stay intact.

Acceptance: first verify existing wired and fresh/unwired Rebuild/Complete preview→Apply route equality; independently inspect orthogonal paths and fixed key locations. During preview select a real visible section and a key, use Select and an editing tool/shortcut, try a drag and keyboard nudge/Delete, and verify the same proposal remains with unchanged saved JSON. On fresh circuits connection marks agree with the displayed wires. Apply, select, switch tools, reload and Undo/Redo preserve the committed result; Cancel/Escape and closing Wiring restore/announce saved state. Inspect both themes and a narrow panel. Native screen-reader speech/OS zoom remain manual E008; no new motion, dependencies or ZMK syntax.

## US7 — Move connected keys (item 9)

- **FR-022**: In a hand-drawn 2×2 matrix, permit upper-right key movement left/right and vertically when final geometry preserves its electrical networks and resource limits. Connected crossings displaced by a move must not be mistaken for new unrelated connections. Keep pin identities, wire references, fixed bends/anchors, diode/bindings, incidental-crossing insulation and legitimate overlap/limit refusal. Pointer preview is unsaved, release commits once, Escape cancels; existing numeric/nudge alternatives and one-step Undo/Redo/reload remain.

Acceptance: reproduce horizontal refusal with a hand-drawn connected crossing and vertical control; verify both horizontal directions, complete pin partitions, unrelated conductors, cancellation/history/reload, new incidental insulation and unsafe overlap/resource refusal. Preserve current selection/feedback, themes, layout and reduced motion; no new controls or schema.

## US8 — Select both sides of a crossing (item 10)

- **FR-023**: On either arm of an L-shaped wire, a connected crossing divides it into independently selectable sections on both sides. Plain click replaces selection; Shift toggles; the Parts section checkboxes provide the same keyboard choice. Accent plus thickness and endpoint markers identify the exact extent. Selection never changes saved geometry or crossing state. Escape clears it; section deletion keeps the unselected side and supports one-step Undo. Preserve 033 semantics: insulated crossings are bridges within one continuous section, without joining the crossing wire; bends alone are not electrical boundaries.

Acceptance: audit current behavior before changing code. Check horizontal/vertical L arms by pointer and list, single/multiple selection, saved state and deletion/history. Check connected versus insulated geometry and nets independently. If the original failure no longer reproduces, add regression evidence without speculative production changes. Retain themes, focus/keyboard paths, layout and reduced motion; native speech/zoom stay E008.

## US9 — Wire marquee selection (item 11)

- **FR-024**: With Select active, primary-pointer drag from empty Schematic canvas selects ordinary keys whose visible rectangles intersect the marquee with positive area and every wire section with any centerline segment touching/intersecting the rectangle (including endpoints and sections passing through with both ends outside). Test each actual segment, never the whole L-path bounding box. Normalize all drag directions; pan/zoom must not change results. The rectangle previews during drag; release accents/thickens the exact selected extents with endpoint markers. A gesture under the existing click threshold clears selection as a blank click. Escape/pointer cancellation preserves the previous selection. No project/history change from selecting.
- **FR-025**: User approved intersection selection on 2026-10-23. Plain marquee replaces selection; Shift-marquee unions previously selected keys/sections, without duplicates. Mixed selection is allowed. Shift-click/key-table checkboxes and section-list checkboxes can build/toggle the same mixed set with keyboard alternatives. Plain section clicks and unselected-key presses replace selection; pressing a selected key retains its key group for dragging, as before. The Parts section list exposes selected counts and a clearly named mixed deletion action. Keys remain movable/nudgeable; selected wire sections are inspection/deletion targets and never translated by key drag/nudge. Existing encoder click handling remains; standalone encoder bodies are outside this key/section marquee extension. Omit hidden encoder-owned push keys from marquee to avoid invisible selections.
- **FR-026**: Canvas Delete/Backspace and the mixed list action delete selected keys and sections atomically in one history step, preserving unselected independent fragments, contacts, GPIOs and crossing semantics. Resolve section refs against the exact original project before deleting keys; stale project refs clear selection without editing; missing refs or resource refusal perform no partial edit and give existing readable feedback. Key deletion retains its ordinary attachment/binding cleanup; unrelated free conductors must survive. Undo/Redo and saved/reloaded geometry agree. Read-only wiring proposals retain FR-020 mutation guards and their existing inspection policy; no new preview marquee. Native text editing and Bindings remain unchanged.

Acceptance: reproduce empty-canvas wire omission, then wire-only and mixed drags; through-segment vs empty L-bounds, reversed directions, positive key intersection, Shift union, cancellation/click threshold, keyboard-list parity, stale rejection, mixed deletion/Undo/Redo/reload, insulated/connected continuity and resource refusal. Review light/dark, desktop/narrow and existing focus/reduced motion. No schema, generator, dependency, new gesture tool or unrelated control changes. Items 9–10 manual acceptance confirmed by user; E008 remains limited to its still-unperformed speech/OS/hardware checks.


## Items 12–15 — canvas controls and tool cancellation

User authorizes all four items in one run without intermediate approval/manual gates (2026-10-23); retain itemwise commits and one final review. User selected removal of Complete wiring and retention of Rebuild wiring.

- **FR-027 (12)**: Current SurfaceControls identifies Reset view immediately after Center keyboard. Remove Reset view from both canvases, shortcut 0, help entry, reset action/helper and unused icon. Keep Center keyboard, zoom/pan, stored view compatibility and project/history intact.
- **FR-028 (13)**: Settings uses a recognizable toothed gear with a central hole in existing currentColor SVG styling. Retain Settings accessible name, button dimensions, focus, keyboard opening and dialog focus return in both themes/narrow layouts.
- **FR-029 (14)**: Remove the Complete wiring (additive) button; retain Rebuild wiring (replacement) as the sole automatic action, including its replacement explanation; preserve the retained operation's preview/Apply/Cancel/history and existing saved projects. The underlying pure additive operation may remain for existing domain contracts; it has no UI entry point.
- **FR-030 (15)**: Escape during Key placement returns to Select without adding a key or changing saved project/history. Active pointer/layout/wire drafts are cancelled first; dialogs/text fields retain their existing Escape behavior. Verify pointer and keyboard activation, plus successful selection after cancellation.

Acceptance: both canvases have Center keyboard but no Reset view/help action; 0 preserves a deliberately changed viewport. Settings gear opens/closes with keyboard and returns focus. Key tool → Escape → Select leaves JSON/history unchanged; subsequent canvas click selects rather than placing. Active drafts cancel without committing, and native dialog/text Escape takes precedence. Review light/dark desktop and 1024px rendering; native screen-reader/OS checks remain E008.

## US10 — Canvas hints and agent action (items 16–17)

- **FR-031**: In Schematic and Bindings every retained top-right canvas button (Snap in Schematic only, Zoom in/out, Center keyboard) shows a meaningful tooltip on hover and keyboard focus. Snap retains its stable accessible name and pressed state; its hint states whether snapping is on/off and the action that toggles it. Center explains unavailability without keys and remains focusable. Escape dismisses hints until leaving/re-entering. Hints stay within the viewport at desktop and 1024px (also Schematic at 390px), in both themes; no action/history/project changes from showing a hint.
- **FR-032**: Place Create with agent after Undo/Redo at the far right of the project actions, with the existing secondary outline and a visible restrained AI badge. Keep the accessible name Create with agent, native keyboard activation, existing dialog/download flow and focus restoration. Wrapping retains logical visual/Tab order without page overflow at 390/1024/1440px. Empty/invalid projects retain access; project data/history/export remain unchanged. No new motion or loading/error states.

Acceptance: hover and Tab through all four controls, toggle Snap twice and verify state/hint plus unchanged project; dismiss a hint with Escape; inspect narrow rightmost tooltip. Verify agent action is last, opens with Enter, Escape restores focus, badge/outline remain visible in both themes and wrapped layouts. Native speech and OS zoom remain manual checks. Items 18–19 are covered by US11 below.

## US11 — Key clipboard and numeric rotation (items 18–19)

Jointly authorized 2026-10-24. Clipboard scope explicitly approved by the user.

- **FR-033**: On the Schematic canvas and Keys selection table, Mod+C captures selected ordinary keys in source order, including geometry, half, diode and bindings on every layer. Mod+V appends fresh IDs translated together to the right of the current layout, selects the copies and commits once. No wires, electrical assignments, encoders or encoder-owned push keys are copied. The internal buffer is project-local and transient; New/Open/workspace unmount clears it. Later edits/deletion of sources do not change the snapshot. Preserve missing bindings and refuse the key budget atomically with feedback. Empty/ineligible selection and empty clipboard announce their state without history changes. Preview/draft editing cannot paste; native text fields/contenteditable/dialogs and existing Bindings action copy/paste retain precedence. Match physical KeyC/KeyV with Cmd on macOS or Ctrl, ignoring repeats and extra modifiers.
- **FR-034**: Numeric Rotation in the Keys table and Selected rotation with no explicitly edited origin rotate each target around its own pre-edit visible center, retaining dimensions and relative center positions. Batch translation adds only the requested offset. An explicitly edited Origin X/Y deliberately uses the supplied absolute origin (the other coordinate retains its existing value); it overrides own-center behavior. Existing pointer rotation remains unchanged. Encoder numeric rotation, with or without a linked push key and with legacy key origins, preserves its visible center; unchanged angles preserve identity/history. Keep wiring safety, transient batch preview/Cancel/Apply, one-step Undo/Redo and file/reload compatibility. Existing labeled fields, focus, themes/reflow and reduced motion remain; no new styles or schema.

Acceptance: Cmd copy then edit/delete source and paste; verify snapshot geometry/diode/half/all-layer bindings, fresh IDs, no copied wires, repeated paste and one-step history. Verify Ctrl equivalent, empty/budget/preview guards, text-field copy/paste and Bindings action behavior. Set exact positive/negative numeric angles on displaced, pre-rotated keys, a multi-selection and encoders with/without push; inspect independent rendered centers/corners and saved JSON, cancel/apply/Undo/Redo/reload. Explicit origin remains intentional. Native macOS clipboard/speech remain manual acceptance; automated Meta key events are not an OS acceptance claim.


## US12 — Bindings controls and Problems emphasis (items 20–21)

- **FR-035**: Remove only the Snap button from Bindings. Retain Zoom in/out and Center keyboard, Schematic Snap and Settings Snap to grid. Preserve the shared persisted snap preference, existing scoped shortcuts, status readout, project/history and exports; do not introduce workspace-specific preferences. Existing hints/focus/order, empty-state Center and responsive/theme behavior remain.
- **FR-036**: Problems text and count use existing semantic danger red whenever total issues > 0, neutral at zero. Preserve its accessible name Problems (N), count, expanded/controls state, keyboard activation, focus and issue-panel navigation. The count remains a non-color signal. Both themes, hover/focus and 390/1024/1440px reflow retain readable controls; no animation, new loading state or data change.

Acceptance: Bindings has three retained canvas buttons and no Snap, including after reload; change Snap in Schematic and Settings and verify persisted shared state without project/history changes. In both themes inspect Problems with nonzero and zero counts, keyboard-open/close the panel, and change an invalid project to valid to verify immediate neutral recovery. Native speech and OS zoom remain manual.


## Items 22–23 — canvas controls and persistent preview actions

- **FR-037 (22)**: Reserve a separate canvas toolbar row for Snap, Zoom and Center so expanded, moved or collapsed Tools cannot cover their painted buttons or focus/hints. Preserve Tools pointer/arrow positioning, saved preferences and Bindings controls. Both themes at 390/1024/1440px and 200% equivalent reflow remain usable without horizontal page overflow. Showing/moving controls changes no project/history.
- **FR-038 (23)**: While a Wiring or layout preview exists, show its explicit unsaved status and existing Apply/Cancel actions in a non-scrolling editor footer, visible while either the outer editor or inner fields/table scroll. Layout refusal keeps Apply disabled and explains how to recover; Cancel remains available. Preserve inspection, Escape, section dismissal, keyboard focus, one-step Apply/Undo/Redo, persistence and exports. No duplicate action buttons or live regions; no new motion. Both themes and lower-panel/desktop layouts retain usable fields and canvas.

Acceptance: move expanded Tools toward the toolbar at narrow/desktop sizes and operate each canvas button by pointer and keyboard; verify hit targets and hints. Start wiring and layout previews, scroll nested content to both ends, verify status/actions remain painted and clickable without scrolling them into view. Cancel leaves saved JSON unchanged; Apply commits once, Undo/Redo restore exact values. Native speech and OS zoom remain manual.

## Right-docked Editors follow-up — 2026-10-25

User requests FR-014 right docking on `fix/pre-major-sweep`. At desktop widths the canvas precedes Editors visually and in keyboard order; the left resize edge grows the panel when moved left (ArrowLeft grows, ArrowRight shrinks). Preserve width defaults/limits/persistence, Home/End, Escape cancellation, individual sections, preview footer, empty/populated access, themes and reduced motion. Below 1280px retain the lower panel and hidden resize edge. No project/history/export changes.

## Editors hierarchy — 2026-10-25

- **FR-039**: Controller, Layout, Wiring, Encoders and Parts are peer editor sections with equal full width, 16px horizontal padding and 40px headings using the same type scale. Content height follows content with a shared 384px scroll cap; do not force empty space. Layout actions remain available; Precise properties is visibly subordinate within Layout. Other dependent field groups remain within their owning editor. Preserve native summaries, single-expanded-editor behavior, issue repair, preview cancellation/footer, keyboard focus, saved data and history. Existing narrow/desktop placement, themes and reduced motion remain. Empty/disabled/error controls retain existing behavior.

Acceptance: compare peer heading geometry in light/dark desktop and 390px layouts; expand sections with keyboard; confirm nested precise fields and scrolling without page overflow.

2026-10-26 creation follow-up, 032 FR-010: remove the complete Layout group, including actions, Precise properties and its hint, plus its Tools opener. This supersedes 012 FR-016/036 FR-039's batch-editor presentation and numeric-preview-only acceptance. Parts per-key geometry, pointer rotation and existing shortcuts remain; no new shortcut is introduced for renumbering or the deleted batch editor.

2026-10-26 Parts organization: 019 FR-009–011 supersedes FR-039's peer Encoders heading. Encoders moves below Parts as an h3 disclosure alongside Keys; both fold independently. Controller, Wiring and Parts retain peer heading geometry. Existing encoder controls, issue repair, history and data contracts remain.
