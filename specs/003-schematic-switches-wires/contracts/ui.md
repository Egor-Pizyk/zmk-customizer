# Contract: Schematic tools, canvas and parts list

Extends `specs/001-app-shell-ui/contracts/ui-regions.md` and `shortcuts.md`.

## Tool window

`role="radiogroup"` "Tool": Select (`v`), Key (`k`), Wire (`w`). All available. Active tool owned by `SchematicWorkspace`, not persisted.

## Canvas (`<svg data-canvas-workspace="schematic">`)

| Element | Role / name | Keyboard |
|---|---|---|
| Canvas | `role="application"` (001 contract, kept: T003 lint spike showed `listbox`/`option`/`button` roles fail `jsx-a11y/prefer-tag-over-role`), name "Schematic canvas, N keys", `<desc>` points to the parts list | Tab lands on the svg; Tab again lands on the active key (last selected, else key 0) |
| Key | `<g role="graphics-symbol" tabIndex>` (WAI-ARIA Graphics role, passes lint) with roving tabindex; selection in the name ("…, selected"); name "Key 3 at 2, 1. Pin 1: wire 4. Pin 2: not connected" | Handled by `onKeyDown` on the key, which stops propagation so the global canvas shortcuts (pan) do not also fire. Arrows: nearest key; Home/End: first/last key by index; Shift+arrows: nudge one grid step; Delete/Backspace: remove; Escape: clear selection |
| Pin | part of key; unconnected pin = hollow ring + warning mark, connected = filled dot | — |
| Wire | `<path>` in `<g role="graphics-symbol" aria-label="Wire 4 from key 1 pin 1 to board pin P3">`, pointer only | parts list |
| Junction | filled dot, `aria-hidden` | — |
| Crossing button | native `<button type="button" tabIndex={-1} aria-pressed={isInsulated}>` inside `<foreignObject>` (T003) "Crossing of wire 2 and wire 5, connected/insulated"; connected = ring with a cross (the wires are joined), insulated = ring with an arc (`aria-pressed` accent) plus a bridge arc drawn on the hopping wire; ≥ 24 screen px hit area | parts list |
| Board pin marker | small square tab with label `P3`, `aria-hidden` (text in wire name) | parts list |
| Wire draft | dashed accent path up to the point a click would attach to (snapped to the pin or wire under the cursor, which gets an accent ring), `aria-hidden`; Escape cancels | — |
| Key preview (Key tool) | dashed accent 1u outline where a click would place the key; danger color when the cell is taken; `aria-hidden` | — |

## Parts list (`<section aria-labelledby>` `<h2>` "Parts", below the work surface, collapsible; open state = interface preference `isPartsListOpen`)

- **Keys** table (single selection, so no checkbox column: focusing any control of a row selects that key, which is also how problem activation selects it): `<th scope="row">Key N</th>` with the key's problem messages, X (u), Y (u) number inputs, Pin 1, Pin 2 (text: "wire 4" / "Not connected" + warning icon, `data-issue-path="keys.N.pins.P"`), Delete button. "Add key" button (adds at `findFreeKeyPosition`).
- **Wires** table: `Wire N`, From, To (end text, `data-issue-path="wires.W.start|end"`), Board pin `Select` for free ends (options P0–P31, used ones suffixed "(used by wire 8)"), Bends (list of X/Y fields + "Add bend" / remove), Delete. "Add wire" form: From (select of key pins), To (select: key pin / "Wire N" = junction nearest the From pin / free end placed by `findFreeEndPosition`) and an "Add wire" button (not a `<form>`: the shared `Button` is always `type="button"`; the disabled button's hint names the reason). After a row's Delete, focus moves to the row now at that index, else to the table's Add button.
- **Crossings** table: "Wire A × wire B", position, `Switch` "Insulated".

Every edit here = one `commit` of the same domain operation as the canvas.

## Shortcuts added (canvas scope)

| Keys | Action |
|---|---|
| `v` / `k` / `w` | Select / Key / Wire tool |
| Enter | Key tool: add key at next free spot |
| Delete, Backspace | Remove selected key or wire |
| Escape | Cancel wire draft, else clear selection |
| Home / End | Focus first / last key by key index |
| Shift+arrows | Nudge selected key one grid step (overrides 001 Shift+arrow 1u pan while a key is focused) |

Pointer gestures (help dialog): click to place key; click-click to draw wire, double-click to end free; drag key; drag bend handle; click crossing to toggle insulation.
