# Contract: Bindings catalog (`src/catalog/`)

Every entry has `label`, a one-line `description` and a `docsUrl` on `https://v0-3-branch.zmk.dev/docs/` (AGENTS §3.4). A catalog test fails if any entry lacks one of them, or if a URL has a different base (SC-005, constitution V).

## `behaviors.ts` — `BEHAVIORS` (`as const satisfies readonly BehaviorEntry[]`)

One entry per `BehaviorId`, in the step-1 panel order:

| id | Label | docsUrl path (`/docs/keymaps/behaviors/…`) | Choices (step 2) |
|---|---|---|---|
| `kp` | Send a key | `key-press` | key (+ modifier toggles) |
| `mt` | Modifier on hold, key on tap | `hold-tap#mod-tap` | hold (modifiers first), then tap |
| `sk` | Sticky key | `sticky-key` | key (modifiers first) |
| `kt` | Key toggle | `key-toggle` | key |
| `trans` | Pass-through | `misc#transparent` | — |
| `none` | Do nothing | `misc#none` | — |
| `caps_word` | Caps word | `caps-word` | — |
| `key_repeat` | Key repeat | `key-repeat` | — |
| `gresc` | Grave/Escape | `mod-morph#behavior-binding` | — |
| `bt` | Bluetooth | `bluetooth#bluetooth-command-defines` | command, then profile for select/disconnect |
| `out` | Output | `outputs#output-command-defines` | command |
| `sys_reset` | Reset | `reset#reset` | — |
| `bootloader` | Bootloader | `reset#bootloader-reset` | — |

Anchors were checked against the v0.3 pages on 2026-09-28 (research R3). Layer behaviors, `&rgb_ug`, `&bl`, `&ext_power`, mouse, `&soft_off` and `&studio_unlock` are not in the table (FR-017).

## `bluetooth-commands.ts`, `output-commands.ts`

`BLUETOOTH_COMMANDS`: `BT_SEL` (needs profile), `BT_DISC` (needs profile), `BT_NXT`, `BT_PRV`, `BT_CLR`, `BT_CLR_ALL`, each with a label and description (`docs/zmk/behaviors.md` §2). `BLUETOOTH_PROFILE_COUNT = 5`. `OUTPUT_COMMANDS`: `OUT_TOG`, `OUT_USB`, `OUT_BLE`. Descriptions and docsUrl are the same as the behavior's defines section.

## `keycodes.ts` — `KEYCODES`, `keycodeByName`

- `KEYCODES: readonly Keycode[] = parseKeysHeader(keysHeaderRaw)` (research R2), in header order; categories per R3.
- `keycodeByName: ReadonlyMap<string, Keycode>`, keyed by the canonical name and every alias.
- `MODIFIER_KEYCODES`: the 8 modifier keycodes (`LEFT_CONTROL` … `RIGHT_GUI`), listed first for `mt` hold and `sk` (FR-012).
- Invariants (tests):
  - no deprecated name appears;
  - `DOLLAR` has `implicitModifiers ['LS']` and the same usage as `NUMBER_4`;
  - `N4` resolves to `NUMBER_4`;
  - every category has at least one entry;
  - the canonical names are unique;
  - the count equals the number of comment blocks in the header.

## `bindings-catalog.ts` — `BINDINGS_CATALOG`

`{ keycodeNames: ReadonlySet<string>, bluetoothProfileCount: number }`, passed to `validateProject` (research R8).

## `keycode-legends.ts` — `KEYCODE_LEGENDS`

A hand-written `Record<string, string>` from canonical name to legend (research R5), for keys whose derived legend is not good enough. A test checks that every key of the record is a canonical name in `KEYCODES`.
