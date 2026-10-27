# Encoder boundaries

Feature 036 item 1 extends these original passive-marker contracts with placeable/rotatable schematic contacts and an optional linked ordinary-key push switch. Legacy direct-pin encoders continue to follow the contracts below; the extension is specified in [036](../036-ui-ux-remediation/spec.md).

## Storage

Project schema 11 requires `encoders` (max 16). Each encoder is strict, has a unique `e[0-9]+` ID (max 128 chars), finite numbers, left/right half and optional integer A/B connector indices 0–31. Counts and position limits are semantic validation, so bad values remain editable. Layer `encoderBindings` is optional, max 16 entries; keys reference existing encoders and values contain strict clockwise/counterclockwise Binding values. v10→v11 adds only `encoders: []`. All preceding migrations remain chained. Encoder IDs are stable; removal cleans maps.

## Generated files

No encoders: unchanged bytes. Otherwise encoder array order determines the shared sensor order and every layer's sensor binding order. Hardware nodes `encoder_N` use active-high pull-ups and non-deprecated steps. Sensors have one child per encoder with its own triggers-per-rotation. Split nodes start disabled; each half enables its local subset. Trigger defaults are conditional on an enabled local EC11 node. Rotation behaviors `encoder_rotation_LAYER_ENCODER` are zero-cell sensor behaviors, with clockwise then counterclockwise normal action bindings. Identical rendered pairs share the first encountered definition; each layer retains one label reference per encoder in sensor order. The upstream driver indexes shared state by sensor and layer, so sharing preserves independent rotation remainders. Missing actions emit none. Generated labels cannot collide with named behavior prefixes. Existing header collection and custom behavior rendering include encoder actions.

## User interface

Schematic: Parts contains independent Keys and Encoders disclosures. Encoders has numbered encoder fieldsets with X/Y (u), Half, A/B pins, electrical steps and triggers per rotation, Delete encoder; Add encoder follows the list. Keys retains its table and Add key. All Parts groups start collapsed; folding either preserves the sibling, Project and history. Both disclosures remain mounted for nested issue reveal. Marker positions use the same u coordinates as keys. Encoders are not switch keys and do not affect key indices. Bindings: Encoder actions disclosure on the selected layer, each encoder with Clockwise and Counterclockwise existing action editors. Inline problems, details reveal and workspace/layer navigation reach a focusable repair anchor for each issue path. All fields work by keyboard; numeric drafts commit on Enter/blur and cancel on Escape. Delete restores focus to Add encoder. Bounds and docs match catalog. Driver settings are generated, not editable raw Kconfig.
