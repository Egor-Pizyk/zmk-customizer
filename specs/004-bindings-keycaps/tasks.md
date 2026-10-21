---

description: "Task list for Bindings keycaps"
---

# Tasks: Bindings keycaps

**Input**: `specs/004-bindings-keycaps/` — plan.md, spec.md, research.md (R1–R13), data-model.md, contracts/ (project-schema, catalog, ui, validation-issues), quickstart.md

**Prerequisites**: 003 schematic-switches-wires merged (it is on `main`). `Project` v2, `ProjectProvider` (`project`, `issues`, `commit`), `WorkSurface` `content` slot, `FloatingPanel`, `SHORTCUTS`, and `IssueButton` focusing `[data-issue-path~=…]` all exist.

**Tests**: required.
- AGENTS §8: catalog, domain and storage tests come first; watch them fail, then implement. Use the `domain-test-writer` agent for those tasks.
- UI tests only for `getPanelStepForSelection`, `filterChoices`, the legend and name formatting, and the choice-list keyboard handling.
- After catalog tasks, run the `zmk-reviewer` agent.

**Lint limits to respect in every task**: `max-lines-per-function` 40, `import/max-dependencies` 10, jsx-a11y (incl. `prefer-tag-over-role`), no `style` prop except the existing `FloatingPanel` translate, no arbitrary Tailwind values, no `as`/`!`. Split files rather than disable rules.

**Phase order**: P1 stories come first, ordered by what each builds on: US1 (canvas) → US3 (legends on it) → US2 (assign) → US6 (project data and problems). Then the P2 stories: US4 → US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on an unfinished task)
- **[Story]**: US1–US6 from spec.md

---

## Phase 1: Setup

- [X] T001 Update `docs/roadmap.md` (R1):
  - Insert "004 — bindings-keycaps" (goal, scope summary, link to `specs/004-bindings-keycaps/spec.md`, depends on 003) and "005 — layers" after 003. 005 layers covers: add/rename/reorder/delete layers, and `&mo &lt &tog &to &sl` with layer references kept correct and dangling references reported.
  - Renumber the later entries +2 (004→006 … 018→020) in the overview table, the headings and every cross-reference ("Depends on", the workspaces paragraph).
  - Shrink the old keymap-editor entry to what is left, the keymap round-trip acceptance, and note that its picker and layers moved to 004/005.
  - Add a note like the 003 note: "Added 2026-09-28 on user request; later features renumbered +2."
- [X] T002 Add the glossary rows to `docs/guidelines/code-quality/naming/variables.md`:
  - `keycap` — a key drawn in Bindings; banned: `cap`, `button`;
  - `legend` — the text on a keycap; banned: `label` for this meaning;
  - `modifier` (`Modifier`, `LC`…`RG`);
  - `keyStroke` (`KeyStroke`, a keycode plus modifiers);
  - `action` — UI word for a binding; code uses `binding`.
- [X] T003 [P] Vendor the keycode header (R2).
  - Download `https://raw.githubusercontent.com/zmkfirmware/zmk/v0.3.0/app/include/dt-bindings/zmk/keys.h` verbatim to `src/catalog/zmk/keys.h`. Its SPDX MIT header stays.
  - Check that `npm run format:check` and `npm run lint` ignore `.h`; if not, add `src/catalog/zmk/` to the ignore lists in `.oxfmtrc.json` / `.oxlintrc.json`.
  - Add a `README.md` next to it: "Verbatim copy of ZMK v0.3.0 `keys.h` (tag `edf5c08`). Never edit; replace when the target ZMK version changes (AGENTS §3.4)".
- [X] T004 [P] Move the shared canvas files (R10) and update their imports in `src/ui/schematic/*`; no code changes. `npm run lint` must pass the step-folder import rules.
  - `src/ui/schematic/find-nearest-key.ts` and `find-nearest-key.test.ts` → `src/ui/canvas/`;
  - `src/ui/schematic/to-path-data.ts` → `src/ui/canvas/to-path-data.ts`;
  - `src/ui/schematic/marquee-layer.tsx` → `src/ui/canvas/marquee-layer.tsx`.

---

## Phase 2: Foundational (blocks all stories)

**Domain types and storage**

- [X] T005 Add to `src/domain/types.ts`, all fields `readonly`, verbatim from data-model.md:
  - `Modifier = 'LC' | 'LS' | 'LA' | 'LG' | 'RC' | 'RS' | 'RA' | 'RG'`;
  - `KeyStroke { keycode: string; modifiers: readonly Modifier[] }` ("unique, in the order of the Modifier union");
  - `BluetoothCommand`, `BluetoothProfileCommand`, `OutputCommand = 'OUT_TOG' | 'OUT_USB' | 'OUT_BLE'` (no `OUT_NONE`, main only);
  - the `Binding` union with the 14 variants from data-model.md and `BehaviorId = Binding['kind']`;
  - `Layer { id; name; bindings: Readonly<Record<string, Binding>> }` ("Keyed by Key.id. Missing entry = unassigned = &none").
  - In `Project`: `schemaVersion: 3` and `layers: readonly Layer[]`.
  - In `ValidationCode`: `'binding-keycode-unknown' | 'binding-profile-out-of-range'`.
