# Research

## R1 — Matrix orientation

Decision: reuse getNets; treat nets as graph vertices and keys as edges. Color each component from its smallest GPIO as row; sort both color classes by numeric GPIO. Stored switch pin numbers and drawing orientation do not define rows. Reject odd cycles and conflicting current direction globally.
Rationale: reproducible under key/wire reordering and disconnected graphs. Polarity is meaningful and never discarded.
Alternatives: drawing coordinates are unrelated to electrical topology; orienting all cathodes as rows would hide mixed directions and always force col2row. Automatic component flipping is excluded by the explicit policy.
Source: docs/zmk/kscan.md, matrix-transform.md; existing getNets/findKeyCurrentFlow.

## R2 — Fixed compatible controller

Decision: nice_nano_v2; Pn maps to &gpio0 n; allowed pins 2,6,8,9,10,11,17,20,22,24,29,31. No connector numbering or P1 pin aliases. Reject other used pins.
Rationale: no board choice exists, and arbitrary nRF GPIOs include unavailable/reserved pins. Preset uses rows P2/P6 and columns P8/P9/P10. No peripheral bus is enabled.
Alternatives: &pro_micro n cannot represent generic 0–31; accepting all MCU pins misrepresents physical availability.
Sources: docs/zmk/boards.md §4; https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/nice_nano/arduino_pro_micro_pins.dtsi and nice_nano.dtsi. Research agent verified primary sources.

## R3 — Missing diodes / empty project

Decision: block either; each missing diode is an issue with key path. Do not change project schema or stored diodes.
Rationale: current model has no diode-free scan policy; strict export avoids guessing. User confirmed both target and diode policy.
Alternative: diode-free scanning would require product decisions beyond this scope.

## R4 — Strings and limits

Decision: preserve existing layer quote/backslash/control restrictions; add 19 UTF-8 bytes and 31 sanitized-node characters. Keyboard strings escape backslash, quote, and dollar for Kconfig; reject control characters and malformed UTF-16. DT escapes quote/backslash. Geometry requires signed 16-bit cells.
Rationale: preserve editor contract, avoid silent truncation, prevent Kconfig macro expansion. No CONFIG_ZMK_KEYMAP_LAYER_NAME_MAX_LEN override.
Sources: docs/zmk/keymap.md §1–2 and physical-layout.md; pinned app/Kconfig and app/src/keymap.c; https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/scripts/kconfig/kconfiglib.py (_expand_str, quoted strings, escape).
Alternatives: indexed layer node names would disregard existing sanitized-name collision semantics; automatic shortening can change names and cause collisions.

## R5 — Preset and golden provenance

Decision: bundled six-key 2×3 macropad, Base and Fn; six pin-1 away-switch diodes, col2row; complete key presses and layer switching, tap-dance and mod-morph. Wiring crossings explicitly insulated as required. Derive expected file structure from verbatim Reviung41 at pinned commit edf5c08; independently write golden text before generator code. Explain smaller matrix, gpio0 target, geometry, keymap, names, formatting, empty conf and omitted RGB/board overrides in DIFFERENCES.md.
Rationale: complete usable example with no advanced geometry or unsupported RGB. Not a claim that this is electrically a Reviung41.
Alternative: full Reviung41 needs port-1 GPIOs outside the current generic model.

## R6 — Binding serialization

Decision: exhaustive binding-kind switch; layer index from current id lookup; modifier functions in stored order. Deduplicate td/mm by rendered definition signature rather than object-key insertion order; traverse layers then keys, labels by first occurrence.
Sources: docs/zmk/behaviors.md §1–3; keymap.md §4. Includes behaviors.dtsi, keys.h, modifiers.h, bt.h, outputs.h. BT_CLR and other no-profile macros already expand to two cells; emit them bare without an extra zero. BT_SEL/BT_DISC require an explicit profile.
