# Research: Project foundation

Decisions for `plan.md`. Each: decision, rationale, alternatives. No open NEEDS CLARIFICATION.

## R1. Project shape v1

- **Decision**: `Project = { schemaVersion: 1; name: string; shieldName?: string }` in `src/domain/types.ts`. `shieldName` is the user's override of the technical name; when it is absent, the technical name is derived from `name` (spec clarification 4). It is stored exactly as typed, never sanitized (FR-012a), so validation can report it.
- **Rationale**: Spec 003 research R1 assumes `{ schemaVersion: 1, name }` and spreads v1 into v2. An optional field keeps that working. Absent = "derive" follows typescript.md: absence is an omitted optional field, never a sentinel.
- **Alternatives**: always store the derived name (it would drift when the name changes); a `{ kind: 'derived' | 'custom' }` union (more code for a two-state choice that "present or absent" already expresses).

## R2. Technical name derivation

- **Decision**: `toShieldName(name)` in `src/domain/to-shield-name.ts`:
  1. lowercase;
  2. replace each run of characters outside `[a-z0-9]` with `_`;
  3. trim `_` from both ends;
  4. prefix `_` if the result starts with a digit.

  `getShieldName(project)` returns `project.shieldName ?? toShieldName(project.name)`. Pattern check: `/^[a-z_][a-z0-9_]*$/u`.
- **Rationale**: This is the ZMK shield id pattern (`docs/zmk/shield-files.md`, AGENTS §2). Lowercasing before the replace keeps `A–Z` as letters. Non-Latin letters are dropped (spec Assumptions).
- **Alternatives**: transliteration of Cyrillic and other scripts (a table per script, and the result is surprising); rejecting digits at the start (the spec example `42 keys` → `_42_keys`).

## R3. Validation issues

- **Decision**: `validateProject(project): readonly ValidationIssue[]` in `src/domain/validate-project.ts`. Codes for this feature:

  | Code | When | Path |
  |---|---|---|
  | `shield-name-empty` | no override and the derived name is `''` | `['name']` |
  | `shield-name-invalid` | the override does not match the pattern | `['shieldName']` |
  | `keyboard-name-too-long` | `new TextEncoder().encode(name).length > 16` | `['name']` |

  `ValidationCode` is a string-literal union in `types.ts`. Later features extend it.