- [X] T006 Test first, then set `layers: [{ id: 'l0', name: 'Base', bindings: {} }]` and `schemaVersion: 3` in `src/domain/create-project.ts` (update `create-project.test.ts`).
- [X] T007 [P] Test first, then implement the migration.
  - Add `tests/fixtures/project/v2.json`: a v2 project with 2 keys and 1 wire.
  - Implement `src/storage/migrate-v2-to-v3.ts` + `.test.ts`: it adds `layers: [{ id: 'l0', name: 'Base', bindings: {} }]` and sets `schemaVersion: 3`, and returns a non-object input unchanged.
  - Register it in `src/storage/migrate-project.ts` (`CURRENT_SCHEMA_VERSION = 3`, `MIGRATIONS = [undefined, migrateV1ToV2, migrateV2ToV3]`) and extend `migrate-project.test.ts`: v1 → v3 chain.
- [X] T008 Test first (in `src/storage/project-schema.test.ts` and `parse-project-file.test.ts`), then extend `src/storage/project-schema.ts` per contracts/project-schema.md.
  - Schema:
    - `schemaVersion: z.literal(3)`;
    - `layers` is an array with `.min(1)` of strict layer objects, with `id` `^l\d+$`;
    - the binding union uses strict objects;
    - a `modifiers` refine checks "unique and in union order".
  - Integrity:
    - duplicate layer ids are rejected at `['layers', L, 'id']`;
    - a binding for a missing key id is rejected at `['layers', L, 'bindings', keyId]`.
  - One failing-input test per rule, asserting the zod path:
    - unknown `kind`;
    - an extra field;
    - `profile: -1`;
    - `profile: 1.5`;
    - `modifiers: ['LS', 'LC']` (wrong order);
    - `command: 'OUT_NONE'`;
    - a dangling key id;
    - `layers: []`.
  - Two accepting tests: `keycode: 'BANG'` and `profile: 7` are accepted here and reported by validation instead (R7).
  - Keep `satisfies z.ZodType<Project>`. Update the existing v2 fixtures/tests to v3 (`src/storage/*.test.ts`, `tests/fixtures/schematic/large.json` through the migration, not by editing it).
- [X] T009 [P] Test first, then extend `src/domain/remove-key.ts` (`remove-key.test.ts`):
  - removing a key deletes its entry in every layer's `bindings`;
  - other keys keep their bindings although their indices shift (SC-004);
  - an unknown key id still returns the same project reference.
- [X] T010 [P] Test first, then add `bindingsPanel: ToolWindowState` (default `{ xPx: 100000, yPx: 28, isCollapsed: false }`, R11) and `isBindingsTableOpen: boolean` (default `true`) to `src/storage/preferences.ts`.
  - Each field gets its own `.catch(default)` fallback; there is no version bump. Stored preferences without the new fields load unchanged (test in `preferences.test.ts`).
  - Add both rows to `specs/001-app-shell-ui/contracts/preferences-storage.md`.

**Catalog** (after T003, T005)

- [X] T011 Test first (`src/catalog/parse-keys-header.test.ts`, on small inline header strings), then implement `src/catalog/parse-keys-header.ts` (R2, R3). `parseKeysHeader(raw: string): readonly Keycode[]`, with `Keycode` exactly as in data-model.md. Rules:
  - A block starts at a `/* … */` comment, whose text becomes the `description`.
  - The first `#define` after it is canonical.
  - A following `#define` whose value is `(CANONICAL)` is an alias.
  - Lines containing `DEPRECATED` are skipped.
  - A `#define` value wrapped onto the next line is joined first.
  - `(LS(ZMK_HID_USAGE(page, id)))` gives `implicitModifiers: ['LS']` and `usage { page, id }`.
  - `category` comes from the ordered rule list in research R3; `docsUrl` = `https://v0-3-branch.zmk.dev/docs/keymaps/list-of-keycodes` + the category anchor from R3.
  
  Cases:
  - a block with 2 aliases and 1 deprecated alias;
  - a wrapped define;
  - a shifted symbol;
  - one sample per category rule;
  - the fallback to `other`.
- [X] T012 Test first (`src/catalog/keycodes.test.ts`, on the real header), then implement `src/catalog/keycodes.ts`:
  - `import keysHeader from './zmk/keys.h?raw'`;
  - `KEYCODES = parseKeysHeader(keysHeader)`;
  - `keycodeByName: ReadonlyMap<string, Keycode>`, keyed by the canonical name and every alias;
  - `MODIFIER_KEYCODES`: the 8 modifiers, LEFT_CONTROL … RIGHT_GUI.
  
  Invariants from contracts/catalog.md:
  - the count equals the number of `/*` blocks in the header;
  - no name contains a deprecated define (e.g. `BANG`, `NUM_1`);
  - `keycodeByName.get('N4')?.name === 'NUMBER_4'`;
  - `DOLLAR` has `implicitModifiers ['LS']` and the usage of `NUMBER_4`;
  - every category is non-empty;
  - the canonical names are unique;
  - every `docsUrl` starts with `https://v0-3-branch.zmk.dev/docs/`.
