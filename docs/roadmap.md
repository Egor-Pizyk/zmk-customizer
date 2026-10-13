# Roadmap

Features in implementation order. One feature = one Spec Kit branch `NNN-short-name` = one `specs/NNN-short-name/` directory (AGENTS.md §6). Numbers of specified features (a `specs/NNN-*` directory exists) are immutable. A feature added out of order takes the next number and every planned, not yet specified feature after it moves up; the added feature's section records the shift, because older specs keep the old numbers. Spec Kit numbers specs by counting existing `specs/` directories, so run `/speckit-specify` in this order to keep numbers aligned with this file.

Ordering rule: every feature ends with something a user can load, see and download. Generators come before editors: feature 009 generates real files from preset keyboards, so each later editor changes a project whose output is already visible in the export preview and covered by golden tests. Exceptions, added on user request: 003 schematic, the 004/005 bindings editors, the 006 Action panel rework, 007 layers and 008 diodes come before 009; they store project data only, and 009 generates files from it.

Each `/speckit-specify` prompt below describes what and why only. Technology choices go into `/speckit-plan`, which reads AGENTS.md §3–§4.

---

## Step 0 — one-time setup

1. Install Spec Kit into the existing repo (creates `.specify/` and `/speckit-*` skills in `.claude/skills/`):

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
| 003 | schematic-switches-wires | 002 |
| 004 | bindings-keycaps | 003 |
| 005 | key-behaviors | 004 |
| 006 | action-panel-rework | 004, 005 |
| 007 | layers | 006 |
| 008 | schematic-diodes | 003, 007 |
| 009 | shield-generators | 002, 003, 004, 005, 007, 008 |
| 010 | export-download | 009 |
| 011 | controller-boards | 009 |
| 012 | layout-editor | 002, 009 |
| 013 | matrix-wiring-editor | 011, 012 |
| 014 | keymap-editor | 009, 012 |
| **MVP** | custom keyboard from scratch → buildable zmk-config zip | |
| 015 | kconfig-settings | 010 |
| 016 | custom-behaviors | 014 |
| 017 | combos-macros-conditional-layers | 014, 016 |
| 018 | kle-import | 012 |
| 019 | encoders | 013, 014 |
| 020 | zmk-studio-support | 014, 015 |
| 021 | lighting-displays | 013, 015 |
| 022 | zmk-version-selection | all catalog features |
| 023 | build-verification | 010 |

Workspaces (from 001): **Schematic** holds the schematic of keys and wires (003), switch diodes (008), the layout editor (012) and matrix/wiring editor (013) and owns the project JSON config (002); **Bindings** holds bindings keycaps (004), key behaviors (005), the Action panel (006), layers (007), the keymap editor (014), custom behaviors (016) and combos/macros/conditional layers (017); **Firmware** holds kconfig-settings (015); **Export** holds the file preview (009) and download (010). Every feature reports its validation issues in the 001 problems panel, counted in the tab badge of the workspace that fixes them.

---

## 001 — app-shell-ui

**Specified:** [`specs/001-app-shell-ui/spec.md`](../specs/001-app-shell-ui/spec.md). Run `/speckit-clarify` onward from Step 0.4; no `/speckit-specify` prompt.

**Goal.** The app's frame, with no keyboard editing: a left tab bar with four workspaces (Schematic, Bindings, Firmware, Export) that later features fill.

**Scope (summary).** Workspaces Schematic and Bindings are canvas surfaces with a shared grid (size, visibility, snap), rulers, pan/zoom and a status bar; Schematic has a floating tool window (only Select available). Firmware and Export are placeholders. Settings window: theme Light/Dark/System, grid, snap, rulers. Project bar with name, save status and New/Open/Save/Undo/Redo shown but unavailable. Problems panel and per-tab badges (always zero here). Keyboard shortcuts with a help window. Interface preferences persist per browser, separate from project data.

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

## 003 — schematic-switches-wires

