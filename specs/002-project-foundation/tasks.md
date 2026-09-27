---

description: "Task list for 002 project foundation"
---

# Tasks: Project foundation

**Input**: Design documents from `/specs/002-project-foundation/`

**Prerequisites**: plan.md, spec.md, research.md (R1–R18), data-model.md, contracts/ (project-file, shortcuts, ui-regions), quickstart.md

**Tests**: Required. AGENTS.md §8 says tests come first for domain and storage. Pure UI helpers (reducer, shortcuts, issue mapping, messages) also get tests. Run the node environment with no jsdom (R18). Each test task must fail before its implementation task starts.

**Organization**: Tasks are grouped by user story. Story order follows spec priority: US1–US4 are P1, US5–US6 are P2, US7 is P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: The user story this task belongs to (US1…US7)
- Paths are repo-relative. Single app: `src/` (plan.md "Source Code").

---

## Phase 1: Setup

**Purpose**: Fixtures and lint checks before any code.

- [X] T001 Create the compatibility fixture `tests/fixtures/project/v1.json` with exactly `{\n  "schemaVersion": 1,\n  "name": "My Corne v2!",\n  "shieldName": "corne"\n}\n`, in the `contracts/project-file.md` format: 2-space indent and one trailing `\n`. This file is never edited again (contracts "Compatibility promise"). Tests read it as text with `import fixtureV1 from '../../tests/fixtures/project/v1.json?raw'` (the same `?raw` pattern as `theme-init.test.ts`; no `node:fs`).
- [X] T002 Check that `.oxlintrc.json` needs no change for the new `src/domain/` folder: its override already bans `ui|storage|generators|catalog` and React imports. Also check that `react/only-export-components` already allows `useProject` (001 research R14). Change the file only if `npm run lint` reports a rule on the files created in Phase 2, and then name the exact rule.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Project type, naming rule, parser, serializer, history reducer, the `ProjectProvider` skeleton and a working Name field. Every story depends on this phase.

**⚠️ CRITICAL**: No user story work starts before this phase is done.

- [X] T003 [P] Create `src/domain/types.ts` (data-model.md):
  - `Project = { readonly schemaVersion: 1; readonly name: string; readonly shieldName?: string }`
  - `ValidationCode = 'shield-name-empty' | 'shield-name-invalid' | 'keyboard-name-too-long'`
  - `ValidationIssue = { readonly code: ValidationCode; readonly message: string; readonly path: readonly (string | number)[] }`
  - `Result<T, E> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E }`

  Create `src/domain/assert-never.ts` with `assertNever(value: never): never` (typescript.md "Exhaustiveness").
- [X] T004 [P] Write a failing test `src/domain/create-project.test.ts`: `createProject()` deep-equals `{ schemaVersion: 1, name: 'My keyboard' }` and has no `shieldName` key (`'shieldName' in project === false`).
- [X] T005 Implement `src/domain/create-project.ts` to pass T004.
- [X] T006 [P] Write a failing test `src/domain/to-shield-name.test.ts` for the R2 rule:
  - `'My Corne v2!'` → `'my_corne_v2'`
  - `'42 keys'` → `'_42_keys'`
  - `'!!!'` → `''`
  - `'Корн'` → `''`
  - `''` → `''`
  - `'  a--b  '` → `'a_b'`
  - `'My keyboard'` → `'my_keyboard'`
  - `'ÄBC'` → `'bc'` (non-Latin letters are dropped)
- [X] T007 Implement `src/domain/to-shield-name.ts`. Steps: lowercase; replace each run of characters outside `[a-z0-9]` with `_`; trim `_` at both ends; prefix `_` when the result starts with a digit.
- [X] T008 [P] Write a failing test `src/domain/get-shield-name.test.ts`: it returns the override when `shieldName` is present (even `'2Bad'`, stored as typed), and `toShieldName(name)` when absent.
- [X] T009 Implement `src/domain/get-shield-name.ts`: `project.shieldName ?? toShieldName(project.name)`.
- [X] T010 [P] Write a failing test `src/domain/rename-project.test.ts`:
  - `renameProject(project, { name })` sets `name` exactly as typed, with no trimming;
  - it keeps `shieldName`;
  - it does not mutate the input;
  - it returns the same reference (`toBe`) when the name is unchanged.
- [X] T011 Implement `src/domain/rename-project.ts` to pass T010.
- [X] T012 [P] Write a failing test `src/storage/serialize-project.test.ts`:
  - output is 2-space JSON with one trailing `\n`;
  - key order is `schemaVersion`, `name`, `shieldName`, even for an object built as `{ shieldName: 'corne', name: 'x', schemaVersion: 1 }` (research R8: serialize through the schema);
  - there is no `shieldName` line when absent;
  - serializing the parsed T001 fixture reproduces the fixture bytes exactly.
