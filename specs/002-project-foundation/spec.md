# Feature Specification: Project foundation

**Feature Branch**: `002-project-foundation`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "Study the roadmap and add the new feature number 2; write its specification first, even though spec 3 is already written: we build 2 first, then 3." Feature text from `docs/roadmap.md` → 002: "Project foundation for ZMK Customizer, a tool that lets people describe a custom keyboard and download ZMK firmware configuration files. The app already has its frame: a Schematic workspace that owns the keyboard project, and a project bar with New, Open, Save, Undo and Redo that are shown but not yet available. This feature makes them work. Users need a single keyboard project that is never lost: it is saved automatically in the browser and restored when they come back, it can be saved to a file and opened again (to back it up, move it to another computer, or share it), and every edit can be undone and redone from the project bar or the keyboard. Project files from older versions of the tool must keep loading. A broken or foreign file must be rejected with a clear message and must never damage the project the user currently has open; damaged saved state must not be silently thrown away. The project has a display name, shown in the project bar, from which the keyboard's technical name is derived (lowercase letters, digits and underscores only); an unusable name is reported in the problems panel. The save status in the project bar tells the user whether their work is saved. The user can start a new empty project after confirming. Out of scope: keyboard content, file generation, managing several projects."

## Context

Spec 001 built the app frame: four workspaces, a project bar with name "Untitled keyboard", status "Nothing to save" and five unavailable actions (New, Open, Save, Undo, Redo), a problems panel that always reports zero, and a shortcut help window. This feature gives the app a keyboard project and makes those five actions, the name and the save status real. The project holds only its name here; later features (spec 003 schematic keys and wires, then layout, wiring, bindings, settings) add their content to the same project and get autosave, file save/open and undo for free. The Schematic workspace owns the project: its problems are counted on the Schematic tab.

## Clarifications

### Session 2026-09-27

- Q: Two tabs open — autosave behavior? → A: Last write wins, no detection or sync (accepted risk).
- Q: Open a file — confirm + fresh history, or undoable without dialog? → A: Confirm dialog, then fresh undo history (spec as written).
- Q: Undo history survive reload? → A: No; page session only, capped at 100 steps.
- Q: Technical name always derived, or user-overridable? → A: Derived by default; user can override it; clearing the override returns to the derived name.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Work is never lost between visits (Priority: P1)

The user names their keyboard in the project bar, closes the tab, and comes back later. The project is exactly as they left it. The project bar tells them their work is saved in this browser. If the browser cannot store anything (private mode, storage blocked or full), the app keeps working and a persistent warning says that autosave is off and they should save to a file to keep their work.

**Why this priority**: Every later feature puts hours of user work into the project. Losing it on reload would make the tool unusable.

**Independent Test**: Rename the project to "My Corne v2!", reload the page — the project bar shows "My Corne v2!" and "Saved in this browser". Block site storage in the browser, reload — the app opens with a new project, shows the autosave-off warning, and renaming still works.

**Acceptance Scenarios**:

1. **Given** a first-ever visit, **When** the app loads, **Then** a new project named "My keyboard" is open and the save status shows it is saved in this browser.
2. **Given** the user changed the project, **When** they reload the page or come back days later in the same browser, **Then** the project is restored exactly as it was after their last change.
3. **Given** browser storage is unavailable or full, **When** the user makes a change, **Then** the change is kept in the open page, the save status says the project is not saved and why, and a persistent warning (announced once) tells the user to save to a file.
4. **Given** autosave works, **When** the user edits, **Then** the save status does not flicker on every edit.

---

### User Story 2 - Undo and redo every change (Priority: P1)

Every change to the project can be undone and redone, from the project bar buttons and from the keyboard (Cmd+Z / Cmd+Shift+Z on macOS, Ctrl+Z / Ctrl+Shift+Z elsewhere). One user action is one undo step. Undo and Redo are unavailable when there is nothing to undo or redo. After an undo, a new change discards the redo steps. The status region announces "Undone" / "Redone".

**Why this priority**: Undo is the safety net that later editors rely on instead of confirmation dialogs (delete key, delete layer).

**Independent Test**: Rename the project three times (A, B, C). Undo three times — names go C → B → A → original; Undo is then unavailable. Redo twice — A → B → C. Undo once and rename to D — Redo becomes unavailable.

**Acceptance Scenarios**:

