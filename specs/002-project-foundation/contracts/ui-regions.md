# Contract: UI regions (delta to spec 001)

Extends `specs/001-app-shell-ui/contracts/ui-regions.md`. Only changed or new regions are listed here.

| Region | Element | Accessible name | Content |
|---|---|---|---|
| Project bar | `<header>` (`min-h-12 flex-wrap py-2`, no fixed height) | — | The items below, in this order; wraps at narrow widths and 200% zoom. |
| · Name field | `<input type="text">` | label "Name" (visible) | Display name. Draft while focused; commits on blur or Enter; Escape restores. `data-issue-path="name"`. Shows issue messages; `aria-invalid` when it has issues. |
| · Technical name field | `<input type="text">` | label "Technical name" (visible) | The override value, or empty with the derived name as placeholder. Empty on commit = derive. `data-issue-path="shieldName"`. |
| · Save status | plain text | — | One of the save-status texts (`data-model.md`). Not a live region. |
| · New, Open, Save | `Button` | "New", "Open", "Save" | Always available. |
| · Undo, Redo | `Button` | "Undo", "Redo" | `aria-disabled` + hint "Nothing to undo" / "Nothing to redo" when the stack is empty. |
| Project messages | `<div>` below the header | — | 0–3 banners, each `role="alert"`: storage warning (also shown while `backup-blocked`), damaged data (text for "found now" or "kept from an earlier visit"; buttons "Download damaged data", "Discard damaged data…"), rejected file (message, issue list, "Dismiss"). |
| Status message (`StatusMessage`, `ui/shell/status-message.tsx`) | `<output>` (the one polite region, always mounted, empty on load) | — | `<span key={id}>` with the latest announcement: "Undone", "Redone", "Opened <file>", "Started a new project", "Could not save the file.", "Could not discard the damaged data."; the issue count is appended when a change altered it ("Undone. 2 problems"), and an edit that only changes the count announces the count (research R15). |
| Problems panel item | `<button>` per issue | issue message | Activating it focuses `[data-issue-path="<path>"]`. |
| New project dialog | `Dialog` | "Start a new project?" | Buttons: "Save to file", "Start new project" (danger), "Cancel". |
| Open project dialog | `Dialog` | "Open a project file?" | Buttons: "Save to file", "Choose file…" (primary), "Cancel". "Choose file…" closes the `<dialog>` synchronously, then clicks the hidden `<input type="file" accept=".json,application/json">` rendered by `ProjectDialogs` outside any dialog. |
| Discard backup dialog | `Dialog` | "Discard damaged data?" | "It cannot be recovered afterwards." Buttons: "Discard damaged data" (danger), "Cancel". |
| Error boundary fallback | replaces the app | heading "Something went wrong" | Message, stack in `<details>`, buttons "Download saved project" and "Reload". |

The "Not available yet" hints from spec 001 R11 are removed from all five project actions.


All three dialogs are rendered by `ProjectDialogs`, mounted in `App` next to the settings and help dialogs. Their open flags live in `use-shell-dialogs.ts`.