- [X] T013 Implement `src/storage/serialize-project.ts` (R8): `JSON.stringify(projectSchema.parse(project), null, 2) + '\n'`. It needs `projectSchema` from T017, so implement it after T017; the test T012 can be written earlier.
- [X] T014 [P] Write a failing test `src/storage/migrate-project.test.ts`:
  - `CURRENT_SCHEMA_VERSION === 1`;
  - `migrateProject(data, { fromVersion: 1 })` returns `data` unchanged (the migration table is empty).
- [X] T015 Implement `src/storage/migrate-project.ts` (R9): `CURRENT_SCHEMA_VERSION = 1`, `MIGRATIONS` table (empty), `migrateProject(data: unknown, input: { fromVersion: number }): unknown`, which applies steps `fromVersion → current`. Comment: each schema change adds `migrate-vN-to-vN+1.ts` plus a vN fixture test.
- [X] T016 [P] Write a failing test `src/storage/parse-project-file.test.ts` for `parseProjectFile(raw: string): Result<Project, ProjectFileError>`. Cover the rule order in `contracts/project-file.md` "Reading rules":
  - `'hello'` → `{ kind: 'not-json' }`
  - `'[]'`, `'{"foo":1}'` and `'{"schemaVersion":1.5}'` → `not-project` with an issue at path `'schemaVersion'`
  - `'{"schemaVersion":99,"name":"x"}'` → `{ kind: 'newer-version' }`
  - `'{"schemaVersion":1,"name":5}'` → `not-project` with an issue path `'name'`
  - `'{"schemaVersion":1,"name":"x","shieldName":7}'` → an issue at `'shieldName'`
  - an unknown key `extra` is stripped (the result deep-equals it without `extra`)
  - the T001 fixture parses to `{ schemaVersion: 1, name: 'My Corne v2!', shieldName: 'corne' }`
  - a 500-character name parses `ok` (range problems are validation's job, not the parser's)
- [X] T017 Implement `src/storage/project-schema.ts` (zod 4: `z.object({ schemaVersion: z.literal(1), name: z.string(), shieldName: z.string().exactOptional() }) satisfies z.ZodType<Project>`) and `src/storage/parse-project-file.ts`, with the `ProjectFileError` type from data-model.md:
  - `JSON.parse` in try/catch;
  - version guard (positive integer, then `> CURRENT_SCHEMA_VERSION` → `newer-version`);
  - `migrateProject`;
  - `safeParse`, with issue paths joined by `.`.

  It never throws (observability.md).
- [X] T018 [P] Write a failing test `src/ui/project-history.test.ts` for `reduceProjectHistory(history, action)`, following the data-model.md "Undo history" table row by row:
  - a commit that returns the same ref does nothing;
  - a commit pushes to `past` and clears `future`;
  - after 101 commits `past.length === 100` and the oldest is dropped;
  - undo and redo move `present` between the stacks;
  - undo or redo on an empty stack does nothing;
  - `replace` empties both stacks;
  - the input is never mutated.
- [X] T019 Implement `src/ui/project-history.ts` (R5): `UNDO_LIMIT = 100`, the `ProjectHistory` and `ProjectHistoryAction` types, and `reduceProjectHistory` with an exhaustive `switch` on `kind` that ends in `assertNever`.
- [X] T020 Create `src/ui/project-context.tsx` (react.md "Project state"). `ProjectProvider({ initialProject, children })` holds `useReducer(reduceProjectHistory, …)`, initialised from the `initialProject` prop; US1 turns this prop into `initialLoad: ProjectLoadResult`. The initializer stays pure: no storage calls inside React (research R7). `useProject()` reads the context via `use()`, renders `<ProjectContext value>`, and throws outside the provider. It exposes:
  - `project`
  - `canUndo`, `canRedo`
  - `commit(update)`
  - `undo()`, `redo()`
  - `replace(project)`
- [X] T021 Wrap `<App />` in `ProjectProvider initialProject={createProject()}` inside `PreferencesProvider` in `src/main.tsx`.
- [X] T022 Replace the static name in `src/ui/shell/project-bar.tsx` with a Name field (R13, contracts/ui-regions.md "Name field"):
  - `Field` with the visible label "Name" and an `h-8` text input carrying `data-issue-path="name"`;
  - draft while focused, following the `grid-size-field.tsx` pattern;
  - change the `<header>` class from `h-12` to `min-h-12 flex-wrap py-2`, so fields with issue text and 200% zoom wrap instead of clipping (accessibility.md "Reflow");
  - on blur or Enter: `commit((current) => renameProject(current, { name: text }))`; Escape restores the project value.

  Next to the field, show the derived technical name as text (`getShieldName(project)`); US6 turns it into a field. Keep the five buttons as they are for now.

**Checkpoint**: The name can be edited and a change is visible. `make check` passes.

---

## Phase 3: User Story 1 - Work is never lost between visits (Priority: P1) 🎯 MVP

**Goal**: Autosave on every change, restore on load, a save status, and a warning when storage fails.

