# ZMK reference (verified notes)

Ground truth for generators (`src/generators/`) and catalogs (`src/catalog/`). Every section ends with source links to the zmk.dev anchor or the GitHub file. When these notes and zmk.dev disagree, each page says so and names the source that the build actually uses (binding YAML, Kconfig, C).

## Pinned version

Verified 2026-09-27. **Target: ZMK v0.3.0** — decision in [docs/decisions/0010-target-zmk-v0-3.md](../decisions/0010-target-zmk-v0-3.md).

| Item | Value |
|---|---|
| **Target: ZMK `v0.3.0`** | tag commit `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (published 2025-08-01). Tags `v0.3` (annotated) and `v0.3.0` peel to the same commit; `config/west.yml` `revision: v0.3` and workflow `@v0.3` resolve to it. Branch `v0.3-branch` = same tree + docs-site commits only |
| Zephyr used by `v0.3.0` | `v3.5.0+zmk-fixes` (zmkfirmware/zephyr branch head `dacab4875df72109b96cc8977547a0dc04875bcd`), from `app/west.yml`. **HWMv1** board model (flat board ids, `app/boards/arm/<board>/`) |
| v0.3.0 docs | rendered at https://v0-3-branch.zmk.dev/docs/ (built from `v0.3-branch`); source https://github.com/zmkfirmware/zmk/tree/v0.3.0/docs/docs. Hardware-integration pages live under `docs/development/hardware-integration/` there |
| zmk.dev docs | built from `main`. All `https://zmk.dev/docs/...` links in these notes describe `main`; where v0.3.0 differs, pages link the file at the `v0.3.0` tag |
| Catalog `docsUrl` from a zmk.dev link | replace `https://zmk.dev/docs/` with `https://v0-3-branch.zmk.dev/docs/`; `docs/hardware-integration/…` becomes `docs/development/hardware-integration/…`. Check the anchor against the heading in `docs/docs/**` at `v0.3.0` before committing (docs/architecture.md → Catalog data) |
| ZMK `main` (reference for upcoming v0.4) | `5b51501fead672c41b5cfb396f3dafe0894bf4e9` (2026-09-26, "fix(split): Use our managed queue for input report to avoid deadlock (#3110)"), Zephyr `v4.1.0+zmk-fixes` (`10ba6d0cb38bc3d258775d27982f707599320085`), HWMv2. No `v0.4` tag yet |
| unified-zmk-config-template | `09fce009cdf2f38fc3ae786e24c95b22cf78c79a` (pins `revision: v0.3`, workflow `@v0.3`) |
| zmk-cli (templates) | `db5a225d8b49fa29dfb9965a6fda8c69ceff98e7` |

Marking convention in every page: v0.3.0 facts are primary and unmarked; anything that exists or differs only on main is marked **main only (not in v0.3.0)** or given as "v0.3.0 value; main value".

## Pages

| Page | Content |
|---|---|
| [shield-files.md](shield-files.md) | zmk-config/shield file set, required vs optional, Kconfig.shield/defconfig, split layout, `.zmk.yml`, `build.yaml`, `west.yml`, conf/keymap resolution, naming limits |
| [kscan.md](kscan.md) | gpio-matrix / direct / charlieplex / composite / demux, diode direction ↔ GPIO flags, debounce |
| [matrix-transform.md](matrix-transform.md) | `zmk,matrix-transform`, `RC()`, offsets, key index order, split |
| [physical-layout.md](physical-layout.md) | `zmk,physical-layout`, `key_physical_attrs` units, chosen, multiple layouts, position map, Studio requirements |
| [boards.md](boards.md) | controller boards, v0.3.0 (HWMv1) ids we generate + main (HWMv2) ids, `&pro_micro` / `&xiao_d` pin tables, board overlay names |
| [encoders.md](encoders.md) | EC11 pins/steps, per-sensor triggers, split activation, rotation bindings and driver defaults |
| [keymap.md](keymap.md) | keymap structure, includes, layers, bindings, keycodes source, modifiers, sensors |
| [behaviors.md](behaviors.md) | every built-in behavior + user-instantiable behavior properties |
| [combos-macros-layers.md](combos-macros-layers.md) | combos, macros, conditional layers |
| [kconfig-options.md](kconfig-options.md) | user-facing Kconfig inventory with types/defaults/anchors |

