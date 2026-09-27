# Roadmap

Features in implementation order. One feature = one Spec Kit branch `NNN-short-name` = one `specs/NNN-short-name/` directory (AGENTS.md §6). Spec Kit numbers specs by counting existing `specs/` directories, so run `/speckit-specify` in this order to keep numbers aligned with this file.

Ordering rule: every feature ends with something a user can load, see and download. Generators come before editors: feature 003 generates real files from preset keyboards, so each later editor changes a project whose output is already visible in the export preview and covered by golden tests.

Each `/speckit-specify` prompt below describes what and why only. Technology choices go into `/speckit-plan`, which reads AGENTS.md §3–§4.

---

## Step 0 — one-time setup

1. Install Spec Kit into the existing repo (creates `.specify/` and `/speckit-*` commands in `.claude/commands/`):

   ```
   uvx --from git+https://github.com/github/spec-kit.git specify init --here --ai claude --script sh --force
   ```

2. Check that `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json` and `.claude/agents/` are unchanged (`git diff`). Spec Kit adds files; it must not replace ours.

3. In Claude Code, run:

   ```
   /speckit-constitution Derive the constitution from AGENTS.md in this repository; do not invent principles. Turn each item of AGENTS.md §7 "Principles" into one numbered, testable constitution principle with its rationale, keeping the original order and wording as close as possible: correct output over features (every generator change has a golden-file test), domain first, static only (no backend, no runtime network calls), user data is untrusted (schema-parsed imports that never corrupt the current project), every ZMK option explains itself with a docs link, minimal code, deterministic generators, accessible UI with a non-canvas alternative. Add a "Development workflow" section from AGENTS.md §8 "Rules for agents": read docs/zmk/ before producing ZMK syntax, stay inside the task, tests first for domain and generators, one exported concept per file in domain/ and generators/, no comments that repeat code, Conventional Commits, say when ZMK behavior is unclear instead of guessing. Add a "Constraints" section that references (not copies) AGENTS.md §3 architecture layers and dependency direction, §4 approved dependencies, and states that `make check` must pass before any task is done. Governance: AGENTS.md is the source of truth; when the constitution and AGENTS.md disagree, AGENTS.md wins and the constitution is amended in the same change. Version 1.0.0, ratified today.
   ```