**Independent Test**: Rename to "My Corne v2!" and reload: the name is still there and the status says "Saved in this browser". With site storage blocked, the app opens with a warning and renaming still works (quickstart 1, 2, 8).

- [X] T023 [P] [US1] Write a failing test `src/storage/project-storage.test.ts`, using a `Storage` stub as in `src/storage/preferences.test.ts`:
  - `loadProject()` with a `null` item → `{ project: createProject(), status: { kind: 'missing' } }`;
  - a valid stored string → `ok` with the parsed project;
  - `getItem` throws → `unavailable`;
  - `saveProject(project)` writes `serializeProject(project)` to `'zmk-customizer:project'` and returns `{ ok: true }`;
  - `setItem` throwing `new DOMException('', 'QuotaExceededError')` → `{ ok: false, error: 'quota-exceeded' }`;
  - any other throw → `'unavailable'`;
  - `loadProject` never calls `setItem` on the main key;
  - `backupText` in the result equals the backup key's value when one is stored, and is absent otherwise (the provider never reads storage).
- [X] T024 [US1] Implement `src/storage/project-storage.ts` (R6), with `PROJECT_STORAGE_KEY = 'zmk-customizer:project'`, `loadProject`, `saveProject` and the `StorageError` / `ProjectLoadStatus` / `ProjectLoadResult` types from data-model.md. `ProjectLoadResult` includes `backupText?: string`, read from `'zmk-customizer:project-backup'` in `loadProject`. There is try/catch only around `getItem`/`setItem`, and no empty catch. Damaged values return `{ kind: 'damaged', reason, isBackupBlocked: false }` for now; the backup copy comes in US5.
- [X] T025 [US1] Extend `src/ui/project-context.tsx`:
  - initial history from the `initialLoad` prop. In `src/main.tsx`, call `loadProject()` exactly once before `createRoot().render` and pass the result as `initialLoad` (research R7: `StrictMode` runs initializers twice, and loading may write the backup);
  - autosave inside the provider's dispatch (the handler that changes the project, as in `preferences-context.tsx`), storing the last save error in state; no effect (research R6);
  - expose `saveStatus: 'saved' | 'unavailable' | 'quota-exceeded' | 'backup-blocked'`, derived from the load status and the last save result.

  Autosave is skipped while the status is `backup-blocked` (US5 sets it).
- [X] T026 [US1] In `src/ui/shell/project-bar.tsx`, replace "Nothing to save" with the save-status text from data-model.md "Save status": "Saved in this browser" / "Not saved: browser storage is blocked" / "Not saved: browser storage is full" / "Not saved: damaged data from an earlier visit is still kept". It is plain text, not a live region.
- [X] T027 [US1] Create `src/ui/shell/project-messages.tsx` (R15) with the first banner. When `saveStatus` is `unavailable` or `quota-exceeded`: `role="alert"`, the text "Autosave is off: this browser does not let the app store your project. Save it to a file to keep your work." The banner is persistent and disappears after the next successful save. Mount it below `<ProjectBar />` in `src/ui/app.tsx`.

**Checkpoint**: quickstart 1, 2 and 8 pass.

---

## Phase 4: User Story 2 - Undo and redo every change (Priority: P1)

**Goal**: Project bar Undo and Redo, Mod+Z / Mod+Shift+Z, announcements, and help-dialog rows.

**Independent Test**: Rename A, B, C; undo ×3; redo ×2; a new change clears redo; Mod+Z inside the Name field undoes only the text (quickstart 3).

- [X] T028 [P] [US2] Extend `src/ui/shortcuts.test.ts` with failing cases (contracts/shortcuts.md):
  - `{ code: 'KeyZ', key: 'я', metaKey: true }` → `'undo'`;
  - `ctrlKey` with Shift → `'redo'`;
  - Alt added → `undefined`;
  - `isTypingTarget` → `undefined`;
  - `isDialogOpen` → `undefined`;
  - `{ code: 'KeyZ', metaKey: false, ctrlKey: false }` on a focused canvas does not match `undo`;
  - Ctrl+KeyP still → `undefined` (other Ctrl combos unchanged);
  - `isRepeatableShortcut('undo') === true`.
- [X] T029 [US2] Implement in `src/ui/shortcuts.ts`:
  - `scope: 'project'` entries `undo` (`code: 'KeyZ'`, `keyLabel: 'Z'`, `shift: false`, label "Undo") and `redo` (`code: 'KeyZ'`, `keyLabel: 'Z'`, `shift: true`, label "Redo");
  - a match branch before the ctrl/meta bail-out: `(ctrlKey || metaKey) && !altKey`, `code` and `shift` equal;
  - add both ids to `REPEATABLE_SHORTCUT_IDS`;
  - in the same task, so typecheck stays green: in `src/ui/shell/shortcut-help-dialog.tsx`, replace the `if/else` on `scope` with an exhaustive `switch` (`assertNever`). The `'project'` case pushes rows `${primaryLabel}+${shift ? 'Shift+' : ''}${keyLabel}` into a new "Project" `HelpTable`. Later project entries (T039) appear there with no further change.
