---
description: Function shape for src — guard clauses, max depth 3, no nested ternaries, small functions, options objects.
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Control flow

How functions are shaped. Types and exhaustiveness: `typescript.md`. Error surfacing: `observability.md`.

## Shape

- Use options objects for two or more same-typed parameters or optional behavior; no positional boolean flags.
- Split generators by DT node / section (`renderKscanNode`, `renderMatrixTransform`).
- Mechanical function-shape rules are enforced by lint; see enforcement below.

## Purity and immutability

- `domain/` and `generators/` are pure: output depends only on arguments. No `Date.now`, `Math.random`, `localStorage`, DOM, module-level mutable state.
- Never mutate inputs; never reassign parameters. Return new objects with spread / `map` / `toSorted` / `toSpliced` / `with`.
- Mutating a value created inside the same function (e.g. pushing lines into a local array) is fine; it must not escape before it is complete.
- Generators sort explicitly before emitting anything whose order comes from user actions (combos, macros, Kconfig options) — see determinism in docs/architecture.md.

## Async

- Async code exists only in `storage/` (file reading, zip building) and `ui/` (event handlers). `domain/` and `generators/` are synchronous.
- No floating promises: every promise is `await`ed or explicitly handled; UI handlers catch and report (`observability.md`).

## Side effects

- Generators return `{ path, content }[]`; they never download, write storage, or touch the DOM. The UI decides what to do with the files.
- Side effects in `ui/` live in event handlers or `useEffect`, never during render.
- Functions whose name is a query (`getX`, `findX`, `isX`, `validateX`) have no side effects (`naming/functions.md`).

## Enforced by

- oxlint (error): `eslint/no-else-return`, `eslint/no-nested-ternary`, `eslint/max-depth`, `eslint/no-param-reassign`, `unicorn/no-array-for-each`, `unicorn/no-array-reduce`, `unicorn/no-array-callback-reference`, `typescript/require-await`, `eslint/max-lines-per-function`, `typescript/no-floating-promises`. check:guidelines verifies these explicit error severities against the configuration.
- scripts/check-architecture.mjs: resolved imports/re-exports/dynamic imports, pure-layer I/O and nondeterministic APIs including common aliases, lossless allocator policy, min/max argument spreads, UI analysis ownership and test mock/focus policy. This is a static guard, not a proof of purity.
- Review only: input mutation beyond param reassign, explicit sorting in generators, no boolean flags, async confined to storage/ui, semantic correctness of draft transitions.
