# Kscan (keyboard scan drivers)

Target: ZMK **v0.3.0** (`edf5c08`). Verified 2026-09-27 at v0.3.0 and `main` @ `5b51501`: all kscan binding YAMLs (`app/module/dts/bindings/kscan/*`, `app/dts/bindings/zmk,kscan-composite.yaml`, `-mock`, sideband) and drivers are identical; only differences are marked **main only (not in v0.3.0)**. zmk.dev `config/kscan` is identical at both except Zephyr doc links (3.5.0 vs 4.1.0). See [README](README.md#pinned-version).

The kscan node reads switches and emits `(row, column)` events. The matrix transform then turns them into key positions ([matrix-transform.md](matrix-transform.md)). Which kscan a build uses is selected by the `kscan` property of the chosen physical layout or, as fallback, by `chosen { zmk,kscan = &label; }` ([physical-layout.md](physical-layout.md)).

Binding YAMLs (source of truth for property names/types/defaults) live in `app/module/dts/bindings/kscan/` (matrix, direct, charlieplex, demux) and `app/dts/bindings/` (composite, mock, sideband). All ZMK kscan bindings `include: kscan.yaml` (Zephyr base kscan binding); `wakeup-source` is Zephyr's standard boolean from `base.yaml`.

GPIO flag macros come from Zephyr `<dt-bindings/gpio/gpio.h>` (already pulled in by board DTS; shields do not include it): `GPIO_ACTIVE_HIGH`, `GPIO_ACTIVE_LOW`, `GPIO_PULL_UP`, `GPIO_PULL_DOWN`. Combine with `|` inside parentheses: `(GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)`.

Pin references: `<&pro_micro N FLAGS>`, `<&xiao_d N FLAGS>`, or raw `<&gpio0 8 FLAGS>` / `<&gpio1 7 FLAGS>` (nRF52840 `P1.07` = `&gpio1 7`). See [boards.md](boards.md).

Sources: https://zmk.dev/docs/config/kscan · https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/module/dts/bindings/kscan · https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/development/hardware-integration/new-shield.mdx (v0.3.0 path; zmk.dev: https://zmk.dev/docs/hardware-integration/new-shield#kscan)

---

## Matrix — `zmk,kscan-gpio-matrix`

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `row-gpios` | phandle-array (GPIO) | yes | — | index in array = row number used by `RC(row, col)` |
| `col-gpios` | phandle-array (GPIO) | yes | — | index in array = column number |
| `diode-direction` | string enum `"row2col"` \| `"col2row"` | no | `"row2col"` | always emit it explicitly |
| `debounce-press-ms` | int | no | 5 | `0` = eager press; must be `<= 16383` |
| `debounce-release-ms` | int | no | 5 | `<= 16383` |
| `debounce-scan-period-ms` | int | no | 1 | scan period while any key is down; debounce timers round up to a multiple of it |
| `poll-period-ms` | int | no | 10 | only used when `CONFIG_ZMK_KSCAN_MATRIX_POLLING=y` |
| `wakeup-source` | boolean | no | absent | needed to wake from deep sleep; every upstream shield sets it |
| `debounce-period` | int | no | — | **deprecated**, do not emit |

### Diode direction → GPIO flags (the only correct combos)

| `diode-direction` | Diode (anode→cathode) | Output (driven) pins | Input (read) pins |
|---|---|---|---|
| `"col2row"` | column → row (cathode on row) | `col-gpios`: `GPIO_ACTIVE_HIGH` | `row-gpios`: `(GPIO_ACTIVE_HIGH \| GPIO_PULL_DOWN)` |
| `"row2col"` | row → column (cathode on column) | `row-gpios`: `GPIO_ACTIVE_HIGH` | `col-gpios`: `(GPIO_ACTIVE_HIGH \| GPIO_PULL_DOWN)` |

Rule from docs: outputs `GPIO_ACTIVE_HIGH`; inputs `(GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)`. The row2col variant is confirmed by the official zmk-cli template comment ("If using row2col, change the col-gpios to (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN) and the row-gpios to GPIO_ACTIVE_HIGH").

For soft-off / wakeup `gpio-keys`, the "MCU input pins" are the row pins for `col2row` and the column pins for `row2col`.

```dts
kscan0: kscan0 {
    compatible = "zmk,kscan-gpio-matrix";
    diode-direction = "col2row";
    wakeup-source;

    col-gpios
        = <&pro_micro 15 GPIO_ACTIVE_HIGH>
        , <&pro_micro 14 GPIO_ACTIVE_HIGH>
        , <&pro_micro 16 GPIO_ACTIVE_HIGH>
        ;

    row-gpios
        = <&pro_micro 19 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
        , <&pro_micro 20 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
        , <&pro_micro 21 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
        ;
};
```

Related Kconfig (`.conf`): `CONFIG_ZMK_KSCAN_MATRIX_POLLING` (bool, n), `CONFIG_ZMK_KSCAN_MATRIX_WAIT_BEFORE_INPUTS` (int ticks, 0), `CONFIG_ZMK_KSCAN_MATRIX_WAIT_BETWEEN_OUTPUTS` (int ticks, docs 0; Kconfig source defaults to 1 on RP2040; RP2350 added to that default **main only (not in v0.3.0)**). See [kconfig-options.md](kconfig-options.md).

Split: put the node (label, compatible, `diode-direction`, `wakeup-source`, and the GPIO list that is identical on both halves) in `<name>.dtsi`; override the differing list per half with `&kscan0 { col-gpios = ...; };` in `<name>_left.overlay` / `<name>_right.overlay`. Corne example: rows in dtsi, cols per half (right half lists the same pins reversed).

Sources: https://zmk.dev/docs/config/kscan#matrix-driver · https://github.com/zmkfirmware/zmk/blob/main/app/module/dts/bindings/kscan/zmk%2Ckscan-gpio-matrix.yaml · https://github.com/zmkfirmware/zmk-cli/blob/main/zmk/templates/common/kscan.dtsi · https://zmk.dev/docs/hardware-integration/new-shield#kscan

---

## Direct — `zmk,kscan-gpio-direct`

One GPIO per key; switch to GND.

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `input-gpios` | phandle-array (GPIO) | no* | — | one per key |
| `input-keys` | phandles | no* | — | alternative: list of `gpio-keys` child node refs (binding YAML; docs table folds this into `input-gpios`) |
| `debounce-press-ms` | int | no | 5 | |
| `debounce-release-ms` | int | no | 5 | |
| `debounce-scan-period-ms` | int | no | 1 | |
| `poll-period-ms` | int | no | 10 | only with `CONFIG_ZMK_KSCAN_DIRECT_POLLING=y` |
| `toggle-mode` | boolean | no | absent | toggle switches; driver manages pulls itself, so flags must be `GPIO_ACTIVE_LOW` **without** `GPIO_PULL_UP` |
| `wakeup-source` | boolean | no | absent | |
| `debounce-period` | int | no | — | **deprecated** |

\* One of `input-gpios` / `input-keys` must be provided (both marked `required: false` in YAML).

Flags (switch to GND): `(GPIO_ACTIVE_LOW | GPIO_PULL_UP)`.

Transform addressing: pin at index `i` of `input-gpios` is `RC(0, i)` (one row, N columns). Without a transform, keymap length = number of `input-gpios` (`app/include/zmk/matrix.h`).

```dts
kscan0: kscan0 {
    compatible = "zmk,kscan-gpio-direct";
    wakeup-source;
    input-gpios
        = <&pro_micro 4 (GPIO_ACTIVE_LOW | GPIO_PULL_UP)>
        , <&pro_micro 5 (GPIO_ACTIVE_LOW | GPIO_PULL_UP)>
        ;
};
```

Related Kconfig: `CONFIG_ZMK_KSCAN_DIRECT_POLLING` (bool, n).

Sources: https://zmk.dev/docs/config/kscan#direct-gpio-driver · https://github.com/zmkfirmware/zmk/blob/main/app/module/dts/bindings/kscan/zmk%2Ckscan-gpio-direct.yaml · https://github.com/zmkfirmware/zmk/blob/main/app/include/zmk/matrix.h

---

## Charlieplex — `zmk,kscan-gpio-charlieplex`

Each GPIO is both output and input. n pins → n·(n−1) keys without interrupt pin; with `interrupt-gpios`, n pins total → (n−1)·(n−2) keys, much lower power. The interrupt pin is a separate pin, not listed in `gpios`, so it is k = n−1 `gpios` → k·(k−1) keys. The docs example (`gpios` = pro_micro 16–20, interrupt = 21) uses `&pro_micro 17`, which does not exist (boards.md §4); the example below uses valid pins.

| Property | Type | Required | Default | Notes |
|---|---|---|---|---|
| `gpios` | phandle-array (GPIO) | yes | — | flags `GPIO_ACTIVE_HIGH` |
| `interrupt-gpios` | phandle-array (GPIO) | no | — | a single pin, flags `(GPIO_ACTIVE_HIGH \| GPIO_PULL_DOWN)`; absent = continuous polling |
| `debounce-press-ms` | int | no | 5 | |
| `debounce-release-ms` | int | no | 5 | |
| `debounce-scan-period-ms` | int | no | 1 | |
| `poll-period-ms` | int | no | **YAML: 1 / docs: 10** | used only when `interrupt-gpios` is not set. Docs table says 10, binding YAML says `default: 1`. The YAML is what the build uses → effective default **1 ms**. Emit explicitly if it matters. |
| `wakeup-source` | boolean | no | absent | |

Addressing: `RC(r, c)` = current flows from `gpios[r]` (driven) to `gpios[c]` (read). `r == c` is impossible — never map diagonal cells. The whole addressable space need not be mapped. `rows`/`columns` of the transform ≥ number of `gpios`.

```dts
kscan0: kscan {
    compatible = "zmk,kscan-gpio-charlieplex";
    wakeup-source;
    interrupt-gpios = <&pro_micro 21 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>;
    gpios
        = <&pro_micro 15 GPIO_ACTIVE_HIGH>
        , <&pro_micro 16 GPIO_ACTIVE_HIGH>
        , <&pro_micro 18 GPIO_ACTIVE_HIGH>
        , <&pro_micro 19 GPIO_ACTIVE_HIGH>
        , <&pro_micro 20 GPIO_ACTIVE_HIGH>
        ;
};
```

Related Kconfig: `CONFIG_ZMK_KSCAN_CHARLIEPLEX_WAIT_BEFORE_INPUTS`, `CONFIG_ZMK_KSCAN_CHARLIEPLEX_WAIT_BETWEEN_OUTPUTS` (int ticks, 0).

Domain note: for charlieplex a "row"/"col" is a GPIO index, not a separate pin set; a pin appears once in `gpios` and is both a row and a column. "A GPIO pin is used at most once per half" still holds at the `gpios` list level.

Sources: https://zmk.dev/docs/config/kscan#charlieplex-driver · https://github.com/zmkfirmware/zmk/blob/main/app/module/dts/bindings/kscan/zmk%2Ckscan-gpio-charlieplex.yaml · https://zmk.dev/docs/config/layout#example-charlieplex

---

## Composite — `zmk,kscan-composite` (combine drivers, e.g. matrix + direct)

Available in v0.3.0 and main (same binding). Parent: `rows` (int), `columns` (int), `wakeup-source` (bool). Children: `kscan` (phandle), `row-offset` (int, 0), `col-offset` (int, 0); `column-offset` and `label` are deprecated. Set `wakeup-source` on each child kscan too if it should wake. Chosen `zmk,kscan` (or the physical layout's `kscan`) must point to the composite node.

```dts
kscan0: kscan_composite {
    compatible = "zmk,kscan-composite";
    rows = <4>;
    columns = <3>;
    matrix { kscan = <&kscan1>; };
    direct { kscan = <&kscan2>; row-offset = <3>; };
};
```

Sources: https://zmk.dev/docs/config/kscan#composite-driver · https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Ckscan-composite.yaml

## Demux — `zmk,kscan-gpio-demux` (brief)

Matrix driven through a demultiplexer. Props: `input-gpios` (req), `output-gpios` (req, demux address lines), `debounce-period` (int, 5), `polling-interval-msec` (int, 25). Does **not** honor `CONFIG_ZMK_KSCAN_DEBOUNCE_*` nor `debounce-press/release-ms`. Out of scope for the generator unless requested.

Sources: https://zmk.dev/docs/config/kscan#demux-driver · https://github.com/zmkfirmware/zmk/blob/main/app/module/dts/bindings/kscan/zmk%2Ckscan-gpio-demux.yaml

## Other (not for generators)

- `zmk,kscan-mock` — tests only.
- `zmk,kscan-sideband-behaviors` — bind behaviors to kscan keys outside the keymap (e.g. soft-off button). See https://zmk.dev/docs/config/kscan#kscan-sideband-behavior-driver.
- Shift registers (74HC595) as output expander: https://zmk.dev/docs/hardware-integration/shift-registers.
- **main only (not in v0.3.0)**: Zephyr "matrix input" API: `zmk,physical-layout` has an `input` property and there is a `zmk,matrix-input` chosen (source: `app/dts/bindings/zmk,physical-layout.yaml`, `app/src/physical_layouts.c`). The Zephyr 4.1 blog post says converting ZMK drivers to it is future work and using it is "not officially supported". Do not generate it.

Sources: https://zmk.dev/blog/2025/12/09/zephyr-4-1#future · https://github.com/zmkfirmware/zmk/blob/main/app/src/physical_layouts.c · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/zmk%2Cphysical-layout.yaml (no `input`)

---

## Debounce: DT vs Kconfig

- Per-node DT: `debounce-press-ms` / `debounce-release-ms` (default 5) on matrix, direct, charlieplex.
- Global Kconfig `CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS` / `_RELEASE_MS`: Kconfig default is `-1` (= "don't override"). If `>= 0`, overrides the DT value for **all** supporting drivers (`app/module/drivers/kscan/kscan_gpio_*.c`: `#if CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS >= 0`).
- Docs inconsistency: `features/debouncing` says global "Default = 5"; `config/kscan` says default `-1`. Both are true in effect (−1 → DT default 5 applies). Catalog: type int, default −1, UI shows "driver default (5 ms)".
- Values must be `<= 16383`.
- `features/debouncing` note lists only matrix and direct as supporting these options; charlieplex also reads them (`kscan_gpio_charlieplex.c` lines 26–29).

Sources: https://zmk.dev/docs/features/debouncing#debounce-configuration · https://zmk.dev/docs/config/kscan#common · https://github.com/zmkfirmware/zmk/blob/main/app/module/drivers/kscan/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/module/drivers/kscan/kscan_gpio_charlieplex.c
