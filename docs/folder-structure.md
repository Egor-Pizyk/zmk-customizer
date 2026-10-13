# Folder structure

The top-level source folders define architectural layers. Nested folders group related responsibilities without changing which layers may import each other. Cross-module imports use exact aliases that resolve to public `index.ts` files. The index lists explicit named value and type exports; implementation files are private outside their module. Within a module, relative imports keep its public index out of the internal dependency graph.

| Folder | Responsibility |
|---|---|
| `src/domain/project/` | Project creation, naming, identifiers and controller changes |
| `src/domain/keys/` | Adding, moving, duplicating and deleting physical keys |
| `src/domain/geometry/` | Coordinates, shapes, overlap and pointer transforms |
| `src/domain/layers/` | Layer creation, ordering, names and binding maps |
| `src/domain/bindings/` | Binding queries, policies and behavior edits |
| `src/domain/wires/` | Drawn wires, endpoints, pin contacts and wire edits |
| `src/domain/crossings/` | Wire intersections and insulation |
| `src/domain/diodes/` | Diode presence, pin and polarity |
| `src/domain/wiring/` | Electrical matrix cells, terminals, topology and routing |
| `src/domain/analysis/` | Nets, shield matrix derivation and combined project analysis |
| `src/domain/validation/` | Project and feature invariant checks |
| `src/catalog/controllers/` | Boards, controller lookup and wiring choices |
| `src/catalog/bindings/` | Keycodes, behaviors, modifiers and command catalogs |
| `src/catalog/presets/` | Preset keyboard definitions |
| `src/catalog/firmware/` | Pinned target and ZMK limits |
| `src/catalog/zmk/` | Vendored upstream data |
| `src/generators/shield/` | Shield overlays and Kconfig files |
| `src/generators/keymap/` | Keymap and behavior rendering |
| `src/generators/repository/` | Complete repository packaging and user configuration |
| `src/storage/project/` | Project parsing, schema, budgets, serialization and persistence |
| `src/storage/migrations/` | Versioned project migrations |
| `src/storage/preferences/` | Application preferences |
| `src/storage/export/` | ZIP construction |
| `src/ui/schematic/rendering/` | SVG keys, wires, diodes, markers and preview layers |
| `src/ui/schematic/interaction/` | Pointer/keyboard input, selection, hit detection and drafts |
| `src/ui/schematic/layout/` | Physical layout controls and previews |
| `src/ui/schematic/wiring/` | Controller and electrical wiring editors |
| `src/ui/schematic/parts/` | Parts tables and per-part editors |
| `src/ui/schematic/tools/` | Tool choices and tool window |
| `src/ui/bindings/formatting/` | Binding names and keycap legends |
| `src/ui/bindings/picker/` | Binding choices, slots, drafts and picker controls |
| `src/ui/bindings/panel/` | Action panel composition, size and focus |
| `src/ui/bindings/interaction/` | Selection, shortcuts, copy/paste and layer actions |
| `src/ui/bindings/rendering/` | Binding canvas, keycaps, layers and table |

Workspace roots hold composition and shared workspace contracts. UI composition lives in `src/ui/app/`; shared contracts live in the dedicated modules below. Existing shared folders (`components`, `canvas`, `shell`) and the smaller `firmware` and `export` workspaces retain their ownership.

## Public module APIs

`tsconfig.json` is the source of truth for exact alias-to-index paths; wildcard aliases are not exposed. Vite and Vitest use the built-in tsconfig paths resolver. The lint rule and architecture checker read the same alias registry.

- `@domain`: Pure domain operations and types. Geometry, keys, wiring, validation and other responsibility folders remain internal groups in this module; their existing mutual dependencies do not become barrel cycles.
- `@generators`: Deterministic file generators and generated-file types; shield, keymap and repository folders remain internal groups.
- `@catalog/bindings`, `@catalog/controllers`, `@catalog/firmware`, `@catalog/presets`: Independent catalog modules.
- `@storage/project`, `@storage/migrations`, `@storage/preferences`, `@storage/export`: Storage boundary modules.
- `@ui/app`: Application composition, workspace switching, global shortcut dispatch and the error boundary.
- `@ui/project`, `@ui/preferences`, `@ui/downloads`, `@ui/navigation`, `@ui/shortcuts`, `@ui/dialogs`, `@ui/issues`: Shared state, browser adapters and contracts.
- `@ui/components`, `@ui/canvas`, `@ui/shell`: Shared UI modules.
- `@ui/schematic`, `@ui/bindings`, `@ui/firmware`, `@ui/export`: Workspace modules; their nested responsibility folders are private implementation groups.

```ts
import { addKey } from '@domain';
import type { Project } from '@domain';
import { Button } from '@ui/components';
```

A consumer uses the module alias, never `@domain/keys/add-key` or a relative path to another module’s implementation. Internal files import their peers directly with relative paths and never import their own index. Pinned raw assets, CSS and test fixtures retain their file paths. Module aliases do not relax the layer matrix: the architecture checker follows named re-exports to the defining file, including intermediate re-exports and locally imported symbols that are re-exported.

## Tests

- `tests/unit/<layer>/<group>/`: Vitest contracts, mirroring source groups. For example, `src/domain/keys/add-key.ts` is tested in `tests/unit/domain/keys/add-key.test.ts`.
- `tests/unit/ui/integration/`: Complete application interaction flows.
- `tests/unit/ui/state/`: Shared no-op/history contracts that span several module operations.
- `tests/unit/ui/{project,app,shortcuts,downloads,issues}/`: Contracts for the corresponding shared/composition modules.
- `tests/tooling/`: Node tests for repository checks.
- `tests/e2e/`: Playwright browser journeys and snapshots.
- `tests/helpers/`: Shared builders, rendering helpers and setup.
- `tests/fixtures/`: Project inputs, independent golden files and upstream references.

Tests consume the same public module aliases as production consumers. `make check` discovers, typechecks and lints the relocated tests, enforces coverage floors and rejects test files in `src/`. Split a growing group when it contains distinct responsibilities; avoid arbitrary numbered folders, generic `utils` groups and one folder per function.