- [X] T030 [P] [US2] Extend `src/ui/shortcut-actions.test.ts`: `getShortcutAction('undo', …)` → `{ kind: 'undo' }`, and the same for `'redo'`.
- [X] T031 [US2] Implement the `undo` / `redo` variants in the `ShortcutAction` union in `src/ui/shortcut-actions.ts`. In `src/ui/use-global-shortcuts.ts`, route them to `useProject().undo` / `redo` with an exhaustive `switch` on `action.kind`.
- [X] T032 [US2] Make Undo and Redo work in `src/ui/shell/project-bar.tsx`: `isDisabled={!canUndo}` with hint "Nothing to undo" (and the same for Redo), `onClick` → `undo()` / `redo()`. Remove the "Not available yet" hint from these two.
- [X] T033 [US2] Rename `src/ui/shell/issues-announcer.tsx` to `src/ui/shell/status-message.tsx` (`StatusMessage`, research R15).
  - It stays the only polite `<output>`, always mounted, empty on load. It renders `<output className="sr-only">{announcement && <span key={announcement.id}>{announcement.text}</span>}</output>`. Only the span remounts, so a repeated text is spoken each time. Never key the `<output>` itself.
  - Add `announcement: { readonly text: string; readonly id: number } | undefined` and `announce(text)` (increments `id`) to `src/ui/project-context.tsx`.
  - `undo` / `redo` announce "Undone" / "Redone". If the issue count differs between the old and new project (compare `validateProject(...).length` in the handler), append the count: "Undone. 2 problems" (`formatIssueCount`).
  - `commit` announces only when the issue count changed (the count text); otherwise it leaves the announcement untouched.
  - Update the import in `src/ui/app.tsx`. Until T056 the count source is still `NO_ISSUES` (always 0), so commit announces nothing.
- [X] T034 [US2] In `specs/001-app-shell-ui/contracts/shortcuts.md`, add one line under the title: "Project shortcuts (Mod+Z, Mod+Shift+Z, Mod+S, Mod+O): `specs/002-project-foundation/contracts/shortcuts.md`."

**Checkpoint**: quickstart 3 passes.

---

## Phase 5: User Story 3 - Save the project to a file and open it again (Priority: P1)

**Goal**: Save downloads `<technical name>.json`. Open confirms, then picks a file and replaces the project with a fresh history.

**Independent Test**: Rename, Save, New (or clear storage), Open the saved file: the project is identical (quickstart 5).

- [X] T035 [P] [US3] Write a failing test `src/storage/read-import-file.test.ts`, using node 24's global `File`:
  - a valid project file → `ok`;
  - `new File(['x'.repeat(5 * 1024 * 1024 + 1)], 'big.json')` → `{ kind: 'too-large' }`, checked by `size` before reading (spy on `text` and expect it not called);
  - `'hello'` → `not-json`.
- [X] T036 [US3] Implement `src/storage/read-import-file.ts` (R10): `MAX_PROJECT_FILE_BYTES = 5 * 1024 * 1024`; `readImportFile(file: File): Promise<Result<Project, ProjectFileError>>`, with try/catch only around `await file.text()` (a failure → `not-json`), then `parseProjectFile`.
- [X] T037 [P] [US3] Create `src/ui/download-text-file.ts` (R11): `downloadTextFile({ fileName, text }): Result<void, 'blocked'>`. It creates a `Blob` of `application/json`, uses `URL.createObjectURL` and a temporary `<a download>`, clicks it, then calls `revokeObjectURL`, with try/catch around the DOM calls.
- [X] T038 [P] [US3] Extend `src/ui/shortcuts.test.ts` and `src/ui/shortcut-actions.test.ts` with failing cases for `save-project` (`KeyS`) and `open-project` (`KeyO`): both are not repeatable and are blocked in text fields and dialogs.
- [X] T039 [US3] Implement the `save-project` / `open-project` entries in `src/ui/shortcuts.ts` (labels "Save the project to a file", "Open a project file") and their actions in `src/ui/shortcut-actions.ts`. In `src/ui/use-global-shortcuts.ts`, route `save-project` to `useProject().saveProjectFile` and `open-project` to `dialogs.handleOpenDialogOpen`. Add `saveProjectFile()` to `src/ui/project-context.tsx` (T040). Add `isNewDialogOpen`, `isOpenDialogOpen`, `isDiscardDialogOpen` and their open and close handlers to `src/ui/use-shell-dialogs.ts`, next to settings and help (research R16: dialog flags are UI state, not project context). `useGlobalShortcuts` receives `handleOpenDialogOpen`. `App` passes the open handlers to `ProjectBar` (New, Open) and `ProjectMessages` (Discard), and the flags plus close handlers to `ProjectDialogs` (T041), so the shortcut and the button share one path. The help dialog lists the new entries through the `'project'` case from T029. Give the entries `keyLabel: 'S'` / `'O'`.
- [X] T040 [US3] Implement Save in `src/ui/project-context.tsx`:
  - `saveProjectFile()` → `downloadTextFile({ fileName: `${getShieldName(project) || 'keyboard'}.json`, text: serializeProject(project) })`;
  - on `blocked`, the announcement is "Could not save the file.".

  Save is never disabled. Wire the Save button in `src/ui/shell/project-bar.tsx` and remove its "Not available yet" hint.