Golden fixtures: `tests/fixtures/upstream/{corne,reviung41,sofle}/` (byte-for-byte copies at `v0.3.0` = `edf5c08`, each with a `SOURCE.md` recording provenance; Corne/Reviung also list verified main-only differences) and `tests/fixtures/upstream/_shared-includes/` (the `app/dts` includes they use; identical on main).

## Glossary: ZMK term → our domain term

| ZMK / Zephyr term | Our domain (docs/domain-model.md) | Notes |
|---|---|---|
| shield | Shield / project keyboard | the generated keyboard; id `[a-z_][a-z0-9_]*` |
| board (controller) | controller board | e.g. `nice_nano_v2` (v0.3.0), `nice_nano//zmk` (main); we never generate boards |
| board target / board id / qualifiers / revision | board id string | v0.3.0: `name[@rev]`, e.g. `mikoto@6.1`; main: `name[@rev]/soc/variant`, e.g. `nice_nano@1//zmk` |
| interconnect / connector (`pro_micro`, `seeed_xiao`) | pin header of a controller | shield `.zmk.yml` `requires` |
| GPIO specifier `<&pro_micro 4 FLAGS>` | GPIO pin assignment | connector pin number, not MCU pin |
| kscan (driver/node) | Kscan / wiring type | `zmk,kscan-gpio-matrix` \| `-direct` \| `-charlieplex` |
| `diode-direction` | Diode direction | `col2row` \| `row2col` |
| row / column (kscan) | matrix cell `(row, col)` | = index into `row-gpios` / `col-gpios` |
| matrix transform, `map`, `RC(r,c)` | Matrix transform: key index → cell | |
| key position | Key index | 0-based order in `map` = `keys` = `bindings` |
| physical layout, `key_physical_attrs` | Physical layout, key geometry | centi-u, centi-degrees |
| central / peripheral | split halves (left = central by convention) | `ZMK_SPLIT_ROLE_CENTRAL` |
| `col-offset` / `row-offset` | per-half column/row offset | peripheral overlay |
| keymap, layer, bindings | Keymap, Layer, Binding | |
| behavior (instance, compatible, `#binding-cells`) | Behavior | built-in label like `&kp` or user node |
| combo | Combo | `key-positions` = key indices |
| macro | Macro | |
| conditional layer (`if-layers`, `then-layer`) | Conditional layer | |
| sensor, `sensor-bindings` | Encoder bindings | |
| Kconfig symbol (`CONFIG_ZMK_SLEEP`) | Kconfig option / setting | `.conf` or `Kconfig.defconfig` |
| snippet (`studio-rpc-usb-uart`) | build option | `build.yaml` `snippet:` |
| zmk-config | exported repository | zip root |

## How to re-verify (when bumping ZMK)

```sh
# 1. Versions
git ls-remote --tags https://github.com/zmkfirmware/zmk.git | grep -v '\^{}'
curl -s https://api.github.com/repos/zmkfirmware/zmk/releases/latest | grep -E '"(tag_name|published_at|target_commitish)"'
curl -s https://api.github.com/repos/zmkfirmware/zmk/commits/main | grep -m1 '"sha"'

# 2. Clone the pin (old) and the candidate (new), then diff what our notes depend on
git clone --depth 1 --branch v0.3.0 https://github.com/zmkfirmware/zmk.git zmk-old
git clone --depth 1 https://github.com/zmkfirmware/zmk.git zmk-new   # or --branch v0.4.0
grep -A3 'name: zephyr' zmk-new/app/west.yml
diff -r zmk-old/docs/docs zmk-new/docs/docs            # docs changes (zmk.dev source)
diff -r zmk-old/app/dts/bindings zmk-new/app/dts/bindings
diff -r zmk-old/app/module/dts/bindings zmk-new/app/module/dts/bindings
diff -r zmk-old/app/dts/behaviors zmk-new/app/dts/behaviors
diff -r zmk-old/app/include/dt-bindings zmk-new/app/include/dt-bindings
diff -r zmk-old/app/boards/shields/corne zmk-new/app/boards/shields/corne
(cd zmk-old && find app -name 'Kconfig*' -not -path '*/boards/*' | sort) > k-old  # then diff -u each common file
git -C zmk-new log -1 --format=%H
ls zmk-new/docs/blog | tail                            # migration posts (e.g. 2025-12-09-zephyr-4-1.md)

# 3. Kconfig types/defaults (source wins over docs tables)
grep -rn --include='Kconfig*' '^config ZMK_' zmk-new/app | wc -l

# 4. Refresh fixtures: curl raw.githubusercontent.com/zmkfirmware/zmk/<sha>/app/... for every file listed in SOURCE.md,
#    then `diff -r -x SOURCE.md` against the clone; update SHA and the main-only section
# 5. Update the "Pinned version" table, then catalog + fixtures in the same change (docs/architecture.md → Catalog data)
```

