# ZMK Customizer

Browser tool for keyboard layout, electrical wiring, keymaps, behaviors and firmware settings. Exports a ready-to-build ZMK v0.3.0 shield in a zmk-config repository ZIP.

Static/offline application: no backend or accounts. Projects autosave in the browser and import/export as versioned JSON. Firmware building/flashing happens outside the app.

## Quick start

Requires Docker, or a prepared Node 24 host with `npm ci`.

```sh
make up       # http://localhost:5173
make sh       # prepared app container for focused checks
make test-unit-focus ARGS='tests/unit/domain/keys/move-key.test.ts'
make test-related ARGS='src/domain/keys/move-key.ts'
make help
```

## Development

Implement directly from the user's request. Read the affected code/tests, make a coherent change and run the smallest useful check. Focused tests, watch mode and targeted Chromium journeys are available immediately. Broaden for shared changes or unresolved risk; CI retains full checks. No specification pipeline, feature numbering, behavior matrix or routine evidence journal.

[AGENTS.md](AGENTS.md) is the agent startup guide; [commands](docs/commands.md) lists focused and broad checks. Optional `zmk-reviewer` and `domain-test-writer` helpers live in `.claude/agents/`.

## Workspaces and references

Schematic owns physical layout and electrical wiring; Bindings owns layers/actions; Firmware owns typed ZMK settings; Export previews/downloads generated files. Settings holds app preferences separately from Project. Keyboard shortcuts are available from the lower navigation.

- [Product](docs/product.md) and [future direction](docs/roadmap.md)
- [Architecture](docs/architecture.md), [folder structure](docs/folder-structure.md), [domain model](docs/domain-model.md)
- [Testing](docs/testing.md) and [project guidelines](docs/guidelines/)
- [Verified ZMK notes](docs/zmk/README.md) and [architectural decisions](docs/decisions/README.md)
