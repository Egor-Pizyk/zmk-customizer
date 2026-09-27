# Implementation Plan: Project foundation

**Branch**: `002-project-foundation` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-project-foundation/spec.md`

## Summary

This feature gives the app one keyboard project, `{ schemaVersion: 1, name, shieldName? }`.

- **Autosave.** Every change is saved to `localStorage` and restored on load. Storage failures show a save status and a banner.
- **File round-trip.** Save downloads the project as JSON. Open reads a JSON file through one zod-parsed trust boundary with a migration chain; rejected files leave the project unchanged. Damaged stored data is copied to a backup key and never overwritten without confirmation.
- **Undo/redo.** A session-only history of 100 steps, from project bar buttons and Mod+Z / Mod+Shift+Z (matched by `code`). Mod+S and Mod+O save and open.
- **Name and technical name.** The project bar gains name and technical-name fields. The technical name is derived from the name unless the user overrides it. Three validation codes feed the problems panel, which becomes real: issue buttons focus their field.
- **New and Open confirm first.** Both open a dialog before replacing the project, and both start a fresh history.
- **Error boundary.** A root error boundary offers the raw stored project for download.

No generators and no ZMK syntax change.

## Technical Context

**Language/Version**: TypeScript 7 (strict, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`), ES2024, Vite 8

**Primary Dependencies**: React 19, zod 4.6 (already installed; `storage/` only), Tailwind v4. No new dependencies.

**Storage**: `localStorage` keys `zmk-customizer:project` and `zmk-customizer:project-backup`; downloaded `.json` files (`contracts/project-file.md`). Preferences key unchanged.

**Testing**: Vitest, node environment, no jsdom (research R18). Tests first for domain and storage. UI is verified by `quickstart.md`.

**Target Platform**: current desktop Chrome, Edge, Firefox, Safari; static files (ADR 0001)

**Project Type**: static single-page web app

**Performance Goals**: A commit, undo or autosave feels instant. The project is tiny here; snapshot history stays cheap up to hundreds of keys (ADR 0003).

**Constraints**:
- offline only, no network APIs;
- the project JSON contains only what the user typed;
- one gesture = one commit;
- no `console.*`;
- WCAG 2.2 AA.

**Scale/Scope**: one project; history capped at 100 snapshots; import limit 5 MB

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 — still passes.*

| Principle | Status | How |
|---|---|---|
| I. Correct output over features | Pass (n/a) | No generator changes. |
| II. Domain first | Pass | Naming rule, override, validation are pure `src/domain/` functions with tests; UI only commits them. The history reducer is generic (no keyboard rules), in `ui/` per react.md. |
| III. Static only | Pass | `localStorage`, `File.text()`, `Blob` + `createObjectURL`; no fetch. |
| IV. User data untrusted | Pass | One `parseProjectFile` for files and storage; `Result`, never throws; version check before migration; rejects leave state and storage deep-equal (US4, SC-003); damaged storage backed up (R7). |
| V. ZMK options explain themselves | Pass (n/a) | No catalog options. The 16-byte rule message cites the limit. |
| VI. Minimal code | Pass | Two domain ops, one parser, one storage module, reducer, no new contexts or primitives besides a text input use of `Field`. Error boundary is required by observability.md now that data exists (R17). |
| VII. Deterministic | Pass | `serializeProject` fixed indent, schema key order, trailing `\n`; no timestamps. |
| VIII. Accessible | Pass | Visible labels, `aria-invalid` + described-by, problem buttons focus the field, one polite region + alerts, native dialogs, shortcuts not in text fields. |
| Workflow: roadmap order | Pass | Roadmap 002. Note: `specs/003-schematic-switches-wires` is not roadmap 003 (shield-generators); its own plan records that deviation and fixes the roadmap in its first task. Not touched here. |
| Constraints: layers | Pass | `ui → storage → domain`; `domain` imports nothing; `WorkspaceId` stays in UI (R4). |

## Project Structure

### Documentation (this feature)

