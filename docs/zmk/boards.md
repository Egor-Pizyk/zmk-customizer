# Controller boards and pin references

Target: ZMK **v0.3.0** (tag commit `edf5c0814fd3ea202e43aad2d68fd32e882a518c`, Zephyr `v3.5.0+zmk-fixes` = `dacab4875df72109b96cc8977547a0dc04875bcd`, **HWMv1** board model). Verified 2026-09-27 against that tag and the Zephyr fork branch; `main` @ `5b51501fead672c41b5cfb396f3dafe0894bf4e9` (Zephyr `v4.1.0+zmk-fixes`, HWMv2) kept as reference for v0.4. Board identifiers **differ** between the two (§2, §3); pin maps (§4, §5) are identical except where marked. We generate v0.3.0 ids (docs/decisions/0010-target-zmk-v0-3.md).

## 1. How a shield references controller pins

A shield never names MCU pins directly if it can avoid it. Boards expose an *interconnect* (connector node with a `gpio-map`) and the shield uses the connector label; the board translates it to the real MCU pin. Same shield file works on every board that `exposes` that interconnect.

| Interconnect id (`requires:` in `.zmk.yml`) | GPIO label | Index = | I2C | SPI | UART | Other |
|---|---|---|---|---|---|---|
| `pro_micro` | `&pro_micro N` (alias `&pro_micro_d`) | Arduino "D" number (blue labels) | `&pro_micro_i2c` | `&pro_micro_spi` | `&pro_micro_serial` | `&pro_micro_a N` (analog A-number, ZMK nRF boards only) |
| `seeed_xiao` | `&xiao_d N` | XIAO `D` number (green labels) | `&xiao_i2c` | `&xiao_spi` | `&xiao_serial` | `&xiao_adc` (some boards, **main only (not in v0.3.0)**) |
| `arduino_uno` | `&arduino_header N` | counted from `A0`, counter-clockwise (`D6` = `&arduino_header 12`) | `&arduino_i2c` | `&arduino_spi` | `&arduino_serial` | `&arduino_adc` |
| `blackpill` | `&blackpill N` | blue pin number on diagram | `&blackpill_i2c` | `&blackpill_spi` | `&blackpill_serial` | |
| `makerdiary_nrf52840_m2` | (no `node_labels` in metadata) | | | | | |

Cell format: `<&pro_micro 4 FLAGS>` — 2 cells (`#gpio-cells = <2>`): pin index, flags. Flags pass through the map (`gpio-map-pass-thru = <0 0x3f>`), so `GPIO_ACTIVE_HIGH`, `GPIO_ACTIVE_LOW`, `GPIO_PULL_UP`, `GPIO_PULL_DOWN` work as on a raw GPIO (flag semantics per diode direction: see `kscan.md`).

```dts
row-gpios
    = <&pro_micro 4 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
    , <&pro_micro 5 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
    ;
col-gpios
    = <&xiao_d 0 GPIO_ACTIVE_HIGH>
    , <&gpio1 7 GPIO_ACTIVE_HIGH>   /* raw MCU pin, not on the connector */
    ;
```

Raw pins (not on the interconnect): nRF52 `PX.Y` → `&gpioX Y` (docs example: `&gpio1 7` = nice!nano middle pin P1.07). RP2040 → `&gpio0 N`. STM32 → `&gpioa N`, `&gpiob N`. Using a raw pin ties the shield to one board.

A connector index **not in the board's `gpio-map` is a build error** (e.g. `&pro_micro 11/12/13/17` do not exist on any pro_micro board below). Note: the zmk.dev new-shield guide's split example uses `&pro_micro 11` and `&pro_micro 13`, which are not in any in-tree `pro_micro` map — do not copy that example literally.

Peripheral nodes (`&pro_micro_i2c` etc.) are aliases of the board's bus nodes and are **not enabled by default** on nice!nano (`&i2c0/&spi1/&uart0` have no `status = "okay"`; v0.3.0: `app/boards/arm/nice_nano/nice_nano.dtsi`, main: `nice_nano.dts`). A shield enables one with `&pro_micro_i2c { status = "okay"; … }` (as corne does for its OLED). While a bus is disabled its pins are free GPIO. ZMK explicitly sets `&xiao_serial` / `&pro_micro_serial` `status = "disabled"` for XIAO/RP2040 boards: v0.3.0 in `app/boards/<board>.overlay` (e.g. `seeeduino_xiao_ble.overlay`, `sparkfun_pro_micro_rp2040.overlay`), main in `<board>_zmk.dts`.

