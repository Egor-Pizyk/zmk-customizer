# Feature Specification: Layers

**Feature Branch**: `007-layers`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "Let users build a keymap with several layers in the Bindings workspace. They add, rename, reorder and delete layers from tabs above the keyboard, switch between them, and set what each key does on the open layer with the existing Action panel; copy/paste, multi-select, the keys table and automatic next key work on the open layer. The behavior picker gains the ZMK layer behaviors: hold a layer while pressed, a layer on hold and a key on tap, toggle a layer, switch to a layer, and a one-shot sticky layer; each asks which layer and links to the ZMK documentation. A reference to a layer keeps pointing at that layer when layers are reordered; deleting a layer that keys still use is allowed and every such key is reported in the problems panel under Bindings. Layer names must be unique and usable in the generated keymap. Everything survives reload, undo and saving to a file. Out of scope: conditional layers, layer locking, tuning layer-tap timing, encoders, generating files."

Model: keymap-editor (nickcoutsos): layer tabs above the keyboard, a layer parameter picked from the layer names. This feature replaces spec 005 FR-015 and User Story 4 (layer behaviors rejected while the project has one layer).

## Clarifications

### Session 2026-10-06

- Q: Maximum number of layers in ZMK v0.3? → A: 32 (indices 0–31), from v0.3.0 source (`uint32_t` layer state); recorded in `docs/zmk/keymap.md` §2. Not asked: a verified fact.
- Q: What do the keys of a new layer hold? → A: Pass-through (`&trans`) on every key that exists when the layer is added; keys added later have no action there (do nothing), as on any layer.
- Q: How does a layer name reach the generated keymap? → A: The name is free text and becomes the layer's display name as typed; the layer node name is derived from it (lowercase, other characters become `_`, `_layer` appended: `Nav & Sym` → `nav_sym_layer`); uniqueness is checked on the derived node name.
- Q: What does a pass-through key show on a layer above Base? → A: Only the pass-through mark and tag, as today; no legend from layers below (what passes through depends on which layers are on in the firmware).
- Q: How is a layer reference stored, and does the project file version change? → A: By the layer's stable identity, so moving layers rewrites nothing and a deleted target stays detectable; the generator (008) turns it into the position number. The new behaviors are added to the file format like tap-dance and mod-morph in spec 005 (research R6): file version stays 3, no migration, every existing file reads as before.

## User Scenarios & Testing

### User Story 1 - Layer tabs (Priority: P1)

Above the keyboard in the Bindings workspace the user sees one tab per layer, in keymap order, the first one "Base". They add a layer, rename it, move it left or right, delete it, and switch between layers. Each of these changes is one undo step; switching is not a change.

**Why this priority**: Without layers there is nothing for layer behaviors to point at; every later keymap feature (combos, conditional layers, generated keymap) needs several layers.

**Independent Test**: On a project with keys, add a layer, rename it "Nav", move it before Base, undo three times — the project is back to one layer named Base.

**Acceptance Scenarios**:

1. **Given** the Bindings workspace, **When** it opens, **Then** a tab list above the canvas shows every layer by position number and name, the open layer marked, followed by an "Add layer" button.
2. **Given** any layer is open, **When** the user chooses "Add layer", **Then** a new layer with a unique default name, every key set to pass-through (`&trans`), is added after the last layer and opens, in one undo step.
3. **Given** a layer tab, **When** the user renames it and confirms, **Then** the new name is stored in one undo step; cancelling keeps the old name; an empty, duplicate or unusable name is reported at the field and in the problems panel (FR-006).
4. **Given** a layer tab, **When** the user moves it one position left or right, **Then** the order changes in one undo step and the moved layer stays open.
5. **Given** a project with more than one layer, **When** the user deletes a layer, **Then** it is removed in one undo step, the neighbouring layer opens and a status message offers undo ("Deleted layer Nav. Undo").
6. **Given** a project with exactly one layer, **When** the user looks for delete, **Then** it is unavailable with the reason stated.
7. **Given** a project with 32 layers, **When** the user looks for "Add layer", **Then** it is unavailable with the reason stated (ZMK v0.3 supports at most 32 layers).
8. **Given** keyboard focus in the tab list, **When** the user presses ArrowLeft/ArrowRight/Home/End, **Then** focus moves between tabs and the focused layer opens; rename, move and delete are reachable from the focused tab without a pointer.

---

### User Story 2 - Edit the open layer (Priority: P1)

Everything the Bindings workspace does today works on the open layer: keycap legends and behavior tags, the Action panel, multi-select, copy/paste, the Keys table and "Next key after picking".