**Specified:** [`specs/003-schematic-switches-wires/spec.md`](../specs/003-schematic-switches-wires/spec.md). Added 2026-09-27 on user request; every later feature was renumbered +1 (specs 001 and 002 still use the old numbers: their "roadmap N" for N ≥ 003 is N+1 here).

**Goal.** Draw the keyboard as an electrical schematic in the Schematic workspace: keys drawn as MX switches seen from above (two pins each), orthogonal wires between pins, crossings that are connected by default and can be insulated, and free wire ends attached to a generic board pin (P0–P31). Everything is part of the project.

**Scope (summary).** Key and Wire tools; parts list as the keyboard/screen-reader path; checks for unconnected pins, free ends, board-pin conflicts, shorts and overlaps. A key here is the same `Key` the layout editor (012) later extends with size and rotation; the matrix/wiring editor (013) derives kscan from the schematic's nets. Out of scope: generating ZMK files, real controller boards (011), diodes.

---

## 004 — bindings-keycaps

**Specified:** [`specs/004-bindings-keycaps/spec.md`](../specs/004-bindings-keycaps/spec.md). Added 2026-09-28 on user request together with 007; every later feature was renumbered +2 (specs 001–003 still use the old numbers: their "roadmap N" for N ≥ 004 is N+2 here).

**Goal.** Fill the Bindings workspace: the schematic's keys drawn as keycaps over its dimmed wires, a floating Action panel to choose each key's action (kind → action, with search, description and v0.3 docs link), readable legends, multi-select, copy/paste and a table alternative. One layer (Base); bindings are stored per layer and keyed by key id.

**Scope (summary).** Built-in behaviors `&kp` (full keycode catalog parsed from the vendored v0.3 `keys.h`, with modifier toggles), `&mt`, `&sk`, `&kt`, `&trans`, `&none`, `&caps_word`, `&key_repeat`, `&gresc`, `&bt`, `&out`, `&sys_reset`, `&bootloader`. Out of scope: layers and layer behaviors (007), macros, user behaviors, behaviors needing Kconfig (RGB, backlight, mouse, soft-off, Studio), keymap generation (009).

**Acceptance criteria.** The spec's user stories and success criteria (SC-001–SC-008); in short: bindings survive reload, file round trip and key deletion in Schematic; unknown key names and out-of-range profiles are reported under Bindings; every behavior and keycode links to the v0.3 docs.

**Relevant docs.** `docs/zmk/keymap.md` §3–4, `docs/zmk/behaviors.md` §1–2.

---

## 005 — key-behaviors

**Specified:** [`specs/005-key-behaviors/spec.md`](../specs/005-key-behaviors/spec.md). Added 2026-09-29 on user request; it took number 005 from layers, which moved to 007 on 2026-10-06 (spec 005 and earlier specs still use the old numbers).

**Goal.** Every behavior the project stores is choosable in the Bindings Action panel, plus the self-contained tap-dance and mod-morph behaviors that exist in ZMK v0.3.

**Scope (summary).** Pass-through, do nothing, caps word, key repeat, grave/escape, Bluetooth, output, reset and bootloader as selectable behaviors; tap-dance (taps + pause) and mod-morph (normal, morphed, trigger modifiers) stored in bindings and validated under Bindings. Out of scope: layer behaviors (007), combos, macros, conditional layers, behaviors needing Kconfig.

**Relevant docs.** `docs/zmk/behaviors.md` §2, §3.2–3.3.

---

## 006 — action-panel-rework

**Specified:** [`specs/006-action-panel-rework/spec.md`](../specs/006-action-panel-rework/spec.md). Added 2026-09-29 on user request; every planned feature after it was renumbered on 2026-10-06 (shield-generators 006 → 008, layers 005 → 007, every later N → N+2; specs 001–005 still use the old numbers).

**Goal.** The Action panel shows the selected key's binding as it reads in ZMK (`&mt LEFT_SHIFT A`), one button per part (behavior tag and slots); clicking a part opens one grouped, searchable list for exactly that part, whose rows show the keycap symbol, name, description, the ZMK code with aliases and a v0.3 docs link. Model: keymap-editor (nickcoutsos), plus groups, codes and docs links.

