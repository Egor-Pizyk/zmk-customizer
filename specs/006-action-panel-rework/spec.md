# Feature Specification: Action panel rework

**Feature Branch**: `006-action-panel-rework`

**Created**: 2026-09-29

**Status**: Draft (redesigned 2026-10-06)

**Input**: User description: "Переработать Action panel в Bindings: Behavior визуально первый и обязательный; табы/кнопки/опции появляются только под выбранный Behavior; без выбранного Behavior нет ни одного таба/кнопки; кнопки каждого таба — вертикальным списком со скроллом, а не сеткой мини-клавиатуры."

Redesign (2026-10-06): "UX примерно как в keymap-editor (nickcoutsos): всё понятно сгруппировано, юзер видит понятный символ (или краткий тег команды) и саму команду, чтобы её можно было загуглить, и может сразу перейти в документацию." Agreed on a clickable prototype: binding line in ZMK syntax with clickable slots + one grouped picker.

Clarifications (2026-10-06):

- The keymap-editor model, checked in its source: the key shows the behavior tag (`&kp`) over its parameters; clicking the tag picks the behavior, clicking a parameter picks its value from a searchable list. This feature takes that model and adds what keymap-editor lacks: groups, visible descriptions, the ZMK code with aliases and a docs link per row.
- Panel, not a popover at the key: it serves multi-selection, has room for the tap-dance and mod-morph editors and keeps the existing keyboard model.
- `&sk`, `&kt` and `&mt` are chosen like any other behavior and keep the key. The "Press mode" radio and the "When held" select go away (supersedes spec 004 FR-012 and spec 005 US1 AS5).
- The binding line shows each value exactly as stored, which is what the keymap will contain (keycodes picked here are stored by canonical name, e.g. `LEFT_SHIFT`); rows list the canonical code and its aliases (`LSHIFT`, `LSHFT`) so either can be searched.
- Tap-dance and mod-morph have no built-in label in ZMK (`&td` does not exist; the keymap binds a user-defined node such as `&td0`, `docs/zmk/behaviors.md` §3.2–3.3). Their tag is the behavior kind (`tap-dance`, `mod-morph`) and their slots are the node's bindings, not keymap parameters.
- Keycaps on the canvas show the behavior tag; clicking it selects the key and opens its behavior slot.

## User Scenarios & Testing

### User Story 1 - Binding line with slots (Priority: P1)

The user selects a keycap. The panel shows its binding as it reads in ZMK: a behavior tag and one button per parameter ("slot"): `&mt [hold LEFT_SHIFT] [tap A]`. Clicking the tag or a slot opens the picker for exactly that part; the picker's title says what it asks for.

**Why this priority**: One mechanism replaces the behavior select, tabs, "Press mode", "When held" and the tap-dance "Change" arming; the user sees the real ZMK syntax they can look up.

**Independent Test**: Select a mod-tap key, click `tap`, pick `B` — the key becomes `&mt LEFT_SHIFT B` in one undo step; click the tag, pick `&sk` — it becomes `&sk B`.

**Acceptance Scenarios**:

1. **Given** a key with a binding, **When** it is selected, **Then** the line shows its tag and slots (kp/sk/kt: key; mt: hold, tap; bt: command, plus profile for `BT_SEL`/`BT_DISC`; out: command; tap-dance: tap 1…n and "Add tap"; mod-morph: normal, morphed; parameter-less behaviors: tag only), the first slot is open (the behavior slot when there is none).
2. **Given** an unassigned key or keys with different actions, **When** selected, **Then** the line shows only the behavior slot ("Not assigned" / "Different actions") and the picker lists behaviors.
3. **Given** a slot is open, **When** the user picks a value, **Then** it is stored for every selected key in one undo step and the next slot of the binding opens; after the last slot, "Next key after picking" moves to the next key.
4. **Given** a key that sends a key (kp, sk, kt, mt) on every selected key, **When** the user picks another of these behaviors, **Then** each key keeps its own key (mt gets `LEFT_SHIFT` as hold) in one undo step.
5. **Given** a behavior whose values cannot come from the current binding (`&kp` on an unassigned key, `&bt` on a key press), **When** chosen, **Then** the line becomes a draft with empty slots and the first empty slot opens; nothing is stored until the last slot is picked, which stores the binding in one undo step.
6. **Given** a draft of `&kp` on an empty key and "Next key after picking" on, **When** the user picks Q, **Then** the next empty key opens as the same draft, so Q–P is one pick per key.
7. **Given** a parameter-less behavior (`&trans`, `&none`, `&caps_word`, `&key_repeat`, `&gresc`, `&sys_reset`, `&bootloader`), tap-dance or mod-morph, **When** chosen, **Then** it is stored at once; tap-dance and mod-morph start from the key each selected key sends (spec 005) and open their first slot, the others count as a finished binding (auto-advance).

