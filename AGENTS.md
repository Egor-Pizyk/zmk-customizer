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
- Layer bindings are keyed by key id (`Layer.bindings: Record<Key.id, Binding>`); a missing entry means `&none`, so deleting or reordering keys never shifts a layer (spec 004 research R6). Generators emit exactly `n` bindings per layer in key-index order, where `n` is the largest transform `map` length across physical layouts.
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

Production imports follow this matrix; catalog values enter domain operations as arguments:

| From | Allowed project imports |
|---|---|
| domain | domain |
| catalog | catalog, domain types only, pinned own assets |
| generators | generators, domain, catalog |
| storage | storage, generators, domain, catalog |
| ui/components | ui/components only |
| ui/canvas, ui/shell | shared UI, domain/catalog/storage, listed root UI contracts; no feature folders |
| ui/<workspace> | same workspace, shared UI, root contracts, domain/catalog/storage |
| ui/export | above, generator calls only in export/get-export-preview.ts; generated-file type in export consumers |
| ui root | composition of UI/domain/catalog/storage; no generator calls |
| main.tsx | UI/storage/catalog and styles.css |

Enforced by scripts/check-architecture.mjs (resolved imports, re-exports, dynamic imports), oxlint no-restricted-imports overrides and import/no-cycle. Exact root contracts and exceptions are documented in docs/guidelines/code-quality/typescript.md.

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
| Tests | Vitest + Playwright | Unit + golden files; React/jsdom for interaction logic; real-browser E2E for user journeys (see §6.1) |
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
make check       # agents sync + typecheck + lint + format check + Vitest coverage inside the container
make test-e2e    # production build + Chromium suite + focused Firefox/WebKit checks
make test-e2e-mutations # controlled browser regressions; run alone after make test-e2e
make image       # build production image (nginx serving dist/)
make prod        # run production image locally (http://localhost:8080)
make clean       # remove dist/, coverage, containers, volumes

npm run dev | build | preview
npm run typecheck | lint | lint:fix | format | format:check
npm run test | test:watch
npm run test:e2e | test:e2e:types
npm run check    # static checks + Vitest coverage; browser execution is a separate CI job
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
7. `/speckit-implement` — execute tasks, including Playwright coverage for changed user journeys (§6.1).
8. Verify completion — `make check`, production build and `make test-e2e`; record results and coverage limits in feature artifacts (§6.1).

Feature order and scope: `docs/roadmap.md`. One feature = one branch `NNN-short-name` = one `specs/NNN-short-name/` directory. Numbers are immutable: once a `specs/NNN-*` directory exists, its number is never reused or reassigned.

### 6.1 Playwright E2E coverage

For new or changed user journeys, add or update Playwright E2E tests and include them in the spec, plan and tasks. Keep domain permutations in unit tests; E2E verifies real interaction and agreement across the application. If a feature does not change user behavior and needs no new E2E coverage, record the reason in its artifacts.

- Run the production app in an isolated browser context with a predictable project and real React/providers, storage, domain and generators. Never use or modify an ordinary user browser profile.
- Assert the expected visible result and, where applicable, the saved project and actual downloaded JSON/ZIP. DOM attributes or absence of errors alone are insufficient.
- Use accessible roles/names. For canvas interactions use coordinates of displayed elements; perform drags with `mouse.move/down/up` and intermediate movements.
- Do not mock core services, use `force:true`, dispatch synthetic events, call handlers, change state through `evaluate`, or use arbitrary sleeps. `evaluate` is observation-only; wait for a concrete state.
- Check screen geometry, including corners of rotated elements rather than only bounding boxes. Add independent visual snapshots where they detect paint errors; justify tolerances and inspect the cause of differences before updating references.
- For a discovered bug, first reproduce a failing test, then fix its cause in the owning architectural layer. Domain/generator repairs also require their own tests-first contracts.
- For a substantial new interaction contract, prove test sensitivity with a controlled behavioral regression. Run it separately from checks and production edits, require a user-facing or saved-data assertion failure, and restore exact original files. Do not require every domain permutation or all six existing browser seeds for every feature.
- The complete Chromium suite is mandatory. Add targeted Firefox/WebKit cases for SVG, foreignObject, pointer capture, native inputs and focus where the feature touches them.
- Before completion, run `make check`, production build and `make test-e2e`. Verify new or changed E2E tests in three sequential runs without retries. Run `make zmk-build` if generators or exported geometry change.
- Retain useful failure traces/screenshots. Record scenario → risk → existing coverage → new E2E → visible assertion → saved/exported assertion, verification results and remaining limits in feature artifacts. Commands and artifact handling are documented in `docs/testing.md`.
- Never weaken assertions to make CI green or claim absence of user problems solely from passing tests.

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

