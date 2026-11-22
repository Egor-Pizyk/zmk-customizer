# Feature Specification: KLE layout import

**Feature Branch**: `018-kle-import`
**Created**: 2026-10-18
**Status**: Implemented; broad verification and manual accessibility checks pending
**Input**: Roadmap 018 — import Keyboard Layout Editor JSON into Schematic.

## Goal and scope

Reuse a layout designed in Keyboard Layout Editor without drawing its keys again.

**In scope**: Import a downloaded KLE JSON file, inspect the key count and conversion warnings, explicitly apply the layout as a new editable project, undo, save and reload.
**Non-goals**: KLE raw-data editor syntax without a JSON outer array, colors/legends/styles, inferred bindings, inferred split halves, automatic wiring, nonrectangular key shapes, runtime network requests.
**Existing contracts to preserve**: Existing project files and schema, immutable one-step Undo/Redo, offline use, keyboard access, current export validation and deterministic geometry.

## User scenarios and acceptance

### US1 — Reuse an existing layout (P1)

1. Given a project, when a downloaded KLE JSON file is selected, then its rectangular key positions, sizes and rotation clusters are read in source order and a review shows key count and omitted features before any project change.
2. Given a reviewed layout, when “Replace project with KLE layout” is activated, then Schematic shows the imported keys; the new project retains the current display name and controller, derives the technical shield name from the display name, starts with one empty Base layer and no wiring, behaviors, advanced keymap or firmware overrides, and explains that wiring and bindings still need configuration.
3. Given replacement, Undo restores the exact previous project and Redo restores the imported project. Saving, opening and reloading preserve imported geometry.

### US2 — Recover safely (P1)

1. Given malformed, wrong-shape, oversized or empty input, selection reports a readable error and leaves the current project unchanged; selecting a valid file afterwards succeeds.
2. Given unsupported appearance, decals or secondary shapes, the review lists what is omitted or approximated. Decals are skipped; nonrectangular keys use their primary rectangle. No legend becomes a binding.
3. Given a pending file read or review, a project edit, Undo, Redo or another selection invalidates the old result. A late read cannot replace newer work. Cancel discards the review.
4. All file selection, review, cancellation and apply controls work using a keyboard and have visible labels.

## Requirements

- **FR-001**: Accept standard KLE JSON: an optional leading metadata object followed by row arrays containing property objects and string keys. Support relative x/y offsets, one-key w/h, persistent r/rx/ry cluster state and row resets according to KLE semantics. Rotation properties are allowed only on the first entry of a row.
- **FR-002**: Import rectangular geometry in u/degrees and source order, assigning deterministic unique key IDs. Defaults are 1u square and zero rotation. Do not shift or normalize the source geometry.
- **FR-003**: List ignored metadata, legends/appearance, unknown properties, decals and secondary shape approximations in the review. Skip decals while still advancing the KLE cursor.
- **FR-004**: Reject non-JSON, wrong types for supported properties, nonfinite coordinates, nonpositive dimensions, no physical keys, more than 512 physical keys, and files over the existing 5 MiB project-file limit. Name the row/entry for structural failures. Never execute input.
- **FR-005**: Review before replacing. Apply atomically as one undoable edit with the US1 reset policy; cancellation and failures preserve project/history. Never silently replace a project changed since selection began.
- **FR-006**: Imported projects use existing editing, validation, autosave, JSON and export flows without a schema change. Unwired layouts remain blocked from firmware export until configured.
- **FR-007**: Expose labeled file input, review key count, warning list, explicit replacement and cancellation controls; announce failures and successful application accessibly; after Apply or Cancel return focus to the file input.

## Edge cases

Empty labels are still keys. Multiple property entries can precede a key. Width/height reset after every key, while rotation persists across rows. Negative offsets and rotated clusters remain unchanged. An object after the first top-level entry is not metadata. Empty rows advance the cursor. Extremely large finite geometry that overflows while adding offsets fails; finite geometry outside export limits remains editable and is reported by existing validation. File read failure allows retry.

## Key entities

Imported layout: ordered rectangular key geometry plus review warnings; transient, never persisted. Project keys retain the existing geometry contract. Import review captures the original project identity to prevent stale replacement.

## Success criteria

- **SC-001**: Independent fixtures for the existing six-key starter preset geometry import to the same ordered physical layouts; rotation/offset fixtures match exact expected geometry.
- **SC-002**: Every rejection/cancel/stale-read test preserves the complete original project and history.
- **SC-003**: Browser flow selects a file, reviews warnings, applies, verifies saved geometry, undoes/redoes and downloads equivalent project JSON; malformed input can be retried.

## Assumptions and open questions

The next roadmap item is 018 because 017 is recorded implemented. Downloaded strict JSON is the supported interchange format; KLE's permissive editor text is excluded and explained on failure. KLE does not identify electrical halves, so imported layouts are unibody until edited. Labels are omitted because Project has no label field; the warning makes this explicit. No new dependency or migration is needed. These defaults resolve scope without material open questions.

2026-10-26 entry-point refinement: import is offered in New rather than Schematic; see 032 FR-009/010. The reviewed replacement policy and one-step Undo remain unchanged.