Sources:
- https://zmk.dev/docs/hardware-integration/new-shield#kscan
- https://zmk.dev/docs/hardware-integration/pinctrl#predefined-nodes
- https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/boards/interconnects (same 5 interconnects on main)
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/nice_nano/nice_nano.dtsi (v0.3.0 location of the nice!nano DT)
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/interconnects/pro_micro/pro_micro.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/interconnects/seeed_xiao/seeed_xiao.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/interconnects/arduino_uno/arduino_uno.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/interconnects/blackpill/blackpill.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/nicekeyboards/nice_nano/nice_nano.dts
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/shields/zmk_uno/zmk_uno.dtsi (uses `&arduino_header`)

## 2. Board identifier syntax

### v0.3.0 (HWMv1, Zephyr 3.5) — what we generate

Board id = one flat name, one per hardware revision/variant: `nice_nano_v2`, `seeeduino_xiao_ble`, `nrfmicro_13`. No `/soc/variant` qualifiers, no `//zmk` (not a v0.3.0 board name; Zephyr 3.5 finds boards by `<name>_defconfig`, so the build fails — not build-tested). Boards that define `revision.cmake` take `@<rev>` (only `mikoto` among the controllers below: `mikoto@6.1`). Use exact revisions: HWMv1 `board_check_revision` without `EXACT` falls back to the nearest *lower* valid revision (e.g. `mikoto@6` → 5.20.0).

`build.yaml` (zmk-config repo root):

```yaml
include:
  - board: nice_nano_v2
    shield: my_kb_left
  - board: nice_nano_v2
    shield: my_kb_right
  - board: seeeduino_xiao_ble
    shield: my_unibody
    snippet: studio-rpc-usb-uart     # optional (snippet exists in v0.3.0)
    cmake-args: -DCONFIG_ZMK_STUDIO=y # optional
    artifact-name: my_unibody_studio  # optional
```

Local: `west build -b nice_nano_v2 -- -DSHIELD=my_kb_left`. Default artifact name `<shield>-<board>-zmk` (v0.3.0 workflow does not replace `/`). Trap: the template's `build.yaml` comment example uses `board: nice_nano`, which on v0.3.0 is the **v1** board.

### main (HWMv2, Zephyr 4.1) — **main only (not in v0.3.0)**

Full form: `<board>[@<revision>]/<soc>[/<variant>]`. All ZMK in-tree boards **must** be built with the `zmk` variant. For single-SoC boards the SoC may be left empty: `nice_nano//zmk` == `nice_nano/nrf52840/zmk`. Revision is optional when the board defines a default; qualifiers (SoC, variant) have no defaults. Revisions with `exact: false` accept shorter forms (`nice_nano@1//zmk`, `mikoto@6//zmk`). Building the plain upstream Zephyr board without `/zmk` compiles but misses ZMK defaults; ZMK variants `select ZMK_BOARD_COMPAT` (Kconfig symbol main only) and main's workflow errors when a ZMK variant exists but was not used. Default artifact name `<shield>-<board with / → _>-zmk`.

Sources:
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/.github/workflows/build-user-config.yml (`board`, `shield`, `snippet`, `cmake-args`, `artifact-name`)
- https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/snippets
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/mikoto/revision.cmake
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/cmake/modules/extensions.cmake (`board_check_revision`)
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/customization.md (v0.3.0 docs source)
- https://github.com/zmkfirmware/unified-zmk-config-template/blob/main/build.yaml
- main: https://zmk.dev/blog/2025/12/09/zephyr-4-1#zmk-board-variant · https://zmk.dev/blog/2025/12/09/zephyr-4-1#board-revisions · https://github.com/zmkfirmware/zmk/blob/main/.github/workflows/build-user-config.yml · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig (`ZMK_BOARD_COMPAT`) · https://docs.zephyrproject.org/4.1.0/hardware/porting/board_porting.html#board-terminology

## 3. Common controller boards

`build.yaml` id = value of `id:` in the board's `.zmk.yml` at v0.3.0 (`app/boards/arm/<board>/<id>.zmk.yml`). "Pins" = entries in the interconnect `gpio-map`. v0.3.0 column is what we generate; main column is **main only (not in v0.3.0)**.

