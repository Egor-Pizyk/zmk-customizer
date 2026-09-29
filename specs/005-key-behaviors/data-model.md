# Data Model: Key behaviors

**Date**: 2026-09-29 · Extends spec 004 entities (`Layer`, `Action (binding)`, `Kind`, `Key name`); single Base layer unchanged.

## Entities

### Binding (union extension in `domain/types.ts`)

Existing variants untouched. Two additive variants (`kind` = ZMK behavior label without `&`):

| Variant | Fields | Meaning |
|---|---|---|
| `tap_dance` | `taps: readonly KeyStroke[]` (≥1), `tappingTermMs: number` (int, 0–5000, default 200) | Nth tap fires the nth action; pause after last press resolves the count |
| `mod_morph` | `normal: KeyStroke`, `morphed: KeyStroke`, `mods: readonly Modifier[]` (non-empty, unique, `MODIFIERS` order) | Sends `morphed` while any of `mods` is held, else `normal` |

`KeyStroke` and `Modifier` are reused unchanged (`{ keycode: string; modifiers: readonly Modifier[] }`; `MODIFIERS = LC LS LA LG RC RS RA RG`). No new primitive types; `BehaviorId = Binding['kind']` grows automatically, keeping the catalog fullness guard effective.

### Relationships

- `Layer.bindings: Record<keyId, Binding>` — unchanged; new variants stored per key like all others, keyed by key id (survive renumber/delete per spec 004 FR-020).
- Missing entry = unassigned = `&none` — unchanged.
- Combo/macro/conditional-layer references: none (out of scope).

## Validation rules (domain `validate-bindings.ts`, catalog passed as args)

Per key, at most one issue (existing `findBindingIssue` shape), reported under Bindings:

1. Every `KeyStroke` in the binding (`taps`, `normal`, `morphed`) names a known v0.3 keycode → else `binding-keycode-unknown` (reuses existing code/message pattern).
2. `taps` non-empty → empty list is a schema rejection (malformed), since a stored binding always has ≥1 tap; the editor never writes an empty list (removing the last tap resets the key to `kp` — editor rule, see transitions).
3. `tappingTermMs` within 0–5000 → else per-key issue (new message naming the key and the allowed range).
4. `mods` non-empty → empty is a schema rejection (malformed); editor never writes it (clearing the last modifier is rejected where entered).
5. `normal` deep-equal to `morphed` → reported as needing attention under Bindings (spec FR-011; allowed, not rejected).
6. Unknown `kind` or missing/extra parts → file rejected with a named problem (existing spec 004 FR-022 rule, enforced by the strict zod union).

Bluetooth profile rule (`binding-profile-out-of-range`) unchanged.

## State transitions (one undo step each; switching discards unused params)

| From → To | Result |
|---|---|
| any → `tap_dance` (starter) | `{ kind: 'tap_dance', taps: [<current tap stroke or empty-key A?>], tappingTermMs: 200 }` — seeded from the current tap stroke when the key sends one, else plain `A` without modifiers |
| `tap_dance` → any other kind | normal replacement semantics (like today); taps discarded, no restore on switch-back |
| any → `mod_morph` (starter) | `{ normal: <current>, morphed: <current>, mods: ['LS'] }` — starts equal (→ validation note per rule 5 until the user changes one side) |
| keycode pick on `tap_dance`/`mod_morph` binding | whole binding becomes `kp` (existing `withKeycode` rule for non-key actions) |
| press-mode / hold change on new kinds | no-op (`findKeyStroke` yields nothing) — controls stay hidden via `getPressMode → undefined` |
| tap-dance tap add/remove/reorder, pause edit; morph normal/morphed/modifier edit | in-place variant update, taps/modifiers kept normalized (modifiers unique, `MODIFIERS` order — same normalizer as `set-keycode.ts`) |
| multi-select apply / copy-paste | same as existing behaviors: one commit for all selected keys; `isSameBinding` (generic JSON) covers equality |

## Display derivation (no stored state)

- Legend: tap-dance shows first tap legend with a count mark (e.g. second tap reachable in tooltip); full legend never truncated with "…" (existing `formatFullBindingLegend` path). Mod-morph shows the normal legend with a morph mark. Both ≤7 characters after truncation (existing `truncate`).
- Full name (tooltip, aria-label, table row): tap-dance lists all taps + pause; mod-morph names normal, morphed and trigger modifiers — via `formatBindingName`.
- Corner: key number only (existing `format-keycap-corner`); new kinds add no corner content.
