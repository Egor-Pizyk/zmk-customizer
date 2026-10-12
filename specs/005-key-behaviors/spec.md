# Feature Specification: Key behaviors

**Feature Branch**: `005-key-behaviors`

**Created**: 2026-09-29

**Status**: Draft

**Input**: User description: "Расширить выбор поведения клавиши во вкладке Bindings: сначала выбирается поведение (как в keymap-editor), потом его параметры. Слот уже есть (behavior-section, сейчас только Key press). Порядок: фаза 0 — включить существующие kinds как выбираемые поведения (trans, none, caps_word, key_repeat, gresc, bt, out, sys_reset, bootloader; sk/kt/mt уже доступны через Press mode/hold); фаза 1 — новые самодостаточные tap-dance и mod-morph (только если есть в ZMK v0.3, main-only запрещено). Заблокировано до слоёв (отдельная фича): mo/lt/tog/to/sl. Не делать: комбо, макросы, conditional layers, RGB/backlight/mouse/soft-off/Studio, GitHub-интеграция."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose a self-contained behavior for a key (Priority: P1)

The user selects a key and sees the list of behaviors the key can have: sending a key, modifier-on-hold, sticky key, key toggle, pass-through, do nothing, caps word, key repeat, grave/escape, Bluetooth commands, output selection, reset and bootloader. Choosing one applies it at once; the keycap legend, tooltip and accessible name update to describe the new action.

**Why this priority**: This is the core of the feature — every behavior the project already understands becomes actually choosable, without any new ZMK concepts.

**Independent Test**: Open a project with several keys, select a key, pick each behavior from the list in turn — each time the keycap, tooltip and table row describe the chosen behavior; reload — all kept.

**Acceptance Scenarios**:

1. **Given** a key is selected, **When** the user opens the behavior control, **Then** every self-contained behavior (pass-through, do nothing, caps word, key repeat, grave/escape, Bluetooth, output, reset, bootloader, plus the already available key press, modifier-on-hold, sticky and toggle) is offered in one compact control showing the current behavior, each with a one-line description and a link to the ZMK v0.3 documentation shown in the details line; the control collapses after choosing.
2. **Given** a key with any action, **When** the user picks "Do nothing" or "Pass-through", **Then** no further parameters are asked and the keycap shows the corresponding symbol (✕ / ▽).
3. **Given** a key with any action, **When** the user picks "Bluetooth" or "Output", **Then** the existing command/profile choices are offered (profiles 0–4, next/previous/clear/clear-all, toggle/USB/Bluetooth) and applied in one step.
4. **Given** a key sending a key, **When** the user picks a modifier as "When held" or sticky/toggle press mode, **Then** it becomes modifier-on-hold, sticky or toggle with the same key, as before.
5. **Given** the behavior control, **When** it lists modifier-on-hold, sticky and toggle, **Then** those entries are shown disabled with a note that they are configured with the "When held" and "Press mode" controls below (they cannot be created from the list alone).

---

### User Story 2 - Key does different things on repeated taps (tap-dance) (Priority: P2)

The user makes a key send one action on a single tap, another on a double tap, and optionally more on further taps (for example tap → `A`, double-tap → `B`, triple-tap → `C`), with a tunable pause after which the tap count resolves.

**Why this priority**: Tap-dance is self-contained (needs no layers, no firmware settings) and covers a popular use case from the reference tool; it is the first genuinely new behavior.

**Independent Test**: Assign tap-dance with two taps to a key, reload and re-export the project file — the two tap actions and the timing survive; the keycap shows the first two actions.

**Acceptance Scenarios**:

1. **Given** a key is selected, **When** the user picks "Tap dance", **Then** they can set the tap actions one by one (each tap action is any key-sending action) and the resolving pause.
2. **Given** a tap-dance key with two taps set, **When** it is drawn, **Then** the keycap identifies it as tap-dance (first actions readable, full list in tooltip and accessible name).
3. **Given** a tap-dance key, **When** the user removes a tap or changes the pause, **Then** the change applies as one undo step.

---

### User Story 3 - Key changes meaning with a modifier held (mod-morph) (Priority: P2)