- [X] T041 [US3] Create `src/ui/shell/project-dialogs.tsx` (`ProjectDialogs`, R16, contracts/ui-regions.md). Mount it in `src/ui/app.tsx` next to `SettingsDialog` and `ShortcutHelpDialog`, with the dialog flags and close handlers from `use-shell-dialogs.ts`.
  - It renders a hidden `<input type="file" accept=".json,application/json">` outside every `<dialog>`, because `Dialog` unmounts its children when closed. The input is held in a local `useRef`.
  - First dialog, Open: title "Open a project file?", text "The current project will be replaced. Save it to a file first if you want to keep it." Buttons:
    - "Save to file" (secondary): calls `saveProjectFile()` and keeps the dialog open.
    - "Choose file…" (primary): first `event.currentTarget.closest('dialog')?.close()`, synchronously, so the page is no longer inert; then `inputRef.current?.click()`. The dialog's `close` event clears the flag through `onClose`.
    - "Cancel".
- [X] T042 [US3] Handle the file input `change` in `src/ui/shell/project-dialogs.tsx`, as an async handler with a top-level catch that announces "Could not open the file.":
  - `await readImportFile(file)`;
  - on `ok` → `replace(value)` and `announce(`Opened ${file.name}`)`;
  - reset `input.value` so the same file can be chosen again.

  Cancelling the picker changes nothing. In `src/ui/shell/project-bar.tsx`, the Open button calls `handleOpenDialogOpen` (received from `App`); remove its "Not available yet" hint.

**Checkpoint**: quickstart 5 passes.

---

## Phase 6: User Story 4 - Broken or foreign files never damage the open project (Priority: P1)

**Goal**: Each rejected file shows a readable, dismissable alert, and the project, history and storage stay unchanged.

**Independent Test**: Open `hello.txt`, `{"foo":1}`, a newer-version file and a 6 MB file: each shows its message, and the name, undo state and `localStorage` are unchanged (quickstart 6).

- [X] T043 [P] [US4] Write a failing test `src/ui/shell/format-project-file-error.test.ts` for `formatProjectFileError(error): { readonly title: string; readonly lines: readonly string[] }`, using the data-model.md "ProjectFileError" message table verbatim:
  - `not-json` → "This file is not a ZMK Customizer project file and could not be read.";
  - `newer-version` → "This file was made by a newer version of ZMK Customizer.";
  - `too-large` → "This file is larger than 5 MB, too large to be a project file.";
  - `not-project` with 12 issues → title "This file is not a valid project file:", 10 lines `path: message` and a last line "…and 2 more".
- [X] T044 [US4] Implement `src/ui/shell/format-project-file-error.ts`: an exhaustive `switch` on `kind` with `assertNever`, and the 10-line cap (R15).
- [X] T045 [US4] In `src/ui/shell/project-dialogs.tsx`, on a `readImportFile` `ok: false` result, set `rejectedFile: ProjectFileError | undefined` in the project context; do not call `replace`. In `src/ui/shell/project-messages.tsx`, render it as a `role="alert"` banner with the title, a `<ul>` of lines and a "Dismiss" button that clears it. A new Open attempt replaces the previous error.

**Checkpoint**: quickstart 6 passes. SC-003 holds: the only project-changing call in the Open flow is `replace` on `ok`.

---

## Phase 7: User Story 5 - Damaged saved state is kept, not thrown away (Priority: P2)

**Goal**: Damaged or newer stored data is copied to the backup key, can be downloaded byte for byte, and is discarded only after confirmation.

**Independent Test**: Set the stored project to `{broken` and reload. A new project opens with the banner, the download returns `{broken`, and autosave does not touch the backup. Discard with confirmation removes it, and it does not come back after a reload (quickstart 7).