### User Story 2 - Grouped picker rows (Priority: P1)

Every row of the picker shows the name, the description, the exact ZMK code with its first alias (the tag for behaviors, the command for Bluetooth and output), and an external-link arrow to that section of the v0.3 docs.

**Why this priority**: The user recognizes the key by its symbol, understands it from the name and description, and can search the web or open the docs for the exact code.

**Independent Test**: Open a key slot, type "bspc" — the Editing group shows Backspace with `BACKSPACE` `BSPC`; its ↗ opens the list-of-keycodes page at the control and whitespace section.

**Acceptance Scenarios**:

1. **Given** a slot with choices from several groups, **When** the picker opens, **Then** one scrolling list shows them under sticky group headers, without category tabs or jump chips above it; it is scrolled to the slot's current value.
2. **Given** a key slot, **When** the picker opens, **Then** the groups are Letters (A–Z), Numbers, Symbols, Editing, Navigation, Modifiers, F keys, Media, Keypad, Locks, International, Power, Other, and "More media and consumer" last; every group is listed at once (no folding), so rows are reached by scrolling, search or keyboard navigation.
3. **Given** a search text, **When** typed, **Then** only matching rows of the open slot remain, still grouped; Enter picks the first; no match shows "Nothing matches …".
4. **Given** the behavior slot, **When** open, **Then** behaviors are grouped: Send a key (`&kp` `&mt` `&sk` `&kt`), Special (`&trans` `&none` `&caps_word` `&key_repeat` `&gresc`), Connection (`&bt` `&out`), Firmware (`&sys_reset` `&bootloader`), Your behaviors (tap-dance, mod-morph).

### Edge Cases

- Mixed selection: the behavior picked applies to all selected keys (one undo step); key behaviors keep each key's key when every selected key sends one, otherwise they start a draft.
- A draft stays while the selection holds the binding it was made over (stepping through empty keys keeps it); a pick, paste or undo that changes the binding drops it. Its values reset once stored.
- Undo, paste or a Schematic change can remove the open slot (a tap is gone, the behavior changed): the first slot opens instead.
- `BT_NXT` picked on `&bt BT_SEL 2` drops the profile slot; `BT_SEL` picked on `&bt BT_NXT` opens the profile slot as a draft.
- Removing the last tap of a tap-dance is not offered (at least one tap, spec 005); removing the last morph trigger is not offered.
- "Open panel" (Enter on a keycap, "Choose action" in the Keys table) focuses the open slot's search field.
- Copy and paste of an action (spec 004 FR-018) stay in the panel header.

## Requirements

### Functional Requirements

