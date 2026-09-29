# Keymap file (`<name>.keymap`)

Target: ZMK **v0.3.0** (`edf5c08`). Verified 2026-09-27 at v0.3.0 and `main` @ `5b51501` (reference for v0.4): `keys.h`, `modifiers.h`, `hid_usage*.h`, `behaviors.h`, `behaviors.dtsi`, `zmk,keymap.yaml`, `zmk,keymap-sensors.yaml` are identical; `dt-bindings` differ only by `OUT_NONE` in `outputs.h` and the new `hid_indicators.h` (**main only (not in v0.3.0)**). zmk.dev is built from `main`; differences marked inline.

## 1. File skeleton

```dts
#include <behaviors.dtsi>            // defines &kp, &mo, &lt, &mt, ... (app/dts/behaviors.dtsi)
#include <dt-bindings/zmk/keys.h>    // keycodes + modifier functions (includes modifiers.h, hid_usage*.h)
#include <dt-bindings/zmk/bt.h>      // only if &bt is used
#include <dt-bindings/zmk/outputs.h> // only if &out is used (OUT_NONE: main only)
#include <dt-bindings/zmk/rgb.h>     // only if &rgb_ug is used
#include <dt-bindings/zmk/backlight.h> // only if &bl is used
#include <dt-bindings/zmk/ext_power.h> // only if &ext_power is used
#include <dt-bindings/zmk/pointing.h>  // only if &mkp/&mmv/&msc are used (mouse.h is a deprecated alias that includes pointing.h)

#define BASE  0   // optional layer-name defines
#define LOWER 1

/ {
    behaviors { /* user-defined behaviors, see behaviors.md */ };
    macros    { /* user-defined macros, see combos-macros-layers.md */ };
    combos    { compatible = "zmk,combos"; /* ... */ };
    conditional_layers { compatible = "zmk,conditional-layers"; /* ... */ };

    keymap {
        compatible = "zmk,keymap";

        base_layer {                         // layer 0 (definition order = layer number)
            display-name = "Base";
            bindings = <
                &kp Q  &kp W  &mo LOWER
            >;
            sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>; // optional, one per sensor
        };

        lower_layer {                        // layer 1
            display-name = "Lower";
            bindings = <
                &kp N1 &trans &none
            >;
        };

        extra1 { status = "reserved"; };     // Studio-only spare layer (see §5)
    };
};
```

Rules:
- Everything except `#include`/`#define` lives inside the root node `/ { ... };`.
- Keymap node name is free; `compatible = "zmk,keymap"` is mandatory.
- Layer child-node names are free (must be valid DT node names: `[a-z0-9_,.+-]`, conventionally `snake_case`). Layer index = order of definition, starting at 0. Layer 0 is always active.
- Priority: highest-numbered active layer wins; activation order is irrelevant.
- `behaviors`, `macros`, `combos`, `conditional_layers` node names are conventional; what matters is the `compatible` of each child/container. Behavior and macro nodes may be placed under any node name; ZMK docs use `behaviors {}` / `macros {}`.
- Nodes that already exist (e.g. `&mt`, `&sk`, `&caps_word`) are modified with a top-level override outside `/ { }`: `&mt { tapping-term-ms = <180>; };`.

Sources: https://zmk.dev/docs/keymaps#keymap-file , https://zmk.dev/docs/keymaps#includes , https://zmk.dev/docs/keymaps#layers , https://github.com/zmkfirmware/zmk/blob/main/app/dts/behaviors.dtsi

## 2. Layer node properties (`zmk,keymap` children)

| Property | Type | Required | Meaning |
|---|---|---|---|
| `bindings` | phandle-array | yes | One binding per key position, in key-position order (= order of the matrix transform `map`, or kscan order if no transform). |
| `sensor-bindings` | phandle-array | no | One binding per sensor, in order of `zmk,keymap-sensors` `sensors`. |
| `display-name` | string | no | Name shown in ZMK Studio and display widgets. With `CONFIG_ZMK_KEYMAP_SETTINGS_STORAGE`, Studio-edited names are limited by `CONFIG_ZMK_KEYMAP_LAYER_NAME_MAX_LEN` (default 20). |
| `label` | string | no | **Deprecated**, use `display-name`. Do not generate. |
| `status` | string | no | Standard DT; `"reserved"` = layer ignored in normal builds, available as a spare layer in ZMK Studio builds. |

Invariant for generators: `len(bindings)` must equal the number of key positions (`n`). Mismatch is a build/runtime error.

Sources: https://zmk.dev/docs/config/keymap#keymap , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Ckeymap.yaml

## 3. Binding syntax

- A binding is `&<behavior-label>` followed by exactly `#binding-cells` parameters (0, 1 or 2). Multiple bindings are whitespace-separated inside one `< ... >`.
- Parameters are 32-bit cells: integers, `#define`d names, or C-preprocessor expressions. Expressions containing operators or unary minus must be parenthesised: `(-700)`, `(MOD_LSFT|MOD_LALT)`.
- Key position numbering: 0-based, left-to-right in the `bindings` list. Used by combos `key-positions` and hold-tap `hold-trigger-key-positions`.
- Line breaks/whitespace inside `< >` are insignificant; generators should lay out one physical row per line for readability (upstream convention).
- `&trans` = pass event to the next lower active layer. `&none` = swallow event.

