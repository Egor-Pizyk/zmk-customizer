# Layout contracts

Table columns: selection, Key (0-based), X (u), Y (u), Width (u), Height (u), Rotation (°), Origin X (u), Origin Y (u), pins and actions. Each input is named Key N <property> (<unit>); defaults shown numerically. Selection checkbox named Select key N. Table and canvas share selection; roving selection rows, ArrowUp/Down, Space, Shift range selection. Editing an input may select its key unless it already belongs to a multi-selection.

Selected-layout Tools controls: batch dimensions/angle/origin and translation; collapsed Precise properties with automatic preview on Enter/blur, Apply layout, Cancel preview; Duplicate selected keys, Delete selected keys, Renumber by position. Resize/rotate remain available through numeric tools and table. Selected canvas keys show a thin screen-space frame with eight side/corner resize handles and rotation targets outside all four corners. Resize preserves the opposite edge/corner in rotated coordinates, snaps dimensions to the shared grid and clamps at 0.01u without flipping. Rotation uses the visible center; Shift snaps to 15°. Existing movement drag remains available. Each apply or pointer release is one undo step. Pointer previews are unsaved; release refuses overlaps, Escape/capture loss or changed base/selection cancels. No-motion gestures retain identity and Redo. Preview shows in Schematic only, is unsaved, blocks conflicting transient gestures until cancelled/applied, and disappears if the base project changes.

Canvas key arrows navigate visual centers; Shift+arrows nudge selected keys by shared grid size, Mod+Space toggles focused key without clearing other selection. Escape cancels draft first. Pointer drag translates entire rotated cluster including origin, snap follows first key position; collision refusal considers actual polygons. Table numeric edits may overlap and surface key issues.

Physical layout output: <&key_physical_attrs w h x y r rx ry>, each cell independently Math.round(value*100), negatives parenthesized, defaults retain old bytes. Order equals transform cells and keymap bindings. No r=0 origin elision when explicitly supplied. Deterministic, LF and trailing newline.

## Standard-size amendment (2026-10-21)

Bindings gains only explicit standard-size editing through the contextual Keycap size chooser and labeled Keys-table action, superseding read-only geometry wording for this operation. No arbitrary resizing/numeric sizing, movement or nudge is added to Bindings. See [012 specification](../spec.md) FR-017–020 and its plan/tasks; single evidence journal: standard-keycap-verification.md in 012. Center/contact positions, project compatibility and one-step Undo/Redo are preserved; overlaps use existing validation.

## Switch sizing correction (2026-10-21)

FR-021 supersedes earlier Schematic sizing requirements (FR-003/004/013/014/016/017): Schematic offers no switch resize handles or editable width/height, either in the Keys table or Precise properties. Retain selection frame, four exterior rotation targets, numeric rotation/origin, movement and history. Existing/custom project dimensions remain unchanged and loadable. Bindings keycap size chooser remains the only size-editing UI.

Acceptance: select a switch; no Resize controls or width/height inputs appear, including after opening Precise properties. Rotate from an exterior corner: visible center and dimensions stay fixed, preview remains unsaved, release commits once, Undo/Redo restore exact projects. Rotation remains keyboard-editable. Change keycap size in Bindings and return: dimensions persist with no Schematic size editor.

## Numeric rotation amendment (036 items 18–19)

036 FR-034 supersedes implicit common-origin angle editing: numeric angle alone rotates each selected key about its own visible center. Explicitly editing an Origin coordinate retains deliberate absolute-origin transforms. Pointer rotation and persisted geometry representation remain unchanged. Clipboard semantics are defined by 036 FR-033.


## Feature040 extension (implementation target)

[040](../../040-symmetric-wiring/spec.md) adds persisted wire locks and routing preferences in the next schema after the integrated base (currently v13→v14). Historical file versions remain frozen; legacy wires are unlocked, geometry and electrical meaning do not regenerate on Open. Protected direct wire/key/terminal/diode/encoder edits and mixed groups refuse atomically with a guarding-wire link; protection does not propagate through an entire net. Explicit unlock is a separate undoable lock-only command.

Regenerate and Prettify are separate read-only proposals with Apply/Cancel, current source revision checks and one Undo per changing Apply. Prettify preserves electrical relations/free ends/branch contacts/GPIO/diodes, without adding missing links. Existing matrix and bus matrix are geometry styles; new direct regeneration explicitly proposes upper-pin input/lower-pin separate GND paths, preserving legacy wiring until Apply. Pin swap and diode-side controls act globally and independently on logical states; physical diode pin follows rowPin/diodeSide with correct polarity. No-op/Cancel add no history. All current source/storage/generator authority and keyboard/table alternatives remain.
