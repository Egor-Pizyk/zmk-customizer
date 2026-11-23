# Repository map

| Path | Purpose |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | Agent startup; direct implementation and focused verification |
| `src/domain/` | Pure immutable project operations, electrical analysis and validation |
| `src/catalog/` | Pinned ZMK facts, controllers and keycodes |
| `src/generators/` | Deterministic shield/keymap/repository output |
| `src/storage/` | Untrusted parsing, migrations and persistence |
| `src/ui/`, `src/styles.css` | React workspaces, shared controls and semantic tokens |
| `tests/unit/`, `tests/e2e/`, `tests/tooling/` | Business, browser and repository regressions |
| `tests/fixtures/`, `tests/helpers/` | Historical projects, independent upstream/golden output and builders |
| `docs/zmk/` | Verified pinned syntax and source links |
| `docs/guidelines/` | Project-specific implementation conventions; load only the relevant section |
| `docs/decisions/` | Architectural rationale, read when a decision is actually affected |
| `.claude/agents/` | Optional focused reviewers; guidelines are loaded on demand |
| `scripts/`, `infra/`, `Makefile` | Checks, development containers and pinned firmware builds |

`tsconfig.json` owns exact module aliases. Use code/test search to locate ownership; no feature resolver or numbered artifact directory is required. Product direction lives in docs/product.md and the roadmaps, not in a mandatory development pipeline.
