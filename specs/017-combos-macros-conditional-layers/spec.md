# Feature Specification: Combos, macros and conditional layers

**Feature Branch**: `017-combos-macros-conditional-layers`
**Created**: 2026-10-18
**Status**: Implemented; automated verification complete. Manual limits recorded in [verification.md](verification.md).
**Input**: Roadmap 017, following custom behaviors 016.

## Goal and scope

Complete the advanced keymap sections in Bindings: actions triggered by simultaneous keys, reusable sequences of actions/pauses, and layers automatically activated by other layers.

**In scope**: Create/edit/delete combos, zero-parameter macros and conditional layer rules; assign macros like behaviors; deterministic ZMK export; validation, persistence, Undo/Redo and keyboard alternatives.
**Non-goals**: Parameterized macros, arbitrary Devicetree, new hardware, main-only options or editing other behavior types beyond the integration required to reference macros.
**Existing contracts to preserve**: Behavior library 016, layer/key identity, existing imports, offline operation, accessible input, one history step per edit, invalid export blocking.

## User scenarios and acceptance

### US1 — Trigger an action with a combo (P1)

1. Select at least two keys using the layout or labeled key choices, create a named combo, choose its action, timeout and optional layer filter. Export contains the intended current positions and binding.
2. Reorder keys: the combo still refers to the same physical keys and exports their new indices. Delete a referenced key: retain the reference, report the combo, block export. Undo repairs it exactly.
3. Edit the combo entirely with keyboard controls; its key selection is visible on the keyboard when requested and also available as labeled checkboxes.

### US2 — Reuse a sequence (P1)

1. Create a named macro with ordered tap, press, release and pause steps; edit, add, remove and reorder steps. Assign it to a key or use it as a combo, tap-dance or mod-morph action.
2. Set tap duration and interval between actions. A pause waits its requested duration without emitting a host key; following steps return to the macro's configured interval/duration.
3. Save/reload and download/import preserve the sequence and assignments. Deleting a used macro retains dangling references with clear owner errors; Undo restores it.

### US3 — Activate a layer automatically (P1)

1. Choose two or more input layers and a target layer. When all inputs are active, the generated rule activates the target.
2. Reorder/delete layers: references follow identity; missing targets, duplicate inputs, target among inputs, duplicate controlled target or circular dependencies report the rule and block export.
3. Explain that the conditional rule controls its target and that higher layers take priority. Invalid ordering (target below inputs) is reported for repair.

## Requirements

- **FR-001**: CRUD named combos with 2–20 distinct key IDs, one Binding action, whole timeout 1–5000 ms and an optional filter of existing layer IDs; empty filter means all layers (US1).
- **FR-002**: Combo key identities survive reordering; deleted key/layer references remain visible as problems, never silently retarget or disappear (US1).
- **FR-003**: CRUD named zero-parameter macros with 1–64 stable, ordered steps (tap/press/release Binding, or pause in whole 0–5000 ms); expose tap duration and inter-action wait in whole 0–5000 ms. Expanded output must stay within ZMK's 256-binding list and behavior queue limits (US2).
- **FR-004**: Macros appear alongside behaviors in the picker and are usable by combo, macro step and named tap-dance/mod-morph actions. Hold-tap child targets retain the built-in choices from 016. Validate direct/indirect cycles spanning macros and behaviors. Deletion reports every affected key, combo, macro or behavior (US2).
- **FR-005**: CRUD conditional rules with existing input/target layer IDs, at least two distinct inputs, target above each input, unique controlled targets and no dependency cycles. Explain automatic target ownership (US3).
- **FR-006**: Emit one `combos {}` container, one `macros {}` container and one `conditional_layers {}` container when nonempty; omit empty sections. Sort named entities explicitly, sanitize names and keep labels unique across custom behaviors, macros and built-ins. Resolve positions/layers at export time (US1–US3).
- **FR-007**: Store all edits in the single project, preserving old files through migration. Every gesture is one Undo/Redo step. Malformed or excessive structures are rejected without replacing the current project; dangling semantic references remain repairable (US1–US3).
- **FR-008**: Every exposed ZMK setting has a description and pinned v0.3 link. Controls are labeled and keyboard reachable; problem activation focuses the owning editor; invalid projects cannot download (US1–US3).

## Edge cases

No keys/layers; one-key combo; duplicate or deleted combo keys; overlapping combos; layer reorder; all-layers filter; empty/duplicate/punctuation-only names; macro containing named behavior containing the macro; repeated pause steps and zero-duration pause; step deletion/reorder while focused; empty macro; excessive expanded steps/queue cost; deleted or duplicate conditional targets; chains of conditional rules; cancelled input drafts; clipboard reference after deletion.

## Key entities

Combo with stable identity/name, stable key IDs and optional layer IDs, timeout and one binding. Macro with stable identity/name, stable ordered step IDs, durations and reference binding. Conditional rule with identity, input layer IDs and target layer ID. All relationships retain stable identity independently of display names and positions.

## Success criteria

- **SC-001**: Independent golden tests cover each new section, advanced bindings and pause expansion, with pinned firmware compilation.
- **SC-002**: Real browser journeys create and export each entity; downloaded JSON/ZIP matches the saved project and preview.
- **SC-003**: Deletion, reorder, Undo/Redo and reload preserve identity or show each broken reference and block export.

## Assumptions and open questions

Use existing English UI and v0.3 defaults (combo 50 ms; macro 15 ms wait, 30 ms tap). Macro pause expansion is a generator design detail that must be verified against pinned source before implementation. UI step limit 64 is subordinate to expanded binding/queue limits; validation may require a smaller sequence. Conditional target ordering is enforced to keep automatic activation predictable. No material product clarification is needed.
