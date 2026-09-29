# Research: Bindings keycaps

Decisions for `plan.md`. Each: Decision / Rationale / Alternatives.

## R1. Roadmap position

- **Decision**: Insert this feature as 004 and `005-layers` right after 003 in `docs/roadmap.md`. Renumber later features by +2 (004 shield-generators becomes 006, and so on). Roadmap 009 keymap-editor shrinks to what 004 and 005 do not cover: layer management moves to 005, and the picker to 004. It keeps the "keymap round-trips byte-identical" acceptance for the generator feature. First task.
- **Rationale**: same approach as 003 (user request inserted before the generators). Spec Kit numbers specs by counting directories, so the roadmap must match.
- **Alternatives**: keep 009 and build it now out of order (numbering collides with the next `/speckit-specify`).

## R2. Keycode catalog source: vendored `keys.h`, parsed at load

- **Decision**: Copy upstream `app/include/dt-bindings/zmk/keys.h` at tag v0.3.0 (MIT, 1445 lines, 374 comment blocks, 644 `#define`s, 63 deprecated) verbatim to `src/catalog/zmk/keys.h`. It is never edited, like `tests/fixtures/upstream/`. `src/catalog/keycodes.ts` imports it with Vite `?raw` (`vite/client` types are already in `tsconfig.json`) and exports `KEYCODES = parseKeysHeader(raw)`. `parseKeysHeader` is a pure function in `src/catalog/parse-keys-header.ts`, and it works like this:
  - A `/* … */` comment starts a block. The first `#define` after it is canonical; its comment text is the `description`.
  - A following `#define` whose value is `(CANONICAL)` is an alias.
  - Lines containing `DEPRECATED` are skipped.
  - A `#define` value may wrap to the next line (clang-format); join those lines before matching.
  - The value `(LS(ZMK_HID_USAGE(page, usage)))` gives `implicitModifiers: ['LS']`. `page` and `usage` are kept as strings, for categories (R3) and legend equivalence (R5).
- **Rationale**: AGENTS §3.4 says to generate keycodes from `keys.h` and forbids `hid.js` (CC-BY-NC-SA). A vendored verbatim file plus a parser has no drift and needs no generator script. Updating ZMK means replacing one file. The file is about 50 KB raw, about 8 KB gzipped, parsed once in under 1 ms.
- **Alternatives**:
  - A committed generated `keycodes.ts` plus a `scripts/` generator: two artifacts that can drift, and a new tooling folder.
  - Hand-writing about 370 entries: error-prone and against §3.4.
  - Bundling `hid.js`: license.
- **Deviation noted**: `typescript.md` wants catalog tables `as const … satisfies`. The keycode table is derived instead, so `KeycodeName` is `string`, not a literal union. That is acceptable: binding keycodes come from untrusted files anyway and are checked by `validateBindings` (R8). Behaviors, Bluetooth and output commands stay `as const` tables.

## R3. Keycode categories

- **Decision**: Assign categories with an ordered rule list over `(page, usage, canonical name, implicitModifiers)`. The first match wins; `other` is the fallback. Categories and their v0.3 docs anchors (from the headings of `docs/docs/keymaps/list-of-keycodes.mdx` at v0.3.0; Docusaurus slugs):

  | Category | Rule (first match) | Docs anchor |
  |---|---|---|
  | modifiers | usage `…LEFT/RIGHT_CONTROL/SHIFT/ALT/GUI` | `#modifiers` |
  | letters | usage `HID_USAGE_KEY_KEYBOARD_[A-Z]` | `#letters` |
  | numbers | usage `HID_USAGE_KEY_KEYBOARD_[0-9]_AND_…` without implicit mods | `#numbers` |
  | function | usage `…_F[0-9]+` | `#f-keys` |
  | keypad | usage `HID_USAGE_KEY_KEYPAD_…` | `#numbers-1` |
  | navigation | arrows, home/end, page up/down, insert, delete forward | `#navigation` |
  | whitespace & editing | enter, escape, backspace, tab, space, and consumer AC cut/copy/paste/undo/redo | `#control--whitespace` |
  | locks | caps/num/scroll lock (incl. locking variants) | `#locks` |
  | international & language | usage `…INTERNATIONAL…`, `…LANG…` | `#international` |
  | symbols | page KEY, remaining punctuation, plus every entry with implicit `LS` | `#symbols--punctuation` |
  | media & consumer | page CONSUMER | `#media` |
  | power | page GD | `#power--lock` |
  | other | fallback | `#miscellaneous` |

  Every keycode's `docsUrl` is `https://v0-3-branch.zmk.dev/docs/keymaps/list-of-keycodes` plus its category anchor.
