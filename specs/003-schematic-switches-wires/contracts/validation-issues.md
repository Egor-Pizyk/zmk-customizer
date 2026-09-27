# Contract: Schematic validation issues

Shape: `ValidationIssue` (`docs/guidelines/code-quality/observability.md`). All map to workspace `'schematic'` via `WORKSPACE_BY_ISSUE_CODE` in `src/ui/shell/workspace-issue.ts` (the domain issue has no `workspaceId`, 002 research R4). Tests assert `code` + `path`; message wording may change. N = key index, W = wire index (0-based, as shown in UI).

| Code | When | Path | Example message |
|---|---|---|---|
| `key-overlap` | The 1u cells of two keys overlap (FR-003); one issue per key of each pair | `['keys', N]` | "Key 3 overlaps key 5. Move one of them." |
| `key-pin-unconnected` | No wire end on this pin (FR-021) | `['keys', N, 'pins', P]` | "Key 3, pin 2 is not connected. Draw a wire from it." |
| `wire-end-unconnected` | `free` end without `boardPin` (FR-022) | `['wires', W, 'start' \| 'end']` | "Wire 5 has a free end that is not connected to anything. Connect it to a board pin or a key pin." |
| `board-pin-conflict` | Same `boardPin` on free ends of different nets; one issue per such end (FR-023) | `['wires', W, 'start' \| 'end', 'boardPin']` | "Board pin P3 is used by wire 5 and wire 8, which are not connected. Pick a different pin for one of them." |
| `board-pins-shorted` | One net reaches ≥ 2 different `boardPin` values (FR-023a); one issue per board-pin end of that net | `['wires', W, 'start' \| 'end', 'boardPin']` | "Wire 5 connects board pins P3 and P4 together. Insulate a crossing or remove a wire." |
| `key-shorted` | Both pins of a key in one net (FR-024) | `['keys', N]` | "Key 3 is shorted: both pins are on the same connection. Insulate a crossing or remove a wire." |

Order: by code in the table order, then by path (numeric). Deterministic.

Activation (FR-025): the problems panel item is a `<button>`; it switches to Schematic and opens the parts list when needed, then focuses the parts-list control (whose `onFocus` selects the entity on the canvas) with `data-issue-path` equal to the issue path joined by `.` (for `keys.N.pins.P` the pin cell, for `wires.W.start` the end cell / board-pin select).