- [X] T046 [P] [US5] Extend `src/storage/project-storage.test.ts` with failing cases (R7, contracts/project-file.md "Storage keys"):
  - a damaged main value with an empty backup key: `loadProject` writes the raw string to `'zmk-customizer:project-backup'`, never writes the main key, and returns `{ kind: 'damaged', reason: 'not-json', isBackupBlocked: false }` with `createProject()`;
  - with the backup already holding the **same** raw string: no write, `isBackupBlocked: false` (the copy is idempotent);
  - with the backup holding a **different** value: no write at all, and `isBackupBlocked: true`;
  - the backup `setItem` throws (quota): `isBackupBlocked: true`, and the main key is untouched (research R7);
  - `backupText` in the result is the backup's value after the copy (the raw string in the first case, the older value in the blocked case);
  - `backupDamagedProject()`, called after the slot was emptied, copies the raw main value into the backup and returns `Result<string, StorageError>` with the new backup text; with an occupied slot or a throwing `setItem` it writes nothing and returns `ok: false`;
  - `{"schemaVersion":99}` → reason `'newer-version'`;
  - `discardBackup()` calls `removeItem` on the backup key and returns a `Result`;
  - `readStoredProjectText()` returns the raw main value.
- [X] T047 [US5] Implement the backup rules in `src/storage/project-storage.ts`: `PROJECT_BACKUP_STORAGE_KEY = 'zmk-customizer:project-backup'`, the "occupied = different value" check, a failing backup write → `isBackupBlocked: true`, `backupText` in `ProjectLoadResult`, `discardBackup`, `backupDamagedProject`, `readStoredProjectText`. No `readBackupText` export: only `loadProject` reads the backup.
- [X] T048 [US5] Extend `src/ui/project-context.tsx` (research R7):
  - state `backupText` from `initialLoad.backupText`. No storage read inside React.
  - `backupOrigin: 'now' | 'earlier'`: `'now'` when `initialLoad.status` is `damaged` and not `isBackupBlocked`, otherwise `'earlier'`.
  - `saveStatus = 'backup-blocked'` when `isBackupBlocked`; autosave is skipped in that state.
  - `discardKeptBackup()` → `discardBackup()`:
    - fails → keep everything and `announce('Could not discard the damaged data.')`;
    - succeeds, and the status is not `backup-blocked` → clear `backupText`;
    - succeeds while `backup-blocked` → `backupDamagedProject()`. On `ok`: `backupText` = the returned value, `backupOrigin = 'now'`, and only then leave `backup-blocked` so autosave resumes. On failure: stay `backup-blocked` with `backupText` cleared, and announce "Could not keep the damaged data aside; autosave stays off."

  No damaged value is ever overwritten before it has been copied (SC-004).
- [X] T049 [US5] Add the damaged-data banner to `src/ui/shell/project-messages.tsx`. It is shown while `backupText !== undefined`, as `role="alert"`.
  - Text for `'now'`: "The project saved in this browser could not be read (<reason text>). A new project was started; the damaged data is kept." The reason text comes from `initialLoad.status.reason`: "it is not valid JSON" / "it is not a project" / "it was made by a newer version of ZMK Customizer".
  - Text for `'earlier'`: "Damaged project data from an earlier visit is still kept in this browser."
  - Buttons:
    - "Download damaged data" → `downloadTextFile({ fileName: 'damaged-project.json', text: backupText })`, which gives the exact bytes.
    - "Discard damaged data…" → `handleDiscardDialogOpen` (from `App`).

  Extend the T027 storage warning to also show while `saveStatus === 'backup-blocked'`, with the text "Autosave is off: another saved project could not be read and is kept in this browser until you download or discard the damaged data below."

  Add the Discard dialog to `src/ui/shell/project-dialogs.tsx`: title "Discard damaged data?", text "It cannot be recovered afterwards.", buttons "Discard damaged data" (danger → `discardKeptBackup()`, then close) and "Cancel".

**Checkpoint**: quickstart 7 passes. SC-004 holds.

---

## Phase 8: User Story 6 - Name the keyboard (Priority: P2)

**Goal**: A technical-name override field; three validation codes shown in the problems panel, the Schematic badge and the fields; problem buttons focus the field.

**Independent Test**: The name `!!!` gives 1 problem and badge 1, and activating it focuses Name. The override `corne` clears it and makes the file `corne.json`. Clearing the override brings it back; `2Corne` is invalid; a long name is too long (quickstart 4).

- [X] T050 [P] [US6] Write a failing test `src/domain/set-shield-name.test.ts`:
  - `setShieldName(project, { shieldName: 'corne' })` sets it as typed (`'2Bad'` is stored unchanged);
  - `{ shieldName: undefined }` removes the key (`'shieldName' in result === false`);
  - an unchanged value returns the same reference;
  - the input is not mutated.
- [X] T051 [US6] Implement `src/domain/set-shield-name.ts` (remove the key with rest-destructuring, no `delete`).
- [X] T052 [P] [US6] Write a failing test `src/domain/validate-project.test.ts`, asserting `code` and `path` only (data-model.md "ValidationIssue" table):
  - `createProject()` → `[]`;
  - name `'!!!'` without an override → `[{ code: 'shield-name-empty', path: ['name'] }]`;
  - name `'!!!'` with the override `'corne'` → `[]`;
  - override `'2Bad'` / `'Corne'` / `''` → `shield-name-invalid` at `['shieldName']`;
  - name `'A very long keyboard name'` → `keyboard-name-too-long` at `['name']`;
  - `'Корнекорнекорн'` (14 characters, 28 bytes) → too long;
  - `'1234567890123456'` (16 bytes) → no issue;
  - issue order follows the table.
