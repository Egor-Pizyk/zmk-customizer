# Contract: Project shortcuts (delta to spec 001)

Extends `specs/001-app-shell-ui/contracts/shortcuts.md`. Source of truth stays `SHORTCUTS` in `src/ui/shortcuts.ts`; the help dialog renders the new entries in a "Project" table.

## Project (primary modifier, matched by `KeyboardEvent.code`)

Shown as "Cmd+…" on macOS and "Ctrl+…" elsewhere.

| Id | Keys | `code` | Shift | Action | Repeats |
|---|---|---|---|---|---|
| `undo` | Mod+Z | `KeyZ` | no | Undo the last project change | yes |
| `redo` | Mod+Shift+Z | `KeyZ` | yes | Redo | yes |
| `save-project` | Mod+S | `KeyS` | no | Save the project to a file | no |
| `open-project` | Mod+O | `KeyO` | no | Open a project file (confirm first) | no |

## Matching rules (added before the existing ones)

- Match when `(ctrlKey || metaKey) && !altKey` and `code` and `shiftKey` equal the entry.
- Returns `undefined` (the browser handles the event) when `isTypingTarget` or `isDialogOpen`. Text fields keep native undo (FR-018); Mod+S inside a text field falls through to the browser.
- On a match: `preventDefault()`. This suppresses the browser's Save page and Open file actions.
- Matched by `code`, so non-Latin layouts (Cyrillic `я` on the Z key) still work.
- Undo and Redo are no-ops when their stack is empty; the shortcut is still consumed.
- Existing rule unchanged: any other Ctrl/Meta combination still returns `undefined`.

## Verification

Check each combo in Chrome, Firefox and Safari on macOS, and in Chrome on Windows or Linux (quickstart step 9). If a browser swallows a combo, replace it and record the change here.
