# ZMK Kconfig options (user-facing inventory)

Target: ZMK **v0.3.0** @ `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (2025-08-01, Zephyr `v3.5.0+zmk-fixes`). Verified 2026-09-27 against that tag and against `main` @ `5b51501fead672c41b5cfb396f3dafe0894bf4e9` (Zephyr `v4.1.0+zmk-fixes`, reference for v0.4) by diffing every `Kconfig*` file under `app/` (boards excluded) and `docs/docs/config/*.md`.
Sources: `docs/docs/config/*.md` at both commits (zmk.dev renders `main`; v0.3.0 source: https://github.com/zmkfirmware/zmk/tree/v0.3.0/docs/docs/config) cross-checked with the Kconfig source. When the docs table and the Kconfig source disagree, **the Kconfig source is authoritative** (it is what the build uses); both values are listed and marked `DISCREPANCY`.

## How to read this page

- **Doc URL**: every table sits under one zmk.dev anchor, given as `Doc:` above the table. Use it as `docsUrl` for every row of that table. Anchors are the H2/H3 heading slugs of the page (several pages repeat `### Kconfig`, which Docusaurus dedupes as `#kconfig-1`, `#kconfig-2`…, so we link the unique parent section instead).
- **Type**: `bool` (`y`/`n`), `int`, `string` (double-quoted), `hex` (`0x...`), `choice` (a group where exactly zero or one member is `y`; the first/declared default applies if none is set).
- **Default**: effective default from Kconfig source. `(implied)` = no own `default`, but another enabled symbol `imply`s it. `(dep)` = conditional.
- **Where** column:
  - `C` = user/shield `.conf` (`CONFIG_X=value`). Default place for everything a user toggles.
  - `D` = shield `Kconfig.defconfig` (`config X` / `    default value` inside `if SHIELD_<NAME>...`). Hardware defaults the shield author sets; a user `.conf` still overrides them.
  - `B` = normally set by the board's `<board>_defconfig` (v0.3.0 e.g. `app/boards/arm/nice_nano/nice_nano_v2_defconfig`; main `nice_nano_nrf52840_zmk_2_0_0_defconfig`; sets `CONFIG_ZMK_BLE=y`, `CONFIG_ZMK_USB=y`); the shield generator should not emit these.
  - `DT` = has no effect unless a devicetree node/`chosen` entry exists (overlay/keymap). The generator must emit the DT part too.
- **Since**: **main only (not in v0.3.0)** = added after v0.3.0; do not emit for the v0.3.0 target. Empty = present in both with the same default unless the Default cell gives both values (v0.3.0 first).

### Syntax reminder

`.conf` (user config `config/<shield>.conf`, or shield dir `<shield>.conf` / `<shield>_left.conf`):

```ini
CONFIG_ZMK_SLEEP=y
CONFIG_ZMK_IDLE_SLEEP_TIMEOUT=1800000
CONFIG_ZMK_KEYBOARD_NAME="My Board"
```

`Kconfig.defconfig` (shield dir; no `CONFIG_` prefix):

```kconfig
if SHIELD_MYBOARD_LEFT

config ZMK_KEYBOARD_NAME
    default "MyBoard"

config ZMK_SPLIT_ROLE_CENTRAL
    default y

endif

if SHIELD_MYBOARD_LEFT || SHIELD_MYBOARD_RIGHT

config ZMK_SPLIT
    default y

endif
```

File-location rules (from https://zmk.dev/docs/config#config-file-locations; same text at v0.3.0): in the user `zmk-config/config/` folder a shared `<name>.conf` without `_left`/`_right` applies to both halves, and if it exists the per-half files are ignored. Shared (suffix-less) files are **not** supported in shield folders — a split shield needs per-half `.conf` there if any. Changing any Kconfig requires rebuilding and reflashing.

Kconfig can also be passed without a `.conf` via `build.yaml` `cmake-args: -DCONFIG_ZMK_STUDIO=y` (see https://zmk.dev/docs/features/studio#building).

Sources: https://zmk.dev/docs/config · https://zmk.dev/docs/config#kconfig-files · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/index.md

---

## 1. General

Doc: https://zmk.dev/docs/config/system#general

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_KEYBOARD_NAME` | string | none (shield must set) | Keyboard name for USB product string and BLE device name. **Max 16 chars** — enforced by `BUILD_ASSERT(len <= CONFIG_BT_DEVICE_NAME_MAX)` in `app/src/ble.c`, `BT_DEVICE_NAME_MAX` default 16. Changing it on an already-paired board needs a settings reset (`BT_DEVICE_NAME_DYNAMIC`). | D (C overrides) | |
| `CONFIG_ZMK_WPM` | bool | n | Calculate words per minute (selected by WPM widget). | C | |
| `CONFIG_HEAP_MEM_POOL_SIZE` | int | 8192 (docs; Zephyr symbol) | Heap pool size. | C | |
| `CONFIG_ZMK_BOARD_COMPAT` | bool (no prompt) | n | Set by ZMK board variants (`//zmk` qualifier) to detect plain upstream Zephyr boards. Not user-settable. | B | **main only (not in v0.3.0)** |

Settings (persistent storage). Doc: v0.3.0 lists these in the System table (https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/config/system.md, zmk.dev anchor `config/system#general` no longer has them); main/zmk.dev: https://zmk.dev/docs/config/settings#kconfig

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_SETTINGS_RESET_ON_START` | bool | n | Erase all persisted settings (BLE bonds, Studio keymap, lighting state) at every boot. Use only for a reset build; the `settings_reset` shield is the recommended way. | C | |
| `CONFIG_ZMK_SETTINGS_SAVE_DEBOUNCE` | int (ms) | 60000 | Delay after a runtime setting change before writing to flash. | C | |

Symbols and defaults identical in both versions; only the doc page moved (`config/settings.md` is **main only (not in v0.3.0)**).

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/ble.c · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/system.md · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/settings.md

---

## 2. HID / NKRO

Doc: https://zmk.dev/docs/config/system#hid — changing any of these changes the HID report descriptor; hosts must re-pair/refresh (https://zmk.dev/docs/features/bluetooth#refreshing-the-hid-descriptor).

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_HID_INDICATORS` | bool | n | Receive host LED indicator state (Caps/Num lock). | C | |
| `CONFIG_ZMK_HID_CONSUMER_REPORT_SIZE` | int | 6 | Consumer keys reportable simultaneously. | C | |
| `CONFIG_ZMK_HID_SEPARATE_MOD_RELEASE_REPORT` | bool | n | Send modifier release after non-modifier release. | C | |
| `CONFIG_ZMK_HID_REPORT_TYPE_HKRO` | choice `ZMK_HID_REPORT_TYPE` | **selected** (first member) | N-key rollover limited to `ZMK_HID_KEYBOARD_REPORT_SIZE`; boot-keyboard compatible. | C | |
| `CONFIG_ZMK_HID_REPORT_TYPE_NKRO` | choice `ZMK_HID_REPORT_TYPE` | n | Full NKRO; may break some BIOS/UEFI. | C | |
| `CONFIG_ZMK_HID_KEYBOARD_REPORT_SIZE` | int | 6 | Keys reportable at once (only with HKRO). | C | |
| `CONFIG_ZMK_HID_KEYBOARD_NKRO_EXTENDED_REPORT` | bool | n | With NKRO, enable F13–F24 / INTL1–8 usages; breaks Android. `depends on ZMK_HID_REPORT_TYPE_NKRO`. | C | |
| `CONFIG_ZMK_HID_CONSUMER_REPORT_USAGES_FULL` | choice `ZMK_HID_CONSUMER_REPORT_USAGES` | **selected** (first member) | All consumer usages; some host OS compatibility issues. | C | |
| `CONFIG_ZMK_HID_CONSUMER_REPORT_USAGES_BASIC` | choice | n | Consumer usages up to "Playback Speed - Slow" only; wider host compatibility. | C | |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.defaults

---

## 3. USB

Doc: https://zmk.dev/docs/config/system#usb

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_USB` | bool | n in Kconfig; `y` in ZMK board defconfigs (e.g. nice_nano) | ZMK as a USB HID keyboard. `depends on !ZMK_SPLIT \|\| ZMK_SPLIT_ROLE_CENTRAL` (peripheral halves never do USB HID). | B | |
| `CONFIG_ZMK_USB_BOOT` | bool | n | USB HID boot protocol (needed e.g. for BitLocker/FileVault pre-boot input). `depends on ZMK_USB`. | C | |
| `CONFIG_USB_DEVICE_VID` | int/hex | `0x1D50` | USB vendor ID (Zephyr symbol, ZMK default). | C | |
| `CONFIG_USB_DEVICE_PID` | int/hex | `0x615E` | USB product ID. | C | |
| `CONFIG_USB_DEVICE_MANUFACTURER` | string | `"ZMK Project"` | USB manufacturer string. | C | |
| `CONFIG_USB_HID_POLL_INTERVAL_MS` | int | 1 | USB polling interval. | C | |
| `CONFIG_ZMK_USB_INIT_PRIORITY` | int | v0.3.0 **94** (Kconfig); main 96; docs 50 at both — DISCREPANCY | USB init priority. Low-level; do not expose. | — | |
| `CONFIG_ZMK_USB_HID_INIT_PRIORITY` | int | 95 | USB HID init priority (undocumented). Do not expose. | — | |
| `CONFIG_USB` | bool | (selected by `ZMK_USB`) | Zephyr USB drivers. Do not set directly. | — | |

`USB_DEVICE_PRODUCT` defaults to `ZMK_KEYBOARD_NAME` (app/Kconfig).

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/arm/nice_nano/nice_nano_v2_defconfig · https://github.com/zmkfirmware/zmk/blob/main/app/boards/nicekeyboards/nice_nano/nice_nano_nrf52840_zmk_2_0_0_defconfig

---

## 4. Bluetooth (BLE)

Doc (system table): https://zmk.dev/docs/config/system#bluetooth
Doc (bluetooth page): https://zmk.dev/docs/config/bluetooth#kconfig

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_BLE` | bool | n in Kconfig; `y` in wireless board defconfigs | ZMK as a BLE HID (HoG) keyboard. Implies `ZMK_BATTERY_REPORTING`, `BT_DEVICE_NAME_DYNAMIC`, settings. | B | |
| `CONFIG_BT_MAX_CONN` | int | 5 (non-split); **6** on split BLE central; **1** on split peripheral | Max simultaneous BT connections. Docs say 5 and "on split central set one greater than profile count" — source already defaults 6 there. Keep equal to `BT_MAX_PAIRED`. | C (central only) | |
| `CONFIG_BT_MAX_PAIRED` | int | same as `BT_MAX_CONN` | Max bonded hosts. | C (central only) | |
| `CONFIG_BT_BAS` | bool | y (implied by `ZMK_BATTERY_REPORTING` with BLE) | BLE Battery Service. Set `n` to stop macOS wake-ups from battery notifications (https://zmk.dev/docs/config/battery#kconfig). | C | |
| `CONFIG_ZMK_BLE_CLEAR_BONDS_ON_START` | bool | n | Delete all bonds on every boot. | C | |
| `CONFIG_ZMK_BLE_PASSKEY_ENTRY` | bool | n | Experimental: host shows a passkey that must be typed on the keyboard. Re-pair all hosts after enabling. | C | |
| `CONFIG_ZMK_BLE_EXPERIMENTAL_CONN` | bool | n | Connection-stability changes planned as future defaults (currently: disables 2M PHY, `BT_CTLR_PHY_2M` default n). | C | |
| `CONFIG_ZMK_BLE_EXPERIMENTAL_SEC` | bool | n | Future security features: passkey entry, allow overwriting keys of previously paired hosts (`imply BT_SMP_ALLOW_UNAUTH_OVERWRITE`). | C | |
| `CONFIG_ZMK_BLE_EXPERIMENTAL_FEATURES` | bool | n | Selects both experimental options above. | C | |
| `CONFIG_BT_GATT_ENFORCE_SUBSCRIPTION` | bool | y (Zephyr) | Set `n` to work around Windows battery-notification bug. | C | |
| `CONFIG_BT_DEVICE_APPEARANCE` | int | 961 (keyboard) | BLE appearance, decimal. v0.3.0: default set in `app/Kconfig`, but `ble.c` hardcodes appearance `0x03C1` (=961) in the advertising data, so changing it does not change advertising; main: `Kconfig.defaults`, used by `ble.c`. Docs row **main only (not in v0.3.0)**. | C | default in both; effect **main only (not in v0.3.0)** |
| `CONFIG_BT_CTLR_TX_PWR_PLUS_8` | bool (Zephyr choice `BT_CTLR_TX_PWR`) | 0 dBm selected | Increase radio TX power (nRF52840: multiples of 4 from MINUS_20 to PLUS_8). Documented only on troubleshooting page: https://zmk.dev/docs/troubleshooting/connection-issues | C | |
| `CONFIG_ZMK_BLE_CONSUMER_REPORT_QUEUE_SIZE` | int | 5 | Consumer report queue. Tuning. | C | |
| `CONFIG_ZMK_BLE_KEYBOARD_REPORT_QUEUE_SIZE` | int | 20 | Keyboard report queue. Tuning. | C | |
| `CONFIG_ZMK_BLE_MOUSE_REPORT_QUEUE_SIZE` | int | 20 | Mouse report queue (undocumented; in source). Tuning. | C | |
| `CONFIG_ZMK_BLE_INIT_PRIORITY` | int | 50 | Init priority. Do not expose. | — | |
| `CONFIG_ZMK_BLE_THREAD_PRIORITY` | int | 5 | BLE notify thread priority. Do not expose. | — | |
| `CONFIG_ZMK_BLE_THREAD_STACK_SIZE` | int | 768 | BLE notify thread stack. Do not expose. | — | |
| `CONFIG_BT` | bool | (selected by `ZMK_BLE`) | Zephyr Bluetooth. Do not set directly. | — | |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/split/bluetooth/Kconfig.defaults · https://github.com/zmkfirmware/zmk/blob/main/app/src/split/bluetooth/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/bluetooth.md

---

## 5. Split

Doc: https://zmk.dev/docs/config/split#kconfig — feature overview https://zmk.dev/docs/features/split-keyboards

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_SPLIT` | bool | n | Enable split support. Set in `Kconfig.defconfig` under `if SHIELD_<N>_LEFT \|\| SHIELD_<N>_RIGHT`. | D | |
| `CONFIG_ZMK_SPLIT_ROLE_CENTRAL` | bool | n | `y` = this half is central (talks to hosts; usually left), `n` = peripheral. Set `default y` only under `if SHIELD_<N>_LEFT`. | D | |
| `CONFIG_ZMK_SPLIT_PERIPHERAL_HID_INDICATORS` | bool | n | Forward host LED indicator state to peripherals. `depends on ZMK_HID_INDICATORS`. | C | |
| `CONFIG_ZMK_SPLIT_BLE` | bool | y (`depends on ZMK_BLE`) | Use BLE between halves. | — | |
| `CONFIG_ZMK_SPLIT_WIRED` | bool | y if a `compatible = "zmk,wired-split"` node is enabled (`depends on DT_HAS_ZMK_WIRED_SPLIT_ENABLED`) | Use UART between halves. | DT | |

Bluetooth splits. Doc: https://zmk.dev/docs/config/split#bluetooth-splits

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_PERIPHERALS` | int | 1 | Number of peripherals connecting to the central (>1 for 3+ part splits / dongle). | C (central) | |
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING` | bool | n | Central fetches peripheral battery levels (needed for display widgets). | C (central) | |
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY` | bool | n | Central reports peripheral battery levels to hosts (enable together with FETCHING). | C (central) | |
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_QUEUE_SIZE` | int | `ZMK_SPLIT_BLE_CENTRAL_PERIPHERALS` | Battery event queue. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_POSITION_QUEUE_SIZE` | int | 5 | Key-state events queued from peripherals. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_SPLIT_RUN_STACK_SIZE` | int | 512 | Central write thread stack. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_CENTRAL_SPLIT_RUN_QUEUE_SIZE` | int | 5 | Behavior-run events queued to peripherals. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_PERIPHERAL_STACK_SIZE` | int | 756 | Peripheral notify thread stack. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_PERIPHERAL_PRIORITY` | int | 5 | Peripheral notify thread priority. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_PERIPHERAL_POSITION_QUEUE_SIZE` | int | 10 | Key-state events queued to central. Tuning. | C | |
| `CONFIG_ZMK_SPLIT_BLE_PREF_INT` / `_PREF_LATENCY` / `_PREF_TIMEOUT` | int | 6 / 30 / 400 | Central↔peripheral connection interval / latency / supervision timeout (undocumented; source only, central). | C | |
| `CONFIG_ZMK_INPUT_SPLIT_MSG_QUEUE_SIZE` | int | 32 | Input-split events queued for BLE (pointing device on peripheral). Doc: https://zmk.dev/docs/config/split#input-split | C | **main only (not in v0.3.0)** |

Wired splits. Doc: https://zmk.dev/docs/config/split#wired-splits — also needs DT `wired_split { compatible = "zmk,wired-split"; device = <&pro_micro_serial>; };`

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_SPLIT_WIRED_UART_MODE_ASYNC` | choice | y if driver supports async (not nRF52) | DMA UART mode. | C | |
| `CONFIG_ZMK_SPLIT_WIRED_UART_MODE_INTERRUPT` | choice | y if hardware supports interrupts | Interrupt UART mode (RP2040, nRF52). | C | |
| `CONFIG_ZMK_SPLIT_WIRED_UART_MODE_POLLING` | choice | y if neither other mode supported | Polling UART mode. | C | |
| `CONFIG_ZMK_SPLIT_WIRED_ASYNC_RX_TIMEOUT` | int (µs) | 20 | Async RX timeout. Doc anchor `#async-dma-mode`. | C | |
| `CONFIG_ZMK_SPLIT_WIRED_POLLING_RX_PERIOD` | int (ticks) | 10 | Polling period. Doc anchor `#polling-mode`. | C | |

Source also has half-duplex wired options (`ZMK_SPLIT_WIRED_HALF_DUPLEX_RX_TIMEOUT`, `..._RX_COMPLETE_TIMEOUT`, `ZMK_SPLIT_WIRED_CMD_BUFFER_ITEMS`, `ZMK_SPLIT_WIRED_EVENT_BUFFER_ITEMS`) that are **not documented** on zmk.dev; do not expose.

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/src/split/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/split/bluetooth/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/split/wired/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/split.md

---

## 6. Power: idle, sleep, soft off, external power

Doc: https://zmk.dev/docs/config/power#low-power-states — feature https://zmk.dev/docs/features/low-power-states

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_IDLE_TIMEOUT` | int (ms) | 30000 | Inactivity before idle (displays/lighting off, BLE stays connected). | C | |
| `CONFIG_ZMK_SLEEP` | bool | n | Enable deep sleep (`depends on HAS_POWEROFF`). Needs kscan `wakeup-source` in DT to wake. | C (+DT) | |
| `CONFIG_ZMK_IDLE_SLEEP_TIMEOUT` | int (ms) | 900000 | Inactivity before deep sleep (only with `ZMK_SLEEP`). | C | |
| `CONFIG_ZMK_PM_SOFT_OFF` | bool | n | Soft off via `&soft_off` behavior or dedicated hardware (`depends on HAS_POWEROFF`). Hardware wake needs `zmk,gpio-key-wakeup-trigger` / `zmk,soft-off-wakeup-sources` DT nodes (https://zmk.dev/docs/hardware-integration/soft-off-setup). | C (+DT) | |
| `CONFIG_ZMK_GPIO_KEY_WAKEUP_TRIGGER` | bool | y if `zmk,gpio-key-wakeup-trigger` node enabled and `ZMK_PM_SOFT_OFF` | Auto; undocumented. | DT | |

External power. Doc: https://zmk.dev/docs/config/power#external-power-control

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_EXT_POWER` | bool | y | Control external power output (VCC cut for LEDs/displays). Needs a `compatible = "zmk,ext-power-generic"` DT node (boards like nice_nano provide it). | C (+DT) | |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.defaults · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/power.md

---

## 7. Kscan and debounce

Doc: https://zmk.dev/docs/config/kscan#common — debounce feature https://zmk.dev/docs/features/debouncing#global-options

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_KSCAN_DEBOUNCE_PRESS_MS` | int (ms) | -1 | Global press debounce; any value ≠ -1 overrides every driver's DT `debounce-press-ms`. `0` = eager. | C | |
| `CONFIG_ZMK_KSCAN_DEBOUNCE_RELEASE_MS` | int (ms) | -1 | Global release debounce; overrides DT `debounce-release-ms`. | C | |
| `CONFIG_ZMK_KSCAN_EVENT_QUEUE_SIZE` | int | 4 | Kscan event queue. Tuning. | C | |
| `CONFIG_KSCAN_INIT_PRIORITY` | int | 40 (Zephyr) | Kscan driver init priority. **DISCREPANCY**: docs list `CONFIG_ZMK_KSCAN_INIT_PRIORITY`, which does not exist in any ZMK Kconfig; drivers use Zephyr's `CONFIG_KSCAN_INIT_PRIORITY` (`kscan_gpio_matrix.c` etc.). Do not expose. | — | |

Per-driver. Docs: https://zmk.dev/docs/config/kscan#direct-gpio-driver · https://zmk.dev/docs/config/kscan#matrix-driver · https://zmk.dev/docs/config/kscan#charlieplex-driver

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_KSCAN_DIRECT_POLLING` | bool | n | `zmk,kscan-gpio-direct`: poll instead of interrupts. | C | |
| `CONFIG_ZMK_KSCAN_MATRIX_POLLING` | bool | n | `zmk,kscan-gpio-matrix`: poll instead of interrupts. | C | |
| `CONFIG_ZMK_KSCAN_MATRIX_WAIT_BEFORE_INPUTS` | int (ticks) | 0 | Wait after driving an output before reading inputs. | C | |
| `CONFIG_ZMK_KSCAN_MATRIX_WAIT_BETWEEN_OUTPUTS` | int (ticks) | 0; **1 on RP2040** (source, both); main also 1 on RP2350 | Settle time between outputs. Docs say 0 only — source adds SoC-specific default. | C | |
| `CONFIG_ZMK_KSCAN_CHARLIEPLEX_WAIT_BEFORE_INPUTS` | int (ticks) | 0 | Charlieplex equivalent. | C | |
| `CONFIG_ZMK_KSCAN_CHARLIEPLEX_WAIT_BETWEEN_OUTPUTS` | int (ticks) | 0 | Charlieplex equivalent. | C | |

Physical layout. Doc: https://zmk.dev/docs/config/layout#kconfig

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_PHYSICAL_LAYOUT_KEY_ROTATION` | bool | y | Store key rotation (`r rx ry`) of physical layouts internally (for Studio). | C | |

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/module/drivers/kscan/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/module/drivers/kscan/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/kscan.md · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/layout.md

---

## 8. Keymap behaviors, combos, macros

Doc: https://zmk.dev/docs/config/behaviors#common

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_BEHAVIORS_QUEUE_SIZE` | int | 64 | Max queued behaviors from macros/complex behaviors. | C | |
| `CONFIG_ZMK_BEHAVIOR_HOLD_TAP_MAX_HELD` | int | 10 | Max simultaneously held hold-taps. Doc `#hold-tap`. | C | |
| `CONFIG_ZMK_BEHAVIOR_HOLD_TAP_MAX_CAPTURED_EVENTS` | int | 40 | Events captured while a hold-tap is undecided. Doc `#hold-tap`. | C | |
| `CONFIG_ZMK_MACRO_DEFAULT_WAIT_MS` | int (ms) | 15 | Default macro `wait-ms`. Doc `#macro`. | C | |
| `CONFIG_ZMK_MACRO_DEFAULT_TAP_MS` | int (ms) | 30 | Default macro `tap-ms`. Doc `#macro`. | C | |
| `CONFIG_ZMK_BEHAVIOR_STICKY_KEY_MAX_HELD` | int | 10 | Max simultaneously held sticky keys. Doc `#sticky-key`. | C | |
| `CONFIG_ZMK_BEHAVIOR_TAP_DANCE_MAX_HELD` | int | 10 | Max simultaneously held tap-dances. Doc `#tap-dance`. | C | |

Combos. Doc: https://zmk.dev/docs/config/combos#kconfig

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_COMBO_MAX_PRESSED_COMBOS` | int | 4 | Max combos active at the same time. | C | |
| `CONFIG_ZMK_COMBO_MAX_COMBOS_PER_KEY` | int | 0 | **Deprecated**: storage now automatic. Never emit. | — | |
| `CONFIG_ZMK_COMBO_MAX_KEYS_PER_COMBO` | int | 0 | **Deprecated**: auto-calculated from `key-positions`. Never emit. | — | |

Encoders / sensors in keymap. Doc: https://zmk.dev/docs/config/encoders#ec11-encoders

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_EC11` | bool | **y if an enabled `alps,ec11` DT node exists** (`default y`, `depends on DT_HAS_ALPS_EC11_ENABLED`) — docs say n. DISCREPANCY (docs describe the value without DT). | EC11 encoder driver. | C (+DT) | |
| `CONFIG_EC11_TRIGGER_GLOBAL_THREAD` | choice `EC11_TRIGGER_MODE` | n | Process encoder interrupts on the global thread. **Must be set** for encoders to work (features page: set `CONFIG_EC11=y` + `CONFIG_EC11_TRIGGER_GLOBAL_THREAD=y`). | C | |
| `CONFIG_EC11_TRIGGER_OWN_THREAD` | choice | n | Own thread for encoder interrupts. | C | |
| `CONFIG_EC11_TRIGGER_NONE` | choice | first member | No trigger = encoders effectively disabled. | C | |
| `CONFIG_EC11_THREAD_PRIORITY` | int | 10 | Own-thread priority (`depends on EC11_TRIGGER_OWN_THREAD`). | C | |
| `CONFIG_EC11_THREAD_STACK_SIZE` | int | 1024 | Own-thread stack. | C | |
| `CONFIG_ZMK_KEYMAP_SENSORS` | bool | y if a `zmk,keymap-sensors` DT node exists | Keymap `sensor-bindings` support (auto). | DT | |
| `CONFIG_ZMK_KEYMAP_SENSORS_DEFAULT_TRIGGERS_PER_ROTATION` | int | 20 | Default triggers per rotation when DT `triggers-per-rotation` not set (undocumented on config page). | C | |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.behaviors · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.defaults · https://github.com/zmkfirmware/zmk/blob/main/app/module/drivers/sensor/ec11/Kconfig · https://zmk.dev/docs/features/encoders#enabling-ec11-encoders

---

## 9. Battery

Doc: https://zmk.dev/docs/config/battery#kconfig — DT `chosen { zmk,battery = &vbatt; };` with a `zmk,battery-voltage-divider` or `zmk,battery-nrf-vddh` node (boards usually provide it).

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_BATTERY_REPORTING` | bool | n, but **implied by `ZMK_BLE`** → effectively y on wireless boards | Battery level detection/reporting. | C (+DT) | |
| `CONFIG_ZMK_BATTERY_REPORT_INTERVAL` | int (s) | 60 | Report interval. | C | |
| `CONFIG_ZMK_BATTERY_REPORTING_FETCH_MODE_STATE_OF_CHARGE` / `_LITHIUM_VOLTAGE` | choice | first | How level is read from sensor (undocumented on zmk.dev). Do not expose. | — | |

Peripheral battery on splits: see §5 `..._BATTERY_LEVEL_FETCHING` / `_PROXY`.

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/battery.md

---

## 10. Display

Doc: https://zmk.dev/docs/config/displays#kconfig — needs a display DT node + `chosen { zephyr,display = &oled; };` and the display driver (e.g. SSD1306 via `I2C`/`SSD1306` defaults in shield `Kconfig.defconfig`, see corne fixture).

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_DISPLAY` | bool | n | Enable display support (selects LVGL). | C (+DT, +D for driver/LVGL defaults) | |
| `CONFIG_ZMK_DISPLAY_BLANK_ON_IDLE` | bool | y if `SSD1306` | Blank display on idle. | C | |
| `CONFIG_ZMK_DISPLAY_TICK_PERIOD_MS` | int (ms) | 10 | Display task period. | C | |
| `CONFIG_ZMK_DISPLAY_INVERT` | bool | n | Invert colors. | C | |
| `CONFIG_ZMK_DISPLAY_STATUS_SCREEN_BUILT_IN` | choice | first (selected) | Built-in status screen; implies the widgets below. | C | |
| `CONFIG_ZMK_DISPLAY_STATUS_SCREEN_CUSTOM` | choice | n | Custom status screen (module-provided). | C | |
| `CONFIG_ZMK_DISPLAY_WORK_QUEUE_SYSTEM` | choice | first (selected) | UI updates on system work queue. | C | |
| `CONFIG_ZMK_DISPLAY_WORK_QUEUE_DEDICATED` | choice | n | Dedicated UI thread (for slow e-paper). | C | |
| `CONFIG_ZMK_DISPLAY_DEDICATED_THREAD_STACK_SIZE` | int | v0.3.0 **2048** (Kconfig and docs agree); main 3072 (docs still 2048) | UI thread stack. | C | |
| `CONFIG_ZMK_DISPLAY_DEDICATED_THREAD_PRIORITY` | int | 5 | UI thread priority. | C | |
| `CONFIG_ZMK_WIDGET_LAYER_STATUS` | bool | y (implied by built-in screen) | Active layer widget. `depends on !ZMK_SPLIT \|\| ZMK_SPLIT_ROLE_CENTRAL`. | C | |
| `CONFIG_ZMK_WIDGET_BATTERY_STATUS` | bool | y (implied) | Battery widget. `depends on ZMK_BATTERY_REPORTING`. | C | |
| `CONFIG_ZMK_WIDGET_BATTERY_STATUS_SHOW_PERCENTAGE` | bool | n | Percentage text instead of icons. | C | |
| `CONFIG_ZMK_WIDGET_OUTPUT_STATUS` | bool | y (implied) | USB/BLE output widget (central/non-split). | C | |
| `CONFIG_ZMK_WIDGET_PERIPHERAL_STATUS` | bool | y (implied) on BLE split peripheral | Peripheral connection widget (undocumented on config page). | C | |
| `CONFIG_ZMK_WIDGET_WPM_STATUS` | bool | n | WPM widget (selects `ZMK_WPM`). | C | |
| `CONFIG_ZMK_LV_FONT_DEFAULT_SMALL_*` | choice | `_MONTSERRAT_12` | Theme small font (undocumented). Do not expose. | — | |

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/display/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/display/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/display/widgets/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/displays.md

---

## 11. RGB underglow

Doc: https://zmk.dev/docs/config/lighting#rgb-underglow — needs a LED strip DT node (e.g. `worldsemi,ws2812-spi`) + `chosen { zmk,underglow = &led_strip; };` (https://zmk.dev/docs/hardware-integration/lighting/underglow). Usually lives in a board-specific overlay `boards/<board>.overlay` inside the shield dir (see corne fixture `boards/nice_nano_v2.overlay`; main name `boards/nice_nano_nrf52840_zmk.overlay`).

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_RGB_UNDERGLOW` | bool | n | Enable underglow (selects `LED_STRIP`). | C (+DT) | |
| `CONFIG_ZMK_RGB_UNDERGLOW_EXT_POWER` | bool | y | Underglow toggle also toggles external power. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_AUTO_OFF_IDLE` | bool | n | Off when idle. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_AUTO_OFF_USB` | bool | n | Off when USB disconnected (`depends on USB_DEVICE_STACK`). | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_HUE_STEP` | int (deg, 0–359) | 10 | Hue step. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_SAT_STEP` | int (%, 0–100) | 10 | Saturation step. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_BRT_STEP` | int (%, 0–100) | 10 | Brightness step. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_HUE_START` | int (0–359) | 0 | Initial hue. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_SAT_START` | int (0–100) | 100 | Initial saturation. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_BRT_START` | int (range BRT_MIN..BRT_MAX) | `ZMK_RGB_UNDERGLOW_BRT_MAX` (=100) | Initial brightness. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_SPD_START` | int (1–5) | 3 | Initial effect speed. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_EFF_START` | int (0–3) | 0 | Initial effect: 0 solid, 1 breathe, 2 spectrum, 3 swirl. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_ON_START` | bool | y | Initially on. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_BRT_MIN` | int (0–100) | 0 | Min brightness. | C | |
| `CONFIG_ZMK_RGB_UNDERGLOW_BRT_MAX` | int (BRT_MIN–100) | 100 | Max brightness. | C | |

`*_START` values apply only until the user changes state with `&rgb_ug`; the changed state is saved to flash.

**v0.3.0 (Zephyr 3.5): the LED strip driver must be enabled explicitly.** `ZMK_RGB_UNDERGLOW` only `select`s `LED_STRIP`; Zephyr 3.5's `WS2812_STRIP` (`drivers/led_strip/Kconfig.ws2812`) is a plain `bool` with no default. So a v0.3.0 build needs `CONFIG_WS2812_STRIP=y` in addition to `CONFIG_ZMK_RGB_UNDERGLOW=y` (v0.3.0 docs `features/lighting.md`; corne/reviung41 `.conf` comments). Generator: put it in the shield `Kconfig.defconfig` as in-tree `sofle` does —
```kconfig
if ZMK_RGB_UNDERGLOW

config WS2812_STRIP
    default y

endif
```
— or emit `CONFIG_WS2812_STRIP=y` next to `CONFIG_ZMK_RGB_UNDERGLOW=y` in `config/<name>.conf`. **main only (not in v0.3.0)**: Zephyr 4.1 enables LED strip drivers from devicetree, the docs say only `CONFIG_ZMK_RGB_UNDERGLOW=y`, and in-tree `.conf` files dropped the line; do not emit it for main.
(v0.3.0: https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/features/lighting.md · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/shields/sofle/Kconfig.defconfig · https://github.com/zmkfirmware/zephyr/blob/v3.5.0%2Bzmk-fixes/drivers/led_strip/Kconfig.ws2812 · main: https://zmk.dev/docs/features/lighting#enabling-rgb-underglow)

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.defaults · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/lighting.md

---

## 12. Backlight (single-color)

Doc: https://zmk.dev/docs/config/lighting#backlight — needs `gpio-leds`/`pwm-leds` DT node + `chosen { zmk,backlight = &backlight; };`

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_BACKLIGHT` | bool | n | Enable backlight (selects `LED`). | C (+DT) | |
| `CONFIG_ZMK_BACKLIGHT_BRT_STEP` | int (%, 1–100) | 20 | Brightness step. | C | |
| `CONFIG_ZMK_BACKLIGHT_BRT_START` | int (%, 1–100) | 40 | Initial brightness. | C | |
| `CONFIG_ZMK_BACKLIGHT_ON_START` | bool | y | Initially on. | C | |
| `CONFIG_ZMK_BACKLIGHT_AUTO_OFF_IDLE` | bool | n | Off when idle. | C | |
| `CONFIG_ZMK_BACKLIGHT_AUTO_OFF_USB` | bool | n | Off when USB disconnected. | C | |

LED indicators (Caps Lock LED etc.) — whole feature **main only (not in v0.3.0)** (no `zmk,indicator-leds` binding, `src/indicators/` or doc page at v0.3.0). Doc: https://zmk.dev/docs/config/led-indicators#kconfig — needs `compatible = "zmk,indicator-leds"` DT node and `CONFIG_ZMK_HID_INDICATORS=y`.

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_INDICATOR_LEDS_INIT_PRIORITY` | int | 91 | Must be > `CONFIG_LED_INIT_PRIORITY`. Do not expose. | — | **main only (not in v0.3.0)** |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/indicators/Kconfig.indicator_leds

---

## 13. Pointing / mouse

Doc: https://zmk.dev/docs/config/pointing#general — feature https://zmk.dev/docs/features/pointing

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_POINTING` | bool | n (y if deprecated `ZMK_MOUSE`) | Enable pointing/mouse HID; required for `&mkp`, `&mmv`, `&msc` behaviors. Changes HID descriptor. | C | |
| `CONFIG_ZMK_POINTING_SMOOTH_SCROLLING` | bool | n | Smooth scrolling via HID resolution multipliers. | C | |
| `CONFIG_ZMK_MOUSE` | bool | n | **Deprecated** alias; use `ZMK_POINTING`. Never emit. | — | |
| `CONFIG_INPUT_THREAD_STACK_SIZE` | int | 512 (Zephyr); 1024 on split peripherals (ZMK override) | Input thread stack. Doc `#advanced-settings`. | C | |

Input processors (`ZMK_INPUT_PROCESSOR_*`), `ZMK_INPUT_LISTENER`, `ZMK_INPUT_SPLIT` are auto-enabled from DT nodes; not user toggles.

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/src/pointing/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/pointing.md

---

## 14. ZMK Studio

Enable: https://zmk.dev/docs/features/studio#building — `CONFIG_ZMK_STUDIO=y` **plus** snippet `studio-rpc-usb-uart` (build.yaml `snippet:` / `west build -S`), **plus** a `zmk,physical-layout` in DT (`chosen { zmk,physical-layout = ...; }`). For splits only on the central half:

```yaml
include:
  - board: nice_nano_v2          # main: nice_nano//zmk
    shield: corne_left
    snippet: studio-rpc-usb-uart
    cmake-args: -DCONFIG_ZMK_STUDIO=y
  - board: nice_nano_v2
    shield: corne_right
```

The snippet defines `ZMK_BEHAVIORS_KEEP_ALL` (all behaviors compiled in); override via `#define ZMK_BEHAVIORS_OMIT_<LABEL>` before `#include <behaviors.dtsi>` (https://zmk.dev/docs/features/studio#including-unreferenced-behaviors).

Doc: https://zmk.dev/docs/config/studio#keymaps · https://zmk.dev/docs/config/studio#locking · https://zmk.dev/docs/config/studio#transportprotocol-details

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_STUDIO` | bool | n | Studio runtime keymap editing (not listed in config/studio.md tables; documented on features page). | C or cmake-args (+snippet, +DT) | |
| `CONFIG_ZMK_KEYMAP_LAYER_NAME_MAX_LEN` | int | 20 | Max layer `display-name` length stored. | C | |
| `CONFIG_ZMK_STUDIO_LOCKING` | bool | y (implied by `ZMK_STUDIO_RPC`) | Require `&studio_unlock` before Studio edits. | C | |
| `CONFIG_ZMK_STUDIO_LOCK_IDLE_TIMEOUT_SEC` | int (s) | **600** (Kconfig, both) / 500 (docs, both) — DISCREPANCY | Auto-lock after Studio inactivity. | C | |
| `CONFIG_ZMK_STUDIO_LOCK_ON_DISCONNECT` | bool | y | Re-lock on Studio disconnect. | C | |
| `CONFIG_ZMK_STUDIO_TRANSPORT_BLE_PREF_LATENCY` | int | 10 | BLE latency while Studio active (main wraps it in `if ZMK_STUDIO_TRANSPORT_BLE`; same default). | C | |
| `CONFIG_ZMK_STUDIO_RPC_THREAD_STACK_SIZE` | int | **4096** (Kconfig, both) / 1800 (docs, both) — DISCREPANCY | RPC thread stack. Do not expose. | — | |
| `CONFIG_ZMK_STUDIO_RPC_RX_BUF_SIZE` | int | 30 | RX buffer bytes. Do not expose. | — | |
| `CONFIG_ZMK_STUDIO_RPC_TX_BUF_SIZE` | int | 64 | TX buffer bytes. Do not expose. | — | |
| `CONFIG_ZMK_STUDIO_TRANSPORT_UART` | bool | y if chosen `zmk,studio-rpc-uart` enabled (the snippet sets it) | USB serial transport. `CONFIG_ZMK_STUDIO_TRANSPORT_UART_RX_PRIORITY` (int, 9) is **main only (not in v0.3.0)**. | snippet | |
| `CONFIG_ZMK_STUDIO_TRANSPORT_BLE` | bool | y (`depends on ZMK_BLE`) | BLE GATT transport. | — | |

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/studio/Kconfig · https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/features/studio.md (v0.3.0 example uses `nice_nano_v2`) · https://github.com/zmkfirmware/zmk/blob/main/app/src/studio/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/studio.md · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/features/studio.md

---

## 15. Logging

Doc: https://zmk.dev/docs/config/system#logging — how-to https://zmk.dev/docs/development/usb-logging

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_USB_LOGGING` | bool | n | USB CDC-ACM logging. **Legacy**: preferred method (v0.3.0 and main) is the `zmk-usb-logging` snippet (build.yaml `snippet: zmk-usb-logging`); the symbol remains for boards lacking snippet support. Increases power use. | C (or snippet) | |
| `CONFIG_ZMK_LOG_LEVEL` | int (0–4) | 4 (only when `!ZMK_LOGGING_MINIMAL`) | ZMK log level. | C | |
| `CONFIG_ZMK_LOGGING_MINIMAL` | bool | n | Suppress all ZMK debug logs (undocumented on config page). | C | |
| `CONFIG_ZMK_RTT_LOGGING` | bool | n | SEGGER RTT logging (debug probe; undocumented on config page). | C | |
| `CONFIG_LOG_PROCESS_THREAD_STARTUP_DELAY_MS` | int (Zephyr) | Zephyr default | Delay log output after boot (e.g. 8000) to catch early messages. | C | |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/development/usb-logging.mdx

---

## 16. Bootloader integration — **main only (not in v0.3.0)**

None of these symbols, `app/src/boot/`, `config/bootloader.md` or `CONFIG_RETENTION_BOOT_MODE` handling in `&bootloader` exist at v0.3.0. Doc: https://zmk.dev/docs/config/bootloader#double-tap-to-bootloader · https://zmk.dev/docs/config/bootloader#stm32-nboot_sel-option-byte-setup · https://zmk.dev/docs/config/bootloader#bootmode-magic-value-mapper

| Symbol | Type | Default | Meaning | Where | Since |
|---|---|---|---|---|---|
| `CONFIG_ZMK_DBL_TAP_BOOTLOADER` | bool | y if STM32 or RP2040/RP2350 ROM bootloader (`depends on RETENTION_BOOT_MODE`) | Double-tap reset enters bootloader. | C | **main only (not in v0.3.0)** |
| `CONFIG_ZMK_DBL_TAP_BOOTLOADER_TIMEOUT_MS` | int (ms) | 500 | Window for the second reset. | C | **main only (not in v0.3.0)** |
| `CONFIG_ZMK_BOOT_STM32_ENFORCE_NBOOT_SEL` | bool | y on STM32C071 / STM32G0B1 | Clear `nBOOT_SEL` option bit so BOOT0 works. | C | **main only (not in v0.3.0)** |
| `CONFIG_ZMK_BOOTMODE_BOOTLOADER_MAGIC_VALUE` | hex | derived from bootloader type (`0xf01669ef` tinyuf2/BOSSA, `0x57` Adafruit nRF52) | Board-level. Do not expose. | B | **main only (not in v0.3.0)** |
| `CONFIG_ZMK_BOOTMODE_MAGIC_VALUE_BOOTLOADER_TYPE_{TINYUF2,ADAFRUIT_BOSSA,ADAFRUIT_NRF52}` | bool | n | Board-level. Do not expose. | B | **main only (not in v0.3.0)** |

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/src/boot/Kconfig · https://github.com/zmkfirmware/zmk/blob/main/app/src/boot/Kconfig.defaults · https://github.com/zmkfirmware/zmk/blob/main/docs/docs/config/bootloader.md

---

## 17. Snippets (not Kconfig, but set next to Kconfig in build.yaml)

Doc: https://zmk.dev/docs/config/system#snippets — all four snippets exist in `app/snippets/` at v0.3.0 and main.

| Snippet | Effect |
|---|---|
| `studio-rpc-usb-uart` | Studio USB transport + keep all behaviors (§14). |
| `zmk-usb-logging` | USB logging (§15). |
| `nrf52833-nosd` / `nrf52840-nosd` | Overwrite SoftDevice for more flash. **Dangerous**: can brick the bootloader path; never enable by default. |

---

## 18. Summary of discrepancies (docs vs Kconfig source)

| Item | zmk.dev docs (v0.3.0 = main unless noted) | Kconfig source v0.3.0 (authoritative for us) | Kconfig source main |
|---|---|---|---|
| `CONFIG_ZMK_USB_INIT_PRIORITY` default | 50 | 94 | 96 |
| `CONFIG_ZMK_DISPLAY_DEDICATED_THREAD_STACK_SIZE` default | 2048 | 2048 (no discrepancy) | 3072 |
| `CONFIG_ZMK_STUDIO_LOCK_IDLE_TIMEOUT_SEC` default | 500 | 600 | 600 |
| `CONFIG_ZMK_STUDIO_RPC_THREAD_STACK_SIZE` default | 1800 | 4096 | 4096 |
| `CONFIG_ZMK_KSCAN_INIT_PRIORITY` | listed, default 40 | symbol does not exist; drivers use Zephyr `CONFIG_KSCAN_INIT_PRIORITY` | same |
| `CONFIG_EC11` default | n | `default y` when an enabled `alps,ec11` DT node exists | same |
| `CONFIG_BT_MAX_CONN` / `BT_MAX_PAIRED` default | 5 | 5 non-split; 6 split central; 1 split peripheral | same |
| `CONFIG_ZMK_KSCAN_MATRIX_WAIT_BETWEEN_OUTPUTS` default | 0 | 0, but 1 on RP2040 | 0, but 1 on RP2040/RP2350 |
| `CONFIG_ZMK_STUDIO` | not in config/studio.md tables | exists (`app/src/studio/Kconfig`), documented on features/studio | same |

## 19. main-only differences (main @ `5b51501` vs v0.3.0, affecting generated `.conf`)

All **main only (not in v0.3.0)**:

- `CONFIG_WS2812_STRIP=y` no longer needed for underglow (Zephyr 4.1 enables LED strip drivers from DT). v0.3.0 still requires it (§11).
- Added ZMK symbols: `ZMK_BOARD_COMPAT`, all `ZMK_DBL_TAP_BOOTLOADER*`, `ZMK_BOOT_STM32_ENFORCE_NBOOT_SEL`, `ZMK_BOOTMODE_*`, `ZMK_INDICATOR_LEDS*`, `ZMK_INPUT_SPLIT_MSG_QUEUE_SIZE`, `ZMK_INPUT_SPLIT_MAX_TRACKED_KEYS`, `ZMK_STUDIO_TRANSPORT_UART_RX_PRIORITY`, `ZMK_TEST_BEHAVIORS` (tests). No `ZMK_*` symbol was removed or renamed.
- Changed ZMK defaults: `ZMK_USB_INIT_PRIORITY` 94 → 96, `ZMK_DISPLAY_DEDICATED_THREAD_STACK_SIZE` 2048 → 3072, `SYSTEM_WORKQUEUE_STACK_SIZE` (v0.3.0: 2048 if RP2040 or ZMK_BLE; main: 3072 if ZMK_DISPLAY else 2048), RP2350 added to `ZMK_KSCAN_MATRIX_WAIT_BETWEEN_OUTPUTS=1`.
- Zephyr-symbol overrides ZMK sets that differ (not user-facing; listed so a v0.3.0 `.conf` never uses main names): v0.3.0 `BT_DIS_MODEL` / `BT_DIS_MANUF` → main `BT_DIS_MODEL_NUMBER_STR` / `BT_DIS_MANUF_NAME_STR`; v0.3.0 `BT_L2CAP_TX_BUF_COUNT` (5 on split central) → main `BT_ATT_TX_COUNT` (10); v0.3.0 only: `BT_TINYCRYPT_ECC`, `LV_MEM_CUSTOM`; main only: `USB_DEVICE_INITIALIZE_AT_BOOT`, `NRF_SOC_VALIDATE_HEADERS_DISABLED`.
- Doc reorganisation: settings options moved from System to `config/settings.md`; new `config/bootloader.md`, `config/led-indicators.md`; hardware-integration pages moved from `docs/development/hardware-integration/` to `docs/hardware-integration/`.

Method: `comm` of `config`/`menuconfig` symbol sets from all `app/**/Kconfig*` (excluding `app/boards/`, `app/module/boards/`) and `diff -u` of the common files between tag `v0.3.0` (edf5c08) and main (5b51501); `diff -r` of `docs/docs/`.
