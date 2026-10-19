# Sources and intentional differences

Independently authored expected ZMK v0.3.0 nodes follow docs/zmk/combos-macros-layers.md. Macro pause encoding is verified against pinned behavior_macro.c queue_macro: controls enqueue nothing; a press-mode none event waits its configured wait-ms after dispatch. Each following action sets its own mode. Prefixes/stable ID suffixes and chosen example actions are product conventions. This is not a generated snapshot.
