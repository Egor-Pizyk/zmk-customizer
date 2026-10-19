# Independent expected encoder output

Hand-authored from pinned Sofle and the EC11/sensor bindings in docs/zmk/encoders.md, before generator implementation. These are fragments inserted into already independently covered shield/keymap files; tests also assert complete surrounding files unchanged.

Differences from Sofle: bounded positional labels; existing six-key preset instead of Sofle matrix/display; right encoder uses 40 steps and 10 triggers to exercise per-sensor child config order; arbitrary existing actions use fixed zero-cell sensor-rotate instead of inc_dec_kp; absent assignments mean two none actions. Driver defaults live under DT_HAS_ALPS_EC11_ENABLED in shield Kconfig.defconfig instead of commented optional user conf. Guarded choice default selects the global thread mode without forcing a driver where no local EC11 node is enabled.

Identical CW/CCW pairs share the first encountered rotation definition. Empty assignments on layer 0/encoder 1 and layer 1/encoder 0 therefore share encoder_rotation_0_1. The pinned driver allocates a sensor×layer state array per behavior instance, so duplicating empty definitions across the full grid would otherwise exhaust controller RAM. State remains separate by sensor and layer within the shared behavior.
