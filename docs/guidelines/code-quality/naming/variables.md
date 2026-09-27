# Naming: variables, types, files

Names are nouns from the glossary below; one term per concept across code, tests, UI copy and docs. Function names: `functions.md`.

## Glossary (use exactly these terms)

| Term (code) | Meaning | Banned synonyms |
|---|---|---|
| `project` | The whole editable state (`Project`) | `state`, `config`, `data` |
| `shield` | The user's keyboard as a ZMK shield; `shieldName` is `[a-z0-9_]+` | `keyboard` (in code), `device` |
| `board` | Controller board ZMK already supports (`nice_nano_v2`) | `controller`, `mcu`, `chip` |
| `key` | One switch on the layout | `switch`, `button`, `keyCap` |
| `keyIndex` | 0-based position of a key in keymap order (ZMK "key position", DT `key-positions`) | `keyPos`, `position`, `idx`, `keyId` |
| `position` / `xU`, `yU` | Where a key sits on the canvas | `coords`, `location`, `pos` |
| `cell` | Electrical matrix location `{ row, col }` | `coord`, `rc`, `matrixPos` |
| `row` / `col` | Matrix row / column number | `column`, `r`, `c` |
| `pin` (`PinRef`) | A GPIO pin reference, via connector (`&pro_micro 4`) or direct (`&gpio0 8`) | `gpio` (as a noun), `port`, `wire` |
| `kscan` | How switches are read (`matrix` / `direct` / `charlieplex`) | `scanner`, `matrix` (for kscan in general) |
| `half` | `'left' \| 'right'` of a split shield | `side`, `part` |
| `role` | `'central' \| 'peripheral'` | `master`, `slave`, `primary` |
| `layer` | One keymap layer; `layerIndex` is its position | `level`, `page` |
| `binding` | Behavior + params on one key in one layer (`&kp A`) | `action`, `mapping`, `keycode` (for the whole binding) |
| `behavior` | What a binding invokes (`kp`, `mo`, a user hold-tap) | `action`, `function`, `macro` (unless it is one) |
| `keycode` | A `&kp` parameter (`A`, `LSHIFT`) | `key`, `code` (for keycodes) |
| `combo` / `macro` | ZMK combo / macro | `chord`, `sequence` |
| `kconfigOption` | A `CONFIG_*` build setting | `setting`, `flag`, `option` (alone) |
| `issue` (`ValidationIssue`) | One validation problem | `error`, `problem`, `warning` |
| `file` (`GeneratedFile`) | Generator output `{ path, content }` | `output`, `artifact` |

UI copy may say "keyboard" and "controller" for readability; code and types use the table.

## Rules

- Variables and types are nouns; booleans read as a yes/no question: `isSplit`, `hasEncoder`, `canExport`, `shouldAutosave`.
- Collections are plural (`keys`, `layers`, `rowPins`); one element is the singular (`for (const key of keys)`).
- Lookup maps/records are `xByY`: `keyByCell`, `pinsByHalf`, `issuesByKeyIndex`.
- Units in the name whenever a number has one: `xU`, `widthU`, `rotationDeg`, `debounceMs`, `tappingTermMs`. Converted values say so: `xCentiU` when emitting centi-units for DT.
- Counts are `xCount` (`keyCount`), not `numKeys` / `keysLength`.
- IDs of user-defined entities are `xId` (`behaviorId`, `macroId`); the DT label generated from it is `xLabel` (`behaviorLabel`).
- No single-letter names except `i`/`j` in index loops. Lambdas name the element too: `keys.map((key) => key.xU)`.
- Acronyms are cased as words: `GpioPin`, `dtLabel`, `KconfigOption`, `zmkVersion`. Allowed abbreviations: ZMK, GPIO, DT, kscan, RC, u, BLE, HID, RGB, USB, Kconfig, `id`. Nothing else (`cfg`, `btn`, `idx`, `tmp`, `val`).

```ts
// ✅
const pinsByHalf = { left: leftPins, right: rightPins } as const;
const isSplit = project.halves.length === 2;
type Key = { readonly xU: number; readonly yU: number; readonly widthU: number; readonly rotationDeg: number; readonly cell?: MatrixCell };

// ❌
const map = new Map(keys.map((k) => [k.rc, k]));
const split = project.halves.length === 2;
type Key = { x: number; y: number; w: number; r: number; pos?: [number, number] };
```

## Constants and types

- `SCREAMING_SNAKE_CASE` only for module-level constants fixed at author time: primitives and `as const` catalog tables (`KEY_PITCH_MM = 19.05`, `PROJECT_STORAGE_KEY`, `BEHAVIORS`, `BOARDS`). Locals and derived values are camelCase even if `const`.
- Types and components are `PascalCase`; everything else `camelCase`. No `I`/`T` prefixes, no `Type` suffix (`Binding`, not `BindingType`).
- Discriminant values are kebab-case or match the ZMK spelling (`'col2row'`, `'hold-tap'`).

## Files

- All files kebab-case, named after their single export: `add-key.ts` → `addKey`, `matrix-grid.tsx` → `MatrixGrid`, `project-schema.ts` → `projectSchema`. One rule for everything; avoids case-only renames on case-insensitive filesystems.
- Tests sit next to the file: `add-key.test.ts`. Golden fixtures: `tests/fixtures/<shield>/` (AGENTS §3.3).
- `.tsx` only for files containing JSX.

## Enforced by

- oxlint: `unicorn/filename-case` (kebab-case), `id-length` (if configured, with `i`/`j` exceptions).
- Review only: glossary terms and banned synonyms, boolean prefixes, `xByY`, units in names, constant casing.