Link check used for these notes: every `https://zmk.dev/docs/...#anchor` was resolved against headings in `docs/docs/**` of the pinned commit (Docusaurus slug: lowercase, punctuation stripped, spaces → `-`, `{#id}` overrides). Every `github.com/zmkfirmware/zmk/blob/main/...` path was checked to exist at `5b51501`; every `blob/v0.3.0/...` path at `edf5c08`.

## main-only differences that affect generators (summary; all **main only (not in v0.3.0)**)

1. **Zephyr 4.1 / HWMv2 on main** (blog 2025-12-09): every in-tree board needs the `zmk` variant; revisions replace duplicate boards (`nice_nano_v2` → `nice_nano//zmk`, `nice_nano` v1 → `nice_nano@1//zmk`, `seeeduino_xiao_ble` → `xiao_ble//zmk`). Shields unchanged. v0.3.0 ids: [boards.md §3](boards.md#3-common-controller-boards).
2. **Board overlay names in shields** follow the normalized board target on main (`boards/nice_nano_nrf52840_zmk.overlay`); v0.3.0 uses the board id (`boards/nice_nano_v2.overlay`).
3. **`CONFIG_WS2812_STRIP` removed** on main; v0.3.0 **requires** it for underglow ([kconfig-options.md §11](kconfig-options.md#11-rgb-underglow)). NFC pins as GPIO: main uses DT `&uicr { nfct-pins-as-gpios; };` (blog); v0.3.0 (Zephyr 3.5) uses Kconfig `CONFIG_NFCT_PINS_AS_GPIOS=y` (blog: "Previously, using those pins required enabling `CONFIG_NFCT_PINS_AS_GPIOS=y`"); no in-tree v0.3.0 file uses it, not build-verified. `&bootloader` boot-retention on main.
4. Layer behaviors gained a `locking` property; the reset behavior gained a `bootloader` flag; `OUT_NONE`; LED indicators (`zmk,indicator-leds`); physical-layout `input` property ([behaviors.md §7](behaviors.md#7-main-only-differences-main--5b51501-vs-v030-relevant-to-generators), [kconfig-options.md §19](kconfig-options.md#19-main-only-differences-main--5b51501-vs-v030-affecting-generated-conf)).

Same in both (verified): physical layouts are the default mechanism (`chosen zmk,physical-layout`; `chosen zmk,matrix-transform` is legacy and breaks Studio builds); `config/boards/shields/` is legacy, recommended layout is `boards/shields/` at the zmk-config root with `zephyr/module.yml`; all kscan bindings incl. `zmk,kscan-composite`; `&pro_micro`/`&xiao_d` pin maps; Studio snippet `studio-rpc-usb-uart`.

Sources: https://github.com/zmkfirmware/zmk/releases/tag/v0.3.0 · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/west.yml · https://github.com/zmkfirmware/zmk/compare/v0.3.0...main · https://zmk.dev/blog/2025/12/09/zephyr-4-1 · https://zmk.dev/blog/2025/06/20/pinned-zmk · https://github.com/zmkfirmware/unified-zmk-config-template
