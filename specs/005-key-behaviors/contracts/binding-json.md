# Contract: Binding JSON shapes

**Date**: 2026-09-29 · Scope: project-file and `localStorage` JSON accepted by `projectSchema` (`schemaVersion: 3`, unchanged by this feature). Existing shapes are not repeated — only the two additive variants.

## `tap_dance`

```json
{ "kind": "tap_dance", "taps": [{ "keycode": "A", "modifiers": [] }], "tappingTermMs": 200 }
```

Accept rules:
- `taps` is an array with **≥1** entries; each entry is a strict `{ keycode: non-empty string, modifiers: unique array in LC LS LA LG RC RS RA RG order }`.
- `tappingTermMs` is an integer (any value parses; <0 or >5000 is a per-key Bindings validation issue, not a rejection).
- No other keys (strict object).

Reject (malformed file, current project untouched): `taps` empty or missing, `tappingTermMs` missing or non-integer, extra keys, `taps` entry with missing/extra parts.

Multi-tap example:

```json
{
  "kind": "tap_dance",
  "taps": [
    { "keycode": "A", "modifiers": [] },
    { "keycode": "B", "modifiers": ["LS"] }
  ],
  "tappingTermMs": 250
}
```

## `mod_morph`

```json
{
  "kind": "mod_morph",
  "normal": { "keycode": "ESCAPE", "modifiers": [] },
  "morphed": { "keycode": "GRAVE", "modifiers": [] },
  "mods": ["LS", "RS"]
}
```

Accept rules:
- `normal` / `morphed` are strict `KeyStroke` objects (same shape as above).
- `mods` is a non-empty array of unique modifiers in `MODIFIERS` order.
- Unknown keycodes inside `normal`/`morphed` still parse — they load as per-key `binding-keycode-unknown` issues (spec 004 FR-022 pattern).
- `normal` deep-equal to `morphed` parses — it loads as a per-key attention note (spec FR-011).
- No other keys (strict object).

Reject (malformed file, current project untouched): `mods` empty or missing, `normal`/`morphed` missing or with missing/extra parts, unknown `kind` values (including layer kinds `mo`/`lt`/`tog`/`to`/`sl` while the project has one layer — spec story 4).

## Compatibility

- Files written before this feature contain neither shape and load unchanged (no migration; version stays 3).
- Files using the new shapes in an older app version fail schema parsing with a named problem (expected forward-incompatibility; same as any new kind).
