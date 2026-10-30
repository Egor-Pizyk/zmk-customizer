# Contract: Project file additions (schemaVersion 2)

The project JSON (localStorage and exported file, from roadmap 002) gains three arrays. Full types: `../data-model.md`.

```json
{
  "schemaVersion": 2,
  "name": "My board",
  "shieldName": "my_board",
  "keys": [
    { "id": "k1", "xU": 0, "yU": 0 },
    { "id": "k2", "xU": 1, "yU": 0 }
  ],
  "wires": [
    {
      "id": "w1",
      "start": { "kind": "key-pin", "keyId": "k1", "pin": 1 },
      "end": { "kind": "key-pin", "keyId": "k2", "pin": 1 },
      "bends": []
    },
    {
      "id": "w2",
      "start": { "kind": "key-pin", "keyId": "k1", "pin": 2 },
      "end": { "kind": "free", "at": { "xU": 0.5, "yU": 2 }, "boardPin": 3 },
      "bends": [{ "xU": 0.5, "yU": 1 }]
    }
  ],
  "insulatedCrossings": [{ "wireIds": ["w1", "w3"], "ordinal": 0 }]
}
```

Import rules (zod, `src/storage/`), each failure reported with its path, current project untouched:

- `id` unique within `keys` and within `wires`; pattern `k<digits>` / `w<digits>`.
- `key-pin.keyId` exists; `pin` ∈ {1, 2}.
- `junction.wireId` exists and ≠ own wire id.
- `boardPin` integer 0–31, only on `free`.
- Each wire has ≥ 1 `key-pin` end; ends are not the same pin.
- `insulatedCrossings[].wireIds` exist and are sorted; `ordinal` integer ≥ 0. (Stale refs are harmless and dropped by the next geometry operation.)
- v1 files migrate with empty arrays.

## Feature 033 extension (schema v12)

033 captures pass-through key-pin connections when wiring is created and persists fixed-anchor contacts; moving a key preserves these relationships and does not connect an unrelated pin merely by overlap. Stored conductor fragments need not have a direct key-pin endpoint; disconnected fragments remain repairable and visible. Section selection/deletion removes only the chosen conductor between adjacent electrical connection points, preserving other branches and all keys. Earlier schema formats remain historical migration contracts. See specs/033-wiring-and-settings-usability/spec.md and data-model.md for the current extension.


## Feature040 extension (implementation target)

[040](../../040-symmetric-wiring/spec.md) adds persisted wire locks and routing preferences in the next schema after the integrated base (currently v13→v14). Historical file versions remain frozen; legacy wires are unlocked, geometry and electrical meaning do not regenerate on Open. Protected direct wire/key/terminal/diode/encoder edits and mixed groups refuse atomically with a guarding-wire link; protection does not propagate through an entire net. Explicit unlock is a separate undoable lock-only command.

Regenerate and Prettify are separate read-only proposals with Apply/Cancel, current source revision checks and one Undo per changing Apply. Prettify preserves electrical relations/free ends/branch contacts/GPIO/diodes, without adding missing links. Existing matrix and bus matrix are geometry styles; new direct regeneration explicitly proposes upper-pin input/lower-pin separate GND paths, preserving legacy wiring until Apply. Pin swap and diode-side controls act globally and independently on logical states; physical diode pin follows rowPin/diodeSide with correct polarity. No-op/Cancel add no history. All current source/storage/generator authority and keyboard/table alternatives remain.

Feature040 bus endpoint clarification: a free geometric spine endpoint receiving an explicit junction (at its resolved attachment point) or an explicit inline pin lead is a connected branch site, not a dangling electrical end. Geometry-only crossings and nearby unreferenced pins/wires do not establish such an attachment. Existing unused/free fragments continue to report their real unconnected ends.