```text
specs/002-project-foundation/
├── plan.md
├── research.md          # R1–R18
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── project-file.md  # JSON format, reading rules, storage keys
│   ├── shortcuts.md     # Mod+Z / Mod+Shift+Z / Mod+S / Mod+O
│   └── ui-regions.md    # project bar, banners, dialogs, status region
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/domain/                          new folder (first domain code)
  types.ts                           Project, ValidationCode, ValidationIssue, Result
  create-project.ts (+ test)
  rename-project.ts (+ test)
  set-shield-name.ts (+ test)
  to-shield-name.ts (+ test)         derivation rule (R2)
  get-shield-name.ts (+ test)        override ?? derived
  validate-project.ts (+ test)       3 codes (R3)
  assert-never.ts                    typescript.md exhaustiveness helper (first switch over a union needs it)

src/storage/
  project-schema.ts                  zod v1, satisfies z.ZodType<Project> (R8)
  migrate-project.ts (+ test)        CURRENT_SCHEMA_VERSION = 1, empty table (R9)
  parse-project-file.ts (+ test)     Result<Project, ProjectFileError>
  serialize-project.ts (+ test)
  project-storage.ts (+ test)        loadProject (incl. backupText), saveProject, backupDamagedProject, discardBackup, readStoredProjectText (R6, R7)
  read-import-file.ts (+ test)       size check + file.text() (R10)

tests/fixtures/project/v1.json       compatibility fixture (read in tests via `?raw`), never edited

src/ui/
  project-history.ts (+ test)        reducer, UNDO_LIMIT (R5)
  project-context.tsx                ProjectProvider({ initialLoad }) + useProject: project, issues, history flags,
                                     commit, undo, redo, replace, save status, backup, rejected file, announcement (R4–R7, R15)
  use-shell-dialogs.ts               + New / Open / Discard dialog flags (UI state stays out of the project context, R16)
  download-text-file.ts              Blob download (R11)
  error-boundary.tsx                 root fallback (R17)
  shortcuts.ts (+ test)              + 'project' scope entries, matching branch (R12)
  shortcut-actions.ts (+ test)       + undo/redo/save/open actions
  use-global-shortcuts.ts            route new actions
  app.tsx                            mount ProjectMessages, ProjectDialogs, StatusMessage; pass dialog flags
  shell/project-bar.tsx              min-h-12 flex-wrap header, name + technical name fields, working actions (R13)
  shell/project-messages.tsx         storage / damaged / rejected-file banners (R15)
  shell/project-dialogs.tsx          New, Open, Discard confirm dialogs + hidden file input and its change handler (R16) — split if it grows
  shell/format-project-file-error.ts (+ test)   rejected-file title and lines, 10-line cap (R15)
  shell/workspace-issue.ts (+ test)  WORKSPACE_BY_ISSUE_CODE, toWorkspaceIssues; NO_ISSUES removed (R4)
  shell/issues-panel.tsx             issue buttons that focus [data-issue-path] (R14)
  shell/issues-toggle.tsx, tab-bar.tsx   read useProject().issues
  shell/issues-announcer.tsx → shell/status-message.tsx   StatusMessage: mounted <output>, keyed inner span (R15)
  shell/shortcut-help-dialog.tsx     + "Project" table
src/main.tsx                         loadProject() once before render (R7); ErrorBoundary > PreferencesProvider > ProjectProvider initialLoad > App

docs/roadmap.md                      002 open decisions resolved + recorded deviations + Kconfig-escaping open item (T062)
docs/guidelines/frontend/*.md        shortcut lines, StatusMessage location (T061)
specs/003-schematic-switches-wires/  aligned with 002: data-issue-path, workspace mapping in UI, shieldName in v2, fixture/test locations
```

**Structure Decision**: This is the existing single-app layout (AGENTS §3.1). `src/domain/` is created now because its first file is needed. No `generators/` or `catalog/` changes.

## Complexity Tracking

No constitution violations.

## Implementation notes (after /speckit-implement)

Where the code differs from the tree above:
- **Autosave** runs in the provider's dispatch, not in an effect (research R6). oxlint `react/set-state-in-effect` rejects storing the save result from an effect.
- **Provider split** to stay under `max-lines-per-function`:
  - `ui/project-state.ts` (+ test): the pure-ish state transitions (history, autosave, announcements, backup discard);
  - `ui/project-file-actions.ts`: Save, Open, New and the damaged-data download or discard;
  - `project-context.tsx` only wires them together.
- **Shared draft field.** `ui/shell/draft-text-field.tsx` is the draft/commit text field used by both project-bar fields.
- **Dialogs.**
  - `ui/shell/shell-dialogs.tsx` mounts the settings, help and project dialogs (keeps `app.tsx` under `import/max-dependencies`).
  - `use-shell-dialogs.ts` holds a single `openDialogId`, since modals are exclusive.
