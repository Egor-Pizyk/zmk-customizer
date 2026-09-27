# Source: reviung41 (unibody, gpio-matrix, pro_micro)

- Upstream: https://github.com/zmkfirmware/zmk/tree/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41
- Commit: `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (ZMK tag `v0.3.0` = `v0.3`, 2025-08-01, Zephyr `v3.5.0+zmk-fixes`, HWMv1). Fetched 2026-09-27 from raw.githubusercontent.com; `shasum`/`diff -r` checked against a clone of the tag.
- All files copied byte-for-byte; nothing edited. This SOURCE.md is the only added file.

## Files (raw URLs)

- `boards/nice_nano.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/boards/nice_nano.overlay
- `boards/nice_nano_v2.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/boards/nice_nano_v2.overlay
- `Kconfig.defconfig` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/Kconfig.defconfig
- `Kconfig.shield` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/Kconfig.shield
- `reviung41.conf` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/reviung41.conf
- `reviung41.keymap` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/reviung41.keymap
- `reviung41.overlay` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/reviung41.overlay
- `reviung41.zmk.yml` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/boards/shields/reviung41/reviung41.zmk.yml

## Shared includes (not in the shield dir)

Copies in `../_shared-includes/` (unchanged, same tag):

- `<layouts/gtips/reviung41.dtsi>` (physical layout `gtips_reviung41_layout`, 41 keys, rotated keys with negative `(-700)` values) — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/dts/layouts/gtips/reviung41.dtsi
- `<physical_layouts.dtsi>` — https://raw.githubusercontent.com/zmkfirmware/zmk/edf5c0814fd3ea202e43aad2d68fd32e882a518c/app/dts/physical_layouts.dtsi
- `<dt-bindings/zmk/matrix_transform.h>`, keymap headers `<behaviors.dtsi>`, `keys.h`, `bt.h`, `rgb.h`, board-overlay header `<dt-bindings/led/led.h>` (not copied).

## Notes for golden tests

- Matrix is 7 rows x 6 cols "folded": right-hand keys live on rows 3-5, thumb row on row 6; the transform un-folds it. Good test for key index != (row, col) order.
- No `.dtsi`; everything in `reviung41.overlay`. Kscan node name `kscan_0`, label `kscan0`. `chosen zmk,physical-layout = &gtips_reviung41_layout`.
- `boards/nice_nano.overlay` and `boards/nice_nano_v2.overlay` are byte-identical; HWMv1 picks the one matching the exact board name.
- `reviung41.conf` contains `# CONFIG_WS2812_STRIP=y`.

## main-only differences (main @ `5b51501fead672c41b5cfb396f3dafe0894bf4e9`, reference for v0.4)

- `boards/nice_nano.overlay` + `boards/nice_nano_v2.overlay` → single `boards/nice_nano_nrf52840_zmk.overlay` (same content).
- `reviung41.conf`: `# CONFIG_WS2812_STRIP=y` removed.
- `reviung41.keymap`: `display-name` added to the 4 layers.
- `_shared-includes/` files identical on main.
