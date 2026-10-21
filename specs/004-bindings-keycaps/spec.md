# Feature Specification: Bindings keycaps

**Feature Branch**: `004-bindings-keycaps`

**Created**: 2026-09-28

**Status**: Draft

**Input**: User description: "On the Bindings page, repeat the layout of my keys and the connections between them, but show the wires dimmed as a background, and instead of a switch seen from above show a keycap seen from above with the command it sends. Each keycap can be clicked and a panel opens on the right, where the tools were: first I choose the kind of key (symbol, layer, macro, other kinds ZMK allows), then the actions of that kind, with search when there are many and a description for each; the chosen action is shown on the keycap. Use the same project config as the connections." Split on user request: layers and layer actions (005 layers), macros and user-defined behaviors come in later features.

## Clarifications

### Session 2026-09-28

- Q: Layers now or later? → A: Later (next feature, 005 layers). This feature has exactly one layer, Base.
- Q: Is the full list of ZMK key names part of this feature? → A: Yes, with search, like every other long list of actions.
- Q: Are the wires on the Bindings canvas editable? → A: No, a dimmed read-only background ("visual sugar").
- Q: What does a keycap legend look like? → A: The pretty variant: tap action large in the center, hold action small at the bottom, symbols for modifiers and special keys.
- Q: Split the request? → A: Yes: 004 bindings-keycaps (this), 005 layers; macros, user-defined behaviors, lighting and mouse later.
- Q: Action of a newly added key? → A: Do nothing, shown as an empty keycap; not a problem.
- Q: Extras? → A: Assign one action to several selected keycaps at once; copy an action and paste it onto other keycaps. Capturing a key from the physical keyboard is not wanted.
- Q: What kind of panel is the action panel? → A: A floating panel like the Schematic tool window. Superseded by the redesign below: docked on the right at full height.
- Q: When do modifier toggles in "Send a key" apply? → A: Immediately, like choosing a key; each toggle is one undo step.
- Q: What does the panel show when the selection changes while step 2 is open? → A: Superseded by the redesign: there are no steps; the picker opens the tab that contains the selection's current key (FR-009a).
- Q (feedback after implementation): keys from Schematic are not visible in Bindings → A: both canvases share one view (pan and zoom), so Bindings shows the keys exactly where Schematic does.
- Q: Legend for a shifted symbol (DOLLAR = Shift+4)? → A: The symbol itself on a US layout ("$"), both for named shifted keys and for Shift+key built with the modifier toggles.

### Session 2026-09-28 (redesign after first implementation)

- Q: How should the key picker look? → A: A keyboard picker instead of kind → choice steps: a preview keycap at the top, one search over everything, tabs (Basic, Nav, F keys, Media, Mods, System, More) with a mini keyboard of clickable keycaps, modifier chips, "When held" as an option of the same key (turns it into mod-tap), and a press mode (normal, sticky, toggle).
- Q: Extras? → A: Automatic move to the next key after assigning (can be switched off); the panel docked on the right at full workspace height instead of floating; the Keys table collapsed by default. A "Recent" row is not wanted.
- Q: Process? → A: Amend spec 004 before committing it (not a new feature).

## Context

The Schematic workspace (spec 003) holds the keys and wires of the keyboard; the Bindings workspace (spec 001) is an empty canvas surface. This feature fills Bindings: the same keys at the same positions, drawn as keycaps with legends, over the schematic's wires dimmed into the background. Selecting keycaps opens the action panel on the right, in the slot where Schematic has its tool window. The chosen action for every key is part of the keyboard project, next to its keys and wires, so it is kept, saved to the project file and undone like any other change. A later feature generates the keymap file from it.

"Action" in the UI is what ZMK calls a binding: a behavior plus its parameters. "Kind" groups actions by behavior (send a key, hold-tap modifier, Bluetooth, …).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the keyboard as keycaps (Priority: P1)

The user opens Bindings and sees their keyboard as it will look: every key from the Schematic at the same place, drawn as a keycap seen from above, with the legend of its action. The schematic's wires are visible but dimmed behind the keycaps, so the user recognizes their drawing while keycaps stay in front. Nothing about keys or wires can be changed here.

**Why this priority**: Everything else in this feature happens on these keycaps; it also shows the project already contains a real keyboard.

