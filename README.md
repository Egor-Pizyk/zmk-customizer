# ZMK Customizer

Browser tool that turns a custom keyboard description — physical layout, matrix wiring, keymap, behaviors, ZMK settings — into a ready ZMK shield (`Kconfig.shield`, `Kconfig.defconfig`, `<name>.overlay`, `<name>.keymap`, split variants, `.conf`) packaged as a `zmk-config` repository zip.

Static site: no backend, no accounts, works offline. Projects are saved in the browser and can be exported/imported as JSON. It does not compile or flash firmware; build with your `zmk-config` GitHub Actions.

## Quick start

Requires Docker.

```
make up      # dev server at http://localhost:5173
make check   # typecheck, lint, format check, tests (same as CI)
make help    # all targets
```

Full command list: [AGENTS.md §5](AGENTS.md#5-commands).

## App layout

A left tab bar switches between four workspaces:
- **Schematic** — physical layout and wiring (canvas with a tools window);
- **Bindings** — keymap (canvas);
- **Firmware** — ZMK settings (placeholder for now);
- **Export** — generated files and download (placeholder for now).

Settings (theme, grid, snap, rulers, minimap) open from the gear at the bottom of the tab bar. Keyboard shortcuts are listed under the `?` button. Spec: [`specs/001-app-shell-ui/spec.md`](specs/001-app-shell-ui/spec.md).

## Development

Features are built spec-first with [GitHub Spec Kit](https://github.com/github/spec-kit) in Claude Code:

1. Pick the next feature in [docs/roadmap.md](docs/roadmap.md) (one-time setup: roadmap "Step 0").
2. `/speckit-specify <prompt from the roadmap>` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze` → `/speckit-implement`.
3. `make check` passes; commit with Conventional Commits.

Rules for humans and agents: [AGENTS.md](AGENTS.md). Project subagents (`zmk-reviewer`, `domain-test-writer`, `spec-reviewer`) live in `.claude/agents/`.

## Docs

- [AGENTS.md](AGENTS.md) — product, domain model, architecture, stack, principles
- [docs/roadmap.md](docs/roadmap.md) — features in implementation order
- [docs/decisions/](docs/decisions/README.md) — architecture decision records
- [docs/zmk/](docs/zmk/README.md) — verified ZMK reference notes
- [docs/guidelines/code-quality/](docs/guidelines/code-quality/) — code rules
