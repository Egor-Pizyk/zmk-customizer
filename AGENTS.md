# ZMK Customizer

Static web app that lets a user describe a custom keyboard (physical shape, wiring, keymap, behaviors, settings) in the browser and download a ready ZMK shield: `Kconfig.shield`, `Kconfig.defconfig`, `<name>.overlay`, `<name>.keymap` (plus `<name>.conf` / split variants where ZMK requires them).

No backend. Everything runs in the browser. The generated files must build with upstream **ZMK v0.3** (ADR 0010) without manual edits.

This file is the entry point for every agent and human. Read it fully before any change. Detailed rules live in the imported files at the bottom.

---

## 1. Product

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

---

## 2. Domain model (ZMK concepts the code must represent)

Reference: `docs/zmk/` (verified notes with links to https://zmk.dev/docs). When the docs and this summary disagree, the ZMK docs win; fix this file.

**Target: ZMK v0.3.0** (tag `edf5c08`, Zephyr 3.5) — [ADR 0010](docs/decisions/0010-target-zmk-v0-3.md). zmk.dev describes `main`; anything marked "main only" in `docs/zmk/` is never generated or offered in the UI.

| Concept | What it is | Where it ends up |
|---|---|---|
| Shield | The user's keyboard, placed on top of a controller board. Board ids are v0.3 ids (`nice_nano_v2`, not main's `nice_nano//zmk`; see `docs/zmk/boards.md`). Name is `[a-z_][a-z0-9_]*`; keyboard name ≤16 bytes. | Directory name, Kconfig symbol `SHIELD_<NAME>` |
| Board overlay | Board-specific fix-ups inside the shield, file named by the exact v0.3 board id (`boards/nice_nano_v2.overlay`; `nice_nano.overlay` does not apply to v2). | `boards/shields/<name>/boards/<board>.overlay` |
| Physical layout | Per-key `w, h, x, y, r, rx, ry`; in DT stored as hundredths of `u` / hundredths of a degree (clockwise positive). Selected via `chosen zmk,physical-layout`; it in turn selects the transform and kscan. Needed for ZMK Studio and for our canvas. | `zmk,physical-layout` node in overlay |
| Kscan | How switches are read: `zmk,kscan-gpio-matrix`, `zmk,kscan-gpio-direct`, `zmk,kscan-gpio-charlieplex`; `zmk,kscan-composite` mixes them. | kscan node in overlay |
| Diode direction | `col2row` or `row2col`. Decides which side is input and pull direction. | kscan node |
| GPIO pin | Pin on the controller, referenced through the board's connector (`&pro_micro 4`, `&xiao_d 0`) or directly (`&gpio0 8`). Valid connector pins are limited (`&pro_micro` 0–10, 14–16, 18–21; `&xiao_d` 0–10). | `row-gpios` / `col-gpios` / `input-gpios` |
| Matrix transform | Maps key index (order in keymap) → `RC(row, col)`. Lets the keymap order follow the physical order regardless of wiring. Referenced by the physical layout, never set as `chosen` (breaks Studio). | `zmk,matrix-transform` node |
| Split | Two halves; central + peripheral. Each half has its own overlay; the peripheral sets `col-offset` on every transform. `ZMK_KEYBOARD_NAME` / `ZMK_SPLIT_ROLE_CENTRAL` only on central. | `<name>_left/_right` shields, `ZMK_SPLIT*` Kconfig |
| Keymap | Ordered layers; each layer has one binding per key index. | `<name>.keymap` |
| Behavior | Action bound to a key: key press, layer, hold-tap, macro, … Built-in or user-defined. | `behaviors {}` in keymap |
| Combo | Several key positions pressed together → binding. | `combos {}` in keymap |
| Macro | Sequence of bindings. | `macros {}` in keymap |
| Kconfig option | Build-time setting (`CONFIG_ZMK_SLEEP=y`). User settings → `config/<name>.conf` (applies to all halves; in a split shield folder the shared `<name>.conf` is not applied, per-half `<name>_left.conf`/`_right.conf` are). v0.3 underglow needs `WS2812_STRIP` enabled (default in `Kconfig.defconfig`). Hardware defaults → `Kconfig.defconfig`. | `config/<name>.conf` / `Kconfig.defconfig` |
| Build target | Board + shield (+ optional `snippet`, e.g. `studio-rpc-usb-uart`) per half. | `build.yaml` |

Invariants the domain layer must enforce (not the UI):

- Every key has a unique key index; indices are contiguous `0..n-1`.
- Every key is mapped to exactly one matrix cell; a matrix cell holds at most one key (except where kscan type allows otherwise).
- A GPIO pin is used at most once per half (for charlieplex: once in the `gpios` list, and row ≠ col).
- Every layer has exactly `n` bindings, where `n` is the largest transform `map` length across physical layouts.
- Combo key positions reference existing key indices.
- Names that become Devicetree labels / Kconfig symbols are sanitized and unique.

