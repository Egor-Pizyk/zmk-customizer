---
description: TypeScript data modeling for src — discriminated unions on kind, readonly data, no casts, named exports, exhaustiveness.
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# TypeScript

How types are designed in this codebase. Naming lives in `naming/`; error surfacing in `observability.md`.

## Data types

- Use `type`, not `interface`.
- Variants are discriminated unions on a `kind` field. Applies to kscan, bindings, behaviors, pin refs.
- All domain data is `readonly` (`readonly` props, `readonly T[]`). Changes create new values (`control-flow.md`).
- Absence is `undefined` / optional props. No `null` in domain types.
- `Project` is plain JSON (docs/architecture.md): no classes, `Date`, `Map`, `Set` or functions inside it; an absent optional field is omitted, not stored as a sentinel.
- No enums. Use string-literal unions, or an `as const` object when values need to be iterated.

## No branded types (for now)

No branded/opaque types without an actual mixup bug and an ADR. Use `{ row, col }` for matrix cells and options objects for two or more numeric parameters.

## Catalog data

- Catalog tables are `as const` and checked with `satisfies` against an entry type, so literals stay narrow and shape errors fail typecheck.
- Derive unions from the catalog instead of repeating them.

## Casts and escape hatches

- No `any`, no non-null `!`, no `as` (except `as const`). No `@ts-ignore`; `@ts-expect-error` only in tests, with a reason.
- Untrusted input is `unknown` and becomes typed only through a zod schema in `storage/`. The schema is checked against the domain type so they cannot drift.
- Indexed access returns `T | undefined` (`noUncheckedIndexedAccess`). Handle it with a guard or a `findX` query, not `!`.

## Exhaustiveness

- `switch` over a union's `kind` handles every case and ends with an `assertNever` default. Adding a variant must break the build everywhere it matters.
- No `default` that silently returns a fallback for a union.

## Errors: return vs throw

- User-causable problems are values, never exceptions:
  - Domain validation: `validateProject(project): readonly ValidationIssue[]` (shape in `observability.md`).
  - Domain operations are total: they apply the change even if it creates a conflict (e.g. two keys on one cell); validation reports it so the UI can highlight it.
  - Protected edits (040) and wiring proposals are total results with atomic refusal: never change a locked connection or apply only part of a group. Existing Project-returning operations return the original project on refusal and expose a pure validation/query for actionable feedback; Result-returning operations return a structured failure. Ordinary editable validation conflicts retain the rule above. Explicit unlock is a separate lock-only edit, not an unlock-and-mutate bypass.
  - Parsing untrusted input: `Result<T, E>` = `{ ok: true; value: T } | { ok: false; error: E }`.
- `throw` only for programmer errors (impossible states, `assertNever`). Never catch those to continue; they reach the error boundary.

## Modules

- Named exports only; no default exports (tool config files excepted). Each module exposes an `index.ts` with explicit named value and `export type` declarations; no wildcard exports.
- `import type` for type-only imports.
- `domain/` and `generators/`: one exported function (plus its input/output types) per implementation file, named after the function (`add-key.ts` exports `addKey`). Public `index.ts` files list multiple explicit exports. Shared domain types live in `domain/types.ts` or a file per concept when it grows.
- No classes outside `ui/app/components/error-boundary.tsx` (React still needs a class for error boundaries). Domain = plain data + functions.

Production files are grouped by responsibility inside each layer. Tests live in `tests/unit/<layer>/<group>/`, mirroring production groups, rather than beside production modules. Node tooling tests live in `tests/tooling/`. Keep existing layer boundaries across nested folders. Cross-module imports use exact aliases that resolve to the public `index.ts`; direct relative imports are allowed only within the same module. Never import a module’s own index from its implementation files.