- [X] T053 [US6] Implement `src/domain/validate-project.ts`:
  - the pattern `/^[a-z_][a-z0-9_]*$/u`;
  - byte length via `new TextEncoder().encode(name).length > 16`;
  - messages verbatim from the data-model.md table, where the too-long message contains the actual byte count.
- [X] T054 [P] [US6] Write a failing test `src/ui/shell/workspace-issue.test.ts`: `toWorkspaceIssues(issues)` adds `workspaceId: 'schematic'` to each of the three codes and keeps the order.
- [X] T055 [US6] Implement in `src/ui/shell/workspace-issue.ts` (R4):
  - `WORKSPACE_BY_ISSUE_CODE: Record<ValidationCode, WorkspaceId>` and `toWorkspaceIssues`;
  - change `WorkspaceIssue.code` from `string` to `ValidationCode`;
  - keep `NO_ISSUES` for now: its importers switch in T056/T057, and T057 deletes it, so the build stays green between tasks;
  - in `src/ui/project-context.tsx`, expose `issues = useMemo(() => toWorkspaceIssues(validateProject(present)), [present])` (react.md: the one allowed memo).
- [X] T056 [US6] Replace `NO_ISSUES` with `useProject().issues` in `src/ui/shell/tab-bar.tsx`, `src/ui/shell/issues-toggle.tsx` and `src/ui/shell/status-message.tsx`.
- [X] T057 [US6] In `src/ui/shell/issues-panel.tsx`, read `useProject().issues` and render each issue as a `<button>` whose text is the message (with its workspace label). On activation, `document.querySelector<HTMLElement>(`[data-issue-path="${issue.path.join('.')}"]`)?.focus()` (R14). The list `key` stays `${workspaceId}:${code}:${path}`. Delete `NO_ISSUES` from `src/ui/shell/workspace-issue.ts`, since this was its last importer. Spec 003 extends this handler (switching workspace, opening the parts list) and keeps the `data-issue-path` attribute name.
- [X] T058 [US6] Turn the technical name in `src/ui/shell/project-bar.tsx` into a field (R13, contracts/ui-regions.md):
  - `Field` label "Technical name";
  - value = `project.shieldName ?? ''` and placeholder = `toShieldName(project.name)`;
  - `data-issue-path="shieldName"`;
  - draft/commit with `setShieldName(current, { shieldName: text === '' ? undefined : text })`.

  Both fields pass their issues (matched by `path[0]`) to `Field` `error`, joined by a space, so `aria-invalid` and `aria-describedby` are set.

**Checkpoint**: quickstart 4 passes. SC-007 holds.

---

## Phase 9: User Story 7 - Start a new project (Priority: P3)

**Goal**: New asks for confirmation, offers saving first, then replaces the project with a fresh history.

**Independent Test**: New → Cancel changes nothing. New → "Start new project" gives "My keyboard" with Undo unavailable, and it survives a reload (quickstart 5).

- [X] T059 [US7] Add the New dialog to `src/ui/shell/project-dialogs.tsx` (R16): title "Start a new project?", text "The current project will be replaced. Save it to a file first if you want to keep it.", and buttons:
  - "Save to file" (secondary): `saveProjectFile()`, keeps the dialog open;
  - "Start new project" (danger): `replace(createProject())` plus `announce('Started a new project')`, then `handleNewDialogClose`;
  - "Cancel".

  Wire the New button in `src/ui/shell/project-bar.tsx` to `handleNewDialogOpen` (from `use-shell-dialogs.ts` via `App`; the dialog is `isOpen={isNewDialogOpen}`) and remove its "Not available yet" hint. Focus returns to New (native `<dialog>`).

**Checkpoint**: All five project actions work. No "Not available yet" hint remains in `project-bar.tsx`.

---

## Phase 10: Polish & cross-cutting

- [X] T060 Create `src/ui/error-boundary.tsx` (R17; the only class component, observability.md "Crashes") and wrap it outermost in `src/main.tsx`. The fallback has:
  - `<h1>` "Something went wrong";
  - the message, and the stack in `<details>`;
  - a "Download saved project" button → `readStoredProjectText()` → `downloadTextFile({ fileName: 'saved-project.json', text })`, disabled with the hint "Nothing saved in this browser" when `undefined`;
  - a "Reload" button → `location.reload()`.

  It never writes storage.
