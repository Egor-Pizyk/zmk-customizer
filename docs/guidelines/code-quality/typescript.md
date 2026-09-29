---
description: TypeScript data modeling for src — discriminated unions on kind, readonly data, no casts, named exports, exhaustiveness.
globs:
  - src/**/*.ts
  - src/**/*.tsx
---

# TypeScript

How types are designed in this codebase. Naming lives in `naming/`; error surfacing in `observability.md`.

## Data types

- `type`, never `interface`. Most domain types are unions, which `interface` cannot express; one keyword keeps them uniform, and nothing here needs declaration merging.
- Variants are discriminated unions on a `kind` field (never `type`, which reads as a TS keyword). Applies to kscan, bindings, behaviors, pin refs.
- All domain data is `readonly` (`readonly` props, `readonly T[]`). Changes create new values (`control-flow.md`).
- Absence is `undefined` / optional props. No `null` in domain types.
- `Project` is plain JSON (AGENTS §3.2): no classes, `Date`, `Map`, `Set` or functions inside it; an absent optional field is omitted, not stored as a sentinel.
- No enums. Use string-literal unions, or an `as const` object when values need to be iterated.

```ts
// ✅
type Kscan =
  | { readonly kind: 'matrix'; readonly diodeDirection: 'col2row' | 'row2col'; readonly rowPins: readonly PinRef[]; readonly colPins: readonly PinRef[] }
  | { readonly kind: 'direct'; readonly pins: readonly PinRef[] }
  | { readonly kind: 'charlieplex'; readonly pins: readonly PinRef[] };

// ❌ optional bag: every consumer must guess which fields exist
interface Kscan { type: string; rowPins?: PinRef[]; pins?: PinRef[]; diodeDirection?: string }
enum DiodeDirection { Col2Row, Row2Col }
```

## No branded types (for now)

Decision: no branded/opaque types. Brands need an `as` at every construction site, which fights the no-cast rule. The real mixup risk (key index vs row vs col, all `number`) is removed by never passing them positionally: matrix cells are `{ row, col }` objects and any function taking two or more numbers takes an object. Add a brand only after an actual mixup bug, with an ADR.

```ts
// ✅
type MatrixCell = { readonly row: number; readonly col: number };
function findKeyAtCell(project: Project, cell: MatrixCell): Key | undefined;

// ❌ findKeyAtCell(project, 3, 5) — which is row?
function findKeyAtCell(project: Project, row: number, col: number): Key | undefined;
```

## Catalog data

- Catalog tables are `as const` and checked with `satisfies` against an entry type, so literals stay narrow and shape errors fail typecheck.
- Derive unions from the catalog instead of repeating them.

```ts
// ✅
export const BEHAVIORS = [
  { id: 'kp', label: 'Key press', params: ['keycode'], docsUrl: 'https://zmk.dev/docs/keymaps/behaviors/key-press' },
  { id: 'mo', label: 'Momentary layer', params: ['layer'], docsUrl: 'https://zmk.dev/docs/keymaps/behaviors/layers#momentary-layer' },
] as const satisfies readonly BehaviorEntry[];
export type BuiltinBehaviorId = (typeof BEHAVIORS)[number]['id'];

// ❌ `: BehaviorEntry[]` annotation widens ids to string; no `satisfies` lets typos through
```

## Casts and escape hatches

- No `any`, no non-null `!`, no `as` (except `as const`). No `@ts-ignore`; `@ts-expect-error` only in tests, with a reason.
- Untrusted input is `unknown` and becomes typed only through a zod schema in `storage/`. zod returns the typed value — no cast needed. The schema is checked against the domain type so they cannot drift.
- Indexed access returns `T | undefined` (`noUncheckedIndexedAccess`). Handle it with a guard or a `findX` query, not `!`.

```ts
// ✅ storage/project-schema.ts
export const projectSchema = z.object({ schemaVersion: z.literal(3), /* … */ }) satisfies z.ZodType<Project>;

// ✅
const key = project.keys[keyIndex];
if (key === undefined) return [];

// ❌
const data = JSON.parse(raw) as Project;
const key = project.keys[keyIndex]!;
```

## Exhaustiveness

- `switch` over a union's `kind` handles every case and ends with an `assertNever` default. Adding a variant must break the build everywhere it matters.
- No `default` that silently returns a fallback for a union.

```ts
// ✅
switch (kscan.kind) {
  case 'matrix': return renderMatrixKscan(kscan);
  case 'direct': return renderDirectKscan(kscan);
  case 'charlieplex': return renderCharlieplexKscan(kscan);
  default: return assertNever(kscan);
}
// src/domain/assert-never.ts
export function assertNever(value: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(value)}`);
}
```

## Errors: return vs throw

- User-causable problems are values, never exceptions:
  - Domain validation: `validateProject(project): readonly ValidationIssue[]` (shape in `observability.md`).
  - Domain operations are total: they apply the change even if it creates a conflict (e.g. two keys on one cell); validation reports it so the UI can highlight it.
  - Parsing untrusted input: `Result<T, E>` = `{ ok: true; value: T } | { ok: false; error: E }`.
- `throw` only for programmer errors (impossible states, `assertNever`). Never catch those to continue; they reach the error boundary.

## Modules

- Named exports only; no default exports (tool config files excepted). No barrel `index.ts` files.
- `import type` for type-only imports.
- `domain/` and `generators/`: one exported function (plus its input/output types) per file, file named after it (`add-key.ts` exports `addKey`). Shared domain types live in `domain/types.ts` or a file per concept when it grows.
- No classes outside `ui/error-boundary.tsx` (React still needs a class for error boundaries). Domain = plain data + functions.

## React

- Function components, props as a `type <Component>Props` next to the component, destructured in the signature. No `React.FC`.
- Components contain no ZMK rules: they call domain queries/operations and render the result. A condition like "is this pin already used" is a domain function, not inline JSX logic.
- Derive during render; `useEffect` is only for syncing with the outside world (localStorage, `document` listeners), never for computing state from other state.
- List `key` props use stable identity, never the array index of a reorderable list.
- Hooks follow the rules of hooks; dependency arrays are complete, not silenced.

## Enforced by

- tsconfig: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` (type-only imports), `erasableSyntaxOnly` (bans enums, namespaces, parameter properties).
- oxlint: `typescript/no-explicit-any`, `typescript/no-non-null-assertion`, `typescript/consistent-type-definitions` (type), `typescript/consistent-type-imports`, `typescript/ban-ts-comment`, `import/no-default-export`, `react/rules-of-hooks`, `react/exhaustive-deps`, `typescript/switch-exhaustiveness-check` (type-aware, if enabled).
- Review only: no brands, `kind` discriminant, `readonly` everywhere, `satisfies` on catalog, return-vs-throw rule, one concept per file, no logic in components, no effects for derived state.
