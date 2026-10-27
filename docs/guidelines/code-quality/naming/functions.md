---
description: Function, component and handler naming — get/find/is/validate/commit/render/format/map verb prefixes.
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Naming: functions

Functions start with a verb that tells the reader what kind of function it is. Domain vocabulary and casing: `variables.md`.

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

A `getX` that can come back empty is a bug in the name: rename to `findX`.

## Per layer

- **domain operations** — `(project, input) => Project`, named by the user-level action: `addKey`, `removeKey`, `moveKey`, `rotateKey`, `assignMatrixCell`, `assignPin`, `addLayer`, `setBinding`, `addCombo`. `setX` only for replacing one field value.
- **domain queries** — `getKeyCount`, `findKeyAtCell`, `findPinOwner`, `isPinUsed`, `hasSplit`, `validateWiring`, `validateProject`.
- **generators** — `generateX` returns a whole file (`{ path, content }`): `generateOverlay`, `generateKeymap`, `generateKconfigShield`, `generateKconfigDefconfig`. `renderX` returns a text fragment: `renderKscanNode`, `renderMatrixTransform`, `renderBinding`.
- **storage** — I/O: `loadProject`, `saveProject`, `readImportFile`. Pure: `parseProjectFile`, `serializeProject`, `migrateProject` (per step: `migrateV2ToV3`).
- **catalog** — mostly data; lookups follow the table above: `findBoard`, `getKeycodeLabel`.
- **React components** — PascalCase nouns for what they show: `KeyCanvas`, `MatrixGrid`, `BindingPicker`, `ExportPreview`. Not `KeyCanvasComponent`, not verbs.
- **hooks** — `useX`: `useProject`, `useUndoHistory`.
- **event handlers** — `handleX` inside the component that owns the handler; `onX` for callback props. Name by event, not by effect: `handleKeyDrag` / `onKeyMove`.

## Banned

- Vague verbs: `process`, `do`, `manage`, `perform`, `execute`, `run`, `handle` (outside UI handlers), `update` (say what changes: `moveKey`, `setBinding`).
- Nouns as function names: `keymap(project)` → `generateKeymap(project)`.
- Names that hide side effects: a `getX`/`findX`/`isX`/`validateX` never writes, mutates or throws for user-causable problems (`control-flow.md`).
- Abbreviations, except the domain terms listed in `variables.md` (ZMK, GPIO, DT, kscan, RC, u, BLE, HID, RGB, USB, Kconfig) and `id`.

## Length

- Name length scales with scope: exported functions are fully descriptive (`renderMatrixTransform`); a local helper used on the next line can be short (`renderRow`).
- Don't repeat the file's subject in private helpers: in `generators/shield/generate-overlay.ts`, helpers are `renderKscanNode`, not `renderOverlayKscanNode`.

## Enforced by

- Review only (no lint rule checks verb semantics). oxlint `react/rules-of-hooks` indirectly enforces the `use` prefix for hooks.
