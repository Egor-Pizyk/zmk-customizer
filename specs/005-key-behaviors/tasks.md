# Tasks: Key behaviors

**Input**: Design documents from `/specs/005-key-behaviors/` (spec.md, plan.md, research.md R1–R7, data-model.md, contracts/binding-json.md, quickstart.md)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, constitution.md (all read)

**Tests**: Included — AGENTS.md §8 and the feature input require tests-first for domain logic (`*.test.ts` next to code, watch fail, then implement). No UI test infra in repo: panel behavior is verified by manual CDP tasks.

**Organization**: By user story. One behavior per change (Conventional Commits) during implementation.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline before any change

- [X] T001 Run `make check` on the clean tree and confirm green in `src/domain/types.ts` (union), `src/storage/project-schema.ts` (schema v3), `src/catalog/behaviors.ts` (13 entries)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing every later story needs: union types, storage acceptance, exhaustiveness no-ops. No UI, no validation rules yet.

**⚠️ CRITICAL**: No user-story work begins until this phase is complete (US1 touches disjoint UI files and may be prepared in parallel, but commits land after Phase 2)

- [X] T002 [P] Failing parse tests for the new shapes in `src/storage/parse-project-file.test.ts` (accept `tap_dance`/`mod_morph` per `specs/005-key-behaviors/contracts/binding-json.md`, reject empty `taps`/`mods`, reject unknown kind, old v3 file loads unchanged)
- [X] T003 Extend the `Binding` union in `src/domain/types.ts` with `tap_dance` (`taps: readonly KeyStroke[]`, `tappingTermMs: number`) and `mod_morph` (`normal: KeyStroke`, `morphed: KeyStroke`, `mods: readonly Modifier[]`) per `specs/005-key-behaviors/data-model.md`
- [X] T004 Extend `bindingSchema` in `src/storage/project-schema.ts` with the two new strict variants (`taps` array, `tappingTermMs` int; `normal`/`morphed` strokes, non-empty ordered `mods`), keeping `z.union` and `schemaVersion: 3` with no migration (research R6)
- [X] T005 [P] Failing `undefined`/no-op tests for the new kinds in `src/domain/get-press-mode.test.ts` (expect `undefined`: no key is sent, research R5)
- [X] T006 Sweep the remaining `assertNever`/kind switches into compiling no-ops for the new kinds without changing their behavior: `findTapKeycode` in `src/ui/bindings/picker-tabs.ts` (returns `undefined`), `withKeycode` in `src/domain/set-keycode.ts` (replace whole binding with `kp`), `findKeyStroke` in `src/domain/set-press-mode.ts` and `src/domain/set-hold-key.ts` (no stroke → no-op), `findTapStroke` in `src/ui/bindings/key-options.tsx`, plus `src/ui/bindings/format-keycap-corner.ts` and `src/ui/bindings/format-legend-title.ts` (verify each switch compiles; research R7). Plus, required for compilation by the catalog fullness guard: `tap_dance` + `mod_morph` entries in `src/catalog/behaviors.ts` (label, description, v0.3 `docsUrl`, new `choices` values) with the order test in `src/catalog/behaviors.test.ts` extended to 15; legends/names stay placeholders (`TD?`/`MM?`, catalog labels) until Phases 4–5

**Checkpoint**: `make check` green; new shapes parse; new kinds are inert everywhere (press mode/hold/keycode-pick behave as for other non-key actions)

---

## Phase 3: User Story 1 - Choose a self-contained behavior for a key (Priority: P1) 🎯 MVP

**Goal**: Every stored behavior is choosable from the behavior list with description + v0.3 docs link; legends/tooltips/table update via shared formatters (spec FR-001–FR-005)

**Independent Test**: quickstart.md §2 — pick each of the 13 behaviors in turn; keycap, tooltip, table row describe it; reload + file round trip identical; one undo step per pick

### Tests for User Story 1

> NOTE: No new domain/storage tests — all 13 kinds are already covered. Verification is the manual CDP task below (no UI infra in repo).

### Implementation for User Story 1

