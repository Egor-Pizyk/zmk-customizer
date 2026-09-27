# Feature Specification: Application Shell and Workspaces

**Feature Branch**: `001-app-shell-ui`

**Created**: 2026-09-27

**Status**: Draft

**Input**: User description: "First feature: the application interface. Tailwind as the design system. A side tab bar and a central work surface; tab bar buttons switch the workspace. Workspace 1 — Schematic: where the physical keyboard schematic will be built later (only the base interface now); it will later create, modify and load its own JSON config that the second workspace builds on. Schematic has a floating window for choosing tools (tools and their logic come later, only the interface now). A settings window at the bottom of the tab bar. Two themes, dark and light, chosen in settings. Every workspace has a grid; things can snap to it; grid size is adjustable; snapping can be turned off (in settings). Result: two workspaces, Schematic and Bindings; only Schematic has the tool window; adjustable grid; two themes. Suggest other ideas for the base UI." Follow-up: tab bar on the left; one grid setting for all workspaces; add the proposed Export tab, ZMK settings tab, problems panel, project bar, status bar, keyboard shortcuts with help, quick snap toggle, minimap and rulers.

## Context

This is the first user-visible feature. It gives the app its frame: navigation between workspaces, a work surface with a grid, a project bar, a status bar, a problems panel, keyboard shortcuts, a settings window and themes. It contains no keyboard editing. Later features plug into it:

- **Schematic** (canvas) will hold the physical layout and wiring of the keyboard and will own the project configuration file (create, modify, load as JSON). Everything else is built from that configuration.
- **Bindings** (canvas) will hold the keymap (layers, key bindings, combos, macros) built on top of the Schematic configuration.
- **Firmware** will hold ZMK settings (build options) with one-line explanations and links to the ZMK docs.
- **Export** will show a preview of the generated ZMK files and download them.

Firmware and Export are placeholder workspaces in this feature: they show what will appear there, nothing else.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch between workspaces (Priority: P1)

The user opens the app and sees a narrow vertical tab bar and a large work surface. The tab bar sits on the left edge and has one button per workspace: Schematic, Bindings, Firmware, Export. Clicking a button (or activating it with the keyboard) replaces the work surface with that workspace. The active workspace is clearly marked in the tab bar and named at the top of the work surface.

**Why this priority**: Every later feature lives inside a workspace. Without navigation there is nothing to build on.

**Independent Test**: Open the app, visit all four workspaces using mouse only, then using keyboard only; the work surface and the active marker change each time.

**Acceptance Scenarios**:

1. **Given** the app is opened for the first time, **When** it finishes loading, **Then** the Schematic workspace is shown and its tab is marked active.
2. **Given** Schematic is active, **When** the user activates the Bindings tab, **Then** the Bindings workspace is shown, the Bindings tab is marked active and the Schematic tab is not.
3. **Given** any workspace is active, **When** the user reloads the page, **Then** the same workspace is shown again.
4. **Given** the user navigates with the keyboard only, **When** they move through the tab bar, **Then** every tab and the settings button can be reached and activated, and the focused control is visibly marked.
5. **Given** a workspace becomes active, **When** a screen reader user switches to it, **Then** the workspace name is announced.
6. **Given** Firmware or Export is active, **When** it is shown, **Then** it displays an empty state that names what will appear there, and has no grid and no tool window.

---

### User Story 2 - Work surface with a configurable grid and snapping (Priority: P1)

Both canvas workspaces (Schematic, Bindings) show a work surface with a visible grid. One grid setting applies to both. The user can change the grid size and turn snapping on or off. Until editing tools exist, snapping is observable through the pointer position readout: as the pointer moves over the surface, the readout shows its position in key units, rounded to the grid when snapping is on and unrounded when it is off.

**Why this priority**: The grid and snapping are the base every placement tool will use; the user asked for them in all canvas workspaces.

**Independent Test**: Hover over the surface with snapping on and grid size 0.25u — the readout only shows multiples of 0.25; turn snapping off — the readout shows finer values; change the grid size to 1u — the drawn grid spacing and the snapped values change.

