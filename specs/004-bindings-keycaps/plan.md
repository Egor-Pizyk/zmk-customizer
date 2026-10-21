# Implementation Plan: Bindings keycaps

**Branch**: `004-bindings-keycaps` | **Date**: 2026-09-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-bindings-keycaps/spec.md`

## Summary

This feature fills the Bindings workspace. The canvas shows the project's keys as keycaps, over the schematic's wires dimmed and read-only. Selecting keycaps drives a floating Action panel with two steps: first a kind (ZMK behavior), then a choice (keycode, command, profile), each with search, description and a v0.3 docs link. There is also a table alternative. Bindings are stored per layer and keyed by key id: `Project.layers` goes v2 → v3, with one `Base` layer. The keycode catalog is parsed at load from a verbatim vendored ZMK v0.3 `keys.h` (MIT). Our own rules assign categories, and a hand-written legend table covers special keys. Domain operations are `setBindings`, `setKeyPressModifier`, and `removeKey`, which now also drops bindings. Validation takes catalog data as an argument. No generator changes; the keymap file comes with shield generators.

## Technical Context

**Language/Version**: TypeScript 7 (strict, `erasableSyntaxOnly`); Node 24 for tooling only

**Primary Dependencies**: React 19, zod, Tailwind v4. No new dependencies. Vite `?raw` imports the vendored header.

**Storage**: the project JSON through 002 `storage/`; `schemaVersion` 2 → 3 with a migration. Interface preferences gain `bindingsPanel` and `isBindingsTableOpen`, each with its own fallback; there is no preference version bump.

**Testing**: Vitest.
- Tests come first for the catalog parser and invariants, the migration, the schema, the domain operations, queries and validation, and the legend formatting.
- UI tests only for the panel step logic (a pure function) and the search listbox keyboard handling.

**Target Platform**: static SPA, desktop browsers, 1024–1280 px and up

**Project Type**: web application, frontend only (ADR 0001)

**Performance Goals**: 100 keys and 300 wires: opening Bindings, selecting, and each search keystroke within one frame (SC-007). The work is a linear scan: about 370 keycodes and about 100 legend lookups through a `Map`.

**Constraints**: offline; deterministic; one gesture = one commit, and no commit when nothing changes; WCAG 2.2 AA; ZMK v0.3 only (no `OUT_NONE`, no main-only names).

**Scale/Scope**: 1 workspace, about 8 domain files, about 7 catalog files, about 15 UI files, 1 schema bump, 3 files moved to `ui/canvas/`.

## Constitution Check

*GATE: before Phase 0 and again after Phase 1.*

| Principle | Status | How |
|---|---|---|
| I. Correct output over features | Pass (n/a) | No generator touched. `kind` equals the ZMK label and `KeyStroke` maps 1:1 to `&kp LC(X)` syntax (`docs/zmk/keymap.md` §3–4), so the later generator is a direct render. |
| II. Domain first | Pass | Binding operations, queries (`getSharedBinding`) and validation live in `src/domain/`. The UI only formats legends and dispatches. |
| III. Static only | Pass | The header is bundled; no runtime fetch. |
| IV. User data untrusted | Pass | The zod binding union uses strict objects; dangling key ids are rejected; unknown keycodes are reported, not trusted (R7). |
| V. ZMK options explain themselves | Pass | Every behavior, command and keycode has a description and a v0.3 `docsUrl`, enforced by a catalog test (contracts/catalog.md). |
| VI. Minimal code | Pass | No generator script: a verbatim header plus one parser. Three existing files move to `canvas/` instead of being copied. Selection is a plain id list. |
| VII. Deterministic | Pass | Modifiers are stored in a fixed order; issues are sorted; the catalog is in header order. |
| VIII. Accessible | Pass | Keycaps are focusable `graphics-symbol`s; the table is the complete alternative; the panel uses the combobox-listbox pattern (R11). |
| Constraints: layers, deps, `make check` | Pass | `ui → storage → domain ← catalog`; catalog data reaches `validateProject` as an argument (R8). |
| Workflow: roadmap order | **Deviation** | The feature is not in `docs/roadmap.md`, and 004 collides with shield-generators. Fix: the first task inserts 004 and 005 and renumbers (R1). |

Post-design re-check: passes. One guideline deviation is recorded: the keycode table is derived, not `as const` (R2, Complexity Tracking).

## Project Structure

### Documentation (this feature)

```text
specs/004-bindings-keycaps/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── project-schema.md
│   ├── catalog.md
│   ├── ui.md
│   └── validation-issues.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
src/catalog/                             (new folder: first catalog feature)
  zmk/keys.h                             verbatim ZMK v0.3.0, never edited (R2)
  parse-keys-header.ts (+ test)          header → Keycode[] (R2, R3)
  keycodes.ts (+ test)                   KEYCODES, keycodeByName, MODIFIER_KEYCODES; invariants
  keycode-legends.ts                     KEYCODE_LEGENDS (R5)
  behaviors.ts (+ test)                  BEHAVIORS as const satisfies; docsUrl test for all tables
  bluetooth-commands.ts                  BLUETOOTH_COMMANDS, BLUETOOTH_PROFILE_COUNT
  output-commands.ts                     OUTPUT_COMMANDS
  bindings-catalog.ts                    BINDINGS_CATALOG for validation (R8)

