# Research: Schematic keys and wires

Decisions for `plan.md`. Each: Decision / Rationale / Alternatives.

## R1. Prerequisite: project foundation (roadmap 002)

- **Decision**: This feature is implemented only after 002 is merged. It relies on 002 for: `Project` with `schemaVersion`, `storage/` parse + migration chain, `ProjectProvider` (`project`, `issues`, `commit`, `undo`, `redo`), `validateProject`, autosave, Open/Save. This plan assumes 002 ships `Project = { schemaVersion: 1, name: string }`; this feature bumps to `schemaVersion: 2` and adds `migrateV1ToV2` (adds empty `keys`, `wires`, `insulatedCrossings`). If 002 lands with a different version number or shape, only the version numbers in `data-model.md` shift.
- **Rationale**: user decision in spec Clarifications; avoids building persistence twice.
- **Alternatives**: minimal storage inside this feature (rejected by the user).

## R2. Key pin geometry

- **Decision**: A key is drawn in a 1u × 1u cell whose top-left is the key position (same convention as ZMK `key_physical_attrs` x/y, `docs/zmk/physical-layout.md`). Pins follow the Cherry MX footprint seen from above, relative to the key center: pin 1 at (−3.81 mm, −2.54 mm), pin 2 at (+2.54 mm, −5.08 mm); in key units (1u = 19.05 mm): pin 1 (−0.2, −0.1333), pin 2 (+0.1333, −0.2667). Stored nowhere; `getKeyPinPosition(key, pin)` derives it.
- **Rationale**: FR-004/005 ask for a real switch look; MX is the common footprint; deriving keeps the project free of redundant geometry.
- **Alternatives**: pins on grid points (looks wrong, not a real switch); Kailh Choc footprint (less common, can be a later option).

## R3. Rendering world content in the work surface

- **Decision**: `WorkSurface` gets one new optional prop `content` (SVG in key units) rendered inside `<g transform="translate(pan) scale(PX_PER_U × zoom)">`, plus `onContentPointerDown/Move/Up(worldPoint, event)` callbacks for the left button. Middle-button pan and wheel stay as is. Strokes use `vector-effect="non-scaling-stroke"`; crossing buttons and pin markers are drawn at a fixed screen size by dividing their radius by the current scale.
- **Rationale**: smallest change to the 001 surface; one coordinate system (u) for domain and rendering.
- **Alternatives**: separate overlay SVG (double hit-testing); world→screen conversion per element (more code).

## R4. Wire geometry

- **Decision**: A wire stores its two ends and the user's click points (`bends`). The drawn path is derived: `getWirePath` walks start → bends → end and inserts one corner (horizontal first) wherever two consecutive points are not on one horizontal or vertical line. So every drawn segment is horizontal or vertical (clarification 2), and moving a key keeps the wire orthogonal without touching stored data.
- **Rationale**: pins are off-grid (R2); storing only clicks means `moveKey` never rewrites wires.
- **Alternatives**: store the full orthogonal polyline and patch it on every move (more code, easy to break orthogonality).

## R5. Ends and junctions

- **Decision**: `WireEnd` is a union: `key-pin` (`keyId`, `pin`), `junction` (`wireId`, `at` point), `free` (`at` point, optional `boardPin`). A junction is connected by reference; its drawn point is the nearest point on the target wire's current path, so it follows when the target moves.
- **Rationale**: connectivity must not depend on float equality of stored points.
- **Alternatives**: point-only junctions detected geometrically (fragile after moves).

## R6. Crossings and insulation identity

- **Decision**: Crossings are derived, not stored: every point shared by segments of two different wires, except junction points and collinear overlaps (those join, spec edge case). A crossing is identified by the wire pair (ids sorted) plus its ordinal along the first wire's path. Only insulated crossings are stored (`insulatedCrossings`). Operations that change geometry (`moveKey`, `setWireBends`, `removeWire`, `removeKey`) end with `pruneInsulatedCrossings`, which drops entries whose crossing no longer exists (FR-017).
- **Rationale**: default is connected (clarification 1), so only exceptions need storage; the pair plus ordinal stays stable while the user moves unrelated parts.
- **Ceiling**: if the same two wires cross several times and a move reorders those crossings, the insulation can move to a sibling crossing. Upgrade path: store the nearest bend index as well. Acceptable, since a row wire and a column wire normally cross once.
- **Alternatives**: store every crossing (needs a sync on every move); store the point (breaks as soon as anything moves).

## R7. Connections (nets)

- **Decision**: `getNets(project)` runs union-find over nodes `pin:<keyId>:<1|2>` and `wire:<id>`: each wire is joined to its key-pin ends, its junction target, every connected crossing partner and every collinear-overlap partner. Board pins are read from the free ends of each net. Derived per render; never stored.
- **Rationale**: one function feeds all checks (FR-021..024) and the later kscan derivation feature.

## R8. Ids

- **Decision**: Keys and wires get string ids `k<n>` / `w<n>`, with `n` = highest existing number + 1 (`createEntityId`). Pure and deterministic; no `Math.random`.
- **Rationale**: wires need stable references while key indices shift on delete; React list keys need stable identity (`react.md`).

## R9. Pointer interaction