4. Per feature: `/speckit-specify <prompt from below>` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`. Before `/speckit-implement`, run the `spec-reviewer` agent on the feature directory. After generator or catalog tasks, run `zmk-reviewer`.

---

## Overview

| # | Feature | Depends on |
|---|---|---|
| 001 | app-shell-ui | — |
| 002 | project-foundation | 001 |
| 003 | shield-generators | 002 |
| 004 | export-download | 003 |
| 005 | controller-boards | 003 |
| 006 | layout-editor | 002, 003 |
| 007 | matrix-wiring-editor | 005, 006 |
| 008 | keymap-editor | 003, 006 |
| **MVP** | custom keyboard from scratch → buildable zmk-config zip | |
| 009 | kconfig-settings | 004 |
| 010 | custom-behaviors | 008 |
| 011 | combos-macros-conditional-layers | 008, 010 |
| 012 | kle-import | 006 |
| 013 | encoders | 007, 008 |
| 014 | zmk-studio-support | 008, 009 |
| 015 | lighting-displays | 007, 009 |
| 016 | zmk-version-selection | all catalog features |
| 017 | build-verification | 004 |

Workspaces (from 001): **Schematic** holds the layout editor (006) and matrix/wiring editor (007) and owns the project JSON config (002); **Bindings** holds the keymap editor (008), custom behaviors (010) and combos/macros/conditional layers (011); **Firmware** holds kconfig-settings (009); **Export** holds the file preview (003) and download (004). Every feature reports its validation issues in the 001 problems panel, counted in the tab badge of the workspace that fixes them.

---

## 001 — app-shell-ui

**Specified:** [`specs/001-app-shell-ui/spec.md`](../specs/001-app-shell-ui/spec.md). Run `/speckit-clarify` onward from Step 0.4; no `/speckit-specify` prompt.

**Goal.** The app's frame, with no keyboard editing: a left tab bar with four workspaces (Schematic, Bindings, Firmware, Export) that later features fill.

**Scope (summary).** Workspaces Schematic and Bindings are canvas surfaces with a shared grid (size, visibility, snap), rulers, minimap, pan/zoom and a status bar; Schematic has a floating tool window (only Select available). Firmware and Export are placeholders. Settings window: theme Light/Dark/System, grid, snap, rulers, minimap. Project bar with name, save status and New/Open/Save/Undo/Redo shown but unavailable. Problems panel and per-tab badges (always zero here). Keyboard shortcuts with a help window. Interface preferences persist per browser, separate from project data.

---

## 002 — project-foundation

**Specified:** [`specs/002-project-foundation/spec.md`](../specs/002-project-foundation/spec.md).

**Deviations (spec 002).** There is no "saving" status, because `localStorage` writes are synchronous. A damaged stored value is copied to a backup key, after which the main key may be overwritten; the main key does not stay untouched until confirmation.

**Goal.** A project exists, survives reloads, can be saved to and loaded from a file, and every change can be undone. The project config is owned by the Schematic workspace; its file actions become the working New/Open/Save/Undo/Redo in the 001 project bar.

**In scope**
- `Project` with `schemaVersion`, project name and derived shield name (`[a-z_][a-z0-9_]*`, sanitized from the display name; keyboard name ≤16 bytes). Name shown and editable in the project bar.
- Autosave to `localStorage`; restore on load; the project bar save status reflects it.
- Project bar Save exports the project as a JSON file; Open imports a JSON file.
- Schema-validated parsing of imported files and stored state; migration chain `vN → vN+1` (starts with only v1).
- Undo/redo of every project change via project bar Undo/Redo and keyboard shortcuts (listed in the 001 shortcut help window).
- Project bar New: new project / reset project with confirmation.
- Name validation issues appear in the 001 problems panel under Schematic.

**Out of scope.** App shell and navigation (001), any keyboard content (keys, wiring, bindings), generators, multiple projects in storage.

**Acceptance criteria**
- Reloading the page restores the exact last project (deep-equal).
- Export then import yields a deep-equal project.
- Importing malformed JSON, a wrong shape, or a `schemaVersion` newer than supported shows a readable error naming the problem; the current project is unchanged.
- Corrupted `localStorage` on startup shows the error, starts a new project, and does not overwrite the corrupted value until the user confirms.
- A display name `My Corne v2!` yields shield name `my_corne_v2`; an empty or all-invalid name is a validation error.
- Undo after N changes restores each previous state in order; redo reapplies them; a new change after undo clears the redo stack.
- New, Open, Save, Undo and Redo in the project bar become available and work by mouse, keyboard and their shortcuts; Undo/Redo are unavailable while their history is empty; the shortcut help window lists the new shortcuts.
- The project bar shows the project name and a save status that reflects autosave (saved / saving / not saved with a reason).

**Relevant docs.** `docs/zmk/shield-files.md` (shield naming).

```
/speckit-specify Project foundation for ZMK Customizer, a tool that lets people describe a custom keyboard and download ZMK firmware configuration files. The app already has its frame: a Schematic workspace that owns the keyboard project, and a project bar with New, Open, Save, Undo and Redo that are shown but not yet available. This feature makes them work. Users need a single keyboard project that is never lost: it is saved automatically in the browser and restored when they come back, it can be saved to a file and opened again (to back it up, move it to another computer, or share it), and every edit can be undone and redone from the project bar or the keyboard. Project files from older versions of the tool must keep loading. A broken or foreign file must be rejected with a clear message and must never damage the project the user currently has open; damaged saved state must not be silently thrown away. The project has a display name, shown in the project bar, from which the keyboard's technical name is derived (lowercase letters, digits and underscores only); an unusable name is reported in the problems panel. The save status in the project bar tells the user whether their work is saved. The user can start a new empty project after confirming. Out of scope: keyboard content, file generation, managing several projects.
```

---

## 003 — shield-generators

**Goal.** Given a complete project, produce the ZMK shield files that upstream ZMK builds unchanged. Ship with preset projects equivalent to the upstream fixtures so output is real and golden-tested before any editor exists.

**In scope**
- Domain model for keys (index, `x, y, w, h, r, rx, ry`), matrix position, kscan (`gpio-matrix`, `gpio-direct`), diode direction, controller board reference, split halves, layers with structured bindings (behavior reference + parameters).
- Domain validation for all invariants in AGENTS.md §2; the 001 problems panel lists them, badged on the workspace that fixes each (Schematic for layout/wiring, Bindings for layers).
- Generators: `Kconfig.shield`, `Kconfig.defconfig`, overlay (unibody) or `.dtsi` + `_left/_right.overlay` (split), kscan node, `zmk,matrix-transform`, `zmk,physical-layout`, `.keymap` (layers with the bindings as stored), `.conf`, `.zmk.yml` metadata.
- Presets: the keyboards in `tests/fixtures/upstream/` (`corne` split, `reviung41` unibody) as project data; "start from preset" from the project bar New action.
- Golden tests comparing generator output with `tests/fixtures/upstream/`.
- Read-only preview of all generated files in the Export workspace.

**Out of scope.** Editing anything (features 005–008), zip download (004), charlieplex kscan, `behaviors {}` / `combos {}` / `macros {}` sections, encoders, displays, RGB.

**Acceptance criteria**
- For each preset, every generated file matches its golden file byte for byte.
- Generating twice from the same project gives identical bytes; output uses `\n`, ends with one trailing newline, has stable ordering.
- A project that violates any §2 invariant is reported with one error per violation and the Export preview shows the errors instead of files.
- Split preset produces left/right shields with the right half's column offset, and Kconfig that marks the left half as central.

**Open (resolve in `/speckit-clarify`)**
- Golden comparison: upstream files contain parts we do not generate (e.g. corne's display nodes, alternate 5-column layout) and upstream formatting. Proposed default: keep upstream files verbatim as reference and store our expected output beside them with a short `DIFFERENCES.md` listing each intentional deviation; tests compare against the expected output.
- Whether presets are bundled data or built by test helpers only.
- Whether `.zmk.yml` is generated at all (only used by ZMK's own repo tooling).
- Kconfig string escaping of the keyboard name (`"`, `\`, non-ASCII) in `Kconfig.defconfig`: read the Kconfig rules first (002 research R3).

