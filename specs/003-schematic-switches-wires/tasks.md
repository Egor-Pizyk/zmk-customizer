---

description: "Task list for Schematic keys and wires"
---

# Tasks: Schematic keys and wires

**Input**: `specs/003-schematic-switches-wires/` — plan.md, spec.md, research.md (R1–R15), data-model.md, contracts/ (project-schema, ui, validation-issues), quickstart.md

**Prerequisites**: roadmap 002 project-foundation merged (R1). `ProjectProvider`/`useProject` (`project`, `issues`, `commit`), `validateProject`, `src/storage/project-schema.ts`, migration chain and autosave come from it.

**Tests**: required. AGENTS §8 — domain and storage tests first, watch them fail, then implement (use the `domain-test-writer` agent). UI tests only for the wire draft and parts-list edits.

**Lint limits to respect in every task**: `max-lines-per-function` 40, `import/max-dependencies` 10, jsx-a11y (incl. `prefer-tag-over-role`), no `style` prop, no arbitrary Tailwind values, no `as`/`!`. Split files rather than disable rules.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an unfinished task)
- **[Story]**: US1–US5 from spec.md

---

## Phase 1: Setup

- [X] T001 Check that 002 is merged (`src/storage/project-schema.ts`, `src/ui/project-context.tsx`, `validateProject` exist). If not, stop. Record 002's actual `schemaVersion` and `Project` shape in plan.md → Technical Context; if it is not `1`, shift the version numbers in data-model.md, contracts/project-schema.md and T006/T007 to match
- [X] T002 Update `docs/roadmap.md`: add feature "003 — schematic-switches-wires" after 002 (goal, scope summary, depends on 002), renumber the later entries 003→004 … 017→018 in the overview table and headings, and note that 007 (layout editor) extends the same `Key` type and 008 (matrix-wiring-editor) derives kscan from the schematic nets. In the same commit add glossary rows to `docs/guidelines/code-quality/naming/variables.md`: `keyPin` (`KeyPin`, contact 1 | 2 of a key's switch; banned: `leg`, `contact`), `boardPin` (placeholder 0–31 shown `P<n>` until controller boards replace it with `PinRef`; banned: `gpio`), `wire`, `junction` (wire end on another wire), `crossing` (two wires crossing at a point; insulated or connected), `net` (derived set of joined key pins, wires and board pins; banned: `signal`, `trace`)
- [X] T003 Lint spike: render one `<g role="option" tabIndex={0} aria-selected aria-label>` inside an `<svg role="listbox">` and one `<g role="button" tabIndex={-1} aria-pressed>` in `src/ui/schematic/schematic-workspace.tsx`, then run `npm run lint`. If jsx-a11y (`prefer-tag-over-role` or others) rejects them, choose the fallback from the 001 precedent (canvas stays `role="application"`; keys are `<g aria-label>` focus targets driven by the global `keydown` in `app.tsx`; crossing and wire targets are `aria-hidden` pointer-only, with the parts list as the keyboard path). Update contracts/ui.md with the decision, then revert the spike

---

## Phase 2: Foundational (blocks all stories)

- [X] T004 [P] Add types to `src/domain/types.ts`, all fields `readonly`, verbatim from data-model.md:
  - `Key { id; xU; yU }`, with id `'k<n>'`;
  - `KeyPin = 1 | 2`;
  - `WirePoint { xU; yU }`;
  - `WireEnd` union `key-pin { keyId; pin }` | `junction { wireId; at }` | `free { at; boardPin? }`;
  - `Wire { id; start; end; bends }`, with id `'w<n>'`;
  - `CrossingRef { wireIds: readonly [string, string] /* sorted ascending */; ordinal: number }`.
  Add `keys`, `wires` and `insulatedCrossings` to `Project`, and `schemaVersion: 2`
- [X] T005 [P] Test first, then implement `src/domain/create-entity-id.ts` + `.test.ts`: `createEntityId({ prefix: 'k' | 'w', existingIds })` returns `prefix + (highest existing number + 1)`, or `prefix1` when there are none. Pure, with no `Math.random` (R8)
- [X] T006 [P] Test first, then implement `src/storage/migrate-v1-to-v2.ts` + `.test.ts`: `{ ...v1, schemaVersion: 2, keys: [], wires: [], insulatedCrossings: [] }`. Wire it into the 002 migration chain
- [X] T007 Test first (in `src/storage/parse-project-file.test.ts`), then extend `src/storage/project-schema.ts` with the v2 fields and integrity refinements from contracts/project-schema.md. Each rule gets one failing-input test asserting the zod issue path:
  - `id` is unique within `keys` and within `wires`, with pattern `k<digits>` / `w<digits>`;
  - `key-pin.keyId` exists and `pin` ∈ {1, 2};
  - `junction.wireId` exists and ≠ own wire id;
  - `boardPin` is an integer 0–31, only on `free` ends;
  - each wire has ≥ 1 `key-pin` end, and its ends are not the same pin;
  - `insulatedCrossings[].wireIds` exist and are sorted, and `ordinal` is an integer ≥ 0.
  Keep `satisfies z.ZodType<Project>`
- [X] T008 [P] Implement `src/domain/board-pin.ts`: `BOARD_PIN_COUNT = 32` and `formatBoardPin(boardPin) → 'P<n>'`. Test in `board-pin.test.ts`. No GND or power (clarification 3)
- [X] T009 Add a `content` slot to `src/ui/canvas/work-surface.tsx` (R3).
  - Render `content` in `<g transform={`translate(${panXPx} ${panYPx}) scale(${PX_PER_U * zoom})`}>` above `GridPattern`.
  - Add props `onContentPointerDown`, `onContentPointerMove` and `onContentPointerUp`, each called with `(worldPoint, event)` for the primary button only; middle-button pan and the wheel stay unchanged.
  - Expose the current scale to the content (a prop value) so it can size screen-fixed markers.
  - Split into a helper file if `max-lines-per-function` is hit.
- [X] T010 Make `src/ui/schematic/tools.ts` `select | add-key | wire`, all `isAvailable: true`, with labels "Select", "Key" and "Wire". Redraw `components/icons/add-key-icon.tsx` as an inline MX switch top view (square plus cross), `aria-hidden`, `currentColor`. Make `src/ui/schematic/tool-window.tsx` controlled (`activeToolId`, `onToolChange` props); `src/ui/schematic/schematic-workspace.tsx` owns `activeToolId` and `selection` (`{ kind: 'key'; keyId } | { kind: 'wire'; wireId } | { kind: 'wire-end'; wireId; end: 'start' | 'end' } | undefined`) in `useState`
- [X] T011 [P] Add canvas shortcuts `select-tool` (`v`), `add-key-tool` (`k`), `wire-tool` (`w`), `place-key` (Enter), `delete-selection` (Delete, Backspace), `cancel` (Escape), `focus-first-key` / `focus-last-key` (Home / End) and `nudge-*` (Shift+arrows while a key is focused) to `src/ui/shortcuts.ts`, with tests in `shortcuts.test.ts`. Add the pointer gestures from contracts/ui.md to `POINTER_GESTURES`. Route them in `src/ui/shortcut-actions.ts` to callbacks the Schematic workspace registers. Update `specs/001-app-shell-ui/contracts/shortcuts.md` with the new rows
- [X] T012 Extend the problem-button handler in `src/ui/shell/issues-panel.tsx` that 002 built (002 T057: buttons focusing `[data-issue-path]`); do not recreate it (R14, FR-025). Before the existing focus call:
  - if the target is not rendered, first set the active workspace to `issue.workspaceId` and `isPartsListOpen: true` (new interface preference in `src/storage/preferences.ts` + schema test: optional boolean, default `true`; stored v1 preferences without it load unchanged through the existing "invalid or missing field → default" rule, so no version bump or migration; add the row to `specs/001-app-shell-ui/contracts/preferences-storage.md` and its data-model), then focus on the next frame (`requestAnimationFrame`);
  - then 002's existing focus of `document.querySelector('[data-issue-path="<issue.path joined by .>"]')` runs unchanged.
  No callback crosses from the shell into the workspace: the parts-list row controls set `selection` in their `onFocus` handler (`SchematicWorkspace` passes `onSelectionChange` to `PartsList`; `keys.N…` → key, `wires.W` → wire, `wires.W.start|end…` → wire-end)
- [X] T013 Create `src/ui/schematic/parts-list.tsx`: a `<section aria-labelledby>` with `<h2>` "Parts" inside a `<details>` whose `open` follows the `isPartsListOpen` preference (toggle writes it back), rendered below the surface by `schematic-workspace.tsx`, own `overflow-auto` container with a max height. It holds three empty table slots (Keys, Wires, Crossings) that the story phases fill. Build `components/table.tsx`, `components/number-field.tsx` and `components/select.tsx` per admin-ui.md only if 002 has not built them

**Checkpoint**: the app loads a v1 project as v2, and three working tools are selectable with nothing to draw yet. `make check` passes.

---

## Phase 3: User Story 1 — Place keys (P1) 🎯 MVP

**Goal**: place, select, move and delete keys drawn as MX switches, numbered 0..n-1.
**Independent test**: quickstart manual 1.

### Tests first

- [X] T014 [P] [US1] `src/domain/get-key-pin-position.test.ts`: key at (2, 1) → pin 1 = (2.3, 1.3667), pin 2 = (2.6333, 1.2333), within 1e-4 (the center is +0.5 on each axis; MX offsets pin 1 (−3.81 mm, −2.54 mm) and pin 2 (+2.54 mm, −5.08 mm) at 1u = 19.05 mm, R2)
- [X] T015 [P] [US1] `src/domain/is-key-position-free.test.ts`: cells are 1u × 1u from the top-left; overlapping → false, touching edges → true; takes `{ position, ignoreKeyId? }` so a move ignores the key itself
- [X] T016 [P] [US1] `src/domain/find-free-key-position.test.ts`: empty → (0, 0); otherwise the first free cell to the right of the last key in `project.keys`, same `yU`
- [X] T017 [P] [US1] `src/domain/add-key.test.ts`, `move-key.test.ts`, `remove-key.test.ts` (keys only; wire cascade added in T032): add appends with id from `createEntityId`; move sets `xU`/`yU`; remove deletes, and the remaining keys keep their order, so indices stay contiguous. Plus `src/domain/validate-schematic.test.ts` with `key-overlap` (path `['keys', N]`, both keys of a pair)

### Implementation

- [X] T018 [P] [US1] Implement `src/domain/get-key-pin-position.ts`, with the offsets as a named constant and a one-line why-comment citing the Cherry MX footprint
- [X] T019 [P] [US1] Implement `src/domain/is-key-position-free.ts` and `src/domain/find-free-key-position.ts`
- [X] T020 [US1] Implement `src/domain/add-key.ts` (`{ position }`), `move-key.ts` (`{ keyId, position }`) and `remove-key.ts` (`{ keyId }`). Create `src/domain/validate-schematic.ts` with `key-overlap` (via `isKeyPositionFree`) and concatenate its result in 002's `validateProject`. Add the new codes to `ValidationCode` in `src/domain/types.ts` and map each to `'schematic'` in `WORKSPACE_BY_ISSUE_CODE` (`src/ui/shell/workspace-issue.ts`). The domain gets no `workspaceId` (002 research R4)
- [X] T021 [P] [US1] `src/ui/schematic/format-schematic-labels.ts` + test: `formatKeyLabel` → "Key 3 at 2, 1. Pin 1: wire 4. Pin 2: not connected" (pin text from a `{ wireIndices }` argument, so US1 shows "not connected")
- [X] T022 [US1] `src/ui/schematic/key-shape.tsx`: MX top view in u.
  - Housing rect 1u with inset `rx`; cross stem as two thin rects in the center; number text `aria-hidden`.
  - Pins: connected = filled circle; unconnected = hollow ring plus a small warning glyph (shape, not only color).
  - Tokens only: `fill-surface-raised`, `stroke-border-strong`, `group-aria-selected:stroke-accent`, `group-focus-visible:stroke-focus`, `stroke-danger` for unconnected pins; `vector-effect="non-scaling-stroke"`.
  - Pins carry `data-key-id` and `data-pin` for hit testing.
  - A key with `key-shorted` or `key-overlap` gets `data-conflict` → `data-conflict:stroke-danger` housing plus a warning glyph in its top-right corner; the issue text is appended to its accessible name (`formatKeyLabel` takes the key's issues).
- [X] T023 [US1] `src/ui/schematic/schematic-content.tsx`: renders a `KeyShape` per key, with `key={key.id}` and roles/tabindex per the T003 decision; passed as `content` to `WorkSurface` from `schematic-workspace.tsx`
- [X] T024 [US1] Pointer handling in `src/ui/schematic/use-schematic-pointer.ts`:
  - **Key tool**: a click places at `snapToGrid(world − 0.5)` when snap is on, only if `isKeyPositionFree`, → `commit(addKey)`.
  - **Select tool**: click on a key selects it; dragging keeps a local preview offset and commits one `moveKey` on pointer-up, snapped and only if free; click on empty clears the selection.
- [X] T025 [US1] Keyboard handling in `schematic-workspace.tsx`, via the T011 routes and the T003 decision:
  - Enter with the Key tool → `addKey(findFreeKeyPosition)`;
  - arrows → focus the nearest key in that direction;
  - Home / End → focus the first / last key by key index;
  - Shift+arrows → `moveKey` by `gridSizeU`, only if free;
  - Delete/Backspace → `removeKey`, then focus the next key by index (or the canvas);
  - Escape → clear the selection.
- [X] T026 [US1] Keys table in `src/ui/schematic/parts-keys-table.tsx`:
  - columns: selection checkbox (roving, admin-ui.md "Tables"), `<th scope="row">Key N</th>`, X (u) and Y (u) `NumberField`s committing `moveKey` on blur/Enter (no free-cell check here; an overlap shows as `key-overlap` under the field), Pin 1 and Pin 2 cells with `data-issue-path="keys.N.pins.P"`, Delete button;
  - "Add key" button → `addKey(findFreeKeyPosition)`;
  - selection shared with the canvas via `data-selected`.
- [ ] T027 [US1] Manual quickstart 1 and keyboard-only 6 (key parts). Check that each gesture is one undo step (002 undo)

**Checkpoint**: US1 works alone; keys persist through 002 autosave.

---

## Phase 4: User Story 2 — Connect key pins with wires (P1)

**Goal**: orthogonal wires between pins, junctions and free ends; the unconnected-pin and shorted-key checks.
**Independent test**: quickstart manual 2.

### Tests first

- [X] T028 [P] [US2] `src/domain/get-wire-path.test.ts`:
  - consecutive points not in line get one horizontal-first corner;
  - every segment is horizontal or vertical;
  - a `key-pin` end follows `moveKey`;
  - a `junction` end resolves to the nearest point on the target wire's path (R4, R5).
- [X] T029 [P] [US2] `src/domain/can-add-wire.test.ts`: false when neither end is `key-pin` (FR-009), false when both ends are the same pin, true otherwise
- [X] T030 [P] [US2] `src/domain/find-free-end-position.test.ts`: `findFreeEndPosition(project, { start })` → 1u below the start pin, snapped to 0.25u; if that point already holds a free end or a pin, step another 1u down until free
- [X] T031 [P] [US2] `src/domain/add-wire.test.ts`, `remove-wire.test.ts`, `set-wire-bends.test.ts`: `removeWire` turns junction ends onto the removed wire into `free` at their drawn point, then removes wires left with no `key-pin` end, repeating until stable
- [X] T032 [P] [US2] Extend `src/domain/remove-key.test.ts`: the key's pin ends become `free` at the pin's last position; wires left with no `key-pin` end are removed (FR-012), with the same cascade as `removeWire`
- [X] T033 [P] [US2] `src/domain/get-nets.test.ts` (without crossings, added in US3):
  - a wire joins its key-pin ends;
  - a junction joins two wires;
  - a collinear overlap between two wires joins them;
  - a wire passing over a key pin without ending there does not join that pin;
  - nets and their member lists are sorted deterministically.
- [X] T034 [P] [US2] `src/domain/validate-schematic.test.ts` (extend) for `key-pin-unconnected` (path `['keys', N, 'pins', P]`) and `key-shorted` (path `['keys', N]`); issue order per contracts/validation-issues.md

### Implementation

- [X] T035 [P] [US2] Implement `src/domain/get-wire-path.ts`, `src/domain/can-add-wire.ts` and `src/domain/find-free-end-position.ts`
- [X] T036 [US2] Implement `src/domain/add-wire.ts` (no insulation prune) (`{ start, end, bends }`), `remove-wire.ts` (`{ wireId }`), `set-wire-bends.ts` (`{ wireId, bends }`) and the cascade in `remove-key.ts`. Share the cascade through one domain file, `src/domain/remove-orphan-wires.ts`
- [X] T037 [US2] Implement `src/domain/get-nets.ts` (union-find over `pin:<keyId>:<pin>` and `wire:<id>`, R7)
- [X] T038 [US2] Add `key-pin-unconnected` and `key-shorted` to `src/domain/validate-schematic.ts`. Messages per contracts/validation-issues.md
- [X] T039 [P] [US2] `src/ui/schematic/use-wire-draft.ts` + `.test.ts` (reducer-style pure transitions tested without DOM):
  - idle → a click on a pin, a wire or an empty spot starts the draft (an empty start becomes a `free` end);
  - each click on empty adds a grid-snapped bend;
  - a click on a pin or wire finishes the draft;
  - a double-click on empty finishes with a free end;
  - Escape cancels;
  - finishing with `canAddWire` false returns a hint: "A wire must start or end on a key pin";
  - test: empty start → pin end creates a wire with `start.kind === 'free'`.
  Pins and wires are hit within 12 screen px (R9).
- [X] T040 [US2] `src/ui/schematic/wire-shape.tsx`: `<path>` from `getWirePath` with `vector-effect="non-scaling-stroke"`, `stroke-text` token, selected → `stroke-accent` + thicker. Junction dots. Bend handles when the wire is selected (drag → one `setWireBends` on pointer-up). Dashed draft path `aria-hidden`
- [X] T041 [US2] Wire tool in `use-schematic-pointer.ts` → `use-wire-draft`. Finish → `commit(addWire)`; show the hint in the shell `StatusMessage`. Select tool: click on a wire selects it; Delete → `removeWire`
- [X] T042 [US2] Extend `formatKeyLabel` with real wire numbers, and add `formatWireLabel` ("Wire 4 from key 1 pin 1 to key 2 pin 1" / "… to a free end" / "… to wire 3"), with tests in `format-schematic-labels.test.ts`. The pin state in `KeyShape` now comes from the wire ends
- [X] T043 [US2] Wires table in `src/ui/schematic/parts-wires-table.tsx`:
  - columns: `Wire N`, From and To cells (`data-issue-path="wires.W.start|end"`), Bends (X/Y `NumberField`s per bend, "Add bend", remove, each → `setWireBends`), Delete;
  - "Add wire" `<form onSubmit>`: From = select of key pins; To = select of key pins, "Wire N" (junction at the point of that wire's path nearest to the From pin) or "Free end" (placed by `findFreeEndPosition`); the submit button is disabled with an explanation when `canAddWire` is false.
- [ ] T044 [US2] Manual quickstart 2 and the keyboard-only 6 wire parts; check that the problems for unconnected pins appear and focus their cells

---

## Phase 5: User Story 3 — Insulate wire crossings (P1)

**Goal**: crossings are derived and connected by default, toggled to insulated and drawn as a bridge.
**Independent test**: quickstart manual 3.

### Tests first

- [X] T045 [P] [US3] `src/domain/find-crossings.test.ts`:
  - a plus-shaped cross → 1 crossing with the sorted pair and ordinal 0;
  - a T-junction → 0;
  - a collinear overlap → 0;
  - a wire crossing itself → 0;
  - two crossings of the same pair → ordinals 0 and 1 along the first wire;
  - three wires through one point → 3 crossings (one per pair), each with its own ref;
  - `isInsulated` reflects `insulatedCrossings`.
- [X] T046 [P] [US3] `src/domain/toggle-crossing-insulation.test.ts` and `prune-insulated-crossings.test.ts`: toggle adds and removes the ref; prune drops refs whose crossing no longer exists (FR-017); `moveKey`, `setWireBends`, `removeWire` and `removeKey` call it (one test each)
- [X] T047 [P] [US3] Extend `get-nets.test.ts` and `validate-schematic.test.ts`: a connected crossing joins two wires (and can make `key-shorted`); an insulated one does not

### Implementation

- [X] T048 [US3] Implement `src/domain/find-crossings.ts` (pairwise horizontal × vertical segments, with a `ponytail:` comment naming the O(n²) ceiling and the sweep-line upgrade, R12), `toggle-crossing-insulation.ts` (`{ ref }`) and `prune-insulated-crossings.ts`. Call prune at the end of the four geometry operations
- [X] T049 [US3] Add connected crossings to the unions in `get-nets.ts`
- [X] T050 [US3] `src/ui/schematic/crossing-button.tsx`, shown at every crossing with any tool:
  - screen-fixed size with a ≥ 24 px hit area (radius divided by the T009 scale);
  - hidden below 50% zoom (named constant `CROSSING_BUTTON_MIN_ZOOM`); the crossings table stays the path there;
  - buttons at the same point are laid out in a row, offset by the button diameter in screen px, in `wireIds` order;
  - connected = small ring with a gap-symbol glyph; insulated = filled insulation glyph, plus `wire-shape.tsx` draws a bridge arc on the wire `wireIds[1]` at that point;
  - `aria-pressed` and name "Crossing of wire 2 and wire 5, connected|insulated" (`formatCrossingLabel` in `format-schematic-labels.ts` + test);
  - click → `commit(toggleCrossingInsulation)`; role/tabindex per T003.
- [X] T051 [US3] Crossings table in `src/ui/schematic/parts-crossings-table.tsx`: "Wire A × wire B", position (u), and a `Switch` "Insulated" → `toggleCrossingInsulation`
- [ ] T052 [US3] Manual quickstart 3 and the dark/light check (quickstart 8) for crossing glyphs

---

## Phase 6: User Story 5 — The schematic is part of the project (P1)

**Goal**: everything persists, round-trips and undoes (via 002).
**Independent test**: quickstart manual 5.

- [X] T053 [P] [US5] Round-trip test in `src/storage/parse-project-file.test.ts` (the file 002 created; 002 tests the schema through the parser). Also check that 002's v1 fixture `tests/fixtures/project/v1.json` still loads and keeps `shieldName: 'corne'` after `migrateV1ToV2`. Main case: a fixture v2 project with keys, wires (all three end kinds, bends, a board pin) and an insulated crossing → serialize → parse is deep-equal. Fixture at `tests/fixtures/schematic/small.json`
- [X] T054 [P] [US5] Migration test: the v1 fixture from 002 loads as v2 with empty arrays (extends T006 through the full parse path)
- [ ] T055 [US5] Manual: reload, then Save → Open → identical; undo and redo each gesture from US1–US3 exactly once

---

## Phase 7: User Story 4 — Attach free wire ends to board pins (P2)

**Goal**: free ends get P0–P31, with a minimal marker, the used-pin hint and conflict checks.
**Independent test**: quickstart manual 4.

### Tests first

- [X] T056 [P] [US4] `src/domain/set-wire-end-board-pin.test.ts`: `{ wireId, end: 'start' | 'end', boardPin: number | undefined }`; sets it on a `free` end; `undefined` omits the field; a non-free end is returned unchanged
- [X] T057 [P] [US4] Extend `validate-schematic.test.ts`:
  - `wire-end-unconnected`, path `['wires', W, 'start' | 'end']`;
  - `board-pin-conflict`, path `['wires', W, 'start' | 'end', 'boardPin']`, one per end, only when the ends are on different nets; the same pin within one net gives no issue;
  - `board-pins-shorted`, same path, one per board-pin end of a net whose `getNets(...).boardPins` has ≥ 2 distinct values.

### Implementation

- [X] T058 [US4] Implement `src/domain/set-wire-end-board-pin.ts`. Add `wire-end-unconnected`, `board-pin-conflict` and `board-pins-shorted` to `validate-schematic.ts`, using `getNets` for conflicts and shorts and `formatBoardPin` in the messages
- [X] T059 [US4] Board pin marker in `wire-shape.tsx`: a small screen-fixed square tab with the `P3` text at the free end, `aria-hidden`; the wire's accessible name includes "to board pin P3". An unassigned free end shows a hollow end cap plus a warning glyph. A free end with `board-pin-conflict` or `board-pins-shorted` gets `data-conflict` (danger stroke plus a warning glyph on the marker), and the wire's accessible name ends with the conflict ("conflict: P3 also used by wire 8"). A click on a free end (Select tool) → `selection = wire-end` and focuses the matching Board pin select in the wires table
- [X] T060 [US4] Board pin column in `parts-wires-table.tsx`:
  - a `Select` for each free end, with options "Not connected" and P0–P31;
  - pins used elsewhere are suffixed "(used by wire 8)";
  - `data-issue-path="wires.W.start|end.boardPin"`;
  - on change → `commit(setWireEndBoardPin)`.
- [ ] T061 [US4] Manual quickstart 4, and the keyboard-only board-pin part of quickstart 6

---

## Phase 8: Polish & Cross-Cutting

- [X] T062 [P] Performance fixture `tests/fixtures/schematic/large.json`: 100 keys and 300 wires, with a test that it parses. Profile in the browser (quickstart 7): dragging a key and drawing a wire across the fixture (draft preview on every pointer move). Add `useMemo` for `findCrossings`/`getNets` in `schematic-workspace.tsx` only if a frame exceeds 16 ms, with a comment naming the measurement
- [X] T063 [P] Update `specs/001-app-shell-ui/contracts/ui-regions.md`: the tool window lists three available tools; the canvas role follows the T003 decision; add a Parts section row
- [ ] T064 Accessibility manual pass (accessibility.md → Testing, steps 1–10), recorded here under "Implementation notes", including the WCAG 2.5.8 equivalent-exception note for pins (R10)
- [X] T065 Run the `spec-reviewer` agent on `specs/003-schematic-switches-wires/`, fix its findings, and run `make check`
- [X] T066 Write "Implementation notes" at the end of this file: deviations, file splits and T003 outcome

---

## Dependencies & Execution Order

- Setup (T001–T003) → Foundational (T004–T013) → stories.
- Story order: US1 → US2 (needs keys and pins) → US3 (needs wires) → US5 (needs all data) → US4 (needs free ends from US2; P2).
- US4 depends only on US2, so it can run in parallel with US3/US5 once US2 is done.
- In every story the tests come first ([P] among themselves), then domain, then UI; the parts-list tables come last in each story.

## Parallel examples

- Foundational: T004, T005, T006, T008 and T011 together; T007 after T004; T009, T010 and T012 are UI and independent of each other.
- US1: T014–T017 together; then T018 and T019 together; T021 alongside T022.
- US2: T028–T034 together; T035 and T039 together.
- US3: T045–T047 together.
- US4: T056 and T057 together.

## Implementation Strategy

- **MVP**: Phases 1–3 (US1), placing and moving keys. Then US2 and US3 make the schematic meaningful (rows and columns with insulated crossings), and US5 verifies persistence. US4 last.
- Each checkpoint: `make check` passes and the story's quickstart step passes.
- Commit per task group, with Conventional Commits (`feat(domain): …`, `feat(schematic): …`, `test: …`, `docs(roadmap): …`).

---

## Implementation notes (2026-09-27)

Deviations from the task text, each smaller or forced by lint/type rules.

- **T001**: 002 is on branch `002-project-foundation` (not merged to `main` yet); this branch starts from it. 002 shipped `schemaVersion: 1`, so the version numbers here hold.
- **T002**: only `docs/roadmap.md` was renumbered (+1 from old 003). Specs 001 and 002 keep the old numbers; the new roadmap 003 entry says so. The 003 spec docs were updated to the new numbers (controller boards 006, layout editor 007, matrix wiring 008). Glossary rows added to `naming/variables.md`.
- **T003 lint spike**: `listbox`/`option`/`button` roles on SVG fail `jsx-a11y/prefer-tag-over-role`. Kept: canvas `role="application"` (001); keys are `<g role="graphics-symbol" tabIndex>` with roving tabindex and `onKeyDown` (passes lint); crossing buttons are native `<button>`s in `<foreignObject>`, drawn in an unscaled screen layer (`SurfaceContent.renderScreen`) so their CSS sizes are not multiplied by the zoom transform. Recorded in `contracts/ui.md`.
- **T007**: schema tests live in `src/storage/project-schema.test.ts`; the round-trip and v1 migration tests (T053, T054) are in `parse-project-file.test.ts`.
- **T009**: `SurfaceContent` = `{ render, renderScreen?, onPointerDown/Move/Up, label? }`; no double-click prop (a JSX `onDoubleClick` on the canvas fails jsx-a11y). The wire draft detects a double-click itself (two clicks on one point within 400 ms). `SurfaceSvg` moved to `canvas/surface-svg.tsx` (max-lines / max-dependencies).
- **T011**: a new shortcut scope `key` (arrows, Shift+arrows, Home/End while a key has focus), matched by `matchKeyShortcut` in the key's `onKeyDown`, which stops propagation so canvas pan does not also run. Schematic canvas ids are run by a second `globalThis` listener (`use-schematic-shortcuts.ts`), listed in react.md's effects table; the app listener has no action for them.
- **T012**: the issue path attribute is 002's `data-issue-path`, matched with `~=` so one control can own several paths (a board-pin select owns `wires.W.end` and `wires.W.end.boardPin`).
- **T013**: only `components/number-input.tsx` was needed; selects are native `<select>` with `INPUT_CLASSES`. The Keys table has no selection-checkbox column (selection is single): focusing any control of a row selects that key (row `onFocus`), which is how problem activation selects too. `contracts/ui.md` amended.
- **T024/T039/T041**: the draft is a pure reducer `reduce-wire-draft.ts` (tested) held in `use-schematic-pointer.ts`, not a `use-wire-draft.ts` hook. Pointer code is split into `pointer-create.ts`, `pointer-select.ts`, `pointer-preview.ts`, `read-canvas-hit.ts`, `to-draft-target.ts`, `snap-point.ts` (lint limits). Hit areas are invisible 12 px shapes (`pointer-events`), so DOM hit testing does the tolerance.
- **T025**: arrow-key focus uses `find-nearest-key.ts` (tested); the workspace hook is split into `use-schematic-workspace.ts`, `use-schematic-keyboard.ts`, `use-key-keyboard.ts`, `schematic-shortcut-handlers.ts`.
- **Commit announcements**: 002's `commit` gained an optional `announcementText` ("Deleted key 3", "Added wire 2"), spoken with the issue count, instead of a second `announce` call that would replace it.
- **T056/T058**: `setWireEndBoardPin` takes `side` (the `WireEndSide` type), not `end`, to avoid confusion with `wire.end`.
- **Crossings**: only interior points of both wires cross. A wire end resting on another wire (T-touch) is not a crossing and does not connect; a join is a junction end. A pair of wires that overlap collinearly anywhere is joined and gets no crossing buttons.
- **Performance**: `large.json` (100 keys, 300 wires) parses, derives crossings and validates in well under 100 ms in the test run; no `useMemo` added. Browser profiling (quickstart 7) not done.

### Not done by the implementing agent

- **T027, T044, T052, T055, T061, T064**: manual browser checks (pointer drawing, keyboard-only walkthrough, screen reader, themes, 200% zoom, profiler) need a real browser session; no browser automation is available here. Verified instead: `make check` (typecheck, lint, format, 302 tests) and `npm run build`.
- UI tests for parts-list edits: no DOM testing library is installed (adding one needs an ADR); the logic they would cover is in tested domain functions and `reduce-wire-draft.ts`.

### Review fixes (T065, spec-reviewer on the implementation)

- **M1** `canAddWire(project, { start, end })` also checks that key and wire references exist and returns the reason (`no-key-pin` / `same-pin` / `missing-reference`); the wire draft and the Add wire form use it, the hint names the reason, and the form falls back to its first option when a stored choice was deleted. A stale reference can no longer reach autosave.
- **M2** T-touches no longer count as crossings (see "Crossings" above); tests in `find-wire-contacts.test.ts`.
- **Minor**:
  - domain queries `findBoardPinUser` and `findKeyPinWireIndices` replace UI/validation duplicates;
  - `getNets` runs the contact pass once;
  - bends keyed by slot so an edited field keeps focus;
  - pointer cancel / lost capture drops a drag preview;
  - double-click tolerance 0.15u;
  - focus goes to the canvas when the last key is deleted, and to the next row or the Add button after a table Delete;
  - pins labelled 1 / 2;
  - selected keys get a thicker stroke;
  - `WarningIcon` replaces the text glyph;
  - the test builder moved to `tests/helpers/build-project.ts`;
  - direct tests for contacts, orphan cascade, nearest point, `roundU`, `isSameCrossing`;
  - doc drift fixed in plan, research, data-model and the UI contract (selection column, Add wire button, crossing glyph).
- **Not changed**: the UI still calls `createEntityId` to know the id `addKey`/`addWire` will assign, so it can select the new entity; it is the same domain function the operations use, not a copy of the rule.

### Bug fix after user testing (2026-09-27)

- A wire could not start or end on pin 1 (lower pin): pin 2's 12 px hit circle is drawn over pin 1's and the pins are only ~17 px apart at 100% zoom (less when zoomed out), so the DOM hit always reported pin 2. The Wire tool now picks the pin by distance (`findNearestKeyPin`, tested; regression test in `to-draft-target.test.ts`).
- A large dark/blue disc appeared where a key was deleted with the keyboard until the next click: it was Chrome's own focus ring on the next key, which receives focus after the delete (`:focus-visible`). Keys sit inside the canvas zoom transform (scale ≈ 48 at 100%), so the UA outline was scaled to ~100 px. `src/styles.css` removes the UA outline for `[data-canvas-workspace] [role='graphics-symbol']`; the focus ring is the key's own focus-colored stroke, now 3 px (`group-focus-visible:stroke-3`). Reproduced and verified in Chrome with a puppeteer script outside the repo.

### Changes requested after user testing (2026-09-28)

- **Pin under a wire connects**: `getKeyPinWires(project)` (domain, tested) lists wires ending on or running over each pin; nets, `key-pin-unconnected`, pin labels and the Keys table use it. Replaces `findKeyPinWireIndices`. Spec edge case and FR-010 updated (was: passing over does not connect).
- **Wire snaps before the click**: `getHoverPreview` (tested) derives the draft end from the same `toDraftTarget` a click uses, so the preview shows exactly where the wire will attach; an accent ring marks the pin or wire point. Hover is tracked only for the Key and Wire tools; `SurfaceContent.onPointerLeave` clears it.
- **Key preview**: the Key tool draws a dashed accent outline where the key would go, danger color when the cell is taken (FR-010a).
- Verified in Chrome with a puppeteer script outside the repo (three keys in a row, one wire from key 0 to key 2: key 1 pin 1 reports "wire 0").
