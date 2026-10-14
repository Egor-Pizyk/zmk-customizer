# Domain model (ZMK concepts the code must represent)

Reference: `docs/zmk/` (verified notes with links to https://zmk.dev/docs). When the docs and this summary disagree, the ZMK docs win; fix this file.

**Target: ZMK v0.3.0** (tag `edf5c08`, Zephyr 3.5) — [ADR 0010](decisions/0010-target-zmk-v0-3.md). zmk.dev describes `main`; anything marked "main only" in `docs/zmk/` is never generated or offered in the UI.

| Concept | What it is | Where it ends up |
|---|---|---|
| Shield | The user's keyboard, placed on top of a controller board. Board ids are v0.3 ids (`nice_nano_v2`, not main's `nice_nano//zmk`; see `docs/zmk/boards.md`). Name is `[a-z_][a-z0-9_]*`; keyboard name ≤16 bytes. | Directory name, Kconfig symbol `SHIELD_<NAME>` |
| Board overlay | Board-specific fix-ups inside the shield, file named by the exact v0.3 board id (`boards/nice_nano_v2.overlay`; `nice_nano.overlay` does not apply to v2). | `boards/shields/<name>/boards/<board>.overlay` |
| Physical layout | Per-key `w, h, x, y, r, rx, ry`; in DT stored as hundredths of `u` / hundredths of a degree (clockwise positive). Selected via `chosen zmk,physical-layout`; it in turn selects the transform and kscan. Needed for ZMK Studio and for our canvas. | `zmk,physical-layout` node in overlay |
| Kscan | How switches are read: `zmk,kscan-gpio-matrix`, `zmk,kscan-gpio-direct`, `zmk,kscan-gpio-charlieplex`; `zmk,kscan-composite` mixes them. | kscan node in overlay |
| Diode direction | `col2row` or `row2col`. Decides which side is input and pull direction. | kscan node |
| GPIO pin | Pin on the controller, referenced through the board's connector (`&pro_micro 4`, `&xiao_d 0`) or directly (`&gpio0 8`). Valid connector pins are limited (`&pro_micro` 0–10, 14–16, 18–21; `&xiao_d` 0–10). | `row-gpios` / `col-gpios` / `input-gpios` |
| Matrix transform | Maps key index (order in keymap) → `RC(row, col)`. Lets the keymap order follow the physical order regardless of wiring. Referenced by the physical layout, never set as `chosen` (breaks Studio). | `zmk,matrix-transform` node |
| Split | Two halves; central + peripheral. Each half has its own overlay; the peripheral sets `col-offset` on every transform. `ZMK_KEYBOARD_NAME` / `ZMK_SPLIT_ROLE_CENTRAL` only on central. | `<name>_left/_right` shields, `ZMK_SPLIT*` Kconfig |
| Keymap | Ordered layers; each layer has one binding per key index. | `<name>.keymap` |
| Behavior | Action bound to a key: key press, layer, hold-tap, macro, … Built-in or user-defined. | `behaviors {}` in keymap |
| Combo | Several key positions pressed together → binding. | `combos {}` in keymap |
| Macro | Sequence of bindings. | `macros {}` in keymap |
| Kconfig option | Build-time setting (`CONFIG_ZMK_SLEEP=y`). User settings → `config/<name>.conf` (applies to all halves; in a split shield folder the shared `<name>.conf` is not applied, per-half `<name>_left.conf`/`_right.conf` are). v0.3 underglow needs `WS2812_STRIP` enabled (default in `Kconfig.defconfig`). Hardware defaults → `Kconfig.defconfig`. | `config/<name>.conf` / `Kconfig.defconfig` |
| Build target | Board + shield (+ optional `snippet`, e.g. `studio-rpc-usb-uart`) per half. | `build.yaml` |

Invariants the domain layer must enforce (not the UI):

- Every key has a unique key index; indices are contiguous `0..n-1`.
- Every key is mapped to exactly one matrix cell; a matrix cell holds at most one key (except where kscan type allows otherwise).
- A GPIO pin is used at most once per half (for charlieplex: once in the `gpios` list, and row ≠ col).
- Layer bindings are keyed by key id (`Layer.bindings: Record<Key.id, Binding>`); a missing entry means `&none`, so deleting or reordering keys never shifts a layer (spec 004 research R6). Generators emit exactly `n` bindings per layer in key-index order, where `n` is the largest transform `map` length across physical layouts.
- Combo key positions reference existing key indices.
- Names that become Devicetree labels / Kconfig symbols are sanitized and unique.
