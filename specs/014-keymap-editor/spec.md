# Feature Specification: Keymap editor acceptance

**Feature Branch**: `014-keymap-editor`
**Created**: 2026-10-17
**Status**: Implemented; manual accessibility verification pending
**Input**: Complete roadmap 014 after its editor capabilities delivered in 004 and 007.

## Goal and scope

A keyboard preset can pass through the Bindings editor, project save/open and configuration download without changing its keymap. Close discovered gaps in existing keymap editing rather than duplicate the capabilities of 004–007.

**In scope**: Every currently available preset; physical keymap and accessible Keys table; layer identity and missing-target errors; keyboard keycode discovery by name, alias and category; documentation for catalog choices; exact exported keymap bytes.
**Non-goals**: New presets, custom behavior definitions (016), combos/macros/conditional layers (017), Kconfig settings (015), firmware compilation features.
**Existing contracts to preserve**: Project compatibility, autosave, undo/redo, key identity, pinned ZMK v0.3 output, export validation and keyboard access.

## User scenarios and acceptance

### US1 — Preserve a preset through the editor (P1)

1. Given each available preset, when users visit every layer and inspect its key actions without editing, save the project, reopen it and download the configuration, then both keymap copies in the configuration exactly match the approved golden file and project data remains equal.
2. Given an open key's action, when the user cancels or searches without choosing a replacement, then bindings and undo history remain unchanged and Escape returns focus to the inspected key.

### US2 — Find and safely edit actions (P1)

1. Given a key action, when users search by key name or alias using the keyboard, then the appropriate keycode is offered and can be chosen with Enter.
2. Given grouped keycodes, when users search by category using the keyboard, then matching category choices remain available and unrelated categories are excluded.
3. Given layer references, when users reorder layers, then references still target the same layer and emitted indices follow the new order; when users delete that layer, every referencing key reports an actionable Bindings error and export is blocked until fixed or undone.
4. Every offered keycode and behavior explains itself and has a pinned-version documentation link.

## Requirements

- **FR-001 (US1)**: No-edit editor, saved-file and reopened-project round trips MUST preserve all preset data and byte-identical keymap golden output for each available preset.
- **FR-002 (US1)**: Layer navigation, key inspection and cancelled keycode searches MUST NOT create project edits or undo entries; Escape after table inspection MUST focus that inspected key.
- **FR-003 (US2)**: Keycode discovery MUST support name, alias and category using keyboard controls and commit the chosen keycode to only the selected layer/key.
- **FR-004 (US2)**: Layer reorder MUST preserve targets and use their new generated indices; deleting a referenced layer MUST identify every referencing key under Bindings and block export; undo MUST restore exact project and output.
- **FR-005 (US2)**: Every behavior and keycode catalog entry MUST have a nonempty description and v0.3 documentation URL.
- **FR-006 (US1)**: Bindings MUST be inspectable on the physical layout and through the keyboard-accessible Keys table on each layer.

## Edge cases

Missing layer targets must never silently retarget a new layer. Empty/no-match searches and Escape must preserve data. Generated tap-dance/mod-morph definitions, Bluetooth/output includes and layer references must survive the no-edit path. No additional preset is implied by upstream reference fixtures that are not offered by the application.

## Key entities

Project contains ordered physical keys and layers; bindings reference key and layer identities. A preset is an available complete example. A golden file is the independently approved expected configuration text.

## Success criteria

- **SC-001**: 100% of available presets preserve exact project data and both exported keymap copies after the no-edit round trip.
- **SC-002**: Name, alias and category keyboard discovery each succeeds; cancellation makes zero edits.
- **SC-003**: Every missing target is reported, reorder preserves targets, and undo restores the original output.
- **SC-004**: 100% of behavior/keycode entries explain and link their choice.

## Assumptions and open questions

Clarification scan 2026-10-17: no material open questions. Defaults: available presets means the current application catalog (currently Unibody six); compare against approved generated golden files, whose differences from verbatim upstream examples are already documented. Preserve the original roadmap acceptance while reusing completed 004/007 work. Category search means entering a group name in the existing search field, not adding a second category control.
