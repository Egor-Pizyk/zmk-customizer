# Behaviors

Target: ZMK **v0.3.0** (`edf5c0814fd3ea202e43aad2d68fd32e882a518c`). Verified 2026-09-27 by reading `app/dts/behaviors/*.dtsi` (instances), `app/dts/bindings/behaviors/*.yaml` (schemas), `app/src/behaviors/*.c` (C defaults), `app/CMakeLists.txt` / `app/Kconfig.behaviors` (build conditions) and the zmk.dev pages, at v0.3.0 and at `main` @ `5b51501` (reference for v0.4). Only differences are listed in §7 and marked inline; everything unmarked is identical in both. zmk.dev pages describe `main`; v0.3.0 docs source: https://github.com/zmkfirmware/zmk/tree/v0.3.0/docs/docs/keymaps/behaviors

Conventions:
- **Label** = what the keymap uses (`&kp`). **Node name** = DT node name (≤ 8 chars required for behaviors that may run on a split peripheral, i.e. locality ≠ central; see §6).
- **Cells** = `#binding-cells` (`#sensor-binding-cells` for sensor behaviors) = number of params in a binding.
- Every behavior node accepts `display-name` (string, from `behavior-metadata.yaml`; used by ZMK Studio). `label` is deprecated everywhere; do not generate it.
- Tweak a built-in: top-level override `&mt { tapping-term-ms = <180>; };`. Remove a boolean set by the built-in: `/delete-property/ ignore-modifiers;`.
- Custom instance: new node under `/ { behaviors { ... }; };` with a unique label + node name; the label must not collide with built-ins (copying the built-in definition verbatim overrides it).

Sources: https://zmk.dev/docs/keymaps/behaviors , https://zmk.dev/docs/config/behaviors , https://github.com/zmkfirmware/zmk/tree/main/app/dts/behaviors , https://github.com/zmkfirmware/zmk/tree/main/app/dts/bindings/behaviors

## 1. Built-in instance table

`behaviors.dtsi` includes all of these. "Needs" = Kconfig required for the driver to be compiled; if the driver is not compiled but the binding is used, the build fails (inferred from `CMakeLists.txt`; the docs state it only for pointing and soft-off). "Omit" = suffix for `ZMK_BEHAVIORS_KEEP_*/OMIT_*` (keymap.md §6); "—" = no guard.

