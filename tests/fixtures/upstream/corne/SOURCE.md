# Source: corne (split, gpio-matrix, pro_micro)

- Upstream: https://github.com/zmkfirmware/zmk/tree/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne
- Commit: `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (ZMK tag `v0.3.0` = `v0.3`, 2025-08-01, Zephyr `v3.5.0+zmk-fixes`, HWMv1). Fetched 2026-09-27 from raw.githubusercontent.com; `shasum`/`diff -r` checked against a clone of the tag.
- All files copied byte-for-byte; nothing edited. This SOURCE.md is the only added file.

## Files (raw URLs)

- `boards/nice_nano.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/boards/nice_nano.overlay
- `boards/nice_nano_v2.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/boards/nice_nano_v2.overlay
- `corne_left.conf` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne_left.conf
- `corne_left.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne_left.overlay
- `corne_right.conf` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne_right.conf
- `corne_right.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne_right.overlay
- `corne.conf` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne.conf
- `corne.dtsi` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne.dtsi
- `corne.keymap` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne.keymap
- `corne.zmk.yml` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/corne.zmk.yml
- `Kconfig.defconfig` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/Kconfig.defconfig
- `Kconfig.shield` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/corne/Kconfig.shield

## Shared includes (not in the shield dir)

`corne.dtsi` includes files resolved from ZMK's `app/dts` include path. Copies are in `../_shared-includes/` (unchanged, same tag):

- `<layouts/foostan/corne/5column.dtsi>` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/dts/layouts/foostan/corne/5column.dtsi
- `<layouts/foostan/corne/6column.dtsi>` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/dts/layouts/foostan/corne/6column.dtsi
- `<layouts/foostan/corne/position_map.dtsi>` (included by both above) — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/dts/layouts/foostan/corne/position_map.dtsi
- `<physical_layouts.dtsi>` (defines `&key_physical_attrs`) — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/dts/physical_layouts.dtsi
- `<dt-bindings/zmk/matrix_transform.h>` (`RC()` macro) — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/include/dt-bindings/zmk/matrix_transform.h (not copied; 3 macros)
- Keymap headers `<behaviors.dtsi>`, `<dt-bindings/zmk/keys.h>`, `<dt-bindings/zmk/bt.h>`; board overlays include `<dt-bindings/led/led.h>` (Zephyr). Not copied.

## Notes for golden tests

- Empty files: `corne_left.conf`, `corne_right.conf` (0 bytes upstream).
- `boards/nice_nano.overlay` and `boards/nice_nano_v2.overlay` are byte-identical (WS2812 underglow on SPI3). HWMv1 applies `boards/<BOARD>.overlay` for the exact board name, so `nice_nano_v2` builds pick `nice_nano_v2.overlay`, `nice_nano` (v1) builds pick `nice_nano.overlay`.
- Already uses `chosen zmk,physical-layout = &foostan_corne_6col_layout` (physical layouts exist in v0.3.0).
- `corne.conf` contains `# CONFIG_WS2812_STRIP=y` (symbol still exists in v0.3.0's Zephyr 3.5).

## main-only differences (main @ `5b51501fead672c41b5cfb396f3dafe0894bf4e9`, reference for v0.4)

- `boards/nice_nano.overlay` + `boards/nice_nano_v2.overlay` → single `boards/nice_nano_nrf52840_zmk.overlay` (same content; HWMv2 board target `nice_nano//zmk`).
- `corne.conf`: `# CONFIG_WS2812_STRIP=y` line removed.
- `corne.keymap`: `display-name` added to the 3 layers.
- `_shared-includes/` files identical on main.