**Acceptance Scenarios**:

1. **Given** default settings, **When** a workspace is shown, **Then** a grid is visible with the default spacing and snapping is on.
2. **Given** snapping is on with grid size G, **When** the pointer moves over the surface, **Then** the position readout shows only multiples of G.
3. **Given** snapping is off, **When** the pointer moves over the surface, **Then** the readout shows positions not rounded to the grid.
4. **Given** the user changes the grid size, **When** they return to the work surface, **Then** the drawn grid spacing matches the new size in both canvas workspaces.
5. **Given** the grid is hidden via settings, **When** the surface is shown, **Then** no grid lines are drawn, and snapping still behaves according to its own setting.
6. **Given** a canvas workspace is shown, **When** the user activates the snap toggle on the work surface (or its shortcut), **Then** snapping flips, the toggle shows the new state, and the settings window shows the same value.

---

### User Story 3 - Settings window and themes (Priority: P1)

At the bottom of the tab bar there is a settings button. It opens a settings window containing: theme (Light, Dark, System), grid size, grid visibility and snap to grid. Changes apply immediately and are remembered across reloads. The window closes with a close button, the Escape key or a click outside it, and focus returns to the settings button.

**Why this priority**: The user explicitly asked for theme choice and grid settings to live in a settings window.

**Independent Test**: Open settings, switch to Dark — the whole app changes to the dark palette at once; reload — Dark is still applied; set grid size, close, reload — the value is kept.

**Acceptance Scenarios**:

1. **Given** the settings window is closed, **When** the user activates the settings button, **Then** the window opens and keyboard focus moves into it.
2. **Given** the settings window is open, **When** the user picks Dark, **Then** the entire interface switches to the dark theme without a reload, and all text stays readable.
3. **Given** the theme is System, **When** the operating system switches between light and dark, **Then** the app follows without user action.
4. **Given** settings were changed, **When** the page is reloaded, **Then** the theme, grid size, grid visibility and snapping are restored, and the app shows no flash of the other theme while loading.
5. **Given** the user enters a grid size outside the allowed range or not a number, **When** they leave the field, **Then** the value is not applied, a message says what range is allowed, and the previous value stays in effect.
6. **Given** the settings window is open, **When** the user presses Escape, **Then** it closes and focus returns to the settings button.

---

### User Story 4 - Floating tool window in Schematic (Priority: P2)

In the Schematic workspace a small floating window shows the tools that will be used to build the schematic. For now it holds placeholder tools: **Select** (usable, selected by default) and slots for the upcoming tools (for example Add key, Wire), shown as unavailable with a "coming later" hint. The user can move the window by dragging its title bar, collapse it to its title bar and expand it again. The window never leaves the visible area. Its position and collapsed state are remembered. The Bindings workspace has no tool window.

**Why this priority**: The user wants the tool window in place now so tool features can be added later without reworking the layout. It has no editing effect yet, so it ranks below the frame itself.

**Independent Test**: In Schematic, drag the tool window to another corner, collapse it, reload — it is in the same place and collapsed; switch to Bindings — no tool window; resize the browser window smaller — the tool window stays fully visible.

**Acceptance Scenarios**:

1. **Given** Schematic is active, **When** it is shown, **Then** the tool window is visible with Select active and upcoming tools marked unavailable.
2. **Given** Bindings is active, **When** it is shown, **Then** no tool window is present.
3. **Given** the tool window is visible, **When** the user drags it by its title bar, **Then** it follows the pointer and stays within the work surface.
4. **Given** the browser window shrinks so the tool window would be cut off, **When** the resize ends, **Then** the tool window is moved back fully inside the work surface.
5. **Given** the user moved or collapsed the tool window, **When** the page reloads, **Then** position and collapsed state are restored.
6. **Given** a keyboard-only user, **When** they focus the tool window, **Then** they can choose a tool, collapse or expand the window, and move it with the arrow keys.
7. **Given** the user activates an unavailable tool, **When** it is activated, **Then** nothing changes on the surface and the hint says the tool is not available yet.