- **Rationale**: spec FR-010 needs about 12 categories. `groups.js` has the same license as `hid.js`, so the grouping is ours. Rules over usage names are about 20 lines, instead of 370 table rows.
- **Open to verify**: the v0.3 page renders the tables on the client, so the anchors were derived from the mdx headings, not read from HTML. The manual quickstart step opens three of them. A test checks that every URL starts with the v0.3 docs base.
- **Alternatives**: one flat list (FR-010 asks for categories); a hand-written category per name.

## R4. Binding model

- **Decision**: The `Binding` discriminated union uses `kind` = the ZMK behavior label without `&`: `kp`, `mt`, `sk`, `kt`, `trans`, `none`, `caps_word`, `key_repeat`, `gresc`, `bt`, `out`, `sys_reset`, `bootloader`. Key parameters are a `KeyStroke = { keycode: string; modifiers: readonly Modifier[] }`, where `Modifier` is `'LC' | 'LS' | 'LA' | 'LG' | 'RC' | 'RS' | 'RA' | 'RG'` (ZMK modifier function names, `docs/zmk/keymap.md` §4), stored in that fixed order. `bt` is two variants: without a profile (`BT_CLR`, `BT_CLR_ALL`, `BT_NXT`, `BT_PRV`) and with a profile (`BT_SEL`, `BT_DISC` + `profile`). `out` has a command from `OUT_TOG | OUT_USB | OUT_BLE` (`OUT_NONE` is main only). Exact shapes are in `data-model.md`.
- **Rationale**:
  - `kind` equal to the label makes the generator trivial (`&${kind}`) and matches `docs/zmk/behaviors.md` §1.
  - Modifiers as a list, not nested strings, make toggles (FR-011) a set operation. The generator nests them in a fixed order.
  - Two `bt` variants avoid an optional `profile` bag (`typescript.md`).
- **Alternatives**:
  - Store the raw binding text `&kp LC(A)`: needs parsing everywhere, and toggles become string surgery.
  - One `kind: 'bt'` with an optional profile: rejected by the guideline.

## R5. Legends and shifted-symbol equivalence

- **Decision**: `formatBindingLegend(binding, keycodes) → { tap: string; hold?: string }` and `formatBindingName(...)` (the full text) live in `src/ui/bindings/`, as pure tested functions.
  - A keystroke's effective modifiers are its `modifiers` plus the keycode's `implicitModifiers`.
  - If the effective modifiers contain `LS` or `RS` and a catalog entry exists with the same `(page, usage)` and implicit `LS`, the legend is that entry's legend (`$`), and the shift is dropped from the prefix (FR-006a).
  - The other modifiers become a prefix in fixed order ⌃⇧⌥⌘. A right-hand modifier gets a small "R" before its symbol: `R⌘`.
  - Keycode legends come from a hand-written `KEYCODE_LEGENDS` record (about 60 entries: ⏎ ⌫ ⌦ ⇥ ⎋ ␣ arrows, modifiers, media ▶ ⏭ 🔇 …), keyed by canonical name. Without an entry, the fallbacks are:
    - a single-character symbol from the description (`Keyboard $ (Dollar)` gives `$`);
    - for letters, the upper-case name;
    - for numbers, the digit;
    - `F13` style for function keys;
    - otherwise the shortest name.
  - A legend over 5 characters is cut to 4 characters plus `…` (FR-007).
  - Behavior legends: `▽` trans, `✕` none, `CW` caps word, `REP` key repeat, `⎋\`` grave-escape, `BT 1` / `BT⌫ 1` / `BT→` / `BT←` / `BT⌫` / `BT⌫*`, `USB`, `BLE`, `OUT`, `RST`, `BOOT`. `mt`: tap = tap keystroke, hold = hold keystroke. `sk`: a `STK` hold line plus the key. `kt`: a `TOG` hold line plus the key.
- **Rationale**: spec US3 and FR-006/006a. Legends are display text, so they belong in `ui/`. The formatting takes the catalog as an argument, like the domain.
- **Alternatives**: store legends in the project (derived data, forbidden); per-OS legends (out of scope).

## R6. Storage: one layer with a record keyed by key id

- **Decision**: Add `Project.layers: readonly Layer[]` with `Layer = { id; name; bindings: Readonly<Record<string, Binding>> }`, keyed by `Key.id`. A missing entry means unassigned, which is `&none` (FR-021). `createProject` and the migration make `[{ id: 'l0', name: 'Base', bindings: {} }]`. `schemaVersion` goes 2 → 3 with `migrateV2ToV3`. `removeKey` also deletes the key's entry in every layer.
- **Rationale**:
  - Tying bindings to the key id keeps them correct across key deletion and renumbering (FR-020, SC-004).
  - A plain record is JSON (AGENTS §3.2). Generators later iterate `project.keys` for order, never the record.
  - Layers as an array are ready for 005.