- [ ] T007 [US1] Replace the display-only `BehaviorSection` in `src/ui/bindings/behavior-section.tsx` with the behavior list driven by `BEHAVIORS` from `src/catalog/behaviors.ts` (all 13 entries; parameter-less kinds apply at once; `bt`/`out` reuse existing command/profile rows; `sk`/`kt`/`mt` stay on press-mode/hold controls per spec FR-004; design/flow unchanged per FR-019)
- [ ] T008 [US1] Extend `behaviorName` in `src/ui/bindings/behavior-section.tsx` beyond `kp` so every stored kind shows its catalog label (mixed/unassigned states unchanged)
- [ ] T009 [US1] Manual CDP verification per `specs/005-key-behaviors/quickstart.md` §2 and scope-guard walkthrough §5 (seed via `localStorage` key `zmk-customizer:project`, click `[data-keycap-id]`, screenshot; legends ≤7 chars, tooltips, multi-select + copy/paste, reload/round-trip/undo); `make check` green

**Checkpoint**: US1 fully functional and independently testable — all 13 behaviors assignable, persisted, undoable

---

## Phase 4: User Story 2 - Tap-dance (Priority: P2)

**Goal**: A key sends different actions on 1st/2nd/… tap with an editable resolving pause (spec FR-006–FR-008)

**Independent Test**: quickstart.md §3 — two-tap key survives reload + round trip; pause range enforced; out-of-range import loads as a named Bindings issue

### Tests for User Story 2

> NOTE: Write these FIRST, watch them FAIL, then implement.

- [ ] T010 [P] [US2] Failing validation tests in `src/domain/validate-bindings.test.ts` for `tap_dance` (unknown tap keycode → `binding-keycode-unknown`; `tappingTermMs` <0 or >5000 → per-key range issue naming the key and `0–5000`)
- [ ] T011 [P] [US2] Failing op tests in `src/domain/set-tap-dance-binding.test.ts` (starter seeded from current tap stroke, else plain `A`, `tappingTermMs: 200`; one commit for all selected keys)
- [ ] T012 [P] [US2] Failing op tests in `src/domain/set-tap-dance-taps.test.ts` (replace tap list; modifiers normalized to unique `MODIFIERS` order) and `src/domain/set-tapping-term.test.ts` (in-place pause update)
- [ ] T013 [P] [US2] Failing formatter tests in `src/ui/bindings/format-binding-legend.test.ts` and `src/ui/bindings/format-binding-name.test.ts` for `tap_dance` (legend ≤7 chars incl. truncation; full name lists all taps + pause; global legend-uniqueness tests stay green)

### Implementation for User Story 2

- [ ] T014 [US2] Add `tap_dance` branches in `src/domain/validate-bindings.ts` (`getKeyStrokes` returns `taps`; `findBindingIssue` checks the pause range) and extend `ValidationCode` in `src/domain/types.ts` with the range-issue code
- [ ] T015 [P] [US2] Implement `src/domain/set-tap-dance-binding.ts`, `src/domain/set-tap-dance-taps.ts`, `src/domain/set-tapping-term.ts` (one exported concept per file; pattern: `src/domain/set-keycode.ts`)
- [ ] T016 [US2] Wire the `tap_dance` catalog entry (added in T006) into the behavior list (confirm panel order + docs-link tests green; entry needs no changes, only consumption)
- [ ] T017 [US2] Add `tap_dance` legends/names in `src/ui/bindings/format-binding-legend.ts` and `src/ui/bindings/format-binding-name.ts` (≤7 chars, uniqueness preserved)
- [ ] T018 [US2] Add the "Tap dance…" starter row to the System tab in `src/ui/bindings/picker-tabs.ts` and render the tap-list + pause parameter section in the `KeyOptions` slot (new `src/ui/bindings/tap-dance-options.tsx` only if it does not fit `KeyOptions`; keyboard-reachable, labeled, pause range shown, out-of-range rejected where entered)
- [ ] T019 [US2] Manual CDP verification per `specs/005-key-behaviors/quickstart.md` §3 (create two-tap key, edit taps/pause, reload, file round trip, import out-of-range pause, undo granularity); `make check` green