1. **Given** N changes were made, **When** the user undoes N times, **Then** each previous state is restored in reverse order and Undo becomes unavailable.
2. **Given** some changes were undone, **When** the user redoes, **Then** they are reapplied in order until Redo becomes unavailable.
3. **Given** some changes were undone, **When** the user makes a new change, **Then** the redo steps are discarded and Redo becomes unavailable.
4. **Given** focus is in a text field, **When** the user presses Cmd/Ctrl+Z, **Then** the browser undoes the typing in the field, not a project change.
5. **Given** a modal window is open, **When** the user presses the undo shortcut, **Then** nothing happens to the project.
6. **Given** the user undid a change, **When** the page autosaves, **Then** the restored (undone) state is what is saved.
7. **Given** the shortcut help window is opened, **When** it is shown, **Then** it lists the undo and redo shortcuts (and the Save and Open shortcuts) with their platform names.

---

### User Story 3 - Save the project to a file and open it again (Priority: P1)

The user presses Save in the project bar (or Cmd/Ctrl+S) and gets a project file named after the keyboard (e.g. `my_corne_v2.json`). On another computer, or after clearing the browser, they press Open (or Cmd/Ctrl+O), confirm that the open project will be replaced, pick the file, and get exactly the same project back. Files saved by older versions of the tool still open; they are upgraded to the current format when opened.

**Why this priority**: The file is the backup, the way to move a project between computers, and the way to share it or attach it to a bug report.

**Independent Test**: Rename the project, Save, start a new project, Open the saved file — the project is identical to the one saved (same name, same content).

**Acceptance Scenarios**:

1. **Given** any project, **When** the user activates Save, **Then** a file named `<technical name>.json` is downloaded, containing the whole project and nothing else (no dates, device or browser information).
2. **Given** the technical name is empty, **When** the user saves, **Then** the file is named `keyboard.json`; saving is never blocked by problems.
3. **Given** a saved file, **When** the user opens it after confirming the replace, **Then** the opened project is identical to the saved one and becomes the autosaved project.
4. **Given** the confirmation dialog for Open, **When** the user cancels it or cancels the file picker, **Then** the current project is unchanged.
5. **Given** a file saved by an older version of the tool, **When** it is opened, **Then** it loads with the same content, upgraded to the current format.
6. **Given** a project was opened from a file, **When** the user presses Undo, **Then** nothing from before the open is restored (opening starts a fresh history).

---

### User Story 4 - Broken or foreign files never damage the open project (Priority: P1)

The user opens a file that is not a project file (a photo, a keymap, a truncated download, a project from a newer version of the tool). The tool rejects it with a message that says what is wrong in plain words, and the project that was open stays exactly as it was.

**Why this priority**: A bad file must never cost the user their current work; this is a core principle of the tool (user data is untrusted).

**Independent Test**: Open a text file with "hello", a JSON file with the wrong shape, and a project file with a newer format version; each time a clear message appears and the current project (name, undo history) is unchanged.

**Acceptance Scenarios**:

1. **Given** a file that is not valid JSON, **When** it is opened, **Then** the message says the file is not a project file and could not be read; the current project is unchanged.
2. **Given** valid JSON that is not a project (or has missing or wrong fields), **When** it is opened, **Then** the message lists each problem with where it is in the file (for example "name: expected text"); the current project is unchanged.
3. **Given** a project file made by a newer version of the tool, **When** it is opened, **Then** the message says "This file was made by a newer version of ZMK Customizer." and nothing changes.
4. **Given** a file larger than any real project could be, **When** it is opened, **Then** it is rejected without being read in full, with a message saying it is too large.
5. **Given** any rejected file, **When** the message is shown, **Then** it is announced to assistive technology and can be dismissed.

---

### User Story 5 - Damaged saved state is kept, not thrown away (Priority: P2)

On startup the project stored in the browser cannot be read (damaged, hand-edited, or from a newer version of the tool open in another tab). The app does not crash and does not silently discard it. It opens a new project, explains what happened, keeps the damaged data aside, and offers to download it as a file. The damaged data is only discarded after the user confirms.

**Why this priority**: Rare, but when it happens the stored data may be the only copy of the user's work.

**Independent Test**: Put invalid text into the app's stored project, reload — a message explains the stored project could not be read; "Download damaged data" gives back the exact stored text; the new project autosaves without touching it; after "Discard damaged data" and confirming, the message goes away and does not return on reload.

**Acceptance Scenarios**:

