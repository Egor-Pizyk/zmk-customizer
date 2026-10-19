# Feature Specification: Custom behaviors

**Feature Branch**: `016-custom-behaviors`
**Created**: 2026-10-18
**Status**: Implemented; automated verification complete (manual limits in verification.md)
**Input**: Roadmap 016; user requested implementation of 016 followed by 017.

## Goal and scope

Create reusable named hold-tap, tap-dance, mod-morph and tuned sticky key/layer behaviors in Bindings and assign them to keys. Explain each setting with its pinned ZMK documentation.

**In scope**: Create, edit, delete, assign, validate, persist and export these five behavior types.
**Non-goals**: Macros and combos (017), arbitrary Devicetree, new hardware or main-only ZMK features.
**Existing contracts to preserve**: Existing inline behaviors, built-ins, old project files, immutable edits, one undo step per gesture, keyboard access and blocked invalid exports.

## User scenarios and acceptance

### US1 — Reuse a configured behavior (P1)

1. Create a named balanced hold-tap, set hold/tap actions and timing, assign it to two keys. Both keys use that definition; editing timing changes their exported behavior without replacing bindings.
2. Create tap-dance with ordered actions, mod-morph with trigger/retained modifiers, sticky key and sticky layer. Each can be configured, assigned and exported.
3. Create and edit using labeled keyboard-reachable controls; close the editor without changing existing selection.

### US2 — Recover from broken references (P1)

1. Delete a behavior used by two keys. Both keys appear in Bindings problems; export is blocked. Undo restores the exact definition and clears the errors.
2. Delete a layer used by a custom action or parameter. Report its owning behavior or key. Reordering layers retains target identity.

### US3 — Keep work and generate valid firmware (P1)

1. Save/reload and export/import retain all definitions and assignments exactly.
2. Open an old project: existing bindings and output are preserved.
3. Export valid instances of every type: named behavior nodes and references target pinned ZMK v0.3.0.

## Requirements

- **FR-001**: Create, rename, edit and delete five named behavior types; each edit is undoable/redoable and persists through existing project flows (US1/US3).
- **FR-002**: Hold-tap exposes hold/tap behavior choices (zero/one parameter built-ins), flavor, tapping term, quick-tap, prior-idle, retro-tap, hold-while-undecided, linger, positional triggers and trigger-on-release. Assignments supply typed key/layer parameters, with dummy zero for zero-cell actions (US1).
- **FR-003**: Tap-dance exposes ordered actions and tapping term. Mod-morph exposes two actions, trigger modifiers and retained modifiers. Tuned sticky key/layer expose release timeout, quick release, lazy and ignore modifiers with key/layer assignment parameters (US1).
- **FR-004**: Definitions appear alongside built-ins in the Action picker; assignments retain stable definition identity through rename. Show readable names and typed parameters (US1).
- **FR-005**: Generate deterministic `behaviors {}` nodes with sanitized unique labels that cannot collide with built-ins or inline generated definitions; preserve old inline output (US3).
- **FR-006**: Validate missing references, cycles, incompatible argument shapes, empty action lists, unknown keycodes, modifiers and timing. Timing is integral 0–5000 ms, with -1 allowed only for disabled quick-tap/prior-idle. Positional triggers reference key identities and report deleted keys (US2).
- **FR-007**: Deleting a used behavior retains its references and reports every affected key/layer and dependent definition. Invalid exports stay blocked; problem activation navigates to the owning key or editor (US2).
- **FR-008**: Every exposed ZMK property has a short description and exact v0.3 documentation link (US1).
- **FR-009**: Old projects migrate without data loss; malformed and excessive definitions/arguments are rejected at import; dangling semantic references remain repairable (US3).

## Edge cases

Empty/duplicate/punctuation-only names; built-in label collision; shared definitions; zero-cell hold-tap children; removed layers/keys; invalid retained modifier subsets; circular custom actions; cancelled drafts; no selected key; definition deletion followed by Undo/Redo; imports with excessive nesting or collection sizes.

## Key entities

Named behavior with stable identity and one of five typed configurations; a reference binding with typed key/layer/dummy parameters; referenced keys/layers retain stable identity.

## Success criteria

- **SC-001**: All five types pass independent golden contracts and real create/assign/edit/delete recovery flows.
- **SC-002**: Two assigned keys retain a shared definition after rename, reload, file round trip and Undo/Redo.
- **SC-003**: Every dangling assignment blocks export and identifies its owning key or definition.

## Assumptions and open questions

Use the existing English UI and default timing from pinned notes. Reusable hold-taps support zero/one-cell built-ins; two-cell children need macro wrappers in a later extension. Parameterized macros are outside 017's initial scope. No material product questions remain. Clarification scan: scope, identity, lifecycle, UX, compatibility, validation and completion are clear; implementation choices are deferred to plan.
