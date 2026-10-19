# Research: 017

Decision: combo/rule references store stable IDs. Rationale: deleting/renumbering keys/layers must not retarget actions. Alternative rejected: storing indices and rewriting after every edit.

Decision: explicit macro pause uses `<&macro_wait_time N>, <&macro_press &none>, <&macro_wait_time configuredWait>`. Every following action emits its own mode. Rationale: macro controls alone enqueue nothing; in press mode a binding queues one event with `state.wait_ms` as the wait after it. `none` causes no host action, so this gives an actual N-ms pause without an extra tap duration. Source: [pinned v0.3.0 behavior_macro.c](https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/behaviors/behavior_macro.c#L149-L174), read 2026-10-18. Alternative rejected: merely changing wait-time without a queue event (does not pause), or tapping none with default tap duration (adds unintended tap delay).

Decision: reject sequences exceeding 256 DT bindings or conservative 64 queued events, including nested references. Rationale: v0.3 default queue is 64; the current Firmware catalog does not expose its size. No Kconfig expansion in this feature. Source: docs/zmk/combos-macros-layers.md §2.5 and behaviors.md §5.

Decision: enforce conditional target above inputs and unique ownership. Rationale: higher layer priority and automatic state ownership should remain explicit and repairable. Chains are supported if acyclic and ordered.