---

### User Story 5 - Navigate the work surface (Priority: P3)

The user can zoom the work surface in and out and pan it, so that large keyboards fit and details can be inspected. A "fit / reset view" action returns to the default view. The current zoom level is visible. Each workspace keeps its own view.

**Why this priority**: Not requested explicitly, but a grid surface without pan and zoom becomes unusable as soon as a real keyboard is placed on it. It is cheap to add together with the grid.

**Independent Test**: Zoom in twice, pan, reset — the view returns to default; grid lines and snapped readout stay correct at every zoom level.

**Acceptance Scenarios**:

1. **Given** a workspace is shown, **When** the user zooms with the mouse wheel (with modifier) or zoom buttons, **Then** the grid scales around the pointer or center and the zoom level readout updates.
2. **Given** the view is zoomed or panned, **When** the user activates reset view, **Then** the default zoom and position are restored.
3. **Given** a zoomed view, **When** snapping is on, **Then** the readout still shows multiples of the grid size in key units, independent of zoom.
4. **Given** zoom limits are reached, **When** the user tries to zoom further, **Then** the zoom stays at the limit.
5. **Given** a canvas has keyboard focus, **When** the user presses the arrow keys (with Shift for larger steps), **Then** the view pans one grid step (Shift: 1u) in that direction, so panning needs no pointer.

---


### User Story 6 - Project bar and status bar (Priority: P2)

Across the top of the work surface a project bar shows the project name, a save status and the project actions New, Open, Save, Undo and Redo. In this feature there is no project data yet: the name shows "Untitled keyboard", the save status shows "Nothing to save", and the actions are shown but unavailable with a hint that they arrive with the project feature. Across the bottom of a canvas workspace a status bar shows the pointer position in key units, the zoom level, the snap state and the grid size.

**Why this priority**: The user wants the frame of the app to be complete now, so later features fill slots instead of reshaping the layout. The status bar is the visible home of values the grid features already produce.

**Independent Test**: Open Schematic — the project bar shows the name, status and five unavailable actions with hints; move the pointer and zoom — the status bar values change; toggle snap — the status bar snap indicator changes.

**Acceptance Scenarios**:

1. **Given** any workspace is active, **When** it is shown, **Then** the project bar is visible with name "Untitled keyboard", status "Nothing to save", and New, Open, Save, Undo, Redo shown as unavailable.
2. **Given** a project action is unavailable, **When** the user focuses or hovers it, **Then** a hint says it is not available yet; activating it changes nothing.
3. **Given** a canvas workspace is active, **When** the pointer moves or the zoom changes, **Then** the status bar shows the current pointer position (u), zoom (%), snap state and grid size.
4. **Given** the pointer leaves the surface, **When** it is outside, **Then** the status bar shows no position instead of a stale one.

---

### User Story 7 - Problems panel (Priority: P2)

A problems panel lists issues found in the project, each with its workspace and a short message saying what is wrong and how to fix it. Each tab in the tab bar shows a badge with the number of issues belonging to that workspace; the badge is hidden when the count is zero. The panel opens from the status bar or a shortcut and docks below the work surface. In this feature no checks exist yet, so the panel shows "No problems" and every badge is hidden.

**Why this priority**: Every later feature reports problems (unassigned matrix cells, pin conflicts, missing bindings). A single place for them must exist before the first check does.

**Independent Test**: Open the problems panel — it says "No problems"; close it; no tab shows a badge.

**Acceptance Scenarios**:

1. **Given** no problems, **When** the user opens the problems panel, **Then** it shows "No problems" and no tab shows a badge.
2. **Given** the panel is open, **When** the user closes it or presses its shortcut again, **Then** it closes and the work surface regains the space.
3. **Given** the panel is open, **When** the user switches workspace, **Then** the panel stays open.
4. **Given** the problem count changes (in later features), **When** it changes, **Then** assistive technology announces the new total once, without interrupting.

---