**Independent Test**: Draw three keys and some wires in Schematic, switch to Bindings — three empty keycaps at the same positions, wires dimmed behind them; drag on a keycap — nothing moves.

**Acceptance Scenarios**:

1. **Given** a schematic with keys and wires, **When** the user opens Bindings, **Then** every key is drawn as a keycap at its schematic position, and every wire is drawn dimmed behind the keycaps.
2. **Given** the Bindings canvas, **When** the user drags a keycap or a wire, **Then** nothing moves and no project change is made.
3. **Given** a project with no keys, **When** the user opens Bindings, **Then** an empty state says there are no keys yet and offers to go to the Schematic workspace.
4. **Given** keys are moved, added or deleted in Schematic, **When** the user returns to Bindings, **Then** the keycaps match the new schematic.

---

### User Story 2 - Assign an action to a key (Priority: P1)

The user clicks a keycap. The panel docked on the right shows a large preview of that keycap (its legend as it will look) and the full action name. Below it one search field searches everything that can be assigned, and tabs show the choices as a mini keyboard: Basic (a US keyboard layout of letters, digits, symbols, Space, Enter, Backspace, Tab, Escape), Nav, F keys, Media, Mods, System (do nothing, pass-through, caps word, key repeat, grave/escape, Bluetooth, output, reset, bootloader) and More (every other ZMK key name by category). Clicking a mini keycap assigns it at once; the preview and the keycap on the canvas update. Modifier chips add Ctrl/Shift/Alt/GUI, "When held" turns the key into a modifier-on-hold key, and a press mode makes it sticky or a toggle. After assigning, the selection moves to the next key so a whole row can be filled by clicking A, S, D, F… in a row.

**Why this priority**: This is the feature: deciding what each key does, fast.

**Independent Test**: Click key 0, click `A` on the Basic tab — key 0 shows "A" and key 1 is selected; click `S` — key 1 shows "S"; type "spa" and press Enter — key 2 shows "␣"; reload — all kept; undo — key 2 is empty again.

**Acceptance Scenarios**:

1. **Given** a keycap is selected, **When** the panel shows it, **Then** it shows the preview keycap, the full action name, the search field, the tabs with the tab containing the current key open, and every mini keycap with its legend; the current key is marked.
2. **Given** a tab is open, **When** the user clicks a mini keycap (or presses Enter or Space on it), **Then** the action is applied to every selected key as one undo step, and the preview and canvas legends update.
3. **Given** automatic next key is on (default) and one key is selected, **When** an action is assigned from the picker, **Then** the selection moves to the next key by key index (staying on the last key); with several keys selected or the option off, the selection stays.
4. **Given** the user types in the search field, **When** text is entered, **Then** the tabs are replaced by results from every tab, matching name, alias or description ignoring case; Enter assigns the first result; clearing the field shows the tabs again; with no results "Nothing matches “…”" is shown.
5. **Given** a key sends a key, **When** the user sets "When held" to a modifier, **Then** it becomes "modifier on hold, key on tap" with the same tap key; setting it back to none makes it a plain key again.
6. **Given** a key sends a key, **When** the user picks press mode sticky or toggle, **Then** it becomes a sticky key or a key toggle with the same key; "When held" is not available in those modes.
7. **Given** the System tab, **When** the user clicks "BT 1" in the Bluetooth "Select" row, **Then** the key selects profile 1 in one click; disconnect has its own row of profiles 0–4; next, previous, clear and clear all are single buttons.
8. **Given** a keyboard-only user, **When** they focus a keycap and press Enter, **Then** focus moves to the search field; Tab reaches the tabs, the mini keyboard (one tab stop, arrows move between mini keycaps), the chips and options; Escape returns focus to the canvas keycap.

---

### User Story 3 - Readable legends (Priority: P1)

Each keycap tells what the key does at a glance: the tap action large in the center, the hold action small at the bottom. Modifiers and special keys use familiar symbols (⇧ ⌃ ⌥ ⌘ ⏎ ⌫ ⇥ ⎋ ← → ↑ ↓ …); pass-through shows ▽, do nothing shows ✕, and an unassigned key is empty. Long names are shortened to fit; the full name is in the tooltip and the accessible name.

