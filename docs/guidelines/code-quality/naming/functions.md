---
description: Function, component and handler naming — get/find/is/validate/commit/render/format/map verb prefixes.
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Naming: functions

Project naming contracts; domain vocabulary: `variables.md`.

## Verb prefixes (all layers)

| Prefix | Meaning | Returns |
|---|---|---|
| `getX` | Derive or look up something that always exists | `X` (never `undefined`) |
| `findX` | Look up something that may not exist | `X \| undefined` |
| `isX` / `hasX` / `canX` | Predicate, no side effects | `boolean` |
| `validateX` | Check invariants | `readonly ValidationIssue[]` |
| `parseX` | `unknown`/string → typed value | `Result<X, E>` |
| `toX` / `formatX` | Pure conversion / display string | `X` / `string` |
| `createX` | Build a new entity with defaults | `X` |

## Per layer

- **domain operations** — `(project, input) => Project`, named by the user-level action: `addKey`, `removeKey`, `moveKey`, `rotateKey`, `assignMatrixCell`, `assignPin`, `addLayer`, `setBinding`, `addCombo`. `setX` only for replacing one field value.
- **domain queries** — `getKeyCount`, `findKeyAtCell`, `findPinOwner`, `isPinUsed`, `hasSplit`, `validateWiring`, `validateProject`.
- **generators** — `generateX` returns a whole file (`{ path, content }`): `generateOverlay`, `generateKeymap`, `generateKconfigShield`, `generateKconfigDefconfig`. `renderX` returns a text fragment: `renderKscanNode`, `renderMatrixTransform`, `renderBinding`.
- **storage** — I/O: `loadProject`, `saveProject`, `readImportFile`. Pure: `parseProjectFile`, `serializeProject`, `migrateProject` (per step: `migrateV2ToV3`).
- **catalog** — mostly data; lookups follow the table above: `findBoard`, `getKeycodeLabel`.
- **event handlers** — `handleX` inside the component that owns the handler; `onX` for callback props. Name by event, not by effect: `handleKeyDrag` / `onKeyMove`.

Query names (`getX`, `findX`, `isX`, `validateX`) imply no side effects or user-causable exceptions. Domain abbreviations and glossary: `variables.md`.
