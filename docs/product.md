# Product

### 1.1 Problem

ZMK is configured through Devicetree and Kconfig. For a non-standard keyboard (handwired, odd key count, split, rotated thumb clusters) the user has to hand-write the kscan node, matrix transform, physical layout, keymap and Kconfig glue. Mistakes show up only at build time or on the device. Existing tools (keymap-editor, ZMK Studio) edit keymaps of boards that already exist; they do not create the board definition.

### 1.2 Users

- Builders of handwired / custom PCB keyboards who know what a matrix is but not Devicetree syntax.
- Existing ZMK users who want to reconfigure a keymap, combos, macros and options without reading every doc page.

### 1.3 Core flows (in order the user goes through them)

The UI is an app shell with a left tab bar and four workspaces (spec `specs/001-app-shell-ui/`): **Schematic** (flows 1–2; owns the project JSON config), **Bindings** (flow 3), **Firmware** (flow 4), **Export** (flow 5). App preferences (theme, grid, snap) live in the Settings window, not in the project.

1. **Layout** — place keys on a canvas: position, size, rotation (in `u`, 1u = 19.05 mm key pitch). Start empty or from a preset.
2. **Wiring** — choose controller board, split/unified, kscan type (matrix / direct / charlieplex), diode direction; assign every key a `(row, col)` in the electrical matrix and every row/col a GPIO pin. The UI shows the matrix as a grid and highlights conflicts (two keys on one cell, unassigned pins, a pin used twice).
3. **Keymap** — layers; per key a binding (`&kp`, `&mo`, `&lt`, `&mt`, `&trans`, …); combos, macros, custom behaviors (hold-tap, tap-dance, mod-morph, sticky keys), conditional layers.
4. **Settings** — ZMK Kconfig options (BLE, sleep, debounce, RGB, encoders, …) as typed toggles/inputs. Every option shows a one-line explanation and a link to the exact ZMK docs section.
5. **Export** — preview generated files, download as `.zip` in the directory layout of a `zmk-config` repo (`boards/shields/<name>/…` at repo root + `zephyr/module.yml`, as in the official template; `config/<name>.keymap`, `config/<name>.conf`, `build.yaml`). See `docs/zmk/shield-files.md`.

Project state is saved to `localStorage` automatically and can be exported/imported as a versioned JSON file.

### 1.4 Non-goals

- No firmware compilation in the browser; the user builds through their `zmk-config` GitHub Actions or locally.
- No flashing, no USB/BLE communication with the keyboard (ZMK Studio does that).
- No accounts, no server storage, no telemetry.
- No custom PCB/board definitions (only shields on top of existing ZMK boards).