src/domain/
  types.ts                               + Layer, Binding, KeyStroke, Modifier, commands; v3; 2 codes
  create-project.ts                      + layers [Base]
  remove-key.ts (+ test)                 + drop the key's bindings in every layer
  find-binding.ts (+ test)
  get-shared-binding.ts (+ test)
  set-bindings.ts (+ test)
  set-key-press-modifier.ts (+ test)
  validate-bindings.ts (+ test)          contracts/validation-issues.md
  validate-project.ts (+ test)           + catalog argument

src/storage/
  project-schema.ts (+ test)             v3 (contracts/project-schema.md)
  migrate-project.ts                     CURRENT_SCHEMA_VERSION = 3
  migrate-v2-to-v3.ts (+ test)           fixture tests/fixtures/project/v2.json
  preferences.ts (+ test)                + bindingsPanel, isBindingsTableOpen

src/ui/
  project-context.tsx                    validateProject(project, BINDINGS_CATALOG)
  shell/workspace-issue.ts               + 2 codes → 'bindings'
  shortcuts.ts                           + copy-binding, paste-binding (scope 'bindings')
  components/floating-panel.tsx          + size 'narrow' | 'wide'
  canvas/find-nearest-key.ts (+ test)    moved from schematic/
  canvas/to-path-data.ts                 moved from schematic/
  canvas/marquee-layer.tsx               moved from schematic/
  bindings/
    bindings-workspace.tsx               owns selection, panel step, search, copied binding
    bindings-canvas.tsx                  WorkSurface content + keyboard on keycaps
    wires-backdrop.tsx                   dimmed paths, junctions, board-pin labels (R10)
    keycap-shape.tsx                     keycap art + legends
    use-bindings-pointer.ts              click / Ctrl-click / marquee selection
    use-bindings-shortcuts.ts            Mod+C / Mod+V (R12)
    action-panel.tsx                     FloatingPanel: header, copy/paste, steps
    behavior-list.tsx                    step 1
    choice-list.tsx                      step 2: search + grouped listbox (R11)
    modifier-toggles.tsx                 FR-011
    bindings-table.tsx                   list alternative
    get-panel-step-for-selection.ts (+ test)   FR-009a
    format-binding-legend.ts (+ test)    tap/hold legends, shifted symbols (R5)
    format-binding-name.ts (+ test)      full name for aria-label, table, status
    filter-choices.ts (+ test)           name/alias/description search (FR-013)

docs/roadmap.md                          insert 004 bindings-keycaps and 005 layers; renumber (R1)
tests/fixtures/project/v2.json           v2 sample for the migration test
```

**Structure Decision**: this follows AGENTS §3.1. `src/catalog/` is created now because the first catalog data needs it. The Bindings UI stays in `ui/bindings/`. Pieces shared with Schematic move to `ui/canvas/` (`react.md`: move when the second user appears). `ui/schematic/` changes only its imports.

**Redesign (research R14, 2026-09-28).** The Action panel becomes the docked key picker:
- new `ui/bindings/key-picker*.tsx`, `mini-keyboard.tsx`, `picker-tabs.ts`, `move-in-grid.ts`;
- new domain operations `set-keycode.ts`, `set-hold-key.ts`, `set-press-mode.ts`;
- the step files are deleted: `choice-list`, `get-step-view`, `get-choice-result`, `get-panel-step-for-selection`, `use-action-panel`, `action-step`;
- the preferences `isBindingsPanelOpen` and `isAutoAdvanceEnabled` are added, `bindingsPanel` is removed, and `isBindingsTableOpen` defaults to `false`.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| The keycode table is derived at load (`parseKeysHeader(raw)`) instead of an `as const` literal (`typescript.md` → Catalog data) | AGENTS §3.4 requires generating keycodes from `keys.h`; about 370 entries with aliases | A hand-written literal is error-prone and drifts from upstream. A committed generated file needs a separate generator script and a drift check, which is two artifacts instead of one. |

## Standard-size amendment (2026-10-21)

Bindings gains only explicit standard-size editing through the contextual Keycap size chooser and labeled Keys-table action, superseding read-only geometry wording for this operation. No arbitrary resizing/numeric sizing, movement or nudge is added to Bindings. See [012 specification](../012-layout-editor/spec.md) FR-017–020 and its plan/tasks; single evidence journal: standard-keycap-verification.md in 012. Center/contact positions, project compatibility and one-step Undo/Redo are preserved; overlaps use existing validation.
