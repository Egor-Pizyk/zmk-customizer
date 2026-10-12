# Implementation Plan: Layers

**Branch**: `007-layers` | **Date**: 2026-10-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-layers/spec.md`

## Summary

Several keymap layers in the Bindings workspace: a layer bar above the canvas (tabs, add, rename, move, delete — each one undo step), every existing Bindings tool (canvas, Action panel, Keys table, copy/paste, auto-advance, problems) pointed at the open layer instead of layer 0, and the five ZMK v0.3 layer behaviors (`&mo`, `&lt`, `&tog`, `&to`, `&sl`) with a `layer` slot in the spec 006 binding line. Layer behaviors store the target's `Layer.id` (reorder rewrites nothing, deleted targets become `binding-layer-missing` issues); layer names are free display names with a derived keymap node name; at most 32 layers (verified in v0.3.0 source). Storage stays `schemaVersion: 3` (additive union, spec 005 precedent). No generators.

## Technical Context

**Language/Version**: TypeScript 7, `strict` + `erasableSyntaxOnly` (no `any`, `!`, `as` except `as const`)

**Primary Dependencies**: `react` 19, `zod` (storage trust boundary); no new dependency

**Storage**: `localStorage` autosave + JSON project file via `src/storage/project-schema.ts`, `schemaVersion: 3` unchanged, no migration (research R2); one new preference `bindingsLayerIndex` in `src/storage/preferences.ts` (`.catch(0)`, research R6)

**Testing**: Vitest, tests first beside the code for domain, storage and UI logic modules; browser check with playwright-core + system Chrome against `npm run dev -- --port 5199 --strictPort` (quickstart.md)

**Target Platform**: Static SPA (Vite), modern desktop browsers, offline after load

**Project Type**: Static web application, no backend

**Performance Goals**: No visible lag switching layers or picking with 100 keys × 32 layers; layer rows of the layer slot built per render (≤ 32 items)

**Constraints**: AGENTS.md §3 layers and one-way imports; one exported concept per file in `domain/`; oxlint (≤ 40 lines per function, ≤ 3 params, exhaustive switches, no nested ternaries, handler naming); Tailwind tokens only; v0.3 docs URLs; nothing marked "main only" (layer `locking`, `toggle-mode` instances are out)

**Scale/Scope**: 1–32 layers, ~100 keys; touches `domain/`, `catalog/`, `storage/`, `ui/bindings/`, `ui/shell/issues-panel.tsx`, `ui/shell/draft-text-field.tsx`, one new primitive `ui/components/tabs.tsx`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| I. Correct output over features | ✅ | No generator change. The stored model (layer ids, derived node names, 32-layer limit) is chosen so 008 can emit a buildable keymap; facts verified in v0.3.0 source and recorded in `docs/zmk/keymap.md` §2 |
| II. Domain first | ✅ | Layer operations, node-name derivation, all new issues in `src/domain/` with tests; UI only dispatches and formats |
| III. Static only | ✅ | No network, no dependency |
| IV. User data is untrusted | ✅ | New shapes strict in zod; malformed → rejected at their path; dangling `layerId`, bad names, >32 layers → issues, never load failures (contracts/project-json.md) |
| V. Every ZMK option explains itself | ✅ | Five `BEHAVIORS` entries with description + v0.3 `docsUrl` (anchors checked in v0.3.0 docs source); catalog test enforces it |
| VI. Minimal code | ✅ | One new binding shape pair; `setKeyBehavior` extended instead of a new op; limit lives in `BINDINGS_CATALOG`, layer picks in `pick-value.ts`; no drag reorder, no rename mode, no new effect or context; `Tabs` is the primitive admin-ui.md names for layer tabs |
| VII. Deterministic | ✅ | Ids via `createEntityId`; `addLayer` fills bindings in key order |
| VIII. Accessible | ✅ | Tablist with roving tabindex and automatic activation, labeled field and buttons with reasons when unavailable, issue activation opens the layer; Keys table follows the open layer |

Post-design re-check (after research.md, data-model.md, contracts/, spec-reviewer): no constitution violations; one AGENTS.md wording deviation recorded in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/007-layers/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── project-json.md   # accepted / rejected JSON for layers and layer behaviors
│   └── ui.md             # layer bar, open layer, layer slot, keycaps
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── types.ts                  # Binding += mo/tog/to/sl, lt; ValidationCode += 5 codes
│   ├── add-layer.ts  rename-layer.ts  move-layer.ts  remove-layer.ts   (+ tests)
│   ├── to-layer-node-name.ts     (+ test)
│   ├── validate-layers.ts        (+ test)  # names, count
│   ├── validate-bindings.ts      # binding-layer-missing, lt tap keycode; catalog += maxLayerCount
│   ├── validate-project.ts       # + validateLayers
│   ├── create-entity-id.ts       # prefix 'l'
│   └── set-key-behavior.ts  set-keycode.ts  set-key-press-modifier.ts  is-every-key-sending-key.ts  # lt
├── catalog/
│   ├── behaviors.ts              # group 'Layers' + 5 entries
│   └── bindings-catalog.ts       # maxLayerCount: 32 (docs/zmk/keymap.md §2)
├── storage/
│   ├── project-schema.ts         # 2 strict variants, layerId pattern
│   └── preferences.ts            # bindingsLayerIndex
└── ui/
    ├── components/tabs.tsx       # tablist primitive
    ├── shell/draft-text-field.tsx  # optional description
    ├── shell/issues-panel.tsx    # open the issue's layer
    ├── shell/workspace-issue.ts  # new codes → 'bindings'
    └── bindings/
        ├── layer-bar.tsx  use-layer-actions.ts           # new
        ├── binding-slots.ts  slot-choices.ts  pick-slot.ts  pick-value.ts (toLayerResult)  draft-state.ts  to-picker-item.ts
        ├── format-binding-legend.ts  format-binding-name.ts  format-keycap-corner.ts  format-keycap-label.ts
        ├── bindings-workspace.tsx  use-bindings-workspace.ts  use-bindings-interaction.ts
        ├── bindings-canvas.tsx  keycap-shape.tsx  bindings-table.tsx  bindings-table-rows.tsx
        └── use-key-picker.ts  create-pick-handlers.ts  create-option-handlers.ts  use-copied-binding.ts  get-problems-by-key-id.ts
```

**Structure Decision**: Existing single-app layout (AGENTS.md §3.1). New domain operations one per file; layer UI lives in `ui/bindings/` (only Bindings uses it); the tab list is the admin-ui.md `Tabs` primitive in `ui/components/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| AGENTS.md §3.2 / ADR 0003 say "schema changes bump `schemaVersion` and add a migration"; this feature keeps v3 (research R2) | Clarified by the owner (Q5), same as spec 005 R6: the binding union only gains variants, every older file parses identically | A no-op `migrate-v3-to-v4.ts` adds a file and fixture for no data change. Amending the AGENTS.md / ADR wording ("additive variants keep the version") is a governance change left to the owner |
