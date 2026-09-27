# Combos, macros, conditional layers

Target: ZMK **v0.3.0** (`edf5c08`). Verified 2026-09-27 at v0.3.0 and `main` @ `5b51501`; all files below are identical in both (only `conditional_layer.c` differs: main propagates layer locks, no DT change). Checked: docs pages + `app/dts/bindings/zmk,combos.yaml`, `zmk,conditional-layers.yaml`, `behaviors/macro_base.yaml`, `app/dts/behaviors/macros.dtsi`, `app/src/combo.c`. All three live in the `.keymap` file inside `/ { ... };`.

## 1. Combos — container `compatible = "zmk,combos"`

```dts
/ {
    combos {
        compatible = "zmk,combos";
        combo_esc {                      // child node name free; convention "combo_*"
            timeout-ms = <50>;
            key-positions = <0 1>;
            bindings = <&kp ESC>;
        };
        combo_bt_clear {
            key-positions = <10 11 12>;
            bindings = <&bt BT_CLR>;
            layers = <2 3>;              // only when highest active layer is 2 or 3
            require-prior-idle-ms = <150>;
            slow-release;
        };
    };
};
```

| Property (child) | Type | Default | Meaning |
|---|---|---|---|
| `bindings` | phandle-array | required | Exactly one binding, any behavior incl. 2-param (`&bt BT_SEL 1`, `&mt`, `&lt`, macros). |
| `key-positions` | array | required | 0-based key positions (keymap order). ≥ 2 in practice. |
| `timeout-ms` | int | 50 | All keys must be pressed within this window. |
| `require-prior-idle-ms` | int | -1 (off) | If a non-modifier key was pressed within N ms before, the combo doesn't trigger. Stored as int16 (max 32767). |
| `slow-release` | bool | false | Release when **all** keys released (default: when any key released). |
| `layers` | array | all layers (v0.3.0 docs write this default as `<-1>`; source identical in both: property absent = all layers) | Combo only active when the **highest active layer** is in this list (source: `combo_active_on_layer(combo, zmk_keymap_highest_layer_active())`). |

Constraints (source-derived, not in docs):
- Only the first `zmk,combos` node is used (`DT_INST_FOREACH_CHILD(0, …)`); generate exactly one container.
- Combos with more than 20 key positions are silently not compiled (`LISTIFY(20, …)` in `combo.c`).
- Layer indices in `layers` must be < 32 (`uint32_t` layer mask; ZMK layer state is also `uint32_t` ⇒ max 32 layers overall).
- Partially and fully overlapping combos are supported (`0 1` with `0 2`; `0 1` with `0 1 2`).
- Source-locality behaviors (`&sys_reset`, `&bootloader`) in combos always run on the split central.
- Hold-tap `hold-while-undecided` on a position used by a combo waits for combo timeouts.

Kconfig:
| Symbol | Type | Default | Meaning |
|---|---|---|---|
| `CONFIG_ZMK_COMBO_MAX_PRESSED_COMBOS` | int | 4 | Max simultaneously active combos |
| `CONFIG_ZMK_COMBO_MAX_COMBOS_PER_KEY` | int | 0 | **Deprecated** (auto-calculated; non-zero emits `#warning`). Do not generate. |
| `CONFIG_ZMK_COMBO_MAX_KEYS_PER_COMBO` | int | 0 | **Deprecated** (auto-calculated from `key-positions`). Do not generate. |

Sources: https://zmk.dev/docs/keymaps/combos#configuration , https://zmk.dev/docs/keymaps/combos#advanced-usage , https://zmk.dev/docs/config/combos#devicetree , https://zmk.dev/docs/config/combos#kconfig , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Ccombos.yaml , https://github.com/zmkfirmware/zmk/blob/main/app/src/combo.c , https://github.com/zmkfirmware/zmk/blob/main/app/Kconfig

## 2. Macros

### 2.1 Definition

```dts
/ {
    macros {
        zed_em_kay: zed_em_kay {                 // label = what the keymap references (&zed_em_kay)
            compatible = "zmk,behavior-macro";
            #binding-cells = <0>;
            wait-ms = <40>;                      // optional
            tap-ms = <40>;                       // optional
            bindings
                = <&macro_press &kp LSHFT>
                , <&macro_tap &kp Z &kp M &kp K>
                , <&macro_release &kp LSHFT>
                ;
        };
    };
};
```

| `compatible` | `#binding-cells` | Usage |
|---|---|---|
| `"zmk,behavior-macro"` | `<0>` | `&my_macro` |
| `"zmk,behavior-macro-one-param"` | `<1>` | `&my_macro A` |
| `"zmk,behavior-macro-two-param"` | `<2>` | `&my_macro 1 LSHIFT` |

| Property | Type | Default | Meaning |
|---|---|---|---|
| `bindings` | phandle-array | required | Behaviors + macro controls, processed in order. `<&a> , <&b>` and `<&a &b>` are equivalent groupings. |
| `wait-ms` | int | `CONFIG_ZMK_MACRO_DEFAULT_WAIT_MS` (15) | Delay before each next binding. |
| `tap-ms` | int | `CONFIG_ZMK_MACRO_DEFAULT_TAP_MS` (30) | Press→release time in tap mode. |
| `display-name` | string | – | Studio name. |

Docs recommend `wait-ms`/`tap-ms` ≥ 30 for key sequences over BLE (avoid reordered HID reports); use 0/0 for layer+modifier macros.

### 2.2 Macro controls (only valid inside macro `bindings`)

