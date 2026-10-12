# Feature Specification: Controller boards

**Feature Branch**: `011-controller-boards`
**Created**: 2026-10-12
**Status**: Implemented
**Input**: Roadmap 011: choose a supported controller, use its printed pin labels, preserve compatible wiring and export the correct ZMK v0.3 configuration.

## Clarifications

### Session 2026-10-12

- Cross-family compatibility: user confirmed: Pro Micro ↔ XIAO clears all assignments, retaining previous labels; equal D numbers do not imply compatible physical positions.
- Initial list: four verified controllers from FR-001. Split selection is deferred to 013, which introduces halves.

## User Scenarios & Testing

### User Story 1 - Choose a controller (Priority: P1)

A builder selects the controller in Schematic and assigns wire endpoints using its named pins.

**Why this priority**: A configuration must describe the user's actual hardware.
**Independent Test**: Select each supported board and inspect its pin choices, description and documentation.

**Acceptance Scenarios**:
1. **Given** a new project, **When** Schematic opens, **Then** nice!nano v2 is selected and its usable D pins are offered.
2. **Given** any supported board, **When** its pin selector opens, **Then** it lists its connector labels and marks assignments already used elsewhere; power, ground and reset are never assignable.
3. **Given** a selected controller, **When** the user reloads or saves and opens the project, **Then** the controller and assignments remain identical; undo/redo restores each change.

### User Story 2 - Change hardware without silent rewiring (Priority: P2)

A builder changes controllers and sees which assignments need attention.

**Why this priority**: Silent changes can produce the wrong electrical configuration.
**Independent Test**: Switch between the two Pro Micro boards and between Pro Micro and XIAO; inspect every affected endpoint and undo.

**Acceptance Scenarios**:
1. **Given** assigned Pro Micro pins, **When** another Pro Micro controller is selected, **Then** all shared connector positions remain assigned.
2. **Given** assignments incompatible with the new controller, **When** the board changes, **Then** affected endpoints become unassigned, retain their former label for explanation and appear individually in Schematic problems; wires, keys and bindings are preserved.
3. **Given** an affected endpoint, **When** a valid new pin is assigned, **Then** its dropped-assignment issue disappears.
4. **Given** an older project, **When** it opens, **Then** its nice!nano raw GPIO assignments are converted to equivalent connector positions; unmappable values are reported for reassignment.

### User Story 3 - Export for the selected controller (Priority: P3)

A builder downloads configuration using the selected board and its connector.

**Why this priority**: Selection must change the firmware files, not just the screen.
**Independent Test**: Generate each controller's configuration and compare all files against approved expectations.

**Acceptance Scenarios**:
1. **Given** a valid wired project, **When** exporting, **Then** build.yaml names the exact selected ZMK v0.3 board and the shield references its connector pins.
2. **Given** unavailable or dropped pins, **When** opening Export, **Then** download is blocked with actionable Schematic problems.

### Edge Cases

- Selecting the current controller is a no-op with no extra undo entry.
- Unknown controller ids or malformed assignment metadata in imported JSON are rejected without changing the open project.
- Pins absent from a connector map are validation errors, even if the project otherwise parses.
- Older malformed endpoint data must not become valid merely through migration.
- Board change on an empty project still persists and is undoable.
- A dropped assignment remains visible after save/reload and later board changes until reassigned or explicitly cleared.

## Requirements

### Functional Requirements

- **FR-001**: Offer nice!nano v2, Seeed XIAO nRF52840 BLE, SparkFun Pro Micro RP2040 and Adafruit KB2040 in Schematic with a description and exact v0.3 documentation link per entry.
- **FR-002**: Offer connector pins with labels matching the board pinout and MCU labels for clarity; identify reserved power/ground/reset contacts and exclude them from assignment.
- **FR-003**: Store one controller for the current unibody project; controller changes are one undo step, persist in browser storage and survive project file round trips.
- **FR-004**: Preserve assignments only when both boards share a connector family and the position exists on the new board. Switching Pro Micro ↔ XIAO clears all assignments. Incompatible assignments become unassigned; every dropped endpoint keeps its previous label until reassigned or explicitly cleared.
- **FR-005**: Report unavailable and dropped pin assignments individually in Schematic problems, link issues to their endpoint controls, and block export while such problems remain.
- **FR-006**: Preserve all geometry, insulated crossings, diodes, layers and bindings during a board change.
- **FR-007**: Open all previously supported project versions, convert exposed nice!nano port-0 GPIOs to their corresponding connector positions and report unmappable old values without changing their wire geometry.
- **FR-008**: Generate connector GPIO references and the exact selected v0.3 board id; output is deterministic and covered by file comparisons for every supported controller.
- **FR-009**: Reject unknown board ids and malformed new data on import without corrupting the current project.
- **FR-010**: All controller/pin controls are labeled and keyboard reachable, show validation text, work offline after load and use the existing history and status feedback.

- **FR-011**: Preserve bindings when switching boards, report Bluetooth actions on USB-only controllers individually under Bindings, and block export until corrected.

### Key Entities

- **Controller**: Supported board identity, name, connector family, usable pins, MCU labels, reserved contacts, description and documentation link.
- **Pin assignment**: A wire endpoint's connector position; an unassigned endpoint may retain its previous board/pin label to explain a dropped assignment.
- **Project**: Stores one controller and its existing keyboard content.

## Success Criteria

### Measurable Outcomes

- **SC-001**: All four controllers expose exactly their verified usable connector pins and documentation.
- **SC-002**: Switching between Pro Micro controllers preserves 100% of connector assignments; incompatible positions are all reported and none silently reassigned.
- **SC-003**: Controller selection and reassignment survive save/reload and file round trip; undo/redo restores the exact project before/after.
- **SC-004**: Every controller's complete exported directory matches approved expected files byte for byte on repeated generation.
- **SC-005**: Every legacy exposed nice!nano port-0 pin maps to the same physical contact; all unmappable values remain actionable.

## Assumptions

- Split halves and selecting different boards per half belong to 013; only one unibody controller is stored here.
- Pin assignment uses the existing wire-end controls; row/column editors, extra buses, raw GPIO selection and custom boards are out of scope.
- The four-board initial list uses verified controller pin maps.