---

## 3. Architecture

### 3.1 Layers

```
src/
  domain/      Pure TS. Types + functions over project state. No DOM, no React, no I/O.
  catalog/     Static ZMK data: boards & pin maps, keycodes, behaviors, Kconfig options (with doc URLs).
  generators/  Pure functions: (Project) -> { path, content }[]. Deterministic text output.
  storage/     localStorage + JSON import/export. The only place that parses untrusted input.
  ui/          React components. Reads state, dispatches domain operations. No business rules.
               ui/components/ = design-system primitives; ui/<step>/ = feature screens.
  styles.css   Tailwind entry + design tokens (@theme). The only place for raw colors.
  main.tsx     Composition root.
```

Dependency direction is one way: `ui → storage → generators → domain ← catalog`. `domain` imports nothing from the other folders. `generators` never import from `ui`. Catalog data reaches domain functions as arguments. `ui/components/` imports neither `domain/` nor step folders; step folders do not import each other. Enforced by oxlint `no-restricted-imports` overrides in `.oxlintrc.json` (+ `import/no-cycle`).

Folders are created when the first file needs them, not ahead of time.

### 3.2 State

- One serializable `Project` object (plain JSON, no classes, no `Date`, no `Map`). It has a `schemaVersion: number`.
- Every change goes through a pure domain function `(project, input) => project`. The UI never mutates state directly.
- Undo/redo = stack of previous `Project` values. Cheap because state is small.
- Schema changes bump `schemaVersion` and add a migration `vN -> vN+1` in `storage/`. Old files must still load.

### 3.3 Generators

- Output is a pure function of `Project`. Same input → byte-identical output (stable ordering, fixed indentation, `\n` line endings, trailing newline).
- Generators do not validate; they receive a project that already passed domain validation. Exporting an invalid project is blocked in the UI with the list of errors.
- Each generator has golden-file tests. Verbatim upstream ZMK shields live in `tests/fixtures/upstream/<keyboard>/` (never edited); expected outputs are derived from them, with any intended deviation listed in a `DIFFERENCES.md` next to the expected files.

### 3.4 Catalog data

- ZMK facts (keycodes, behaviors, Kconfig options, board pin maps) live as typed `as const` data in `src/catalog/`, never inline in components.
- Every catalog entry that the user can toggle carries `docsUrl` pointing to the exact section of the **v0.3 docs, https://v0-3-branch.zmk.dev/docs/** (not zmk.dev, which describes `main`). An entry without a link is a bug.
- Catalog targets one pinned ZMK version (see `docs/zmk/README.md`). Updating ZMK = updating catalog + fixtures in one change. Target version is v0.3 (ADR 0010); version-dependent values (board ids, board overlay names, `west.yml` revision) are catalog data, not generator code.
- Keycode data: generate from `dt-bindings/zmk/keys.h` (MIT). Do not bundle `docs/src/data/hid.js` (CC-BY-NC-SA).

---

## 4. Tech stack

| Area | Choice | Notes |
|---|---|---|
| Language | TypeScript 7, `strict` + extra flags incl. `erasableSyntaxOnly` (no enums/namespaces), see `tsconfig.json` | No `any`, no non-null `!`, no `as` (only `as const`; zod parsing yields typed values) |
| Runtime | Node 24 (inside Docker) | Only for tooling; the product is static files |
| Package manager | npm | `package-lock.json` is committed |
| Build/dev | Vite | Output: `dist/`, deployable to any static host |
| UI | React 19 | Function components only; rules in `docs/guidelines/frontend/` |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` ([ADR 0011](docs/decisions/0011-tailwind-design-system.md)) | Semantic tokens in `src/styles.css` `@theme`; no raw palette / arbitrary values in feature code |
| Lint | oxlint, type-aware via `oxlint-tsgolint` (`.oxlintrc.json`); Tailwind rules via `eslint-plugin-better-tailwindcss` loaded as an oxlint `jsPlugin` (alpha API, no ESLint installed) | Lint errors fail CI |
| Format | oxfmt (`.oxfmtrc.json`; sorts Tailwind classes; markdown and fixtures excluded) | Not negotiable in review; run the formatter |
| Tests | Vitest | Unit + golden files; UI tests only for non-trivial interaction logic |
| Containers | Docker + docker compose | Dev server and production image |
| Non-Node commands | `Makefile` | Docker, cleanup, release helpers |
| Spec workflow | GitHub Spec Kit (`/speckit-*` commands in Claude Code) | See §6 |

Approved runtime dependencies (add only when the first feature needs them):

- `react`, `react-dom`
- `zod` — validating imported JSON / localStorage (trust boundary)
- `fflate` — building the download `.zip`

Anything else needs a line in `docs/decisions/` explaining why a few lines of our own code are not enough. Prefer browser APIs: SVG for the canvas, `<dialog>`, `<details>`, `URL.createObjectURL` for downloads, CSS for layout.

---

## 5. Commands

Node-related tasks are npm scripts. Everything else is `make`. Both run inside Docker by default so host Node version does not matter.

```
make up          # start dev server in Docker (http://localhost:5173)
make down        # stop containers
make logs        # follow dev server logs
make sh          # shell inside the app container
make install     # npm ci inside the container (run after dependency changes: node_modules is a Docker volume)
make check       # typecheck + lint + format check + tests inside the container (same as CI)
make image       # build production image (nginx serving dist/)
make prod        # run production image locally (http://localhost:8080)
make clean       # remove dist/, coverage, containers, volumes