1. **Given** the stored project cannot be read, **When** the app starts, **Then** a new project is opened, a persistent message explains that the saved project could not be read and why, and the damaged data is kept unchanged.
2. **Given** the message is shown, **When** the user chooses to download the damaged data, **Then** they get a file with exactly the stored text.
3. **Given** the message is shown, **When** the user edits the new project, **Then** it autosaves without overwriting the kept damaged data, and the message stays until the data is discarded.
4. **Given** the message is shown, **When** the user chooses to discard the damaged data and confirms, **Then** it is deleted and the message does not return; **When** they cancel, **Then** nothing is deleted.
5. **Given** the stored project was made by a newer version of the tool, **When** the app starts, **Then** it is treated the same way (kept, downloadable, never overwritten without confirmation) and the message says it was made by a newer version.

---

### User Story 6 - Name the keyboard (Priority: P2)

The project name is shown in the project bar and can be edited there. It is the name the keyboard shows to computers and phones. From it the tool derives the keyboard's technical name used for files: lowercase letters, digits and underscores only (for example "My Corne v2!" → `my_corne_v2`). The technical name is shown next to the name so the user knows what files will be called; the user can override it (for example when the display name is in Cyrillic) and clear the override to go back to the derived name. A technical name that is empty or not valid, or is too long for the keyboard to announce itself, is reported in the problems panel under Schematic.

**Why this priority**: The name is the only project content in this feature and the first real problem the problems panel reports; everything else works without renaming.

**Independent Test**: Rename to "My Corne v2!" — technical name `my_corne_v2`, no problems. Rename to "!!!" — the problems panel lists one problem under Schematic, the Schematic tab badge shows 1, activating the problem focuses the name field; set the technical name override to `corne` — the problem disappears and the save file is `corne.json`; clear the override — the problem is back. Rename to "A very long keyboard name" — a problem says the name is too long.

**Acceptance Scenarios**:

1. **Given** the project bar, **When** the user activates the name, **Then** they can edit it; Enter or leaving the field applies the change as one undo step, Escape restores the previous name.
2. **Given** a name, **When** it is applied, **Then** the technical name is derived by the rules in FR-012 and shown next to the name, unless the user set an override.
3. **Given** the technical name, **When** the user edits it and applies a value, **Then** that value becomes the override and is one undo step; the display name no longer changes it; **When** they clear it, **Then** the derived name is used again.
4. **Given** an override that is not lowercase Latin letters, digits and `_`, or starts with a digit, **When** it is applied, **Then** it is kept as typed and the problems panel lists that the technical name may use only lowercase letters, digits and `_` and must not start with a digit.
5. **Given** a name that is empty, only spaces, or yields an empty technical name (e.g. "!!!" or "Корн"), **When** it is applied and no technical name override is set, **Then** the problems panel lists "The keyboard name has no letters or digits usable in file names. Use at least one Latin letter or digit, or set a technical name." under Schematic, the Schematic badge counts it, and the name field shows the problem.
6. **Given** a name longer than 16 bytes, **When** it is applied, **Then** the problems panel lists that the name is too long for the keyboard to announce and must be at most 16 characters (fewer with non-Latin characters).
7. **Given** a name problem is listed, **When** the user activates it in the problems panel, **Then** focus moves to the name field in the project bar.

---

### User Story 7 - Start a new project (Priority: P3)

The user presses New in the project bar, confirms "Start new project" in a dialog that warns the current project will be replaced (and suggests saving it to a file first), and gets an empty project named "My keyboard" with an empty undo history.

**Why this priority**: Useful but rare; the user can also rename and clear by hand until later features add content.

**Independent Test**: Rename the project, press New, cancel — nothing changes; press New, confirm — the project is "My keyboard", Undo is unavailable; reload — still "My keyboard".

**Acceptance Scenarios**:

1. **Given** any project, **When** the user activates New, **Then** a confirmation dialog opens with a button "Start new project", a cancel button, and a way to save the current project first.
2. **Given** the dialog, **When** the user confirms, **Then** a new empty project replaces the current one, the undo and redo history is empty, and the new project is autosaved.
3. **Given** the dialog, **When** the user cancels or presses Escape, **Then** nothing changes and focus returns to New.

---

### Edge Cases