**Relevant docs.** `docs/zmk/README.md`, `shield-files.md`, `kscan.md`, `matrix-transform.md`, `physical-layout.md`, `boards.md`, `keymap.md`.

```
/speckit-specify Generate ZMK shield files from a keyboard project. A keyboard project describes the keys (position, size, rotation), how they are wired (electrical matrix row and column per key, which controller pins the rows and columns use, diode direction, whether the keyboard is one piece or split into two halves, which controller board it sits on), and the keymap layers with one binding per key. From that, the tool must produce the exact set of files ZMK expects for a shield — board glue configuration, device description for each half, the keymap, and the configuration file — so that the result builds with official ZMK without manual edits. Correctness is the priority: output is identical every time for the same project, and it is checked against real keyboards from the official ZMK repository. Before any editor exists, users can start from preset projects equivalent to those official keyboards and see every generated file in the Export workspace. The tool checks the project first and lists every problem in the problems panel, under the workspace where it is fixed (duplicate key numbers, two keys on one matrix position, a pin used twice on one half, a layer with the wrong number of bindings, invalid names) instead of producing broken files. Out of scope: editing the project, downloading files, custom behaviors, combos, macros, encoders, lighting and displays.
```

---

## 004 — export-download

**Goal.** Download the generated files as a `.zip` that can be committed as a `zmk-config` repository and built by GitHub Actions.

**In scope**
- Zip in `zmk-config` layout: `boards/shields/<name>/…` + `zephyr/module.yml` at repo root (the legacy `config/boards/shields/` path is not used), `config/west.yml`, `config/<name>.keymap`, `config/<name>.conf`, `build.yaml` (one entry per half / board), optional `.github/workflows/build.yml` using ZMK's reusable user-config workflow.
- Download in the Export workspace, blocked while validation errors exist; the problems panel lists them with the workspace that fixes each.
- Per-file copy-to-clipboard and per-file download in the preview.

**Out of scope.** Pushing to GitHub, compiling firmware.

**Acceptance criteria**
- Unzipped archive of a preset equals the expected directory tree (golden test of the file list and every file).
- Zip bytes are deterministic (fixed timestamps, sorted entries).
- With a validation error the download control is disabled and the errors are listed.
- Works offline (no network request during export).

