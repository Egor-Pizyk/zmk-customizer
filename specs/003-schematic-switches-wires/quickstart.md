# Quickstart: validate Schematic keys and wires

Prerequisite: roadmap 002 (project foundation) merged. Then `make install && make up` → http://localhost:5173, Schematic workspace. `make check` must pass.

Contracts: [ui](contracts/ui.md), [validation issues](contracts/validation-issues.md), [project file](contracts/project-schema.md).

## Automated

`make check` runs the domain tests, including:

- `get-key-pin-position.test.ts`: MX offsets for a key at (2, 1).
- `get-wire-path.test.ts`: every segment is horizontal or vertical, and the path follows its end when the key moves.
- `find-crossings.test.ts`: a plus-shaped cross gives 1 crossing; a T-junction gives 0; a collinear overlap gives 0.
- `get-nets.test.ts`: a connected crossing joins the two wires; an insulated one keeps them apart.
- `validate-schematic.test.ts`: one test per code and path in the issues contract.
- `remove-key.test.ts` and `remove-wire.test.ts`: the cascade rules from `data-model.md`.
- Storage tests: a v1 file migrates to v2; each rule in the project-schema contract rejects bad input with the right path.

## Manual (spec stories)

1. **Keys (US1)**: with the Key tool, click 3 spots.
   - Expect keys 0, 1, 2 drawn MX-style (housing, cross stem, two pins), snapped to the grid.
   - Clicking on an existing key adds nothing.
   - Drag key 1: it moves in one undo step.
   - Delete key 1: the others are renumbered 0, 1.
2. **Wires (US2)**: with the Wire tool, click key 0 pin 1 → click an empty spot (bend) → click key 1 pin 1.
   - Expect an orthogonal wire and both pins filled.
   - The problems panel shows the two pin-2 issues.
   - Clicking empty → empty makes no wire and shows the hint.
   - Escape cancels a draft.
3. **Crossings (US3)**: draw a horizontal wire and a vertical wire that cross.
   - Expect a crossing button, in the connected state.
   - Click it: a bridge is drawn and the button is pressed. Both wires are now separate: a key wired through both is no longer "shorted".
   - Move one wire away: the button disappears. Move it back: the crossing is connected again.
4. **Board pins (US4)**: draw from a pin and double-click empty to leave a free end.
   - Expect the `wire-end-unconnected` issue.
   - In the parts list, pick P3: a `P3` marker appears and the issue clears.
   - Assign P3 to another, unconnected free end: both ends get `board-pin-conflict`.
5. **Persistence (US5)**: reload, then Save and Open the project file. Expect an identical schematic, including insulation and pin labels.
6. **Keyboard-only**: repeat 1–4 without a mouse, using the parts list forms, canvas Enter/arrows/Shift+arrows/Delete, and the tool shortcuts `v`/`k`/`w`. Activate each problem: focus lands on the named control.
7. **Performance (SC-005)**: import a 100-key, 300-wire fixture project (`tests/fixtures/schematic/large.json`). Dragging a key and drawing a wire across the board have no visible lag; check the React profiler shows no frame over 16 ms.
8. **Themes**: in dark and light, the connected and insulated crossings and the connected and unconnected pins are distinguishable by shape.
