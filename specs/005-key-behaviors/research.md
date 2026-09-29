# Research: Key behaviors

**Date**: 2026-09-29 · **Sources**: `docs/zmk/behaviors.md` (verified v0.3.0 notes), `src/` reads listed per decision. No web research needed — all facts are in-repo.

## R1 — Tap-dance and mod-morph exist in ZMK v0.3 (spec assumption to verify)

**Decision**: Both are in scope. Neither section carries a main-only mark.

**Rationale**: `docs/zmk/behaviors.md` §3.2 (`zmk,behavior-tap-dance`, `#binding-cells = <0>`, `bindings` phandle-array + `tapping-term-ms` default 200) and §3.3 (`zmk,behavior-mod-morph`, `bindings` phandle-array + required `mods`, optional `keep-mods`) describe v0.3.0 behavior; §7 (main-only list) mentions neither. Built-in `&gresc` is a mod-morph instance, `&td` does not exist (no built-in tap-dance) — so tap-dance is always user-configured, mod-morph gets both a configurable editor and the existing `gresc` one-click preset.

**Alternatives considered**: Dropping either behavior if main-only — rejected, verification passed.

## R2 — What a tap-dance tap action can be

**Decision**: Each tap is a `KeyStroke` (keycode + modifiers), i.e. exactly what `&kp` holds. Two-cell behaviors (`bt` clear/next/prev/clear-all, `rgb_ug`, …) cannot be taps.

**Rationale**: `docs/zmk/behaviors.md` §3.1: behaviors with 2 params cannot be used inside another behavior's `bindings` without a macro wrapper; tap-dance `bindings` is a phandle-array whose entries carry their keycode params. `KeyStroke` already models "keycode + modifiers" and is validated against the keycode catalog, so no new value type is needed. Matches spec FR-007 and the edge case ruling.

## R3 — Mod-morph `keep-mods`: store or omit

**Decision**: Omit. The stored shape is `{ normal: KeyStroke; morphed: KeyStroke; mods: Modifier[] }` with `mods` non-empty.

**Rationale**: Spec FR-010 requires normal + morphed + trigger set, with `gresc` (which has no `keep-mods`) as the expressibility bar. `keep-mods` is optional in ZMK (default 0) and no spec scenario needs it. Constitution VI (minimal code): one modifier group in UI, one field in domain. If the later generator feature needs full fidelity, `keepMods` can be added then as an optional additive field.

**Alternatives considered**: Optional `keepMods` subset with a second toggle group — rejected as speculative; re-add when a user story demands it.

## R4 — Tap-dance `tapping-term-ms` default and range

**Decision**: Default 200 ms (the ZMK default per §3.2); editable range 0–5000 ms; out-of-range in imported files is a per-key Bindings validation issue, not a schema rejection.

**Rationale**: 200 ms is both the ZMK schema default and the built-in hold-tap value, so users meet a consistent number. Upper bound follows the spec edge case ("longer than a few seconds" is rejected where entered). Schema-vs-validation split follows the established R7 pattern (`validate-bindings.ts` + spec 004 FR-022): unknown keycodes and out-of-range profiles already load as issues so old files keep opening; pause range joins them. Concretely: zod accepts any int for the pause; `findBindingIssue` reports `< 0` or `> 5000`.

## R5 — Where tap-dance / mod-morph live in the panel (no redesign)

**Decision**: Keep the existing panel anatomy. `BehaviorSection` grows from a kp-only label into the behavior list for all kinds (apply-at-once for parameter-less kinds, Bluetooth/output keep their rows); the System tab gains "Tap dance…" and "Mod-morph…" starter items; when the shared binding is `tap_dance`/`mod_morph`, a parameter section (tap list + pause; normal/morphed + modifier toggles) renders in the `KeyOptions` slot. New picker tab: none — `filter-picker-items.ts` and search need no changes (they operate on generic `PickerItem`s).

**Rationale**: Spec FR-019 freezes the visual flow; the picker already renders arbitrary binding items (`toBindingItem` takes any `Binding`), and `KeyOptions` already switches on `isKeyPress` — extending that switch is the smallest change. `findPickerTabId`/`isCurrentPickerItem` in `picker-tabs.ts` resolve via `isSameBinding`, so starter items automatically mark current. `getPressMode` returns `undefined` for the new kinds (no key sent → chips/hold/mode stay in the `NonKeyOptions` branch), which is exactly FR-004 behavior for non-key actions.

**Alternatives considered**: A dedicated picker tab for configurable behaviors — rejected (two starters do not justify a tab; search covers discovery per SC-005). A kind→params wizard — rejected by FR-019.

## R6 — Storage version: stays 3, no migration

**Decision**: Extend `bindingSchema`'s zod union with the two new variants; `schemaVersion` remains 3; no migration file.

**Rationale**: Migrations (`migrate-vN-to-vM.ts`) exist for reshaping old data. Old files contain no `tap_dance`/`mod_morph` bindings, and the union extension accepts everything v3 accepted plus the new shapes — so every previously valid file still parses identically, and previously invalid files stay invalid. `parse-project-file.test.ts` / `migrate-project.test.ts` patterns cover this: add parse tests for the new shapes + a fixture test that a v3 file without them loads unchanged. Note the `bt` precedent in the schema comment: `z.union` (not discriminated) because one kind can have two shapes.

## R7 — Exhaustiveness sweep list for each new kind

**Decision**: The compiler enforces the sweep via `assertNever`; the concrete touch points (verified by reading each file) are: `domain/types.ts` (union), `catalog/behaviors.ts` (entry + fullness guard + `behaviors.test.ts` order), `domain/validate-bindings.ts` (`getKeyStrokes` + `findBindingIssue`), `ui/bindings/format-binding-legend.ts`, `ui/bindings/format-binding-name.ts`, `domain/get-press-mode.ts`, `storage/project-schema.ts`, `ui/bindings/behavior-section.tsx` (`behaviorName`), `ui/bindings/picker-tabs.ts` (`findTapKeycode` — tap-dance/mod-morph expose no single tap keycode → returns `undefined`, keycode items never mark current, correct as-is but must still compile), `domain/set-keycode.ts` (`withKeycode`: picking a keycode on a td/mm binding — decision: replace whole binding with `kp`, same as other non-key actions), `domain/set-press-mode.ts` (`findKeyStroke` — no stroke → mode change is a no-op, correct), `domain/set-hold-key.ts` (same reasoning — verify on implementation), `ui/bindings/key-options.tsx` (`findTapStroke` — same, verify), `ui/bindings/format-keycap-corner.ts` (verify switch), `ui/bindings/format-legend-title.ts` (verify switch).

**Rationale**: Enumerated so no `assertNever` site is missed between layers; each keeps its existing behavior for the new kinds (no-op / undefined / replace-with-kp) except the formatters and validation, which gain real branches. `is-same-binding.ts` needs nothing (generic JSON comparison), as does `filter-picker-items.ts`.
