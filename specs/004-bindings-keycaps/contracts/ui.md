# Contract: Bindings canvas, action panel and table

Extends `specs/001-app-shell-ui/contracts/ui-regions.md` and `shortcuts.md`. Accessible names are built by `format…` functions in `ui/bindings/`, not inline JSX.

## Canvas (`<svg data-canvas-workspace="bindings">`)

| Element | Role / name | Behavior |
|---|---|---|
| Canvas | `role="application"` (as in Schematic), name "Bindings canvas, N keys"; `<desc>` points to the Bindings table | Tab lands on the svg; Tab again lands on the active keycap |
| Wire backdrop | `<g aria-hidden="true" pointer-events="none" class="opacity-40">`: wire paths (`stroke-text`), junction dots, board-pin labels | Never interactive (FR-001, FR-002) |
| Keycap | `<g role="graphics-symbol" tabIndex data-keycap-id data-issue-path="layers.0.bindings.<keyId>">` with roving tabindex; native `<title>` = full action (hover tooltip); `data-selected`, `data-conflict` (issue on this key); name "Key 12, Base layer: Space, Left Shift when held" (+ ", selected", + ", problem: …") | Click selects; Ctrl/Cmd+click toggles; Enter moves focus to the panel's first control; arrows move to the nearest key; Home/End go to the first/last key; Ctrl/Cmd+Space toggles; Escape clears the selection. No drag and no nudge |
| Keycap art | 1u cell: outer rounded rect (`fill-surface-muted`, `stroke-border-strong`), inner top surface (`fill-surface-raised`), key index `text-xs`-equivalent top left; tap legend centered; hold legend small at the bottom; all `aria-hidden` | Selected: accent stroke, thicker. Focus: `group-focus-visible:stroke-focus` |
| Marquee | the moved `canvas/marquee-layer.tsx` | Drag on empty space selects keycaps inside |
| Empty state | `EmptyState` "No keys yet. Draw keys in Schematic." + `Button` "Go to Schematic" | FR-004 |

Legends below 40% zoom are hidden (legend `<text>` not rendered); the keycap outline, selection and table stay.

## Action panel — key picker (redesign R14)

`<aside aria-labelledby>` docked right, full workspace height, `w-80`. The header is `<h2>` "Action" with a collapse `IconButton` (`aria-expanded`, preference `isBindingsPanelOpen`).

- **Nothing selected**: "Select a keycap to choose what it does."
- **Preview**: a large keycap with the tap and hold legends, the full action name (or "N keys selected, different actions"), and "Copy action" / "Paste action" (disabled with hints, FR-018).
- **Search**: `<input type="search">` "Search keys and actions". Typing replaces the tabs with results grouped by tab; Enter assigns the first result; ArrowDown moves into the results grid. With no results: "Nothing matches “…”".
- **Tabs**: the `Tabs` pattern, i.e. `role="tablist"` with `role="tab"` buttons, roving tabindex, arrows + Home/End (admin-ui.md primitive), and `role="tabpanel"`. Tabs: Basic, Nav, F keys, Media, Mods, System, More. If jsx-a11y rejects the roles, the fallback is buttons with `aria-pressed`.
- **Mini keyboard**: rows of `<button aria-pressed>` mini keycaps (legend visible, `aria-label` = full name + ", current"). The grid is one tab stop: arrows move, Enter or Space assigns. The width follows the u size (1u = `w-8`). Hover or focus fills a details line: aliases, description, `DocsLink`. System rows are labeled ("Bluetooth select", "Bluetooth disconnect", "Output").
- **Modifier chips**: a `fieldset` "Modifiers" with 8 `aria-pressed` buttons (FR-011).
- **When held**: a native `<select>` with none plus the 8 modifiers (FR-012), disabled unless the selection sends a key in normal mode.
- **Press mode**: a `RadioGroup` Normal / Sticky / Toggle (FR-012).
- **Automatic next key**: a `Switch` (preference `isAutoAdvanceEnabled`, FR-014a).
- Every pick is one `commit`, with the status "Key 12: Space".

## Bindings table (`<section aria-labelledby>` `<h2>` "Keys", below the surface, collapsible, collapsed by default; open state = preference `isBindingsTableOpen`)

| Column | Content |
|---|---|
| Select | checkbox "Select key N", roving tabindex selection column (`admin-ui.md` → Tables) |
| Key | `<th scope="row" tabIndex={-1} data-issue-path="layers.0.bindings.<keyId>">Key N</th>`; focusing it selects the key |
| Action (Base) | full action name; the problem message under it with a warning icon if there is one |
| — | `Button` "Choose action" moves focus into the panel for that key |

Selection is shared with the canvas (the same state in `BindingsWorkspace`).

## Shortcuts (added to `SHORTCUTS`, listed in the help dialog)

| id | Keys | Scope | Action |
|---|---|---|---|
| `copy-binding` | Mod+C (`code` `KeyC`) | `bindings`: target inside the Bindings canvas or table, not a text input | Copy the action of the single selected key |
| `paste-binding` | Mod+V (`code` `KeyV`) | same | Paste onto all selected keys (one undo step) |

The key shortcuts (arrows, Home/End, Ctrl/Cmd+Space, Escape) reuse the existing `scope: 'key'` entries. The Schematic-only nudge and delete entries do nothing in Bindings; their help labels say "Schematic: …".

## Standard-size amendment (2026-10-21)

Bindings gains only explicit standard-size editing through the contextual Keycap size chooser and labeled Keys-table action, superseding read-only geometry wording for this operation. No arbitrary resizing/numeric sizing, movement or nudge is added to Bindings. See [012 specification](../../012-layout-editor/spec.md) FR-017–020 and its plan/tasks; single evidence journal: standard-keycap-verification.md in 012. Center/contact positions, project compatibility and one-step Undo/Redo are preserved; overlaps use existing validation.
