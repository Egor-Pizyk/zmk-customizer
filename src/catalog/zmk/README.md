# Vendored ZMK headers

`keys.h` is a verbatim copy of `app/include/dt-bindings/zmk/keys.h` from ZMK v0.3.0 (tag `edf5c08`, MIT, see its SPDX header), source: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/include/dt-bindings/zmk/keys.h

Never edit it. Replace it when the target ZMK version changes (AGENTS.md §3.4, ADR 0010); `src/catalog/keycodes.ts` parses it at load (spec 004 research R2).
