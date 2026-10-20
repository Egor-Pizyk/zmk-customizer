# Feature Specification: Keyboard presets

**Feature Branch**: `031-keyboard-presets`
**Created**: 2026-10-19
**Status**: Implemented; automated checks passed, manual accessibility pending (T008)
**Input**: Implement roadmap 031, keyboard preset library.

## Goal and scope

Start an editable custom keyboard from a familiar layout instead of placing every key.

**In scope**: Offline browsable library, geometry preview and accessible description, QWERTY or empty bindings, safe project creation and existing starter preservation.
**Non-goals**: PCB cloning, inferred actual hardware wiring, automatic layers, network downloads, building/flashing firmware, extra encoders/displays/lighting.
**Existing contracts to preserve**: Existing project files and old imports, deterministic export and validation, New/Open history reset, immutable edits and Undo/Redo, keyboard access.

## User scenarios and acceptance

### US1 — Choose a starting layout (P1)

1. Given New, select any preset and inspect its name, key count, unibody/split structure and key geometry before creation; browsing does not alter or save the current project.
2. Choose QWERTY or empty keymap; creating either yields identical geometry and half assignments, with one Base layer. QWERTY assigns supported standard US keycodes; empty leaves bindings unassigned.
3. The preview explains missing standard keys and that controller/wiring/diodes must be configured. No layout-only preset claims to be buildable.
4. The existing six-key wired starter and empty New action remain available.

### US2 — Keep and continue work (P1)

1. Given existing work, New warns that replacement clears history and offers Save to file and Cancel. Cancel/Escape and preview choices preserve current work and history. Explicit creation replaces the project and clears history, matching existing New behavior.
2. Created projects support ordinary edits, exact edit Undo/Redo, save/open/reload and existing export validation; incomplete wiring blocks ZIP until repaired.
3. All choices and creation work by keyboard. Closing the dialog returns focus to New; geometry has a readable per-key alternative.

## Requirements

- **FR-001**: Include ANSI 104-key full-size, ANSI 87-key TKL, compact 84-key 75%, compact 68-key 65%, ANSI 61-key 60%, ortholinear 5×12 60-key 50%, ortholinear 4×12 48-key 40%, 3×3 nine-key macropad, Corne six-column 42-key (0.25u extra thumb and half clearance), Lily58 rev1 58-key, and Sofle rev1 58-key variants. Names/counts distinguish exact variants; existing six-key starter stays available separately.
- **FR-002**: Preview key rectangles with sizes/rotations, readable name/count/structure and a per-key geometry list. Preserve preview geometry, key order and split halves on creation.
- **FR-003**: Offer QWERTY and empty modes for each library entry. QWERTY is a single Base layer adapted to available positions, not a promise of all full-size keys. Show variant-specific omitted groups and manual/layer setup guidance; macropad uses N1–N9.
- **FR-004**: Library entries create layout-only projects using the current controller as a starting choice, no wires, no diodes, no advanced keymap/hardware and no firmware overrides. Split presets set split topology and explicit half assignments. Explain that the controller is retained and needs checking, and wiring/pins/diodes remain to configure.
- **FR-005**: Never replace before the explicit creation action. Warn and offer Save/Cancel; creation resets history like New. Subsequent edits use normal Undo/Redo. Preserve the existing complete six-key starter unchanged.
- **FR-006**: Created projects remain ordinary compatible projects, round-trip through existing storage, and use existing validation/export. No new runtime dependency or network request.
- **FR-007**: Native labeled keyboard choices, focus return, scrollable modal content and accessible geometry description work at desktop and narrower/zoomed widths.

## Edge cases

Repeated browsing and mode changes never autosave. Cancellation keeps history. Compact missing keys require user-assigned layers, never silent invented bindings. Split halves are physical assignments, not evidence of PCB wiring. Selecting an unavailable catalog ID has no action. New creation intentionally discards old custom behaviors/encoders/settings only after confirmation.

## Key entities

Preset: stable library identity, name, structure, ordered physical keys, base keycodes and limitations. Created Project: ordinary editable project, independent of preset metadata.

## Success criteria

- **SC-001**: All 11 families/variants can be previewed and created in both modes with the documented counts and identical geometry.
- **SC-002**: Browsing/cancellation leaves saved project and history unchanged; creation and edit/save/reload follow US2.
- **SC-003**: All generated bindings exist in the pinned catalog; new incomplete projects show wiring issues and cannot download ZIP.
- **SC-004**: Keyboard flow selects, previews, creates and closes without pointer use; per-key geometry is readable without SVG.

## Assumptions and open questions

Selected explicit variants above resolve percentage ambiguity using familiar ANSI and ortholinear examples. Split geometry comes from pinned upstream layout definitions, with explicitly described Corne thumb clearance to avoid overlapping pitch rectangles; no commercial firmware is copied. US QWERTY is the default. Existing New clears history rather than becoming undoable; its warning/save protection is retained. Current controller retention is explicit, not a hardware recommendation. No material open questions.

## Superseded creation controls — feature 032

Feature [032](../032-project-creation-and-auto-wiring/spec.md) supersedes US1.4, US2.1 and FR-001/FR-005 only for the separate six-key starter and dialog Save action. Remove those product actions/template; New has Create project from preset, Start empty project and red Cancel with equal dimensions. Save remains in the project bar. Existing saved six-key files remain compatible. All library geometry, bindings, preview and replacement/history contracts remain.