| Board | build.yaml id (v0.3.0, generated) | main id (reference v0.4) | MCU | Exposes | Pins | Outputs | Defined in (v0.3.0) |
|---|---|---|---|---|---|---|---|
| nice!nano v2 | `nice_nano_v2` | `nice_nano//zmk` (= `nice_nano@2.0.0//zmk`, default rev) | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK `app/boards/arm/nice_nano` |
| nice!nano v1 | `nice_nano` | `nice_nano@1//zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| Seeed XIAO nRF52840 (BLE) | `seeeduino_xiao_ble` | `xiao_ble//zmk` | nRF52840 | `seeed_xiao` | 11 | usb, ble | Zephyr 3.5 board + ZMK `app/boards/seeeduino_xiao_ble.{conf,overlay}` |
| Seeed XIAO RP2040 | `seeeduino_xiao_rp2040` | `xiao_rp2040//zmk` | RP2040 | `seeed_xiao` | 11 | usb | Zephyr + ZMK conf/overlay |
| Seeed XIAO SAMD21 | `seeeduino_xiao` | `seeeduino_xiao//zmk` | SAMD21G18A | `seeed_xiao` | 11 | usb | Zephyr + ZMK conf |
| Adafruit QT Py RP2040 | `adafruit_qt_py_rp2040` | `adafruit_qt_py_rp2040//zmk` | RP2040 | `seeed_xiao` | 11 | usb | Zephyr + ZMK conf/overlay |
| Puchi-BLE v1 | `puchi_ble_v1` | `puchi_ble//zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| BlueMicro840 v1 | `bluemicro840_v1` | `bluemicro840//zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| nRFMicro 1.3/1.4 (52840) | `nrfmicro_13` | `nrfmicro/nrf52840/zmk` (default rev 1.3.0) | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| nRFMicro 1.1/1.2 (52840) | `nrfmicro_11` | `nrfmicro@1.1/nrf52840/zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| nRFMicro 1.1 flipped | `nrfmicro_11_flipped` | `nrfmicro@1.1/nrf52840/flipped_zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| nRFMicro 1.3/1.4 (52833) | `nrfmicro_13_52833` | `nrfmicro/nrf52833/zmk` | nRF52833 | `pro_micro` | 18 | usb, ble | ZMK |
| Mikoto 5.20 | `mikoto` (default rev 5.20.0) | `mikoto//zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| Mikoto 6.1 / 6.3 / 7.2 | `mikoto@6.1`, `mikoto@6.3`, `mikoto@7.2` (exact revs only, see §2) | `mikoto@6//zmk`, `mikoto@6.3//zmk`, `mikoto@7//zmk` | nRF52840 | `pro_micro` | 18 | usb, ble | ZMK |
| SparkFun Pro Micro RP2040 | `sparkfun_pro_micro_rp2040` | `sparkfun_pro_micro_rp2040//zmk` | RP2040 | `pro_micro` | 18 | usb | Zephyr + ZMK conf/overlay |
| Adafruit KB2040 | `adafruit_kb2040` | `adafruit_kb2040//zmk` | RP2040 | `pro_micro` | 18 | usb | Zephyr + ZMK conf/overlay |
| BoardSource blok | `boardsource_blok` | `boardsource_blok//zmk` (not re-verified on main) | RP2040 | `pro_micro` | not verified | usb | Zephyr + ZMK conf/overlay |
| QMK Proton-C | `proton_c` | `proton_c//zmk` | STM32F303 | `pro_micro` | 18 | usb | ZMK |
| Raspberry Pi Pico | `rpi_pico` (Zephyr board; ZMK only adds `app/boards/rpi_pico.conf`, no `.zmk.yml`) | `rpi_pico//zmk` | RP2040 | none — use `&gpio0 N` | — | usb | Zephyr + ZMK conf |
| MechWild PillBug | `pillbug` | `pillbug//zmk` | nRF52840 | `blackpill` | — | usb, ble | ZMK |
| WeAct BlackPill F411CE / F401CE / F401CC | `blackpill_f411ce`, `blackpill_f401ce`, `blackpill_f401cc` | same + `//zmk` | STM32F4 | `blackpill` | — | usb | Zephyr + ZMK conf/overlay |
| MakerDiary nRF52840 M.2 | `nrf52840_m2` | `nrf52840_m2//zmk` | nRF52840 | `makerdiary_nrf52840_m2` | — | usb, ble | ZMK |
| Nordic nRF52840 DK | `nrf52840dk_nrf52840` | `nrf52840dk/nrf52840/zmk` | nRF52840 | `arduino_uno` | — | usb, ble | Zephyr + ZMK conf |

