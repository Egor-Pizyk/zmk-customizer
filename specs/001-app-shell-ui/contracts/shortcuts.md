# Contract: Keyboard shortcuts

Project shortcuts (Mod+Z, Mod+Shift+Z, Mod+S, Mod+O): `specs/002-project-foundation/contracts/shortcuts.md`.

Source of truth: `SHORTCUTS` in `src/ui/shortcuts.ts`. Both the `keydown` handler and the help dialog read it (SC-008). Rationale: research R9.

## Global (Alt+Shift, matched by `KeyboardEvent.code`)

Work anywhere except in text fields and while a modal dialog is open. Shown as "Option+Shift+…" on macOS, "Alt+Shift+…" elsewhere.

| Id | Keys | `code` | Action |
|---|---|---|---|
| `workspace-schematic` | Alt+Shift+1 | `Digit1` | Show Schematic |
| `workspace-bindings` | Alt+Shift+2 | `Digit2` | Show Bindings |
| `workspace-firmware` | Alt+Shift+3 | `Digit3` | Show Firmware |
| `workspace-export` | Alt+Shift+4 | `Digit4` | Show Export |
| `open-settings` | Alt+Shift+, | `Comma` | Open settings dialog |
| `toggle-issues-panel` | Alt+Shift+P | `KeyP` | Open or close the problems panel |
| `open-help` | Alt+Shift+/ | `Slash` | Open the shortcut help dialog |

## Canvas (single keys, matched by `KeyboardEvent.key`)

Work only while a canvas (`<svg role="application" data-canvas-workspace>`) has focus, and act on that canvas (WCAG 2.1.4).

| Id | Keys | Action |
|---|---|---|
| `toggle-snap` | `s` | Toggle snap to grid |
| `toggle-grid` | `g` | Toggle grid visibility |
| `zoom-in` | `=`, `+` | Zoom in, anchored at the canvas center |
| `zoom-out` | `-` | Zoom out, anchored at the canvas center |
| `pan-left`, `pan-right`, `pan-up`, `pan-down` | Arrow keys | Pan 1 grid step (WCAG 2.1.1: keyboard pan) |
| `pan-left-1u`, `pan-right-1u`, `pan-up-1u`, `pan-down-1u` | Shift+Arrow keys | Pan 1u |
| `open-help` | `?` | Open the shortcut help dialog |

## Matching rules

```
matchShortcut(input: { code: string; key: string; altKey: boolean; shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; isTypingTarget: boolean; isDialogOpen: boolean; focusedCanvas: CanvasWorkspaceId | undefined }): ShortcutId | undefined
```

- `undefined` (the event goes to the browser) when `isTypingTarget` or `isDialogOpen` (the dialog handles its own keys: Escape, Tab).
- Global: requires `altKey && shiftKey && !ctrlKey && !metaKey`; matched by `code`, because Option on macOS changes `event.key`.
- Canvas: requires `focusedCanvas !== undefined` and no Ctrl, Meta or Alt. Shift is allowed (`?`, `+`); arrow entries match Shift exactly (plain → grid step, Shift → 1u). Matched by `key`; letters case-insensitive (`S` with Caps Lock still toggles snap).
- The one `keydown` listener on `globalThis` (`app.tsx`) computes the input:
  - `isTypingTarget`: an `<input>` whose `type` is a text-entry type (not radio, checkbox, button, submit, reset, range, color, file, image), a `<textarea>`, a `<select>`, or a `contenteditable` element. A focused radio (the Tools window) keeps shortcuts working;
  - `isDialogOpen` = `document.querySelector('dialog[open]') !== null`;
  - `focusedCanvas` = the `data-canvas-workspace` value of `event.target.closest('[data-canvas-workspace]')`, kept only if it is a canvas workspace id.
- On a match the handler calls `preventDefault()`.
- `event.repeat` (key held down) repeats only pan and zoom (`isRepeatableShortcut`); toggles and dialog opens fire once per press.

## Schematic (spec 003)

Canvas scope, only while the Schematic canvas (or an element in it) has focus. Matched by the same `matchShortcut`; the app-wide listener has no action for them, so `schematic/use-schematic-shortcuts.ts` (a second `globalThis` `keydown` listener owned by the workspace) runs them.

| Key | Id | Action |
|---|---|---|
| `v` / `k` / `e` / `w` | `select-tool` / `add-key-tool` / `add-encoder-tool` / `wire-tool` | Select / Key / Encoder / Wire tool |
| Enter | `place-key` | Key tool: add a key at the next free spot |
| Delete, Backspace | `delete-selection` | Delete the selected key or wire |
| Escape | `cancel` | Cancel the active draft first, else clear selection and activate Select |

Key scope (`scope: 'key'`), matched by `matchKeyShortcut` in the focused key's own `onKeyDown`, which stops propagation so canvas pan does not also run:

| Key | Action |
|---|---|
| Arrows | Focus the nearest key in that direction |
| Shift+arrows | Nudge the key one grid step |
| Home / End | First / last key by key index |

## Why these combos

- Plain single keys as globals violate WCAG 2.1.4; they are canvas-scoped instead.
- Alt+digit alone switches browser tabs on Linux; Alt+letter opens menus in Firefox and on Windows; Ctrl/Cmd+`,` opens browser preferences. Alt+Shift avoids all three.
- Each global combo is verified in Chrome, Firefox and Safari on macOS (task T071). A combo the browser swallows is replaced by another `code` and recorded here.

## Pointer gestures (listed in the help dialog, not in `SHORTCUTS`)

`{primary}` is shown as "Cmd" on macOS and "Ctrl" elsewhere (`formatModifier(navigator.userAgent)`, `/mac/i`).

| Gesture | Action |
|---|---|
| {primary} + wheel | Zoom around the pointer |
| Wheel / trackpad scroll | Pan |
| Middle-button drag | Pan |
| Drag tool window title bar | Move tool window |
| Arrow keys on focused tool window title bar | Move tool window 16 px (Shift: 64 px) |
| Schematic, Key tool: click | Place a key |
| Schematic, Select tool: drag a key / a bend handle | Move the key / the bend |
| Schematic, Wire tool: click, click…, click a pin or wire | Draw a wire |
| Schematic, Wire tool: double-click | End the wire with a free end |
| Schematic: click a crossing button | Insulate or connect the crossing |