- **Rationale**: This is the observability.md shape. `TextEncoder` is a pure standard API available in node and the browser, so the domain stays pure. The 16-byte limit is ZMK's keyboard-name limit: `CONFIG_ZMK_KEYBOARD_NAME` is checked with `BUILD_ASSERT(len <= CONFIG_BT_DEVICE_NAME_MAX)`, and the default is 16 (`docs/zmk/kconfig-options.md` §1). The check uses `strlen`, which counts bytes.
- **Open (not decided here)**: the display name becomes `default "<name>"` in `Kconfig.defconfig` (`docs/zmk/shield-files.md` §4). Whether `"`, `\` and non-ASCII characters need escaping or rejecting is left to the shield-generators feature, which must read the Kconfig string rules first. No rule is guessed here.
- **Alternatives**: counting `name.length` (wrong for non-ASCII text).

## R4. Where issues get their workspace

- **Decision**: The domain does not know workspaces. `src/ui/shell/workspace-issue.ts` keeps `WorkspaceIssue` and adds `WORKSPACE_BY_ISSUE_CODE: Record<ValidationCode, WorkspaceId>`, with every current code mapped to `'schematic'`. `ProjectProvider` computes `issues = toWorkspaceIssues(validateProject(present))` in one `useMemo`. `NO_ISSUES` is deleted, and its four users (`tab-bar`, `issues-panel`, `issues-toggle`, `issues-announcer`) read `useProject().issues`.
- **Rationale**: Workspaces are a UI concept (001). A `Record` over the union fails typecheck when a new code has no workspace.
- **Alternatives**: a `workspaceId` field on `ValidationIssue` (would pull UI vocabulary into the domain).

## R5. Undo history

- **Decision**: A pure reducer in `src/ui/project-history.ts`:
  - state `{ past: readonly Project[]; present: Project; future: readonly Project[] }`;
  - actions `commit(updater)` / `undo` / `redo` / `replace(project)`.

  Details:
  - `commit` pushes `present` onto `past`, capped at `UNDO_LIMIT = 100` (drop oldest), and clears `future`.
  - An updater that returns the same reference is a no-op, so no empty undo step is created (e.g. a blur without a change).
  - `replace` (New, Open) clears both stacks.

  `ProjectProvider` holds it with `useReducer` (ADR 0003, react.md). It lives in `ui/`, not `domain/`, because it knows nothing about keyboards. Unit-tested.
- **Rationale**: Spec clarification 3 says session only, 100 steps. The same-reference check makes "one gesture = one step" hold even when a field blurs unchanged.
- **Alternatives**: storing the history in `localStorage` (rejected by the user); diff or patch history (not needed, since snapshots are small, ADR 0003).

## R6. Storage keys and autosave

- **Decision**: Two keys, both separate from preferences:
  - `zmk-customizer:project`: the current project, as `serializeProject` output;
  - `zmk-customizer:project-backup`: kept damaged data, the raw string as it was read.

  Autosave runs inside the provider's dispatch, the handler that changes the project, as `preferences-context.tsx` already does: `next = reduceProjectHistory(latest, action)`; if it changed and autosave is not blocked, `saveProject(next.present)` → `Result<void, 'unavailable' | 'quota-exceeded'>`. The result goes into provider state, and the save status is derived from it. There is no effect (oxlint `react/set-state-in-effect` forbids storing the save result from one), so loading never writes the main key and nothing is written on mount. A `loadProject` status `unavailable` starts the save status as "not saved".
- **Rationale**: observability.md storage table. `QuotaExceededError` (`DOMException.name === 'QuotaExceededError'`) maps to `quota-exceeded`; any other throw maps to `unavailable`. Autosave keeps being attempted on every change, so the warning clears after the next successful save (FR-005).
- **Alternatives**: debounced save (not needed at this size); a `useEffect` on `present` (react.md listed it, but storing the save result from an effect fails `react/set-state-in-effect`, and it wrote on mount; react.md's effects table is updated in T061).

## R7. Damaged stored project

- **Decision**: `loadProject()` returns `{ project, status, backupText? }`:
  - `status` is one of `'ok'`, `'missing'`, `'unavailable'`, or `{ kind: 'damaged', reason, isBackupBlocked }` with `reason: 'not-json' | 'not-project' | 'newer-version'`;
  - `backupText` is the value of the backup key after loading, or absent. The provider never reads storage itself.

  Backup copy, run by `loadProject` for a damaged main value before it returns:
  - backup slot empty, or already holding the same raw string → write the raw string there (the same value = no write), `isBackupBlocked: false`;
  - backup slot holding a **different** value → write nothing, `isBackupBlocked: true`;
  - the backup `setItem` throws (quota, blocked) → `isBackupBlocked: true`. The value stays only in the main key, so the main key must not be overwritten.

  `isBackupBlocked: true` means the damaged main value has not been copied aside. Autosave is then off (save status `backup-blocked`), and the storage-warning banner says so.

  `loadProject()` is called exactly once, in `main.tsx` before `createRoot().render`, and passed to `ProjectProvider` as `initialLoad`. It is never called inside a React initializer, which `StrictMode` runs twice and which must stay pure.

  Discard, after the confirm dialog, calls `discardBackup()` (`removeItem` on the backup key):
  - it fails → the banner stays, and the announcement is "Could not discard the damaged data.";
  - it succeeds and the status was not `backup-blocked` → `backupText` is cleared and the banner goes;
  - it succeeds while `backup-blocked` → `backupDamagedProject()` copies the still-untouched raw main value into the now-empty slot. On success `backupText` becomes that value, the banner now describes it as found on this visit, and autosave turns back on. On failure the status stays `backup-blocked`.

  No damaged value is overwritten before it has been copied.

  The banner has two texts, chosen by `backupOrigin` in the provider:
  - `'now'` (the status is `damaged` and not blocked, or after `backupDamagedProject`): "The project saved in this browser could not be read (<reason>). A new project was started; the damaged data is kept."
  - `'earlier'` (a backup kept from a previous visit, or the old backup while blocked): "Damaged project data from an earlier visit is still kept in this browser."

  The reason text comes from `status.reason`, which always describes the main value. That is also the value copied when the origin is `'now'`.
- **Rationale**: FR-006 and SC-004: nothing damaged is overwritten without confirmation, even for double damage or a failing backup write, and there is still only one backup slot. A newer `schemaVersion` in storage (a newer app open in another tab, then this old cached build) is handled the same way.
- **Alternatives**: a list of backups (unbounded, more UI); refusing to start (the spec says a new project opens); storing the reason next to the backup (another key; the "earlier" wording does not need it).

## R8. File format and parsing

- **Decision**:
  - `serializeProject(project)` = `JSON.stringify(projectSchema.parse(project), null, 2) + '\n'`. Parsing through the schema puts keys in schema order no matter how the object was built (e.g. after a spread in `setShieldName`), so a saved file and the same project after a reload are byte-identical. `parse` on a domain-built project cannot fail; if it does, that is a programmer error and it throws.
  - `parseProjectFile(raw: string): Result<Project, ProjectFileError>` runs these steps in order, and the first failure wins:
    1. `JSON.parse` in try/catch → `{ kind: 'not-json' }`
    2. `schemaVersion` is a positive integer → otherwise `{ kind: 'not-project', issues }`
    3. version `> CURRENT_SCHEMA_VERSION` → `{ kind: 'newer-version' }`
    4. `migrateProject` steps `vN → vN+1`
    5. `projectSchema.safeParse` → `{ kind: 'not-project', issues: zod issue paths + messages }`
  - Unknown keys are stripped (zod default, FR-011).
  - `shieldName` uses `z.string().exactOptional()` (zod 4.6, installed), so the schema `satisfies z.ZodType<Project>` under `exactOptionalPropertyTypes`.
  - The same parser serves both storage and imported files.
- **Rationale**: One trust boundary. The version is checked before migration, so a newer file is never mis-migrated. Migrations run before the schema, so the schema always describes only the current version.
- **Alternatives**: a per-version zod schema for every old version (not needed: each migration takes `unknown`-shaped old data that the version check has confirmed).

## R9. Migration chain

- **Decision**: `src/storage/migrate-project.ts` exports `CURRENT_SCHEMA_VERSION = 1` and `migrateProject(data, fromVersion)`, which applies `MIGRATIONS[fromVersion]` … up to current. At v1 the table is empty. Each later feature adds `migrate-vN-to-vN+1.ts` with a test that loads a stored vN fixture (spec 003 adds v1 → v2). A v1 fixture `tests/fixtures/project/v1.json` is committed now and must load forever (SC-002).
- **Rationale**: ADR 0003. The fixture turns "old files keep loading" into a test.
- **Alternatives**: none worth recording.

## R10. Import file reading

- **Decision**: `readImportFile(file: File): Promise<Result<Project, ProjectFileError>>` in `src/storage/read-import-file.ts`:
  - `file.size > MAX_PROJECT_FILE_BYTES` (5 MB) → `{ kind: 'too-large' }` before reading anything;
  - otherwise `await file.text()` in try/catch (a failure maps to `not-json`), then `parseProjectFile`.

  The picker is a hidden `<input type="file" accept=".json,application/json">` inside the project bar, opened with `.click()` from the Open confirm button's click handler (a user gesture is required). A cancelled picker changes nothing.
- **Rationale**: FR-010 and US4.4 ("rejected without being read in full"). No File System Access API: it is not supported in Firefox or Safari.
- **Alternatives**: `showOpenFilePicker` (support gaps); dropping a file onto the page (not asked for).

## R11. File download

- **Decision**: `downloadTextFile({ fileName, text })` in `src/ui/download-text-file.ts`:
  - build a `Blob`, get a URL from `URL.createObjectURL`, click a temporary `<a download>`, then `revokeObjectURL`;
  - the save file is named `${getShieldName(project) || 'keyboard'}.json`;
  - the same helper downloads the raw backup, as `damaged-project.json`.

  A throw (blocked download) is caught and reported through the status region ("Could not save the file.").
- **Rationale**: AGENTS §4 prefers browser APIs. Downloading is UI I/O, so it is not in `storage/`. The spec says Save is never blocked by problems.
- **Alternatives**: `showSaveFilePicker` (Chromium only).

## R12. Shortcuts: Mod+Z / Mod+Shift+Z / Mod+S / Mod+O

- **Decision**: Add `scope: 'project'` entries to `SHORTCUTS`:

  | Id | Keys | Action |
  |---|---|---|
  | `undo` | `code: 'KeyZ'`, `shift: false` | Undo |
  | `redo` | `code: 'KeyZ'`, `shift: true` | Redo |
  | `save-project` | `code: 'KeyS'` | Save to file |
  | `open-project` | `code: 'KeyO'` | Open a file |

  `matchShortcut` gets a branch before the current ctrl/meta bail-out. It requires `(ctrlKey || metaKey) && !altKey`, still returns `undefined` for typing targets and open dialogs (FR-018), and matches by `code`. `getShortcutAction` returns `{ kind: 'undo' | 'redo' | 'save-project' | 'open-project' }`, which `useGlobalShortcuts` routes to the project context and project bar actions. `event.repeat` repeats undo and redo only (added to `REPEATABLE_SHORTCUT_IDS`). The help dialog adds a "Project" table (`{primary}+Z`, `{primary}+Shift+Z`, `{primary}+S`, `{primary}+O`). Contract: `contracts/shortcuts.md`.
- **Rationale**:
  - `code` rather than `key`: with a Cyrillic layout, `key` is `я`, not `z`. The user base includes such layouts, and 001 already matches globals by `code`.
  - Accepting either Ctrl or Cmd keeps it platform-free; Ctrl+Z on a Mac is unused by browsers.
  - `preventDefault` suppresses the browser's own Save page and Open file actions, which are useless here. Chrome, Firefox and Safari allow preventing Mod+S and Mod+O from a page; verify in quickstart as 001 did (T071 style).
- **Alternatives**: Ctrl+Y redo on Windows (not asked for; add on request); Alt+Shift combos (not the platform convention for undo or save).

## R13. Project bar layout

- **Decision**: `ProjectBar` becomes:
  - a name field: visible label "Name" (the `Field` default label style; no size variant is added), `h-8` text input;
  - a technical name field: label "Technical name", with the derived value as `placeholder`, and the override as its value when one is set;
  - the save status (plain text);
  - buttons New, Open, Save, Undo, Redo.

  The header changes from a fixed `h-12` to `min-h-12 flex-wrap py-2`, so a field with an issue message below it, or 200% zoom, wraps instead of clipping (accessibility.md "Reflow": no fixed heights except `h-8` controls).

  Both fields use the draft/commit pattern of `grid-size-field.tsx`: the draft is kept while focused, committed on blur or Enter, restored on Escape. Committing the technical name commits `setShieldName(project, { shieldName: text === '' ? undefined : text })`. Committing the display name commits `renameProject`. Each field carries `data-issue-path` (`name` / `shieldName`) and shows its issues through `Field` `error`. Undo and Redo use `isDisabled` (aria-disabled, stay focusable) with hint "Nothing to undo" / "Nothing to redo".
- **Rationale**:
  - accessibility.md: every input has a visible label, and placeholder is never the label; here the placeholder only shows the derived value.
  - An empty override means "derive", which is the spec's "clear the override".
- **Alternatives**: a separate project settings dialog for the names (hides the technical name the spec wants shown next to the name).

## R14. Problems panel: activate focuses the entity

- **Decision**: Each issue in `IssuesPanel` becomes a `<button>` with `issue.message` as its text (admin-ui.md "Validation display"). Activating it focuses `document.querySelector('[data-issue-path="<path joined by .>"]')`. The attribute is placed on the control that owns the path. Workspace switching is not needed here (the project bar is visible in every workspace). Later features use the same attribute name, `data-issue-path`, on their controls, and extend this one handler, for example by switching workspace or opening the parts list first (spec 003). They do not replace it.
- **Rationale**: This is the smallest generic mapping from a path to an element. It serves spec 003 as-is.
- **Alternatives**: a registry of refs in context (react.md allows no new contexts).

## R15. Messages: banners and status region

- **Decision**: One banner area below the header, `ProjectMessages` in `ui/shell/`. It renders from project context state:
  - storage warning: `role="alert"`, persistent while the save status is not saved;
  - damaged-data banner: `role="alert"`, with buttons "Download damaged data" and "Discard damaged data…", where Discard opens a confirm dialog with the button "Discard damaged data";
  - rejected-file banner: `role="alert"`, with a dismiss button; for `not-project` it lists up to 10 issues, each as "path: message".

  `IssuesAnnouncer` becomes `StatusMessage` in `ui/shell/status-message.tsx`. That is the admin-ui.md primitive's name; it lives in `shell/` because it reads the project context. It is still the single polite `<output>`, always mounted, and it is empty on load (the initial state is not announced).

  Its content is `<span key={announcement.id}>{announcement.text}</span>`. Only the inner span is remounted per announcement: screen readers ignore a live region that is inserted already filled, but they announce a new child in a mounted region, so a repeated "Undone" is spoken every time.

  `announcement = { text, id }` lives in the provider; `announce(text)` increments `id`. Precedence: the provider builds one text per change.
  - `undo` → "Undone"; `redo` → "Redone"; an accepted Open → "Opened <file>"; New → "Started a new project"; save failures → "Could not save the file." and so on.
  - If the change also changed the issue count, the count is appended: "Undone. 2 problems".
  - A `commit` announces only when the issue count changed (the count text, for example "1 problem"). Otherwise it leaves the previous announcement in place without re-announcing it (same `id`).

  The count is compared inside the provider's handlers, via `validateProject` on the old and new project. There is no effect.
- **Rationale**: accessibility.md: one polite region, alerts announced once, never per keystroke or per autosave. The 10-issue cap keeps a foreign JSON file from producing hundreds of lines.
- **Alternatives**: toast stack (not needed).

## R16. New project and Open confirmation

- **Decision**: Both go through the existing `Dialog` primitive.
  - **New**: "Start a new project?", with the text "The current project will be replaced. Save it to a file first if you want to keep it." Buttons: "Save to file" (secondary; downloads, keeps the dialog open), "Start new project" (danger), "Cancel".
  - **Open**: "Open a project file?", with the same text. Buttons: "Save to file", "Choose file…" (primary; closes the dialog and opens the picker), "Cancel".

  An accepted file dispatches `replace`. Focus returns to the opener natively.

  Dialog open flags are UI state (react.md "Project state"):
  - `isNewDialogOpen`, `isOpenDialogOpen` and `isDiscardDialogOpen` live in `src/ui/use-shell-dialogs.ts`, next to the settings and help flags.
  - `App` mounts `ProjectDialogs` (`src/ui/shell/project-dialogs.tsx`) next to the settings and help dialogs, and passes it the flags and close handlers. It passes the open handlers to `ProjectBar` (New, Open) and `ProjectMessages` (Discard).
  - `useGlobalShortcuts` receives `handleOpenDialogOpen`, just as it receives `handleSettingsOpen`.

  The hidden file input is rendered by `ProjectDialogs` outside any `<dialog>`. `Dialog` unmounts its children when closed, which would drop the `change` event. The input is reached through a local `useRef`.

  "Choose file…" closes the Open `<dialog>` synchronously with `event.currentTarget.closest('dialog')?.close()`, and only then calls `inputRef.current?.click()`. `Dialog` otherwise closes in an effect, and while the modal is open the rest of the page is inert. The `close` event calls `onClose`, which clears the flag. Quickstart 5 checks that the picker opens in Chrome, Firefox and Safari.

  The project context holds project data (history, issues, save status) and three pieces of transient UI state: backup text and origin, rejected-file error, announcement. These are in the context only because several shell components read them (ProjectBar, ProjectMessages, ProjectDialogs, StatusMessage) and react.md allows no new context. Dialog flags are not in it.
- **Rationale**: admin-ui.md: a confirm dialog only for what undo cannot restore, and the button names the action. Spec clarification 2.
- **Alternatives**: none.

## R17. Error boundary

- **Decision**: Add `src/ui/error-boundary.tsx`, the only class component, around `<App/>` in `main.tsx`. Its fallback shows the error message, and the stack inside a `<details>`. Two buttons: "Download saved project" (reads the raw `zmk-customizer:project` string via `readStoredProjectText()`, never the in-memory state, and downloads it as-is) and "Reload".
- **Rationale**: observability.md "Crashes". It is needed now because this is the first feature with user data to rescue. It never writes storage.
- **Alternatives**: postponing to a later feature (the rule applies as soon as there is data to lose).

## R18. Testing scope

- **Decision**: Vitest, node environment, no jsdom (same as 001 R13). Tests first:
  - domain: `toShieldName`, `getShieldName`, `createProject`, `renameProject`, `setShieldName`, `validateProject`
  - storage: `serializeProject`, `parseProjectFile` (each error kind, unknown key stripped, v1 fixture), `migrateProject`, `loadProject`, `saveProject`, `discardBackup` and backup-copy rules with a `Storage` stub (as in `preferences.test.ts`), `readImportFile` with a `File` (a node 24 global)
  - ui pure: `project-history` reducer (cap, redo cleared, same-ref no-op, replace), `matchShortcut` and `getShortcutAction` for the new ids, `toWorkspaceIssues`

  UI behaviour is covered by `quickstart.md`, including the accessibility pass.
- **Rationale**: AGENTS §4 and 001 R13.
