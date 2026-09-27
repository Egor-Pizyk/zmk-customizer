# Control flow

How functions are shaped. Types and exhaustiveness: `typescript.md`. Error surfacing: `observability.md`.

## Shape

- Guard clauses first, happy path last and unindented. No `else` after `return`/`throw`/`continue`.
- Max nesting depth 3 (blocks inside a function). Deeper → extract a named function.
- No nested ternaries. One ternary for a simple value is fine; more branches → `switch` or early returns.
- A function does one thing and fits on a screen (~40 lines). Generators split per DT node / section (`renderKscanNode`, `renderMatrixTransform`), not one long template.
- Any function taking two or more same-typed params, or any optional behavior, takes an options object (see "No branded types" in `typescript.md`).

```ts
// ✅
export function findKeyAtCell(project: Project, cell: MatrixCell): Key | undefined {
  return project.keys.find((key) => key.cell?.row === cell.row && key.cell?.col === cell.col);
}

function renderHoldTapFlavor(flavor: HoldTapFlavor | undefined): string {
  if (flavor === undefined) return '';
  return `flavor = "${flavor}";`;
}

// ❌
function render(b) {
  if (b) {
    if (b.flavor) { return `flavor = "${b.flavor}";`; } else { return ''; }
  } else { return ''; }
}
const label = isLayer ? (isToggle ? 'tog' : 'mo') : isMod ? 'mt' : 'kp';
```

## Purity and immutability

- `domain/` and `generators/` are pure: output depends only on arguments. No `Date.now`, `Math.random`, `localStorage`, DOM, module-level mutable state.
- Never mutate inputs; never reassign parameters. Return new objects with spread / `map` / `toSorted` / `toSpliced` / `with`.
- Mutating a value created inside the same function (e.g. pushing lines into a local array) is fine; it must not escape before it is complete.
- Generators sort explicitly before emitting anything whose order comes from user actions (combos, macros, Kconfig options) — see determinism in AGENTS §3.3.

```ts
// ✅
export function moveKey(project: Project, input: { keyIndex: number; xU: number; yU: number }): Project {
  return {
    ...project,
    keys: project.keys.map((key, index) => (index === input.keyIndex ? { ...key, xU: input.xU, yU: input.yU } : key)),
  };
}

// ❌
export function moveKey(project: Project, keyIndex: number, x: number, y: number): Project {
  project.keys[keyIndex].x = x; // mutates caller's state, breaks undo
  return project;
}
```

## Loops

- Transforms (`map`, `filter`, `flatMap`, `some`, `every`, `find`) use array methods.
- `for...of` when you need early exit, several outputs from one pass, or sequential `await`.
- No `forEach` (use `for...of`). `reduce` only for trivial folds (sum, max); anything building objects is `for...of` or `Object.fromEntries`.
- Index loops (`for (let i…)`) only when the index is the data (e.g. walking rows × cols of the matrix grid).

```ts
// ✅ early exit
for (const combo of project.combos) {
  if (combo.keyIndices.some((keyIndex) => keyIndex >= keyCount)) return false;
}

// ✅ transform
const bindingLines = layer.bindings.map((binding) => renderBinding(binding)); // no bare function refs: map passes (item, index, array)

// ❌
const byPin = pins.reduce((acc, pin) => ({ ...acc, [pin.id]: [...(acc[pin.id] ?? []), pin] }), {});
```

## Boolean flag parameters

- No boolean positional parameters. Split into two functions, or take a union / options object with a named field.

```ts
// ✅
renderKeymap(project);
renderKeymapPreview(project, { highlightKeyIndex: 12 });
generateOverlay(project, { half: 'left' });

// ❌
renderKeymap(project, true);
generateOverlay(project, false);
```

## Async

- Async code exists only in `storage/` (file reading, zip building) and `ui/` (event handlers). `domain/` and `generators/` are synchronous.
- No floating promises: every promise is `await`ed or explicitly handled; UI handlers catch and report (`observability.md`).
- No `async` functions without an `await`.

## Side effects

- Generators return `{ path, content }[]`; they never download, write storage, or touch the DOM. The UI decides what to do with the files.
- Side effects in `ui/` live in event handlers or `useEffect`, never during render.
- Functions whose name is a query (`getX`, `findX`, `isX`, `validateX`) have no side effects (`naming/functions.md`).

## Enforced by

- oxlint: `no-else-return`, `no-nested-ternary`, `max-depth`, `no-param-reassign`, `unicorn/no-array-for-each`, `unicorn/no-array-reduce`, `unicorn/no-array-callback-reference`, `require-await`, `max-lines-per-function` (if configured), `typescript/no-floating-promises` (type-aware, if enabled).
- Review only: purity of domain/generators, no input mutation beyond param reassign, explicit sorting in generators, no boolean flags, async confined to storage/ui.
