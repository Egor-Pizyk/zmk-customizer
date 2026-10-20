# Contract: Project file and project storage

The project JSON is the one persisted interface of this feature. It is the same bytes in three places:
- a downloaded file (`<technical name>.json`);
- `localStorage['zmk-customizer:project']`;
- the bug-report artifact (observability.md "Debug aids").

## Format (schemaVersion 1)

```json
{
  "schemaVersion": 1,
  "name": "My Corne v2!",
  "shieldName": "corne"
}
```

- UTF-8 text produced by `JSON.stringify(projectSchema.parse(project), null, 2)` plus one trailing `\n`. Parsing first fixes the key order to the schema order however the object was built: `schemaVersion`, `name`, then `shieldName` (only when set).
- `shieldName` is omitted when the user did not override the technical name. Clearing the override removes the key.
- The file contains nothing else: no timestamps, app version, user agent or ids derived from the environment (observability.md "Privacy").

## Reading rules (`parseProjectFile`, used for files and storage)

Applied in order; the first failure wins.

1. Not valid JSON → `not-json`.
2. Not an object with an integer `schemaVersion` ≥ 1 → `not-project` (issue at `schemaVersion`).
3. `schemaVersion` > app's `CURRENT_SCHEMA_VERSION` → `newer-version`. Nothing is migrated or changed.
4. Migrate step by step `vN → vN+1` up to current.
5. Validate the current shape. Each failing field → one `not-project` issue `{ path, message }`, where the path is dot-joined as in zod (`name`, `keys.3.xU`).
6. Unknown keys are dropped.

Files are also refused before reading when larger than 5 MB (`too-large`).

A value that is valid in shape but breaks a project rule (for example a 500-character name) loads, and is reported by `validateProject`.

## Compatibility promise

- Every file with `schemaVersion` ≤ current loads. `tests/fixtures/project/v1.json` is a test fixture that must keep loading after every future migration.
- Each schema change adds one migration and bumps `CURRENT_SCHEMA_VERSION`. Version 1 is frozen once this feature is merged.

## Storage keys

| Key | Content | Written when | Removed when |
|---|---|---|---|
| `zmk-customizer:project` | current project (format above) | every project change (commit, undo, redo, New, accepted Open), unless autosave is off | never |
| `zmk-customizer:project-backup` | exact raw string of a stored project that could not be read | once, on startup, when the main key is damaged and this key is empty or already holds the same value; again after a confirmed discard while autosave is blocked (research R7) | the user confirms "Discard damaged data" |
| `zmk-customizer:preferences` | unchanged (spec 001) | — | — |

- Loading never writes the main key, and nothing is written on mount; the main key is written only by a project change (research R6).
- If the backup write throws, nothing is overwritten: autosave is off for the session.
- If the main key is damaged and the backup key already holds a different value, neither key is written for the rest of the session (research R7).
- Two tabs: last write wins; there is no detection and no `storage` event handling (spec clarification 1).

## Current format extension (schema v12, feature 033)

Schema ordering and the trailing newline stay deterministic. Save/download normally use two-space indentation. If that representation exceeds the unchanged 5 MiB byte budget, use compact JSON plus the newline instead; refuse only if the compact artifact also exceeds the budget. Domain edit guards measure the same chosen representation. This preserves legacy near-budget files when migration adds fixed wire anchors/contacts. Historical v1 golden bytes remain frozen.
