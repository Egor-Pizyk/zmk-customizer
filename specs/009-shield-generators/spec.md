# Feature Specification: Shield generators

**Feature Branch**: `009-shield-generators`
**Created**: 2026-10-12
**Status**: Implemented
**Input**: Implement roadmap stage 009 from schemaVersion 4, including saved diodes, with deterministic unibody ZMK v0.3.0 files and Export preview.

## User Scenarios & Testing

### User Story 1 - Inspect a complete shield (Priority: P1)

A builder opens Export on a complete schematic and reads the five files needed for a unibody shield.

**Why this priority**: The project becomes a useful firmware configuration.
**Independent Test**: Open a complete project and compare all five displayed files with approved examples.

**Acceptance Scenarios**:
1. **Given** a valid matrix, **When** Export opens, **Then** Kconfig.shield, Kconfig.defconfig, the shield overlay, keymap and default configuration are readable, with the target board named.
2. **Given** multiple layers, **When** they are reordered, **Then** their actions reference the new target indices, and every key remains in key-list order.
3. **Given** repeated tap-dance or mod-morph actions, **When** files are generated, **Then** each identical definition appears once and all uses reference it.
4. **Given** unchanged data, **When** Export is reopened, **Then** every byte is unchanged.

### User Story 2 - Understand generation blockers (Priority: P1)

A builder sees actionable problems instead of unusable files.

**Why this priority**: Incorrect firmware descriptions are worse than missing output.
**Independent Test**: Remove a diode or reverse only one diode and check the issue list.

**Acceptance Scenarios**:
1. **Given** unconnected pins, shorts, duplicate cells, unavailable controller pins, or non-matrix wiring, **When** Export opens, **Then** no files appear and each issue identifies what to fix.
2. **Given** mixed current directions, **When** Export opens, **Then** conflicting keys are identified. Reversing every diode permits the opposite direction.
3. **Given** an empty project or a key without a diode, **When** Export opens, **Then** generation is blocked without adding or discarding diodes.
4. **Given** a problem, **When** its issue is activated, **Then** the workspace where it can be fixed opens; problems also appear in the shared panel and badges.

### User Story 3 - Start with a working unibody preset (Priority: P2)

A builder chooses a complete small keyboard from New and can immediately inspect real output.

**Why this priority**: Provides a usable example before the full wiring and board editors exist.
**Independent Test**: Choose the preset in New and inspect Export; save/reopen preserves the project; replacement resets history like existing New, and subsequent edits support undo/redo.

**Acceptance Scenarios**:
1. **Given** New, **When** the six-key unibody preset is selected, **Then** a wired 2×3 keyboard with six diodes and two populated layers replaces the project through the existing confirmation flow.
2. **Given** the preset, **When** Export opens, **Then** it has zero issues and five files.

### Edge Cases

Disconnected matrix components, odd cycles, reversed switch pin use, both diode attachment pins, unused wires, multiple GPIOs on one net, duplicate GPIOs across nets, negative coordinates, physical cells outside signed 16-bit range, escaped keyboard names, long layer names, sanitized layer-name collisions, deleted layer references and missing bindings.

## Requirements

### Functional Requirements

- **FR-001**: Generate exactly five unibody shield files for ZMK v0.3.0, without changing project data; no split, ZIP, download, metadata, settings, combos or macros.
- **FR-002**: Derive rows/columns from the bipartite graph of electrical nets, one edge per switch. In each connected component the net with smallest GPIO is row; other sides alternate. Sort all row GPIOs and all column GPIOs numerically, including disconnected components. Reject odd cycles, shorts and duplicate matrix cells.
- **FR-003**: Generic Pn means physical nRF52840 port-0 GPIO n on fixed target nice_nano_v2. Only P2, P6, P8, P9, P10, P11, P17, P20, P22, P24, P29 and P31 are exportable. Display this mapping and target in Export; board selection remains outside scope.
- **FR-004**: Determine current from each saved diode: away-switch cathode receives current on its selected pin; toward-switch cathode receives current on the other pin. Row→column means row2col and column→row means col2row; every key must agree after FR-002 orientation. Do not flip disconnected components to conceal disagreement.
- **FR-005**: Require a saved diode for every key and at least one key. List missing-diode and empty-project errors. Never insert diodes automatically.
- **FR-006**: Overlay includes gpio-matrix kscan, wakeup, explicit diode-direction with matching input pulls, matrix transform and chosen physical layout. Emit 1u unrotated geometry using stored positions, rounded to hundredths; preserve negatives and reject cells outside −32768…32767.
- **FR-007**: Preserve the keys array order in transform, physical layout and every layer. Missing bindings mean &none.
- **FR-008**: Emit every stored binding kind, including all layer behaviors. Resolve layer identities against current layer order; deduplicate structurally identical tap-dance and mod-morph definitions across all layers in first-use order.
- **FR-009**: Use existing technical shield-name validation. Escape quote and backslash in keyboard strings; reject control characters. Retain existing layer-name restrictions (no quote, backslash or control characters; nonempty and unique after sanitizing), require sanitized node names ≤31 characters and display names ≤19 UTF-8 bytes. Do not truncate or change firmware settings.
- **FR-010**: Provide a bundled six-key 2×3 unibody preset with safe controller pins, six col2row diodes, Base and Fn layers, layer switching, tap-dance and mod-morph. It is a complete small keyboard, inspired by upstream Reviung41 file structure rather than a Reviung41 electrical clone.
- **FR-011**: Export is a read-only, keyboard-accessible preview of every generated path and complete contents. While any project/generation issue exists, show actionable issue links and zero files. Updates follow edits and undo/redo; existing problem badges and panel share the blockers.
- **FR-012**: Output has stable file ordering, fixed indentation, LF and exactly one final newline, with no timestamps or locale-dependent content. Approved golden examples derive from verbatim pinned upstream fixtures; document every intentional difference beside expected files.

### Key Entities

- Project: current version-4 keys, wires, crossing insulation, saved diodes and ordered layers.
- Derived matrix: ordered row/column GPIOs, one cell per key and one consistent diode direction; never persisted.
- Generated file: repository-relative path and text content.
- Issue: code, readable instruction and location in the project.
- Preset: bundled complete project that uses existing replacement/history/save flows.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The preset exposes exactly five approved files and zero problems.
- **SC-002**: All currently supported actions retain their meaning; reordering layers changes target numbers without shifting key actions.
- **SC-003**: Every tested invalid schematic produces problems and zero preview files; repairing it restores preview.
- **SC-004**: Repeated generation of unchanged projects gives identical bytes for all files, including both diode directions.
- **SC-005**: New preset and all file contents are accessible using the keyboard, with no network request required.

## Assumptions

Depends on completed 008 schemaVersion 4, schematic connectivity and 007 stable layer ids. Schema does not change. Firmware compilation and build-verification are outside scope; syntax review and golden checks do not establish a successful firmware build.

## Clarifications

### Session 2026-10-12

- Q: What is the compatible target and meaning of generic Pn? → A: User confirmed nice_nano_v2 and real gpio0 pin numbers, restricted to exposed safe pins.
- Q: May keys omit diodes or may an empty project generate files? → A: User confirmed requiring a saved diode on every key and blocking empty projects.
- Review decisions: deterministic per-component minimum-GPIO row orientation; disconnected components do not auto-flip for diode agreement; short layer names are validated, not truncated; bundled complete 2×3 macropad; no .zmk.yml. Kconfig also escapes dollar signs because its parser expands macros inside strings.