**Open.** Pinned ZMK revision used in `west.yml` and the workflow reference — owned by `docs/zmk/README.md`.

**Relevant docs.** `docs/zmk/README.md`, `shield-files.md`.

```
/speckit-specify Download the generated keyboard firmware configuration as a single archive laid out like a ZMK user configuration repository, so the user can put it on GitHub and have firmware built automatically. The archive contains the shield files in the place ZMK looks for them, the file that tells the build which ZMK version to use, the list of firmware builds (one per keyboard half and controller), and optionally the automation file that builds firmware on GitHub. Users can also copy or download single files from the preview. Downloading is not possible while the project has problems; the user sees the list of problems and the workspace where each one is fixed. Everything happens in the Export workspace. The same project must always produce the same archive. Out of scope: publishing to GitHub, compiling firmware in the tool.
```

---

## 005 — controller-boards

**Goal.** Pick the controller board and see its pins by the names printed on the board; pins in the project reference the board's connector so the overlay uses the right syntax.

**In scope**
- Catalog of supported boards (at least those used by presets, plus common ones: nice!nano v2, XIAO BLE (v0.3 ids, ADR 0010; see `docs/zmk/boards.md`), pro micro-compatible RP2040 boards), each with connector type, pin labels, reserved pins, `docsUrl`.
- Board selection per project (split: both halves share the board unless the catalog marks otherwise).
- Changing board: pins with the same connector position are kept; others become unassigned and are listed.
- Pin picker showing board labels.
- Board selection in the Schematic workspace; dropped pins listed in the problems panel.

**Out of scope.** Custom boards (AGENTS.md §1.4 non-goal), editing pin assignments (007).

**Acceptance criteria**
- Every catalog entry has a `docsUrl`; a test fails if one is missing.
- Switching between two pro-micro-footprint boards keeps all assignments; switching to a different footprint reports each dropped pin.
- Generated overlay references pins through the board connector exactly as in `docs/zmk/boards.md`.

**Open.** Final board list; whether split halves may use different boards.

**Relevant docs.** `docs/zmk/boards.md`, `shield-files.md`.

```
/speckit-specify Let the user choose the controller board their keyboard is built on and see its pins by the labels printed on the board. The tool knows the supported ZMK controller boards, their pin layouts and which pins are unavailable, and links each board to its ZMK documentation. When the user switches boards, pin choices that exist on the new board are kept and the ones that do not are listed as needing attention, never silently changed. Board choice lives in the Schematic workspace; dropped pins are reported in the problems panel. The generated files refer to pins the way ZMK expects for that board. Out of scope: defining new boards, assigning pins to rows and columns.
```

---

## 006 — layout-editor

**Goal.** Build any physical key layout visually in the Schematic workspace, with a table view that exposes every key property for keyboard and screen-reader users.

**In scope**
- Add, select (single/multi), move, resize, rotate (angle + origin), duplicate, delete keys; units in `u`. The tools become available in the Schematic tool window.
- Snap to the shared 001 grid (size and snap from settings), arrow-key nudge, numeric input for every property.
- Table/list view editing the same properties.
- Key order (= key index) shown on keys; "renumber by position" command.
- Start from blank or a preset.
- Deleting a key removes its binding from every layer and its matrix assignment; indices stay contiguous.

**Out of scope.** KLE import (012), wiring (007), bindings (008).

**Acceptance criteria**
- Every canvas operation has a keyboard or table equivalent (verified by a UI test for move and rotate).
- Rotated keys render and export `r, rx, ry` matching `docs/zmk/physical-layout.md` units.
- After deleting key k from an n-key project: n-1 keys, indices `0..n-2`, every layer has n-1 bindings, generated files still pass golden-style snapshot tests.
- Renumber by position orders keys top-to-bottom then left-to-right (rule documented in the spec, tested).

**Open.** Renumber rule for rotated thumb clusters; max key count.

**Relevant docs.** `docs/zmk/physical-layout.md`.

