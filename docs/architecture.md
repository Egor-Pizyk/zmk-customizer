# Architecture

## Layers

```
src/
  domain/      Pure TS. Types + functions over project state. No DOM, no React, no I/O.
  catalog/     Static ZMK data: boards & pin maps, keycodes, behaviors, Kconfig options (with doc URLs).
  generators/  Pure functions: (Project) -> { path, content }[]. Deterministic text output.
  storage/     localStorage + JSON import/export. The only place that parses untrusted input.
  ui/          React components. Reads state, dispatches domain operations. No business rules.
               ui/components/ = design-system primitives; ui/<step>/ = feature screens.
  styles.css   Tailwind entry + design tokens (@theme). The only place for raw colors.
  main.tsx     Composition root.
```

Production imports follow this matrix; catalog values enter domain operations as arguments:

| From | Allowed project imports |
|---|---|
| domain | domain |
| catalog | catalog, domain types only, pinned own assets |
| generators | generators, domain, catalog |
| storage | storage, generators, domain, catalog |
| ui/components | ui/components only |
| ui/canvas, ui/shell | shared UI, domain/catalog/storage, listed shared UI module contracts; no feature folders |
| ui/<workspace> | same workspace, shared UI module contracts, domain/catalog/storage |
| ui/export | above, generator calls only in export/get-export-preview.ts; generated-file type in export consumers |
| ui/app | composition of UI/domain/catalog/storage; no generator calls |
| main.tsx | UI/storage/catalog and styles.css |

Enforced by scripts/check-architecture.mjs (resolved imports, re-exports, dynamic imports, separate test locations), oxlint no-restricted-imports overrides and import/no-cycle. Exact root contracts and exceptions are documented in docs/guidelines/code-quality/typescript.md.

See [folder ownership](folder-structure.md) for the concrete groups and test locations.

Group related files inside each layer by responsibility (project, geometry, keys, wiring, bindings, validation). UI workspaces group rendering, interaction, panels and editors. Keep layer roots for composition and shared contracts; avoid generic utils folders; expose each module through explicit named exports in `index.ts`. Unit and interaction tests live separately in `tests/unit/`, mirroring source groups. Browser tests, helpers and fixtures remain in `tests/e2e/`, `tests/helpers/` and `tests/fixtures/`. Cross-module imports use the exact TypeScript alias for the public `index.ts` (`@domain/keys`, `@generators/shield`, `@catalog/bindings`, `@storage/project`, `@ui/schematic/components`, etc.). No deep or relative cross-module imports. Within a module, implementation files use relative imports and never import their own public index. The `modules/public-api` Oxlint rule enforces this in source and tests; the resolved architecture gate follows named re-exports to their owners. Folders are created when the first file needs them, not ahead of time.

## State

- One serializable `Project` object (plain JSON, no classes, no `Date`, no `Map`). It has a `schemaVersion: number`.
- Every change goes through a pure domain function `(project, input) => project`. The UI never mutates state directly.
- Undo/redo = stack of previous `Project` values. Cheap because state is small.
- Schema changes bump `schemaVersion` and add a migration `vN -> vN+1` in `storage/`. Old files must still load.

## Generators

- Output is a pure function of `Project`. Same input → byte-identical output (stable ordering, fixed indentation, `\n` line endings, trailing newline).
- Generators do not validate; they receive a project that already passed domain validation. Exporting an invalid project is blocked in the UI with the list of errors.
- Each generator has golden-file tests. Verbatim upstream ZMK shields live in `tests/fixtures/upstream/<keyboard>/` (never edited); expected outputs are derived from them, with any intended deviation listed in a `DIFFERENCES.md` next to the expected files.

## Catalog data

- ZMK facts (keycodes, behaviors, Kconfig options, board pin maps) live as typed `as const` data in `src/catalog/`, never inline in components.
- Every catalog entry that the user can toggle carries `docsUrl` pointing to the exact section of the **v0.3 docs, https://v0-3-branch.zmk.dev/docs/** (not zmk.dev, which describes `main`). An entry without a link is a bug.
- Catalog targets one pinned ZMK version (see `docs/zmk/README.md`). Updating ZMK = updating catalog + fixtures in one change. Target version is v0.3 (ADR 0010); version-dependent values (board ids, board overlay names, `west.yml` revision) are catalog data, not generator code.
- Keycode data: generate from `dt-bindings/zmk/keys.h` (MIT). Do not bundle `docs/src/data/hid.js` (CC-BY-NC-SA).