**Scope (summary).** Slots per behavior; `&sk`/`&kt`/`&mt` chosen like other behaviors keeping the key (replaces "Press mode" and "When held"); drafts for behaviors whose values must be picked first, stored in one undo step; behavior tag on canvas keycaps. Domain unchanged except switching among key behaviors. Out of scope: new behaviors, layer slots (007).

---

## 007 — layers

Was 005 until 2026-10-06; on user request it comes before the shield generators (009), which then emit every layer.

**Goal.** Add, rename, reorder and delete keymap layers in the Bindings workspace (layer tabs above the canvas, keyboard reachable), edit each layer's bindings with the existing Action panel, and offer the layer behaviors `&mo`, `&lt`, `&tog`, `&to`, `&sl` in its behavior picker, each with a layer slot (006). References to a layer follow it when layers are reordered; references to a deleted layer are reported in the problems panel (Bindings badge).

**What exists (read the code, not this list).** `Layer = { id, name, bindings }` and `project.layers` (≥ 1, always one Base layer today); validation already walks every layer; the Bindings UI, copy/paste and the Keys table are fixed to `layerIndex: 0`; spec 005 FR-015 rejects layer behaviors while the project has one layer, which this feature replaces.

**Acceptance criteria.** Layers can be added, renamed, reordered and deleted, each one undo step; every layer's bindings survive reload and file round trip; reordering keeps every `&mo`/`&lt`/`&tog`/`&to`/`&sl` pointing at the same layer (test); deleting a referenced layer reports each referencing key under Bindings; layer names are unique and valid as Devicetree node names; the canvas, Keys table, copy/paste and auto-advance work on the open layer; every layer behavior links to the v0.3 docs.

**Open (resolve in `/speckit-clarify`)**
- Store layer references by `Layer.id` (reorder needs no rewrite; the generator turns them into indices) or by index (rewrite on reorder).
- What a new layer's keys hold: `&trans` (common in upstream keymaps) or nothing (`&none`).
- Maximum number of layers in ZMK v0.3: not in `docs/zmk/` yet; verify and add it there before deciding.
- How layer names map to the generated node name and the `display-name` (`docs/zmk/keymap.md` §2).
- Whether a pass-through key shows the legend of the layer below on the canvas.
- Schema change: new binding kinds and a layer reference; check how spec 005 handled `schemaVersion` and migrations, and follow AGENTS.md §3.2.

**Out of scope.** Conditional layers (017), layer locking (main only), tuning `&lt`/`&sl` properties (016), encoders' sensor bindings (019), generating files (009).

**Relevant docs.** `docs/zmk/keymap.md` §2, `docs/zmk/behaviors.md` §3.1, §3.4, §3.8.

```
/speckit-specify Let users build a keymap with several layers in the Bindings workspace. They add, rename, reorder and delete layers from tabs above the keyboard, switch between them, and set what each key does on the open layer with the existing Action panel; copy/paste, multi-select, the keys table and automatic next key work on the open layer. The behavior picker gains the ZMK layer behaviors: hold a layer while pressed, a layer on hold and a key on tap, toggle a layer, switch to a layer, and a one-shot sticky layer; each asks which layer and links to the ZMK documentation. A reference to a layer keeps pointing at that layer when layers are reordered; deleting a layer that keys still use is allowed and every such key is reported in the problems panel under Bindings. Layer names must be unique and usable in the generated keymap. Everything survives reload, undo and saving to a file. Out of scope: conditional layers, layer locking, tuning layer-tap timing, encoders, generating files.
```

---

## 008 — schematic-diodes

**Specified:** [`specs/008-schematic-diodes/spec.md`](../specs/008-schematic-diodes/spec.md). Added 2026-10-12 on user request; planned features 008–022 shift to 009–023. Earlier specifications keep their historical numbers.

**Goal.** Add one series diode to either switch pin using buttons beside pins, disable the opposite button, draw a minimal symbol and persist pin/polarity. Parts provides keyboard controls and polarity reversal. Wire endpoints and external net identities remain unchanged. The future generator uses diode current direction to constrain matrix orientation and rejects contradictions.

