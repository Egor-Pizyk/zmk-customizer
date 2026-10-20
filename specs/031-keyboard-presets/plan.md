# Implementation Plan: Keyboard presets

**Branch**: `031-keyboard-presets` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

## Summary

Expand the offline preset catalog and New dialog with layout review and QWERTY/empty selection. Keep the complete starter flow intact.

## Relevant context

`docs/{product,principles,workflow,agent-rules,architecture,folder-structure,tooling,domain-model,testing,commands}.md`; TypeScript/control-flow/naming/observability guidelines; React/accessibility/admin-ui/tailwind guidelines; `specs/002-project-foundation/contracts/`; `specs/012-layout-editor/`; `specs/013-matrix-wiring-editor/`; `docs/zmk/README.md`, `docs/zmk/keymap.md`, `docs/zmk/physical-layout.md`; `src/styles.css`; `src/catalog/presets/`; `src/domain/project/`; `src/ui/project/logic/project-file-actions.ts`; `src/ui/shell/components/project-dialogs.tsx`.

## Technical context

Existing TypeScript/React/native SVG/dialog, no new dependencies or schema changes. Up to 104 physical keys per preset. Geometry sources pinned in research.md.

## Scope and preserved contracts

Schema v11, existing starter/generator bytes, New/Open history replacement and storage parsing unchanged. Library layout creation retains selected controller but resets other project contents. Split wiring metadata starts with empty terminals. No electrical inference or generator syntax changes.

## Constitution check

Before/after design: pure immutable domain operation, data passed from catalog; no I/O in domain; ordinary Project storage; deterministic geometry; explicit incomplete wiring; keyboard controls and per-key list. No dependency or architecture exceptions. All eight principles satisfied by design; verification remains required.

## Design and ownership

- `domain/project/preset-layout.ts`: readonly preset definition contract. `create-layout-preset-project.ts`: create schema-v11 project from passed preset and mode/controller. Existing createPresetProject remains for complete starter.
- `catalog/presets/keyboard-presets.ts`, `ansi-layouts.ts`, `compact-68.ts`, `compact-84.ts`, `ortho-48.ts`, `ortho-60.ts`, `corne-42.ts`, `lily58-58.ts`, `sofle-58.ts`: static compact geometry/keycode tuples expanded by catalog-owned `create-preset-keys.ts`, limitations and stable IDs. No runtime downloads.
- `ui/shell/components/preset-picker.tsx` and `preset-preview.tsx`: native choices and SVG preview plus geometry details inside existing New dialog. Fresh picker state on opening; no project writes before apply.
- `ui/project/logic/project-file-actions.ts`: new explicit startLayoutPresetProject takes a preset and mode; replace history through existing path. No resolver lookup or business logic in UI.
- Existing module indexes expose only owned concepts. Dialog gains optional wide size and bounded vertical scrolling; default remains compatible.

## Verification strategy

Tests first for domain creation: exact count/ANSI anchors and split source geometry, both modes, valid catalog keycodes, no aliasing/mutation, storage round trips, validation blocks incomplete layouts. Rendered app tests preserve cancellation/history/starter. Playwright covers preview/cancel/save/create/edits/history/reload/JSON/export guard, cross-browser native select/focus/SVG and responsive dialog. Run make check, production build, full E2E and three sequential new-scenario runs. Controlled mutation loses a split half and must fail saved-data assertion, restored byte-for-byte. Run make zmk-build for the exported geometry gate; record which targets it covers. New unwired layout presets themselves cannot compile until configured, so do not claim their firmware is verified. Manual accessibility checks remain explicitly unverified if not performed.

## Supporting artifacts

[research.md](research.md) records provenance; [contracts.md](contracts.md) records the UI/data contract. Tasks hold the single requirement-to-evidence mapping.

## Decisions and uncertainty

Percentages resolved to spec variants. Split data uses pinned sources rather than guessed geometry. QWERTY is one Base layer, omitted groups explicitly described. Existing New history reset is preserved. Corne thumb cluster uses the documented 0.25u clearance from research.md. No open blockers.

## Creation follow-up — feature 032

The starter-preservation and dialog Save choices above describe the original 031 delivery. [Feature 032](../032-project-creation-and-auto-wiring/plan.md) supersedes those choices: remove the shipped six-key template/creation API, retain its circuit only as a compatibility test fixture, and use three equal creation actions. Library geometry/bindings and old saved-file compatibility remain unchanged.