**Why this priority**: A layer the user cannot fill is useless; this is the existing editor, pointed at the chosen layer.

**Independent Test**: Open layer "Nav", assign `&kp LEFT` to a key, switch to Base — that key still shows its Base action; switch back — it shows `LEFT`.

**Acceptance Scenarios**:

1. **Given** a layer is open, **When** the user picks an action in the Action panel, **Then** it is stored on that layer only, for every selected key, in one undo step.
2. **Given** an action was copied on one layer, **When** the user opens another layer and pastes, **Then** the action is stored on the open layer for every selected key.
3. **Given** keys are selected, **When** the user switches layer, **Then** the same keys stay selected and the panel shows their actions on the new layer; an unfinished draft (spec 006 FR-009) is dropped.
4. **Given** the Keys table is open, **When** the user switches layer, **Then** it lists the open layer's actions and names the layer.
5. **Given** a keycap, **When** a screen reader reaches it, **Then** it is announced as "Key N, <layer name> layer: <full action name>".
6. **Given** a problem on a key of another layer, **When** the user activates it in the problems panel, **Then** that layer opens and the key is selected with its Action panel open.

---

### User Story 3 - Layer behaviors (Priority: P1)

In the behavior picker a new group offers the five ZMK layer behaviors: momentary layer (`&mo`, the layer is on while the key is held), layer-tap (`&lt`, a layer while held, a key when tapped), toggle layer (`&tog`), to layer (`&to`, switch to a layer and turn off the others except the base) and sticky layer (`&sl`, the layer stays on for the next key press). Each asks which layer, listing the layers by number and name, and links to its section of the ZMK v0.3 docs.

**Why this priority**: Layers are only reachable on the keyboard through these behaviors.

**Independent Test**: On Base, select a key, pick `&mo`, pick layer "1 Nav" — the key shows `&mo` with legend "Nav" and the panel line reads `&mo [layer 1 Nav]`.

**Acceptance Scenarios**:

1. **Given** the behavior slot is open, **When** the picker opens, **Then** a "Layers" group lists `&mo`, `&lt`, `&tog`, `&to`, `&sl` with name, description, tag and a v0.3 docs link each.
2. **Given** the user picks `&mo`, `&tog`, `&to` or `&sl`, **When** the line shows the draft, **Then** the layer slot opens ("Which layer?") with every layer as a row (position number, name); picking one stores the binding for every selected key in one undo step.
3. **Given** the user picks `&lt` on keys that each send a key (kp, sk, kt, mt, lt), **When** the layer is picked, **Then** each key keeps its own key as the tap part, in one undo step; otherwise the tap slot follows the layer slot in the draft.
4. **Given** a key with a layer behavior, **When** the user clicks its layer slot and picks another layer, **Then** only the layer changes, in one undo step.
5. **Given** a key with `&lt`, **When** the user picks `&kp`, `&sk`, `&kt` or `&mt` in the behavior slot, **Then** the key keeps its tap key (spec 006 FR-008); with `&mt` the hold part is `LEFT_SHIFT`.
6. **Given** a keycap with a layer behavior, **When** it is drawn, **Then** it shows the behavior tag and the target layer's name as legend; `&lt` shows the tap key as the main legend and the layer name as the hold part.

---

### User Story 4 - References survive reorder, rename and delete (Priority: P2)

A key that points at a layer keeps pointing at the same layer when layers are moved or renamed. Deleting a layer that keys still point at is allowed; every such key is listed in the problems panel under Bindings until it is fixed or the delete is undone.

**Why this priority**: Moving layers is common while a keymap grows; silently retargeting `&mo` keys would break the keyboard in a way the user only notices on the device.

**Independent Test**: Base has `&mo 2` → "Sym"; move "Sym" to position 1 — the key now reads `&mo 1` and still names "Sym"; delete "Sym" — the problems panel lists the key under Bindings; undo — the problem disappears.

**Acceptance Scenarios**:

1. **Given** keys pointing at several layers, **When** any layer is moved, **Then** every key points at the same named layer as before, now shown with its new position number.
2. **Given** a key pointing at a layer, **When** that layer is renamed, **Then** the key's legend, panel line and accessible name show the new name.
3. **Given** keys on any layer point at layer "Nav", **When** "Nav" is deleted, **Then** each such key is one problem under Bindings (counted in the Bindings tab badge), naming the key, its layer and what to do; its keycap is marked as a conflict and its layer slot shows "Deleted layer".
4. **Given** a key pointing at a deleted layer, **When** the user picks an existing layer in its layer slot, picks another behavior, or undoes the delete, **Then** its problem disappears.