- The app is open in two browser tabs → each tab autosaves its own project; the tab that changes last wins in storage, with no detection, warning or live sync (accepted risk: an edit in an older tab can overwrite newer work from another tab).
- The user reloads during a text edit in the name field → the uncommitted text is lost; the last applied name is restored.
- Open is confirmed but the file is rejected → the current project, its undo history and the stored project are unchanged.
- A valid project file contains extra unknown fields → they are ignored; the file opens.
- A project file of the current version contains a value outside allowed ranges but valid in shape (e.g. a name of 500 characters) → it opens; the problem is reported in the problems panel, like any other project problem.
- Undo history grows long → the oldest steps are dropped beyond 100 steps; the user is never blocked from editing.
- Storage becomes full while working → the save status and warning switch to "not saved" at that moment; the open project is never dropped; when storage works again the next change saves normally and the warning clears.
- A browser that refuses to download (blocked downloads) → the status region says the file could not be saved.

## Requirements *(mandatory)*

### Functional Requirements

**Project**

- **FR-001**: The app MUST hold exactly one keyboard project at a time. A new project MUST be named "My keyboard" and contain no keyboard content.
- **FR-002**: The project MUST carry a format version, so that files from every earlier version can be recognized and upgraded.

**Autosave and restore**

- **FR-003**: Every change to the project (including undo and redo) MUST be saved in the browser automatically, and the last saved project MUST be restored when the app is opened again in the same browser.
- **FR-004**: The project bar save status MUST show "Saved in this browser" while autosave works, and a "not saved" state with the reason (storage unavailable or full) when it does not. It MUST NOT change on every edit while autosave works.
- **FR-005**: When storage is unavailable or full, the app MUST keep the open project in the page, show a persistent warning (announced once) that autosave is off and the project should be saved to a file, and clear it after the next successful save.
- **FR-006**: If the stored project cannot be read (damaged, wrong shape, or newer format version), the app MUST open a new project, keep the stored data aside unchanged, show a persistent message naming the reason, offer to download the kept data exactly as stored, and delete it only after the user confirms. Autosave MUST NOT overwrite the kept data.

**Save and open files**

- **FR-007**: Save (project bar and Cmd/Ctrl+S) MUST download the whole project as a file named `<technical name>.json` (`keyboard.json` when the technical name is empty). Saving MUST NOT be blocked by problems. The file MUST contain only project data the user entered, with no timestamps or information about the device or browser.
- **FR-008**: Open (project bar and Cmd/Ctrl+O) MUST ask for confirmation that the current project will be replaced, then let the user pick a file. A file that is accepted MUST replace the current project, clear the undo and redo history, and be autosaved.
- **FR-009**: A file from any earlier format version MUST open and be upgraded step by step to the current version. Each format change adds one upgrade step; this feature starts with version 1 and no upgrade steps.
- **FR-010**: A file MUST be rejected, with the current project, its history and the stored project unchanged, when it: is not readable text or JSON; does not have the project shape (each wrong or missing field listed with its location in the file); has a format version newer than the app ("This file was made by a newer version of ZMK Customizer."); or is larger than 5 MB. The message MUST be announced to assistive technology and dismissable.
- **FR-011**: Unknown extra fields in an otherwise valid file MUST be ignored.

**Name**

- **FR-012**: The project name MUST be shown and editable in the project bar. The technical name MUST be derived from it: letters converted to lowercase; every run of characters that are not Latin letters `a–z` or digits replaced by a single `_`; leading and trailing `_` removed; a leading `_` added when the result starts with a digit. Example: "My Corne v2!" → `my_corne_v2`; "42 keys" → `_42_keys`. The technical name MUST be shown next to the name.
- **FR-012a**: The user MUST be able to override the technical name in the project bar; the override replaces the derived name everywhere (file names) until the user clears it, after which the derived name is used again. Setting and clearing are one undo step each. An override is stored as typed, not sanitized.
- **FR-013**: An empty technical name (derived, no override), and an override that does not match lowercase Latin letters, digits and `_` with no leading digit, MUST be reported in the problems panel under Schematic.
- **FR-014**: A name longer than 16 bytes MUST be reported in the problems panel under Schematic (ZMK limits the name the keyboard announces over Bluetooth and USB to 16 bytes). The name MUST NOT be shortened silently.
- **FR-015**: Name problems MUST follow the 001 problems panel rules: counted in the Schematic tab badge, shown on that field, and activating one MUST focus the field it is about (display name or technical name).

**Undo and redo**