- [X] T013 [P] Test first (`src/catalog/behaviors.test.ts`), then implement `src/catalog/behaviors.ts`, `src/catalog/bluetooth-commands.ts` and `src/catalog/output-commands.ts`. They are `as const satisfies` tables with `label`, one-line `description` and `docsUrl`, exactly per contracts/catalog.md:
  - 13 behaviors in panel order;
  - `BLUETOOTH_COMMANDS` with `needsProfile`;
  - `BLUETOOTH_PROFILE_COUNT = 5`;
  - `OUTPUT_COMMANDS` without `OUT_NONE`.
  
  Tests:
  - every entry has a non-empty label, description and a v0.3 `docsUrl`;
  - `BEHAVIORS` ids are exactly the `BehaviorId` union (typecheck through `satisfies Record<BehaviorId, …>` helper map);
  - no layer, RGB, backlight, ext-power, mouse, soft-off or studio behavior (FR-017).
  
  Read `docs/zmk/behaviors.md` §1–2 first.
- [X] T014 [P] Implement `src/catalog/keycode-legends.ts`: `KEYCODE_LEGENDS: Readonly<Record<string, string>>` (research R5), about 60 entries:
  - Enter ⏎, Backspace ⌫, Delete ⌦, Tab ⇥, Escape ⎋, Space ␣;
  - arrows ← → ↑ ↓, Home ⇱, End ⇲, PgUp ⇞, PgDn ⇟;
  - modifiers ⌃ ⇧ ⌥ ⌘ (right ones `R⌃` …);
  - Caps ⇪, Print `PrtSc`, Insert `Ins`;
  - media ▶⏸ ⏭ ⏮ ⏹, mute 🔇, volume 🔉 🔊, brightness 🔅 🔆.
  
  Test in `keycodes.test.ts`: every key of the record is a canonical name in `KEYCODES`.
- [X] T015 Implement `src/catalog/bindings-catalog.ts`: `BINDINGS_CATALOG = { keycodeNames: new Set(keycodeByName.keys()), bluetoothProfileCount: BLUETOOTH_PROFILE_COUNT }`. Its type `BindingsCatalog` is declared in `src/domain/validate-bindings.ts` (T017) and imported here (catalog → domain is allowed). Run the `zmk-reviewer` agent on `src/catalog/`.

**Domain queries and validation** (after T005)

- [X] T016 [P] Test first, then implement `src/domain/find-binding.ts`: `findBinding(project, { layerIndex, keyId }): Binding | undefined`. Also `src/domain/get-shared-binding.ts`: `getSharedBinding(project, { layerIndex, keyIds })` returns:
  - `{ kind: 'unassigned' }` when the key list is empty or every key is unassigned;
  - `{ kind: 'same'; binding }` when all bindings are deep-equal;
  - `{ kind: 'mixed' }` otherwise, including assigned + unassigned.
- [X] T017 Test first, then implement `src/domain/validate-bindings.ts` per contracts/validation-issues.md.
  - Signature: `validateBindings(project, catalog: BindingsCatalog)`, with `BindingsCatalog = { keycodeNames: ReadonlySet<string>; bluetoothProfileCount: number }` exported here.
  - `binding-keycode-unknown`: `kp`/`sk`/`kt` key, or `mt` hold or tap; one issue per key, naming the first unknown name.
  - `binding-profile-out-of-range`: `BT_SEL`/`BT_DISC` with `profile ≥ count`.
  - Path: `['layers', L, 'bindings', keyId]`. The message says "Key N on layer <name> …", where N is the key index.
  - Order: layer index, then key index, then code.
  - Tests assert `code` and `path` only.
- [X] T018 Add the catalog argument (test first):
  - `validateProject(project, catalog: BindingsCatalog)` in `src/domain/validate-project.ts` appends `validateBindings`; update `validate-project.test.ts` to pass a small test catalog.
  - `src/ui/project-context.tsx` calls it with `BINDINGS_CATALOG`.
  - `src/ui/shell/workspace-issue.ts` maps both new codes to `'bindings'`.
  - Every other caller (`grep -rn validateProject src`) passes the catalog.
- [X] T019 [P] Test first, then implement `src/ui/bindings/format-binding-name.ts`: `formatBindingName(binding: Binding | undefined, keycodes: ReadonlyMap<string, Keycode>): string`, the full name for aria-labels, the table and status messages (FR-007). Examples:
  - `undefined` → "Not assigned (does nothing)";
  - `kp SPACE` → "Space";
  - `kp A` + `LC`,`LS` → "Left Ctrl + Left Shift + A";
  - `mt LSHIFT SPACE` → "Space, Left Shift when held";
  - `bt BT_SEL 1` → "Bluetooth: select profile 1";
  - `out OUT_USB` → "Output: USB";
  - `trans` → "Pass-through";
  - an unknown keycode → "Unknown key BANG".
  
  Names come from the catalog labels (behaviors, commands) and keycode descriptions, cleaned: "Keyboard Spacebar" → "Space". The cleanup rule is tested.

