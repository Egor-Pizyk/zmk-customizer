# Matrix transform — `zmk,matrix-transform`

Target: ZMK **v0.3.0** (`edf5c08`). Verified 2026-09-27: `zmk,matrix-transform.yaml`, `matrix_transform.h`, `matrix_transform.c`, `matrix.h` and the Studio `BUILD_ASSERT` in `physical_layouts.c` are identical at v0.3.0 and `main` @ `5b51501`; nothing on this page is version-specific. zmk.dev new-shield/physical-layouts pages live under `docs/development/hardware-integration/` at v0.3.0 (same content). See [README](README.md#pinned-version).

Maps **key position** (index in keymap `bindings`, combo `key-positions`, physical layout `keys`) → electrical `(row, col)` of the kscan.

## Properties

| Property | Type | Required | Default | Meaning |
|---|---|---|---|---|
| `rows` | int | yes | — | rows of the (combined) matrix |
| `columns` | int | yes | — | columns of the (combined) matrix. **Used as the lookup stride** (`row * columns + col`), so must be > every column index in `map` |
| `map` | array | yes | — | one `RC(row, col)` per key position, in key-position order |
| `col-offset` | int | no | 0 | added to the kscan column **before** lookup (per half) |
| `row-offset` | int | no | 0 | added to the kscan row before lookup |

Needs `#include <dt-bindings/zmk/matrix_transform.h>` at the top of the file that uses `RC()`:

```c
#define KT_ROW(item) (item >> 8)
#define KT_COL(item) (item & 0xFF)
#define RC(row, col) (((row) << 8) + (col))
```

Limits from source (`app/src/matrix_transform.c`): `rows`, `columns`, `col-offset`, `row-offset` stored as `uint8_t` (0–255); `RC` packs col in 8 bits. Unmapped cells pressed at runtime → ignored (`-EINVAL`).

## Semantics

- kscan emits `(row, col)` = indices into `row-gpios` / `col-gpios` (direct: row 0, col = index in `input-gpios`; charlieplex: row = driving pin index, col = reading pin index).
- ZMK adds `row-offset`/`col-offset`, then finds the position `i` such that `map[i] == RC(row, col)`.
- Keymap length (`ZMK_KEYMAP_LEN`) = max `map` length over all enabled `zmk,physical-layout` nodes; with no physical layouts, the `map` length of `chosen zmk,matrix-transform`; with no transform, `rows × cols` of the kscan (`app/include/zmk/matrix.h`).
- Each layer's `bindings` is expected to have exactly `ZMK_KEYMAP_LEN` entries in the same order as `map` ("match the order of the keys in the matrix transform exactly, left to right, top to bottom"). More entries than `ZMK_KEYMAP_LEN` fails to compile (static array initializer).
- Whitespace/newlines in `map` are cosmetic; it's a flat array. Convention: lay it out like the physical keyboard, with a comment ASCII diagram.
- Transform lets keymap order follow physical order regardless of wiring (folded/duplex matrices, thumb clusters, skipped cells).

## Unibody example

```dts
#include <dt-bindings/zmk/matrix_transform.h>

/ {
    default_transform: keymap_transform_0 {
        compatible = "zmk,matrix-transform";
        columns = <3>;   // length of col-gpios
        rows = <3>;      // length of row-gpios
        map = <
            RC(0,0) RC(0,1) RC(0,2)
            RC(1,0) RC(1,1) RC(1,2)
            RC(2,0) RC(2,1) RC(2,2)
        >;
    };
};
```

Folded-matrix example (reviung41, 7×6, right half wired on rows 3–5, thumbs on row 6): see `tests/fixtures/upstream/reviung41/reviung41.overlay`.

## Split

- One transform in `<name>.dtsi` covering the **whole** keyboard: `columns` = left cols + right cols (for left/right halves with equal rows).
- Peripheral overlay sets the offset so its local col 0 lands on the right block:

```dts
// my_keyboard.dtsi
default_transform: keymap_transform_0 {
    compatible = "zmk,matrix-transform";
    columns = <6>;
    rows = <3>;
    map = <
        RC(0,0) RC(0,1) RC(0,2)     RC(0,3) RC(0,4) RC(0,5)
        RC(1,0) RC(1,1) RC(1,2)     RC(1,3) RC(1,4) RC(1,5)
        RC(2,0) RC(2,1) RC(2,2)     RC(2,3) RC(2,4) RC(2,5)
    >;
};

// my_keyboard_right.overlay
#include "my_keyboard.dtsi"
&default_transform {
    col-offset = <3>;   // number of columns on the left half
};
```

- 3+ parts: each further peripheral's `col-offset` = sum of columns of central + all previous parts; `row-offset` may be used instead/in addition.
- Every transform the peripheral might use needs the offset (corne sets `col-offset = <6>` on both `default_transform` and `five_column_transform`).
- Left/right `col-gpios` order: right half usually lists pins mirrored so that its local col 0 is the innermost/leftmost physical column of the right half (corne: left `21 20 19 18 15 14`, right `14 15 18 19 20 21`). Generator must emit per-half pin lists exactly as wired; the transform only sees indices.

## Multiple transforms

Allowed (one per physical layout). Selection is via the physical layout's `transform` property. Legacy `chosen { zmk,matrix-transform = &x; }` still works, but if it is set, physical layouts are ignored (build warning) and **ZMK Studio builds fail** (`BUILD_ASSERT` in `app/src/physical_layouts.c`). Generators: do **not** emit `zmk,matrix-transform` chosen; use `zmk,physical-layout`.

Sources: https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/dts/bindings/zmk%2Cmatrix-transform.yaml · https://github.com/zmkfirmware/zmk/blob/v0.3.0/app/src/physical_layouts.c · https://zmk.dev/docs/config/layout#matrix-transform · https://zmk.dev/docs/hardware-integration/new-shield#matrix-transform · https://zmk.dev/docs/features/studio#adding-zmk-studio-support-to-a-keyboard · https://github.com/zmkfirmware/zmk/blob/main/app/dts/bindings/zmk%2Cmatrix-transform.yaml · https://github.com/zmkfirmware/zmk/blob/main/app/include/dt-bindings/zmk/matrix_transform.h · https://github.com/zmkfirmware/zmk/blob/main/app/src/matrix_transform.c · https://github.com/zmkfirmware/zmk/blob/main/app/include/zmk/matrix.h · https://github.com/zmkfirmware/zmk/blob/main/app/boards/shields/corne/corne.dtsi