- **FR-001**: The panel MUST show the selection's binding as a line of buttons: the behavior tag (built-in ZMK label, or `tap-dance` / `mod-morph`), then one button per slot with its label and value as stored (modifiers as ZMK functions, e.g. `LC(A)`); the open slot is marked (`aria-pressed`). Below the line: the behavior's name, description and docs link, and "Draft: stored when every part is chosen" for a draft.
- **FR-002**: Slots MUST be, per behavior: kp/sk/kt key; mt hold, tap; bt command (+ profile for `BT_SEL`, `BT_DISC`); out command; tap-dance tap 1…n; mod-morph normal, morphed; none for parameter-less behaviors. Unassigned and mixed selections have only the behavior slot.
- **FR-003**: The picker MUST edit the open slot only; its title names what is asked ("What should the key do?", "Which key?", "Which modifier while held?", "Which key when tapped?", "Which Bluetooth command?", "Which profile?", "Where should keys go?", "Which key for tap N?", "Which key normally?", "Which key while the triggers are held?").
- **FR-004**: Choices per slot: behavior → the 15 behaviors grouped (US2 AS4); key, tap, tap N, normal, morphed → every v0.3 keycode grouped (US2 AS2); hold → the 8 modifier keys; bt command → the 6 Bluetooth commands; profile → 0–4; out command → the 3 output commands.
- **FR-005**: Each row MUST show name, description, the ZMK code with its first alias (keycodes), the tag (behaviors) or the command (Bluetooth, output, profile), a current mark, and an external-link arrow to the v0.3 docs section; the link opens in a new tab and says so to screen readers. Every alias stays searchable.
- **FR-006**: Rows MUST be one scrolling list with sticky group headers, no category tabs or jump-chip navigation, every group listed at once, and open scrolled to the current value.
- **FR-007**: Search MUST filter the open slot's choices by name, code, alias, legend and description (spec 004 FR-014 matching), keep groups, pick the first match on Enter.
- **FR-008**: Picking MUST follow the binding: a value on a stored binding is stored at once for all selected keys (one undo step); switching among kp/sk/kt/mt keeps each key's key when every selected key sends one (mt hold `LEFT_SHIFT`); parameter-less behaviors, tap-dance and mod-morph are stored at once; every other behavior choice starts a draft (FR-009).
- **FR-009**: A draft MUST hold the chosen behavior and the values picked so far, store nothing until complete, then store the binding for every selected key in one undo step. It is UI state (not saved, not undone), kept while the selection holds the binding it was made over, values cleared after storing.
- **FR-010**: Under the picker the panel MUST show what the open slot needs besides its value: modifier chips for kp key, mt tap, tap N, normal and morphed (spec 004 FR-011; held for the key picked next in a draft); for tap-dance "Remove tap" for the open tap (not for the last) and the pause (0–5000 ms, spec 005 FR-008); for mod-morph the trigger modifiers (at least one); always "Next key after picking".
- **FR-011**: After a pick the next slot of the binding MUST open; after the last slot (or a parameter-less behavior) the selection moves to the next key when "Next key after picking" is on (spec 004 FR-014a). Switching among kp/sk/kt/mt, tap-dance and mod-morph open the new binding's first slot.
- **FR-012**: Keyboard: line buttons are normal tab stops in order; the list is one tab stop (roving), ArrowUp/ArrowDown/Home/End move, Enter/Space pick, ArrowRight moves to the row's docs link and ArrowLeft back, ArrowUp on the first row returns to search, Escape returns to the canvas (spec 004 FR-025). "Open panel" focuses the search field.
- **FR-013**: Keycaps on the canvas MUST show the behavior tag in the top-right corner; a click on the tag selects the key and opens its behavior slot. A key whose base key has a Shift symbol on a US layout (`]` and `}`, `1` and `!`) shows both, the sent symbol larger and the Shift symbol smaller and muted beside it; a shifted or modified key shows only what it sends.
- **FR-014**: Selection, multi-selection, copy/paste, undo granularity and validation MUST NOT change (spec 004 FR-015, FR-018; spec 005 FR-012–FR-014).

### Key Entities

- **Slot**: one part of a binding the user picks: behavior, key, hold, tap, command, profile, tap N, normal or morphed.
- **Draft**: a chosen behavior with the slot values picked so far and the binding it was made over.
- **Choice**: one picker row: name, description, codes, docs URL and the value it sets.

## Success Criteria

- **SC-001**: A user with an empty key sees the behaviors first and stores a key press in two picks.
- **SC-002**: Changing one part of a binding (tap of a mod-tap, profile of `&bt`) takes one click on the slot and one pick.
- **SC-003**: Assigning Q–P to 10 empty keys with "Next key after picking" takes one behavior pick and 10 key picks.
- **SC-004**: Every row's ZMK code is visible and its docs link reachable by pointer and keyboard.

## Assumptions

- Domain stays as is except one operation that switches among kp/sk/kt/mt keeping the key, and one query telling whether every selected key sends a key. Persistence and validation do not change.
- Replaced UI: behavior select, picker tabs, mini keyboard, preview keycap with hover details line, "Press mode", "When held", tap-dance and mod-morph "Change" arming.
- Legends of rare consumer codes (`C_ACRF`) stay as the catalog gives them; better legends are a separate catalog change.
- The Action panel opens 448 px wide by default (was 384 px, spec 004); a stored width is kept, double-clicking the resize edge restores the default.