### User Story 8 - Keyboard shortcuts and help (Priority: P3)

Common actions have keyboard shortcuts. App-wide shortcuts use Alt+Shift (Option+Shift on macOS) with a key: switch to workspace 1–4, open settings, toggle the problems panel, open shortcut help. Single-key shortcuts work only while a canvas has focus and act on that canvas: toggle snap, toggle grid, zoom in, zoom out, reset view, pan with the arrow keys, open shortcut help (`?`). Alt+Shift+/ anywhere, `?` on a focused canvas, or a help button opens a window listing every shortcut. Shortcuts never fire while the user types in a text field.

**Why this priority**: An editor app is used for long sessions; shortcuts make it fast. The help window makes them discoverable.

**Independent Test**: Press each app-wide shortcut from anywhere and each canvas shortcut with the canvas focused, and see its effect; press a canvas key with focus outside the canvas — nothing happens; press Alt+Shift+/ — the help window lists exactly the shortcuts that work; type `?` inside the grid size field — no help window opens.

**Acceptance Scenarios**:

1. **Given** focus is not in a text field and no modal window is open, **When** the user presses an app-wide shortcut, **Then** its action happens.
2. **Given** a canvas has focus, **When** the user presses a canvas shortcut, **Then** its action happens on that canvas; **Given** focus is elsewhere (tab bar, project bar), **When** they press the same single key, **Then** nothing happens.
3. **Given** focus is in a text field, **When** the user types a shortcut character, **Then** the character is typed and no action happens.
4. **Given** the help window is open, **When** it is shown, **Then** it lists every shortcut with its action and scope, using the platform's modifier names (Option and Cmd on macOS; Alt and Ctrl on Windows/Linux).
5. **Given** the help window is open, **When** the user presses Escape, **Then** it closes and focus returns to where it was.

---

### User Story 9 - Rulers and minimap (Priority: P3)

Canvas workspaces show rulers along the top and left edges of the work surface, marked in key units and following pan and zoom; the pointer position is marked on both rulers. A minimap in a corner of the surface shows the whole content area and a rectangle for the visible part; dragging the rectangle or clicking the minimap moves the view. Rulers and minimap can each be turned on and off in settings.

**Why this priority**: Real keyboards span 15–20u; rulers make positions readable, the minimap keeps orientation when zoomed in. Useful from the first tool on, but not needed for the frame itself.

**Independent Test**: Pan and zoom — ruler marks move and rescale, pointer markers track the pointer; drag the minimap rectangle — the view follows; turn both off in settings — both disappear.

**Acceptance Scenarios**:

1. **Given** rulers are on, **When** the user pans or zooms, **Then** ruler marks stay aligned with the grid and labels show key units.
2. **Given** the minimap is on, **When** the user drags its view rectangle, **Then** the work surface view moves accordingly.
3. **Given** rulers or minimap are turned off in settings, **When** a canvas workspace is shown, **Then** they are not shown, and the setting is remembered.
4. **Given** the tool window overlaps the minimap corner, **When** both are shown, **Then** neither blocks the other's controls (the minimap sits in a different corner from the tool window's default position).

---

### Edge Cases

- Stored settings are missing, corrupted or from an unknown version → the app starts with defaults, does not crash, and overwrites the bad value only when the user changes a setting.
- Browser storage is unavailable (private mode, blocked) → the app works; settings apply for the session only; the settings window says they will not be remembered.
- Viewport narrower than the supported minimum width → the layout stays usable (tab bar and settings remain reachable); the work surface scrolls instead of overlapping.
- The saved tool-window position is outside the current viewport (smaller screen than last time) → the window is placed back inside the work surface.
- Grid size so small that lines would be denser than a few screen pixels at the current zoom → grid lines are thinned or hidden at that zoom so the surface stays readable; snapping is unaffected.
- Reduced-motion preference enabled → theme changes and panel transitions happen without animation.
- User switches workspace while the settings window is open → not possible; the window is modal and must be closed first.
- A shortcut is pressed while a modal window is open → only that window's own keys (Escape, Tab) work; all app shortcuts are ignored.
- The work surface is too small for tool window, minimap and rulers together (at 1024 px width with the problems panel open) → rulers and minimap stay, the tool window can be collapsed; nothing overlaps the status bar.

