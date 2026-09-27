# Physical layout — `zmk,physical-layout`

Target: ZMK **v0.3.0** (`edf5c08`). Verified 2026-09-27 at v0.3.0 and `main` @ `5b51501`: `zmk,key-physical-attrs.yaml`, `zmk,physical-layout-position-map.yaml`, `physical_layouts.dtsi`, `CONFIG_ZMK_PHYSICAL_LAYOUT_KEY_ROTATION` and the Studio `BUILD_ASSERT`s are identical; `zmk,physical-layout.yaml` differs only by the main-only `input` property. `chosen zmk,physical-layout` is available and used by in-tree corne/reviung41 at v0.3.0 (fixtures). v0.3.0 docs source: https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/development/hardware-integration/physical-layouts.md (same content as zmk.dev). See [README](README.md#pinned-version).

A physical layout ties together one matrix transform, optionally one kscan, and optionally per-key geometry (`keys`). The **chosen** physical layout is what the firmware uses. `keys` is required for ZMK Studio.

## Properties (`app/dts/bindings/zmk,physical-layout.yaml`)

| Property | Type | Required | Meaning |
|---|---|---|---|
| `display-name` | string | **yes** (YAML `required: true`) | name shown in ZMK Studio / UIs |
| `transform` | phandle | **yes** | `&default_transform` |
| `kscan` | phandle | no | falls back to `chosen zmk,kscan` if omitted. v0.3.0: one of the two must exist (`DEVICE_DT_GET` unconditional); main also accepts `input` instead |
| `input` | phandle | no | **main only (not in v0.3.0)**; matrix-input API, falls back to `chosen zmk,matrix-input`. Do not generate (see [kscan.md](kscan.md#other-not-for-generators)) |
| `keys` | phandle-array | no (yes for Studio) | one `<&key_physical_attrs w h x y r rx ry>` per key position |

Docs table (`config/layout`) omits `required` markers; the YAML marks `display-name` and `transform` required.

## `keys` entry: `<&key_physical_attrs w h x y r rx ry>`

`&key_physical_attrs` is defined in `<physical_layouts.dtsi>` (`compatible = "zmk,key-physical-attrs"`, `#key-cells = <7>`); the include is mandatory when `keys` is used.

| Cell | Meaning | Unit | Type |
|---|---|---|---|
| `w` | keycap width | centi-keyunit (1u = `100`) | int > 0 |
| `h` | keycap height | centi-keyunit | int > 0 |
| `x` | X of key **top-left** corner | centi-keyunit | uint (docs) |
| `y` | Y of key top-left corner (Y grows downward) | centi-keyunit | uint (docs) |
| `r` | rotation, **positive = clockwise** | centi-degree (`1500` = 15°) | int |
| `rx` | rotation origin X (absolute, same frame as x) | centi-keyunit | int |
| `ry` | rotation origin Y | centi-keyunit | int |

- Negative values must be parenthesised: `(-700)`, `(-3000)` (= 30° counter-clockwise).
- Firmware stores every cell as `int16_t` (`app/src/physical_layouts.c`) → valid range −32768…32767 (≈ ±327u / ±327°).
- Conversion from our domain (`u`, degrees, floats): `cell = Math.round(value * 100)`. 1u = 19.05 mm is a UI concern only; ZMK has no mm unit.
- Upstream convention (KLE/QMK-like): `rx`/`ry` absolute; `r=0` keys use `0 0` for `rx ry`.
- Rotation data kept only if `CONFIG_ZMK_PHYSICAL_LAYOUT_KEY_ROTATION=y` (bool, default y).
- Order of `keys` = key-position order = `map` order of the transform = keymap `bindings` order. Count should equal the transform's `map` length (docs requirement; not build-asserted in source).

```dts
#include <physical_layouts.dtsi>

/ {
    default_layout: default_layout {
        compatible = "zmk,physical-layout";
        display-name = "Default Layout";
        transform = <&default_transform>;
        kscan = <&kscan0>;
        keys  //                     w   h    x    y     rot    rx    ry
            = <&key_physical_attrs 100 100    0    0       0     0     0>
            , <&key_physical_attrs 100 100  100    0       0     0     0>
            , <&key_physical_attrs 150 100    0  100       0     0     0>
            , <&key_physical_attrs 100 100  700   38  (-700)   900   338>
            ;
    };
};
```

## Chosen node and file placement

```dts
/ {
    chosen {
        zmk,kscan = &kscan0;                     // optional if every layout sets kscan
        zmk,physical-layout = &default_layout;   // required default
    };
};
```

- Convention: layouts (and position map) in `<name>-layouts.dtsi`, `#include "<name>-layouts.dtsi"` from `<name>.overlay` (unibody) or `<name>.dtsi` (split). Chosen goes in the same file as the layouts are included from.
- Official zmk-cli template does exactly this: `<id>-layouts.dtsi` with `default_layout`, `chosen { zmk,physical-layout = &default_layout; }` in overlay/dtsi.
- Upstream in-tree shields often use shared layouts: `#include <layouts/foostan/corne/6column.dtsi>` then `&foostan_corne_6col_layout { transform = <&default_transform>; };` (see fixtures).
- Do **not** also set `chosen zmk,matrix-transform`: if present, physical layouts are ignored and Studio builds fail (`BUILD_ASSERT`, `app/src/physical_layouts.c`).
- Fallback logic in source, in order: physical layouts (if any enabled and no chosen transform) → chosen `zmk,matrix-transform` → chosen `zmk,kscan` with synthetic transform (rows×cols) → build error.

## Multiple layouts

Define one `zmk,physical-layout` per variant (e.g. 6-col vs 5-col corne), each with its own transform (and kscan if needed). Users switch by overriding `chosen zmk,physical-layout` in their `.keymap`, or at runtime via ZMK Studio. Keymap length = largest `map` among enabled layouts.

## Position map — `zmk,physical-layout-position-map` (only needed with ≥2 layouts, for Studio)

Tells Studio how to carry bindings across layouts. Only one such node is read (`DT_INST(0, …)`).

| Where | Property | Type | Meaning |
|---|---|---|---|
| parent | `complete` | boolean | map fully specifies correspondence; no auto x/y matching |
| child (one per layout) | `physical-layout` | phandle | layout this row belongs to |
| child | `positions` | array | key indices; entry `k` in every child corresponds across layouts |

All children must have the same `positions` length (`BUILD_ASSERT`). Without a position map, Studio matches keys with identical physical attributes.

```dts
/ {
    position_map {
        compatible = "zmk,physical-layout-position-map";
        complete;
        full_map: full   { physical-layout = <&layout_full>;   positions = <0 1 2 3>; };
        small_map: small { physical-layout = <&layout_small>;  positions = <0 1 2 3>; };
    };
};
```

Detailed procedure (reference layout, counting missing keys backward): https://zmk.dev/docs/hardware-integration/physical-layouts#writing-a-position-map

## ZMK Studio requirements (summary)

- Chosen `zmk,physical-layout` with `keys` on every layout; no chosen `zmk,matrix-transform`.
- Build: `snippet: studio-rpc-usb-uart` + `CONFIG_ZMK_STUDIO=y` (central only for splits).
- Keymap must contain `&studio_unlock` somewhere (see [behaviors.md](behaviors.md)).
- Extra editable layers: empty layer nodes with `status = "reserved";`.
- `.zmk.yml` `features: [studio]` once tested.

Tools referenced by docs: https://zmk-physical-layout-converter.streamlit.app (QMK JSON → DT), https://nickcoutsos.github.io/keymap-layout-tools/ (KLE/KiCad → QMK JSON), https://zmk-layout-helper.netlify.app (position maps).

Sources: https://zmk.dev/docs/hardware-integration/physical-layouts · https://zmk.dev/docs/hardware-integration/physical-layouts#optional-keys-property · https://zmk.dev/docs/hardware-integration/physical-layouts#position-map · https://zmk.dev/docs/config/layout#physical-layout · https://zmk.dev/docs/config/layout#physical-layout-position-map · https://zmk.dev/docs/hardware-integration/new-shield#chosen-node · https://zmk.dev/docs/features/studio#building · https://zmk.dev/docs/features/studio#including-extra-layers · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/zmk%2Cphysical-layout.yaml · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/physical_layouts.c · https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Cphysical-layout.yaml · https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Ckey-physical-attrs.yaml · https://github.com/zmkfirmware/zmk/blob/main/app/dts/physical_layouts.dtsi · https://github.com/zmkfirmware/zmk/blob/main/app/src/physical_layouts.c · https://github.com/zmkfirmware/zmk-cli/blob/main/zmk/templates/common/layouts.dtsi