**Why this priority**: The user asked for the command to be shown on the keycap; unreadable legends defeat the purpose.

**Independent Test**: Assign A, Shift+A, Space held as Shift, Enter, pass-through, Bluetooth select profile 1 to six keys — legends read "A", "⇧A", "␣" over "⇧", "⏎", "▽", "BT 1".

**Acceptance Scenarios**:

1. **Given** a key sends A, **When** it is drawn, **Then** the legend is "A".
2. **Given** a key sends A with left Shift and left Ctrl, **When** drawn, **Then** the legend shows the modifier symbols before the key ("⌃⇧A"); right-hand modifiers are distinguishable from left ones.
3. **Given** a key is Shift when held and Space when tapped, **When** drawn, **Then** the center shows the Space legend and the bottom shows "⇧" in a smaller size.
4. **Given** a key's legend does not fit the keycap, **When** drawn, **Then** it is shortened without overflowing the keycap, and hovering or focusing it shows the full action.
5. **Given** any keycap, **When** a screen reader reaches it, **Then** it is announced as "Key N, Base layer: <full action name>", e.g. "Key 12, Base layer: Space, Left Shift when held".

---

### User Story 4 - Several keys, copy and paste (Priority: P2)

The user selects several keycaps (Ctrl/Cmd+click, marquee, keyboard) and picks an action once; all selected keys get it in one undo step. The user can copy the action of a keycap and paste it onto one or more selected keycaps.

**Why this priority**: Saves time on repeated actions (all Bluetooth profile keys, several do-nothing keys) but the feature works without it.

**Independent Test**: Select keys 3, 4, 5, pick "Do nothing" — all three show ✕; undo once — all three are back. Copy key 0 (Space), select keys 7 and 8, paste — both show Space.

**Acceptance Scenarios**:

