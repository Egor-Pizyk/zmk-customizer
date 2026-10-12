# Feature Specification: Schematic diodes

**Feature Branch**: `008-schematic-diodes`
**Created**: 2026-10-12
**Status**: Approved for implementation
**Input**: Add a diode button beside each switch pin, disable the other pin when a diode exists, draw a minimal symbol, persist it and use it for future generation.

## User Scenarios & Testing

### User Story 1 — Add and remove a diode (Priority: P1)
Users describe a switch diode without redrawing wires.
**Why this priority**: A diode is part of the actual circuit.
**Independent Test**: Add a diode at pin 1, observe pin 2 unavailable, remove it and add at pin 2.
**Acceptance Scenarios**:
1. Given a switch without a diode, when either pin button is clicked, then exactly one diode appears at that pin and the opposite button becomes unavailable with a reason.
2. Given a diode, when its button is clicked, then it is removed and both buttons become available.
3. Given existing wires, when a diode changes, then wire endpoints, positions and connections remain unchanged; undo reverses one change.

### User Story 2 — Read and edit polarity (Priority: P2)
Users see a small conventional diode symbol and can reverse its polarity from the Parts table.
**Why this priority**: Generation needs current direction, not just diode presence.
**Independent Test**: Reverse a diode; the cathode bar changes side and its described direction changes.
**Acceptance Scenarios**:
1. Given a diode, when the key moves, then the symbol follows its pin.
2. Given keyboard-only access, when the Parts controls are used, then add, remove and reverse are all possible.

### User Story 3 — Preserve circuit intent (Priority: P2)
Users retain diodes after reload, project file round trip and undo/redo.
**Why this priority**: Wiring must be reproducible from the project.
**Independent Test**: Save and reopen both diode polarities; compare all circuit data.
**Acceptance Scenarios**:
1. Old project files open with no diodes added automatically.
2. Invalid diode pins or polarity are rejected with a readable field path without changing the current project.
3. Removing a key removes its diode; key bindings and other keys remain consistent.

### Edge Cases
- A diode cannot be added at the other pin until the current one is removed.
- Missing key operations are harmless; repeated removal creates no change.
- Unconnected pins can have a diode; existing connection problems remain visible.
- At low zoom the Parts table provides controls when canvas buttons would overlap.

## Requirements
### Functional Requirements
- **FR-001**: Each switch MUST have a diode toggle beside each pin in Schematic.
- **FR-002**: A switch MUST have at most one diode. The other pin toggle MUST be unavailable and explain why.
- **FR-003**: The active toggle MUST remove the diode; each add/remove/reverse MUST be one undo step.
- **FR-004**: Diodes MUST be rendered as small line symbols with an identifiable cathode bar using the existing schematic style, in both themes.
- **FR-005**: The Parts table MUST expose equivalent labeled controls and polarity reversal.
- **FR-006**: Diode pin and polarity MUST survive autosave, reload and project file round trips. Older projects MUST load without diodes.
- **FR-007**: Diodes MUST follow key moves and disappear on key deletion without rewiring the project.
- **FR-008**: The project MUST expose unambiguous current direction for subsequent shield generation; generation MUST use polarity rather than silently override it with a fixed default.
- **FR-009**: Malformed diode data MUST be rejected before it reaches project state.

### Key Entities
- Switch diode: selected pin and cathode side relative to the switch; belongs to one key.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Adding or removing a diode requires one click and never permits two diodes on a switch.
- **SC-002**: All diode operations are available without a mouse.
- **SC-003**: Both pins and both polarities preserve circuit intent through saving and reopening.
- **SC-004**: Every existing supported project version loads with unchanged wiring and bindings.

## Assumptions
- New diodes default to cathode away from the switch; reversal is explicit.
- A diode is in series between the selected switch pin and its existing net; net identities do not change.
- This feature stores and exposes generation input. Shield generators do not exist yet and are delivered by the next roadmap feature.
- No free-standing diodes, component library, split configuration or firmware generator is added here.

## Follow-up correction — 2026-10-12

Both diode leads must be continuous in either polarity; their corrected attachment and orientation are defined below. Adding/reversing/removing a diode must not reroute stored wires or change nets. The wire snap target follows the external lead. Connected wire ends must not use the unconnected danger style; actual board-pin/short/unsupported-pin problems remain visibly marked. A free endpoint geometrically coincident with a key pin is connected, consistent with existing geometric pin contacts. Contacts with other wire ends still require explicit junctions.

### Corrected attachment contract — 2026-10-12

The switch-side lead is anchored to the physical pin, and the wire-side lead is a separate external terminal. Orient the diode along the first segment at least 0.32u long (or first nonzero segment if none is long enough) of the first connected wire in project order; without a wire, point upward. Polarity reverses the cathode only, never the two attachment positions. All wires explicitly connected to that pin meet the common external terminal in the display. These are presentation coordinates; stored bends, endpoints, electrical nets and generator output are unchanged.

### Shared row orientation correction — 2026-10-12

When several wires explicitly meet the diode pin, consider the outgoing segment of every wire instead of the first wire in project order. Prefer rightward, then leftward, then downward, then upward runs; keep the existing short-elbow rule per wire and upward fallback. This makes a horizontal row with its controller connection on the right display all identical diode polarities consistently, including middle and final switches. Reordering wires must not change orientation. Reversal still changes electrical polarity and mixed electrical directions remain blockers; presentation must not require reversal to make an otherwise consistent row look consistent.

The orientation lookup must also recognize a wire passing through the physical pin and a free endpoint coincident with it, matching existing getKeyPinWires connectivity. At an interior contact, consider both outgoing portions of the containing segment; use the same right/left/down/up preference. An implicit connected pin must not use the unwired upward fallback.
