# Data model

Project.schemaVersion: 6. Key.id unchanged; keyIndex remains array position. New optional finite numeric fields: widthU/heightU default 1; rotationDeg/rotationOriginXU/rotationOriginYU default 0. Positions and absolute origins in u; angle positive clockwise in degrees. Domain effective geometry contains all seven numeric properties. No new entities, classes, timestamps or IDs.

Finite values outside representable ZMK int16 cells and nonpositive size cells are domain validation issues, not schema parse failures. Imported nonfinite values, malformed IDs/references and data beyond existing budgets remain rejected. v5→v6 preserves exact positions, binds and wires; missing geometry resolves to former 1u squares.

Move: translate x/y and origin by delta (leave absent zero origins absent while angle=0 to preserve legacy shape). Resize: update dimensions without changing top-left/origin. Rotate: set angle and absolute origin. Batch patch: map selected IDs only, preserve equality identity, prune crossings once when physical pins change. Renumber: stable center ordering, reuse original key objects, layers/wires unchanged. Duplicate: deterministic fresh IDs, shifted geometry/origin, copied diode/bindings, no new electrical edges. Delete: existing cleanup applied atomically across selected keys.

Transient selection and preview project are workspace-local; preview/apply/cancel writes history only on apply. Invalid/empty/stale/no-change selection must preserve original identity. UI operation budget comes from PROJECT_BUDGET.keys = 512 passed into pure domain creation/duplication, never storage imported into domain.