Examples:
```dts
&kp A                 // 1 param
&kp LS(A)             // modifier function, see §4
&mt LSHIFT A          // 2 params (hold, tap)
&lt 1 SPACE           // 2 params (layer, tap keycode)
&bt BT_SEL 0          // BT_SEL expands to one cell; 2nd cell is the profile
&bt BT_CLR            // BT_CLR expands to two cells "0 0"
&rgb_ug RGB_COLOR_HSB(128,100,100)
&trans &none &caps_word   // 0 params
```

Sources: https://zmk.dev/docs/keymaps#behavior-bindings , https://zmk.dev/docs/keymaps/behaviors/misc

## 4. Keycodes and modifiers

### Canonical sources (generate the catalog from these; do not hand-copy)

In this repo (spec 004 research R2): `src/catalog/zmk/keys.h` is the verbatim v0.3.0 header, parsed at load by `src/catalog/parse-keys-header.ts`; categories and legends are our own (no `hid.js` / `groups.js`, CC-BY-NC-SA).

1. `app/include/dt-bindings/zmk/keys.h` — every keycode `#define`, aliases, deprecated markers. ~644 `#define`s, ~63 marked `// WARNING: DEPRECATED (DO NOT USE)`.
2. `docs/src/data/hid.js` (zmk repo, CC-BY-NC-SA-4.0; v0.3.0 and main differ only in a few descriptions and macOS support flags/footnotes) — the data behind https://zmk.dev/docs/keymaps/list-of-keycodes: per keycode `names[]` (all aliases, first = canonical), `description`, `context`, `usages[{application, item: usage(page,id)}]`, `documentation` (HID spec link), `os` support matrix `{windows, linux, android, macos, ios}` (true/false/null), `footnotes`. ~368 entries. Best source for a UI catalog (descriptions + OS compatibility). **License differs from firmware (MIT); check before bundling.**
3. `docs/src/data/groups.js` — maps doc table groups (`keyboard-letters`, `keyboard-numbers`, `keyboard-symbols`, `keyboard-control-whitespace`, `keyboard-navigation`, `keyboard-locks`, `keyboard-fkeys`, `keyboard-international`, `keyboard-language`, `keyboard-misc`, `modifiers`, `keypad-*`, `editing-*`, `media-*`, `consumer-*`, `application-*`, `input-assist`, `power-lock` …) to keycode names. Use for picker categories.
4. `app/include/dt-bindings/zmk/hid_usage.h` (HID_USAGE_<PAGE>_<NAME> ids) and `hid_usage_pages.h` (`HID_USAGE_KEY`=0x07, `HID_USAGE_CONSUMER`=0x0C, `HID_USAGE_GD`=0x01, …).

### keys.h structure
```c
#include <dt-bindings/zmk/hid_usage.h>
#include <dt-bindings/zmk/hid_usage_pages.h>
#include <dt-bindings/zmk/modifiers.h>

/* Keyboard Left Shift */                       // comment = description
#define LEFT_SHIFT (ZMK_HID_USAGE(HID_USAGE_KEY, HID_USAGE_KEY_KEYBOARD_LEFTSHIFT))  // canonical
#define LSHIFT (LEFT_SHIFT)                     // alias
#define LSHFT (LEFT_SHIFT)                      // alias
#define LSFT (LEFT_SHIFT) // WARNING: DEPRECATED (DO NOT USE)
#define DOLLAR (LS(NUMBER_4))                   // shifted symbol = modifier function applied
```
- Encoding: `ZMK_HID_USAGE(page, id) = (page << 16) | id`; implicit modifiers in bits 24–31 (`APPLY_MODS(mods, kc) = mods << 24 | kc`).
- Prefixes: `K_` = keyboard page variant, `C_` = consumer page variant (e.g. `K_MUTE` vs `C_MUTE`), `KP_` = keypad, `N0..N9` / `NUMBER_0..9` = number row.
- Catalog parse: per block, first `#define` after the `/* description */` comment is canonical; subsequent defines whose value is `(CANONICAL)` are aliases; skip lines containing `DEPRECATED`.

### Modifier functions (`modifiers.h`)
| Function | Mod bit | | Function | Mod bit |
|---|---|---|---|---|
| `LC(kc)` | `MOD_LCTL` 0x01 | | `RC(kc)` | `MOD_RCTL` 0x10 |
| `LS(kc)` | `MOD_LSFT` 0x02 | | `RS(kc)` | `MOD_RSFT` 0x20 |
| `LA(kc)` | `MOD_LALT` 0x04 | | `RA(kc)` | `MOD_RALT` 0x40 |
| `LG(kc)` | `MOD_LGUI` 0x08 | | `RG(kc)` | `MOD_RGUI` 0x80 |

