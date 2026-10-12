# Tasks: Layers

**Input**: Design documents from `/specs/007-layers/` (spec.md, plan.md, research.md R1–R8, data-model.md, contracts/project-json.md, contracts/ui.md, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, constitution.md (all read)

**Tests**: Included — AGENTS.md §8 requires tests first for domain, storage and generators (`*.test.ts` next to the code: write, watch it fail for the right reason, implement). UI logic modules that already have test files (`binding-slots`, `slot-choices`, `pick-slot`, `format-*`) get tests first too. Screens are verified in real Chrome (quickstart.md "Browser").

**Organization**: By user story. `npm run check` is green at every checkpoint and after every implementation task; test-first tasks are red in between, failing for the right reason (missing export or wrong value, not a typo).

## Phase 1: Setup

- [X] T001 Run `npm run check` on the current tree and confirm green before any change (baseline for `src/domain/types.ts`, `src/storage/project-schema.ts`, `src/catalog/behaviors.ts` with 15 entries)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The new binding shapes compile and parse everywhere, layer ids can be created, and the open-layer position exists. No user-visible change yet.

- [X] T002 [P] Failing storage tests in `src/storage/parse-project-file.test.ts`: replace the spec 005 test "rejects the layer behavior %s until layers exist" (superseded, research R2) with: each of `{ kind: 'mo'|'tog'|'to'|'sl', layerId: 'l1' }` and `{ kind: 'lt', layerId: 'l1', tap: { keycode: 'SPACE', modifiers: [] } }` parses; `layerId` naming no layer still parses; rejected at a path starting `layers.0.bindings.k1`: `{ kind: 'mo', layer: 0 }`, `{ kind: 'mo' }`, `{ kind: 'mo', layerId: 'nav' }`, `{ kind: 'mo', layerId: 1 }`, `{ kind: 'lt', layerId: 'l1' }` (no tap), `{ kind: 'tog', layerId: 'l1', tap: … }`, any extra key (contracts/project-json.md)
- [X] T003 Extend `Binding` in `src/domain/types.ts` with `{ readonly kind: 'mo' | 'tog' | 'to' | 'sl'; readonly layerId: string }` and `{ readonly kind: 'lt'; readonly layerId: string; readonly tap: KeyStroke }` (data-model.md; the new `ValidationCode`s arrive with their validators in T019 and T043, so `WORKSPACE_BY_ISSUE_CODE` stays complete); update the `layers` comment ("exactly one (Base) until spec 005…") to "1–32 in a valid project"
- [X] T004 Extend `bindingSchema` in `src/storage/project-schema.ts` with the two strict variants; one `layerIdSchema = z.string().regex(/^l\d+$/u)` shared with `layerSchema.id`; note in the superRefine comment that `layerId` may dangle (validation reports it, research R2); `schemaVersion` stays 3, no migration. T002 passes
- [X] T005 Add the `'Layers'` group and five entries to `BEHAVIORS` in `src/catalog/behaviors.ts`, between `'Send a key'` and `'Special'` (research R7): `mo` "&mo" "Momentary layer" "Turns a layer on while the key is held." `${DOCS}/layers#momentary-layer`; `lt` "&lt" "Layer on hold, key on tap" "Turns a layer on while held and sends a key when tapped (layer-tap)." `${DOCS}/hold-tap#layer-tap`; `tog` "&tog" "Toggle layer" "Turns a layer on, or off if it is already on." `${DOCS}/layers#toggle-layer`; `to` "&to" "To layer" "Turns a layer on and every other layer off, except the base layer." `${DOCS}/layers#to-layer`; `sl` "&sl" "Sticky layer" "Keeps a layer on for the next key press." `${DOCS}/sticky-layer`; update the catalog comment (layer behaviors no longer out of scope) and the order test in `src/catalog/behaviors.test.ts` (test first: 20 entries, group order)
- [X] T006 Make every exhaustive switch compile for the new kinds with minimal behavior, to be completed in US3/US4: `getKeyStrokes` in `src/domain/validate-bindings.ts` (all five layer kinds → `[]`; `lt` → `[binding.tap]` test-first in T042/T043), `getBindingSlots` in `src/ui/bindings/binding-slots.ts` (temporarily `[]`), `isSimpleBinding`/`toBindingLegend` in `src/ui/bindings/format-binding-legend.ts`, `isCatalogBinding`/`formatBindingName` in `src/ui/bindings/format-binding-name.ts` (catalog label), `cornerForBinding` in `src/ui/bindings/format-keycap-corner.ts` (`undefined`), `toBehaviorResult` in `src/ui/bindings/pick-slot.ts` (layer kinds not yet pickable: keep them out of the picker by filtering the `'Layers'` group in `src/ui/bindings/slot-choices.ts` until T037)
- [X] T007 [P] Test first in `src/domain/create-entity-id.test.ts` (`prefix: 'l'` over `['l0', 'l3']` → `l4`), then allow `'l'` in `src/domain/create-entity-id.ts`
- [X] T008 [P] Test first in `src/storage/preferences.test.ts` (`bindingsLayerIndex` default 0; missing, negative, non-integer or non-number stored values fall back to 0), then add `readonly bindingsLayerIndex: number` to `Preferences`, `DEFAULT_PREFERENCES` and the schema (`z.int().min(0).catch(0)`) in `src/storage/preferences.ts` (research R6)
- [X] T009 [P] Let `buildProject` in `tests/helpers/build-project.ts` take optional `layers` (default: the one Base layer from `bindings`) so multi-layer tests stay short

**Checkpoint**: `npm run check` green; new shapes parse; layer behaviors are stored-but-not-offered.

---

## Phase 3: User Story 1 — Layer tabs (Priority: P1) 🎯 MVP

**Goal**: Add, rename, move, delete and switch layers from tabs above the canvas; each change one undo step (FR-001–FR-006, FR-016, FR-017).

**Independent Test**: Add a layer, rename it "Nav", move it before Base, undo three times — one layer named Base (spec US1).

### Tests for User Story 1 (write first, watch them fail)

- [X] T010 [P] [US1] `src/domain/add-layer.test.ts`: appends `{ id: 'l1', name: 'Layer 1', bindings }` with `{ kind: 'trans' }` for every existing key in key order; next free "Layer N" when its node name is taken; ids never reused (`l0`, `l2` → `l3`); an id still referenced by a binding is never reused: layers `l0`, `l1` with `&mo l1` on Base, remove `l1`, add → new id `l2` and `validateBindings` still reports `binding-layer-missing` for the `&mo` (research R1 id reuse guard)
- [X] T011 [P] [US1] `src/domain/rename-layer.test.ts`: name stored as typed (`'Nav & Sym'`); same name → same project reference; bad index → unchanged
- [X] T012 [P] [US1] `src/domain/move-layer.test.ts`: moves by `{ layerIndex, toIndex }`; out-of-range → unchanged; SC-002: for a 4-layer project with `&mo`/`&lt`/`&tog`/`&to`/`&sl` on every layer, every `(layerIndex, toIndex)` move keeps each binding's `layerId` naming the same layer name
- [X] T013 [P] [US1] `src/domain/remove-layer.test.ts`: removes layer and its bindings; the only layer is never removed (same reference); references to it on other layers stay unchanged
- [X] T014 [P] [US1] `src/domain/to-layer-node-name.test.ts`: `Nav & Sym` → `nav_sym_layer`, `Base` → `base_layer`, `  Nav  ` → `nav_layer`, `2nd` → `layer_2nd_layer`, `Ω` → `''`, `''` → `''` (research R4)
- [X] T015 [P] [US1] `src/domain/validate-layers.test.ts` (catalog `{ maxLayerCount: 32 }`): `layer-name-empty` at `['layers', i, 'name']`; `layer-name-invalid-character` for `"`, `\`, `\n`; `layer-name-duplicate` on every layer of `Nav`/`nav` and `Nav Sym`/`Nav-Sym`; `layer-count-exceeded` at `['layers', 32]` for 33 layers, none for 32

### Implementation for User Story 1

- [X] T016 [P] [US1] `src/domain/to-layer-node-name.ts` (T014 green)
- [X] T017 [P] [US1] `src/domain/add-layer.ts` using `createEntityId({ prefix: 'l', existingIds })` with `existingIds` = layer ids plus every `layerId` referenced by any binding, and `toLayerNodeName` (T010 green)
- [X] T018 [P] [US1] `src/domain/rename-layer.ts`, `src/domain/move-layer.ts`, `src/domain/remove-layer.ts` (T011–T013 green)
- [X] T019 [US1] `maxLayerCount` in `BindingsCatalog` (`src/domain/validate-bindings.ts`) and `maxLayerCount: 32` in `BINDINGS_CATALOG` (`src/catalog/bindings-catalog.ts`, comment citing `docs/zmk/keymap.md` §2); `ValidationCode` += `layer-name-empty`, `layer-name-invalid-character`, `layer-name-duplicate`, `layer-count-exceeded` in `src/domain/types.ts`, mapped to `'bindings'` in `src/ui/shell/workspace-issue.ts`; `src/domain/validate-layers.ts` with the messages of data-model.md; call it from `src/domain/validate-project.ts` (T015 green)
- [X] T020 [P] [US1] `Tabs` primitive `src/ui/components/tabs.tsx`: `role="tablist"` with `aria-label`, items `{ id, label, issuePath? }`, `aria-selected`, roving `tabIndex`, ArrowLeft/ArrowRight/Home/End move focus and select, focusing a tab selects it (automatic activation, also when focused by script), click selects, tab ids derivable for `aria-labelledby`; strings and callbacks only (no `Project`)
- [X] T021 [P] [US1] Optional `description` prop on `DraftTextField` in `src/ui/shell/draft-text-field.tsx`, passed to `Field`
- [X] T022 [US1] `src/ui/bindings/use-layer-actions.ts`: open index from `preferences.bindingsLayerIndex` clamped to `layers.length - 1`; `handleLayerOpen(index)`, `handleLayerAdd` (commit `addLayer`, status "Added layer <name>", open the new last index), `handleLayerRename(name)` (commit `renameLayer`), `handleLayerMove(offset)` (commit `moveLayer`, status "Moved layer <name> to position <n>", open the new index), `handleLayerDelete` (commit `removeLayer`, status "Deleted layer <name>. Undo", same index clamped); availability flags with reasons (contracts/ui.md)
- [X] T023 [US1] `src/ui/bindings/layer-bar.tsx`: `<section aria-labelledby>` with a visually hidden `<h2>` "Layers", `Tabs` (`aria-label="Open layer"`, items `"<position> <name>"`, `", always on"` for 0, `issuePath` `layers.<position>`), "Add layer", "Layer name" `DraftTextField` (description "Keymap node: <node name>", `issuePath` `layers.<open>.name`, error = first name issue of the open layer), "Move left", "Move right", "Delete layer" (`danger`) with `isDisabled` + hint; render it in `src/ui/bindings/bindings-workspace.tsx` above the canvas and wrap canvas + Keys table in `role="tabpanel"` labelled by the open tab; the add limit comes from `BINDINGS_CATALOG.maxLayerCount` (via T022)
- [X] T024 [US1] Browser check (quickstart.md "Browser" step 3, first bullet + keyboard-only bullet for the tab list, name field, move and delete; screenshots light/dark); SC-003: add, rename, move, delete (4 operations) then Mod+Z ×4 restores the original project and Mod+Shift+Z ×4 reapplies; `npm run check` green

**Checkpoint**: Layers can be managed and switched; bindings still edit layer 0 (US2 next).

---

## Phase 4: User Story 2 — Edit the open layer (Priority: P1)

**Goal**: Canvas, Action panel, multi-select, copy/paste, Keys table, auto-advance and problem activation work on the open layer (FR-007).

**Independent Test**: Open "Nav", assign `&kp LEFT` to a key, switch to Base — the key shows its Base action; back on Nav — `LEFT` (spec US2).

- [X] T025 [US2] `src/ui/bindings/use-bindings-workspace.ts`: take the open index from `useLayerActions` (T022) and pass `layerIndex` to `useKeyPicker`, `useCopiedBinding`, `getProblemsByKeyId`; return it and the layer actions; `DraftState` gains `layerIndex` (`src/ui/bindings/draft-state.ts`, test first in `draft-state.test.ts`: `resolveLineSource` ignores a draft from another layer) so every layer change drops the draft; selection and copied binding stay
- [X] T026 [US2] Replace `layerIndex: 0` with the open index in `src/ui/bindings/use-key-picker.ts`, `src/ui/bindings/create-pick-handlers.ts` (target), `src/ui/bindings/use-copied-binding.ts` (copy and paste), and pass it through `src/ui/bindings/use-bindings-interaction.ts`
- [X] T027 [US2] Canvas and table on the open layer: `src/ui/bindings/bindings-canvas.tsx` (`project.layers[layerIndex]`), `src/ui/bindings/keycap-shape.tsx` and `src/ui/bindings/bindings-table-rows.tsx` (`data-issue-path="layers.<layerIndex>.bindings.<keyId>"`, binding of the open layer), `src/ui/bindings/bindings-table.tsx` (header "Action (<open layer name>)")
- [X] T028 [US2] `getProblemsByKeyId(issues, { layerIndex })` in `src/ui/bindings/get-problems-by-key-id.ts` keeps only the open layer's binding issues
- [X] T029 [US2] Problem activation opens the issue's layer: in `src/ui/shell/issues-panel.tsx` `IssueButton`, when the target is not rendered and `issue.path` is `['layers', n, …]`, change preferences to `{ activeWorkspaceId: 'bindings', bindingsLayerIndex: n }` before focusing on the next frame (research R6)
- [X] T030 [US2] Browser check: US2 independent test; copy on Base → paste on another layer; copy a layer behavior and paste it on another layer keeps its target; multi-select + auto-advance on a non-base layer; a `binding-keycode-unknown` issue seeded on layer 1 → click in Problems opens layer 1 and focuses the key; `npm run check` green

**Checkpoint**: Every Bindings tool edits the open layer.

---

## Phase 5: User Story 3 — Layer behaviors (Priority: P1)

**Goal**: `&mo`, `&lt`, `&tog`, `&to`, `&sl` in the behavior picker with a layer slot listing layers by position and name, docs links, legends (FR-008–FR-010, FR-013).

**Independent Test**: On Base pick `&mo`, layer "1 Nav" — keycap tag `&mo`, legend "Nav", line `&mo [layer 1 Nav]` (spec US3).

### Tests for User Story 3 (write first, watch them fail)

- [X] T031 [P] [US3] Domain `lt` tests: `src/domain/set-keycode.test.ts` (picking a key on `lt` changes `tap.keycode`, keeps modifiers and `layerId`), `src/domain/set-key-press-modifier.test.ts` (chip toggles `lt.tap` modifiers), `src/domain/set-key-behavior.test.ts` (`{ id: 'lt', layerId }` turns each key-sending key into `&lt` with its own key; `lt` → `kp`/`mt` keeps the tap, `mt` hold `LEFT_SHIFT`), `src/domain/is-every-key-sending-key.test.ts` (`lt` counts)
- [X] T032 [P] [US3] `src/ui/bindings/binding-slots.test.ts`: `getLineSlots(source, layers)` → `layer` slot `1 Nav` for `mo/tog/to/sl`, `layer` + `tap` for `lt`, `deleted layer` for a missing target, empty draft layer slot; `resolveOpenSlot` opens the layer slot of a new draft; `findSlotValueId` → `layerId`; `findModifierTarget` → tap stroke for stored `lt`, `'pending'` for an `lt` draft
- [X] T033 [P] [US3] `src/ui/bindings/slot-choices.test.ts`: behavior groups `Send a key`, `Layers`, `Special`, `Connection`, `Firmware`, `Your behaviors`; `getSlotChoices({ kind: 'layer' }, layers)` → one group "Layers" with one row per layer (id = `layerId`, legend = position, codes = position + node name); `formatSlotPrompt` "Which layer?"
- [X] T034 [P] [US3] `src/ui/bindings/pick-slot.test.ts` (layer picks): picking `&mo`/`&tog`/`&to`/`&sl`/`&lt` starts a draft with the layer slot open; layer pick on an `&mo` draft stores `{ kind: 'mo', layerId }`; on an `&lt` draft with every key sending a key stores via `setKeyBehavior` and opens `tap`; otherwise continues the draft with `tap`; a tap picked first is kept and the layer pick stores `lt` with it; on a stored `&lt`/`&mo` the layer pick changes only `layerId`
- [X] T035 [P] [US3] `src/ui/bindings/format-binding-legend.test.ts`, `src/ui/bindings/format-binding-name.test.ts`, `src/ui/bindings/format-keycap-corner.test.ts`: legends (layer name; `lt` tap + layer name as hold; `?` when missing), names ("Momentary layer Nav", "Toggle layer Nav", "To layer Nav", "Sticky layer Nav", "Space, layer Nav when held", "Momentary layer (deleted layer)"), `lt` corner = tap code (contracts/ui.md "Keycaps")

### Implementation for User Story 3

- [X] T036 [US3] Domain `lt` support in `src/domain/set-keycode.ts`, `src/domain/set-key-press-modifier.ts`, `src/domain/set-key-behavior.ts` (`KeyBehavior` += `{ readonly id: 'lt'; readonly layerId: string }`), `src/domain/is-every-key-sending-key.ts` (T031 green)
- [X] T037 [US3] Layer slot: `SlotRef` += `{ kind: 'layer' }`, `DraftBehaviorId` += `mo | tog | to | sl | lt`, `BindingDraft.layerId?`, `getLineSlots(source, layers)`, `findSlotValueId`, `findSlotStroke`/`findModifierTarget` for `lt` in `src/ui/bindings/binding-slots.ts`; `createDraft` in `src/ui/bindings/draft-state.ts`; `toLayerItem` in `src/ui/bindings/to-picker-item.ts` (`PickerPick` += `{ kind: 'layer'; layerId }`); `getSlotChoices(slot, layers)` and prompt in `src/ui/bindings/slot-choices.ts`, removing the T006 filter (T032, T033 green)
- [X] T038 [US3] `toLayerResult` and the `lt` tap completion of a draft in `src/ui/bindings/pick-value.ts`; layer behaviors in `toBehaviorResult` and the `layer` pick in `toPickResult` (`src/ui/bindings/pick-slot.ts`) (T034 green)
- [X] T039 [US3] Formatters take the layers: `formatBindingLegend(binding, layers)`, `formatFullBindingLegend`, `formatBindingName(binding, layers)`, `formatKeycapTitle`, `formatKeycapCorner` for `lt`; update callers `src/ui/bindings/bindings-canvas.tsx`, `src/ui/bindings/bindings-table-rows.tsx`, `src/ui/bindings/use-copied-binding.ts`, `src/ui/bindings/to-picker-item.ts`, `src/ui/bindings/format-keycap-label.ts` (T035 green)
- [X] T040 [US3] Pass `project.layers` to `BindingLine` (`src/ui/bindings/binding-line.tsx`) and `SlotPicker` (`src/ui/bindings/slot-picker.tsx`) through `KeyPickerState` (`src/ui/bindings/use-key-picker.ts`); layer rows' docs link is the open behavior's `docsUrl`
- [X] T041 [US3] Browser check: quickstart.md step 3 bullets 2–3 (`&mo`, `&lt` keeping SPACE), keyboard-only pick of a layer, picker row shows docs link; screenshots light/dark; `npm run check` green

**Checkpoint**: All five layer behaviors pickable, shown and named.

---

## Phase 6: User Story 4 — References survive reorder, rename and delete (Priority: P2)

**Goal**: References follow moves and renames; deleted targets are reported per key under Bindings (FR-011, FR-012).

**Independent Test**: `&mo` → "Sym"; move "Sym" — line shows the new position, same name; delete "Sym" — Problems lists the key; undo — gone (spec US4).

- [X] T042 [P] [US4] Test first in `src/domain/validate-bindings.test.ts`: `binding-layer-missing` at `['layers', L, 'bindings', keyId]` for each of `mo/tog/to/sl/lt` naming a missing `layerId`, none for existing targets (including self and Base); `lt` with an unknown tap keycode → `binding-keycode-unknown`
- [X] T043 [US4] `ValidationCode` += `binding-layer-missing` (`src/domain/types.ts`); `lt` → `[binding.tap]` in `getKeyStrokes`; `binding-layer-missing` in `src/domain/validate-bindings.ts` ("Key N on layer <name> uses a deleted layer. Pick another layer in Bindings."); map it to `'bindings'` in `src/ui/shell/workspace-issue.ts` (T042 green)
- [X] T044 [US4] Browser check: quickstart.md step 3 bullets 4–5 (move keeps names, delete reports both keys with conflict marks and "deleted layer" in the line, problem click opens the key's layer, Mod+Z clears); rename a target layer → legends follow; `npm run check` green

---

## Phase 7: User Story 5 — Layers persist (Priority: P2)

**Goal**: Layers, names, order and layer behaviors survive reload, file round trip and undo/redo (FR-014, FR-015).

**Independent Test**: Three layers with layer behaviors → reload and file round trip deep-equal (spec US5).

- [X] T045 [P] [US5] Tests in `src/storage/serialize-project.test.ts` / `src/storage/parse-project-file.test.ts`: a project with 3 layers, every layer behavior and a dangling `layerId` round-trips deep-equal; a 32-layer project round-trips; a 33-layer file parses (validation, not rejection); a v3 file from before this feature loads deep-equal
- [X] T046 [US5] Browser check: quickstart.md step 4 (reload keeps layers and the open position; Save then Open the file → identical); seed 32 layers → "Add layer" unavailable with its reason; `npm run check` green

---

## Phase 8: Polish & Cross-Cutting

- [X] T047 Superseded text: mark spec 005 FR-015 / User Story 4 (`specs/005-key-behaviors/spec.md`) and spec 004 FR-017's "layer actions" (`specs/004-bindings-keycaps/spec.md`) as superseded by spec 007 (one line each) and fix the comment in `src/domain/types.ts` / `src/catalog/behaviors.ts` if still mentioning "until layers exist"
- [X] T048 Confirm `grep -rln useEffect src/ui` is unchanged against the table in `docs/guidelines/frontend/react.md` (no effect added or removed; update the table if one was)
- [X] T049 Run the `zmk-reviewer` agent on `src/catalog/behaviors.ts`, `src/catalog/bindings-catalog.ts` and `docs/zmk/keymap.md`; fix findings
- [X] T050 Final `npm run check` (and `make check` when Docker is running, AGENTS.md §5); full browser pass of quickstart.md (light + dark, keyboard only), then stop the dev server
- [ ] T051 Manual accessibility pass for the project owner (not automated): screen reader smoke test (VoiceOver + Safari: tab list, layer name field, layer slot rows, problem activation) and 200% zoom at 1280 px (layer bar wraps, nothing clipped) — `docs/guidelines/frontend/accessibility.md` items 8 and 10

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → US4 → US5 → Polish.
- US2 needs US1's open-layer actions (T022). US3 needs US2 (picks write to the open layer). US4 needs US1 (delete) and US3 (layer behaviors to reference). US5 needs US3.
- Inside a story: tests → domain → catalog/storage → UI → browser check.

### Parallel opportunities

- Phase 2: T002, T007, T008, T009 touch different files.
- US1: tests T010–T015 in parallel; T016–T018 in parallel; T020, T021 in parallel with domain work.
- US3: tests T031–T035 in parallel.
- US4/US5 tests T042, T045 in parallel with each other.

```text
# US1 tests together
T010 add-layer.test.ts  T011 rename-layer.test.ts  T012 move-layer.test.ts
T013 remove-layer.test.ts  T014 to-layer-node-name.test.ts  T015 validate-layers.test.ts
```

## Implementation Strategy

- MVP = Phases 1–4 (manage layers + edit each layer): already useful (several layers with `&trans`/keys), even before layer behaviors.
- Then US3 (reachability on the device), US4 (safety on delete/move), US5 (persistence proof).
- Each checkpoint: `npm run check` green and a browser check; commit only when the owner asks.

## Review fixes (2026-10-12)

- [X] T052 Permanently reset picker drafts on layer changes, including replacement at the same position; cover switching away and back, deletion, and hook state persistence.
- [X] T053 Reserve the copied binding target id when adding a layer; cover delete, replace the last project reference, add and paste in domain and UI handler tests.