The user makes a key send one action normally and another one while a chosen modifier is held (for example normally `Escape`, with Shift held `` ` `` — the built-in grave/escape stays a one-click preset of this).

**Why this priority**: Mod-morph is the second self-contained behavior; together with tap-dance it completes the set that needs no layers.

**Independent Test**: Assign normal `A` / morphed `B` with Shift to a key, reload — normal, morphed and modifier choices survive; tooltip names both actions and the modifier.

**Acceptance Scenarios**:

1. **Given** a key is selected, **When** the user picks "Mod-morph", **Then** they can set the normal action, the morphed action and which modifiers trigger the morph.
2. **Given** a mod-morph key, **When** it is drawn, **Then** the keycap shows the normal action with a mark that a morphed variant exists; the full description is in the tooltip and accessible name.
3. **Given** the behavior list, **When** the user looks for grave/escape, **Then** it is still offered as a one-click preset alongside the configurable mod-morph.

---

### User Story 4 - Layer behaviors stay out until layers exist (Priority: P3)

> Superseded by spec 007 (layers): layer behaviors are offered and stored by layer id.

The user does not see momentary/toggle/switch-to/sticky-layer/layer-tap behaviors while the project has exactly one layer, because there is no layer to point them at.

**Why this priority**: Guards the scope boundary with the layers feature; prevents bindings that cannot reference anything.

**Independent Test**: Open the behavior list on a single-layer project — no layer behaviors are offered.

**Acceptance Scenarios**:

1. **Given** a project with exactly one layer, **When** the user opens the behavior list, **Then** no behavior that needs a layer reference is offered.
2. **Given** a project file that references a layer behavior, **When** it is opened, **Then** it is rejected with a message naming the problem and the current project stays unchanged.

---

### Edge Cases

- Switching behavior discards parameters the new behavior does not use (for example tap key of a modifier-on-hold when switching to do-nothing); switching back does not restore them; each switch is one undo step.
- Tap-dance with a single tap behaves like its single action but stays tap-dance (explicit user choice, not simplified away).
- Tap-dance tap actions are key-sending actions only; actions needing two cells (Bluetooth clear/next/previous and similar) cannot be a tap and are not offered there.
- Mod-morph where normal and morphed actions are equal is allowed but reported as needing attention in the problems panel.
- Timing values outside the plausible range (negative or longer than a few seconds) are rejected where entered, with the allowed range shown.
- Imported project with an unknown behavior kind or malformed behavior parts is rejected with a message naming the problem; the current project stays unchanged (same rule as spec 004 FR-022).
- Imported tap-dance/mod-morph with out-of-range references is loaded with each affected key reported under Bindings, naming the key and what to fix.

## Requirements *(mandatory)*

### Functional Requirements

**Behavior list (phase 0 — existing kinds)**

- **FR-001**: The behavior control MUST offer every self-contained behavior the project already stores: key press, modifier-on-hold, sticky key, key toggle, pass-through, do nothing, caps word, key repeat, grave/escape, Bluetooth, output, reset, bootloader — each with a one-line description and a link to the exact ZMK v0.3 documentation section. The control MUST be compact (one line showing the current behavior, expanding on demand and collapsing after choosing); descriptions, hints and docs links live in the details line, not in the control itself.
- **FR-002**: Behaviors that need no parameters (pass-through, do nothing, caps word, key repeat, grave/escape, reset, bootloader) MUST apply in one step with no further questions.
- **FR-003**: Bluetooth and output behaviors MUST reuse the existing command/profile choices (profiles limited to the default five, 0–4); a profile outside 0–4 in an imported file MUST be reported under Bindings, one issue per key.
- **FR-004**: Sticky key, key toggle and modifier-on-hold MUST stay reachable through the existing press-mode and "When held" controls; the behavior list MUST NOT duplicate them as separate parameter flows.
- **FR-005**: Every keycap legend, tooltip, corner key number and accessible name MUST update for every newly offered behavior following the same legend rules as existing behaviors; new legends MUST be short (7 characters or fewer) and never overflow the keycap.

**Tap-dance (phase 1)**

- **FR-006**: The behavior list MUST offer tap-dance (only because it exists in ZMK v0.3; anything marked main-only MUST NOT be offered).
- **FR-007**: A tap-dance MUST hold an ordered list of at least one tap action plus the resolving pause; each tap action MUST be a key-sending action (key name with optional modifiers).
- **FR-008**: The resolving pause MUST be editable with its allowed range shown; out-of-range values MUST be rejected where entered.

**Mod-morph (phase 1)**

- **FR-009**: The behavior list MUST offer configurable mod-morph (only because it exists in ZMK v0.3; anything marked main-only MUST NOT be offered).
- **FR-010**: A mod-morph MUST hold a normal action, a morphed action (both key-sending) and the set of modifiers that trigger the morph; every combination MUST be expressible, including the built-in grave/escape as a preset.
- **FR-011**: A mod-morph whose normal and morphed actions are equal MUST be reported in the problems panel under Bindings.

**Project data and validation**

- **FR-012**: Every new behavior MUST survive reload and save/open of the project file identically; every behavior change MUST be one step of the shared undo/redo; project files from before this feature MUST keep opening with every key unchanged.
- **FR-013**: Validation MUST check every new behavior (tap actions known, pause in range, morph actions known and distinct, modifier set non-empty) and report one issue per offending key under Bindings; unknown kinds or malformed parts MUST reject the file with a message naming the problem.
- **FR-014**: Each behavior MUST be applicable to several selected keys at once and via copy/paste exactly like existing behaviors (one undo step).

**Out of scope (MUST NOT be offered or stored)**

- **FR-015**: Layer behaviors (momentary, layer-tap, toggle, switch-to, sticky layer) MUST NOT be offered or accepted while the project has exactly one layer; they belong to the layers feature. *Superseded by spec 007.*
- **FR-016**: Combos, macros and conditional layers MUST NOT be offered (separate feature).
- **FR-017**: Behaviors needing firmware settings that do not exist yet (RGB underglow, backlight, external power, mouse, soft-off, ZMK Studio unlock) MUST NOT be offered.
- **FR-018**: Generating keymap text or `behaviors {}` sections MUST NOT be part of this feature (generator feature); persistence of the new behaviors is required so generation can use them later.
- **FR-019**: The visual design and flow of the picker (behavior first, then parameters, following the reference tool) MUST stay unchanged; this feature only adds choices to the existing slot.

### Key Entities *(include if feature involves data)*

- **Behavior**: what a key does — one of the ZMK built-in behaviors (key press, modifier-on-hold, sticky, toggle, pass-through, do nothing, caps word, key repeat, grave/escape, Bluetooth, output, reset, bootloader) or a user-configured tap-dance / mod-morph instance defined by this feature.
- **Tap-dance**: a behavior with an ordered list of tap actions (first tap, double tap, …) and a resolving pause.
- **Mod-morph**: a behavior with a normal action, a morphed action and the modifier set that switches between them.
- **Binding**: the behavior plus its parameters stored per key on the single Base layer (spec 004), extended with the two new behavior shapes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can assign each of the phase-0 behaviors to a key in under 30 seconds per behavior on first try, including finding it by search.
- **SC-002**: A user can create a two-tap tap-dance and a mod-morph key from scratch in under 2 minutes each on first try.
- **SC-003**: 100% of new behaviors are restored identically after reload and after saving and opening the project file.
- **SC-004**: Every behavior in the list has a one-line description and a working link to the ZMK v0.3 documentation (automated check: no entry without both).
- **SC-005**: Searching by behavior name, key name or description finds tap-dance and mod-morph in under 5 seconds.
- **SC-006**: Users read the action of tap-dance and mod-morph keycaps correctly from legend plus tooltip in both themes (usability check on 6 keys).
- **SC-007**: No layer behavior, combo, macro, lighting, mouse or Studio action is reachable in the UI while this feature is the latest (manual walkthrough of the full behavior list).

## Assumptions

- Single Base layer only; multiple layers and layer references come from the separate layers feature (roadmap item 005-layers, still to be specified; this spec merely occupies directory number 005 by creation order).
- ZMK target stays v0.3.0; tap-dance and mod-morph are both described as available in v0.3 in the project's verified ZMK behavior notes (§§3.2–3.3), so both are in scope; if verification during planning shows otherwise for either, that behavior drops out of scope.
- Tap-dance tap actions limited to key-sending actions (two-cell behaviors such as Bluetooth clear/next cannot be tap actions per the verified ZMK behavior notes §3.1).
- Bluetooth profile count stays at the ZMK default five (0–4), as in spec 004.
- Keymap text generation for the new behaviors comes later with the generator feature; this feature only stores, validates and displays them.
- Implementation proceeds one behavior per change, phase-0 behaviors first, then tap-dance, then mod-morph.
