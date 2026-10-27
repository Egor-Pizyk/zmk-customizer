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

Enforced by scripts/check-architecture.mjs (resolved imports, re-exports, dynamic imports, separate test locations), oxlint no-restricted-imports overrides and import/no-cycle. Electrical engine modules (wiring/matrix, wires/nets, validation) have no runtime UI API. Mixed wire/crossing query modules grant only explicit UI-safe contracts; new engine exports are private to domain consumers by default. Only project-state calls domain analysis; UI consumers read its shared result. Shared UI modules cannot import workspaces or app composition. Exact root contracts and exceptions are documented below.

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

## Resolved architecture gate exceptions

The dependency matrix in docs/architecture.md is checked by scripts/check-architecture.mjs, including alias resolution, normalized paths, exports and dynamic imports. Pure layers accept no external packages. React/react-dom/fflate are allowed in UI composition; zod/fflate in storage. Catalog raw assets stay in catalog. Tests may read fixtures and use test helpers; production cannot import either tests or test helpers.

- Shared UI modules allowed from workspaces/shared UI: project, preferences, navigation, shortcuts, dialogs, downloads, issues and onboarding. Owner: shared UI. Reason: project/preferences/actions and shared contracts. App composition stays in ui/app and is not imported by workspaces. The shortcut event reader lives in ui/shortcuts so workspaces do not depend on app composition.
- src/ui/export/logic/get-export-preview.ts is the only runtime UI→generators bridge. Owner: Export. Reason: prepare deterministic generated previews from the shared analysis. Remove only if preview preparation moves to another named composition boundary. GeneratedFile type-only imports through @generators are allowed in export consumers; the gate resolves the symbol’s defining file rather than treating the entire barrel as one permission.
- src/main.tsx may import src/styles.css. Owner: composition root. Reason: Vite entry styles. Remove if the stylesheet entry moves.
- Electrical engine modules wiring/matrix, wires/nets and validation (including shield) expose no runtime UI API. Mixed wire/crossing modules grant UI access only to explicit non-analysis query/edit contracts; newly added exports are unavailable by default. Only ui/project/logic/project-state.ts calls domain analysis. New engine exports inherit the module restriction. Shared UI modules do not import workspaces or app composition; only app composes workspaces. Use getProjectAnalysis; domain type imports remain allowed.

These static checks do not establish semantic purity or complete alias/data-flow analysis; tests and review remain required.

Feature 033 UI-safe wire queries: getWireConductors and getWireSections expose visible geometry/selection descriptions only. Capture, partition analysis and routing remain domain-owned and unavailable to runtime UI consumers.

## JointJS Schematic presentation boundary (038)

Under [ADR0023](decisions/0023-jointjs-schematic-projection.md), `src/ui/schematic/diagram/logic/` alone may import exact `@joint/core@4.3.3`; no deep source imports or runtime library re-exports. The private Graph/Paper is a disposable projection, outside Project, domain APIs, storage, generators and project history. React owns its host, the adapter owns its descendants, and completed normalized gestures invoke existing domain operations through provider commit. Shared surface contracts expose no JointJS types; Bindings retains its SVG renderer. No graph-change-to-commit, automatic electrical routing, second camera or new context. scripts/check-architecture.mjs enforces the exact import boundary and rejects runtime library re-exports; tsconfig.json registers the adapter aliases. Immutable presentation descriptors are derived from the existing domain geometry and descriptions, with no second circuit model.
