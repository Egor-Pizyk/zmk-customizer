# Shield files and zmk-config repository layout

Target: ZMK **v0.3.0** @ `edf5c08` (docs/decisions/0010-target-zmk-v0-3.md). Verified 2026-09-27 at v0.3.0 and `main` @ `5b51501` (reference for v0.4); official templates `zmkfirmware/unified-zmk-config-template` @ `09fce00` and `zmkfirmware/zmk-cli` @ `db5a225` (its `zmk keyboard new` templates are the closest thing to an official generator). See [README](README.md#pinned-version).

All file names are case sensitive. `<name>` below = shield id (e.g. `my_kb`); split parts are `<name>_left`, `<name>_right`.

## 1. Where shield files go

ZMK searches shields in (docs `config/index#shield-folder`, same list at v0.3.0 and main):

1. `zmk/app/boards/shields/<shield>` (in-tree)
2. `zmk-config/boards/shields/<shield>` — **recommended**; requires `zmk-config/zephyr/module.yml` (the repo is a Zephyr module)
3. `<module>/boards/shields/<shield>`
4. `zmk-config/config/boards/shields/<shield>` — **"For backwards compatibility only, do not use."** Still works on main and v0.3.0: `modules.cmake` adds `${ZMK_CONFIG}` as `BOARD_ROOT` if `${ZMK_CONFIG}/boards` exists.

How (2) works: the reusable GitHub workflow passes `-DZMK_EXTRA_MODULES='${GITHUB_WORKSPACE}'` when `zephyr/module.yml` exists (verified in `build-user-config.yml` at v0.3.0 and main), and `module.yml` sets `board_root: .`. (4) at v0.3.0: `app/keymap-module/modules/modules.cmake` adds `${ZMK_CONFIG}` as `BOARD_ROOT` with a `DEPRECATION` message.

→ Generator target: layout (2), identical to `unified-zmk-config-template` @ `09fce00`, which pins v0.3 and has exactly: `.github/workflows/build.yml` (`@v0.3`), `build.yaml` (comments only), `config/west.yml` (`revision: v0.3`), `zephyr/module.yml` (`board_root: .`), `boards/shields/.gitkeep`. Same as what `zmk init` / `zmk keyboard new` write.

## 2. Full zip layout (unified zmk-config)

```
zmk-config/
├── .github/workflows/build.yml          # required for GitHub Actions
├── build.yaml                           # required: build matrix
├── zephyr/module.yml                    # required for boards/ at repo root
├── config/
│   ├── west.yml                         # required: pins ZMK version
│   ├── <name>.keymap                    # optional user keymap (overrides shield keymap)
│   └── <name>.conf                      # optional user Kconfig (shared by all split parts)
└── boards/shields/<name>/
    ├── Kconfig.shield                   # REQUIRED
    ├── Kconfig.defconfig                # REQUIRED
    ├── <name>.overlay                   # REQUIRED (unibody)
    │   ─ or, split ─
    ├── <name>.dtsi                      # convention: shared kscan/transform/layout
    ├── <name>_left.overlay              # REQUIRED (split), one per part
    ├── <name>_right.overlay
    ├── <name>-layouts.dtsi              # optional/convention: physical layouts (+ position map)
    ├── <name>.keymap                    # default keymap (docs: "Each keyboard should provide")
    ├── <name>.conf                      # optional; see §6 (not applied from shield dir for splits)
    ├── <name>_left.conf / _right.conf   # optional per-part Kconfig (applied)
    ├── <name>.zmk.yml                   # metadata; required for in-tree, recommended
    └── boards/<board>.overlay           # optional board-specific overlay, v0.3.0 name = board id, e.g. nice_nano_v2.overlay (see boards.md §6)
```

Files ZMK/Zephyr actually require to build a shield: `Kconfig.shield`, `Kconfig.defconfig` (docs: "two required Kconfig files"), one `.overlay` per shield name, and a keymap somewhere (shield dir or `config/`); missing keymap → CMake warning "Failed to locate keymap file!" and the build errors. `.zmk.yml` is not read by the build (used by tooling / `west metadata check` / zmk-cli / website).

### `zephyr/module.yml`

```yaml
build:
  settings:
    board_root: .
```

### `config/west.yml`

```yaml
manifest:
  defaults:
    revision: v0.3          # what we generate (template value). main target: main
  remotes:
    - name: zmkfirmware
      url-base: https://github.com/zmkfirmware
  projects:
    - name: zmk
      remote: zmkfirmware
      import: app/west.yml
  self:
    path: config
```

`v0.3` is a tag (annotated, peels to `edf5c08` = `v0.3.0`); no branch of that name exists, so west checks out the release commit. A separate branch `v0.3-branch` exists (docs-only commits on top of `edf5c08`, used to publish https://v0-3-branch.zmk.dev) — do not use it as revision.

### `.github/workflows/build.yml`

```yaml
name: Build ZMK firmware
on: [push, pull_request, workflow_dispatch]

jobs:
  build:
    uses: zmkfirmware/zmk/.github/workflows/build-user-config.yml@v0.3   # keep in sync with west.yml revision
```

Workflow inputs (all optional): `build_matrix_path` (default `build.yaml`), `config_path` (default `config`), `fallback_binary` (default `bin`), `archive_name` (default `firmware`).

### `build.yaml`

Parsed with `yq` into a GitHub Actions matrix. Top-level `board: [...]` × `shield: [...]` cross product, and/or `include:` list. Per-entry keys read by the workflow (same at v0.3.0 and main): `board` (required), `shield` (space-separated list allowed, applied left→right), `snippet`, `cmake-args`, `artifact-name` (default v0.3.0 `<shield>-<board>-zmk`; main `<shield>-<board with / → _>-zmk`).

```yaml
# v0.3.0 (HWMv1 board ids) — what we generate
include:
  - board: nice_nano_v2
    shield: my_kb_left
    snippet: studio-rpc-usb-uart          # optional, ZMK Studio (central only)
    cmake-args: -DCONFIG_ZMK_STUDIO=y
  - board: nice_nano_v2
    shield: my_kb_right
  - board: nice_nano_v2
    shield: settings_reset                # optional: clears bonds
```

Board id differs by ZMK version: v0.3.0 `nice_nano_v2` (note: `nice_nano` = v1 on v0.3.0), main `nice_nano//zmk` (**main only (not in v0.3.0)**). Full table: [boards.md](boards.md#3-common-controller-boards). main's workflow also errors when a board with a ZMK variant is built without it and warns on an empty matrix (**main only (not in v0.3.0)**). `settings_reset` shield exists at v0.3.0.

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/config/index.md (rendered: https://v0-3-branch.zmk.dev/docs/config#shield-folder) · https://zmk.dev/docs/config#shield-folder · https://zmk.dev/docs/customization#building-additional-keyboards · https://zmk.dev/docs/features/studio#github-actions · https://github.com/zmkfirmware/unified-zmk-config-template/tree/09fce009cdf2f38fc3ae786e24c95b22cf78c79a · https://github.com/zmkfirmware/zmk/blob/v0.3.0/.github/workflows/build-user-config.yml · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/keymap-module/modules/modules.cmake · https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/boards/shields/settings_reset · https://github.com/zmkfirmware/zmk/blob/main/.github/workflows/build-user-config.yml · https://zmk.dev/blog/2025/06/20/pinned-zmk

## 3. `Kconfig.shield` (unchanged by HWMv2)

```kconfig
# unibody — no whitespace after the comma or in the name
config SHIELD_MY_KB
    def_bool $(shields_list_contains,my_kb)
```

```kconfig
# split — one symbol per part
config SHIELD_MY_KB_LEFT
    def_bool $(shields_list_contains,my_kb_left)

config SHIELD_MY_KB_RIGHT
    def_bool $(shields_list_contains,my_kb_right)
```

Symbol = `SHIELD_` + id uppercased. Identical syntax in v0.3.0 and main (fixtures diff clean); the HWMv2 blog: "Shields do not need any changes".

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/development/hardware-integration/new-shield.mdx (v0.3.0 path; zmk.dev: https://zmk.dev/docs/hardware-integration/new-shield#kconfigshield) · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/shields/corne/Kconfig.shield

## 4. `Kconfig.defconfig`

Always wrap in `if SHIELD_… endif`. Sets **defaults** (user `.conf` can still override).

```kconfig
# unibody
if SHIELD_MY_KB

config ZMK_KEYBOARD_NAME
    default "My Keyboard"

endif
```

```kconfig
# split (2 parts): name + central role only on the central (left)
if SHIELD_MY_KB_LEFT

config ZMK_KEYBOARD_NAME
    default "My Keyboard"

config ZMK_SPLIT_ROLE_CENTRAL
    default y

endif

if SHIELD_MY_KB_LEFT || SHIELD_MY_KB_RIGHT

config ZMK_SPLIT
    default y

endif
```

3+ parts (central section additionally):

```kconfig
config ZMK_SPLIT_BLE_CENTRAL_PERIPHERALS
    default 2          # number of peripherals (default 1)

config BT_MAX_CONN
    default 7          # peripherals + BT profiles (5)

config BT_MAX_PAIRED
    default 7          # same as BT_MAX_CONN
```

Hardware-driven defaults also go here (corne: `if ZMK_DISPLAY` → `config I2C default y`, `config SSD1306 default y`; LVGL settings; v0.3.0 underglow: `if ZMK_RGB_UNDERGLOW` → `config WS2812_STRIP default y`, see [kconfig-options.md §11](kconfig-options.md#11-rgb-underglow)). Peripheral part gets no `ZMK_KEYBOARD_NAME`.

Sources: https://zmk.dev/docs/hardware-integration/new-shield#kconfigdefconfig · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/shields/corne/Kconfig.defconfig

## 5. Overlays / dtsi

Unibody `<name>.overlay` contains: includes, `chosen`, kscan, matrix transform, physical layout (or `#include "<name>-layouts.dtsi"`).

Split: shared parts in `<name>.dtsi`; each `<name>_<part>.overlay` does `#include "<name>.dtsi"` then overrides per-part GPIOs; peripherals set `col-offset` on every transform.

```dts
// my_kb.overlay (unibody, complete)
#include <dt-bindings/zmk/matrix_transform.h>
#include <physical_layouts.dtsi>

/ {
    chosen {
        zmk,kscan = &kscan0;
        zmk,physical-layout = &default_layout;
    };

    kscan0: kscan0 {
        compatible = "zmk,kscan-gpio-matrix";
        diode-direction = "col2row";
        wakeup-source;
        col-gpios
            = <&pro_micro 4 GPIO_ACTIVE_HIGH>
            , <&pro_micro 5 GPIO_ACTIVE_HIGH>
            ;
        row-gpios
            = <&pro_micro 6 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
            , <&pro_micro 7 (GPIO_ACTIVE_HIGH | GPIO_PULL_DOWN)>
            ;
    };

    default_transform: default_transform {
        compatible = "zmk,matrix-transform";
        rows = <2>;
        columns = <2>;
        map = <
            RC(0,0) RC(0,1)
            RC(1,0) RC(1,1)
        >;
    };

    default_layout: default_layout {
        compatible = "zmk,physical-layout";
        display-name = "Default Layout";
        transform = <&default_transform>;
        keys
            = <&key_physical_attrs 100 100   0   0 0 0 0>
            , <&key_physical_attrs 100 100 100   0 0 0 0>
            , <&key_physical_attrs 100 100   0 100 0 0 0>
            , <&key_physical_attrs 100 100 100 100 0 0 0>
            ;
    };
};
```

```dts
// my_kb_right.overlay (split peripheral)
#include "my_kb.dtsi"

&default_transform {
    col-offset = <3>;
};

&kscan0 {
    col-gpios
        = <&pro_micro 10 GPIO_ACTIVE_HIGH>
        , <&pro_micro 9 GPIO_ACTIVE_HIGH>
        , <&pro_micro 8 GPIO_ACTIVE_HIGH>
        ;
};
```

Note: the new-shield split example (v0.3.0 and main) uses `&pro_micro 11` and `&pro_micro 13`, which do not exist in any in-tree pro_micro `gpio-map` (valid N: 0–10, 14–16, 18–21) — do not copy. See [boards.md](boards.md).

Wired split (experimental) additionally needs in the shared dtsi:

```dts
/ { wired_split { compatible = "zmk,wired-split"; device = <&pro_micro_serial>; }; };
```

(optional props: `detect-gpios`, `half-duplex`, `dir-gpios`; see `app/dts/bindings/zmk,wired-split.yaml`, identical at v0.3.0 and main). Wireless split needs nothing in DT.

Details: [kscan.md](kscan.md), [matrix-transform.md](matrix-transform.md), [physical-layout.md](physical-layout.md).

Sources: https://zmk.dev/docs/hardware-integration/new-shield#shield-overlays · https://zmk.dev/docs/hardware-integration/new-shield#wired-split · https://zmk.dev/docs/config/split#wired-split · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/zmk%2Cwired-split.yaml · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/shields/corne/corne_right.overlay

## 6. `.conf` and `.keymap` resolution (what is actually applied)

From `app/keymap-module/modules/modules.cmake` at v0.3.0 (main moved the same logic to `app/boards/post_boards_shields.cmake`; candidate lists identical):

- **Candidate names** for shield `my_kb_left`: shield dir name (`my_kb`), then the shield name with `_`-separated suffixes popped (`my_kb`), then `my_kb_left` itself.
- **Keymap**: first existing `<dir>/<candidate>.keymap`, searching `ZMK_CONFIG` (`config/`) **first**, then shield dir(s), then board dir. So `config/my_kb.keymap` overrides `boards/shields/my_kb/my_kb.keymap`, and one `my_kb.keymap` serves both halves.
- **User Kconfig** from `config/` (all existing are merged): `<dirname>_<BOARD>.conf`, `<dirname>.conf`, `<shield>_<BOARD>.conf`, `<shield>.conf`, then board-level and `default.conf`.
- **Shield dir `.conf`**: Zephyr applies `<shield>.conf` of the exact shield name (`my_kb_left.conf`). The shared `my_kb.conf` in a **split** shield dir is **not** applied at build time (docs: "Shared config files … are not currently supported in shield folders"; new-shield note: shared conf only applies at `config/my_keyboard.conf`). In-tree shields ship it as commented suggestions that `zmk keyboard add` copies into `config/`. For unibody, `my_kb.conf` = exact shield name → applied.
- Options set in a shield `.conf` cannot be changed by users (docs warning). Prefer `Kconfig.defconfig` defaults for shield hardware; put user choices in `config/<name>.conf`.

→ Generator: user settings → `config/<name>.conf`; shield hardware defaults → `Kconfig.defconfig`; keymap → `config/<name>.keymap` (and/or shield `<name>.keymap` as default).

Sources: https://zmk.dev/docs/config#config-file-locations · https://zmk.dev/docs/hardware-integration/new-shield#user-configuration-files · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/keymap-module/modules/modules.cmake · https://github.com/zmkfirmware/zmk/blob/main/app/boards/post_boards_shields.cmake · https://github.com/zmkfirmware/zmk-cli/blob/main/zmk/templates/common/default.conf

## 7. `<name>.zmk.yml` (metadata, file_format "1")

File named after the id **without** `_left`/`_right`. JSON Schema: `schema/hardware-metadata.schema.json`, `additionalProperties: false`.

Shield object — required: `file_format` (`"1"`, string), `id`, `name`, `url` (URI), `type` (`shield`), `requires` (array ≥1 of interconnect ids, e.g. `pro_micro`, `seeed_xiao`). Optional: `description`, `manufacturer`, `version`, `features`, `variants`, `siblings`, `exposes`.

- `id` pattern: v0.3.0 `^[a-z0-9_]+(@([A-Z]|[0-9]+|([0-9]+(\.[0-9]+){1,2})))?$`; main allows `/` too (`^[a-z0-9_/]+…`, for board ids) — **main only (not in v0.3.0)**. Only difference in the schema.
- `features` enum: `keys`, `display`, `encoder`, `underglow`, `backlight`, `pointer`, `studio`
- `siblings`: full ids of parts, e.g. `[my_kb_left, my_kb_right]`
- `exposes`: interconnects the shield provides (corne: `i2c_oled`)

```yaml
file_format: "1"
id: my_kb
name: My Keyboard
type: shield
url: https://example.com/my_kb
requires: [pro_micro]
features:
  - keys
  - studio
siblings:
  - my_kb_left
  - my_kb_right
```

Sources: https://zmk.dev/docs/hardware-integration/hardware-metadata-files · https://github.com/zmkfirmware/zmk/blob/v0.3.0/schema/hardware-metadata.schema.json

## 8. Naming constraints

| Item | Rule | Source |
|---|---|---|
| Shield id | lowercase letters, digits, `_`; must not start with a digit (`[a-z_]\w*` in zmk-cli; its error text says lowercase only). No whitespace. Split parts = `<id>_left`/`<id>_right` (convention). | zmk-cli `keyboard/new.py`; new-shield Kconfig.shield comment |
| Kconfig symbol | `SHIELD_<ID uppercased>`; must match between `Kconfig.shield` and `Kconfig.defconfig` | new-shield |
| Collisions | do not reuse an in-tree shield id (`app/boards/shields/*`, e.g. `corne`, `lily58`, `reviung41`, `settings_reset`, `nice_view`) | inference: Zephyr resolves shields by name over all board roots |
| `ZMK_KEYBOARD_NAME` | **≤ 16 bytes** (same `BUILD_ASSERT` and `BT_DEVICE_NAME_MAX` default at v0.3.0) (build fails otherwise: `BUILD_ASSERT(DEVICE_NAME_LEN <= CONFIG_BT_DEVICE_NAME_MAX)`, `BT_DEVICE_NAME_MAX` default 16 in ZMK). Docs are inconsistent: new-shield says "less than 16 characters", config/system says "max 16 characters"; source = ≤16 bytes (UTF-8 bytes, not chars). zmk-cli also enforces ≤16. Also used as USB product string. | `app/src/ble.c`, `app/Kconfig` |
| DT labels / node names | `[a-z0-9_]` for labels generated by us (DT allows more, keep it simple) | Zephyr DT spec |
| `.zmk.yml` id | schema pattern above | schema |

Sources: https://github.com/zmkfirmware/zmk-cli/blob/main/zmk/commands/keyboard/new.py · https://github.com/zmkfirmware/zmk/blob/main/app/src/ble.c · https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig · https://zmk.dev/docs/config/system#general

## 9. Version differences that affect shield output

| | v0.3.0 (target, Zephyr 3.5, HWMv1) | main (Zephyr 4.1, HWMv2) — main only (not in v0.3.0) |
|---|---|---|
| `Kconfig.shield`, `Kconfig.defconfig`, overlays, keymap syntax | same | same |
| `build.yaml` board ids | `nice_nano_v2`, `seeeduino_xiao_ble` | `nice_nano//zmk`, `xiao_ble//zmk` |
| shield `boards/` overlay names | `boards/nice_nano_v2.overlay` (+ `boards/nice_nano.overlay` for v1) | `boards/nice_nano_nrf52840_zmk.overlay` |
| `CONFIG_WS2812_STRIP=y` for underglow | **required** (`.conf` or `Kconfig.defconfig`) | removed — do not emit |
| `config/west.yml` / workflow ref | `v0.3` | `main` |
| `.zmk.yml` id pattern | no `/` | `/` allowed |
| layer `display-name` in in-tree keymaps | absent (property itself is valid in v0.3.0) | present |
| layer behaviors `locking`, reset `bootloader` | invalid properties | available ([behaviors.md §7](behaviors.md#7-main-only-differences-main--5b51501-vs-v030-relevant-to-generators)) |

Sources: `tests/fixtures/upstream/*/SOURCE.md` · https://github.com/zmkfirmware/zmk/compare/v0.3.0...main · https://zmk.dev/blog/2025/12/09/zephyr-4-1#board-revisions · https://zmk.dev/blog/2025/12/09/zephyr-4-1#led-strip-kconfig-changes

## 10. Prior art

"Shield Wizard for ZMK" (https://shield-wizard.genteure.com, MIT, https://github.com/Genteure/zmk-wizard) — browser tool generating zmk-config repos for custom shields (matrix/direct/charlieplex, splits up to 5 parts, pinned to v0.3), featured on the ZMK blog 2026-07-17. Useful to cross-check generated output.

Sources: https://zmk.dev/blog/2026/07/17/shield-wizard
