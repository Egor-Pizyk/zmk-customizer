# Contract: Bindings layer UI

**Date**: 2026-10-06 · Extends spec 004 `contracts/ui.md` and spec 006. Accessible names are part of the contract (browser checks query them).

## Layer bar (above the canvas, inside the canvas column)

```
┌ section, <h2 class="sr-only">Layers</h2> ─────────────────────────────────────────────────────────────────────┐
│ [0 Base · always on] [1 Nav] [2 Sym]  (+ Add layer)                                   │
│ Layer name [Nav        ]  Keymap node: nav_layer     (Move left) (Move right) (Delete layer) │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

| Element | Role / name | Behavior |
|---|---|---|
| Section | `<section aria-labelledby>` → visually hidden `<h2>` "Layers" (accessibility.md: `<h2>` per section) | |
| Tab list | `role="tablist"`, `aria-label="Open layer"` | One tab stop (roving `tabindex`); ArrowLeft/ArrowRight move to the previous/next tab, Home/End to the first/last; focus opens the layer (automatic activation; also when focused by script, e.g. problem activation of `layers.32`). |
| Tab | `role="tab"`, name `"<position> <name>"` (+ `", always on"` for position 0), `aria-selected` on the open layer, `aria-controls` → the tab panel, `data-issue-path="layers.<position>"` | Click opens the layer. |
| Tab panel | `role="tabpanel"`, `aria-labelledby` → open tab | Wraps the canvas and the Keys table. |
| Add layer | `button` "Add layer" | Adds and opens a layer (one undo step, status "Added layer Layer 3"). At 32 layers `aria-disabled` with hint "ZMK v0.3 supports at most 32 layers". |
| Layer name | text field, label "Layer name", description "Keymap node: <node name>", `data-issue-path="layers.<position>.name"`, error = first name issue of the open layer | Draft while typing; Enter or blur commits `renameLayer` (one undo step, no step when unchanged); Escape restores. |
| Move left / Move right | `button` | `moveLayer` by one (one undo step, status "Moved layer Nav to position 0"); the moved layer stays open. Unavailable at the ends, hint "Already the first layer" / "Already the last layer". |
| Delete layer | `button` "Delete layer" (`danger`) | `removeLayer` at once, status "Deleted layer Nav. Undo"; the same position opens (clamped). With one layer `aria-disabled`, hint "A keymap needs at least one layer". |

## Open layer

- `Preferences.bindingsLayerIndex`, clamped to the last layer in render. Keycaps, Keys table, Action panel, copy/paste and auto-advance read and write `layers[openIndex]`.
- Keycap and Keys-table row header `data-issue-path="layers.<openIndex>.bindings.<keyId>"`; keycap name "Key N, <layer name> layer: <full action name>"; table column header "Action (<layer name>)".
- Switching layer keeps the selection and the copied action; a change of open layer identity or position permanently clears the draft, pending modifiers and search (`usePickerState`); the open slot stays when the new layer's binding has it, else the first slot opens.
- The copied action reserves its target layer id when adding a layer, even after all project references to that deleted target have been removed; pasting still reports the missing target.
- Problems panel: an issue whose path starts `['layers', n, …]` and whose target is not rendered switches to Bindings with `bindingsLayerIndex = n`, then focuses `[data-issue-path~="<path>"]` on the next frame.

## Behavior picker and layer slot (spec 006 extension)

- Behavior groups: Send a key, **Layers** (`&mo` `&lt` `&tog` `&to` `&sl`), Special, Connection, Firmware, Your behaviors.
- Line: `&mo [layer 1 Nav]`, `&lt [layer 1 Nav] [tap SPACE]`; a missing target reads `[layer deleted layer]`; a draft's empty layer slot reads `choose…`.
- Layer slot picker: title "Which layer?", one group "Layers", one row per layer: legend = position, name = layer name, codes = position and node name, description "Layer N in keymap order" (base: "Layer 0, the base layer, always on"), docs link = the behavior's docs URL. The current layer is marked; search matches name, position and node name.
- `&lt` tap slot: title "Which key when tapped?", every keycode, modifier chips "Hold with the key".

## Keycaps

| Binding | Tag | Face legend | Hold part | Corner |
|---|---|---|---|---|
| `&mo/&tog/&to/&sl` | `&mo` … | layer name (shortened to fit), `?` when missing | — | — |
| `&lt` | `&lt` | tap legend | layer name, `?` when missing | tap code (like `&mt`) |
| `&trans` | `&trans` | `▽` on every layer (clarified Q4) | — | — |

Full names (tooltip, accessible name, Keys table, status): "Momentary layer Nav", "Toggle layer Nav", "To layer Nav", "Sticky layer Nav", "Space, layer Nav when held" (the `&mt` pattern); missing target: "Momentary layer (deleted layer)", "Space, deleted layer when held".