npm run dev | build | preview
npm run typecheck | lint | lint:fix | format | format:check
npm run test | test:watch
npm run check    # everything CI runs
```

`make help` lists targets. Before finishing any task: `make check` must pass.

---

## 6. How work is done (Spec-Driven Development)

Features are built through GitHub Spec Kit. Do not write feature code without a spec.

1. `/speckit-constitution` — once; project principles (source: this file, §7 and §8).
2. `/speckit-specify <feature>` — what and why, no tech. Creates `specs/NNN-name/spec.md`.
3. `/speckit-clarify` — resolve open questions before planning.
4. `/speckit-plan` — how, using this file's architecture and stack.
5. `/speckit-tasks` — ordered task list with tests first.
6. `/speckit-analyze` — consistency check spec ↔ plan ↔ tasks.
7. `/speckit-implement` — execute tasks.

Feature order and scope: `docs/roadmap.md`. One feature = one branch `NNN-short-name` = one `specs/NNN-short-name/` directory.

---

## 7. Principles

1. **Correct output over features.** A generated file that does not build is worse than a missing feature. Every generator change comes with a golden-file test.
2. **Domain first.** Rules live in `src/domain/` as pure functions with tests. UI only displays and dispatches.
3. **Static only.** No backend, no runtime network calls. The app works offline after load.
4. **User data is untrusted.** Imported JSON and `localStorage` are parsed with a schema; failure shows a readable error and never corrupts the current project.
5. **Every ZMK option explains itself.** Short description + link to the ZMK docs section.
6. **Minimal code.** No abstractions for a single use, no config for values that never change, no speculative folders or helpers. Delete before adding.
7. **Deterministic.** No `Math.random`, `Date.now` or iteration over unordered data in generators.
8. **Accessible.** Every control is keyboard reachable and labeled; the canvas has a non-canvas alternative (table/list) for key properties.

---

## 8. Rules for agents

- Read the relevant `docs/zmk/*.md` page before touching anything that produces ZMK syntax. Do not write Devicetree/Kconfig from memory. Target is ZMK v0.3 — never emit anything marked "main only".
- Stay inside the task. No drive-by refactors, no renaming unrelated code, no new dependencies without §4 approval.
- Write the test first for domain logic and generators; watch it fail; then implement. Tests sit next to the code as `*.test.ts(x)`.
- Keep files small and named after what they contain. One exported concept per file in `domain/` and `generators/`.
- No comments that repeat code. Comment only non-obvious "why" (ZMK quirks, links to docs).
- Never commit generated `dist/`, `coverage/`, `node_modules/`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`), one logical change each.
- If a ZMK behavior is unclear, say so and link the doc page; do not guess.

---

## 9. Repository map

```
AGENTS.md              this file
CLAUDE.md              imports AGENTS.md for Claude Code
docs/
  guidelines/          code-quality rules (imported below)
  zmk/                 verified ZMK reference notes with links
  roadmap.md           feature list in implementation order
  decisions/           ADRs (index in docs/decisions/README.md)
specs/                 Spec Kit feature specs (created by /speckit-specify)
.specify/              Spec Kit templates, scripts, constitution
.claude/               Claude Code settings, hooks/, agents/ (zmk-reviewer, domain-test-writer, spec-reviewer)
src/                   application code (§3.1)
tests/fixtures/        upstream ZMK shields + expected generator output
Dockerfile, compose.yaml, Makefile, nginx.conf
.github/workflows/ci.yml
package.json, tsconfig.json, vite.config.ts, index.html, .oxlintrc.json, .oxfmtrc.json
```

---

## 10. Imported guidelines

@docs/guidelines/code-quality/typescript.md
@docs/guidelines/code-quality/observability.md
@docs/guidelines/code-quality/control-flow.md
@docs/guidelines/code-quality/naming/functions.md
@docs/guidelines/code-quality/naming/variables.md
@docs/guidelines/frontend/react.md
@docs/guidelines/frontend/tailwind.md
@docs/guidelines/frontend/admin-ui.md
@docs/guidelines/frontend/accessibility.md