---

### User Story 5 - Layers persist (Priority: P2)

Every layer, its name, its order and all its actions, including layer behaviors, survive reload, saving and opening the project file, and undo/redo.

**Why this priority**: Required by spec 002 for all project data; without it the feature loses work.

**Independent Test**: Build three layers with layer behaviors, reload — deep-equal project; save the file and open it — deep-equal project.

**Acceptance Scenarios**:

1. **Given** several layers with actions, **When** the page reloads or the saved file is opened, **Then** the project is identical.
2. **Given** a project file made before this feature, **When** it is opened, **Then** it loads unchanged with its single Base layer.
3. **Given** a file whose layer behavior is malformed (missing layer, unknown field), **When** it is opened, **Then** it is rejected with a message naming the problem and the current project stays unchanged (spec 002).
4. **Given** a file whose layer behavior points at a layer that does not exist, **When** it is opened, **Then** it loads and the key is reported as in US4 AS3.

### Edge Cases

- The first layer is the base layer and is always on in ZMK; moving another layer to the first position makes it the base layer. The tab list marks the first layer as always on.
- A layer behavior may point at any layer, including Base and the layer the key is on; this is valid ZMK and not a problem.
- Deleting the open layer opens the layer that took its position, or the new last layer when the last one was deleted. The open layer is kept by position, so undo and redo show the layer now at that position (the last layer when fewer remain).
- Deleting a layer removes its actions; undo restores them.
- Moving the first layer left or the last layer right is unavailable.
- Renaming to the current name makes no change and no undo step.
- A key deleted in Schematic loses its action on every layer (spec 004 FR-020).
- Pasting a layer behavior onto another layer keeps its target layer.
- A loaded file with more than 32 layers opens and reports one problem under Bindings; "Add layer" stays unavailable until layers are deleted.
- The open layer is interface state: it is not stored in the project and not undone.
- A key added in Schematic after a layer was created has no action on that layer (do nothing), not pass-through.
- `Nav` and `nav`, or `Nav Sym` and `Nav-Sym`, derive the same node name and are reported as duplicates.

## Requirements

### Functional Requirements