**Acceptance criteria.** One diode per key enforced in domain; toggle and reversal each undoable; symbol follows key; v1–v3 files migrate without adding diodes; malformed diode data rejected; save/reload preserves both pins and polarities.

**Out of scope.** Free-standing diodes and ZMK file generation.

---

## 009 — shield-generators

**Implemented (2026-10-12):** [specification](../specs/009-shield-generators/spec.md), [validation evidence](../specs/009-shield-generators/validation.md). Fixed nice_nano_v2 with exposed raw gpio0 pins; every key requires a saved diode. Five deterministic files, complete six-key preset and readonly Export preview. Schema stays v4; firmware compilation and browser verification are not claimed.

**Goal.** Given a complete project as stored today (`src/domain/types.ts` v4), produce the ZMK shield files that upstream ZMK v0.3 builds unchanged. Ship with a preset unibody project so output is real and golden-tested.

**What the model holds today (read `src/domain/types.ts`, not the list below from memory).**
- Keys: `id`, `xU`, `yU`, optional series diode (pin + cathode side) — no size, rotation, matrix cell, half. Array order is the key index (`0..n-1`) used by the keymap.
- Wiring: schematic nets (`getNets`) with generic board pins P0–P31; no controller boards (011), no kscan type or row/column naming, no split; optional key diodes store current direction.
- Keymap: layers array with layer behaviors (007 layers, done first), bindings keyed by key id, kinds `kp/mt/sk/kt/trans/none/caps_word/key_repeat/gresc/bt/out/sys_reset/bootloader` **plus `tap_dance` and `mod_morph`** (specs/005-key-behaviors) which need generated `behaviors {}` nodes.
- Validation preconditions for generation (all Schematic): no `keys-in-parallel`, no `net-without-board-pin`, no `key-shorted`, no `board-pins-shorted`, every pin connected.

**In scope**
- RC derivation: bipartite partition of nets (every key spans two nets) with a deterministic orientation rule; non-bipartite projects are export errors, not guesses.
- Generators (unibody only): `Kconfig.shield`, `Kconfig.defconfig`, `<name>.overlay` (kscan `gpio-matrix` node with `diode-direction` derived consistently from stored diode polarity; a documented policy for diode-free projects), `zmk,matrix-transform`, `zmk,physical-layout` with `keys`, `<name>.keymap` (every layer in order, all stored binding kinds incl. layer behaviors and `tap_dance`/`mod_morph` behavior nodes, identical definitions emitted once), `<name>.conf` (empty/defaults).
- Key order everywhere (transform `map`, layout `keys`, keymap `bindings`) = key array order.
- Physical-layout cells = `Math.round(value * 100)`; negative `xU`/`yU` emitted as-is in parentheses (cells are `int16`, `docs/zmk/physical-layout.md`) — no normalization.
- Generic board pins P0–P31 mapped to DT by one documented rule (resolve exact syntax in `/speckit-clarify` against `docs/zmk/boards.md`).
- Preset: one unibody project as data; "start from preset" from the project bar New action.
- Golden tests comparing generator output with expected files derived from `tests/fixtures/upstream/` (verbatim upstream + `DIFFERENCES.md` per deviation).
- Read-only preview of all generated files in the Export workspace; export blocked with the issue list while any precondition fails.

**Out of scope.** Split halves + `col-offset` (no model yet; with 011/013), matrix editor / editable diode direction (013), controller boards (011), combos/macros/conditional layers (not stored), charlieplex/direct kscan (no model yet), Kconfig settings (015), encoders/displays/RGB, zip download (010).

**Acceptance criteria**
- For the preset, every generated file matches its golden file byte for byte; twice = identical bytes; `\n`, one trailing newline, stable ordering.
- A project violating any precondition above is reported with one error per violation and the Export preview shows the errors instead of files.
- Tap-dance and mod-morph bindings from the current model generate valid `behaviors {}` + keymap entries (golden-covered).
- Several layers with layer behaviors generate one keymap layer node each, references resolved to layer indices (golden-covered).

