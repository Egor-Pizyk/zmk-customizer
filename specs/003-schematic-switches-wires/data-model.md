# Data model: Schematic keys and wires

Additions to `Project` (from roadmap 002). Types live in `src/domain/types.ts`; all fields `readonly`, plain JSON (ADR 0003). Research refs in brackets.

## Project (schemaVersion 2)

```ts
type Project = {
  readonly schemaVersion: 2;
  readonly name: string;                                  // from 002
  readonly shieldName?: string;                           // from 002: technical-name override, absent = derived
  readonly keys: readonly Key[];                          // array order = key index 0..n-1
  readonly wires: readonly Wire[];
  readonly insulatedCrossings: readonly CrossingRef[];    // only exceptions; default is connected [R6]
};
```

Migration `migrateV1ToV2`: `{ ...v1, schemaVersion: 2, keys: [], wires: [], insulatedCrossings: [] }`.

## Key (drawn as a switch)

```ts
type Key = {
  readonly id: string;   // 'k<n>' [R8]; stable; unique at any time (an id freed by deleting the highest one may be reused, harmless because geometry operations prune stale crossing refs)
  readonly xU: number;   // top-left, key units; this IS the physical key position (clarification 4)
  readonly yU: number;
};
type KeyPin = 1 | 2;
```

- Key index = position in `project.keys`; shown as "Key N" / "Key N".
- Occupies a 1u × 1u cell; no two keys' cells overlap Canvas and Enter paths refuse to place onto an occupied cell (`isKeyPositionFree`); operations stay total, so an overlap made through the parts-list X/Y fields or an imported file is reported by `key-overlap`.
- Pin positions derived: `getKeyPinPosition(key, pin)` [R2].
- Later: layout editor (007) adds `widthU`, `heightU`, `rotationDeg`, … to the same type.

## Wire

```ts
type WirePoint = { readonly xU: number; readonly yU: number };
type WireEnd =
  | { readonly kind: 'key-pin'; readonly keyId: string; readonly pin: KeyPin }
  | { readonly kind: 'junction'; readonly wireId: string; readonly at: WirePoint }
  | { readonly kind: 'free'; readonly at: WirePoint; readonly boardPin?: number };
type Wire = {
  readonly id: string;                 // 'w<n>'
  readonly start: WireEnd;
  readonly end: WireEnd;
  readonly bends: readonly WirePoint[]; // user clicks; drawn path derived orthogonal [R4]
};
```

Rules:
- At least one of `start` / `end` is `key-pin` (FR-009). `canAddWire(project, { start, end })` → `'ok' | 'no-key-pin' | 'same-pin' | 'missing-reference'` guards creation (references must resolve, 003 review M1); schema enforces on import [R15].
- `start` and `end` are not the same key pin.
- `junction.wireId` ≠ own id and references an existing wire.
- `boardPin` integer `0..BOARD_PIN_COUNT-1` (32), label `P<n>` [R11]; only on `free` ends.
- Wire number shown to user = index in `project.wires` ("Wire N").

## CrossingRef

```ts
type CrossingRef = {
  readonly wireIds: readonly [string, string]; // sorted ascending
  readonly ordinal: number;                    // 0-based order along wireIds[0]'s path [R6]
};
```

## Derived (never stored)

| Value | Function | Notes |
|---|---|---|
| Pin position | `getKeyPinPosition(key, pin)` | MX offsets [R2] |
| Wire path | `getWirePath(project, wire)` → `WirePoint[]` | orthogonal, horizontal-first corners [R4]; junction end = nearest point on target path [R5] |
| Crossings | `findCrossings(project)` → `{ ref: CrossingRef; at: WirePoint; isInsulated: boolean }[]` | excludes junction points and collinear overlaps [R6] |
| Nets | `getNets(project)` → `{ pins: {keyId, pin}[]; wireIds: string[]; boardPins: number[] }[]` | union-find [R7] |
| Free spot | `findFreeKeyPosition(project)` | right of last key, same row; origin if none |
| Free end spot | `findFreeEndPosition(project, { start })` | 1u below the start pin, 0.25u-snapped, stepping down until free (keyboard "Add wire" form) |

## Operations (`(project, input) => project`, one file each)

| Operation | Input | Effect |
|---|---|---|
| `addKey` | `{ position: WirePoint }` | appends `{ id: createEntityId('k'), xU, yU }` |
| `moveKey` | `{ keyId, position }` | sets xU/yU; `pruneInsulatedCrossings` |
| `removeKey` | `{ keyId }` | removes key; its pin ends → `free` at the pin's last position; wires left with no `key-pin` end removed (repeat for junctions to removed wires); prune |
| `addWire` | `{ start, end, bends }` | appends wire with `createEntityId('w')`; no prune needed (adding a wire cannot invalidate stored crossings) |
| `removeWire` | `{ wireId }` | removes wire; junctions onto it → `free` at their drawn point; cascade as in `removeKey`; prune |
| `setWireBends` | `{ wireId, bends }` | replaces bends; prune |
| `setWireEndBoardPin` | `{ wireId, side: 'start' \| 'end', boardPin: number \| undefined }` | on `free` end only; `undefined` omits the field |
| `toggleCrossingInsulation` | `{ ref: CrossingRef }` | adds or removes the ref |

Internal helper (exported for tests, one file): `pruneInsulatedCrossings(project)`.

## State transitions

- Wire end: `free` ⇄ `free + boardPin` (assign/remove); `key-pin` → `free` (key removed); `junction` → `free` (target wire removed).
- Crossing: connected (absent) ⇄ insulated (in `insulatedCrossings`); dropped when geometry no longer crosses.

## Validation (`validateSchematic`, see `contracts/validation-issues.md`)

`key-overlap`, `key-pin-unconnected`, `wire-end-unconnected`, `board-pin-conflict`, `board-pins-shorted`, `key-shorted`.