- Не использовать Computer Use, CUA и управление обычным браузером или нативными приложениями без явного запроса пользователя. Автоматические Playwright-тесты через терминал разрешены в изолированном тестовом браузере (§6.1); пользовательский профиль не использовать.
- Read the relevant `docs/zmk/*.md` page before touching anything that produces ZMK syntax. Do not write Devicetree/Kconfig from memory. Target is ZMK v0.3 — never emit anything marked "main only".
- Stay inside the task. No drive-by refactors, no renaming unrelated code, no new dependencies without §4 approval.
- Write the test first for domain logic and generators; watch it fail; then implement. Tests sit next to the code as `*.test.ts(x)`.
- Test observable behavior and product contracts (see `docs/testing.md`): real React/hooks/providers for UI interaction, roles and accessible names, visible state and saved/exported data. Do not mock React state or assert implementation details, Tailwind classes, or what the compiler/linter already guarantees.
- Keep coverage floors in `vite.config.ts` passing through `make check`. Use `make test-mutations` separately to verify regression sensitivity; never run it alongside other checks or edits to production files.
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
  guidelines/          code-quality rules (§10)
  zmk/                 verified ZMK reference notes with links
  roadmap.md           feature list in implementation order
  decisions/           ADRs (index in docs/decisions/README.md)
specs/                 Spec Kit feature specs (created by /speckit-specify)
.specify/              Spec Kit templates, scripts, constitution
.claude/               Claude Code settings, hooks/format-lint.sh (PostToolUse on Edit|Write), agents/ (zmk-reviewer, domain-test-writer, spec-reviewer), skills/ (/speckit-* commands), rules/ (symlinks to docs/guidelines, §10)
.opencode/             OpenCode skills/ (mirror .claude/agents/; bodies must stay identical, checked by scripts/check-agents-sync.sh), agents/verify-before-done.md (OpenCode only, no mirror), plugins/format-lint.ts (parity with the Claude hook via tool.execute.after)
opencode.json          OpenCode config: instructions + permissions (skills are auto-discovered from .opencode/skills/ and .claude/skills/, no paths needed)
src/                   application code (§3.1)
tests/fixtures/        upstream/ (verbatim ZMK shields, SHA-pinned), project/ and schematic/ (project JSON); expected generator output lands here with the generators
tests/helpers/         shared test builders
scripts/               check-agents-sync.sh (run by npm run check)
Dockerfile, compose.yaml, Makefile, nginx.conf
.github/workflows/ci.yml
package.json, tsconfig.json, vite.config.ts, index.html, .oxlintrc.json, .oxfmtrc.json
```

---

## 10. Coding rules (path-scoped)

`AGENTS.md` states what to build; the files below state how to write it. Each file has
`description` + `paths` frontmatter (globs). Read the ones whose `paths` match the files you touch.
Claude Code loads them automatically through the symlinks in `.claude/rules/` when a matching file
is read; OpenCode loads all nine up front via `opencode.json` → `instructions`. Do not reference
them with `@` here: Claude Code expands `@` imports eagerly.

| Rule file | Load when touching |
|---|---|
| docs/guidelines/code-quality/typescript.md | any `src/**/*.ts(x)` — types, casts, modules, exhaustiveness |
| docs/guidelines/code-quality/observability.md | error paths, validation, logging in `src/` |
| docs/guidelines/code-quality/control-flow.md | function shape in `src/` |
| docs/guidelines/code-quality/naming/functions.md | naming a function, component or handler |
| docs/guidelines/code-quality/naming/variables.md | naming anything (code, tests, UI copy, docs) |
| docs/guidelines/frontend/react.md | `src/ui/**` structure, state, effects, inputs |
| docs/guidelines/frontend/tailwind.md | classes, tokens, `src/styles.css` |
| docs/guidelines/frontend/admin-ui.md | screens, primitives, validation display |
| docs/guidelines/frontend/accessibility.md | keyboard, ARIA, focus, feature checklist |