| Label | Node name | Compatible | Cells | Params | Needs | Omit | Doc |
|---|---|---|---|---|---|---|---|
| `&kp` | `key_press` | `zmk,behavior-key-press` | 1 | keycode | — | KP | [key-press](https://zmk.dev/docs/keymaps/behaviors/key-press) |
| `&kt` | `key_toggle` | `zmk,behavior-key-toggle` | 1 | keycode | — | KT | [key-toggle](https://zmk.dev/docs/keymaps/behaviors/key-toggle) |
| `&trans` | `transparent` | `zmk,behavior-transparent` | 0 | — | — | TRANS | [misc#transparent](https://zmk.dev/docs/keymaps/behaviors/misc#transparent) |
| `&none` | `none` | `zmk,behavior-none` | 0 | — | — | NONE | [misc#none](https://zmk.dev/docs/keymaps/behaviors/misc#none) |
| `&mt` | `mod_tap` | `zmk,behavior-hold-tap` | 2 | hold keycode, tap keycode | — | MT | [hold-tap#mod-tap](https://zmk.dev/docs/keymaps/behaviors/hold-tap#mod-tap) |
| `&lt` | `layer_tap` | `zmk,behavior-hold-tap` | 2 | layer, tap keycode | — | LT | [hold-tap#layer-tap](https://zmk.dev/docs/keymaps/behaviors/hold-tap#layer-tap) |
| `&gresc` | `grave_escape` | `zmk,behavior-mod-morph` | 0 | — | — | GRESC | [mod-morph](https://zmk.dev/docs/keymaps/behaviors/mod-morph#behavior-binding) |
| `&sk` | `sticky_key` | `zmk,behavior-sticky-key` | 1 | keycode | — | SK | [sticky-key](https://zmk.dev/docs/keymaps/behaviors/sticky-key) |
| `&sl` | `sticky_layer` | `zmk,behavior-sticky-key` | 1 | layer | — | STICKY_LAYER | [sticky-layer](https://zmk.dev/docs/keymaps/behaviors/sticky-layer) |
| `&mo` | `momentary_layer` | `zmk,behavior-momentary-layer` | 1 | layer | — | MO | [layers#momentary-layer](https://zmk.dev/docs/keymaps/behaviors/layers#momentary-layer) |
| `&tog` | `toggle_layer` | `zmk,behavior-toggle-layer` | 1 | layer | — | TOG | [layers#toggle-layer](https://zmk.dev/docs/keymaps/behaviors/layers#toggle-layer) |
| `&to` | `to_layer` | `zmk,behavior-to-layer` | 1 | layer | — | TO | [layers#to-layer](https://zmk.dev/docs/keymaps/behaviors/layers#to-layer) |
| `&caps_word` | `caps_word` | `zmk,behavior-caps-word` | 0 | — | — | CAPS_WORD | [caps-word](https://zmk.dev/docs/keymaps/behaviors/caps-word) |
| `&key_repeat` | `key_repeat` | `zmk,behavior-key-repeat` | 0 | — | — | KEY_REPEAT | [key-repeat](https://zmk.dev/docs/keymaps/behaviors/key-repeat) |
| `&sys_reset` | `sysreset` | `zmk,behavior-reset` | 0 | — | — | — | [reset#reset](https://zmk.dev/docs/keymaps/behaviors/reset#reset) |
| `&bootloader` | `bootload` | `zmk,behavior-reset` | 0 | — | — | — | [reset#bootloader-reset](https://zmk.dev/docs/keymaps/behaviors/reset#bootloader-reset) |
| `&bt` | `bluetooth` | `zmk,behavior-bluetooth` | 2 | command, profile | `CONFIG_ZMK_BLE` | BT | [bluetooth](https://zmk.dev/docs/keymaps/behaviors/bluetooth#bluetooth-behavior) |
| `&out` | `outputs` | `zmk,behavior-outputs` | 1 | command | — | OUT | [outputs](https://zmk.dev/docs/keymaps/behaviors/outputs#output-selection-behavior) |
| `&rgb_ug` | `rgb_ug` | `zmk,behavior-rgb-underglow` | 2 | command, value | `CONFIG_ZMK_RGB_UNDERGLOW` | — | [underglow](https://zmk.dev/docs/keymaps/behaviors/underglow#behavior-binding) |
| `&bl` | `bcklight` | `zmk,behavior-backlight` | 2 | command, value | `CONFIG_ZMK_BACKLIGHT` | BL | [backlight](https://zmk.dev/docs/keymaps/behaviors/backlight#behavior-binding) |
| `&ext_power` | `extpower` | `zmk,behavior-ext-power` | 1 | command | `CONFIG_ZMK_EXT_POWER` (default `y`) | — | [power](https://zmk.dev/docs/keymaps/behaviors/power#behavior-binding) |
| `&soft_off` | `z_so_off` | `zmk,behavior-soft-off` | 0 | — | `CONFIG_ZMK_PM_SOFT_OFF` | SOFT_OFF | [soft-off](https://zmk.dev/docs/keymaps/behaviors/soft-off#behavior-binding) |
| `&studio_unlock` | `studio_unlock` | `zmk,behavior-studio-unlock` | 0 | — | `CONFIG_ZMK_STUDIO` | — | [studio-unlock](https://zmk.dev/docs/keymaps/behaviors/studio-unlock#behavior-binding) |
| `&mkp` | `mouse_key_press` | `zmk,behavior-mouse-key-press` | 1 | button mask | `CONFIG_ZMK_POINTING` | MKP | [mouse-emulation#mouse-button-press](https://zmk.dev/docs/keymaps/behaviors/mouse-emulation#mouse-button-press) |
| `&mmv` | `mouse_move` | `zmk,behavior-input-two-axis` | 1 | packed X/Y velocity | `CONFIG_ZMK_POINTING` | always omit-if-no-ref | [mouse-emulation#mouse-move](https://zmk.dev/docs/keymaps/behaviors/mouse-emulation#mouse-move) |
| `&msc` | `mouse_scroll` | `zmk,behavior-input-two-axis` | 1 | packed X/Y velocity | `CONFIG_ZMK_POINTING` | always omit-if-no-ref | [mouse-emulation#mouse-scroll](https://zmk.dev/docs/keymaps/behaviors/mouse-emulation#mouse-scroll) |
| `&inc_dec_kp` | `enc_key_press` | `zmk,behavior-sensor-rotate-var` | sensor 2 | CW keycode, CCW keycode | sensors enabled | always omit-if-no-ref | [sensor-rotate](https://zmk.dev/docs/keymaps/behaviors/sensor-rotate#variable-sensor-rotation) |
| `&inc_dec_cp` | (same node) | | | | | | **deprecated alias** of `&inc_dec_kp` |
| `&macro_tap` `&macro_press` `&macro_release` `&macro_pause_for_release` `&macro_param_1to1` `&macro_param_1to2` `&macro_param_2to1` `&macro_param_2to2` | same as label | `zmk,macro-control-*` / `zmk,macro-param-*` / `zmk,macro-pause-for-release` | 0 | — | only valid inside macro `bindings` | — | combos-macros-layers.md |
| `&macro_wait_time` `&macro_tap_time` | same | `zmk,macro-control-wait-time` / `-tap-time` | 1 | ms | only inside macros | — | combos-macros-layers.md |

Also note `&mkp_input_listener`, `&mmv_input_listener`, `&msc_input_listener` (`zmk,input-listener` nodes) exist for attaching input processors; not behaviors.

**Names that do NOT exist (v0.3.0 or main)** (common mistakes): `&tg` (use `&tog`), `&reset` (use `&sys_reset`), `&td` (tap-dance has no built-in instance), `&rgb` (use `&rgb_ug`).

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/dts/behaviors.dtsi , https://github.com/zmkfirmware/zmk/tree/main/app/dts/behaviors , https://github.com/zmkfirmware/zmk/blob/main/app/CMakeLists.txt , https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.behaviors , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/behaviors.h , https://zmk.dev/docs/keymaps/behaviors

## 2. Parameter value headers

| Behavior | Header | Values (cell 1 [cell 2]) |
|---|---|---|
| `&kp` `&kt` `&sk` `&mt`(both) `&lt`(2nd) | `dt-bindings/zmk/keys.h` | keycodes, modifier functions `LS(A)` etc. (keymap.md §4) |
| `&mo` `&tog` `&to` `&sl` `&lt`(1st) | — | layer index `0..N-1` (or `#define`d name) |
| `&bt` | `dt-bindings/zmk/bt.h` | `BT_CLR`, `BT_CLR_ALL`, `BT_NXT`, `BT_PRV` (each expands to 2 cells: `CMD 0`); `BT_SEL <n>`, `BT_DISC <n>` (expand to 1 cell; profile index 0-based follows). Raw: `BT_CLR_CMD 0`, `BT_NXT_CMD 1`, `BT_PRV_CMD 2`, `BT_SEL_CMD 3`, `BT_CLR_ALL_CMD 4`, `BT_DISC_CMD 5`. Default 5 profiles (`CONFIG_BT_MAX_CONN`/`CONFIG_BT_MAX_PAIRED`). |
| `&out` | `dt-bindings/zmk/outputs.h` | `OUT_TOG`=0, `OUT_USB`=1, `OUT_BLE`=2; `OUT_NONE`=3 **main only (not in v0.3.0)** ([v0.3.0 outputs.h](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/include/dt-bindings/zmk/outputs.h)) |
| `&rgb_ug` | `dt-bindings/zmk/rgb.h` | `RGB_TOG RGB_ON RGB_OFF RGB_HUI RGB_HUD RGB_SAI RGB_SAD RGB_BRI RGB_BRD RGB_SPI RGB_SPD RGB_EFF RGB_EFR` (each = `CMD 0`), `RGB_COLOR_HSB(h,s,b)` (h ≤ 360, s ≤ 100, b ≤ 100; alias `RGB_COLOR_HSV`). `RGB_EFS_CMD` (13, set effect) exists in the header without a 2-cell alias and is undocumented. |
| `&bl` | `dt-bindings/zmk/backlight.h` | `BL_ON BL_OFF BL_TOG BL_INC BL_DEC BL_CYCLE` (= `CMD 0`), `BL_SET <brightness 0-100>` |
| `&ext_power` | `dt-bindings/zmk/ext_power.h` | `EP_ON`/`EXT_POWER_ON_CMD`=1, `EP_OFF`/`EXT_POWER_OFF_CMD`=0, `EP_TOG`/`EXT_POWER_TOGGLE_CMD`=2 |
| `&mkp` | `dt-bindings/zmk/pointing.h` | `MB1`/`LCLK`, `MB2`/`RCLK`, `MB3`/`MCLK`, `MB4`, `MB5` (bit mask, OR-able) |
| `&mmv` | `pointing.h` | `MOVE_UP MOVE_DOWN MOVE_LEFT MOVE_RIGHT` (±`ZMK_POINTING_DEFAULT_MOVE_VAL`, default 600), `MOVE_X(v)`, `MOVE_Y(v)`, `MOVE(x,y)`; +X right, +Y down |
| `&msc` | `pointing.h` | `SCRL_UP SCRL_DOWN SCRL_LEFT SCRL_RIGHT` (±`ZMK_POINTING_DEFAULT_SCRL_VAL`, default 10); +Y up; use `MOVE_*` values if smooth scrolling is enabled |

Override pointing defaults before the include: `#define ZMK_POINTING_DEFAULT_MOVE_VAL 1500` then `#include <dt-bindings/zmk/pointing.h>`. `dt-bindings/zmk/mouse.h` now only includes `pointing.h` (legacy name).

Sources: https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/bt.h , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/outputs.h , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/rgb.h , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/backlight.h , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/ext_power.h , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/pointing.h , https://zmk.dev/docs/keymaps/behaviors/bluetooth#bluetooth-command-defines , https://zmk.dev/docs/keymaps/behaviors/outputs#output-command-defines , https://zmk.dev/docs/keymaps/behaviors/underglow#rgb-action-defines , https://zmk.dev/docs/keymaps/behaviors/backlight#backlight-action-defines , https://zmk.dev/docs/keymaps/behaviors/power#external-power-control-command-defines , https://zmk.dev/docs/keymaps/behaviors/mouse-emulation#mouse-emulation-defines

## 3. User-instantiable behaviors (compatible → properties)

Type legend: `int` = `<N>`, `bool` = bare property name (present = true), `phandles` = `<&a>, <&b>` behaviors **without** params, `phandle-array` = `<&a P>, <&b P>` behaviors **with** params, `array` = `<1 2 3>`, `string` = `"x"`.

### 3.1 Hold-tap — `zmk,behavior-hold-tap`, `#binding-cells = <2>`

| Property | Type | Default | Notes |
|---|---|---|---|
| `bindings` | phandles | required | `<&hold>, <&tap>` e.g. `<&kp>, <&kp>`, `<&mo>, <&kp>`, `<&mo>, <&tog>`, `<&kp>, <&caps_word>`. Param 1 → hold, param 2 → tap. 0-param behaviors get a dummy `0`. Behaviors with 2 params (`&bt`, `&rgb_ug`) cannot be used (wrap in a macro). |
| `flavor` | string enum | `"hold-preferred"` | `"hold-preferred"` \| `"balanced"` \| `"tap-preferred"` \| `"tap-unless-interrupted"` |
| `tapping-term-ms` | int | **none in schema** | C reads it without fallback ⇒ effectively required for custom instances. Built-ins `&mt`/`&lt` set 200. Docs say "default is 200ms" (that is the built-in value). |
| `quick-tap-ms` | int | -1 (off) | Re-press within N ms of previous press ⇒ tap. |
| `require-prior-idle-ms` | int | -1 (off) | Pressed within N ms after another non-modifier key ⇒ immediate tap. |
| `retro-tap` | bool | false | Release with no other key pressed ⇒ tap even after tapping term. |
| `hold-while-undecided` | bool | false | Press hold immediately; release it before the tap if resolved as tap. |
| `hold-while-undecided-linger` | bool | false | Keep hold pressed until after tap is released. |
| `hold-trigger-key-positions` | array | `[]` | Positional hold-tap: pressing a position **not** in list before tapping term ⇒ tap. 0-based key positions. |
| `hold-trigger-on-release` | bool | false | Evaluate `hold-trigger-key-positions` on release of the other key. |
| `tapping_term_ms`, `quick_tap_ms`, `global-quick-tap` | — | deprecated | `global-quick-tap` = old name meaning `require-prior-idle-ms = quick-tap-ms`. Do not generate. |

Flavors: hold-preferred = hold on term expiry **or** any other key press; balanced = hold on term expiry or other key pressed **and released**; tap-preferred = hold only on term expiry; tap-unless-interrupted = hold only if another key pressed before term, else tap.

Kconfig: `CONFIG_ZMK_BEHAVIOR_HOLD_TAP_MAX_HELD` (int, 10), `CONFIG_ZMK_BEHAVIOR_HOLD_TAP_MAX_CAPTURED_EVENTS` (int, 40).

```dts
/ {
    behaviors {
        hml: home_row_mod_left {
            compatible = "zmk,behavior-hold-tap";
            #binding-cells = <2>;
            flavor = "balanced";
            tapping-term-ms = <280>;
            quick-tap-ms = <175>;
            require-prior-idle-ms = <150>;
            bindings = <&kp>, <&kp>;
            hold-trigger-key-positions = <6 7 8 9 10 11>;
            hold-trigger-on-release;
        };
    };
};
// usage: &hml LSHIFT A
```
Built-in `&mt`: `flavor = "hold-preferred"; tapping-term-ms = <200>; bindings = <&kp>, <&kp>;`. Built-in `&lt`: `flavor = "tap-preferred"; tapping-term-ms = <200>; bindings = <&mo>, <&kp>;`.

Sources: https://zmk.dev/docs/keymaps/behaviors/hold-tap#custom-hold-tap-configuration , https://zmk.dev/docs/keymaps/behaviors/hold-tap#interrupt-flavors , https://zmk.dev/docs/config/behaviors#hold-tap , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-hold-tap.yaml , https://github.com/zmkfirmware/zmk/blob/main/app/src/behaviors/behavior_hold_tap.c

### 3.2 Tap-dance — `zmk,behavior-tap-dance`, `#binding-cells = <0>`

| Property | Type | Default | Notes |
|---|---|---|---|
| `bindings` | phandle-array | required | `<&kp N1>, <&kp N2>, <&mt LSHIFT CAPS>`; index i = (i+1) taps. Reaching the last binding fires immediately. |
| `tapping-term-ms` | int | 200 | Max time after last press before resolving. |

No built-in instance. Kconfig `CONFIG_ZMK_BEHAVIOR_TAP_DANCE_MAX_HELD` (int, 10). Interrupting key press resolves immediately.
```dts
/ { behaviors {
    td0: tap_dance_0 {
        compatible = "zmk,behavior-tap-dance";
        #binding-cells = <0>;
        tapping-term-ms = <200>;
        bindings = <&kp N1>, <&kp N2>, <&kp N3>;
    };
}; };
// usage: &td0
```
Sources: https://zmk.dev/docs/keymaps/behaviors/tap-dance , https://zmk.dev/docs/config/behaviors#tap-dance , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-tap-dance.yaml

### 3.3 Mod-morph — `zmk,behavior-mod-morph`, `#binding-cells = <0>`

| Property | Type | Default | Notes |
|---|---|---|---|
| `bindings` | phandle-array | required | `<&kp ESC>, <&kp GRAVE>` = normal, morphed. Nesting another mod-morph is allowed. |
| `mods` | int | required | `MOD_*` bit field from `modifiers.h`; morph if **any** held: `<(MOD_LSFT|MOD_RSFT)>` |
| `keep-mods` | int | 0 | Mods (subset of `mods`) still sent with the morphed binding. |

Built-in `&gresc`: `bindings = <&kp ESC>, <&kp GRAVE>; mods = <(MOD_LGUI|MOD_LSFT|MOD_RGUI|MOD_RSFT)>;`.
```dts
bspc_del: backspace_delete {
    compatible = "zmk,behavior-mod-morph";
    #binding-cells = <0>;
    bindings = <&kp BACKSPACE>, <&kp DELETE>;
    mods = <(MOD_LSFT|MOD_RSFT)>;
    keep-mods = <(MOD_RSFT)>;
};
```
Sources: https://zmk.dev/docs/keymaps/behaviors/mod-morph , https://zmk.dev/docs/config/behaviors#mod-morph , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-mod-morph.yaml

### 3.4 Sticky key / sticky layer — `zmk,behavior-sticky-key`, `#binding-cells = <1>`

| Property | Type | Default (schema) | Built-in `&sk` | Built-in `&sl` |
|---|---|---|---|---|
| `bindings` | phandles | required | `<&kp>` | `<&mo>` |
| `release-after-ms` | int | **required** | 1000 | 1000 |
| `quick-release` | bool | false | – | set |
| `lazy` | bool | false | – | – |
| `ignore-modifiers` | bool | false | set | – |

Docs table says `ignore-modifiers` default `true` and `release-after-ms` default 1000 — those are the `&sk` built-in values; for a **new** instance both must be written explicitly. Kconfig `CONFIG_ZMK_BEHAVIOR_STICKY_KEY_MAX_HELD` (int, 10).
```dts
skq: sticky_key_quick_release {
    compatible = "zmk,behavior-sticky-key";
    #binding-cells = <1>;
    bindings = <&kp>;
    release-after-ms = <1000>;
    quick-release;
    ignore-modifiers;
};
// usage: &skq LSHIFT ; &sl 1
```
Sources: https://zmk.dev/docs/keymaps/behaviors/sticky-key#configuration , https://zmk.dev/docs/keymaps/behaviors/sticky-layer#configuration , https://zmk.dev/docs/config/behaviors#sticky-key , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-sticky-key.yaml , https://github.com/zmkfirmware/zmk/blob/main/app/dts/behaviors/sticky_key.dtsi

### 3.5 Caps word — `zmk,behavior-caps-word`, `#binding-cells = <0>`

| Property | Type | Default | Notes |
|---|---|---|---|
| `continue-list` | array | **required** (built-in: `<UNDERSCORE BACKSPACE DELETE>`) | Keycodes that don't end caps word; A–Z, 0–9 always implied. |
| `mods` | int | `MOD_LSFT` (C fallback) | Mods applied to A–Z. |

```dts
&caps_word { continue-list = <UNDERSCORE MINUS>; mods = <(MOD_LSFT | MOD_LALT)>; };
prog_caps: prog_caps {
    compatible = "zmk,behavior-caps-word";
    #binding-cells = <0>;
    continue-list = <UNDERSCORE>;
};
```
Note: the doc example places `prog_caps` directly under `/` (not under `behaviors {}`); both work since only `compatible` matters.
Sources: https://zmk.dev/docs/keymaps/behaviors/caps-word#configuration , https://zmk.dev/docs/config/behaviors#caps-word , https://github.com/zmkfirmware/zmk/blob/main/app/src/behaviors/behavior_caps_word.c

### 3.6 Key repeat — `zmk,behavior-key-repeat`, `#binding-cells = <0>`

| Property | Type | Default | Notes |
|---|---|---|---|
| `usage-pages` | array | **required** (built-in: `<HID_USAGE_KEY>`) | `HID_USAGE_*` from `hid_usage_pages.h`, e.g. `<HID_USAGE_KEY HID_USAGE_CONSUMER>` |

```dts
&key_repeat { usage-pages = <HID_USAGE_KEY HID_USAGE_CONSUMER>; };
```
Sources: https://zmk.dev/docs/keymaps/behaviors/key-repeat#configuration , https://zmk.dev/docs/config/behaviors#key-repeat

### 3.7 Key toggle — `zmk,behavior-key-toggle`, `#binding-cells = <1>`

| Property | Type | Default | Notes |
|---|---|---|---|
| `toggle-mode` | string enum | `"flip"` | `"on"` \| `"off"` \| `"flip"` |

Modifier functions in the param toggle based on the base keycode only.
```dts
kt_on: key_toggle_on_only {
    compatible = "zmk,behavior-key-toggle";
    #binding-cells = <1>;
    display-name = "Key Toggle On";
    toggle-mode = "on";
};
```
Sources: https://zmk.dev/docs/keymaps/behaviors/key-toggle#configuration , https://zmk.dev/docs/config/behaviors#key-toggle

### 3.8 Layer behaviors — `#binding-cells = <1>`, param = layer index

| Compatible | Built-in | Properties |
|---|---|---|
| `zmk,behavior-momentary-layer` | `&mo` | v0.3.0: none. main: `locking` bool (default false) **main only (not in v0.3.0)** |
| `zmk,behavior-toggle-layer` | `&tog` (main: `locking;`) | `toggle-mode` `"on"`\|`"off"`\|`"flip"` (default `"flip"`); `locking` bool **main only (not in v0.3.0)** |
| `zmk,behavior-to-layer` | `&to` (main: `locking;`) | v0.3.0: none. `locking` bool **main only (not in v0.3.0)** |
| sticky layer | `&sl` | see 3.4 |
| layer-tap | `&lt` | see 3.1 |

Layer locking — **main only (not in v0.3.0)**; a `locking;` property on v0.3.0 is an unknown DT property (not in the binding YAML → devicetree error; do not emit). On main a layer turned on by a behavior with `locking` stays on until a `locking` behavior turns it off, i.e. `&mo 1` then tap `&tog 1` keeps layer 1 after releasing `&mo`.
```dts
tog_on: toggle_layer_on_only {
    compatible = "zmk,behavior-toggle-layer";
    #binding-cells = <1>;
    display-name = "Toggle Layer On";
    toggle-mode = "on";
    // main only: locking;
};
```
**Doc bug:** https://zmk.dev/docs/config/behaviors#layer-toggle names the compatible `zmk,behavior-layer-toggle` and file `zmk,behavior-layer-toggle.yaml`; neither exists. Source (and the layers page example) use `zmk,behavior-toggle-layer`. Generate `zmk,behavior-toggle-layer`.

Sources: https://zmk.dev/docs/keymaps/behaviors/layers , https://zmk.dev/docs/keymaps/behaviors/layers#layer-locking , https://zmk.dev/docs/config/behaviors#momentary-layer , https://zmk.dev/docs/config/behaviors#layer-toggle , https://zmk.dev/docs/config/behaviors#to-layer , https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/behaviors/zmk%2Cbehavior-toggle-layer.yaml , https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/behaviors/toggle_layer.dtsi , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-toggle-layer.yaml

### 3.9 Sensor rotation (encoders)

| Compatible | Cells | `bindings` | Other |
|---|---|---|---|
| `zmk,behavior-sensor-rotate` | `#sensor-binding-cells = <0>` | phandle-array, with params: `<&rgb_ug RGB_BRI>, <&rgb_ug RGB_BRD>` (CW, CCW) | `tap-ms` int, default 5 |
| `zmk,behavior-sensor-rotate-var` | `#sensor-binding-cells = <2>` | phandles, no params: `<&kp>, <&kp>`; usage params (CW, CCW) forwarded | `tap-ms` int, default 5 |

Note: the config page lists `bindings` types swapped (says `phandles` for the non-var and `phandle array` for var); the YAML schemas above are authoritative.
```dts
rgb_encoder: rgb_encoder {
    compatible = "zmk,behavior-sensor-rotate";
    #sensor-binding-cells = <0>;
    bindings = <&rgb_ug RGB_BRI>, <&rgb_ug RGB_BRD>;
};
rot_kp: sensor_rotate_kp {
    compatible = "zmk,behavior-sensor-rotate-var";
    #sensor-binding-cells = <2>;
    bindings = <&kp>, <&kp>;
};
// layer: sensor-bindings = <&rgb_encoder &rot_kp PG_UP PG_DN>;
```
Sources: https://zmk.dev/docs/keymaps/behaviors/sensor-rotate , https://zmk.dev/docs/config/behaviors#sensor-rotation , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-sensor-rotate.yaml , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-sensor-rotate-var.yaml

### 3.10 Two-axis input (mouse move/scroll) — `zmk,behavior-input-two-axis`, `#binding-cells = <1>`

Requires `CONFIG_ZMK_POINTING=y`. Changing pointing on/off changes the HID descriptor (BLE hosts must re-pair/refresh).

| Property | Type | Default | `&mmv` | `&msc` |
|---|---|---|---|---|
| `x-input-code` | int | required | `INPUT_REL_X` | `INPUT_REL_HWHEEL` |
| `y-input-code` | int | required | `INPUT_REL_Y` | `INPUT_REL_WHEEL` |
| `trigger-period-ms` | int | 16 | | |
| `delay-ms` | int | 0 | | |
| `time-to-max-speed-ms` | int | **required** (docs say 0) | 300 | 300 |
| `acceleration-exponent` | int | 1 | 1 | 0 |

Input codes from `<zephyr/dt-bindings/input/input-event-codes.h>`. Input processors: `&mmv_input_listener { input-processors = <...>; };`.
Sources: https://zmk.dev/docs/keymaps/behaviors/mouse-emulation#advanced-configuration , https://zmk.dev/docs/config/behaviors#two-axis-input , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-input-two-axis.yaml

### 3.11 Macros — `zmk,behavior-macro` / `-one-param` / `-two-param`

See combos-macros-layers.md §2.

## 4. Fixed-function behaviors (tweakable, not normally re-instantiated)

| Behavior | Properties | Notes |
|---|---|---|
| `&soft_off` (`zmk,behavior-soft-off`) | `hold-time-ms` int (C default 0 = off on release), `split-peripheral-off-on-press` bool (set on built-in) | Needs `CONFIG_ZMK_PM_SOFT_OFF=y` (config/power). Global locality. `&soft_off { hold-time-ms = <5000>; };` |
| `&sys_reset`, `&bootloader` (`zmk,behavior-reset`) | `type` int (default 0 = `RST_WARM`; `RST_COLD`=1, `RST_UF2`=0x57 from `dt-bindings/zmk/reset.h`), `bootloader` bool **main only (not in v0.3.0)** (on main used when `CONFIG_RETENTION_BOOT_MODE` is enabled, otherwise `type`; v0.3.0 always uses `type`, built-in `&bootloader` = `type = <RST_UF2>`) | Source locality: resets the half it's pressed on; via combo always central. |
| `&bt`, `&out`, `&rgb_ug`, `&bl`, `&ext_power`, `&studio_unlock`, `&kp`, `&trans`, `&none` | none beyond `display-name` | |

`&bt` / `&out` selection, RGB, backlight and ext-power state persist to flash after `CONFIG_ZMK_SETTINGS_SAVE_DEBOUNCE` ms.

Sources: https://zmk.dev/docs/keymaps/behaviors/soft-off#configuration , https://zmk.dev/docs/keymaps/behaviors/reset , https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/behaviors/zmk%2Cbehavior-reset.yaml , https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_reset.c , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-reset.yaml , https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/reset.h , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/zmk%2Cbehavior-soft-off.yaml

## 5. Common behavior Kconfig

| Symbol | Type | Default | Meaning |
|---|---|---|---|
| `CONFIG_ZMK_BEHAVIORS_QUEUE_SIZE` | int | 64 | Behavior queue (macros); tap = 2 entries |
| `CONFIG_ZMK_BEHAVIOR_HOLD_TAP_MAX_HELD` | int | 10 | |
| `CONFIG_ZMK_BEHAVIOR_HOLD_TAP_MAX_CAPTURED_EVENTS` | int | 40 | |
| `CONFIG_ZMK_BEHAVIOR_STICKY_KEY_MAX_HELD` | int | 10 | |
| `CONFIG_ZMK_BEHAVIOR_TAP_DANCE_MAX_HELD` | int | 10 | |
| `CONFIG_ZMK_MACRO_DEFAULT_WAIT_MS` | int | 15 | |
| `CONFIG_ZMK_MACRO_DEFAULT_TAP_MS` | int | 30 | |

`CONFIG_ZMK_BEHAVIOR_<X>` enable symbols (`HOLD_TAP`, `STICKY_KEY`, `TAP_DANCE`, `MACRO`, `KEY_TOGGLE`, `SENSOR_ROTATE[_VAR]`, `MOUSE_KEY_PRESS`, `INPUT_TWO_AXIS`, `SOFT_OFF`, `STUDIO_UNLOCK`) are `default y` + `depends on DT_HAS_<compatible>_ENABLED`; never set them manually.

Sources: https://zmk.dev/docs/config/behaviors#common , https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig , https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig.behaviors

## 6. Split locality

- Central-only (default): everything not listed below — the central processes the keymap.
- Global (runs on all halves): `&rgb_ug`, `&bl`, `&ext_power`, `&soft_off`.
- Event-source (runs on the half where the key was pressed): `&sys_reset`, `&bootloader`. Combos always invoke them on central.
- Peripherals must be connected to the central for these to work.
- A **custom** node of a non-central compatible (e.g. a new `zmk,behavior-reset` or `zmk,behavior-rgb-underglow` instance) must have a DT **node name ≤ 8 characters** (upstream comment "Behavior can be invoked on peripherals, so name must be <= 8 characters"). Generator rule: enforce ≤ 8 chars for node names of compatibles `zmk,behavior-reset`, `-rgb-underglow`, `-backlight`, `-ext-power`, `-soft-off`.

Sources: https://zmk.dev/docs/features/split-keyboards#behaviors-with-locality , https://zmk.dev/docs/development/new-behavior , https://github.com/zmkfirmware/zmk/blob/main/app/dts/behaviors/reset.dtsi

## 7. main-only differences (main @ `5b51501` vs v0.3.0) relevant to generators

All **main only (not in v0.3.0)**; do not emit for the v0.3.0 target:

- `locking` property added to `zmk,behavior-momentary-layer`, `-toggle-layer`, `-to-layer`; built-in `&tog` and `&to` now set `locking;`.
- `bootloader` bool added to `zmk,behavior-reset`; built-in `&bootloader` sets it.
- `OUT_NONE` (3) added to `outputs.h`.
- Conditional layers propagate layer locks (`conditional_layer.c`); no DT change.
- No behaviors added/removed/renamed between v0.3.0 and main (`app/dts/behaviors/` file list identical).
- Older renames still seen in the wild (all pre-v0.3.0): `&reset` → `&sys_reset`; `tapping_term_ms` → `tapping-term-ms`; `quick_tap_ms` → `quick-tap-ms`; `global-quick-tap` → `require-prior-idle-ms`; `label = "..."` → `display-name`; `dt-bindings/zmk/mouse.h` → `pointing.h`; `CONFIG_ZMK_MOUSE` → `CONFIG_ZMK_POINTING`; `matrix-transform.h` → `matrix_transform.h`; `&inc_dec_cp` → `&inc_dec_kp`.

Sources: https://github.com/zmkfirmware/zmk/compare/v0.3.0...main , https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/dts/behaviors