## Requirements *(mandatory)*

### Functional Requirements

**Shell and navigation**

- **FR-001**: The interface MUST consist of a vertical tab bar along the left edge of the window and a work surface filling the rest of the window.
- **FR-002**: The tab bar MUST contain four workspace tabs, in this order: Schematic, Bindings, Firmware, Export, each with an icon and a visible text label or tooltip. Schematic and Bindings are canvas workspaces; Firmware and Export are placeholder workspaces showing an empty state that names what will appear there.
- **FR-003**: Activating a tab MUST show that workspace; exactly one workspace is active at any time; the active tab MUST be visibly distinct and exposed as current to assistive technology.
- **FR-004**: The active workspace MUST be restored after a page reload. The first-ever visit MUST open Schematic.
- **FR-005**: The work surface MUST show the active workspace's name as its main heading.
- **FR-006**: The settings button MUST be placed at the bottom of the tab bar, visually separated from the workspace tabs.

**Work surface and grid**

- **FR-007**: Every canvas workspace (Schematic, Bindings) MUST show a grid on its work surface. Grid spacing is expressed in key units (1u = the width of a standard key, 19.05 mm).
- **FR-008**: The grid size MUST be adjustable from 0.05u to 2u. Presets 1u, 0.5u, 0.25u and 0.125u MUST be offered; a custom value within the range MUST also be accepted. Default: 0.25u.
- **FR-009**: Snap to grid MUST be a setting that can be turned on and off. Default: on.
- **FR-010**: Grid visibility MUST be a setting independent of snapping. Default: visible.
- **FR-011**: The work surface MUST show a pointer position readout in key units, rounded to the grid when snapping is on.
- **FR-012**: Grid size, grid visibility and snap settings MUST be shared: one value applies to all canvas workspaces.
- **FR-013**: Users MUST be able to zoom (within fixed limits, default 100%) and pan each work surface, by pointer and by keyboard, see the current zoom level and reset the view; each canvas workspace keeps its own view.
- **FR-013a**: Each canvas work surface MUST have a snap toggle control that reflects and changes the same snap setting as the settings window.
- **FR-013b**: Canvas workspaces MUST show rulers along the top and left edges in key units that follow pan and zoom and mark the pointer position.
- **FR-013c**: Canvas workspaces MUST show a minimap with the visible-area rectangle; dragging the rectangle or clicking the minimap MUST move the view.

**Settings window**

- **FR-014**: Activating the settings button MUST open a modal settings window containing: theme, grid size, grid visibility, snap to grid, rulers on/off, minimap on/off.
- **FR-015**: Setting changes MUST apply immediately, without a save button.
- **FR-016**: Invalid grid size input MUST NOT be applied; the field MUST show the allowed range, and the previous value MUST remain in effect.
- **FR-017**: The settings window MUST close via a close button, the Escape key and a click outside it; focus MUST return to the settings button.
- **FR-018**: The settings window MUST offer a "Reset to defaults" action for all settings in it.

**Themes**

- **FR-019**: The app MUST provide a light and a dark theme, plus a System option that follows the operating system preference. Default: System.
- **FR-020**: Switching theme MUST restyle the entire interface immediately, with no page reload.
- **FR-021**: Both themes MUST meet WCAG 2.2 AA contrast for text and for interactive control boundaries and focus indicators.
- **FR-022**: On load, the stored theme MUST be applied before the interface is first shown (no flash of the other theme).

**Tool window (Schematic only)**

- **FR-023**: The Schematic workspace MUST show a floating tool window; the Bindings workspace MUST NOT.
- **FR-024**: The tool window MUST list tools; in this feature only Select is available and active by default; upcoming tools are shown as unavailable with a "not available yet" hint and have no effect when activated.
- **FR-025**: The tool window MUST be movable by dragging its title bar and by keyboard; it MUST stay fully inside the work surface, including after the browser window is resized.
- **FR-026**: The tool window MUST be collapsible to its title bar and expandable again.
- **FR-027**: The tool window's position and collapsed state MUST be remembered across reloads.

