# Contract: Bindings validation issues

Shape: `ValidationIssue` (`docs/guidelines/code-quality/observability.md`). Produced by `validateBindings(project, catalog)`, called from `validateProject(project, catalog)`. Both map to workspace `'bindings'` in `WORKSPACE_BY_ISSUE_CODE` (`src/ui/shell/workspace-issue.ts`), so they count in the Bindings tab badge. N = key index shown in the UI; `L` = layer index; `keyId` = `Key.id`.

| Code | When | Path | Example message |
|---|---|---|---|
| `binding-keycode-unknown` | A `kp`/`sk`/`kt` key, or an `mt` hold/tap keycode, is not a catalog name or alias (FR-022); one issue per key, naming the first unknown name | `['layers', L, 'bindings', keyId]` | "Key 4 on layer Base sends BANG, which ZMK v0.3 does not know. Pick another key in Bindings." |
| `binding-profile-out-of-range` | `bt` `BT_SEL`/`BT_DISC` with `profile ≥ 5` (FR-022) | `['layers', L, 'bindings', keyId]` | "Key 9 on layer Base uses Bluetooth profile 7; only profiles 0–4 exist. Pick another profile in Bindings." |

Order: by layer index, then by key index, then by code in table order. Deterministic.

Activation (FR-022): the problems panel button switches to Bindings and focuses the element with `data-issue-path~="layers.L.bindings.keyId"`: the keycap on the canvas (always rendered; the Keys table row header carries the same path). Focusing it selects that key, which also opens its action in the panel (the panel follows the selection, FR-009a).
