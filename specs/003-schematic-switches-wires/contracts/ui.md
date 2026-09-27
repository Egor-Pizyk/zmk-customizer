# Contract: Schematic tools, canvas and parts list

Extends `specs/001-app-shell-ui/contracts/ui-regions.md` and `shortcuts.md`.

## Tool window

`role="radiogroup"` "Tool": Select (`v`), Key (`k`), Wire (`w`). All available. Active tool owned by `SchematicWorkspace`, not persisted.

## Canvas (`<svg data-canvas-workspace="schematic">`)

| Element | Role / name | Keyboard |
|---|---|---|
| Canvas | `role="listbox"` `aria-multiselectable="false"`, name "Schematic canvas, N keys", `<desc>` points to the parts list | Tab lands on active key (or the svg when empty) |
| Key | `<g role="option" aria-selected>` roving tabindex; name "Key 3 at 2, 1. Pin 1: wire 4. Pin 2: not connected" | Arrows: nearest key; Home/End: first/last key by index; Shift+arrows: nudge one grid step; Delete/Backspace: remove; Enter (Key tool): add key at next free spot |
| Pin | part of key; unconnected pin = hollow ring + warning mark, connected = filled dot | — |
| Wire | `<path>` in `<g tabIndex={-1} aria-label="Wire 4 from key 1 pin 1 to board pin P3">` | parts list |
| Junction | filled dot, `aria-hidden` | — |
| Crossing button | `<g role="button" tabIndex={-1} aria-pressed={isInsulated}>` "Crossing of wire 2 and wire 5, connected/insulated"; connected = small ring with gap symbol, insulated = bridge arc on the wire + filled insulation symbol; ≥ 24 screen px hit area | parts list |
| Board pin marker | small square tab with label `P3`, `aria-hidden` (text in wire name) | parts list |
| Wire draft | dashed path, `aria-hidden`; Escape cancels | — |

## Parts list (`<section aria-labelledby>` `<h2>` "Parts", below the work surface, collapsible; open state = interface preference `isPartsListOpen`)

- **Keys** table: select column, `<th scope="row">Key N</th>`, X (u), Y (u) `NumberField`s, Pin 1, Pin 2 (text: "wire 4" / "Not connected" + warning icon, `data-issue-path="keys.N.pins.P"`), Delete button. "Add key" button (adds at `findFreeKeyPosition`).
- **Wires** table: `Wire N`, From, To (end text, `data-issue-path="wires.W.start|end"`), Board pin `Select` for free ends (options P0–P31, used ones suffixed "(used by wire 8)"), Bends (list of X/Y fields + "Add bend" / remove), Delete. "Add wire" form: From (select of key pins), To (select: key pin / "Wire N" = junction nearest the From pin / free end placed by `findFreeEndPosition`), `<form onSubmit>`.
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
