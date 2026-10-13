# Feature Specification: Matrix Wiring Editor

**Feature Branch**: `013-matrix-wiring-editor`

**Created**: 2026-10-13

**Status**: Ready for planning

**Input**: User description: "начни делать эту фичу по sdd подходу используя spec-kit"; feature 013 from docs/roadmap.md: describe unibody/split, matrix/direct scanning, matrix cells, GPIO assignments and diode direction in Schematic, highlight conflicts and update generated files.

## Clarifications

### Session 2026-10-13

- Q: How do matrix assignments interact with drawn wires? → A: Assignments of rows, columns and pins change the actual schematic connections; both views show one wiring.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Assign and inspect a matrix (Priority: P1)

A builder assigns each key to a row and column, chooses controller pins for each row and column, and inspects the whole electrical matrix without writing firmware configuration.

**Why this priority**: The generated scan configuration must describe the actual hardware rather than an implicit ordering chosen by the app.

**Independent Test**: Open the existing unibody preset, inspect its cells and pins, change an assignment, then verify the visible matrix, saved project and downloaded configuration agree.

**Acceptance Scenarios**:

1. **Given** an existing valid wired preset, **When** the editor opens, **Then** every key has its existing electrical cell and controller pin assignments, and exporting without edits preserves the previous output.
2. **Given** keys in a layout, **When** the user assigns cells and pins through the grid or table, **Then** both views show the same assignments and the export preview reflects the accepted changes.
3. **Given** a valid matrix, **When** the user changes diode direction, **Then** the selected direction and any diode conflicts are visible and the generated scan configuration agrees with the validated direction.
4. **Given** an irregular or rotated layout, **When** the user requests automatic cell assignment, **Then** each key receives one deterministic cell, physical geometry and bindings remain unchanged, and the result can be adjusted manually.

---

### User Story 2 - Repair wiring conflicts (Priority: P1)

A builder sees which keys or pin assignments prevent export and fixes them in Schematic.

**Why this priority**: A configuration that builds but reads the wrong switches violates the product promise.

**Independent Test**: Create duplicate cells, missing assignments and duplicate pins; observe specific affected keys/pins and blocked export, then repair them and download valid files.

**Acceptance Scenarios**:

1. **Given** two keys in one cell, **When** validation runs, **Then** both affected keys are identified in the editor/canvas and the Schematic problems panel.
2. **Given** a key without a cell or a used row/column without a pin, **When** the user attempts export, **Then** export is blocked with a message identifying the missing assignment.
3. **Given** the same GPIO assigned twice on one half or an unavailable/reserved contact, **When** validation runs, **Then** the affected assignments are identified and export remains blocked until repaired.
4. **Given** conflicting physical wiring or diode polarity, **When** assignments are edited, **Then** the app must not silently export configuration that contradicts the hardware description.

---

### User Story 3 - Configure direct scanning (Priority: P2)

A builder with one GPIO per key chooses direct scanning and assigns each key a pin, with the switch connected to ground.

**Why this priority**: Small keyboards do not always use a row/column matrix.

**Independent Test**: Configure a small direct keyboard, download its files and build them for the selected board.

**Acceptance Scenarios**:

1. **Given** direct scanning, **When** the user assigns distinct valid pins to all keys, **Then** the editor shows per-key inputs and exported files use direct scanning with matching key order.
2. **Given** a direct keyboard with missing or repeated pins, **When** validation runs, **Then** export is blocked and affected keys are named.
3. **Given** a configured keyboard, **When** the scanning type changes, **Then** geometry and bindings survive and incompatible assignments are never silently treated as valid.

---

### User Story 4 - Configure two independent halves (Priority: P2)

A split builder assigns keys to left/right halves and configures each half's pins while keeping one complete keymap.

**Why this priority**: The same GPIO may legitimately be used on different controllers, and each half requires its own build target.

**Independent Test**: Configure a BLE split, adjust one key's half, download the repository ZIP and build both halves.

**Acceptance Scenarios**:

1. **Given** an unibody layout, **When** split is enabled, **Then** initial half assignments follow key positions, can be edited, and preserve key order and bindings.
2. **Given** a split, **When** the same pin is used once on each half, **Then** it is allowed; using it twice within one half is reported.
3. **Given** a valid split, **When** files are downloaded, **Then** both shield variants/build targets are present, the right half addresses its own block of the shared matrix, and keyboard identity/central role are configured only on the central half.

### Edge Cases

