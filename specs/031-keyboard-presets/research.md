# Research and decisions — 2026-10-19

- Decision: reuse native New dialog and existing replace action. Rationale: preserve established save warning, history reset and starter. Alternative: undoable replacement rejected as an unrelated New behavior change.
- Decision: separate layout preset data from complete Project starter. Rationale: do not pretend layout knows actual wiring. Retain current controller and explicitly require review; empty terminals on split metadata preserve halves.
- Decision: ANSI variants use explicit rows and widths; 75/65 are specifically 84/68-key compact examples, 50/40 are ortho 5×12/4×12. Percentages alone are not variant identities.
- Corne geometry: existing independent fixture `tests/fixtures/upstream/_shared-includes/layouts/foostan/corne/6column.dtsi`, ZMK v0.3.0 SHA `edf5c0814fd3ea202e43aad2d68fd32e882a518c`. Only numerical geometry facts are transcribed. No generator syntax changes.
- Lily58 rev1 and Sofle rev1 geometry: numerical x/y/w/h/rotation facts from QMK `keyboards/lily58/rev1/keyboard.json` and `keyboards/sofle/rev1/keyboard.json`, commit `180f394b489c238cb231c2bf8b080262155e03c0`. Source URLs: https://github.com/qmk/qmk_firmware/blob/180f394b489c238cb231c2bf8b080262155e03c0/keyboards/lily58/rev1/keyboard.json and https://github.com/qmk/qmk_firmware/blob/180f394b489c238cb231c2bf8b080262155e03c0/keyboards/sofle/rev1/keyboard.json . These are physical layout facts, not copied firmware, pin mappings or behavior implementation. QMK source is GPL-2.0-or-later; original project attribution: kata0510/Lily58 and josefadamcik/SofleKeyboard. Base QWERTY assignments are authored here.
- Decision: no additional library, backend, schema migration, runtime fetch or speculative abstraction. Existing SVG corner query computes preview bounds including rotations.

## Geometry adaptation found by validation

The original Corne v0.3 pitch rectangles overlap between keys 29/30 and rotated thumbs. The Customizer preset translates all six thumb keys and their rotation origins down by exactly 0.25u; The right half and its active rotation origins also move right by 0.25u so the two inner rotated thumb rectangles do not intersect. Widths, heights, angles and within-half main-row geometry remain from upstream. The preview description names the extra clearance. This is a custom-layout starting point, not a PCB template. Independent upstream fixtures remain untouched. Domain validation must report no geometry/name/binding issues for any library entry; only unwired contacts are expected.

Sofle's QMK LAYOUT lists 60 positions including two encoder push buttons (source indices 42/43). This keys-only 58-key variant omits those positions, while retaining the source geometry/order of the other 58 keys.
