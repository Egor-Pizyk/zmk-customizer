# Data model: Layers

**Date**: 2026-10-06 · Builds on spec 004 `data-model.md` and spec 005 `data-model.md`. Only changes are listed.

## Project (`src/domain/types.ts`, `schemaVersion: 3` unchanged — research R2)

```ts
type Project = {
  // …unchanged…
  /** Keymap layers in ZMK order (index = ZMK layer number); 1–32 in a valid project. */
  readonly layers: readonly Layer[];
};

type Layer = {
  /** `l<n>`, unique, stable across rename and move; new ids from createEntityId({ prefix: 'l' }). */
  readonly id: string;
  /** Display name as typed; node name derived by toLayerNodeName (research R4). */
  readonly name: string;
  /** Keyed by Key.id; missing entry = &none (unchanged). */
  readonly bindings: Readonly<Record<string, Binding>>;
};
```

## Binding union — two new shapes

```ts
type Binding =
  // …existing kinds…
  | { readonly kind: 'mo' | 'tog' | 'to' | 'sl'; readonly layerId: string }
  | { readonly kind: 'lt'; readonly layerId: string; readonly tap: KeyStroke };
```

- `kind` is the ZMK label without `&` (`docs/zmk/behaviors.md` §1, §3.8). One cell: layer number; `&lt` two cells: layer number, tap keycode (`docs/zmk/behaviors.md` §2, §3.1).
- `layerId` refers to `Layer.id`; it may name a layer that no longer exists (deleted) → `binding-layer-missing`, never a load error.
- `tap` is a `KeyStroke` like `mt.tap` (modifier functions allowed; the `&kp` parameter of `&lt`).
- "Sends a key" (switch keeping the key, spec 006 FR-008): `kp/sk/kt` → `key`, `mt` → `tap`, `lt` → `tap`.

## Validation issues (`ValidationCode` additions, all under Bindings)

| Code | Path | When | Message (example) |
|---|---|---|---|
| `binding-layer-missing` | `['layers', L, 'bindings', keyId]` | a layer behavior's `layerId` matches no layer | "Key 4 on layer Base uses a deleted layer. Pick another layer in Bindings." |
| `binding-keycode-unknown` (existing) | same | `lt.tap.keycode` unknown | existing wording |
| `layer-name-empty` | `['layers', i, 'name']` | `toLayerNodeName(name) === ''` | "Layer 2 has no letters or digits usable in the keymap. Use at least one Latin letter or digit." |
| `layer-name-invalid-character` | `['layers', i, 'name']` | name contains `"`, `\` or a control character (line break, tab, NUL…) | "Layer 2 name contains a quote, backslash, line break or other control character. Remove it." |
| `layer-name-duplicate` | `['layers', i, 'name']` | node name equals another layer's (every such layer is reported, naming one other) | "Layer 3 "nav" and layer 1 "Nav" both become nav_layer in the keymap. Rename one of them." |
| `layer-count-exceeded` | `['layers', 32]` | more than `maxLayerCount` layers | "The keymap has 33 layers; ZMK v0.3 supports 32. Delete 1 layer." |

`BindingsCatalog` (domain input) gains `maxLayerCount: number` (`BINDINGS_CATALOG.maxLayerCount = 32`, research R3). `validateProject` adds `validateLayers(project, catalog)`.

## Operations (pure, total; same project back when unchanged)

| Operation | Input | Result |
|---|---|---|
| `addLayer` | — | `[...layers, { id (never an id a binding still references, research R1), name: 'Layer N', bindings: { [keyId]: { kind: 'trans' } } for every key }]`; N = new position, else the next number whose node name is free |
| `renameLayer` | `{ layerIndex, name }` | name replaced as typed |
| `moveLayer` | `{ layerIndex, toIndex }` | layer moved; invalid indices → unchanged |
| `removeLayer` | `{ layerIndex }` | layer and its bindings removed; never the last layer |
| `toLayerNodeName` | `name` | derived node name or `''` (query, research R4) |
| `setKeyBehavior` | `+ { id: 'lt', layerId }` | each key that sends a key → `&lt layerId <its key>` |
| `setKeycode`, `setKeyPressModifier`, `isEveryKeySendingKey` | — | treat `lt.tap` like `mt.tap` |

## UI state (not project data)

| State | Where | Notes |
|---|---|---|
| Open layer position | `Preferences.bindingsLayerIndex` (int ≥ 0, default 0) | clamped to `layers.length - 1` in render (research R6) |
| Draft (spec 006) | `useKeyPicker` | `DraftBehaviorId` += `mo`, `tog`, `to`, `sl`, `lt`; `BindingDraft` += `layerId?: string`; `DraftState` += `layerIndex` — a draft from another layer is ignored (research R7) |
| Open slot | `useKeyPicker` | `SlotRef` += `{ kind: 'layer' }` |

## Slots per new behavior (spec 006 FR-002 extension)

| Behavior | Slots (ZMK parameter order) | Line value |
|---|---|---|
| `&mo` `&tog` `&to` `&sl` | `layer` | `<position> <name>`, `deleted layer` when missing |
| `&lt` | `layer`, `tap` | as above; tap as `formatStrokeCode` |