**Checkpoint**: `make check` green. The project is v3; the catalog is loaded and tested; issues for bad bindings appear in the problems panel (not yet focusable).

---

## Phase 3: User Story 1 — See the keyboard as keycaps (P1) 🎯 MVP

**Goal**: Bindings mirrors the schematic: keycaps at the key positions over dimmed, inert wires; selection by pointer and keyboard.

**Independent test**: 3 keys and wires in Schematic → Bindings shows 3 empty keycaps and dimmed wires. Dragging moves nothing, and Undo stays unavailable (quickstart step 1).

- [X] T020 [P] [US1] Implement `src/ui/bindings/wires-backdrop.tsx` (R10, contracts/ui.md):
  - `<g aria-hidden="true" pointerEvents="none" className="opacity-40">`;
  - wire paths from `getWirePath` (domain) + `toPathData` (canvas), class `fill-none stroke-text`, `vectorEffect="non-scaling-stroke"`;
  - junction dots for `junction` ends;
  - board-pin labels (`formatBoardPin`) for free ends with a board pin.
  
  No crossing buttons, no handles. Add an `opacity-*` token to `src/styles.css` only if lint rejects `opacity-40`.
- [X] T021 [P] [US1] Implement `src/ui/bindings/keycap-shape.tsx`:
  - `<g role="graphics-symbol" tabIndex={isActive ? 0 : -1} aria-label data-key-id data-selected data-conflict data-issue-path={`layers.0.bindings.${key.id}`}>`;
  - an outer rounded rect (`fill-surface-muted stroke-border-strong`, selected `stroke-accent stroke-3`, focus `group-focus-visible:stroke-focus`) and an inner top surface (`fill-surface-raised`), sized from the key's 1u cell;
  - the key index at the top left, `aria-hidden`;
  - `tap`/`hold` legend `<text>` elements, `aria-hidden`, rendered only when the legend props are defined and `pxPerU * zoom ≥ 0.4 × PX_PER_U` (legends hidden below 40% zoom);
  - a conflict warning mark like `key-art.tsx`.
  
  `onKeyDown(keyId, event)` and `onFocus(keyId)` handlers are passed from the canvas (react.md "Canvas performance").
- [X] T022 [US1] Implement `src/ui/bindings/use-bindings-pointer.ts`. It returns the `WorkSurface` `content` pointer callbacks:
  - a primary click on a keycap (hit via `data-key-id` on `event.target`) selects that key only;
  - Ctrl/Cmd+click toggles it;
  - a press on empty space starts a marquee (`canvas/marquee-layer.tsx`), and release selects the keys whose 1u cell intersects it;
  - a click on empty space without drag clears the selection.
  
  It never commits (FR-002). Test the marquee hit function if it is extracted as a pure helper.
- [X] T023 [US1] Implement `src/ui/bindings/bindings-canvas.tsx`:
  - `WorkSurface workspaceId="bindings"` with `content` = `WiresBackdrop`, then keycaps, then marquee;
  - the canvas `aria-label` "Bindings canvas, N keys" + `<desc>` pointing to the Bindings table;
  - keycap `onKeyDown`, following contracts/ui.md and `stopPropagation` like Schematic keys: arrows → `findNearestKey` (canvas) moves focus and selection, Home/End, Ctrl/Cmd+Space toggle, Escape clear, Enter → `onOpenPanel()`.
  
  Keycap labels use `formatBindingName` (T019): "Key N, Base layer: <name>" + ", selected".
- [X] T024 [US1] Replace `src/ui/bindings/bindings-workspace.tsx`. It owns `selectedKeyIds: readonly string[]` and `activeKeyId`, and renders `BindingsCanvas`.
  - Keys deleted in Schematic are dropped from the selection, derived in render: filter by existing ids, no effect.
  - With `project.keys.length === 0`, it renders `EmptyState` "No keys yet. Draw keys in Schematic." + `Button` "Go to Schematic" → `changePreferences({ activeWorkspaceId: 'schematic' })` (FR-004).
  - It sets `<title>Bindings — ZMK Customizer</title>` if the shell does not already.

**Checkpoint**: US1 independent test passes; `make check` green.

---

## Phase 4: User Story 3 — Readable legends (P1)

**Goal**: every keycap shows a tap legend and an optional hold legend with symbols, shifted symbols and truncation.

**Independent test**: set bindings through a hand-edited project file (or the US2 panel once it exists), then check the legends `A`, `⇧A`→`A` with prefix, `$`, `␣`/`⇧`, `▽`, `✕`, `BT 1` (quickstart step 2–3).