- Nest to combine: `&kp LC(LS(T))`, `&kp LC(RA(B))`. Apply to a modifier for combined mod keys: `&kp LS(LALT)`.
- `MOD_*` constants (not keycodes) are what `mods`/`keep-mods` properties of mod-morph and caps-word take.
- Modifier keycodes (for `&kp`, `&mt` hold param, `&sk`): `LSHIFT/LSHFT/LEFT_SHIFT`, `LCTRL/LEFT_CONTROL`, `LALT/LEFT_ALT`, `LGUI/LEFT_GUI/LCMD/LWIN/LMETA`, and `R*` equivalents.
- Name collision (verified in headers, not covered by docs): `modifiers.h` defines `RC(keycode)` (1 arg = right-ctrl function) and `dt-bindings/zmk/matrix_transform.h` defines `RC(row, col)` (2 args = matrix cell). Whichever header is included last wins for the rest of the preprocessing unit. Upstream works because the matrix transform (overlay/dtsi) is expanded before the keymap includes `keys.h`. Generator rule: keep `RC(row,col)` only in the overlay/dtsi, never define matrix transforms inside the `.keymap`; to be safe, emit right-ctrl-wrapped keys as `RC(x)` only in the `.keymap`. Not verified by a build here.

Sources: https://zmk.dev/docs/keymaps/list-of-keycodes , https://zmk.dev/docs/keymaps/modifiers#modifier-functions , https://zmk.dev/docs/keymaps/behaviors/key-press#keycode-defines , https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/include/dt-bindings/zmk/keys.h , https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/include/dt-bindings/zmk/modifiers.h , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/hid_usage_pages.h , https://github.com/zmkfirmware/zmk/blob/main/docs/src/data/hid.js , https://github.com/zmkfirmware/zmk/blob/main/docs/src/data/groups.js

## 5. Sensors (encoders) in the keymap

The hardware side (usually in the shield overlay/dtsi) declares which sensors exist and their order:
```dts
/ {
    sensors: sensors {
        compatible = "zmk,keymap-sensors";
        sensors = <&left_encoder &right_encoder>;   // order = sensor-bindings order
        triggers-per-rotation = <20>;               // optional default for all sensors
    };
};
&left_encoder { status = "okay"; };   // in the .overlay of the half that has it, not in shared .dtsi
```
Each layer then binds one behavior per sensor. Built-in `&inc_dec_kp` (compatible `zmk,behavior-sensor-rotate-var`, `#sensor-binding-cells = <2>`, bindings `<&kp>, <&kp>`) takes CW and CCW keycodes:
```dts
sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN &inc_dec_kp PG_UP PG_DN>;
```
`&inc_dec_cp` is a **deprecated** alias of the same node; do not generate. Encoder push-buttons are ordinary matrix keys. Kconfig: `CONFIG_EC11=y`, `CONFIG_EC11_TRIGGER_GLOBAL_THREAD=y` (see kconfig-options.md). Custom rotate behaviors: behaviors.md §Sensor rotation.

Sources: https://zmk.dev/docs/features/encoders#rotation , https://zmk.dev/docs/hardware-integration/encoders , https://zmk.dev/docs/config/keymap#keymap-sensors , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Ckeymap-sensors.yaml , https://github.com/zmkfirmware/zmk/blob/main/app/dts/behaviors/sensor_rotate_key_press.dtsi

## 6. ZMK Studio specifics affecting the keymap

- `status = "reserved";` layers (no `bindings`) are ignored in normal builds and become editable spare layers in Studio builds.
- Studio builds (snippet `studio-rpc-usb-uart`) define `ZMK_BEHAVIORS_KEEP_ALL`, so all built-in behaviors with omit guards are compiled in. Fine control, placed **before** `#include <behaviors.dtsi>`:
  ```dts
  #define ZMK_BEHAVIORS_OMIT_KT          // drop &kt
  // or keep-only mode:
  #undef ZMK_BEHAVIORS_KEEP_ALL
  #define ZMK_BEHAVIORS_KEEP_SK
  #define ZMK_BEHAVIORS_KEEP_MT
  #include <behaviors.dtsi>
  ```
  Suffixes defined in source: `KP KT TRANS NONE MT LT GRESC SK STICKY_LAYER MO TOG TO CAPS_WORD KEY_REPEAT BL BT OUT SOFT_OFF MKP`. (Nodes without a guard — `&sys_reset`, `&bootloader`, `&rgb_ug`, `&ext_power`, `&studio_unlock` — are always present; `&mmv`, `&msc`, `&inc_dec_kp` are always `/omit-if-no-ref/`.)
- Studio needs a physical layout and **no** `chosen zmk,matrix-transform` (see physical-layout.md).

Sources: https://zmk.dev/docs/features/studio#including-extra-layers , https://zmk.dev/docs/features/studio#including-unreferenced-behaviors , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/behaviors.h

## 7. Upstream examples

- `tests/fixtures/upstream/corne/corne.keymap`, `tests/fixtures/upstream/reviung41/reviung41.keymap` (copied unchanged from v0.3.0; no `display-name` on layers — main added them, see fixture `SOURCE.md`).
- https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/boards/shields/corne/corne.keymap