**Project bar, status bar, problems panel**

- **FR-034**: A project bar MUST be shown above the work surface with the project name ("Untitled keyboard" in this feature), a save status ("Nothing to save" in this feature) and the actions New, Open, Save, Undo, Redo. In this feature all five actions MUST be shown as unavailable with a "not available yet" hint and MUST have no effect.
- **FR-035**: Canvas workspaces MUST show a status bar with pointer position (u, empty when the pointer is off the surface), zoom level, snap state and grid size.
- **FR-036**: A problems panel MUST open and close from the status bar and by shortcut, dock below the work surface, stay open across workspace switches, and list problems with workspace and message. With no problems it MUST show "No problems".
- **FR-037**: Each tab MUST show a badge with the number of problems in its workspace, hidden at zero; changes of the total MUST be announced politely to assistive technology.

**Keyboard shortcuts**

- **FR-038**: The app MUST provide app-wide shortcuts (Alt+Shift with a key) for: switch to workspace 1–4, open settings, toggle problems panel, open shortcut help; and canvas shortcuts (single keys, active only while a canvas has focus, acting on that canvas) for: toggle snap, toggle grid, zoom in, zoom out, reset view, pan by one grid step with the arrow keys (1u with Shift), open shortcut help. No single-key shortcut MAY act while focus is outside a canvas (WCAG 2.1.4).
- **FR-039**: Shortcuts MUST NOT fire while focus is in a text field or while a modal window is open.
- **FR-040**: A shortcut help window MUST open with Alt+Shift+/, with `?` on a focused canvas and from a visible help button, and MUST list exactly the shortcuts that exist with their scope, with platform-appropriate modifier names (Option/Cmd on macOS, Alt/Ctrl elsewhere).

**Persistence and robustness**

- **FR-028**: Interface preferences (theme, grid size, grid visibility, snapping, rulers, minimap, active workspace, tool window state, problems panel open state, per-workspace view) MUST be stored in the browser, separately from any keyboard project data, and MUST NOT be sent anywhere.
- **FR-029**: Missing, corrupted or unknown-version stored preferences MUST result in defaults being used, without an error screen; the stored value MUST NOT be overwritten until the user changes a setting.
- **FR-030**: If browser storage is unavailable, the app MUST still work for the session and the settings window MUST say that settings will not be remembered.

**Accessibility and layout**

- **FR-031**: Every control (tabs, settings button, settings fields, tool window controls, zoom controls, project bar actions, snap toggle, problems panel, minimap) MUST be reachable and operable by keyboard with a visible focus indicator, and MUST have an accessible name.
- **FR-032**: The layout MUST be fully usable at a window width of 1024 px and above; phones are not a target.
- **FR-033**: When the reduced-motion preference is set, the interface MUST NOT animate transitions.

### Out of Scope

- Any keyboard editing: adding, moving or wiring keys; the tools themselves and their behavior.
- The Schematic project configuration file: creating, editing, saving, loading or validating JSON. The Schematic workspace is designed to own it in a later feature.
- Keymap editing in Bindings; Bindings shows only its empty work surface with the grid in this feature.
- Content of the Firmware workspace (ZMK settings) and the Export workspace (file preview, download) — both are placeholders here.
- Working project actions: New, Open, Save, Undo, Redo, project renaming and real save status — shown but unavailable until the project feature.
- Any problem checks — the problems panel and badges exist but always report zero here.

### Proposed Additions (not in scope; for later features)

- **Inspector panel** on the right of the work surface for properties of the selected key (position, size, rotation, matrix cell, pin).
- **Temporary snap bypass**: holding a modifier key while dragging ignores the grid (needs tools).
- **Jump to problem**: activating a problem focuses the entity it refers to (needs entities).
- **Selection count** in the status bar (needs selection).
- **Presets gallery** on first launch: start from an empty board or from a known keyboard (e.g. Corne).