```
/speckit-specify A visual editor for the physical layout of a keyboard, filling the Schematic workspace and its tool window. Users building non-standard keyboards need to place keys anywhere: add, move, resize, rotate (around a chosen point), duplicate and delete keys, with optional snapping to the app's shared grid, measured in standard key units. Every key property can also be edited as numbers in a table, and every operation is possible with the keyboard alone, so the editor works without a mouse and with a screen reader. Each key shows its number, which is the order used by the keymap; the user can renumber keys by their position. Deleting a key keeps the rest of the project consistent: its bindings and wiring disappear and the remaining keys stay numbered without gaps. Users can start from an empty layout or a preset. Out of scope: importing layouts from other tools, wiring, key bindings.
```

---

## 007 — matrix-wiring-editor

**Goal.** In the Schematic workspace, describe how the switches are wired so the generated kscan node and matrix transform match the real hardware, with conflicts visible before export.

**In scope**
- Unibody/split; assign keys to halves (by x-position default, editable).
- Kscan type: matrix or direct; diode direction `col2row` / `row2col`.
- Matrix grid view: rows × columns, key placed per cell; assign key → (row, col) by click or table.
- Auto-assign rows/cols by physical position, per half.
- Pin assignment per row/column (matrix) or per key (direct), per half, using the 005 pin picker.
- Conflict highlighting on the canvas and in the problems panel (Schematic badge): two keys in one cell, unassigned key/row/col/pin, pin used twice on one half, pin reserved by board.
- Right half column offset derived for split.

**Out of scope.** Charlieplex (later), encoders (013).

**Acceptance criteria**
- Auto-assign on each preset layout reproduces the preset's matrix (or a documented equivalent), tested.
- Each conflict type from AGENTS.md §2 appears in the problems panel and on the affected key/pin.
- Switching diode direction regenerates the kscan node per `docs/zmk/kscan.md`; golden tests for both directions.
- Direct-kscan project generates a valid `gpio-direct` node (golden test).

**Open.** Whether charlieplex gets its own feature; heuristic for auto-assign on rotated clusters.

**Relevant docs.** `docs/zmk/kscan.md`, `matrix-transform.md`, `boards.md`, `shield-files.md`.

```
/speckit-specify A wiring editor in the Schematic workspace that describes how the keyboard's switches are connected to the controller. The user states whether the keyboard is one piece or split, which keys belong to which half, how switches are read (a row/column matrix with diodes in a chosen direction, or one pin per switch), which matrix row and column each key sits on, and which controller pin each row, column or switch uses. The matrix is shown as a grid so the user can see where every key is; rows and columns can be assigned automatically from key positions and then adjusted. Problems are shown where they occur and in the project problem list: two keys on the same matrix position, keys or rows without an assignment, a pin used twice on one half, a pin the board reserves. The generated files update to match. Out of scope: charlieplex wiring, rotary encoders.
```

---

## 008 — keymap-editor

**Goal.** In the Bindings workspace, edit layers and per-key bindings with built-in ZMK behaviors, using a searchable keycode picker instead of typed codes.

**In scope**
- Add, rename, reorder, delete layers (reorder updates layer references in bindings).
- Per key binding: `&kp` (keycode picker: search, categories, modifier combos like `LC(A)`), `&trans`, `&none`, `&mo`, `&lt`, `&tog`, `&to`, `&sl`, `&mt`, `&bt`, `&out`, `&sys_reset`, `&bootloader` — exact list from `docs/zmk/behaviors.md`.
- Keycode and behavior catalog with `docsUrl` per entry.
- Keymap view on the physical layout plus a list alternative.
- Validation: parameter count/type per behavior, layer references exist; issues go to the problems panel (Bindings badge).

**Out of scope.** User-defined behaviors (010), combos/macros/conditional layers (011).

**Acceptance criteria**
- Keymap generated for each preset after round-tripping through the editor (no edits) is byte-identical to its golden file.
- Deleting a layer referenced by `&mo` produces a validation error on each referencing key; reordering updates references.
- Keycode picker finds keys by name, alias, and category, keyboard-only.
- Every behavior and keycode in the catalog has a `docsUrl` (test).

**Relevant docs.** `docs/zmk/keymap.md`, `behaviors.md`.