**Checkpoint**: US1 + US2 work independently; tap-dance keys persist, validate, display, and edit end-to-end

---

## Phase 5: User Story 3 - Mod-morph (Priority: P2)

**Goal**: A key sends a normal action, or a morphed one while trigger modifiers are held; `gresc` stays a one-click preset (spec FR-009–FR-011)

**Independent Test**: quickstart.md §4 — normal/morphed/modifiers survive reload + round trip; equal normal/morphed raises the Bindings note; `gresc` preset still one click

### Tests for User Story 3

> NOTE: Write these FIRST, watch them FAIL, then implement.

- [ ] T020 [P] [US3] Failing validation tests in `src/domain/validate-bindings.test.ts` for `mod_morph` (unknown keycode in `normal`/`morphed` → `binding-keycode-unknown`; `normal` deep-equal to `morphed` → attention note under Bindings, still loads)
- [ ] T021 [P] [US3] Failing op tests in `src/domain/set-mod-morph-binding.test.ts` (starter: normal = morphed = current stroke, `mods: ['LS']`), `src/domain/set-mod-morph-keys.test.ts` (normal/morphed update, modifiers normalized) and `src/domain/set-mod-morph-mods.test.ts` (trigger-set update; clearing the last modifier never writes empty `mods`)
- [ ] T022 [P] [US3] Failing formatter tests in `src/ui/bindings/format-binding-legend.test.ts` and `src/ui/bindings/format-binding-name.test.ts` for `mod_morph` (legend ≤7 chars with morph mark; full name states normal, morphed and triggers; uniqueness tests stay green)

### Implementation for User Story 3

- [ ] T023 [US3] Add `mod_morph` branches in `src/domain/validate-bindings.ts` (`getKeyStrokes` returns `normal` + `morphed`; equal-actions attention note) and extend `ValidationCode` in `src/domain/types.ts` with the note code
- [ ] T024 [P] [US3] Implement `src/domain/set-mod-morph-binding.ts`, `src/domain/set-mod-morph-keys.ts`, `src/domain/set-mod-morph-mods.ts` (pattern: `src/domain/set-keycode.ts`)
- [ ] T025 [US3] Wire the `mod_morph` catalog entry (added in T006) into the behavior list (confirm panel order + docs-link tests green; entry needs no changes, only consumption)
- [ ] T026 [US3] Add `mod_morph` legends/names in `src/ui/bindings/format-binding-legend.ts` and `src/ui/bindings/format-binding-name.ts` (normal legend + morph mark; `gresc` legend/name untouched)
- [ ] T027 [US3] Add the "Mod-morph…" starter row to the System tab in `src/ui/bindings/picker-tabs.ts` and render the normal/morphed + trigger-modifier parameter section in the `KeyOptions` slot (new `src/ui/bindings/mod-morph-options.tsx` only if it does not fit `KeyOptions`; keyboard-reachable, labeled)
- [ ] T028 [US3] Manual CDP verification per `specs/005-key-behaviors/quickstart.md` §4 (create morph key, equal-actions note appears then clears, `gresc` preset one click, reload, round trip, undo); `make check` green

**Checkpoint**: All three stories independently functional; every self-contained v0.3 behavior assignable

---

## Phase 6: User Story 4 - Layer behaviors stay out (Priority: P3)

**Goal**: No layer-needing behavior is offered or accepted on the single-layer project (spec FR-015, story 4)

**Independent Test**: Behavior list walkthrough shows no `mo`/`lt`/`tog`/`to`/`sl`; importing a file with `"kind": "mo"` is rejected with a named problem and the current project is unchanged

- [ ] T029 [P] [US4] Rejection test in `src/storage/parse-project-file.test.ts` for layer kinds (`mo`, `lt`, `tog`, `to`, `sl` rejected with a message naming the problem; current project deep-equal to before)
- [ ] T030 [US4] Manual walkthrough per `specs/005-key-behaviors/quickstart.md` §5 confirming no layer/combo/macro/lighting/mouse/Studio entry is reachable; `make check` green

**Checkpoint**: Scope boundary enforced in UI and at the trust boundary

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Full-feature validation and cleanup

