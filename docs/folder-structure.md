# Folder structure

The top-level source folders define architectural layers. Nested folders group related responsibilities without changing which layers may import each other. Cross-module imports use exact aliases that resolve to public `index.ts` files. The index lists explicit named value and type exports; implementation files are private outside their module. Within a module, relative imports keep its public index out of the internal dependency graph.

| Folder | Responsibility |
|---|---|
| `src/domain/advanced-keymap/` | Combo, macro/step and conditional-layer operations, budgets and references |
| `src/domain/behaviors/` | Named behavior definitions, arguments and semantic validation |
| `src/ui/bindings/advanced/{components,logic}/` | Combo, macro and conditional-layer editors |
| `src/ui/bindings/behaviors/{components,logic}/` | Custom behavior library and typed editors |
| `src/domain/encoders/` | EC11 hardware edits, per-layer rotation assignments and semantic validation |
| `src/catalog/encoders/` | Pinned encoder defaults, option descriptions and documentation |
| `src/ui/schematic/encoders/components/` | Keyboard accessible encoder hardware/position/pin editor |
| `src/ui/bindings/encoders/components/` | Active-layer encoder rotation actions and repair focus |
| `src/domain/firmware/` | Typed firmware defaults, immutable overrides and validation |
| `src/domain/project/` | Project creation, naming, identifiers and controller changes |
| `src/domain/keys/` | Adding, moving, duplicating and deleting physical keys |
| `src/domain/geometry/` | Coordinates, shapes and overlap |
| `src/domain/geometry/transforms/` | Pointer resize and rotation operations |
| `src/domain/layers/` | Layer creation, ordering, names and binding maps |
| `src/domain/bindings/` | Binding queries and policies |
| `src/domain/bindings/editing/` | Behavior and binding edits |
| `src/domain/wires/` | Endpoints, pin contacts and wire queries |
| `src/domain/wires/editing/` | Wire edits |
| `src/domain/wires/nets/` | Electrical net derivation |
| `src/domain/crossings/` | Wire intersections and insulation |
| `src/domain/diodes/` | Diode presence, pin and polarity |
| `src/domain/wiring/` | Terminals, halves and cell assignment |
| `src/domain/wiring/matrix/` | Matrix cells and shield matrix derivation |
| `src/domain/wiring/editing/` | Wiring initialization, edits and routing |
| `src/domain/analysis/` | Combined project analysis |
| `src/domain/validation/` | Project and feature invariant checks |
| `src/domain/validation/shield/` | Complete shield export validation |
| `src/catalog/keycaps/` | Source-verified nominal rectangular keycap size choices; compatibility is not inferred |
| `src/catalog/controllers/` | Boards, controller lookup and wiring choices |
| `src/catalog/bindings/` | Keycodes, behaviors, modifiers and command catalogs |
| `src/catalog/presets/` | Preset keyboard definitions |
| `src/catalog/firmware/` | Pinned target, ZMK limits and typed Kconfig option facts |
| `src/catalog/zmk/` | Vendored upstream data |
| `src/generators/shield/` | Shield overlays and Kconfig files |
| `src/generators/keymap/` | Keymap and behavior rendering |
| `src/generators/repository/` | Complete repository packaging and user configuration |
| `src/storage/agent/` | Self-contained agent prompt, source-derived knowledge package and complete creation examples |
| `src/storage/kle/` | KLE JSON validation, geometry decoding and conversion warnings |
| `src/storage/project/` | Project parsing, schema, budgets, serialization and persistence |
| `src/storage/migrations/` | Versioned project migrations |
| `src/storage/preferences/` | Application preferences |
| `src/storage/export/` | ZIP construction |
| `src/ui/schematic/formatting/` | Schematic labels and wire issue text |
| `src/ui/schematic/rendering/` | SVG keys, wires, diodes, markers and preview layers |
| `src/ui/schematic/interaction/` | Pointer/keyboard input, selection, hit detection and drafts |
| `src/ui/schematic/layout/` | Physical layout controls and previews |
| `src/ui/schematic/wiring/` | Controller and electrical wiring editors |
| `src/ui/schematic/parts/` | Parts tables and per-part editors |
| `src/ui/schematic/tools/` | Tool choices and tool window |
| `src/ui/firmware/{components,logic}/` | Catalog-driven Firmware controls, search, drafts and issue repair |
| `src/ui/bindings/formatting/` | Binding names and keycap legends |
| `src/ui/bindings/picker/` | Binding choices, slots, drafts and picker controls |
| `src/ui/bindings/panel/` | Action panel composition, size and focus |
| `src/ui/bindings/interaction/` | Selection, shortcuts, copy/paste and layer actions |
| `src/ui/bindings/rendering/` | Binding canvas, keycaps, layers and table |

Workspace folders group composition and shared contracts in their child modules. Application rendering lives in `src/ui/app/components/` and global shortcut logic in `src/ui/app/logic/`. Shared folders (`components`, `canvas`, `shell`) and workspaces retain their architectural ownership after extension grouping.

## Public module APIs

`tsconfig.json` is the source of truth for exact alias-to-index paths; wildcard aliases are not exposed. Vite and Vitest use the built-in tsconfig paths resolver. The lint rule and architecture checker read the same alias registry.

The exact alias registry is `tsconfig.json`; do not copy it into documentation. Root APIs expose shared contracts, responsibility groups expose their own named indexes, and mixed UI groups expose separate logic/component APIs. Examples:

```ts
import { addKey } from '@domain/keys';
import type { Project } from '@domain';
import { Button } from '@ui/components/components';
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

Nested modules own files under their most specific registered root. Parent indexes expose only files owned by that root, not the entire subtree. Cross-group imports use the exact owning alias; within a group use relative implementation imports. Every populated source responsibility group has an explicit named index; raw upstream catalog assets are exempt.

Infrastructure lives in `infra/`; root Makefile selects its Compose files explicitly. Build contexts and project mounts still point to the repository root. Dockerfile-specific ignore files live beside each Dockerfile.

To keep barrels acyclic, query/policy modules are below editing modules, net derivation is below matrix derivation, and shield validation composes lower validators. Schematic formatting is below rendering and interaction; workspace composition is above all groups.

## Logic and component groups

Every UI responsibility group that contains both .ts and .tsx implementations is split into logic/ and components/. Functions, hooks and shared types live in logic/; JSX lives in components/. Each child has its own explicit index.ts and exact alias, for example @ui/bindings/picker/logic and @ui/bindings/picker/components. Index files are the extension exception. Pure groups are retained; no empty folders or parent compatibility barrels are created. Tests mirror the source owner, including .test.ts contracts for .tsx components. The source architecture gate rejects mixed implementation extensions and misplaced files in logic/components.