1. **Given** several keycaps are selected with different actions, **When** the panel opens, **Then** it states how many keys are selected and that their actions differ; no kind is marked as current.
2. **Given** several keycaps are selected, **When** the user chooses an action, **Then** every selected key gets it, as one undo step.
3. **Given** one keycap is selected, **When** the user copies (Mod+C on the canvas or the panel's copy button), **Then** its action is remembered for pasting and a status message confirms it.
4. **Given** a copied action and one or more selected keycaps, **When** the user pastes (Mod+V or the panel's paste button), **Then** every selected key gets the copied action as one undo step.
5. **Given** nothing was copied, **When** the user looks for paste, **Then** it is unavailable.

---

### User Story 5 - List alternative (Priority: P2)

Below the canvas, like the Schematic parts list and collapsed by default, a table lists every key with its action, in key order. Each row lets the user open the same action panel for that key, and rows can be selected like keycaps (shared selection). Everything possible on the canvas is possible here.

**Why this priority**: Required for keyboard and screen-reader users (AGENTS §7.8), and useful for checking all actions at once.

**Independent Test**: Unplug the mouse; assign an action to key 2 using only the table and the panel.

**Acceptance Scenarios**:

1. **Given** keys exist, **When** the table is shown, **Then** each row shows "Key N" and the full action name.
2. **Given** a row is selected in the table, **When** the canvas is shown, **Then** the same keycap is selected, and the other way round.
3. **Given** a keyboard-only user, **When** they use the table, **Then** they can select one or several keys, open the action panel, assign, copy and paste actions.

---

### User Story 6 - Actions are part of the project (Priority: P1)

Every key's action is saved with the project: kept on reload, written to the project file, and restored when it is opened. Actions belong to their key: moving, adding or deleting keys in Schematic keeps the other keys' actions. Project files from before this feature still open, with every key doing nothing.

**Why this priority**: The user required the same project config as the schematic; the keymap generator depends on it.

**Independent Test**: Assign actions to keys 0–3; delete key 1 in Schematic — keys formerly 2 and 3 (now 1 and 2) keep their actions; reload — same; save and open the file — same.

**Acceptance Scenarios**:

1. **Given** keys with actions, **When** the page reloads or the project file is saved and opened, **Then** every action is restored identically.
2. **Given** keys with actions, **When** a key is deleted in Schematic, **Then** its action is removed and every other key keeps its own action although key numbers shift.
3. **Given** a key is added in Schematic, **When** Bindings is opened, **Then** the new key does nothing (empty keycap) and no problem is reported.
4. **Given** a project file made before this feature, **When** it is opened, **Then** it loads and every key does nothing.
5. **Given** a project file whose action names an unknown key name or a Bluetooth profile outside the allowed range, **When** it is opened, **Then** the project loads and each such key is reported in the problems panel under Bindings, naming the key and what to fix. A file with an unknown kind or a malformed action is rejected with a message naming the problem, like any malformed project file, and the current project stays unchanged.

---

### Edge Cases

- The selection contains a key that is deleted in Schematic → it is dropped from the selection; with nothing selected the panel shows its "select a keycap" hint.
- Paste with a copied action onto the key it came from → allowed, no project change (no empty undo step).
- Choosing the action a key already has → no project change.
- Search with leading/trailing spaces or mixed case → trimmed, case ignored. Searching for a symbol ("$", "!") finds the shifted key names that produce it.
- Very small zoom → legends that would be unreadable are hidden; the keycap shape and selection stay visible; the table remains the full view.
- A keycap sits on top of dense wires → wires stay dimmed behind the keycap and never cover a legend.
- Bluetooth profile numbers are limited to the default five profiles (0–4); a larger number in an imported file is a problem (FR-022), not a load failure.
- Mod+C / Mod+V while typing in the search field → native text copy/paste, not action copy/paste.
- Undo in Bindings after an edit in Schematic → undoes the last project change, whichever workspace made it (one shared history).

## Requirements *(mandatory)*

### Functional Requirements

**Canvas**

- **FR-001**: The Bindings canvas MUST draw every key of the project at its schematic position as a keycap seen from above (the key's outline with a top surface, same size as the key), and every wire, junction and board pin marker of the schematic dimmed behind the keycaps. Crossing buttons and editing handles MUST NOT be shown.
- **FR-002**: Keys and wires MUST NOT be movable or editable in Bindings; pointer and keyboard gestures there change only selection and actions.
- **FR-003**: Each keycap MUST show its key number small in a corner, in addition to the legend, so it can be matched with the Schematic and the table.
- **FR-004**: With no keys in the project, Bindings MUST show an empty state with an action that switches to the Schematic workspace.
- **FR-005**: Keycaps MUST be selectable by click, Ctrl/Cmd+click (toggle), marquee, and the keyboard canvas controls from the accessibility guideline (arrows, Home/End, Ctrl/Cmd+Space, Escape). Selection is not project data.

**Legends**

- **FR-006**: Each keycap MUST show a legend derived from its action: tap part large in the center, hold part (if the action has one) small at the bottom. Modifiers and special keys MUST use symbols (at least ⇧ ⌃ ⌥ ⌘ for Shift/Ctrl/Alt/GUI, ⏎ ⌫ ⌦ ⇥ ⎋ ␣ ← → ↑ ↓ for Enter, Backspace, Delete, Tab, Escape, Space, arrows); right-hand modifiers MUST look different from left-hand ones; pass-through is ▽, do nothing is ✕, an unassigned key has no legend.
- **FR-006a**: A key that produces a shifted symbol on a US layout (a named shifted key such as Dollar, or left or right Shift plus the base key built with the toggles) MUST show that symbol ("$", "!", "(") instead of "⇧" plus the base key; other modifiers still appear as symbols before it.
- **FR-007**: A legend MUST never overflow its keycap; a legend that does not fit is shortened. The full action name MUST be available on hover and focus and in the accessible name "Key N, Base layer: <full action name>".

**Action panel (key picker)**

- **FR-008**: The panel MUST be docked on the right side of the Bindings workspace at full workspace height (not floating), collapsible to a narrow strip with its collapsed state remembered as an interface preference. With nothing selected it MUST say to select a keycap.
- **FR-009**: With keys selected the panel MUST show, top to bottom: a preview keycap with the tap and hold legends of the selection's current action and its full name (or "N keys, different actions"); one search field; the tabs Basic, Nav, F keys, Media, Mods, System, More; the chips and options of FR-011/FR-012; the automatic next key option. There are no separate kind and choice steps.
- **FR-009a**: When the selection changes, the tab that contains the selection's shared current action MUST open; unassigned or mixed selections keep the open tab. Search text is cleared when the selection changes.
- **FR-010**: Tabs MUST show their choices as mini keycaps with legends, each with its full name as accessible name and tooltip: Basic = a US ANSI layout (number row with `` ` `` - =, Q–P with [ ] \, A–L with ; ', Z–M with , . /, plus Escape, Tab, Backspace, Enter, Space); Nav = arrows, Home, End, Page Up/Down, Insert, Delete, Print Screen, Scroll Lock, Pause, locks; F keys = F1–F24; Media = media and consumer controls; Mods = the eight modifier keys; System = the non-key actions of FR-013; More = every other ZMK v0.3 key name (excluding deprecated), grouped by category (symbols, keypad, international and language, power, editing, other), each key shown once. Hovering or focusing a mini keycap shows its description and a link to the ZMK v0.3 documentation in a details line.
- **FR-011**: Modifier chips (left and right Ctrl, Shift, Alt, GUI) MUST add modifiers to the key the selection sends; when every selected key already sends a key, a chip applies immediately to each selected key keeping its own key (one undo step); otherwise chips are held and applied with the next key chosen.
- **FR-012**: "When held" MUST offer none and the eight modifiers; a modifier turns every selected key-sending key into modifier-on-hold, key-on-tap with its current key as the tap part; none turns it back. Press mode MUST offer normal, sticky and toggle; sticky and toggle keep the key and disable "When held". Changing either is one undo step.
- **FR-013**: The System tab MUST offer: do nothing, pass-through, caps word, key repeat, grave/escape, Bluetooth select profile 0–4, Bluetooth disconnect profile 0–4, next, previous, clear current, clear all profiles, output toggle/USB/Bluetooth, reset, bootloader — each applied with one click and each with a description and docs link.
- **FR-014**: One search field MUST search every choice of every tab by name, alias and description, case-insensitive, showing results as mini keycaps grouped by tab; Enter assigns the first result; an empty result shows "Nothing matches “…”".
- **FR-014a**: Automatic next key MUST be on by default and switchable (interface preference): after an action is assigned from the picker to a single selected key, the selection moves to the next key by key index; the canvas focus follows only when focus was on the canvas.
- **FR-015**: Choosing an action MUST apply it at once to every selected key as one project change (one undo step); choosing the action the selection already has MUST make no change.
- **FR-016**: With several keys selected, the panel MUST state the count and whether their actions are the same (then shown in the preview and marked) or differ.
- **FR-017**: The panel MUST NOT offer layer actions, macros, user-defined behaviors, lighting, mouse, power-off or ZMK Studio actions. *"Layer actions" superseded by spec 007, which offers them.*

**Copy and paste**

- **FR-018**: The user MUST be able to copy the action of the single selected key and paste it onto every selected key (panel buttons and Mod+C / Mod+V on the focused canvas or table), pasting as one undo step. The copied action is kept for the session only and is not project data. Both shortcuts MUST be listed in the shortcut help window.

**List alternative**

- **FR-019**: A table, collapsed by default (open state remembered), MUST list every key in key order with its full action name, share selection with the canvas, and allow opening the action panel, copying and pasting for the selected keys, all by keyboard.

**Project data**

- **FR-020**: The project MUST store actions per layer and per key; this feature has exactly one layer, named Base. The action is tied to the key, not to its position in the list, so moving, adding or deleting keys keeps every other key's action; deleting a key removes its action.
- **FR-021**: A key without a stored action MUST be treated as "do nothing" and MUST NOT be reported as a problem.
- **FR-022**: Actions in a loaded project that name an unknown key name or use a Bluetooth profile outside 0–4 MUST be reported in the problems panel under Bindings (counted in the Bindings tab badge), one issue per key, naming the key and what to do; activating the issue selects the key and opens its action panel. An unknown kind or an action with missing or extra parts MUST reject the file (malformed project file, spec 002).
- **FR-023**: Project files made before this feature MUST keep opening, with every key doing nothing.
- **FR-024**: Actions MUST be restored identically after reload and after saving and opening the project file, and every action change is one step of the shared project undo/redo.

**Accessibility**

- **FR-025**: Every operation (select, assign, copy, paste, collapse the panel, search, tabs, chips, options) MUST be possible with the keyboard alone; the canvas and the mini keyboard are one tab stop each with arrow keys inside; the panel is not modal and does not trap focus; each mini keycap has an accessible name with its full name and whether it is current.

### Out of scope

- Managing layers and layer actions (momentary, toggle, switch-to, sticky layer, layer-tap) — next feature, 005 layers.
- Macros, user-defined behaviors (hold-tap, tap-dance, mod-morph), combos, conditional layers.
- Actions that require firmware settings that do not exist yet: RGB underglow, backlight, external power, mouse, soft-off, ZMK Studio unlock.
- Tuning built-in behaviors (tapping term of mod-tap and similar).
- Capturing a key name by pressing it on the physical keyboard.
- Generating the keymap file (shield generators feature).
- Operating-system compatibility notes per key name.

### Key Entities *(include if feature involves data)*

- **Layer**: a named set of actions, one per key. Exactly one layer (Base) in this feature; a list so layers can be added later.
- **Action (binding)**: what a key does on a layer: a kind plus its parts (key name with modifiers, hold modifier and tap key, Bluetooth command and profile, output command). Tied to a key by the key's identity. Absent = do nothing.
- **Kind (behavior)**: a group of actions of one ZMK behavior, with a label, one-line description and docs link. Built-in only in this feature.
- **Key name (keycode)**: a ZMK key name from the v0.3 key list, with aliases, a description, a category and a legend.
- **Key**: from spec 003, unchanged; its number is the key index in the keymap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can assign actions to all keys of a 36-key keyboard's base layer in under 10 minutes on first try.
- **SC-002**: Finding a key name by typing part of its name, alias or description takes under 5 seconds for any of: a letter, "F13", "volume up", "$", "print screen".
- **SC-003**: 100% of actions are restored identically after reload and after save/open of the project file; project files from spec 003 open without errors.
- **SC-004**: Deleting, adding or moving keys in Schematic never changes the action of any other key (checked on a 36-key project with random deletions).
- **SC-005**: Every kind and every key name in the panel has a description and a working link to the ZMK v0.3 documentation.
- **SC-006**: Every operation in stories 2, 4 and 5 can be completed with the keyboard alone.
- **SC-007**: With 100 keys and 300 wires, opening Bindings, selecting keycaps and searching key names show no visible lag.
- **SC-008**: In a usability check, users read the action of each keycap correctly from its legend in both themes.
- **SC-009**: With automatic next key on, a user fills a 10-key row (Q–P) by ten clicks on the Basic tab, without touching the canvas, in under 20 seconds.

## Assumptions

- The keycap has the key's size from the schematic (one key unit until the layout editor adds size and rotation); its legend area follows automatically when size and rotation arrive.
- Legends assume a US keyboard layout in the operating system, as ZMK key names do.
- The GUI modifier is shown as ⌘ regardless of the user's operating system; the full name ("Left GUI") is in the tooltip and accessible name.
- Key names and their descriptions come from the MIT-licensed ZMK v0.3 key list; categories are this project's own grouping. Operating-system compatibility data is not available from that source and is not shown.
- Five Bluetooth profiles (0–4) are available, the ZMK default; changing that count is a firmware setting for a later feature.
- The Bindings canvas shares one pan and zoom with the Schematic canvas, so keys always appear where they were drawn (changed 2026-09-28 after user feedback: with separate views, keys drawn in a panned Schematic were off-screen in Bindings); grid, snap, rulers and minimap preferences apply as in spec 001.
- Undo/redo history is shared across workspaces (spec 002); an undo in Bindings can undo a Schematic change.
- Only one layer exists, so pass-through on Base behaves like do nothing in firmware; it is offered anyway because layers follow in 005.
- Depends on spec 003 (keys and wires) and spec 002 (project, autosave, file, undo). The roadmap is updated to insert this feature and 005 layers after 003 and renumber later features.

## Standard-size follow-up (2026-10-21)

The earlier read-only geometry contract is amended only for explicit standard keycap sizing. Selection, bindings, movement/nudge and unrelated Schematic behavior stay as specified. Requirements and acceptance: [012 FR-017–FR-020](../012-layout-editor/spec.md#follow-up-standard-keycap-sizes-in-bindings-2026-10-21). Existing arbitrary/custom geometry is displayed and preserved until explicit replacement. Implementation, tasks and single evidence journal are owned by 012.
