# Data Model: Application Shell and Workspaces

No keyboard project data in this feature. All state is UI state; persisted state is `Preferences` only.

## WorkspaceId

`'schematic' | 'bindings' | 'firmware' | 'export'` — order of the tab bar and shortcuts Alt+Shift+1–4.

| Id | Label | Kind | Tool window |
|---|---|---|---|
| `schematic` | Schematic | canvas | yes |
| `bindings` | Bindings | canvas | no |
| `firmware` | Firmware | placeholder | no |
| `export` | Export | placeholder | no |

`CanvasWorkspaceId = 'schematic' | 'bindings'`.

## Preferences (persisted, `localStorage` key `zmk-customizer:preferences`)

| Field | Type | Default | Rule |
|---|---|---|---|
| `version` | `1` | `1` | Other value → whole object replaced by defaults, status `corrupt` |
| `theme` | `'system' \| 'light' \| 'dark'` | `'system'` | |
| `gridSizeU` | number | `0.25` | `0.05 ≤ x ≤ 2`; presets 1, 0.5, 0.25, 0.125 |
| `isGridVisible` | boolean | `true` | independent of snapping |
| `isSnapEnabled` | boolean | `true` | |
| `areRulersVisible` | boolean | `true` | |
| `activeWorkspaceId` | `WorkspaceId` | `'schematic'` | |
| `isIssuesPanelOpen` | boolean | `false` | |
| `toolWindow` | `ToolWindowState` | see below | |
| `viewByWorkspace` | `Record<CanvasWorkspaceId, Viewport>` | both `DEFAULT_VIEWPORT` | |

Parsing: invalid JSON or wrong `version` → all defaults. An invalid single field → that field's default; the rest are kept. Storage that throws → defaults, status `unavailable`, and writes become no-ops.

`PreferencesLoadStatus = 'ok' | 'missing' | 'corrupt' | 'unavailable'`. Only `unavailable` is shown to the user (settings dialog notice).

Writes: only from `changePreferences` / `resetSettings`. Loading never writes.

## Viewport

| Field | Type | Default | Rule |
|---|---|---|---|
| `zoom` | number | `1` | clamped `0.25 ≤ zoom ≤ 4` |
| `panXPx` | number | `0` | screen offset of world origin |
| `panYPx` | number | `0` | |

Stored in `Preferences.viewByWorkspace`, which is the single source of truth. During a continuous gesture the work surface renders a local draft and commits it at the gesture end (research R15).

Constant `PX_PER_U = 48` at zoom 1. World point (u) → screen px: `x * PX_PER_U * zoom + panXPx`.

Operations (pure, tested):

- `zoomAt(viewport, factor, anchorPx)` keeps the world point under the anchor fixed and clamps zoom.
- `resetViewport()` returns `DEFAULT_VIEWPORT`.
- `screenToWorld(pointPx, viewport)` returns a point in u.
- `displayGridStep(gridSizeU, zoom)` doubles the step until `step * PX_PER_U * zoom ≥ 6`. Render only.

## ToolWindowState

| Field | Type | Default | Rule |
|---|---|---|---|
| `xPx` | number | `28` | clamped into the surface on drag, key move and resize; 28 keeps it clear of the 20 px rulers |
| `yPx` | number | `28` | |
| `isCollapsed` | boolean | `false` | |

`clampPanelPosition({ xPx, yPx }, panelSize, containerSize)` returns the nearest position that keeps the panel fully inside. If the panel is larger than the container, the result is `0`. The panel renders `clampPanelPosition(draft ?? stored, panelSize, containerSize)`, derived in render; a clamped copy is never written back on resize, only committed at the end of a move.

`panelPositionForKey(position, key, isShift)` returns the position moved 16 px (64 px with Shift) for an arrow key, else `undefined`.

## Tool (static, not persisted)

`{ id, label, isAvailable }`. List: `select` (available, active by default), `add-key` and `wire` (unavailable). The active tool is local state of the Schematic workspace, not persisted. The spec does not require persisting it.

## WorkspaceIssue (not persisted)

`{ code: string, message: string, path: readonly (string | number)[], workspaceId: WorkspaceId }`: the observability.md `ValidationIssue` shape plus `workspaceId`. In this feature the list is always empty (`NO_ISSUES`). The badge count per tab is `issues.filter((issue) => issue.workspaceId === id).length`, hidden at 0. The UI copy calls them "problems".

## Shortcut (static)

Global: `{ id: ShortcutId, scope: 'global', code: string, label: string }` (Alt+Shift, matched by `KeyboardEvent.code`). Canvas: `{ id: ShortcutId, scope: 'canvas', keys: readonly string[], label: string, shift?: boolean }` (matched by `KeyboardEvent.key` while a canvas has focus). See `contracts/shortcuts.md`. One list feeds both `matchShortcut` and the help dialog. No preference fields.

## Pointer readout (not persisted)

Local state of each work surface: `{ xU, yU } | undefined`. It is `undefined` when the pointer is outside the surface. When snapping is on it is the snapped value, shown with up to 3 decimals.
