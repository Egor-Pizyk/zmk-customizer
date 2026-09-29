# Data model: Bindings keycaps

Project schema v2 → v3. Everything else in `Project` (spec 002, 003) is unchanged. Types live in `src/domain/types.ts`. All fields are `readonly`.

## Project (v3)

```ts
type Project = {
  readonly schemaVersion: 3;
  readonly name: string;
  readonly shieldName?: string;
  readonly keys: readonly Key[];
  readonly wires: readonly Wire[];
  readonly insulatedCrossings: readonly CrossingRef[];
  /** Keymap layers in ZMK order; exactly one (Base) until 005 layers. */
  readonly layers: readonly Layer[];
};
```

## Layer

```ts
type Layer = {
  readonly id: string;          // 'l0', 'l1', … (createEntityId, like keys and wires)
  readonly name: string;        // 'Base'
  /** Keyed by Key.id. Missing entry = unassigned = &none (FR-021). */
  readonly bindings: Readonly<Record<string, Binding>>;
};
```

Rules:
- Every key of `bindings` is an existing `Key.id`. A dangling key is rejected by the schema, and `removeKey` deletes the entry in every layer.
- Layer ids are unique. Layer names are not validated in 004 (005 adds rename).
- Key index (keymap order) is still `project.keys` order. Bindings follow their key when it moves, is renumbered, or when other keys are deleted.

## Binding

```ts
type Modifier = 'LC' | 'LS' | 'LA' | 'LG' | 'RC' | 'RS' | 'RA' | 'RG';

type KeyStroke = {
  readonly keycode: string;                // ZMK name (canonical or alias), e.g. 'SPACE', 'N4', 'DOLLAR'
  readonly modifiers: readonly Modifier[]; // unique, in the order of the Modifier union above
};

type BluetoothCommand = 'BT_CLR' | 'BT_CLR_ALL' | 'BT_NXT' | 'BT_PRV';
type BluetoothProfileCommand = 'BT_SEL' | 'BT_DISC';
type OutputCommand = 'OUT_TOG' | 'OUT_USB' | 'OUT_BLE';   // OUT_NONE is main only

type Binding =
  | { readonly kind: 'kp'; readonly key: KeyStroke }
  | { readonly kind: 'mt'; readonly hold: KeyStroke; readonly tap: KeyStroke }
  | { readonly kind: 'sk'; readonly key: KeyStroke }
  | { readonly kind: 'kt'; readonly key: KeyStroke }
  | { readonly kind: 'trans' }
  | { readonly kind: 'none' }
  | { readonly kind: 'caps_word' }
  | { readonly kind: 'key_repeat' }
  | { readonly kind: 'gresc' }
  | { readonly kind: 'bt'; readonly command: BluetoothCommand }
  | { readonly kind: 'bt'; readonly command: BluetoothProfileCommand; readonly profile: number }
  | { readonly kind: 'out'; readonly command: OutputCommand }
  | { readonly kind: 'sys_reset' }
  | { readonly kind: 'bootloader' };
```

`kind` is the ZMK behavior label without `&` (`docs/zmk/behaviors.md` §1). A later generator writes `&kind` plus the parameters: `&kp LC(LS(A))`, `&mt LSHIFT SPACE`, `&bt BT_SEL 1`, `&out OUT_USB`.

`BehaviorId` is `Binding['kind']`. The catalog `BEHAVIORS` table (contracts/catalog.md) has one entry per id and is checked with `satisfies` against it.

Rules (validation issues, R8):
- `key.keycode` / `hold.keycode` / `tap.keycode` must be in the catalog's keycode names (canonical or alias). Otherwise `binding-keycode-unknown`.
- `profile` must be `< bluetoothProfileCount` (5). Otherwise `binding-profile-out-of-range`.

Rules (schema rejection, R7):
- Unknown `kind`, a missing or extra field, a non-`Modifier` string, a duplicate modifier, or a non-integer or negative `profile`.

## Keycode (catalog, not project data)

```ts
type KeycodeCategory =
  | 'letters' | 'numbers' | 'symbols' | 'whitespace-editing' | 'navigation' | 'function'
  | 'modifiers' | 'keypad' | 'media-consumer' | 'locks' | 'international-language' | 'power' | 'other';

type Keycode = {
  readonly name: string;                         // canonical #define, e.g. 'NUMBER_4'
  readonly aliases: readonly string[];           // e.g. ['N4'], deprecated ones excluded
  readonly description: string;                  // header comment, e.g. 'Keyboard 4 and $ (Dollar)'
  readonly usage: { readonly page: string; readonly id: string }; // for equivalence (R5)
  readonly implicitModifiers: readonly Modifier[]; // ['LS'] for DOLLAR, EXCLAMATION, …
  readonly category: KeycodeCategory;
  readonly docsUrl: string;
};
```

## UI state (not project data, not saved or undone)

| State | Owner | Shape |
|---|---|---|
| Selection | `BindingsWorkspace` | `readonly string[]` of key ids (empty = none) |
| Active key (roving tab stop) | `BindingsWorkspace` | key id, else key 0 |
| Panel step | `BindingsWorkspace` | `{ kind: 'kinds' } \| { kind: 'choices'; behaviorId: BehaviorId; part: 'key' \| 'hold' \| 'tap' \| 'command' \| 'profile' }` |
| Pending parts | `BindingsWorkspace` | `mt` hold chosen before tap; `bt` command chosen before profile; modifier toggles when the selection has no `kp` (FR-011, FR-014) |
| Search text | `BindingsWorkspace` | `string`, kept per FR-009a |
| Copied binding | `BindingsWorkspace` | `Binding \| undefined` (FR-018) |
| Panel position | preferences `bindingsPanel` | `ToolWindowState` (R11) |

## Migration v2 → v3

`migrateV2ToV3(data)` adds `layers: [{ id: 'l0', name: 'Base', bindings: {} }]` and sets `schemaVersion: 3`. A non-object input is returned unchanged, so the schema reports it. Fixture: `tests/fixtures/project/v2.json` (a small schematic) migrates to a v3 project that deep-equals the expected one.