v0.3.0 ids are the `id:` values of the v0.3.0 `.zmk.yml` files (checked for every row except `rpi_pico`, which has none). v0.3.0→main mapping for boards not in the blog table (puchi_ble, bluemicro840, rp2040 boards) is derived from the two `.zmk.yml` sets, not stated in prose by ZMK. "—" = not counted (not needed for pro_micro/xiao shields). Mikoto: `app/boards/aliases.cmake` maps board name `mikoto_520` → `mikoto` (both versions).

Catalog guidance: store `{ id /* v0.3.0 */, name, interconnect, soc, ble: boolean, revisions?, defaultRevision? }` per board (optionally `mainId` for v0.4); generate `board:` lines from `id` (optionally with `@rev`).

Sources:
- https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/boards/arm (v0.3.0 `.zmk.yml` ids)
- https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/boards (v0.3.0 `<zephyr-board>.conf/.overlay`)
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/nice_nano/nice_nano_v2.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/mikoto/mikoto.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/hardware.mdx
- main: https://zmk.dev/blog/2025/12/09/zephyr-4-1#board-revisions (rename table)
- https://zmk.dev/docs/hardware
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/nicekeyboards/nice_nano/nice_nano.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/nicekeyboards/nice_nano/board.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/seeed/xiao_ble/xiao_ble.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/seeed/xiao_rp2040/xiao_rp2040.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/seeed/seeeduino_xiao/seeeduino_xiao.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/keycapsss/puchi_ble/puchi_ble.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/jpconstantineau/bluemicro840/bluemicro840.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/joric/nrfmicro/board.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/zhiayang/mikoto/board.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/sparkfun/pro_micro_rp2040/sparkfun_pro_micro_rp2040.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/adafruit/kb2040/adafruit_kb2040.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/raspberrypi/rpi_pico/rpi_pico.zmk.yml
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/aliases.cmake

## 4. `pro_micro` connector pin table

Valid indices on every in-tree `pro_micro` board: **0–10, 14, 15, 16, 18, 19, 20, 21** (18 pins). 11, 12, 13, 17 do not exist. Checked at v0.3.0 for every ZMK `arduino_pro_micro_pins*.dtsi` (nice_nano, nrfmicro ×3, puchi_ble, bluemicro840, mikoto v5/v6, proton_c) and Zephyr 3.5 `sparkfun_pro_micro_connector.dtsi` (SparkFun RP2040, KB2040): `gpio-map` entries and MCU pins are identical to main; the table below holds for both. Default peripheral assignments verified from nice!nano pinctrl only (`nice_nano-pinctrl.dtsi` identical at v0.3.0 and main): UART TX=D1, RX=D0; I2C SDA=D2, SCL=D3; SPI SCK=D15, MOSI=D16, MISO=D14 (other boards follow the Pro Micro footprint convention but their pinctrl was not checked here). Free to use as GPIO when that bus is not enabled.

| `&pro_micro N` | Pro Micro label | nice!nano (v1/v2) | nRFMicro 1.1/1.3 (52840), Puchi-BLE | BlueMicro840 | SparkFun Pro Micro RP2040 | KB2040 | Default role |
|---|---|---|---|---|---|---|---|
| 0 | D0 | P0.08 | P0.08 | P0.08 | GP1 | GP1 | UART RX |
| 1 | D1 | P0.06 | P0.06 | P0.06 | GP0 | GP0 | UART TX |
| 2 | D2 | P0.17 | P0.15 | P0.15 | GP2 | GP2 | I2C SDA |
| 3 | D3 | P0.20 | P0.17 | P0.17 | GP3 | GP3 | I2C SCL |
| 4 | D4/A6 | P0.22 | P0.20 | P0.20 | GP4 | GP4 | |
| 5 | D5 | P0.24 | P0.13 | P0.13 | GP5 | GP5 | |
| 6 | D6/A7 | P1.00 | P0.24 | P0.24 | GP6 | GP6 | |
| 7 | D7 | P0.11 | P0.09 | P0.09 | GP7 | GP7 | |
| 8 | D8/A8 | P1.04 | P0.10 | P0.10 | GP8 | GP8 | |
| 9 | D9/A9 | P1.06 | P1.06 | P1.06 | GP9 | GP9 | |
| 10 | D10/A10 | P0.09 | P1.11 | P1.11 | GP21 | GP10 | |
| 14 | D14 | P1.11 | P0.03 | P0.03 | GP20 | GP20 | SPI MISO |
| 15 | D15 | P1.13 | P1.13 | P1.13 | GP22 | GP18 | SPI SCK |
| 16 | D16 | P0.10 | P0.28 | P0.28 | GP23 | GP19 | SPI MOSI |
| 18 | D18/A0 | P1.15 | P0.02 | P0.02 | GP26 | GP26 | |
| 19 | D19/A1 | P0.02 | P0.29 | P0.29 | GP27 | GP27 | |
| 20 | D20/A2 | P0.29 | P0.31 | P0.26 | GP28 | GP28 | |
| 21 | D21/A3 | P0.31 | P0.30 | P0.30 | GP29 | GP29 | |