- **FR-016**: Every user action that changes the project MUST be one undo step: renaming (applied on Enter or leaving the field), and every change later features add.
- **FR-017**: Undo and Redo MUST work from the project bar and from Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z; they MUST be unavailable when their history is empty; a new change after undo MUST clear the redo history; "Undone" / "Redone" MUST be announced once in the status region.
- **FR-018**: The undo and redo shortcuts (and Save and Open shortcuts) MUST NOT act while focus is in a text field or a modal window is open, so text fields keep their own undo. They MUST be listed in the shortcut help window.
- **FR-019**: The undo history MUST keep the last 100 steps (older steps dropped) and MUST NOT survive a page reload; New and an accepted Open MUST clear it.

**New project**

- **FR-020**: New MUST open a confirmation dialog whose confirm button is "Start new project", which also offers to save the current project to a file first. Confirming MUST replace the project with a new one (FR-001) and clear the history; cancelling MUST change nothing and return focus to New.

**Project bar**

- **FR-021**: New, Open, Save, Undo and Redo MUST become available (no longer "not available yet") and be operable by pointer and keyboard with accessible names; the name "Untitled keyboard" and status "Nothing to save" from spec 001 are replaced by the real name and save status.

### Out of scope

- Any keyboard content (keys, wiring, bindings, settings) — spec 003 and later features add it to this project.
- File generation and download of ZMK files (roadmap 003/004 generators, export).
- Several projects in the browser, a project list, recent files.
- Sync between browser tabs, cloud storage, sharing links.
- Undo history that survives reload.

### Key Entities *(include if feature involves data)*

- **Project**: the one keyboard being edited. Holds a format version and the display name; later features add their content. Plain data that is identical in the browser store, in a project file and in the undo history.
- **Display name**: text the user types; the name the keyboard announces to computers (at most 16 bytes).
- **Technical name**: lowercase Latin letters, digits, `_`; does not start with a digit; names the generated files and the project file. Derived from the display name unless the project stores an optional override; an absent override means "derive".
- **Project file**: a downloaded copy of the project. Contains only project data.
- **Undo history**: past and undone project states of the current page session; not stored.
- **Kept damaged data**: the exact stored text that could not be read on startup; kept until the user downloads and discards it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After a reload, the restored project is identical to the project after the last change in 100% of cases where browser storage works.
- **SC-002**: Saving a project to a file and opening that file gives an identical project in 100% of cases, including files saved by every earlier version of the tool.
- **SC-003**: For every rejected file type (not JSON, wrong shape, newer version, too large), the open project and its undo history are unchanged, and the message names the problem, in 100% of test cases.
- **SC-004**: Damaged stored data is never lost without explicit confirmation; its downloaded copy is byte-for-byte identical to what was stored.
- **SC-005**: A user can back up a project to a file and restore it on another computer in under 1 minute without instructions.
- **SC-006**: Every acceptance scenario of stories 1–7 can be completed with the keyboard alone; Undo, Redo, Save and Open also by shortcut.
- **SC-007**: A name problem appears in the problems panel and the Schematic badge in the same interaction that caused it, and disappears in the same interaction that fixes it.

## Assumptions

- Undo history is kept for the page session only, bounded at 100 steps (resolves the roadmap open decision "Undo history: bounded size, persistence"). Project snapshots are small, so the bound exists only to cap memory over a long session.
- Default name is "My keyboard", not spec 001's placeholder "Untitled keyboard": the latter is 17 bytes and would itself be reported as too long (FR-014).
- The display name is also the name the keyboard announces (ZMK keyboard name, ≤16 bytes); there is no separate field for it.
- Technical-name rules (FR-012) are the tool's own sanitizing rule for the ZMK shield id pattern `[a-z_][a-z0-9_]*`; non-Latin letters are dropped, not transliterated. Keeping it unique against real ZMK shields is not checked.
- Save and Open shortcuts are Cmd/Ctrl+S and Cmd/Ctrl+O (the browser's own save/open page actions are useless in this app); New has no shortcut because browsers reserve Cmd/Ctrl+N. The plan verifies each combo in Chrome, Firefox and Safari, as spec 001 did.
- Opening a file asks for confirmation before replacing the project and starts a fresh undo history (admin UI rule: confirm what undo cannot restore).
- Save never asks where to save; the browser's download behavior decides.
- Every format change after this feature ships adds an upgrade step (roadmap open decision "Schema versioning before first release" resolved as: version 1 is frozen once this feature is merged).
- Depends on spec 001: project bar, problems panel, tab badges, status region, shortcut help, confirmation dialog primitive. Spec 003 (schematic keys and wires) builds on this feature.
