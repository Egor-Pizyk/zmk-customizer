# Data model: Project foundation

Types live in `src/domain/types.ts` unless noted. All fields are `readonly`, plain JSON (ADR 0003). Research refs are in brackets.

## Project (schemaVersion 1)

```ts
type Project = {
  readonly schemaVersion: 1;
  readonly name: string;          // display name = ZMK keyboard name (≤16 bytes, validated, not enforced)
  readonly shieldName?: string;   // user override of the technical name; absent = derive from name [R1]
};
```

- `createProject(): Project` → `{ schemaVersion: 1, name: 'My keyboard' }`.
- Stored in `localStorage` and in project files as `serializeProject(project)` (`contracts/project-file.md`).
- Spec 003 bumps to v2 by spreading v1 and adding its fields (`003 data-model.md`).

## Derived (not stored)

| Value | Function | Rule |
|---|---|---|
| technical name | `getShieldName(project)` | `project.shieldName ?? toShieldName(project.name)` [R2] |
| save file name | UI | `` `${getShieldName(project) \|\| 'keyboard'}.json` `` [R11] |
| issues | `validateProject(project)` | table below [R3] |

## Operations (`src/domain/`, one per file, `(project, input) => Project`)

| Function | Input | Effect |
|---|---|---|
| `renameProject` | `{ name: string }` | Sets `name` as typed (trimming is not done: the user sees exactly what they typed). Returns the same reference when unchanged. |
| `setShieldName` | `{ shieldName: string \| undefined }` | `undefined` → removes the key (derive again); a string → stored as typed. Returns the same reference when unchanged. |

Operations are total: they never refuse. Validation reports the problems.

## ValidationIssue

```ts
type ValidationCode = 'shield-name-empty' | 'shield-name-invalid' | 'keyboard-name-too-long';
type ValidationIssue = {
  readonly code: ValidationCode;
  readonly message: string;
  readonly path: readonly (string | number)[];
};
```

| Code | Condition | Path | Message |
|---|---|---|---|
| `shield-name-empty` | `shieldName` absent and `toShieldName(name) === ''` | `['name']` | "The keyboard name has no letters or digits usable in file names. Use at least one Latin letter or digit, or set a technical name." |
| `shield-name-invalid` | `shieldName` present and not `/^[a-z_][a-z0-9_]*$/u` | `['shieldName']` | "The technical name may use only lowercase letters, digits and _, and must not start with a digit." |
| `keyboard-name-too-long` | UTF-8 length of `name` > 16 | `['name']` | "The keyboard name is N bytes; keyboards can announce at most 16. Shorten it (non-Latin letters count as 2–3)." |

Issue order: the table order. Tests assert on `code` and `path`.

UI mapping (`src/ui/shell/workspace-issue.ts`): `WORKSPACE_BY_ISSUE_CODE` sends all three codes to `'schematic'` [R4].

## Undo history (`src/ui/project-history.ts`) [R5]

```ts
type ProjectHistory = {
  readonly past: readonly Project[];     // oldest first, length ≤ UNDO_LIMIT (100)
  readonly present: Project;
  readonly future: readonly Project[];   // next redo first
};
type ProjectHistoryAction =
  | { readonly kind: 'commit'; readonly update: (project: Project) => Project }
  | { readonly kind: 'undo' }
  | { readonly kind: 'redo' }
  | { readonly kind: 'replace'; readonly project: Project };
```

| Action | past | present | future |
|---|---|---|---|
| commit, `update` returns the same ref | unchanged | unchanged | unchanged |
| commit, new value | `[...past, present]`, oldest dropped past 100 | new | `[]` |
| undo (past non-empty) | `past` without last | last of past | `[present, ...future]` |
| redo (future non-empty) | `[...past, present]` | first of future | rest |
| undo/redo on empty stack | unchanged | unchanged | unchanged |
| replace (New, accepted Open) | `[]` | given project | `[]` |

Not persisted; lost on reload (spec clarification 3).

## Storage state (`src/storage/project-storage.ts`) [R6, R7]

```ts
type StorageError = 'unavailable' | 'quota-exceeded';
type ProjectLoadStatus =
  | { readonly kind: 'ok' }
  | { readonly kind: 'missing' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'damaged'; readonly reason: 'not-json' | 'not-project' | 'newer-version'; readonly isBackupBlocked: boolean };
type ProjectLoadResult = {
  readonly project: Project;
  readonly status: ProjectLoadStatus;
  readonly backupText?: string;   // value of the backup key after loading; the provider never reads storage [R7]
};
```

`isBackupBlocked`: the damaged main value could not be copied aside, so it stays only in the main key and autosave is off. This happens when the backup slot holds a different value, or when the backup write throws. A slot holding the same raw string counts as free: the copy is idempotent.

### Save status (UI, derived from the load status + last save result)

| State | Project bar text | Banner |
|---|---|---|
| saved | "Saved in this browser" | none |
| unavailable | "Not saved: browser storage is blocked" | alert: autosave is off, save to a file |
| quota-exceeded | "Not saved: browser storage is full" | alert: same |
| backup-blocked | "Not saved: damaged data from an earlier visit is still kept" | damaged-data banner |

The kept-damaged-data banner is shown whenever `backupText` is set, independent of the save state. Its text depends on `backupOrigin: 'now' | 'earlier'` (provider state, R7):
- `'now'`: the status is `damaged` and not blocked, or the value was copied after a discard. It uses the reason from `status.reason`.
- `'earlier'`: kept from a previous visit, or the old backup while `backup-blocked`.

In the `backup-blocked` state the storage warning also shows: "Autosave is off: another saved project could not be read and is kept in this browser until you download or discard the damaged data below."

## ProjectFileError (`src/storage/parse-project-file.ts`) [R8, R10]

```ts
type ProjectFileError =
  | { readonly kind: 'not-json' }
  | { readonly kind: 'not-project'; readonly issues: readonly { readonly path: string; readonly message: string }[] }
  | { readonly kind: 'newer-version' }
  | { readonly kind: 'too-large' };
```

| Kind | Message shown |
|---|---|
| not-json | "This file is not a ZMK Customizer project file and could not be read." |
| not-project | "This file is not a valid project file:" + up to 10 lines "path: message" (+ "…and N more") |
| newer-version | "This file was made by a newer version of ZMK Customizer." |
| too-large | "This file is larger than 5 MB, too large to be a project file." |