nRFMicro nRF52833 and "flipped", Mikoto and Proton-C have their own mappings (see their `arduino_pro_micro_pins*.dtsi`); the shield does not care, the D-number is what counts. Default role column: SPI roles verified for nice!nano only (`spi1`: SCK P1.13=D15, MOSI P0.10=D16, MISO P1.11=D14); Puchi-BLE maps `pro_micro_spi` to `&spi0`, not `&spi1`.

nice!nano-specific: P0.13 drives `EXT_POWER` (not on connector); `&gpio1 7` etc. (middle pins) are raw pins.

`&pro_micro_a N` (analog numbering, ZMK nRF boards only): valid N = 0, 1, 2, 3, 6, 7, 8, 9, 10 → same physical pins as D18, D19, D20, D21, D4, D6, D8, D9, D10. Not defined on the Zephyr-upstream RP2040 boards (their connector compatible is `sparkfun,pro-micro`; ZMK's own boards use `arduino-pro-micro`; node label `pro_micro` is identical).

Sources:
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/nice_nano/arduino_pro_micro_pins.dtsi (v0.3.0 path; other boards under `app/boards/arm/<board>/`)
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/boards/arm/sparkfun_pro_micro_rp2040/sparkfun_pro_micro_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/boards/arm/adafruit_kb2040/sparkfun_pro_micro_connector.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/nicekeyboards/nice_nano/arduino_pro_micro_pins.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/nicekeyboards/nice_nano/nice_nano-pinctrl.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/joric/nrfmicro/arduino_pro_micro_pins.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/keycapsss/puchi_ble/arduino_pro_micro_pins.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/jpconstantineau/bluemicro840/arduino_pro_micro_pins.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/zhiayang/mikoto/arduino_pro_micro_pins_v5.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/module/boards/qmk/proton_c/arduino_pro_micro_pins.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/boards/sparkfun/pro_micro_rp2040/sparkfun_pro_micro_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/boards/adafruit/kb2040/sparkfun_pro_micro_connector.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/interconnects/pro_micro/pro_micro.zmk.yml

## 5. `seeed_xiao` connector pin table

Valid indices: **0–10** (11 pins). Compatible `seeed,xiao-gpio`, label `xiao_d`. Pin maps checked in Zephyr `v3.5.0+zmk-fixes` (`boards/arm/seeeduino_xiao_ble`, `seeeduino_xiao_rp2040`, `seeeduino_xiao`, `adafruit_qt_py_rp2040`): identical to main.

| `&xiao_d N` | XIAO nRF52840 (v0.3.0 `seeeduino_xiao_ble`) | XIAO RP2040 | XIAO SAMD21 |
|---|---|---|---|
| 0 | P0.02 | GP26 | PA02 |
| 1 | P0.03 | GP27 | PA04 |
| 2 | P0.28 | GP28 | PA10 |
| 3 | P0.29 | GP29 | PA11 |
| 4 | P0.04 | GP6 | PA08 |
| 5 | P0.05 | GP7 | PA09 |
| 6 | P1.11 | GP0 | PB08 |
| 7 | P1.12 | GP1 | PB09 |
| 8 | P1.13 | GP2 | PA07 |
| 9 | P1.14 | GP4 | PA05 |
| 10 | P1.15 | GP3 | PA06 |

Bus aliases (XIAO nRF52840): `xiao_i2c=&i2c0` on v0.3.0 (Zephyr 3.5), `&i2c1` on main; `xiao_spi=&spi2`, `xiao_serial=&uart0` (ZMK disables it: v0.3.0 `app/boards/seeeduino_xiao_ble.overlay`, main `xiao_ble_zmk.dts`); `xiao_adc=&adc` **main only (not in v0.3.0)** (no `xiao_adc` label in any Zephyr 3.5 XIAO connector file). XIAO pinout (Seeed): D4/D5 = I2C SDA/SCL, D6/D7 = UART TX/RX, D8/D9/D10 = SPI SCK/MISO/MOSI — this role assignment is from Seeed's pinout, not re-verified in the ZMK tree.

Sources:
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/boards/arm/seeeduino_xiao_ble/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/boards/arm/seeeduino_xiao_rp2040/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/boards/arm/seeeduino_xiao/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/seeeduino_xiao_ble.overlay
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/boards/seeed/xiao_ble/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/boards/seeed/xiao_rp2040/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/boards/seeed/seeeduino_xiao/seeed_xiao_connector.dtsi
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/seeed/xiao_ble/xiao_ble_zmk.dts
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/interconnects/seeed_xiao/seeed_xiao.zmk.yml

## 6. Board-specific files inside a shield (`<shield>/boards/`)

Pin control (pinctrl for SPI/I2C/UART peripherals, e.g. WS2812 underglow via SPI MOSI) is board-specific, so it goes in `boards/shields/<shield>/boards/<file>.overlay` (and optional `.conf`), one per supported board.

**v0.3.0 (HWMv1, generated):** file = exact board id, plus `<board>_<rev with . → _>` if the board has a revision. Zephyr 3.5 `zephyr_file(CONF_FILES …)` applies `<BOARD>.overlay` then `<BOARD>_<REV>.overlay` if they exist, searching `<shield>/boards/` and `<shield>/boards/<shield>/`.

| Board id | File name |
|---|---|
| `nice_nano_v2` | `nice_nano_v2.overlay` |
| `nice_nano` (v1) | `nice_nano.overlay` |
| `seeeduino_xiao_ble` | `seeeduino_xiao_ble.overlay` |
| `mikoto@6.1` | `mikoto.overlay` and/or `mikoto_6_1_0.overlay` |

In-tree precedent at v0.3.0: corne and reviung41 ship byte-identical `boards/nice_nano.overlay` and `boards/nice_nano_v2.overlay` (fixtures). `nice_nano_v2` does **not** pick up `nice_nano.overlay` — a separate board name, not a revision.

**main (HWMv2) — main only (not in v0.3.0):** build string = normalized board target, `/` and `@`-revision → `_`: `nice_nano//zmk` → `nice_nano_nrf52840_zmk.overlay` (also matches v1 unless `nice_nano_nrf52840_zmk_1_0_0.overlay` exists); `nrfmicro@1.3.0/nrf52840/zmk` → `nrfmicro_nrf52840_zmk_1_3_0.overlay`. Zephyr 4.1 applies every existing file from least to most specific (`nice_nano.overlay`, …, `nice_nano_nrf52840_zmk_2_0_0.overlay`); long and short forms for the same target together are a fatal CMake error. In-tree main: 26 shields use `nice_nano_nrf52840_zmk.overlay`.

Generator rule: only emit `boards/*.overlay` when the design needs board pinctrl (underglow, displays on non-default pins); kscan-only shields need none (reviung41/corne only have one for underglow).

Sources:
- https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/boards/shields/corne/boards
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/cmake/modules/shields.cmake
- https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/cmake/modules/extensions.cmake (`zephyr_file`, `zephyr_build_string`)
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/development/hardware-integration/pinctrl.mdx (v0.3.0 docs source)
- main: https://zmk.dev/docs/hardware-integration/pinctrl#boards-shields-and-modules
- https://zmk.dev/docs/hardware-integration/lighting/underglow
- https://github.com/zmkfirmware/zmk/blob/main/app/boards/shields/corne/boards/nice_nano_nrf52840_zmk.overlay
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/cmake/modules/shields.cmake
- https://github.com/zmkfirmware/zephyr/blob/v4.1.0%2Bzmk-fixes/cmake/modules/extensions.cmake (`zephyr_build_string`, `zephyr_file`)

## 7. Metadata: `requires` / `exposes`

Shield `.zmk.yml` declares `requires: [pro_micro]` (or `[seeed_xiao]`); board `.zmk.yml` declares `exposes: [pro_micro]`. A shield is compatible with a board iff board `exposes` ⊇ shield `requires`. Use this to filter the controller dropdown by the chosen interconnect.

Sources:
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/development/hardware-integration/hardware-metadata-files.md (v0.3.0; zmk.dev: https://zmk.dev/docs/hardware-integration/hardware-metadata-files)
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/shields/corne/corne.zmk.yml