- **Alternatives**:
  - Bindings indexed by key index: breaks on delete.
  - A `bindings` field on `Key`: layers are a ZMK concept above keys, and 005 would have to rewrite it.
  - A `{ keyId, binding }[]` list: slower lookups, and duplicates are possible.

## R7. Schema: what is rejected and what is reported

- **Decision**: zod checks the binding shape: known `kind`, the right parameter fields, `Modifier` literals, integer `profile ≥ 0`, and a known `bt`/`out` command. A shape error rejects the file, like every other shape error today. Referential integrity is also a rejection: every `bindings` key must be an existing key id, and layer ids must be unique and match `^l\d+$`. Semantic checks become validation issues and leave the file loadable:
  - an unknown keycode name;
  - a `profile` ≥ the Bluetooth profile count.
- **Rationale**: a `Binding` union with an "unknown kind" variant would leak into every `switch` (`assertNever`). The spec's intent, that a file with stale key names still opens, holds for the realistic case: renamed or removed keycodes across ZMK versions.
- **Spec change**: FR-022 and US6 scenario 5 now say that an unknown kind or a wrong shape rejects the file with the zod path (002 behavior), while unknown key names and out-of-range profiles are reported. Already applied to `spec.md`.
- **Alternatives**: a lenient schema with a raw fallback variant (more types, and the export would be blocked anyway).

## R8. Validation with catalog data

- **Decision**: `validateBindings(project, catalog)`, with `catalog = { keycodeNames: ReadonlySet<string>; bluetoothProfileCount: number }`, in `src/domain/`. `validateProject(project, catalog)` gets the same argument. `ProjectProvider` passes `BINDINGS_CATALOG` (built once from `KEYCODES` and `BLUETOOTH_PROFILE_COUNT = 5` in `src/catalog/`). Codes: `binding-keycode-unknown` and `binding-profile-out-of-range`, mapped to workspace `bindings`. Path: `['layers', L, 'bindings', keyId]`. The message names "Key N" by the key index.
- **Rationale**: AGENTS §3.1: catalog data reaches domain functions as arguments; `domain/` imports nothing.
- **Alternatives**: validation inside `ui/` (breaks "domain first"); catalog imports in domain (breaks the layers).

## R9. Domain operations

- **Decision**: Three operations, each total and returning the same `project` reference when nothing changes (the history skips same-reference commits, `ui/project-history.ts`):
  - `setBindings(project, { layerIndex, keyIds, binding })`: one action to many keys (FR-015, FR-018 paste).
  - `setKeyPressModifier(project, { layerIndex, keyIds, modifier, isEnabled })`: only for keys whose binding is `kp`; others are unchanged (FR-011).
  - `removeKey`: extended to drop bindings.
- Queries:
  - `findBinding(project, { layerIndex, keyId })`: `Binding | undefined`.
  - `getSharedBinding(project, { layerIndex, keyIds })`: `{ kind: 'same'; binding } | { kind: 'mixed' } | { kind: 'unassigned' }`. It drives FR-009a and FR-016.
- **Rationale**: one gesture is one commit. The UI never builds bindings by hand beyond picking a catalog choice.
- **Alternatives**: a generic `updateLayer` (banned vague verb; the UI would contain the rules).

## R10. Sharing canvas code with Schematic

- **Decision**: The second user has appeared (`react.md`), so move these from `ui/schematic/` to `ui/canvas/` unchanged:
  - `find-nearest-key.ts` (+ test);
  - `to-path-data.ts`;
  - `marquee-layer.tsx`;
  - `focus-after-delete.ts` if Bindings needs it; it does not, so it stays.
  
  Bindings draws its own dimmed `WiresBackdrop` from `getWirePath` (domain) + `toPathData`: paths, junction dots and board-pin labels, with `pointer-events: none`. No crossing buttons, no handles. The keycap is a new `KeycapShape` in `ui/bindings/`. Selection and pointer handling are local to Bindings: click, Ctrl/Cmd+click, marquee on empty space, through the `WorkSurface` `content` callbacks. Nothing moves.
- **Rationale**: step folders must not import each other (`.oxlintrc.json` overrides). The Schematic layers carry editing props that Bindings must not have.
- **Alternatives**:
  - Reuse `WiresLayer` from schematic: import rule violation, and editing hit targets would leak in.
  - Make a generic key layer for both: premature, since the switch and keycap art differ.

## R11. Action panel