**Open (resolve in `/speckit-clarify`)**
- Bipartition orientation rule (which net set becomes rows) and naming of generated row/col indices.
- Exact DT syntax for generic board pins P0–P31.
- Diode polarity constrains row/column orientation; reject incompatible current directions. Resolve the explicit policy for keys without diodes until 013 adds wiring configuration.
- Layer `display-name` over 19 UTF-8 bytes breaks in Studio builds (`docs/zmk/keymap.md` §2): cap the emitted name or raise `CONFIG_ZMK_KEYMAP_LAYER_NAME_MAX_LEN`.
- Layer node names have no length cap yet (`toLayerNodeName`); the Devicetree spec allows 1–31 characters, enforcement by dtc unverified (`docs/zmk/keymap.md` §1).
- Golden comparison: upstream files contain parts we do not generate and upstream formatting. Proposed default: keep upstream files verbatim as reference and store our expected output beside them with a short `DIFFERENCES.md` listing each intentional deviation; tests compare against the expected output.
- Whether presets are bundled data or built by test helpers only.
- Whether `.zmk.yml` is generated at all (only used by ZMK's own repo tooling).
- Kconfig string escaping of the keyboard name (`"`, `\`, non-ASCII) in `Kconfig.defconfig`: read the Kconfig rules first (002 research R3).

**Relevant docs.** `docs/zmk/README.md`, `shield-files.md`, `kscan.md`, `matrix-transform.md`, `physical-layout.md`, `boards.md`, `keymap.md`, `behaviors.md`.

```
/speckit-specify Generate ZMK shield files from a keyboard project as stored (keys with x/y positions, schematic wiring nets with generic board pins and per-key diode polarity, keymap layers with bindings including layer behaviors, tap-dance and mod-morph). From that, the tool must produce the exact set of files ZMK v0.3 expects for a unibody shield — board glue configuration, device description with kscan matrix node, matrix transform and physical layout, the keymap with behavior definitions, and the configuration file — so that the result builds with official ZMK without manual edits. Matrix rows and columns are derived from the wiring nets and must agree with stored diode current direction; incompatible directions are export errors. Key order follows the key list order; physical-layout coordinates are emitted as stored, including negative values. Correctness is the priority: output is identical every time for the same project, and it is checked against real keyboards from the official ZMK repository. Before any editor exists for wiring or boards, users can start from a preset unibody project and see every generated file in the Export workspace. The tool checks the project first and lists every problem in the problems panel, under the workspace where it is fixed (unconnected pins, two keys on the same connection pair, a connection without a board pin, shorted keys or pins) instead of producing broken files. Out of scope: editing the project, split keyboards, controller board selection, downloading files, combos, macros, encoders, lighting and displays.
```

---

## 010 — export-download

**Specified:** [`specs/010-export-download/spec.md`](../specs/010-export-download/spec.md).

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

**Resolved (spec 010).** `west.yml` and the reusable workflow both use `v0.3`, as pinned in `docs/zmk/README.md`. Workflow inclusion defaults on and can be switched off for the current export.

**Relevant docs.** `docs/zmk/README.md`, `shield-files.md`.

```
/speckit-specify Download the generated keyboard firmware configuration as a single archive laid out like a ZMK user configuration repository, so the user can put it on GitHub and have firmware built automatically. The archive contains the shield files in the place ZMK looks for them, the file that tells the build which ZMK version to use, the list of firmware builds (one per keyboard half and controller), and optionally the automation file that builds firmware on GitHub. Users can also copy or download single files from the preview. Downloading is not possible while the project has problems; the user sees the list of problems and the workspace where each one is fixed. Everything happens in the Export workspace. The same project must always produce the same archive. Out of scope: publishing to GitHub, compiling firmware in the tool.
```

---

## 011 — controller-boards

**Implemented (2026-10-12):** [specification](../specs/011-controller-boards/spec.md), [validation evidence](../specs/011-controller-boards/validation.md). Four verified controllers, connector GPIOs and printed pin labels, schema v5 migration, family-aware board switching with dropped endpoint issues. USB-only boards report incompatible Bluetooth bindings. One unibody controller; split selection remains in 013. Automated checks only, no firmware compilation.

**Goal.** Pick the controller board and see its pins by the names printed on the board; pins in the project reference the board's connector so the overlay uses the right syntax.

**In scope**
- Catalog of supported boards (at least those used by presets, plus common ones: nice!nano v2, XIAO BLE (v0.3 ids, ADR 0010; see `docs/zmk/boards.md`), pro micro-compatible RP2040 boards), each with connector type, pin labels, reserved pins, `docsUrl`.
- Board selection per project (split: both halves share the board unless the catalog marks otherwise).
- Changing board: pins with the same connector position are kept; others become unassigned and are listed.
- Pin picker showing board labels.
- Board selection in the Schematic workspace; dropped pins listed in the problems panel.

**Out of scope.** Custom boards (AGENTS.md §1.4 non-goal), editing pin assignments (013).

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

## 012 — layout-editor

**Specified:** [`specs/012-layout-editor/spec.md`](../specs/012-layout-editor/spec.md). Implementation and verification: [`verification.md`](../specs/012-layout-editor/verification.md).

**Goal.** Build any physical key layout visually in the Schematic workspace, with a table view that exposes every key property for keyboard and screen-reader users.

**In scope**
- Add, select (single/multi), move, resize, rotate (angle + origin), duplicate, delete keys; units in `u`. The tools become available in the Schematic tool window.
- Snap to the shared 001 grid (size and snap from settings), arrow-key nudge, numeric input for every property.
- Table/list view editing the same properties.
- Key order (= key index) shown on keys; "renumber by position" command.
- Start from blank or a preset.
- Deleting a key removes its binding from every layer and its matrix assignment; indices stay contiguous.

**Out of scope.** KLE import (018), wiring (013), bindings (014).

**Acceptance criteria**
- Every canvas operation has a keyboard or table equivalent (verified by a UI test for move and rotate).
- Rotated keys render and export `r, rx, ry` matching `docs/zmk/physical-layout.md` units.
- After deleting key k from an n-key project: n-1 keys, indices `0..n-2`, every layer has n-1 bindings, generated files still pass golden-style snapshot tests.
- Renumber by position orders keys top-to-bottom then left-to-right (rule documented in the spec, tested).

**Resolved (012).** Renumber uses visible rotated centers, rounded to 0.0001u, then Y/X with stable ties. Existing project budget: 512 keys.

**Relevant docs.** `docs/zmk/physical-layout.md`.

```
/speckit-specify A visual editor for the physical layout of a keyboard, filling the Schematic workspace and its tool window. Users building non-standard keyboards need to place keys anywhere: add, move, resize, rotate (around a chosen point), duplicate and delete keys, with optional snapping to the app's shared grid, measured in standard key units. Every key property can also be edited as numbers in a table, and every operation is possible with the keyboard alone, so the editor works without a mouse and with a screen reader. Each key shows its number, which is the order used by the keymap; the user can renumber keys by their position. Deleting a key keeps the rest of the project consistent: its bindings and wiring disappear and the remaining keys stay numbered without gaps. Users can start from an empty layout or a preset. Out of scope: importing layouts from other tools, wiring, key bindings.
```

---

## 013 — matrix-wiring-editor

**Implemented (2026-10-13):** [specification](../specs/013-matrix-wiring-editor/spec.md), [verification evidence](../specs/013-matrix-wiring-editor/verification.md). Grid/table assignments edit actual schematic connections with preview/Apply/Cancel and atomic Undo/Redo. Stable axes, both diode directions, direct GND, independent BLE split halves, schema v7 migration and conflict repair are covered by real browser/download checks, independent golden files and 19 actual-export ZMK builds.

**Goal.** In the Schematic workspace, describe how the switches are wired so the generated kscan node and matrix transform match the real hardware, with conflicts visible before export.

**In scope**
- Unibody/split; assign keys to halves (by x-position default, editable).
- Kscan type: matrix or direct; diode direction `col2row` / `row2col`.
- Matrix grid view: rows × columns, key placed per cell; assign key → (row, col) by click or table.
- Auto-assign rows/cols by physical position, per half.
- Pin assignment per row/column (matrix) or per key (direct), per half, using the 011 pin picker.
- Conflict highlighting on the canvas and in the problems panel (Schematic badge): two keys in one cell, unassigned key/row/col/pin, pin used twice on one half, pin reserved by board.
- Right half column offset derived for split.

**Out of scope.** Charlieplex (later), encoders (019).

**Acceptance criteria**
- Auto-assign on each preset layout reproduces the preset's matrix (or a documented equivalent), tested.
- Each conflict type from AGENTS.md §2 appears in the problems panel and on the affected key/pin.
- Switching diode direction regenerates the kscan node per `docs/zmk/kscan.md`; golden tests for both directions.
- Direct-kscan project generates a valid `gpio-direct` node (golden test).

**Open.** Whether charlieplex gets its own feature. Rotated-cluster auto-assignment heuristic resolved in spec 013 planning: visible centers, grid-quantized center-y rows, center-x rank within each row, with manual correction and preset-specific equivalence tests.

**Relevant docs.** `docs/zmk/kscan.md`, `matrix-transform.md`, `boards.md`, `shield-files.md`.

```
/speckit-specify A wiring editor in the Schematic workspace that describes how the keyboard's switches are connected to the controller. The user states whether the keyboard is one piece or split, which keys belong to which half, how switches are read (a row/column matrix with diodes in a chosen direction, or one pin per switch), which matrix row and column each key sits on, and which controller pin each row, column or switch uses. The matrix is shown as a grid so the user can see where every key is; rows and columns can be assigned automatically from key positions and then adjusted. Problems are shown where they occur and in the project problem list: two keys on the same matrix position, keys or rows without an assignment, a pin used twice on one half, a pin the board reserves. The generated files update to match. Out of scope: charlieplex wiring, rotary encoders.
```

---

## 014 — keymap-editor

**Reduced by 004 and 007 (2026-09-28).** The keycode picker, built-in behaviors, catalog, keymap view and list alternative are delivered by 004 bindings-keycaps; layer management and layer behaviors by 007 layers. What remains here: the keymap round-trip acceptance against the preset golden files once shield generators (009) and the layout editor (012) exist, and any gaps found then. The original scope is kept below for reference.

**Goal.** In the Bindings workspace, edit layers and per-key bindings with built-in ZMK behaviors, using a searchable keycode picker instead of typed codes.

**In scope**
- Add, rename, reorder, delete layers (reorder updates layer references in bindings).
- Per key binding: `&kp` (keycode picker: search, categories, modifier combos like `LC(A)`), `&trans`, `&none`, `&mo`, `&lt`, `&tog`, `&to`, `&sl`, `&mt`, `&bt`, `&out`, `&sys_reset`, `&bootloader` — exact list from `docs/zmk/behaviors.md`.
- Keycode and behavior catalog with `docsUrl` per entry.
- Keymap view on the physical layout plus a list alternative.
- Validation: parameter count/type per behavior, layer references exist; issues go to the problems panel (Bindings badge).

**Out of scope.** User-defined behaviors (016), combos/macros/conditional layers (017).

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

After 014 a user can design a non-standard keyboard from nothing, wire it, map it, and download a zmk-config that builds. Everything below adds reach, not the core promise.

---

## 015 — kconfig-settings

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

## 016 — custom-behaviors

**Goal.** In the Bindings workspace, define user behaviors (hold-tap, tap-dance, mod-morph, sticky key/layer tuning) and bind them to keys.

**In scope.** Create/edit/delete behaviors with typed properties per `docs/zmk/behaviors.md`; generated `behaviors {}` section; behaviors appear in the 014 picker; deleting a used behavior is a validation error in the problems panel listing the keys.

**Out of scope.** Macros, combos (017).

**Acceptance criteria.** Golden test per behavior type; label names sanitized and unique; timing properties validated; every property has `docsUrl`.

**Relevant docs.** `docs/zmk/behaviors.md`, `keymap.md`.

```
/speckit-specify In the Bindings workspace, let users create their own key behaviors on top of the built-in ones: a key that does one thing when tapped and another when held (with tunable timing and decision rules), a key that does different things when tapped several times, a key that changes what it sends when a modifier is held, and adjusted sticky keys or sticky layers. Each option explains itself and links to the ZMK documentation. User behaviors can be bound to keys like built-in ones; removing a behavior that is still in use is reported in the problems panel with the affected keys. Out of scope: macros and combos.
```

---

## 017 — combos-macros-conditional-layers

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

### 018 — kle-import
Import a Keyboard Layout Editor JSON into the Schematic physical layout (positions, sizes, rotations). Out: KLE colors/legends beyond a label. Acceptance: fixture KLE files for the presets import to layouts equal to the preset layouts. Open: whether KLE parsing needs a dependency (ADR required). Docs: `docs/zmk/physical-layout.md`.

```
/speckit-specify Import a keyboard layout created in the popular Keyboard Layout Editor website into the Schematic workspace so users do not have to redraw keys they already designed. Key positions, sizes and rotations are taken over; anything the tool cannot represent is listed after import. A file that cannot be read is rejected with a clear message and the current project stays unchanged.
```

### 019 — encoders
Rotary encoders: pins per half and steps (Schematic), sensor bindings per layer (Bindings). Requires a new `docs/zmk/encoders.md` page first. Acceptance: golden test against an upstream shield with encoders.

```
/speckit-specify Support rotary encoders: in the Schematic workspace the user adds encoders to the layout, assigns their pins and sets their resolution; in the Bindings workspace they choose per layer what turning left and right does. Each option links to the ZMK documentation.
```

### 020 — zmk-studio-support
Enable ZMK Studio for the generated shield (Kconfig, build snippet, unlock binding). Settings in the Firmware workspace. Requires a new `docs/zmk/studio.md` page. Physical layout from 009 is already a prerequisite Studio needs.

```
/speckit-specify Let users make their keyboard work with ZMK Studio so they can change the keymap later without rebuilding firmware. The user turns it on in the Firmware workspace, sees what it requires (for example a key that unlocks editing), and the generated configuration includes everything Studio needs.
```

### 021 — lighting-displays
RGB underglow, backlight, OLED / nice!view: pins in Schematic, options in Firmware. Large surface; split into separate specs when started. Requires new `docs/zmk/` pages.

```
/speckit-specify Support keyboard lighting and small displays: RGB underglow, single-color backlight and common display modules, with their pins in the Schematic workspace and their settings in the Firmware workspace, each linked to the ZMK documentation.
```

### 022 — zmk-version-selection
Choose a target ZMK version (today fixed to v0.3, ADR 0010); catalog and fixtures per version. Depends on catalog structure proven by 011–017. Open: how many versions to support at once.

```
/speckit-specify Let users choose, in the Firmware workspace, which ZMK release their configuration targets, so keyboards stay buildable when ZMK changes. Options and behaviors not available in the chosen release are hidden or reported in the problems panel.
```

### 023 — build-verification
`make zmk-build` target: compile the generated shield for each preset inside the `zmkfirmware/zmk-build-arm` Docker image, as a developer/CI check (not a product feature, the app stays static). Could be pulled forward to right after 010 if golden tests prove insufficient. Owned by Makefile/CI, not `src/`.

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
- ~~Canvas arrow keys (012 layout-editor)~~ — resolved: plain arrows navigate visible centers when a key is focused, otherwise retain canvas pan; Shift+arrows nudge selected keys. Numeric inputs retain native keys.
- Charlieplex kscan: own feature or part of 013.
- Split halves on different boards.
- Raw "extra Kconfig lines" escape hatch (015).
