# Research: Layers

**Date**: 2026-10-06 · Spec: [spec.md](spec.md) · Clarifications: spec "Clarifications", session 2026-10-06

## R1 — Layer reference: by `Layer.id`

**Decision**: Layer behaviors store `layerId` (the target's `Layer.id`, `l0`, `l1`…): `{ kind: 'mo' | 'tog' | 'to' | 'sl', layerId }` and `{ kind: 'lt', layerId, tap }`. The generator (008) resolves `layerId` → position in `project.layers`.

**Rationale**: Clarified (Q5). Same pattern as bindings keyed by `Key.id` (spec 004 R6): moving layers rewrites nothing (FR-011 holds by construction), a deleted target stays detectable as an id no layer has (FR-012), and undo of a delete makes the reference valid again with no repair step.

**Id reuse guard** (spec-reviewer blocker): `createEntityId` returns the highest existing number + 1, so deleting the highest layer and adding a new one would hand its id to the new layer and silently retarget every dangling reference. `addLayer` therefore passes `existingIds` = layer ids **plus every `layerId` referenced by any binding**, so an id still referenced is never reused.

**Alternatives considered**: Store the index (ZMK's own form) and rewrite every reference on move and delete — more code, and after a delete references above it shift silently onto the wrong layer unless every one is rewritten.

## R2 — Storage: schema stays v3, additive union, no migration

**Decision**: `bindingSchema` gains two strict variants; `layerId` must match `^l\d+$` but need not resolve (a missing target is a validation issue, FR-012/FR-014). `schemaVersion` stays 3, no `migrate-v3-to-v4.ts`. The spec 005 regression test "rejects the layer behavior %s until layers exist" (`src/storage/parse-project-file.test.ts`, spec 005 FR-015, superseded by this feature) is replaced by: each new shape parses; the old index form `{ kind: 'mo', layer: 0 }`, a missing `layerId`, a missing `tap` and extra fields are rejected at `layers.L.bindings.keyId`; a v3 file without layer behaviors loads deep-equal.

**Rationale**: Clarified (Q5); precedent spec 005 research R6. The union accepts every file v3 accepted plus the new shapes, so AGENTS.md §3.2 "old files must still load" holds without a migration step; a migration that only bumps the number would add a file and a fixture for no data change. This reads AGENTS.md §3.2 / ADR 0003 ("schema changes bump `schemaVersion`") as applying to changes that reshape stored data; the wording itself is not amended here (a governance change for the project owner) — recorded in plan.md Complexity Tracking. The superRefine comment "References must resolve so domain operations never meet a dangling id (003 R15)" gets an explicit exception note for `layerId`: domain operations never dereference it, validation reports it.

**Alternatives considered**: Bump to v4 with a no-op migration (old app versions would say "newer version" instead of "malformed file") — rejected in clarify.

## R3 — Layer limit 32 as catalog data

**Decision**: `BindingsCatalog` gains `maxLayerCount`; `BINDINGS_CATALOG` (`src/catalog/bindings-catalog.ts`) sets it to 32 with the source comment (`docs/zmk/keymap.md` §2) — no file for one constant. `validateLayers` reports `layer-count-exceeded` on `['layers', 32]` (the first layer over the limit). The layer bar disables "Add layer" from `BINDINGS_CATALOG.maxLayerCount`. `addLayer` itself stays total (AGENTS §2, typescript.md "Domain operations are total").

**Rationale**: ZMK facts live in the catalog and reach the domain as arguments (AGENTS §3.1, §3.4). Verified in v0.3.0 source: `uint32_t zmk_keymap_layers_state_t`, `WRITE_BIT(..., layer_id, ...)`, no `BUILD_ASSERT`.

## R4 — Layer names: display name as typed, derived node name

**Decision**: `toLayerNodeName(name)` (domain, pure): lowercase; every run of characters outside `[a-z0-9]` → `_`; leading/trailing `_` dropped; if the result is empty → `''` (unusable); if it starts with a digit, `layer_` in front; `_layer` appended. `Nav & Sym` → `nav_sym_layer`, `Base` → `base_layer`, `2nd` → `layer_2nd_layer`, `Ω` → `''`. `validateLayers` reports per layer, at `['layers', i, 'name']`:
- `layer-name-empty` — derived node name is `''`;
- `layer-name-invalid-character` — the name contains `"`, `\` or a control character (line break, tab, NUL…);
- `layer-name-duplicate` — same node name as another layer; every such layer is reported (so the field just renamed shows it), naming one other.

**Rationale**: Clarified (Q3). Same sanitizing step as `toShieldName` (spec 002: lowercase, runs of other characters → `_`, trimmed), so users meet one rule; unlike shield names it adds the `_layer` suffix and uses a `layer_` prefix instead of `_` before a digit. DT node names allow `[a-z0-9_,.+-]` (`docs/zmk/keymap.md` §1); the Devicetree specification (§2.2.1) requires a node name to start with a letter, hence the `layer_` prefix — a conservative choice that is valid whether or not dtc enforces it. Quote, backslash and control characters (line breaks, tab, NUL…; zmk-reviewer finding) are rejected rather than escaped because escaping in `display-name` is not verified in `docs/zmk/` (AGENTS §8 "do not guess"); 008 may relax it after verifying.

**Alternatives considered**: Identifier-only names; node name by position (`layer_1`) — rejected in clarify.

## R5 — Domain operations

**Decision**, one per file (AGENTS §8), all `(project, input) => Project`, total, same project back when nothing changes (no empty undo step):

| Operation | Input | Effect |
|---|---|---|
| `addLayer` | — | Appends `{ id: createEntityId('l', layer ids + referenced layerIds), name: 'Layer N', bindings: &trans for every existing key }`; N = new position, else next number whose node name is free. |
| `renameLayer` | `{ layerIndex, name }` | Sets the name as typed (validation reports problems). |
| `moveLayer` | `{ layerIndex, toIndex }` | Moves one layer; out-of-range → unchanged. |
| `removeLayer` | `{ layerIndex }` | Removes it and its bindings; the last remaining layer is never removed (schema `min(1)`). References to it stay (R1). |

Existing operations extended for `lt` (the tap is "the key it sends"): `setKeycode` (tap keycode keeps modifiers and layer), `setKeyPressModifier` (chips on the tap), `setKeyBehavior` (`findSentStroke` reads `lt.tap`; new `KeyBehavior` `{ id: 'lt', layerId }` keeps each key's key), `isEveryKeySendingKey` (`lt` sends a key). `createEntityId` prefix gains `'l'`. `validateBindings` gains `binding-layer-missing` and `lt.tap` in its keycode check.

**Rationale**: Bindings operations already take `layerIndex` (spec 004 data-model); the new layer operations take it too, so the UI holds one number for the open layer. Rewriting `setKeyBehavior` rather than adding `setLayerTap` keeps one place that knows "the key a binding sends".

## R6 — Open layer: a preference by position

**Decision**: `Preferences.bindingsLayerIndex` (int ≥ 0, `.catch(0)`, missing → 0). The open layer is derived in render: `Math.min(bindingsLayerIndex, layers.length - 1)`. Add → open the new last index; move → the moved layer's new index; delete → the same index (clamped), i.e. the layer that took its position or the new last one; undo/redo keep the index. Problem activation for a path `['layers', n, …]` sets `{ activeWorkspaceId: 'bindings', bindingsLayerIndex: n }` and focuses the target on the next frame (existing `IssueButton` fallback).

**Rationale**: The problems panel (shell) must open a layer in the Bindings workspace; the allowed contexts are only Project and Preferences (react.md). A position needs no lookup and gives the spec edge cases (delete, undo of add) for free. It also survives reload (spec assumption updated: remembered per browser, like the active workspace).

**Alternatives considered**: `useState` in the Bindings workspace (unreachable from the problems panel); storing the open `Layer.id` (needs id lookups and a "where was it" fallback after undo).

## R7 — UI: layer bar, layer slot, legends

**Decision**:
- `LayerBar` (`src/ui/bindings/layer-bar.tsx`) above the canvas in the canvas column: `Tabs` primitive (`src/ui/components/tabs.tsx`, admin-ui.md "Primitives": roving tabindex, ArrowLeft/Right, Home/End, automatic activation) with one tab per layer (`0 Base`, base marked "always on"), "Add layer" button, and for the open layer a "Layer name" `DraftTextField` (from `ui/shell/`, gains an optional `description` showing "Keymap node: nav_sym_layer"), "Move left", "Move right", "Delete layer". Unavailable buttons use `Button` `isDisabled` + `hint` with the reason. The canvas column is the `tabpanel`.
- Slot `{ kind: 'layer' }`: `getLineSlots(source, layers)`, `getSlotChoices(slot, layers)` (layer rows built per render from `project.layers`; other groups stay module constants), `formatSlotPrompt` "Which layer?", `findSlotValueId` → `layerId`. A picker row: legend = position, name = layer name, codes = `[position, nodeName]`, description "Layer N in keymap order" (+ "always on" for 0), docs link = the open behavior's `docsUrl`.
- Behavior catalog: group `'Layers'` between `'Send a key'` and `'Special'`: `&mo` Momentary layer (`layers#momentary-layer`), `&lt` Layer on hold, key on tap (`hold-tap#layer-tap`), `&tog` Toggle layer (`layers#toggle-layer`), `&to` To layer (`layers#to-layer`), `&sl` Sticky layer (`sticky-layer`), all on `https://v0-3-branch.zmk.dev/docs/keymaps/behaviors/` — anchors checked against the v0.3.0 docs source headings (`docs/docs/keymaps/behaviors/layers.md`, `hold-tap.mdx`, `sticky-layer.md`).
- Picks (`toLayerResult` in `pick-value.ts`, next to `toProfileResult`): `&mo/&tog/&to/&sl` → draft, layer slot; layer pick stores. `&lt` → draft, layer slot; layer pick stores keeping each key's own key when every selected key sends one (then opens the tap slot), else the draft continues with the tap slot; a tap picked first is kept. On a stored layer binding the layer pick changes only `layerId`.
- Formatting takes the layers: `formatBindingLegend(binding, layers)`, `formatBindingName(binding, layers)`. Legend: `&mo/&tog/&to/&sl` → layer name; `&lt` → tap legend with layer name as hold part; missing target → `?`. Name: "Momentary layer Nav", "Toggle layer Nav", "To layer Nav", "Sticky layer Nav", "Space, layer Nav when held" (the `&mt` pattern), missing → "… deleted layer". Corner: `&lt` shows its tap code like `&mt`.
- Every `layerIndex: 0` / `layers[0]` / `layers.0` in `src/ui/bindings/` becomes the open layer index (canvas, table, copy/paste, picker, pick and option handlers, `getProblemsByKeyId`, keycap and row `data-issue-path`). A draft remembers the layer index it was made on (`DraftState.layerIndex`) and `resolveLineSource` ignores a draft from another layer, so every way of changing the open layer (tab, problem activation, clamp after delete/undo, add, move) drops it without handler wiring. The open slot is already clamped to the line in render (spec 006) and the search text stays, so no reset is wired. Selection and copied binding stay.

**Rationale**: Reuses spec 006 slots and drafts; no new effects, contexts or dependencies. `Tabs` is the primitive admin-ui.md names for layer tabs and the 008 file preview.

**Alternatives considered**: Rename mode inside the tab (more state, double-click discovery) — a visible field is one control and already has draft/commit/Escape; drag-to-reorder — optional per spec, skipped.

## R8 — Tests

**Decision**: Tests first for every domain and storage change (`*.test.ts` beside the code): `add-layer`, `rename-layer`, `move-layer` (SC-002: every move of a 4-layer project keeps each reference on the same named layer), `remove-layer`, `to-layer-node-name`, `validate-layers`, `validate-bindings` (`binding-layer-missing`, `lt` tap keycode), extended `set-keycode`/`set-key-press-modifier`/`set-key-behavior`/`is-every-key-sending-key`, `project-schema`/`parse-project-file` (R2), `preferences` (new field, catch). UI logic with existing test files: `binding-slots`, `slot-choices`, `pick-slot` (layer picks), `draft-state`, `format-binding-legend`, `format-binding-name`, `behaviors` catalog order. Browser check with playwright-core + system Chrome (quickstart). Generators: none in this feature (Principle I N/A).
