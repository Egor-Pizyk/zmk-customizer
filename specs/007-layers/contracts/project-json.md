# Contract: Project JSON for layers

**Date**: 2026-10-06 · Scope: project-file and `localStorage` JSON accepted by `projectSchema` (`schemaVersion: 3`, unchanged — research R2). Only additions are listed; existing shapes: spec 004 `contracts/project-schema.md`, spec 005 `contracts/binding-json.md`.

## Layers

```json
"layers": [
  { "id": "l0", "name": "Base", "bindings": { "k1": { "kind": "mo", "layerId": "l1" } } },
  { "id": "l1", "name": "Nav & Sym", "bindings": { "k1": { "kind": "trans" } } }
]
```

- 1 or more layers (unchanged `min(1)`); more than 32 parse and load with `layer-count-exceeded`.
- `id` matches `^l\d+$` and is unique (unchanged). `name` is any string; empty, duplicate-by-node-name or quote/backslash/control-character names parse and load with a validation issue (data-model.md).

## Layer behaviors

```json
{ "kind": "mo",  "layerId": "l1" }
{ "kind": "tog", "layerId": "l1" }
{ "kind": "to",  "layerId": "l0" }
{ "kind": "sl",  "layerId": "l2" }
{ "kind": "lt",  "layerId": "l1", "tap": { "keycode": "SPACE", "modifiers": [] } }
```

Accept rules:
- Strict objects; `layerId` is a string matching `^l\d+$`. It need not name an existing layer: a missing target loads as `binding-layer-missing` under Bindings.
- `tap` is a strict `KeyStroke` (unique modifiers in `LC LS LA LG RC RS RA RG` order); an unknown keycode loads as `binding-keycode-unknown`.

Reject (malformed file, current project untouched, issue at `layers.L.bindings.keyId`):
- the ZMK index form `{ "kind": "mo", "layer": 1 }` (supersedes spec 005 story 4's "reject every layer kind");
- missing or non-matching `layerId` (`"layerId": "nav"`, `"layerId": 1`);
- `lt` without `tap`; `tap` on `mo`/`tog`/`to`/`sl`; any extra key.

## Compatibility

- Files written before this feature contain no layer behaviors and load deep-equal (no migration).
- Files with layer behaviors opened by an older app version fail schema parsing with a named problem (same as spec 005 kinds).