- Empty layouts and a split with an empty half must show actionable validation instead of producing incomplete firmware.
- Sparse matrices, unequal half dimensions, rotated clusters and keys exactly on the half boundary require deterministic results.
- Key deletion, duplication and reordering must not transfer another key's assignment or shift bindings.
- Board changes must revalidate pins; reserved power/ground contacts must not become GPIO assignments.
- Switching unibody/split or matrix/direct must preserve unrelated project content and have predictable Undo/Redo.
- Connected nets that cross the half boundary must not be interpreted as a physical link between independent controllers without an explicit supported meaning.
- Imported invalid assignments must be safely rejected or reported, without corrupting the open project.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Schematic MUST offer unibody and two-half split configurations, with editable key-to-half assignments and automatic initial assignment based on visible key positions.
- **FR-002**: Users MUST choose matrix or direct scanning; charlieplex and mixed scan types are out of scope.
- **FR-003**: Matrix mode MUST expose dimensions, key-to-cell assignments, row pins, column pins and diode direction (`col2row`/`row2col`).
- **FR-004**: The matrix grid MUST show all keys occupying each cell, including conflicts, with a keyboard-accessible table alternative for every edit.
- **FR-005**: Users MUST assign cells manually and request deterministic automatic assignment per half from physical positions. Automatic assignment MUST preserve geometry, key order and bindings.
- **FR-006**: Pin selection MUST reuse selected-board pin names, descriptions and documentation, and distinguish unavailable/reserved contacts.
- **FR-007**: Direct mode MUST expose one controller input per key and explain switch-to-ground wiring; matrix-only controls MUST not govern direct output.
- **FR-008**: Each key MUST have exactly one valid cell/input in its half; one cell MUST contain at most one key; each GPIO MUST be used at most once per half.
- **FR-009**: Missing cells/inputs, missing used row/column pins, duplicate cells, duplicate GPIO, unavailable pins and wiring/diode contradictions MUST block export and identify affected entities in Schematic and its problems badge/panel.
- **FR-010**: Matrix/input assignments MUST change actual schematic connections, not create a separate export-only wiring mode. Both views MUST describe the same wiring. Connection-changing operations MUST preview the resulting connections before Apply, may reroute affected wires, preserve unrelated geometry/bindings, and commit as one undoable change. Cancel MUST leave the project unchanged. Manual wire edits MUST refresh inferred assignments or report contradictions; export MUST never silently disagree with drawn connectivity.
- **FR-011**: Split output MUST include a shared complete keymap/physical layout, left/right shield variants and build targets, correct right-half column offset and central-only keyboard identity/role.
- **FR-012**: Both halves initially use the selected board and one scanning type; left is central and right peripheral. Only BLE-capable boards are supported for split in this feature. Different boards per half and wired split transport are out of scope.
- **FR-013**: All project edits MUST autosave, survive reload and JSON round-trip, and support atomic Undo/Redo. Older project files MUST still load without changing their existing valid exported output before edits.
- **FR-014**: Assignment identity MUST follow key identity across physical movement and key reordering. Deleting a key MUST remove its assignment; duplicating a key MUST not create a silently valid duplicate electrical assignment.
- **FR-015**: All offered ZMK options MUST explain their effect and link to the exact v0.3 documentation section.
- **FR-016**: Export preview and downloaded ZIP MUST describe the same validated wiring and build on upstream ZMK v0.3 without manual edits, for matrix in both diode directions, direct, and both split halves.
- **FR-017**: Real-browser verification MUST cover grid/table edits, visible conflicts and repair, Undo/Redo, reload/JSON round-trip and actual ZIP contents using isolated test browsers. Native controls/focus and affected SVG interactions MUST receive targeted Firefox/WebKit coverage.
- **FR-018**: Automatic assignment on every available preset MUST reproduce its preset matrix or an explicitly documented equivalent. Equivalence MUST identify any row/column permutation and preserve the intended electrical key-to-pin connections after the preview is applied; preset-specific acceptance cases MUST verify the result independently.

### Key Entities

- **Wiring configuration**: scanning type, unibody/split organization and validated electrical assignments.
- **Half**: left/right controller instance and its independent pin namespace; unibody has one controller instance.
- **Cell**: a row/column within a half, assigned to a stable key identity.
- **Pin assignment**: an available controller connector position associated with a matrix row/column or direct input.
- **Net**: connected switch contacts and wires in the schematic, changed by matrix/input edits and used to verify every accepted electrical assignment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every key in each valid acceptance fixture appears exactly once in its displayed matrix/input list and exactly once in the exported transform and each layer.
- **SC-002**: Every conflict category in FR-009 is detected before download and stops blocking export after its specific cause is repaired.
- **SC-003**: Reload, JSON round-trip and Undo/Redo preserve all accepted assignments, physical geometry and bindings in every acceptance scenario.
- **SC-004**: Existing valid unibody fixtures export byte-identical files after migration with no user edits.
- **SC-005**: Downloaded matrix fixtures in both diode directions, a direct fixture and both halves of a split fixture build with upstream ZMK v0.3 without editing the downloaded files.
- **SC-006**: All wiring operations are available using keyboard-accessible controls; changed browser journeys pass three consecutive runs without retries.

## Assumptions

- Depends on completed features 009–012: validated generation, ZIP download, selected controller/pin picker and physical-layout editing.
- Existing schematic nets and diode polarity are meaningful user data and cannot be discarded without an explicit user action.
- Auto-assignment is a starting point, not a promise to infer arbitrary handwired topology from geometry; rotated and staggered keys remain manually adjustable.
- Charlieplex, encoders, custom boards, new firmware settings, different boards per half and wired split transport are outside this feature.
- Roadmap number 013 is explicitly selected; later existing specs 023–025 retain their immutable numbers.