- [ ] T031 Full `specs/005-key-behaviors/quickstart.md` validation run (§1–§5) including both themes for tap-dance/mod-morph legends (spec SC-006) and keyboard-only pass (spec SC-005/FR-014 context)
- [ ] T032 Final `make check` (typecheck + lint + format + tests) green; no drive-by refactors left in the diff; commits follow Conventional Commits, one behavior per change

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS Phases 4–6 (union/schema/sweep); Phase 3 (US1) touches disjoint UI files and may be prepared in parallel but commits land after Phase 2
- **User Stories (Phases 3–6)**: Depend on Foundational; run sequentially in priority order P1 → P2 → P3 (one behavior per change)
- **Polish (Phase 7)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — needs only Phase 2 committed (union compiles underneath; US1 uses existing 13 kinds)
- **US2 (P2)**: Needs Phase 2; independent of US1 at runtime (BehaviorSection list is catalog-driven, so the US2 catalog entry appears with no US1 edits)
- **US3 (P2)**: Needs Phase 2; mirrors US2 file-by-file; no US2 edits required (disjoint branches in every switch)
- **US4 (P3)**: Needs Phase 2 only (rejection is inherent to the strict union; the task adds the regression test + walkthrough)

### Within Each User Story

- Tests FIRST, watch FAIL, then implement (AGENTS.md §8)
- Domain ops → validation → catalog → formatters → picker/panel → manual CDP check
- `make check` green before leaving the phase
- Data-model constraints quoted verbatim in tasks: `taps` ≥1; `tappingTermMs` int 0–5000 default 200; `mods` non-empty unique in `MODIFIERS` order; legends ≤7 chars; profiles 0–4

### Parallel Opportunities

- T002 + T005 test tasks (different files) can run in parallel; T003 + T004 are the same-concern pair but different files — parallelizable, same for T010/T011/T012/T013, T020/T021/T022, T015 + T024 (different files, post-design)
- T029 (storage test) parallel with any US2/US3 test task
- Manual CDP tasks (T009/T019/T028/T030) are sequential per phase (same running app) but T031 replays them jointly

---

## Parallel Example: User Story 2

```bash
# Launch all US2 test tasks together (different files, all must FAIL first):
Task: "Failing validation tests for tap_dance in src/domain/validate-bindings.test.ts"
Task: "Failing op tests in src/domain/set-tap-dance-binding.test.ts"
Task: "Failing op tests in src/domain/set-tap-dance-taps.test.ts and src/domain/set-tapping-term.test.ts"
Task: "Failing formatter tests in src/ui/bindings/format-binding-legend.test.ts and src/ui/bindings/format-binding-name.test.ts"

# After tests fail, launch independent implementations together:
Task: "Implement src/domain/set-tap-dance-binding.ts + set-tap-dance-taps.ts + set-tapping-term.ts"
Task: "Add tap_dance entry in src/catalog/behaviors.ts + order test"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational union/schema/sweep)
2. Complete Phase 3 (US1 behavior list over the 13 stored kinds)
3. **STOP and VALIDATE**: quickstart §2 + §5 walkthrough
4. Demo if ready — every stored behavior assignable with zero domain changes

### Incremental Delivery

1. Setup + Foundational → inert new shapes parse
2. + US1 → MVP: all stored behaviors choosable
3. + US2 → tap-dance end-to-end
4. + US3 → mod-morph end-to-end
5. + US4 → layer-boundary regression test
6. Each increment keeps `make check` green and never breaks prior stories (new switch branches only)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to its user story for traceability
- Constraint values above are quoted verbatim from data-model.md — not left to implementation discretion
- Commit after each task or logical group; one behavior per commit
- Stop at any checkpoint to validate the story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence

---

## Format Validation

- All 32 tasks use `- [ ] TNNN [P?] [USn?] Description with exact file path` — checkbox ✓, sequential IDs T001–T032 ✓, `[P]` only for different-file parallelizable tasks ✓, `[USn]` on all story-phase tasks (T007–T030) and none on Setup/Foundational/Polish ✓
