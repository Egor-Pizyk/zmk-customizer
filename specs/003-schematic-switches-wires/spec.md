# Feature Specification: Schematic keys and wires

**Feature Branch**: `003-schematic-switches-wires`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Continue the Schematic workspace. Add two new tools. First tool — switch (button): each switch has 2 pins (like a mechanical keyboard switch); each switch is written to the project config and is part of the schematic. Second tool — wire: wires connect switch pins; every wire must connect to a pin on at least one end. Required: every switch pin must be connected to at least one wire; where wires cross, a small button with an insulation symbol appears that adds insulation between the wires, so that when building a matrix crossing wires do not conduct into each other; pressing it must be shown in the interface. If a wire is attached to a pin on one end and not on the other, the free end can be given a (generic) board pin it connects to, shown minimally. Every switch looks like a switch seen from above. All pin-to-pin connections by wires and wire ends attached to board pins [are part of the project config]."

## Clarifications

### Session 2026-09-27

- Q: Is a switch the same as a keyboard key? → A: Yes. Switch N = key N (key index) for keymap and export.
- Q: Derive ZMK wiring (rows/cols, RC per key, GPIO list) from the schematic in this feature? → A: No, a later feature.
- Q: Project foundation does not exist yet — how to proceed? → A: Build roadmap 002 project-foundation first; this feature depends on it (numbered 003).
- Q: Crossing wires connected or insulated by default? → A: Connected by default; the button insulates (user's choice, kept despite schematic convention).
- Q: Wire segments free-angle or horizontal/vertical only? → A: Horizontal/vertical only; an L-bend is inserted automatically between clicks.
- Q: Include GND (or power) in the board pin list? → A: No. Numbered pins P0–P31 only.
- Q: Is the switch position on the schematic the key's physical position? → A: Yes, one position per key; the layout editor (006) adds size and rotation to the same key.

## Context

The Schematic workspace (spec 001) has a floating tool window with Select available and placeholder slots for Add key and Wire. This feature makes those two tools real. Every key is drawn as a mechanical keyboard switch seen from above; the UI names it "Key N" like everywhere else in the app. The user draws the keyboard as an electrical schematic: keys placed on the work surface, wires between key pins, crossings that either join or stay insulated, and wire ends that go to the controller board. Everything drawn is part of the keyboard project, so it is kept and restored with the project and later features (wiring into kscan, keymap, export) build on it.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Place keys (Priority: P1)

The user picks the Key tool and clicks on the work surface to place a key. Each key is drawn as a mechanical keyboard switch seen from above (square housing with the cross-shaped stem in the middle and its two metal pins visible), sized to one key unit and snapped to the grid when snapping is on. Each key shows its key number (0, 1, 2, … in the order placed) and has exactly two pins, marked so the user can tell them apart. With the Select tool the user can select, move and delete keys.

**Why this priority**: Keys are the things being wired; without them the wire tool has nothing to connect.

**Independent Test**: Select the Key tool, click three times on the surface — three keys numbered 0, 1, 2 appear, each with two visible pins, snapped to the grid; reload — they are still there (via project autosave); delete key 1 — the rest are numbered 0, 1.

**Acceptance Scenarios**:

1. **Given** the Key tool is active, **When** the user clicks an empty spot on the surface, **Then** a key appears there (snapped to the grid if snapping is on) with the next free number and two pins.
2. **Given** the Key tool is active, **When** the user clicks where a key already is, **Then** no second key is placed on top of it.
3. **Given** keys exist, **When** the user selects one with the Select tool and drags it, **Then** it moves, and every wire attached to its pins follows its pin.
4. **Given** a key is selected, **When** the user deletes it, **Then** the key is removed, wire ends that were on its pins become free ends, and remaining keys are renumbered without gaps.
5. **Given** a keyboard-only user, **When** they use the Key tool, **Then** they can press Enter to place a key at the next free position (right of the last key), and nudge it with Shift+arrow keys.
6. **Given** any key, **When** a screen reader reaches it, **Then** it is announced as "Key N" with its position and the connection state of both pins.

---

### User Story 2 - Connect key pins with wires (Priority: P1)

The user picks the Wire tool, starts a wire on a key pin, on another wire or on an empty spot, optionally clicks to add bends, and finishes it on another key pin, on another wire, or on an empty spot (a free end). A wire must start or end on a key pin; a wire with no key pin at either end cannot be created. Wires attached to pins move with their key. Every key pin must be connected to at least one wire; any pin without a wire is reported as a problem.

**Why this priority**: Wires are the second half of the schematic; together with keys they describe how the keyboard is actually connected.

**Independent Test**: Place two keys, draw a wire from pin 1 of key 0 to pin 1 of key 1 — the wire is drawn and both pins show as connected; the problems panel lists the two still-unconnected pins 2; draw wires from them — the problems disappear.

**Acceptance Scenarios**:

1. **Given** the Wire tool is active, **When** the user presses on a key pin and finishes on another key pin, **Then** a wire connects the two pins and both pins show as connected.
2. **Given** the Wire tool is active, **When** the user starts on an empty spot and finishes on an empty spot (no key pin at either end), **Then** no wire is created and a hint says a wire must start or end on a key pin.
3. **Given** a wire is being drawn, **When** the user clicks empty spots before finishing, **Then** each click adds a bend point (snapped to the grid when snapping is on), every segment is horizontal or vertical, and an L-bend is inserted automatically when the click is not in line with the previous point; Escape cancels the wire in progress.
4. **Given** a wire ends on a point along another wire, **When** it is finished, **Then** the two wires are joined at that point, shown with a junction dot.
5. **Given** a key pin has no wire, **When** the project is checked, **Then** the problems panel lists "Key N, pin P is not connected" under Schematic, the Schematic tab badge counts it, and the pin is marked on the canvas with more than color alone.
6. **Given** a wire is selected, **When** the user deletes it, **Then** it is removed and any pin left without a wire is reported.
7. **Given** a keyboard-only user, **When** they use the Wire tool, **Then** they can choose a start pin, add bend points and choose an end pin or a free end without a mouse.

---

### User Story 3 - Insulate wire crossings (Priority: P1)

Where two wires cross (not at a junction dot), a small button with an insulation symbol is shown at the crossing. By default crossing wires are connected. Pressing the button insulates the crossing: the wires no longer conduct into each other, and the crossing is drawn as a bridge (one wire hops over the other) instead of a plain crossing. Pressing it again removes the insulation. This lets the user draw a matrix where row wires and column wires cross without being joined.

**Why this priority**: A keyboard matrix is exactly rows crossing columns; without insulated crossings every matrix drawing would short all rows to all columns.

**Independent Test**: Draw two wires that cross; the insulation button appears at the crossing; press it — the crossing is drawn as a bridge and the wires are treated as separate; press it again — they are joined again.

**Acceptance Scenarios**:

1. **Given** two wires cross, **When** they are shown, **Then** a small insulation button appears at the crossing point, and the crossing is treated as a connection.
2. **Given** a crossing is not insulated, **When** the user presses its button, **Then** the crossing is drawn as a bridge, the button shows the insulated state, and the two wires are no longer connected at that point.
3. **Given** an insulated crossing, **When** the user presses its button again, **Then** the insulation is removed and the wires are connected again.
4. **Given** an insulated crossing, **When** one of the wires is moved (e.g. its key moves) and the wires still cross, **Then** the crossing stays insulated; **When** they no longer cross, **Then** the insulation disappears with the crossing.
5. **Given** a keyboard-only or screen-reader user, **When** they reach a crossing button, **Then** it is announced as "Crossing of wire A and wire B, connected" or "… insulated" and toggles with Enter or Space.

---

### User Story 4 - Attach free wire ends to board pins (Priority: P2)

When a wire is attached to a key pin at one end and its other end is free, the user can assign that free end to a board pin. The board here is a generic controller board with numbered pins (not a specific product yet). An assigned end is drawn with a small, minimal pin marker labelled with the pin name (for example "P3"). The assignment can be changed or removed.

**Why this priority**: Board pins are where rows, columns or direct keys meet the controller; without them the schematic cannot describe what the firmware reads. Ranked below drawing because the drawing is useful on its own first.

**Independent Test**: Draw a wire from a key pin to an empty spot; the free end offers "Connect to board pin"; pick P3 — a small marker "P3" appears at the end; reload — it is still there.

**Acceptance Scenarios**:

1. **Given** a wire with one end on a key pin and one free end, **When** the user selects the free end, **Then** they can choose a board pin for it from a list.
2. **Given** a free end has a board pin, **When** it is shown, **Then** a small marker with the pin label is drawn at the end.
3. **Given** a board pin is assigned to a wire end, **When** the user picks it for another wire end, **Then** the list marks it as already used, and if the user assigns it anyway both ends are reported as a problem unless the two wires are already connected.
4. **Given** a wire end has a board pin, **When** the user removes the assignment, **Then** the end becomes a free end again.
5. **Given** a wire has a free end with no board pin, **When** the project is checked, **Then** the problems panel lists "Wire N has a free end that is not connected to anything".

---

### User Story 5 - The schematic is part of the project (Priority: P1)

Keys, their positions and numbers, wires with their bend points and end attachments, crossing insulation and board pin assignments are all part of the keyboard project. They are kept when the page reloads, saved in the project file, and each change (place, move, delete, draw, insulate, assign) is one undo step (project foundation, roadmap 002).

**Why this priority**: The user explicitly requires every key, every connection and every board pin to be written into the project config; the rest of the tool builds on it.

**Independent Test**: Draw a small schematic with an insulated crossing and a board pin; reload — the same schematic is shown with the same numbers, insulation and pin labels.

**Acceptance Scenarios**:

1. **Given** a schematic, **When** the page reloads, **Then** every key, wire, bend, junction, crossing state and board pin assignment is restored exactly.
2. **Given** a schematic, **When** the project is saved to a file and opened again, **Then** the result is identical.

---

### Edge Cases

- A wire is drawn from a pin back to the same pin → not created.
- A wire connects the two pins of the same key → allowed to draw, reported as a problem ("Key N is shorted: both pins are on the same connection").
- Two wires overlap along a stretch (collinear) rather than crossing at a point → treated as joined; no insulation button (insulation is only for point crossings).
- More than two wires cross at the same point → one button per pair of wires crossing there, offset so they do not overlap.
- A wire crosses itself → no insulation button (a wire is always connected to itself).
- A wire passes over a key pin without ending there → not connected to that pin.
- Deleting a key leaves wires whose both ends are now free → those wires are removed with the key, since a wire needs a key pin on at least one end.
- Moving a key creates or removes crossings → crossing buttons appear and disappear accordingly; stored insulation for a crossing that no longer exists is dropped.
- Zoomed far out → crossing buttons and pin markers keep a fixed screen size (at least 24×24 px target); below 50% zoom crossing buttons are hidden and crossings are toggled from the parts list.
- Very many keys (a 100-key board, several hundred wires) → drawing and dragging stay smooth.

## Requirements *(mandatory)*

### Functional Requirements

**Tools**

- **FR-001**: The Schematic tool window MUST offer three available tools: Select, Key (the former "Add key" placeholder; places a key drawn as a switch) and Wire. Only one tool is active at a time.
- **FR-002**: Tool shortcuts MUST exist for Key and Wire, scoped to the focused canvas, and listed in the shortcut help window.

**Keys**

- **FR-003**: With the Key tool, clicking an empty spot MUST place a key there, snapped to the grid when snapping is on; a key MUST NOT be placed overlapping another key. An overlap created another way (key fields in the parts list, an imported file) MUST be reported for each key involved.
- **FR-004**: Every key MUST have exactly two pins, identified as pin 1 and pin 2, at fixed positions on the key that match a mechanical keyboard switch.
- **FR-005**: Every key MUST be drawn as a mechanical keyboard switch seen from above: housing outline, cross-shaped stem in the center, and both pins; its number is shown on it; connected and unconnected pins look different by shape as well as color.
- **FR-006**: Keys MUST be numbered 0..n-1 without gaps; a new key takes the next number; deleting a key renumbers the rest keeping their order.
- **FR-007**: With the Select tool the user MUST be able to select, move (drag and Shift+arrow keys) and delete keys; wires attached to a moved key's pins MUST follow them.

**Wires**

- **FR-008**: With the Wire tool the user MUST be able to draw a wire that starts on a key pin, a point on an existing wire, or an empty spot, has zero or more bend points, and ends on any of those. Every wire segment MUST be horizontal or vertical; when the next point is not in line with the previous one, an L-bend MUST be inserted automatically.
- **FR-009**: A wire MUST have a key pin at one end or both; a wire with no key pin at either end MUST NOT be created. A wire's two ends MUST NOT be the same pin.
- **FR-010**: A wire end placed on another wire MUST join them at that point, drawn with a junction dot.
- **FR-011**: The user MUST be able to select and delete a wire, and move its bend points; segments stay horizontal or vertical while moving.
- **FR-012**: Deleting a key MUST turn wire ends on its pins into free ends, and MUST remove any wire that would then have no key pin at either end.

**Crossings**

- **FR-013**: Wherever two different wires cross at a point that is not a junction, the canvas MUST show a small insulation button at the crossing.
- **FR-014**: A crossing MUST be connected by default; pressing its button MUST toggle it between connected and insulated.
- **FR-015**: An insulated crossing MUST be drawn as a bridge (one wire hopping over the other) and its button MUST show the insulated state; the state MUST be conveyed by shape and accessible name, not color alone.
- **FR-016**: Insulated wires MUST be treated as not connected to each other at that crossing; connected crossings and junctions MUST join the wires.
- **FR-017**: Insulation MUST stay with a crossing while the same two wires still cross; when they no longer cross, the stored insulation MUST be dropped.

**Board pins**

- **FR-018**: A wire end that is not on a key pin or another wire (a free end) MUST be assignable to a pin of a generic controller board, chosen from the board pin list P0–P31. The list MUST NOT contain GND or power pins.
- **FR-019**: A wire end with a board pin MUST be drawn with a minimal marker showing the pin label; the assignment MUST be changeable and removable.
- **FR-020**: The board pin list MUST show which pins are already used by another wire end.

**Checks (problems panel, Schematic badge)**

- **FR-021**: Every key pin without a wire MUST be reported: "Key N, pin P is not connected. Draw a wire from it."
- **FR-022**: Every free wire end without a board pin MUST be reported.
- **FR-023**: A board pin used by wire ends that are not otherwise connected MUST be reported for each such end.
- **FR-023a**: A connection that reaches two or more different board pins MUST be reported for each of its board-pin ends: "Wire 5 connects board pins P3 and P4 together. Insulate a crossing or remove a wire."
- **FR-024**: A key whose two pins end up on the same connection (after joins and connected crossings) MUST be reported as shorted.
- **FR-025**: Every reported problem MUST, when activated in the problems panel, select and focus the key, pin, wire or wire end it names, and that element MUST be marked on the canvas with an icon or shape in addition to color.

**Project data**

- **FR-026**: Keys (number, position), wires (ends, bend points), junctions, crossing insulation and board pin assignments MUST be part of the keyboard project, restored after reload and included in the project file.
- **FR-027**: Each user gesture (place, move, delete, draw, toggle insulation, assign pin) MUST be one change to the project, and project undo/redo (from roadmap 002) treats it as one step.

**Accessibility**

- **FR-028**: Every operation (place, move, delete key; draw, edit, delete wire; toggle crossing; assign board pin) MUST be possible with the keyboard alone, and keys, pins, wires, crossing buttons and wire ends MUST have accessible names that state their connection state.
- **FR-029**: A non-canvas list MUST show every key with its two pins and what each connects to, every wire with its ends, every crossing with its state and every board pin assignment, and allow the same edits (AGENTS §7.8).

### Out of scope

- Deriving the ZMK matrix or direct wiring (rows, columns, key → matrix position, pin list) from the schematic, and generating files from it. A later feature derives kscan from the schematic's connections.
- Choosing a real controller board and its named pins (roadmap 005); this feature uses a generic numbered board.
- Diodes as schematic parts; key size, rotation and keycaps (layout editor, roadmap 006); bindings.
- Automatic wire routing.

### Key Entities *(include if feature involves data)*

- **Key**: one keyboard switch on the schematic. Number (0-based, contiguous), position on the surface in key units (this is the key's physical position; there is no separate schematic position), two pins. Key number = key index used by the keymap (Bindings) and generated files; later features (layout editor: size, rotation) extend the same entity.
- **Key pin**: one of the two contacts of a key (pin 1, pin 2). Connected when at least one wire end is on it.
- **Wire**: a line with two ends and ordered bend points; all segments horizontal or vertical. Each end is on a key pin, on a point of another wire (junction), or free; at least one end is on a key pin.
- **Wire end**: where a wire starts or stops; a free end may carry a board pin.
- **Crossing**: a point where two different wires cross without a junction; state connected (default) or insulated.
- **Board pin**: a numbered pin of the generic controller board (e.g. P0…Pn) that a free wire end connects to.
- **Connection (net)**: a set of key pins, wires and board pins that are electrically joined through wires, junctions and connected crossings. Derived, not stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can draw a 2×2 matrix (4 keys, 2 row wires, 2 column wires crossing with insulation, 4 board pins) in under 3 minutes on first try.
- **SC-002**: 100% of the schematic (keys, numbers, wires, bends, junctions, crossing states, board pins) is restored identically after reload.
- **SC-003**: Every unconnected key pin, unassigned free wire end, conflicting board pin, shorted board pins, overlapping key and shorted key appears in the problems panel within the same interaction that caused it, and activating it focuses the element.
- **SC-004**: Every operation in stories 1–4 can be completed with the keyboard alone.
- **SC-005**: With 100 keys and 300 wires, placing, dragging a key and drawing a wire show no visible lag.
- **SC-006**: In a usability check, users identify connected vs insulated crossings correctly in both themes without relying on color.

## Assumptions

- Crossing wires are connected by default and insulated on request, as the user described (this is the opposite of common schematic convention, where crossings do not connect unless marked with a dot; confirmed by the user in clarification).
- The pin layout of the key follows a common mechanical (MX-style) key: two pins at fixed offsets from the center, drawn from above.
- A key occupies one key unit on the grid; its position is the key's physical position (clarified). Size and rotation of keys are the layout editor's job and apply to the same key.
- Wires consist of horizontal and vertical segments only (clarified); beyond the automatic L-bend there is no routing.
- The generic board has a fixed list of numbered pins (P0–P31) and no GND or power pins (clarified). A key's second pin in direct wiring is wired to a shared connection with the other keys; how that maps to ground is decided by the later kscan derivation feature. The generic list stays until controller boards (roadmap 005) replace it; mapping generic pins to real board pins is that feature's job.
- The last line of the request ("all pin connections by wires and wire ends bound to board pins") is read as: all of these are stored in the project config (FR-026).
- Depends on project foundation (roadmap 002, built first): the project, autosave, project file Open/Save and undo/redo come from it; this feature only adds schematic data to the project and one project change per gesture.
- The problems panel, tab badges, tool window, grid, snapping and shortcut help come from spec 001.