- [X] T061 [P] Update the docs to match what now exists:
  - `docs/guidelines/frontend/admin-ui.md:91`: "Planned undo/redo" → "Project: Mod+Z undo, Mod+Shift+Z redo, Mod+S save, Mod+O open (`specs/002-project-foundation/contracts/shortcuts.md`)";
  - `docs/guidelines/frontend/accessibility.md:15`: "stay the planned undo/redo" → the same list;
  - `docs/guidelines/frontend/react.md` effects table: the autosave row becomes "none: autosave runs in the provider's dispatch (002 research R6)"; line 64: drop "undo/redo join it when the project feature lands", and add the `IssuesAnnouncer` → `StatusMessage` rename if the table mentions it;
  - `docs/guidelines/frontend/admin-ui.md` Primitives table, `StatusMessage` row: say it lives in `ui/shell/status-message.tsx` (it reads the project context) and that announcements are a keyed `<span>` inside the always-mounted `<output>`.
- [X] T062 [P] In `docs/roadmap.md` "Open decisions", mark as resolved:
  - "Undo history" → "session only, 100 steps (spec 002)";
  - "Schema versioning" → "v1 frozen at merge of 002; every later change adds a migration".

  In the 002 section, add "Deviations (spec 002)":
  - no "saving" status, because `localStorage` writes are synchronous;
  - a damaged stored value is copied to a backup key and the main key may then be overwritten, instead of the main key staying untouched until confirmation.

  In the 003 shield-generators "Open" list, add: "Kconfig string escaping of the keyboard name (`\"`, `\\`, non-ASCII) in `Kconfig.defconfig`: read the Kconfig rules first (002 research R3)."
- [ ] T063 Run the `quickstart.md` manual scenarios 1–11, including the browser checks in Chrome, Firefox and Safari (shortcuts, and the file picker opened from the Open dialog) and the accessibility checklist. Record the results at the bottom of this file. Record any shortcut replaced in `contracts/shortcuts.md`, and fix what fails.
- [X] T064 Run `make check` (typecheck, lint, format, tests) last, after every fix from T063, and fix everything it reports.

---

## Dependencies & Execution Order

### Phase dependencies

- Setup (T001–T002) → Foundational (T003–T022) → user stories → Polish.
- US1 (autosave) comes first: US3, US5 and US7 rely on autosave of `replace`, and US5 extends `project-storage.ts` from US1.
- US2 needs only Foundational.
- US3 needs Foundational. T039 extends the shortcut entries from US2 (T029), so do US2 first or merge carefully in `shortcuts.ts`.
- US4 needs US3 (the Open flow).
- US5 needs US1 (T024, T025) and `download-text-file.ts` (T037, US3).
- US6 needs Foundational and `status-message.tsx` (T033, US2).
- T013 needs T017 (`projectSchema`).
- US7 needs `project-dialogs.tsx` (T041, US3).
- T060 needs T037 and T047.

### Within each phase

Each test task comes before its implementation and must fail first. `types.ts` (T003) comes before everything in `domain/`. Several tasks edit `project-context.tsx`, `project-bar.tsx` and `project-messages.tsx`; those tasks run sequentially.

### Parallel opportunities

- Foundational: the test tasks T004, T006, T008, T010, T012, T014, T016 and T018 are in different files and can run together after T003. Each implementation follows its own test.
- US3: T035, T037 and T038 can run in parallel.
- US6: T050, T052 and T054 can run in parallel.
- Polish: T061 and T062 can run in parallel.

## Parallel Example: Foundational

```text
Task: "T006 Write a failing test src/domain/to-shield-name.test.ts"
Task: "T012 Write a failing test src/storage/serialize-project.test.ts"
Task: "T016 Write a failing test src/storage/parse-project-file.test.ts"
Task: "T018 Write a failing test src/ui/project-history.test.ts"
```

## Parallel Example: User Story 6

```text
Task: "T050 Write a failing test src/domain/set-shield-name.test.ts"
Task: "T052 Write a failing test src/domain/validate-project.test.ts"
Task: "T054 Write a failing test src/ui/shell/workspace-issue.test.ts"
```

## Implementation Strategy

### MVP first

Phases 1–3 (Setup, Foundational, US1): a named project that survives reloads, with a save status. Stop and run quickstart 1, 2 and 8.

### Incremental delivery

1. US2 (undo)
2. US3 (file round trip)
3. US4 (rejects)
4. US5 (damaged storage)
5. US6 (naming and problems)
6. US7 (New)
7. Polish

Each story ends with its quickstart checkpoint and `make check`. Commit per task or per story with Conventional Commits (`feat:`, `test:`, `docs:`).

### Before `/speckit-implement`

Run `/speckit-analyze`, then the `spec-reviewer` agent on `specs/002-project-foundation/` (roadmap Step 0.4).

## Implementation log

- T001–T062, T064 done. `make check` passes (23 test files, 189 tests).
- **T063 is still open: the manual quickstart pass in real browsers.** It covers:
  - shortcuts in Chrome, Firefox and Safari;
  - the file picker opened from the Open dialog;
  - screen-reader announcements;
  - dark mode and 200% zoom.

  Run it with `make up`, then record the results here.