```
/speckit-specify A keymap editor that fills the Bindings workspace. Users define layers and choose what each key does on each layer: send a key (picked from a searchable list of key names, optionally with modifiers), switch or hold layers, act as a modifier or layer when held and a key when tapped, pass through to the layer below, do nothing, manage Bluetooth profiles and output, reset or enter the bootloader. Each choice explains itself briefly and links to the ZMK documentation. Layers can be added, renamed, reordered and deleted; references to layers stay correct when layers move, and references to deleted layers are reported in the problems panel. The keymap is shown on the physical layout and as an accessible list. Out of scope: user-defined behaviors, combos, macros, conditional layers.
```

---

## — MVP line —

After 008 a user can design a non-standard keyboard from nothing, wire it, map it, and download a zmk-config that builds. Everything below adds reach, not the core promise.

---

## 009 — kconfig-settings

**Goal.** In the Firmware workspace, set common ZMK Kconfig options through typed controls, each explained and linked.

**In scope.** Catalog of options from `docs/zmk/kconfig-options.md` (BLE, sleep/idle, debounce, USB/BLE output, battery reporting, split options), typed controls (bool/int/enum/string with range), default shown and only non-default values written to `.conf`; per-option `docsUrl`; search.

**Out of scope.** Options belonging to encoders/RGB/displays (their own features), arbitrary free-form Kconfig lines (open).

**Acceptance criteria.** Only changed options appear in `.conf`, sorted; out-of-range values are validation errors in the problems panel (Firmware badge); every option has description + `docsUrl` (test); golden test with a fixed option set.

**Open.** Whether to allow a raw "extra Kconfig lines" field; which options go to `.conf` vs `Kconfig.defconfig`.

**Relevant docs.** `docs/zmk/kconfig-options.md`.

```
/speckit-specify Firmware settings for the keyboard, filling the Firmware workspace: Bluetooth, sleep and idle timeouts, debounce, output selection, battery reporting, split keyboard options and other common ZMK build options, each shown as a proper control (switch, number with allowed range, choice list) with a one-line explanation, its default value, and a link to the exact ZMK documentation section. Users can search settings. Only settings the user changed are written to the generated configuration, and invalid values are reported in the problems panel. Out of scope: settings for encoders, lighting and displays.
```

---

## 010 — custom-behaviors

**Goal.** In the Bindings workspace, define user behaviors (hold-tap, tap-dance, mod-morph, sticky key/layer tuning) and bind them to keys.

**In scope.** Create/edit/delete behaviors with typed properties per `docs/zmk/behaviors.md`; generated `behaviors {}` section; behaviors appear in the 008 picker; deleting a used behavior is a validation error in the problems panel listing the keys.

**Out of scope.** Macros, combos (011).

**Acceptance criteria.** Golden test per behavior type; label names sanitized and unique; timing properties validated; every property has `docsUrl`.

**Relevant docs.** `docs/zmk/behaviors.md`, `keymap.md`.

```
/speckit-specify In the Bindings workspace, let users create their own key behaviors on top of the built-in ones: a key that does one thing when tapped and another when held (with tunable timing and decision rules), a key that does different things when tapped several times, a key that changes what it sends when a modifier is held, and adjusted sticky keys or sticky layers. Each option explains itself and links to the ZMK documentation. User behaviors can be bound to keys like built-in ones; removing a behavior that is still in use is reported in the problems panel with the affected keys. Out of scope: macros and combos.
```

---

## 011 — combos-macros-conditional-layers

**Goal.** Combos, macros and conditional layers, the remaining keymap sections, in the Bindings workspace.

**In scope.** Combos: pick key positions on the layout, binding, timeout, layer filter. Macros: ordered steps (tap/press/release, waits), bound like behaviors. Conditional layers: if-layers → then-layer. Generated `combos {}`, `macros {}`, `conditional_layers {}`. Key deletion/renumbering keeps combo positions correct.

**Acceptance criteria.** Golden test per section; combo referencing a deleted key is a validation error in the problems panel; renumbering keys updates combo positions (test); macro and combo names sanitized and unique.

**Relevant docs.** `docs/zmk/combos-macros-layers.md`, `behaviors.md`.

```
/speckit-specify Combos, macros and conditional layers, in the Bindings workspace. A combo triggers an action when several keys are pressed together; the user picks the keys on the keyboard picture, the action, the time window and the layers where it is active. A macro is a named sequence of key presses, releases and pauses that can be bound to a key. A conditional layer turns on automatically when a chosen set of other layers is active. Each option links to the ZMK documentation. When keys are deleted or renumbered, combos stay correct or are reported in the problems panel. Out of scope: other behavior types.
```

