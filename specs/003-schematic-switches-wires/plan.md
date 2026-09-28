# Implementation Plan: Schematic keys and wires

**Branch**: `003-schematic-switches-wires` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-schematic-switches-wires/spec.md`

**Blocked by**: roadmap 002 project-foundation (research R1). Do not start `/speckit-implement` before it is merged.

## Summary

Make the Key and Wire tools real in the Schematic workspace. Keys are drawn as switches: `Project.keys` holds `{ id, xU, yU }`. It is drawn as an MX switch seen from above, with two derived pins. Wires store their ends (key pin, junction or free end with an optional board pin P0–P31) plus the user's clicks. The drawn path is derived and always orthogonal. Crossings are derived; they are connected by default, and only insulated ones are stored. Nets come from union-find and feed six validation codes. All edits are pure domain operations committed through the 002 `ProjectProvider`. The canvas renders through a new `content` slot in `WorkSurface`, and a parts list below it is the full keyboard path. No generators change.

## Technical Context

**Language/Version**: TypeScript 7 (strict, `erasableSyntaxOnly`), Node 24 for tooling only

**Primary Dependencies**: React 19, zod (storage schema), Tailwind v4. No new dependencies.

**Storage**: the project JSON in `localStorage` plus the exported file, through 002 `storage/`. `schemaVersion` goes 1 → 2 with a migration.

**Testing**: Vitest. Domain tests come first (every operation, derivation and validation code) plus storage schema/migration tests. UI tests cover the non-trivial interactions only: the wire draft state and parts-list edits.

**Target Platform**: static SPA, desktop browsers, 1024–1280 px+

**Project Type**: web application (frontend only, ADR 0001)

**Performance Goals**: 100 keys and 300 wires: no frame over 16 ms while dragging (SC-005). Crossing detection is O(n²), about 400k segment checks (R12).

**Constraints**: offline; deterministic ids (no `Math.random`, R8); one gesture = one commit; WCAG 2.2 AA (`accessibility.md`)

**Scale/Scope**: 1 workspace, ~15 domain files, ~10 UI files, 1 schema bump

## Constitution Check

*GATE: before Phase 0 and again after Phase 1.*

| Principle | Status | How |
|---|---|---|
| I. Correct output over features | Pass (n/a) | No generator touched. The later kscan derivation feature owns ZMK output. |
| II. Domain first | Pass | All rules (placement, cascade, crossings, nets, checks) live in `src/domain/` and are tested; the UI only dispatches. |
| III. Static only | Pass | No network. |
| IV. User data untrusted | Pass | zod checks shape and referential integrity; v1 → v2 migration (R15). |
| V. ZMK options explain themselves | Pass (n/a) | No ZMK option added. The generic board is a placeholder, not catalog data (R11). |
| VI. Minimal code | Pass | Only insulated crossings are stored. Path, pins and nets are derived. One `content` prop added to `WorkSurface`. |
| VII. Deterministic | Pass | Ids from the highest existing number; issues sorted; no unordered iteration. |
| VIII. Accessible | Pass | Canvas keys as focusable `graphics-symbol`s (T003) plus a parts list as the complete alternative (R10, ADR 0008). |
| Constraints: layers, deps, `make check` | Pass | `ui → storage → domain`; no new deps. |
| Workflow: roadmap order | **Deviation** | The feature is not in `docs/roadmap.md` and the number 003 collides with shield-generators. Fix: update the roadmap in the first task (add this feature after 002, renumber the later ones). |

Post-design re-check: passes; nothing new.

## Project Structure

### Documentation (this feature)

```text
specs/003-schematic-switches-wires/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── project-schema.md
│   ├── ui.md
│   └── validation-issues.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
src/domain/
  types.ts                         + Key, KeyPin, Wire, WireEnd, WirePoint, CrossingRef
  board-pin.ts                     BOARD_PIN_COUNT, formatBoardPin
  create-entity-id.ts
  get-key-pin-position.ts       MX offsets (R2)
  is-key-position-free.ts
  find-free-key-position.ts  find-free-end-position.ts
  add-key.ts  move-key.ts  remove-key.ts  remove-orphan-wires.ts
  can-add-wire.ts
  add-wire.ts  remove-wire.ts  set-wire-bends.ts  set-wire-end-board-pin.ts
  get-wire-path.ts                 orthogonal routing (R4, R5)
  find-crossings.ts                (R6)
  toggle-crossing-insulation.ts
  prune-insulated-crossings.ts
  get-nets.ts                      union-find (R7)
  validate-schematic.ts            6 codes (contracts/validation-issues.md)
  *.test.ts next to each

src/storage/
  project-schema.ts                + v2 fields and integrity refinements (R15)   [file from 002]
  migrate-v1-to-v2.ts (+ test)
  preferences.ts                   + isPartsListOpen (optional, default true)   [file from 001]

src/ui/
  canvas/work-surface.tsx          + `content` slot, left-button world-point callbacks (R3)
  schematic/
    tools.ts                       select | add-key | wire, all available
    tool-window.tsx                controlled: activeToolId + onToolChange
    schematic-workspace.tsx        owns tool, selection, wire draft; renders surface + parts list
    schematic-content.tsx          SVG: keys, wires, junctions, crossings, markers, draft
    key-shape.tsx               MX top view
    wire-shape.tsx                 path, bend handles, board-pin marker
    crossing-button.tsx
    use-wire-draft.ts              click-click draft state machine (R9)
    use-schematic-pointer.ts       tool-specific pointer handling (place, select, drag, wire)
    format-schematic-labels.ts     accessible names (formatKeyLabel, formatWireLabel, …)
    parts-list.tsx                 section, open state, add forms (contracts/ui.md)
    parts-keys-table.tsx  parts-wires-table.tsx  parts-crossings-table.tsx
  components/icons/add-key-icon.tsx  redrawn as MX switch top view
  components/select.tsx, number-field.tsx, table.tsx   only if 002 has not built them
  shortcuts.ts                     + tool/Enter/Delete/Escape/Shift+arrow canvas shortcuts
  shell/issues-panel.tsx           items become buttons → select + focus `data-issue-path` (R14)
```

**Structure Decision**: this follows AGENTS §3.1. Domain files hold one concept each. UI code for this workspace lives in `ui/schematic/`. `canvas/` changes only for the generic content slot.

## Complexity Tracking

No constitution violations. The roadmap deviation is resolved by the first task.