- **Decision**: `FloatingPanel` (components) gets a `size: 'narrow' | 'wide'` variant (`w-44` / `w-80`). Bindings stores its own panel state in preferences: `bindingsPanel: ToolWindowState` and `isBindingsTableOpen: boolean` (default `true`), with its own zod fallback and no preference version bump, the same way as `isPartsListOpen`. The default is `{ xPx: 100000, yPx: 28, isCollapsed: false }`: the existing clamp pins it to the right edge at any width. Panel state is UI state in `BindingsWorkspace`: `step: 'kinds' | { kind: BehaviorId; part?: … }` and `search: string`. The FR-009a rule is a pure function `getPanelStepForSelection(shared, current)` with a test. Lists use `role="listbox"` with a roving `aria-activedescendant` driven from the search input: the search input keeps focus, arrows move the active option, Enter chooses. This is the combobox-list pattern, one tab stop. The list body scrolls (`max-h-96 overflow-auto`).
- **Rationale**: the user chose a floating panel like the tool window (Clarifications). Search plus arrows without moving focus is the fastest keyboard path (SC-001, SC-002).
- **Alternatives**: a docked aside (rejected by the user); a native `<select>` (no search, no descriptions).

## R12. Copy and paste

- **Decision**: The copied binding is `useState` in `BindingsWorkspace` (session only, FR-018). Two new `SHORTCUTS` entries with `scope: 'bindings'`, `Mod+C` / `Mod+V`, matched by `code` (`KeyC`/`KeyV`). They are handled in `ui/bindings/use-bindings-shortcuts.ts` on `globalThis` `keydown`, like `use-schematic-shortcuts.ts`. They are active only when `event.target` is inside the Bindings canvas or the bindings table and is not a text field (`accessibility.md` #6), and they are listed in the help dialog. The panel has "Copy action" and "Paste action" buttons; paste is `disabled` while nothing is copied. The status message says "Copied Space" and "Pasted Space to 2 keys".
- **Rationale**: the system clipboard needs a permission prompt and a format, which adds nothing for in-app reuse.
- **Alternatives**: `navigator.clipboard` with JSON text (async, permission prompt, and it would paste into the search field too).

## R13. Performance

- **Decision**: No memoization at first. Each render computes the legends for about 100 keys with O(1) catalog lookups: `keycodeByName` is a `Map` built once at module load in `catalog/keycodes.ts`. Search filters about 370 entries per keystroke. The wire backdrop reuses `getWirePath`, which is linear. Measure only if SC-007 fails.
- **Rationale**: `react.md`: memoize only after the profiler shows a problem.

## R14. Key picker redesign (2026-09-28, after the first implementation)

- **Decision**: Replace the kind → choice steps with one key-picker screen (spec US2, FR-008–FR-014a):
  - **Panel.** A docked `<aside>` on the right, full height, 20 rem wide (`w-80`). It collapses to a strip, and preference `isBindingsPanelOpen` (default `true`) remembers the state. The floating `bindingsPanel` preference and the `FloatingPanel` size variant are removed; neither was ever released.
  - **Tabs** are data in `ui/bindings/picker-tabs.ts`:
    - Basic is ANSI rows of keycode names with widths in u;
    - Nav, F keys, Media and Mods are curated keycode lists;
    - System lists whole bindings (fixed behaviors, BT select/disconnect 0–4 rows, BT next/previous/clear, outputs, reset, bootloader);
    - More holds every keycode not placed in another tab, grouped by category.
  - **One `PickerItem` type** for both kinds of choice: `{ id, legend, name, description, docsUrl, pick: { kind: 'keycode', keycode } | { kind: 'binding', binding } }`.
  - **Mini keyboard.** Native `<button aria-pressed>` mini keycaps with a roving tabindex, one tab stop per grid. ArrowLeft/Right move within a row; ArrowUp/Down go to the nearest item by index in the next row. A pure `moveInGrid` function has a test.
  - **Search** filters every tab's items (reusing `filterChoices` rules) and shows them grouped by tab. Enter assigns the first result.
  - **Domain operations:**
    - `setKeycode(project, { layerIndex, keyIds, keycode, modifiers })` replaces the key and keeps each key's mode: `kp` → `kp` (its own modifiers), `mt` → new tap (hold kept), `sk`/`kt` → new key, anything else → `kp` with the given modifiers.
    - `setHoldKey(project, { …, hold })` turns `kp` ↔ `mt`.
    - `setPressMode(project, { …, mode })` converts `kp`/`mt`/`sk`/`kt`.
    - `setKeyPressModifier` also changes the tap of `mt`.
    - `isEveryKeyPress` counts `kp` and `mt`.
    - Each operation returns the same project when nothing changes.
  - **Auto-advance.** Preference `isAutoAdvanceEnabled` (default `true`). After a pick with exactly one key selected, the selection moves to key index + 1 (it stays on the last key).
  - **Keys table** starts collapsed: `isBindingsTableOpen` defaults to `false`.
- **Rationale**: the user chose this design. Assigning a key becomes one click instead of two steps. Hold and press mode are properties of the key, not separate kinds. Auto-advance fills a row by clicking letters in order (SC-009).
- **Alternatives**: a command palette (fast, but it does not show the keyboard); polishing the two-step lists (keeps the extra step).