- **FR-001**: The Bindings workspace MUST show a tab list above the canvas with one tab per layer in keymap order (position number and name) and an "Add layer" button after it. The open layer is the selected tab; the first layer is marked as always on. The tab strip MUST occupy its own single row with horizontal overflow and a reserved scrollbar gutter; Add layer MUST stay visible outside the scrolling strip. Name and order controls MUST occupy a separate row independent of layer count. Adding layers from 1 through 32 MUST NOT move these controls or the canvas at a fixed viewport. The selected tab MUST be revealed after adding, switching, reordering or undo/redo; long tab labels are visually truncated while retaining their full accessible name and tooltip.
- **FR-002**: The user MUST be able to add a layer (appended after the last layer, opened, with a unique default name and pass-through on every existing key), rename a layer, move a layer one position left or right, and delete a layer. Each is one project change and one undo step.
- **FR-003**: Delete MUST be unavailable while the project has one layer; "Add layer" MUST be unavailable while it has 32 layers (ZMK v0.3 layer limit, `docs/zmk/keymap.md` §2). Unavailable actions state why.
- **FR-004**: Deleting a layer MUST run at once (no confirmation) and show "Deleted layer <name>. Undo" in the status message.
- **FR-005**: A layer name is free text and is the layer's display name in the keymap as typed. Its node name is derived: lowercase, every run of characters other than Latin letters and digits becomes `_`, leading and trailing `_` dropped, `layer_` put in front when it starts with a digit, `_layer` appended (`Nav & Sym` → `nav_sym_layer`, `Base` → `base_layer`, `2nd` → `layer_2nd_layer`), valid as a Devicetree node name (`docs/zmk/keymap.md` §1). A name MUST derive a node name with at least one letter or digit, MUST NOT derive the same node name as another layer, and MUST NOT contain a double quote, a backslash or a control character such as a line break, tab or NUL (kept out of the display-name string until the generator, 008, verifies escaping).
- **FR-006**: A layer name that breaks FR-005 MUST be reported as a problem under Bindings naming the layer and what to fix, and at the rename field while editing. The rename field shows the derived node name.
- **FR-007**: The canvas, Action panel, multi-select, copy/paste, Keys table, "Next key after picking" and problem activation MUST work on the open layer. Switching layer keeps the selection and the copied action and drops an unfinished draft.
- **FR-008**: The behavior picker MUST offer a "Layers" group with `&mo`, `&lt`, `&tog`, `&to`, `&sl`, each with name, description, tag and a link to its section of the v0.3 docs.
- **FR-009**: Slots MUST be: `&mo`, `&tog`, `&to`, `&sl` → layer; `&lt` → layer, tap. The layer slot asks "Which layer?" and lists every layer of the project as a row with position number and name, marking the current value. The tap slot asks "Which key when tapped?" and offers every v0.3 keycode with modifier chips, like the `&mt` tap slot (spec 006 FR-004, FR-010).
- **FR-010**: Picking follows spec 006 FR-008/FR-009: choosing a layer behavior starts a draft with the layer slot open, stored when complete for every selected key in one undo step; `&lt` keeps each selected key's own key as the tap part when every selected key sends a key; switching from `&lt` to `&kp`/`&sk`/`&kt`/`&mt` keeps its tap key.
- **FR-011**: A layer behavior MUST keep pointing at the same layer when layers are moved or renamed; its shown position number and name follow the layer.
- **FR-012**: A layer behavior whose layer no longer exists MUST be reported as one problem per key under Bindings (counted in the Bindings tab badge), naming the key and its layer and saying how to fix it; activating it opens that layer and selects the key. Its keycap is marked as a conflict and its layer slot reads "deleted layer".
- **FR-013**: Keycaps MUST show the behavior tag and, for layer behaviors, the target layer's name as legend; `&lt` shows its tap key as the main legend and the layer name as the hold part. The full action name ("Momentary layer Nav", "Space, layer Nav when held") is the tooltip and part of the accessible name "Key N, <layer name> layer: <full action name>". A pass-through key shows only its pass-through mark on every layer, never a legend from a layer below.
- **FR-014**: Layer behaviors MUST be accepted in project files and in browser storage, referring to their layer by its stable identity. Malformed layer behaviors reject the file (spec 002); a reference to a missing layer loads and is reported (FR-012). Files made before this feature MUST open unchanged; the file format version does not change.
- **FR-015**: Layers, their names, order and actions MUST be restored identically after reload and after saving and opening the project file.
- **FR-016**: Every layer operation MUST be possible with the keyboard alone: the tab list is one tab stop with arrow keys, Home and End inside (automatic activation); rename, move left, move right and delete act on the focused tab; Escape cancels a rename.
- **FR-017**: A loaded project with more than 32 layers MUST open and report one problem under Bindings naming the limit.
- **FR-018**: Out of scope and MUST NOT be offered: conditional layers, layer locking (ZMK main only), `&lt`/`&sl` timing and other behavior properties, custom layer-behavior instances (`toggle-mode`), encoder sensor bindings, keymap generation.

### Key Entities

- **Layer**: a named set of actions, one per key, at a position in the keymap order; the first is the base layer. Has a stable identity that survives renames and moves.
- **Layer reference**: the target layer of a layer behavior; follows the layer's identity, shown by its current position number and name; may point at a deleted layer, which is a problem.
- **Open layer**: the layer the Bindings workspace edits; interface state, not project data.

## Success Criteria

- **SC-001**: A user adds a layer, names it, binds `&mo` to it on a Base key and assigns 10 keys on the new layer in under 3 minutes, without documentation.
- **SC-002**: For every reorder of a 4-layer project, 100% of layer behaviors point at the same named layer afterwards (automated check over all moves).
- **SC-003**: After any sequence of N layer operations, N undos restore the original project exactly and N redos reapply them.
- **SC-004**: Every layer operation (add, rename, move, delete, switch) and every layer-behavior pick is completed with the keyboard alone in a walkthrough.
- **SC-005**: Every key pointing at a deleted layer appears in the problems panel within the same interaction, and the count in the Bindings badge matches.
- **SC-006**: A 32-layer project survives reload and file round trip identically.

## Assumptions

- Default name of a new layer: "Layer N" with N its position number, or the next free number if taken.
- The display name is not limited in length here. ZMK v0.3 limits every keymap `display-name` to 19 UTF-8 bytes whenever keymap settings storage is on (ZMK Studio builds; `CONFIG_ZMK_KEYMAP_LAYER_NAME_MAX_LEN`, `docs/zmk/keymap.md` §2); keymap generation (roadmap 008) must handle longer names (cap them or raise the option).
- Reordering uses move left/right commands (buttons and keyboard); dragging tabs is optional and not required by this spec.
- The open layer position is remembered per browser like the active workspace (interface preference), so it survives reload.
- Self-references and references to Base are allowed (Edge Cases); ZMK documents no restriction.
- Depends on specs 004–006 (bindings, behaviors, Action panel slots and drafts). Generating the keymap from layers is roadmap 008.
