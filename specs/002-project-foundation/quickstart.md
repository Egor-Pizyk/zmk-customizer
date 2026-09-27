# Quickstart: Project foundation validation

## Prerequisites

`make up`, then open http://localhost:5173 in a fresh profile (or clear site data). `make check` must pass.

## Automated

`make check`. Unit tests cover the naming rules, validation codes, history reducer, parse/migrate/serialize, storage failure modes, import size limit and shortcut matching (`research.md` R18).

## Manual scenarios

1. **First visit** (US1.1): the project bar shows Name "My keyboard", technical name placeholder `my_keyboard` and "Saved in this browser". Undo and Redo are unavailable with hints. No problems.
2. **Autosave** (US1.2, SC-001): rename to `My Corne v2!` and press Enter. The technical name placeholder shows `my_corne_v2`. Reload: the same name is shown. In DevTools, `localStorage['zmk-customizer:project']` equals `contracts/project-file.md` format.
3. **Undo/redo** (US2): rename A, B, C (Enter after each).
   - Press Undo ×3 → the original name returns and Undo is unavailable. With a screen reader running, "Undone" is spoken on each of the three presses, not only the first.
   - Mod+Shift+Z ×2 → B.
   - Rename to D → Redo is unavailable.
   - Focus the Name field, type, press Mod+Z → only the field text is undone.
4. **Names and problems** (US6):
   - Rename to `!!!` → Problems (1), Schematic badge 1, and the field shows the message. Activating the problem focuses the Name field.
   - Type `corne` into Technical name → problem gone. Save → file `corne.json`.
   - Clear Technical name → problem back.
   - Type `2Corne` as the technical name → the invalid-technical-name problem.
   - Rename to `A very long keyboard name` → too-long problem.
5. **Save/Open round trip** (US3, SC-002, SC-005):
   - Save → `<technical name>.json` (content: format only, no dates).
   - New → confirm "Start new project" → "My keyboard", Undo unavailable.
   - Open → "Choose file…" → pick the saved file → the same project, Undo unavailable, status says "Opened …".
   - Open → Cancel → nothing changes. Open → Choose file… → cancel the picker → nothing changes.
   - In Chrome, Firefox and Safari: "Choose file…" opens the system file picker (the modal is closed first, so the input is not inert). Record the result in tasks.md.
6. **Rejected files** (US4, SC-003): open each of the following. Each shows its message in an alert banner, and the name, the undo availability and `localStorage` are unchanged.
   - a `.txt` with `hello` → not a project file
   - `{"foo":1}` → issue at `schemaVersion`
   - `{"schemaVersion":1,"name":5}` → `name: …`
   - `{"schemaVersion":99,"name":"x"}` → newer version
   - a 6 MB file → too large
7. **Damaged storage** (US5, SC-004). Also check the double-damage case: with `project-backup = 'A'` and `project = 'B{'`, reload → the save status shows backup-blocked, the storage warning says autosave is off, and the banner says the data was kept from an earlier visit. Download gives `A`. Discard → the banner now says the data could not be read on this visit, and download gives `B{`. Rename → autosave works. Main steps:
   - Set `localStorage['zmk-customizer:project'] = '{broken'` and reload → a new project and the damaged-data banner.
   - "Download damaged data" → the file content is exactly `{broken`.
   - Rename → autosave works, and `project-backup` still holds `{broken`.
   - "Discard damaged data…" → Cancel → still kept. Discard → confirm → the banner is gone. Reload → no banner.
   - Repeat with `{"schemaVersion":99}` → the banner says newer version.
8. **Storage blocked** (US1.3): block site data (Chrome: Settings → Site settings → block for localhost) and reload.
   - The status shows "Not saved: browser storage is blocked", and a warning banner is announced once.
   - Rename and Undo still work.
9. **Shortcuts** (contracts/shortcuts.md):
   - In Chrome, Firefox and Safari (macOS): Mod+Z, Mod+Shift+Z, Mod+S, Mod+O act and do not open the browser's own dialogs.
   - Mod+S in the Name field → the browser's own behavior.
   - With the settings dialog open → no project action.
   - Help (Alt+Shift+/) lists a "Project" table.
   - Switch to a Russian keyboard layout: Mod+Z still undoes.
10. **Error boundary**: in the DevTools console, throw inside a render (temporarily, dev only) or use the React DevTools "trigger error" on `App`. The fallback shows the message, and "Download saved project" gives the stored JSON. Storage is untouched.
11. **Accessibility pass** (accessibility.md checklist 1–10), with the new controls: project bar fields, the three dialogs, the banners and problem buttons. Keyboard only, screen reader announcements ("Undone" once, alerts once), dark mode contrast, 200% zoom at 1280px (the project bar wraps without clipping).
