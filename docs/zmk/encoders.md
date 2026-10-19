# EC11 rotary encoders

Target ZMK **v0.3.0**, commit `edf5c0814fd3ea202e43aad2d68fd32e882a518c`. Verified against the pinned source on 2026-10-19.

## Hardware

Each encoder is an `alps,ec11` node with `a-gpios` and `b-gpios` using the board connector and `(GPIO_ACTIVE_HIGH | GPIO_PULL_UP)`. `steps` is the number of electrical transitions per full rotation (upstream Sofle: 80). Do not emit deprecated `resolution` (pulses per tick).

A single `zmk,keymap-sensors` node contains `sensors = <&encoder_0 &encoder_1>;`. The order is global, including disabled remote sensors on split keyboards, and must match every layer's sensor bindings. `triggers-per-rotation` controls action invocations per rotation (Sofle: 20). Per-sensor child nodes override this count; **when any children exist there must be one child per sensor in the same order**, because `app/src/sensors.c` constructs its config array from child order.

On split shields declare all encoders disabled in the shared `.dtsi`, then enable only local encoders in each half's `.overlay`. A unibody overlay enables all encoders. Push switches are ordinary kscan keys, separate from rotation sensors.

Sources: [hardware guide](https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/development/hardware-integration/encoders.md), [EC11 binding](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/module/dts/bindings/sensor/alps%2Cec11.yaml), [sensor binding](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/zmk%2Ckeymap-sensors.yaml), [sensor configuration implementation](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/sensors.c), [Sofle](https://github.com/zmkfirmware/zmk/tree/v0.3.0/app/boards/shields/sofle).

## Bindings

Each layer has one `sensor-bindings` item per sensor. `&inc_dec_kp CW CCW` sends keycodes. For arbitrary existing actions use `zmk,behavior-sensor-rotate`, `#sensor-binding-cells = <0>`, `bindings = <CLOCKWISE>, <COUNTERCLOCKWISE>;`. The driver invokes press then release; it does not synthesize a held physical key. Missing editor assignments are generated as two `&none` actions (no implicit layer inheritance). Keep custom rotation labels separate from ordinary key behaviors.

Sources: [sensor rotation](https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/keymaps/behaviors/sensor-rotate.md), [binding schema](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/behaviors/zmk%2Cbehavior-sensor-rotate.yaml), [driver](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_sensor_rotate.c), [keymap](keymap.md#5-sensors-encoders-in-the-keymap).

## Driver configuration

`EC11` defaults to y when a local enabled EC11 node exists. Its trigger mode defaults to NONE, so set `EC11_TRIGGER_GLOBAL_THREAD` to y for every half with an encoder. Hardware defaults belong in shield `Kconfig.defconfig`: guard defaults with `DT_HAS_ALPS_EC11_ENABLED` inside the shield guard, so right-only encoders do not force EC11 on a half without an enabled node. `ZMK_KEYMAP_SENSORS` is selected automatically by the sensors node. No user firmware override is required.

Sources: [EC11 Kconfig](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/module/drivers/sensor/ec11/Kconfig), [feature guide](https://github.com/zmkfirmware/zmk/blob/v0.3.0/docs/docs/features/encoders.md), [Kconfig notes](kconfig-options.md#8-keymap-behaviors-combos-macros).


## Runtime count limits (v0.3)

The DT schemas do not enforce the driver's arithmetic constraints. Our supported electrical steps are **1–360**: EC11 stores steps in uint16_t, but `ec11_channel_get` emits `val1 = pulses * 360 / steps`. For one pulse and steps >360 this becomes zero, and sensor-rotate interprets the fractional `val2` as legacy ticks. `triggers-per-rotation` must be a **positive divisor of 360**: sensor-rotate computes integer `trigger_degrees = 360 / triggers` and divides/modulos by that value; >360 divides by zero, and non-divisors change the effective rate. Typical 80 steps /20 triggers is supported. Arbitrary supported electrical counts may introduce tiny upstream microdegree truncation; the default 80 is exactly representable. Invalid counts stay repairable in project files and block export.

Sources: [EC11 channel conversion](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/module/drivers/sensor/ec11/ec11.c#L89-L94), [sensor rotate runtime](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_sensor_rotate_common.c#L28-L46), [16-bit sensor setting](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/include/zmk/sensors.h).


## Rotation behavior memory

Each fixed sensor-rotate instance allocates `remainder[sensor_count][layer_count]` and `triggers[sensor_count][layer_count]`. With ordinary 32-bit sizing this is 12 bytes per sensor/layer per instance. Emitting 512 duplicate behaviors for a 16×32 empty grid would waste about 3 MiB. Generate one instance per distinct rendered CW/CCW pair instead; all empty assignments share one definition. Sharing is safe because the driver indexes both arrays by the event's sensor index and layer. Many distinct action pairs can still exceed a particular controller's RAM.

Sources: [state arrays](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_sensor_rotate_common.h#L19-L21), [per-instance allocation](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_sensor_rotate.c#L35-L37), [indexed state](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_sensor_rotate_common.c).