- [X] T025 [US3] Test first (`src/ui/bindings/format-binding-legend.test.ts`), then implement `src/ui/bindings/format-binding-legend.ts`: `formatBindingLegend(binding: Binding | undefined, keycodes): { tap: string; hold?: string } | undefined` (undefined = unassigned = empty keycap), per research R5. The keycode legend is the first that applies:
  1. `KEYCODE_LEGENDS`;
  2. a single-char symbol from the description (`Keyboard $ (Dollar)` → `$`);
  3. an upper-case letter;
  4. a digit;
  5. `F13`;
  6. the shortest name.
  
  Rules:
  - The modifier prefix is in the order ⌃⇧⌥⌘; right-hand modifiers get `R`.
  - Shifted-symbol rule (FR-006a): `LS` or `RS` plus a keycode whose `(page, id)` has an implicit-`LS` entry shows that entry's legend without the shift. So `N4`+`LS`, `N4`+`RS` and `DOLLAR` all → `$`, and `DOLLAR`+`LC` → `⌃$`.
  - A legend longer than 5 characters becomes 4 characters + `…`.
  - Behavior legends per R5: `mt` tap/hold, `sk` hold `STK`, `kt` hold `TOG`, `▽`, `✕`, `CW`, `REP`, `BT 1`, `USB`, `BOOT`, …
  - An unknown keycode shows `?` + the name truncated.
- [X] T026 [US3] Wire the legends into `src/ui/bindings/bindings-canvas.tsx` → `KeycapShape` (`tap` large centered, `hold` small at the bottom). Add a native SVG `<title>` with the full `formatBindingName` inside each keycap for the hover tooltip (FR-007); it is `aria-hidden` through the `g` label, so the name is not read twice. Check this with VoiceOver in T048.

**Checkpoint**: legends render for every binding kind; `make check` green.

---

## Phase 5: User Story 2 — Assign an action to a key (P1)

**Goal**: the floating Action panel with kind → choice steps, search, descriptions and docs links; choices commit immediately.

**Independent test**: click key 0 → Send a key → type `spa` → Enter. The keycap shows `␣`; reload keeps it; undo clears it (quickstart step 2).

- [X] T027 [P] [US2] Test first, then implement `src/domain/set-bindings.ts`: `setBindings(project, { layerIndex, keyIds, binding })` sets the binding for every listed existing key.
  - It returns the same project reference when every key already has a deep-equal binding, or when the key list is empty.
  - Unknown key ids are ignored.
  - Test: 3 keys set at once; the no-op returns the same reference; the other layer entries are untouched.
- [X] T028 [P] [US2] Test first, then implement `src/domain/set-key-press-modifier.ts`: `setKeyPressModifier(project, { layerIndex, keyIds, modifier, isEnabled })`.
  - For each listed key whose binding is `kp`, it adds or removes `modifier`, keeping the order `LC LS LA LG RC RS RA RG`.
  - Other keys are unchanged, and it returns the same reference when nothing changes (FR-011).
- [X] T029 [P] [US2] Test first, then implement `src/ui/bindings/filter-choices.ts`: `filterChoices(choices, query)`.
  - It trims the query and ignores case, and matches the name, aliases and description by substring. An empty query returns everything.
  - It keeps the input order.
  - Tests: `spa` → Space; `$` → Dollar (via the description); `volume up` → C_VOLUME_UP; `f13` → F13; `print screen` → PRINTSCREEN (SC-002).
- [X] T030 [P] [US2] Test first, then implement `src/ui/bindings/get-panel-step-for-selection.ts`: `getPanelStepForSelection(shared: SharedBinding, current: PanelStep): PanelStep` (FR-009a, data-model "Panel step").
  - A `same` binding whose kind has choices (`kp mt sk kt bt out`) → step 2 of that kind, first part.
  - `unassigned`, `mixed`, or a kind without choices → `current` unchanged.
  - Search text is not part of the step; the workspace clears it only when the kind changes.