- **Decision**:
  - **Key tool**: a click places a key centered on the pointer, top-left snapped to the grid when snapping is on; nothing is placed if the 1u cell overlaps an existing key (`isKeyPositionFree`).
  - **Wire tool**: click to start, click again for each bend, click a pin or a wire to finish, double-click an empty spot to finish with a free end, Escape to cancel. The start and end points snap to a pin or wire within 12 screen px, and bends snap to the grid. The draft lives in local state, and the finished wire is one `commit(addWire)`.
  - **Select tool**: click selects a key, a wire or a free end. Dragging a key previews locally and commits one `moveKey` on pointer-up. Selected wires show bend handles you can drag. Delete/Backspace removes the selection.
  - **Crossing buttons**: work with any tool.
- **Rationale**: one gesture is one commit (`react.md`). Click-click beats drag for multi-bend wires.

## R10. Accessibility

- **Decision**:
  - **Canvas** (after the T003 lint spike: `role="application"` with keys as `role="graphics-symbol"` focus stops; `listbox`/`option` fail lint): keys with roving tabindex ( arrows between keys, Shift+arrows nudge, Delete, Enter with the Key tool places a key at `findFreeKeyPosition`, i.e. to the right of the last key).
  - **Parts list**: the complete non-canvas alternative (FR-029, ADR 0008) is a `PartsList` below the surface. It has tables for keys (x/y fields, what each pin connects to, delete), wires (from/to, bend fields, board-pin `Select` for free ends, delete) and crossings (a `Switch` "Insulated" per crossing), plus "Add key" and "Add wire" forms.
  - **Other canvas elements**: wires, crossing buttons and free ends are pointer targets with `tabIndex={-1}` and accessible names. Their keyboard path is the parts list.
  - **Small targets**: pins are closer together than 24 px at 100% zoom. They rely on the WCAG 2.5.8 "equivalent" exception (the parts list) plus the 12 px snap radius.
- **Rationale**: a single canvas composite with keys, wires and crossings would need a custom 2D keyboard model. The table is already the project's accessibility contract.
- **Alternatives**: canvas keyboard cursor for drawing wires (large, low value next to the table).

## R11. Board pins

- **Decision**: The generic board is the constant `BOARD_PIN_COUNT = 32` in `domain/board-pin.ts`. `boardPin` is an integer 0–31, shown as `P<n>` by `formatBoardPin`. There is no GND or power (clarification 3). A pin shared by free ends that sit on different nets is a `board-pin-conflict`.
- **Rationale**: the placeholder is replaced by the controller-boards feature (roadmap 006). This is not ZMK data, so it lives outside `catalog/` and needs no `docsUrl`.

## R12. Performance

- **Decision**: Crossing detection is a pairwise check of horizontal against vertical segments: with 300 wires and about 3 segments each, that is roughly 400k checks per render, a few ms. During a drag the preview project is derived per pointer move.
- **Ceiling**: the pairwise check is O(n²). Upgrade path: sweep line if the profiler shows drag lag (SC-005). No `useMemo` until then (`react.md`), except where the profiler proves it.

## R13. Tools and shortcuts

- **Decision**:
  - **Tools**: `TOOLS` becomes `select`, `add-key` (the existing placeholder id; UI label "Key") and `wire`, all available.
  - **State**: the active tool moves from `ToolWindow` local state up to `SchematicWorkspace`, which also owns the selection and the wire draft.
  - **Shortcuts**: new canvas shortcuts `v` Select, `k` Key, `w` Wire, plus Enter, Delete/Backspace, Escape and Shift+arrows (nudge the selected key). Plain arrows move focus between keys when a key has focus, and pan otherwise (001 behavior). All of these are added to `SHORTCUTS`, so the help dialog lists them.
- **Rationale**: `s` is taken by snap; `k` = key.

## R14. Problems

- **Decision**: `validateSchematic(project)` returns `ValidationIssue[]` (codes in `contracts/validation-issues.md`), and 002's `validateProject` concatenates them (the domain knows no workspaces). The new codes are added to `ValidationCode` and mapped to `'schematic'` in `WORKSPACE_BY_ISSUE_CODE` in `src/ui/shell/workspace-issue.ts` (002 research R4). 002 already makes problem list items buttons that focus `[data-issue-path]` (002 R14). This feature extends that handler instead of recreating it. Activating one focuses its control in the parts list (every row control carries `data-issue-path="<path joined by .>"`); the row's `onFocus` sets the canvas selection, so the shell never calls into the workspace (no new context, `react.md`). If Schematic is not active or the parts list is collapsed, activation first sets the active workspace and the `isPartsListOpen` interface preference, then focuses on the next frame. `isPartsListOpen` is a per-browser interface preference (not project data): optional, default `true`, no preferences version bump, because missing fields already read as defaults (`specs/001-app-shell-ui/contracts/preferences-storage.md`).
- **Rationale**: FR-025. The same path convention is used by zod and by `observability.md`.

## R15. Untrusted input

- **Decision**: The storage schema (zod) checks shape and referential integrity:
  - `keyId` and `wireId` references exist;
  - `pin` is 1 or 2, and `boardPin` is an integer from 0 to 31;
  - every wire has at least one `key-pin` end, and a junction does not target the wire itself;
  - ids are unique.
  A failure is an import error with its path. Domain validation only covers states the user can create.
- **Rationale**: constitution IV. Domain operations can then assume references resolve.