| Control | Cells | Effect |
|---|---|---|
| `&macro_tap` | 0 | Mode: press+release each following binding (default mode). |
| `&macro_press` | 0 | Mode: press only. |
| `&macro_release` | 0 | Mode: release only. |
| `&macro_pause_for_release` | 0 | Stop here until the macro key is released, then continue. |
| `&macro_wait_time N` | 1 | Set wait time (ms) from here on. |
| `&macro_tap_time N` | 1 | Set tap time (ms) from here on. |
| `&macro_param_1to1` | 0 | Next non-control binding: param 1 ← macro param 1. |
| `&macro_param_1to2` | 0 | Next binding: param 2 ← macro param 1. |
| `&macro_param_2to1` | 0 | Next binding: param 1 ← macro param 2. |
| `&macro_param_2to2` | 0 | Next binding: param 2 ← macro param 2. |

Param controls are one-shot. The replaced cell still needs a placeholder: `MACRO_PLACEHOLDER` (= 0, defined in `behaviors/macros.dtsi`).

### 2.3 Parameterized example (layer + modifier, QMK `LM()`)
```dts
lm: lm {
    compatible = "zmk,behavior-macro-two-param";
    wait-ms = <0>;
    tap-ms = <0>;
    #binding-cells = <2>;
    bindings
        = <&macro_param_1to1>
        , <&macro_press &mo MACRO_PLACEHOLDER>
        , <&macro_param_2to1>
        , <&macro_press &kp MACRO_PLACEHOLDER>
        , <&macro_pause_for_release>
        , <&macro_param_2to1>
        , <&macro_release &kp MACRO_PLACEHOLDER>
        , <&macro_param_1to1>
        , <&macro_release &mo MACRO_PLACEHOLDER>
        ;
};
// usage: &lm 1 LSHIFT
```

### 2.4 Convenience C macros (from `behaviors/macros.dtsi`)
```dts
ZMK_MACRO(name, props...)   // compatible "zmk,behavior-macro",           #binding-cells = <0>
ZMK_MACRO1(name, props...)  // compatible "zmk,behavior-macro-one-param", #binding-cells = <1>
ZMK_MACRO2(name, props...)  // compatible "zmk,behavior-macro-two-param", #binding-cells = <2>
```
Each expands to `name: name { compatible = ...; #binding-cells = <..>; props };` (label = node name). Docs document only `ZMK_MACRO` (v0.3.0 docs add a note that it "only supports non-parameterized macros"); `ZMK_MACRO1/2` exist in source at both v0.3.0 and main. Generators should emit full nodes (clearer, no hidden naming rule).

### 2.5 Limits
- Behavior queue `CONFIG_ZMK_BEHAVIORS_QUEUE_SIZE` (int, default 64); tap-mode bindings use 2 entries, press/release 1. E.g. 512 ≈ 256 typed characters.
- Max 256 entries in a DT `bindings` list (docs).
- Hold-taps cannot take 2-param behaviors directly; wrap them in a 0-param macro.

Sources: https://zmk.dev/docs/keymaps/behaviors/macros , https://zmk.dev/docs/keymaps/behaviors/macros#macro-controls , https://zmk.dev/docs/keymaps/behaviors/macros#parameterized-macros , https://zmk.dev/docs/keymaps/behaviors/macros#behavior-queue-limit , https://zmk.dev/docs/keymaps/behaviors/macros#convenience-c-macro , https://zmk.dev/docs/config/behaviors#macro , https://zmk.dev/docs/config/behaviors#macro-control-behaviors , https://github.com/zmkfirmware/zmk/blob/main/app/dts/behaviors/macros.dtsi , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/behaviors/macro_base.yaml

## 3. Conditional layers — container `compatible = "zmk,conditional-layers"`

```dts
/ {
    conditional_layers {
        compatible = "zmk,conditional-layers";
        tri_layer {
            if-layers = <1 2>;
            then-layer = <3>;
        };
    };
};
```

| Property (child) | Type | Required | Meaning |
|---|---|---|---|
| `if-layers` | array | yes | All of these layers active ⇒ activate `then-layer`. |
| `then-layer` | int | yes | Layer activated iff condition holds. |

Rules:
- `then-layer` should be higher-numbered than its `if-layers` (higher layers take priority).
- A `then-layer`'s state is fully controlled by the feature: activating it via `&mo`/`&tog` is immediately undone if the condition isn't met. Docs recommend not binding layer behaviors to `then-layer` targets (candidate for a domain validation warning).
- Chains are possible (one `then-layer` may satisfy another rule's `if-layers`).

Sources: https://zmk.dev/docs/keymaps/conditional-layers#configuration , https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Cconditional-layers.yaml

## 4. Layers (recap; details in keymap.md and behaviors.md §3.8)

- Layer index = definition order in `zmk,keymap`; 0 always active; highest active index wins; max 32 layers (`zmk_keymap_layers_state_t` is `uint32_t`).
- Navigation: `&mo N`, `&lt N KC`, `&to N`, `&tog N`, `&sl N`; custom variants via `zmk,behavior-momentary-layer` / `-toggle-layer` (`toggle-mode`) / `-to-layer`, `locking` property on these is **main only (not in v0.3.0)**.
- `#define LOWER 1` at the top of the keymap for readable layer references.

Sources: https://zmk.dev/docs/keymaps#layers , https://zmk.dev/docs/keymaps/behaviors/layers , https://github.com/zmkfirmware/zmk/blob/main/app/include/zmk/keymap.h
