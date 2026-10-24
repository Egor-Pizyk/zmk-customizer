# Contract: Preferences storage

The browser `localStorage` is the only persisted interface in this feature. Two readers depend on it: `src/storage/preferences.ts` (the full parse) and `public/theme-init.js` (reads `theme` only, before first paint).

## Key

`zmk-customizer:preferences`, exported as `PREFERENCES_STORAGE_KEY`. `theme-init.js` repeats the string; a unit test asserts both are equal.

## Value (version 1)

```json
{
  "version": 1,
  "theme": "system",
  "gridSizeU": 0.25,
  "isGridVisible": true,
  "isSnapEnabled": true,
  "areRulersVisible": true,
  "activeWorkspaceId": "schematic",
  "isIssuesPanelOpen": false,
  "isPartsListOpen": true,
  "toolWindow": { "xPx": 28, "yPx": 28, "isCollapsed": false },
  "isBindingsPanelOpen": true,
  "isBindingsTableOpen": false,
  "isAutoAdvanceEnabled": true,
  "schematicEditorWidthPx": 448,
  "viewByWorkspace": {
    "schematic": { "zoom": 1, "panXPx": 0, "panYPx": 0 },
    "bindings": { "zoom": 1, "panXPx": 0, "panYPx": 0 }
  }
}
```

Field rules: `data-model.md`. `isPartsListOpen` (added by spec 003, optional, default `true`): whether the Schematic parts list is expanded; a stored value without it reads the default, so the version stays 1. `isBindingsPanelOpen`, `isBindingsTableOpen` and `isAutoAdvanceEnabled` (added by spec 004, same rule): the docked key picker is expanded (default on), the Bindings Keys table is expanded (default off), and a pick moves the selection to the next key (default on).

## Read behavior

| Stored value | Result | Status | Written back? |
|---|---|---|---|
| absent | defaults | `missing` | no |
| valid v1 | parsed | `ok` | no |
| v1 with some invalid fields | valid fields kept, invalid → default | `ok` | no |
| invalid JSON / not an object / `version` ≠ 1 | defaults | `corrupt` | no (kept until the user changes a setting) |
| `localStorage` throws | defaults | `unavailable` | never (writes are no-ops) |

## Write behavior

- Only `changePreferences(change)` and `resetSettings()` write, and they write the whole object. `change` may be an updater `(latest) => changes`; both merge into the latest state, not a render snapshot, so a delayed gesture commit never reverts a newer change.
- `resetSettings()` resets only the settings-dialog fields (theme, grid size, grid, snap, rulers; FR-018); workspace, views, tool window and panel state are kept.
- A write failure (quota, blocked) never throws to the UI; `storageStatus` becomes `unavailable`.

## `theme-init.js`

- Runs before the module entry, blocking, from `<head>`.
- Reads the key and matches `/"theme":"(light|dark)"/` against the raw string (no `JSON.parse`, so the type-aware lint rules stay clean). On a match, sets `document.documentElement.dataset.theme`. Otherwise does nothing. The value is written by `JSON.stringify` without spaces, so the pattern matches every stored v1 value.
- Wraps everything in `try/catch` (the `catch` holds a comment, for `no-empty`) and never throws.

## Migration

A future `version: 2` adds a `v1 → v2` migration in `src/storage/`. Until then, any other version reads as `corrupt`.

Maintenance 2026-10-12: `isMinimapVisible` is removed; the preferences parser ignores that obsolete field in older values without resetting other settings.

036 FR-014–016 adds `schematicEditorWidthPx`: finite number in 320..640, default 448 when missing or invalid; version remains 1. Display limits do not overwrite the preference. Resize saves on pointer release or keyboard action; cancellation does not write. Settings reset preserves this field. Project files/history are unchanged.