- [X] T031 [US2] Add `size: 'narrow' | 'wide'` (default `'narrow'`) to `src/ui/components/floating-panel.tsx` as a typed `Record` of complete class strings (`w-44` / `w-80`) (tailwind.md "Variants"). Keep `ToolWindow` unchanged.
- [X] T032 [US2] (Merged into T033's `ChoiceList`: step 1 renders the kinds with the same list; `src/ui/components/docs-link.tsx` created.) Implement `src/ui/bindings/behavior-list.tsx`, step 1 (contracts/ui.md):
  - the `BEHAVIORS` list as `role="listbox"` options;
  - each option shows the label, the description and a `DocsLink`. Create `src/ui/components/docs-link.tsx` per admin-ui.md if it does not exist: `href`, `topic`, sr-only "(opens in a new tab)";
  - the current kind has `aria-selected` and a check mark;
  - arrow keys, Home/End and Enter; `onChoose(behaviorId)`.
- [X] T033 [US2] (`listbox`/`option` roles fail jsx-a11y `prefer-tag-over-role`, so the list is native `aria-pressed` buttons with a roving tabindex; contracts/ui.md updated; keyboard logic tested via `move-active-index.test.ts` and the pure `get-choice-result.test.ts`.) Implement `src/ui/bindings/choice-list.tsx`, step 2 generic list (R11, FR-013):
  - props `choices: readonly Choice[]` (`{ id, label, legend?, aliases?, description, group? }`), `currentId`, `search`, `onSearchChange`, `onChoose`;
  - above 10 choices, an `<input type="search">` "Search keys" that keeps focus and drives `aria-activedescendant` on the listbox; ArrowUp/Down/Home/End move the active option, Enter chooses;
  - options grouped by `group` under `role="group"` with `aria-label`; the body is `max-h-96 overflow-auto`;
  - "No keys match “…”" when empty.
  
  UI test (Vitest + Testing Library, if already set up; otherwise test the pure active-index helper): typing narrows the options, arrows move `aria-activedescendant`, Enter calls `onChoose` with the active id.
- [X] T034 [P] [US2] Implement `src/ui/bindings/modifier-toggles.tsx`: a `fieldset` "Modifiers" with 8 `aria-pressed` buttons L⌃ L⇧ L⌥ L⌘ R⌃ R⇧ R⌥ R⌘, each with an accessible name ("Left Ctrl"). The pressed state = the modifier is on every selected `kp` key, or on the pending toggles; `onToggle(modifier, isEnabled)`.
- [X] T035 [US2] Implement `src/ui/bindings/action-panel.tsx`:
  - `FloatingPanel size="wide" title="Action"`, with position and collapse from preferences `bindingsPanel`;
  - nothing selected: "Select a keycap to choose what it does.";
  - header: "Key N" or "N keys selected" + "same action"/"different actions" (FR-016), and the current `formatBindingName`;
  - step 1: `BehaviorList`; step 2: "Back to kinds" + part title + `ChoiceList` built from the catalog.
  
  The choices of each kind:
  - `kp`: `KEYCODES` grouped by category, + `ModifierToggles`;
  - `mt` hold / `sk`: `MODIFIER_KEYCODES` group first, then all;
  - `mt` tap / `kt`: all keycodes;
  - `bt`: `BLUETOOTH_COMMANDS`, then profiles 0…`BLUETOOTH_PROFILE_COUNT-1`;
  - `out`: `OUTPUT_COMMANDS`.
  
  It is split into subcomponents if it exceeds the lint limits. It holds no project rules and calls the handlers from props.
- [X] T036 [US2] Wire the panel in `src/ui/bindings/bindings-workspace.tsx`.
  - State: `step` (`getPanelStepForSelection` on each selection change, computed in the selection handler, not an effect), `search`, and pending parts (`mt` hold, `bt` command, modifier toggles when the selection has no `kp`).
  - Handlers:
    - a kind without choices → `commit(setBindings(… { kind }))`;
    - a final choice → `commit(setBindings(…))` with the pending parts and toggles (FR-014);
    - a modifier toggle with all `kp` → `commit(setKeyPressModifier(…))`.
  - Status message: "Key 12: Space" / "3 keys: Do nothing".
  - Focus: Enter on a keycap or "Choose action" moves focus to the panel's first control; Escape in step 2 → step 1; Escape in step 1 → the active keycap (FR-025).
- [ ] T037 [US2] Manually check US2 acceptance scenarios 1–7 (quickstart steps 2–3) and record the result here.

**Checkpoint**: US1 + US3 + US2 = a usable single-layer bindings editor; `make check` green.

---

## Phase 6: User Story 6 — Actions are part of the project (P1)

**Goal**: bindings persist, follow their key, old files load, bad bindings are reported and focusable.

**Independent test**: quickstart steps 6–7.

- [X] T038 [US6] Test (`src/storage/parse-project-file.test.ts`, `project-storage.test.ts`): a v3 project with every binding kind round-trips deep-equal through `serializeProject` → `parseProjectFile` and through autosave; the v2 fixture file opens with empty bindings (FR-023, FR-024, SC-003).
- [X] T039 [US6] Make problem activation reach the key (FR-022, contracts/validation-issues.md).
  - `KeycapShape` already carries `data-issue-path="layers.0.bindings.<keyId>"` (T021), and focusing it selects the key (T023), so the panel follows.
  - In `src/ui/shell/issues-panel.tsx` `IssueButton`, add `isPartsListOpen: true` to the preference change only when `issue.workspaceId === 'schematic'`, so a Bindings issue does not touch Schematic preferences.
  - Add a test for that branch if `issues-panel` has tests; otherwise check it manually in T040.
- [ ] T040 [US6] Manually check quickstart steps 6–7: delete key 1 in Schematic, and the others keep their actions; reload; save/open; a spec 003 file; a file with `BANG` and profile 7 gives 2 issues under Bindings with the badge showing 2, and activating an issue focuses the keycap; a file with `kind: 'foo'` is rejected, and the current project is unchanged. Record the result here.

**Checkpoint**: all P1 stories done; `make check` green.

---

## Phase 7: User Story 4 — Several keys, copy and paste (P2)

**Goal**: multi-assign in one undo step; in-app copy/paste of a binding.

**Independent test**: quickstart step 4.

- [X] T041 [US4] Add `copy-binding` (Mod+C, `code: 'KeyC'`) and `paste-binding` (Mod+V, `code: 'KeyV'`) with a new `scope: 'bindings'` to `src/ui/shortcuts.ts` (+ `shortcuts.test.ts`), shown in the help dialog. Update `specs/001-app-shell-ui/contracts/shortcuts.md`. Make sure the `app.tsx` global handler ignores the new scope.
- [X] T042 [US4] Implement `src/ui/bindings/use-bindings-shortcuts.ts`: a `globalThis` `keydown` effect with cleanup, like `schematic/use-schematic-shortcuts.ts`.
  - It acts only when `event.target` is inside `[data-canvas-workspace="bindings"]` or the Bindings table, and is not an `input`/`textarea`/`select` (accessibility.md #6).
  - Mod+C with exactly one selected key → `onCopy`; Mod+V with a copied binding and a selection → `onPaste`. It calls `preventDefault` only when it acts.
- [X] T043 [US4] In `src/ui/bindings/bindings-workspace.tsx` + `action-panel.tsx`:
  - `copiedBinding` state (`findBinding` of the single selected key; an unassigned key copies `{ kind: 'none' }`);
  - panel buttons "Copy action" (disabled unless 1 key is selected) and "Paste action" (disabled without a copied binding, with a hint "Copy an action first");
  - paste = one `commit(setBindings(… copiedBinding))`;
  - status "Copied Space" / "Pasted Space to 2 keys".
  
  Multi-select assignment already works through `setBindings`. Check that the header says "N keys selected, different actions" and that no kind is marked for `mixed`.

**Checkpoint**: US4 independent test passes.

---

## Phase 8: User Story 5 — List alternative (P2)

**Goal**: a table with every key and its action, shared selection, full keyboard path.

**Independent test**: with the mouse unplugged, assign an action to key 2 using only the table and the panel (quickstart step 5).

- [X] T044 [US5] Implement `src/ui/bindings/bindings-table.tsx` (contracts/ui.md "Bindings table", admin-ui.md "Tables"):
  - a `<section aria-labelledby>` with `<h2>` "Keys", collapsible, with open state from preference `isBindingsTableOpen`;
  - columns: a selection checkbox "Select key N" (a roving-tabindex selection column: ArrowUp/Down move, Space toggles, Shift+ArrowUp/Down extends); `<th scope="row" tabIndex={-1}>Key N</th>`; the action (`formatBindingName`) + the issue message with a warning icon (issues found by path `layers.0.bindings.<keyId>`); a `Button` "Choose action" → the workspace's open-panel handler;
  - `data-selected` row styling.
  
  If the `Table` primitive exists in `components/`, use it; otherwise inline, like `schematic/parts-keys-table.tsx`.
- [X] T045 [US5] Render `BindingsTable` below `BindingsCanvas` in `src/ui/bindings/bindings-workspace.tsx` with the shared `selectedKeyIds` and `onSelectionChange`. Check that Mod+C/V work with focus in the table (T042).

**Checkpoint**: all stories done.

---

## Phase 9: Polish & cross-cutting

- [X] T046 [P] Update the docs:
  - AGENTS.md §9 if the repository map changes (`src/catalog/zmk/`);
  - `docs/zmk/keymap.md` §4: the note that the catalog is parsed from the vendored header (R2);
  - `specs/001-app-shell-ui/contracts/ui-regions.md`: the Bindings slots (panel, table).
- [X] T047 (Done 2026-09-28: zmk-reviewer approved with minors, docs anchors, keyboard-page media and BT_DISC text fixed; spec-reviewer findings fixed: whole-legend cap, `isEveryKeyPress` domain query, tests for `isSameBinding`/`setLayerBindings`, roadmap rule and dependencies, spec/contract texts. Deferred: `requiresKconfig: CONFIG_ZMK_BLE` on `&bt` for the generator feature; `MODIFIERS` stays in `types.ts`.) Run the `zmk-reviewer` agent on `src/catalog/` and `src/domain/types.ts` (Binding ↔ ZMK syntax), and the `spec-reviewer` agent on `specs/004-bindings-keycaps/`. Fix the findings.
- [ ] T048 Do the manual accessibility pass, `docs/guidelines/frontend/accessibility.md` checklist steps 1–10: keyboard only, tab order, one tab stop per canvas/list/table selection column, the panel's Escape paths, Mod+C/V inert in the search field, the issue focus, VoiceOver names ("Key 12, Base layer: Space, Left Shift when held"), both themes (contrast of the dimmed backdrop against keycaps), 200% zoom, reduced motion. Record the results here.
- [ ] T049 Check performance (SC-007): load `tests/fixtures/schematic/large.json` (100 keys, 300 wires) in the app, and assign one binding to all keys (select all with a marquee, then choose "Do nothing"). Opening Bindings, selecting, and each search keystroke must show no visible lag. Measure with the React profiler only if it lags, then memoize with a comment (react.md).
- [ ] T050 Run quickstart.md fully, including step 8 (docs anchors). If an anchor from R3 is wrong, fix it in `src/catalog/parse-keys-header.ts` and research.md. Then `make check`.

---

## Dependencies & execution order

- **Setup** (T001–T004): T003 and T004 are independent; T001 and T002 are docs only.
- **Foundational** (T005–T019): T005 first.
  - Then, in parallel: T006, T007 → T008; T009; T010; T016; T019 (needs T012 for real names, but can test on a stub map).
  - Catalog: T011 → T012 → T014, T015; T013 is parallel to T011.
  - T017 needs T005; T018 needs T015 + T017.
- **US1** (T020–T024) needs Foundational. T020 ∥ T021 → T022 → T023 → T024.
- **US3** (T025–T026) needs US1 (keycap) and T012/T014.
- **US2** (T027–T037) needs US1 and US3. T027 ∥ T028 ∥ T029 ∥ T030 ∥ T034 → T031 → T032, T033 → T035 → T036 → T037.
- **US6** (T038–T040) needs T008 and US1 (keycap focus target); it is independent of US2 apart from the manual step.
- **US4** (T041–T043) needs US2.
- **US5** (T044–T045) needs US1 and US2 (open-panel handler); it is parallel to US4.
- **Polish** last.

## Parallel examples

- Foundational: `T006`, `T009`, `T010`, `T013`, `T016` at once (different files, all after T005).
- US1: `T020 wires-backdrop.tsx` ∥ `T021 keycap-shape.tsx`.
- US2: `T027 set-bindings`, `T028 set-key-press-modifier`, `T029 filter-choices`, `T030 get-panel-step-for-selection`, `T034 modifier-toggles` at once.
- P2: US4 (T041–T043) ∥ US5 (T044–T045) after US2.

## Implementation strategy

1. **MVP** = Setup + Foundational + US1 + US3 + US2: see the keyboard as keycaps and assign any supported action with search. That already covers the user's core request.
2. Add US6 (persistence edge cases and problem focus). Persistence itself already works from Foundational.
3. Add US4 and US5 (P2), in parallel if two agents work.
4. Polish: reviews, the accessibility pass, performance, and the full quickstart.

Commit after each task or logical group (Conventional Commits, e.g. `feat(catalog): parse ZMK v0.3 keys.h`).

---

## Phase 10: Key picker redesign (spec US2 rewrite, research R14)

**Goal**: one-screen keyboard picker, docked full-height panel, hold and press mode as key options, auto-advance, Keys table collapsed by default.

**Independent test**: spec US2 independent test and SC-009.

- [X] T051 Test first, then implement the domain operations (research R14): `src/domain/set-keycode.ts`, `set-hold-key.ts`, `set-press-mode.ts`; extend `set-key-press-modifier.ts` and `is-every-key-press.ts` to cover `mt` taps. Each gets tests for the mode-keeping rules and the same-reference no-op.
- [X] T052 Preferences, test first. In `src/storage/preferences.ts`: remove `bindingsPanel`; add `isBindingsPanelOpen` (default `true`) and `isAutoAdvanceEnabled` (default `true`); set `isBindingsTableOpen` to default `false`. Update `specs/001-app-shell-ui/contracts/preferences-storage.md`. Remove the `FloatingPanel` `size` variant.
- [X] T053 Test first, then implement `src/ui/bindings/picker-tabs.ts`: the tab data (Basic ANSI rows with widths, Nav, F keys, Media, Mods, System bindings, More = the rest by category), every catalog keycode reachable exactly once, a legend + name + description + docsUrl per item. Also `move-in-grid.ts` (+ test) for mini-keyboard arrows.
- [X] T054 [US2] Implement the UI: `mini-keyboard.tsx`, `key-picker.tsx` (preview, search results, tabs, chips, When held, press mode, auto-advance switch), and the docked `action-panel.tsx`; wire them in `use-bindings-workspace.ts` / `use-bindings-interaction.ts`. Delete the step files named in plan.md.
- [X] T055 [US2] Check it headless with a CDP screenshot (Basic tab, a search, the System tab), fix the layout, and run `npm run check`.

## Standard-size amendment (2026-10-21)

Bindings gains only explicit standard-size editing through the contextual Keycap size chooser and labeled Keys-table action, superseding read-only geometry wording for this operation. No arbitrary resizing/numeric sizing, movement or nudge is added to Bindings. See [012 specification](../012-layout-editor/spec.md) FR-017–020 and its plan/tasks; single evidence journal: standard-keycap-verification.md in 012. Center/contact positions, project compatibility and one-step Undo/Redo are preserved; overlaps use existing validation.