### Key Entities *(include if feature involves data)*

- **Workspace**: a named area of the app. Canvas workspaces (Schematic, Bindings) have a work surface with grid, rulers, minimap, status bar and their own view (zoom, pan); Schematic additionally has a tool window. Placeholder workspaces (Firmware, Export) show an empty state.
- **Interface preferences**: per-browser settings not tied to a keyboard project — theme (Light / Dark / System), grid size (key units), grid visibility, snap to grid, rulers, minimap, last active workspace, tool window position and collapsed state, problems panel open state, per-workspace view.
- **Workspace issue**: a validation issue in the project with its workspace, a location and a message saying what is wrong and how to fix it; shown to the user as a "problem". None exist in this feature.
- **Shortcut**: a key combination, its scope (app-wide or focused canvas), the action it triggers and its description; one list drives both the behavior and the help window.
- **Tool**: an entry in the Schematic tool window with a name, icon, availability (available / not yet available) and active state. Only Select is available in this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user visits all four workspaces and opens settings within 15 seconds without instructions.
- **SC-002**: All controls in the shell, settings window, tool window, project bar, status bar, problems panel and help window can be operated with the keyboard alone; a keyboard-only walkthrough completes every acceptance scenario of stories 1–9 except minimap dragging, which has a keyboard alternative (arrow-key pan, zoom and reset view on the focused canvas).
- **SC-003**: Switching workspace or theme updates the whole screen in under 100 ms as perceived by the user (no visible intermediate state).
- **SC-004**: After a reload, 100% of interface preferences (theme, grid size, grid visibility, snapping, rulers, minimap, active workspace, tool window position and collapsed state, problems panel state) are restored exactly.
- **SC-008**: The shortcut help window lists 100% of the working shortcuts and no shortcut that does not work.
- **SC-005**: Every text and control boundary in both themes meets WCAG 2.2 AA contrast (4.5:1 text, 3:1 non-text), checked for each theme.
- **SC-006**: With snapping on, 100% of position readouts over the surface are exact multiples of the grid size, at every zoom level.
- **SC-007**: Corrupted stored preferences never produce an error screen; the app opens with defaults in every such case.

## Assumptions

- The design system is already decided and set up (ADR 0011); this spec states only visual outcomes (themes, contrast, density), not how they are built.
- Theme default is System (follows the OS), with Light and Dark as explicit choices; this extends the requested two themes without removing either.
- Grid units are key units (u), because every later placement (key positions, sizes) is expressed in u; range 0.05u–2u, default 0.25u.
- Interface preferences are per-browser and are not part of the keyboard project file; the project file (later feature) will contain only keyboard data.
- The tool window starts in the top-left corner of the Schematic work surface, expanded; the minimap sits in the bottom-right corner.
- The workspace for ZMK settings is named **Firmware** so it is not confused with the app's own Settings window.
- Rulers and minimap are on by default.
- Default shortcuts (`contracts/shortcuts.md`, research R9): app-wide Alt+Shift+1–4 workspaces, Alt+Shift+`,` settings, Alt+Shift+P problems panel, Alt+Shift+/ help; on a focused canvas S snap, G grid, `+`/`-` zoom, 0 reset view, arrows pan, `?` help. Plain single-key globals are rejected (WCAG 2.1.4); Alt alone and Ctrl/Cmd+`,` are rejected because browsers reserve them.
- Zoom range 25%–400%, default 100%; zoom with Ctrl/Cmd + wheel, pan with middle-button drag, scroll or the arrow keys on a focused canvas.
- Supported browsers: current Chrome, Firefox, Safari and Edge on desktop.
- The original roadmap (`docs/roadmap.md`) planned five steps (Layout, Wiring, Keymap, Settings, Export). This feature replaces them with four workspaces: layout and wiring belong to Schematic, keymap to Bindings, ZMK settings to Firmware, export to Export. The roadmap is updated to match.