---

## Later / optional

Order among these is flexible; pick by user demand.

### 012 — kle-import
Import a Keyboard Layout Editor JSON into the Schematic physical layout (positions, sizes, rotations). Out: KLE colors/legends beyond a label. Acceptance: fixture KLE files for the presets import to layouts equal to the preset layouts. Open: whether KLE parsing needs a dependency (ADR required). Docs: `docs/zmk/physical-layout.md`.

```
/speckit-specify Import a keyboard layout created in the popular Keyboard Layout Editor website into the Schematic workspace so users do not have to redraw keys they already designed. Key positions, sizes and rotations are taken over; anything the tool cannot represent is listed after import. A file that cannot be read is rejected with a clear message and the current project stays unchanged.
```

### 013 — encoders
Rotary encoders: pins per half and steps (Schematic), sensor bindings per layer (Bindings). Requires a new `docs/zmk/encoders.md` page first. Acceptance: golden test against an upstream shield with encoders.

```
/speckit-specify Support rotary encoders: in the Schematic workspace the user adds encoders to the layout, assigns their pins and sets their resolution; in the Bindings workspace they choose per layer what turning left and right does. Each option links to the ZMK documentation.
```

### 014 — zmk-studio-support
Enable ZMK Studio for the generated shield (Kconfig, build snippet, unlock binding). Settings in the Firmware workspace. Requires a new `docs/zmk/studio.md` page. Physical layout from 003 is already a prerequisite Studio needs.

```
/speckit-specify Let users make their keyboard work with ZMK Studio so they can change the keymap later without rebuilding firmware. The user turns it on in the Firmware workspace, sees what it requires (for example a key that unlocks editing), and the generated configuration includes everything Studio needs.
```

### 015 — lighting-displays
RGB underglow, backlight, OLED / nice!view: pins in Schematic, options in Firmware. Large surface; split into separate specs when started. Requires new `docs/zmk/` pages.

```
/speckit-specify Support keyboard lighting and small displays: RGB underglow, single-color backlight and common display modules, with their pins in the Schematic workspace and their settings in the Firmware workspace, each linked to the ZMK documentation.
```

### 016 — zmk-version-selection
Choose a target ZMK version (today fixed to v0.3, ADR 0010); catalog and fixtures per version. Depends on catalog structure proven by 005–011. Open: how many versions to support at once.

```
/speckit-specify Let users choose, in the Firmware workspace, which ZMK release their configuration targets, so keyboards stay buildable when ZMK changes. Options and behaviors not available in the chosen release are hidden or reported in the problems panel.
```

### 017 — build-verification
`make zmk-build` target: compile the generated shield for each preset inside the `zmkfirmware/zmk-build-arm` Docker image, as a developer/CI check (not a product feature, the app stays static). Could be pulled forward to right after 004 if golden tests prove insufficient. Owned by Makefile/CI, not `src/`.

```
/speckit-specify A developer check that proves the generated files really build: for every preset keyboard, generate the configuration and compile the firmware with the official ZMK build environment, failing when any build fails. It runs locally and in continuous integration, never inside the app.
```

### Not planned
Parsing existing ZMK shield files back into a project (Devicetree parsing), custom board definitions (§1.4), in-browser compilation or flashing (§1.4).

---

## Open decisions (AGENTS.md is silent)

- ~~Schema versioning before first release~~ — resolved: v1 frozen at merge of 002; every later change adds a migration.
- ~~Undo history~~ — resolved: session only, 100 steps (spec 002).
- Hosting target for `dist/` and app CI provider (GitHub Actions assumed by the repo layout, not stated).
- Canvas arrow keys (006 layout-editor): spec 001 makes plain arrows pan the canvas; accessibility.md wants arrows to move focus between keys once keys exist. Decide in 006: e.g. arrows move key focus/selection when a key is focused and pan otherwise, or pan moves to Alt+Shift+arrows.
- Charlieplex kscan: own feature or part of 007.
- Split halves on different boards.
- Raw "extra Kconfig lines" escape hatch (009).
