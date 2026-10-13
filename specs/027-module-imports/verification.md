# Verification — module public APIs

Verified on 2026-10-13 in Docker. Applied to the existing working copy on 013-matrix-wiring-editor without switching branches or committing. Existing feature work and the previous folder organization were retained.

## Results

- 25 public index.ts APIs and exact compilerOptions.paths aliases. Internal responsibility folders remain separate; cross-module consumers, tests and helpers use public aliases. Tooling SSR loads the public entry files.
- `make check`: passed. 174 Vitest files / 1016 application tests, 72 import/architecture tests, 6 guideline tests, both TypeScript checks, lint and formatting passed.
- Coverage: statements 90.82%, branches 83.90%, functions 91.78%, lines 90.78%. All global and per-layer thresholds are unchanged. Pure re-export index files are excluded; implementation coverage remains enforced.
- `docker compose run --rm app npm run build`: passed. Existing Vite large-chunk advisory remains outside this task’s scope.
- `make test-e2e`: 84 passed in complete Chromium and targeted Firefox/WebKit suites, without retries or snapshot updates. The command also builds the production app.
- `docker compose run --rm app node scripts/benchmark-project.mjs --analysis`: completed successfully, exercising public domain SSR entry loading and aliased test helpers. Timings are observational, not a performance claim.
- `git diff --check`: passed.

## Risk and coverage

| Scenario | Risk | Existing coverage and assertions | Added coverage |
|---|---|---|---|
| Public module imports | Aliases resolve differently in TypeScript, Vite, lint or tooling | Compiler, production build, all public API unit consumers and read-only SSR tooling run | Exact index resolution, deep aliases, relative/absolute private paths, self-barrel imports and JS extension normalization |
| Lint enforcement | A configured rule silently permits private imports | Full lint runs on source, unit tests, helpers and E2E | Real Oxlint CLI positive/negative imports, re-exports, dynamic imports and type import queries; failures observed before fixes |
| Re-export ownership | A barrel hides a forbidden UI/domain/generator dependency | Existing resolved layer/purity fixtures and unchanged no-cycle rule | Alias-aware layer fixtures, runtime namespace/dynamic imports, type-only imports and intermediate/imported-symbol re-export chains; proxy tests observed failing before implementation |
| Shared UI modules | Composition cycles or changed shortcut/focus/state behavior | Existing React/provider tests; keyboard, table, dialog and workspace browser journeys assert visible state and saved project | No new journeys: shortcut parsing moved unchanged into shared shortcuts; app dispatch stays in composition |
| Export contracts | Packaging or generated syntax changes after new module initialization | Independent golden files, repository paths, actual downloaded JSON/ZIP browser assertions | No new generator semantics or assertions |

The module boundary is explicit: consumers use an exact alias to another module’s index; implementation peers use relative imports inside their own module. CSS, raw pinned assets and fixtures keep file paths. Domain and generators each expose one public entry because their existing responsibility groups have mutual folder dependencies; internal groups are preserved without creating barrel cycles.

No new product interaction contract was introduced, so new-journey triple runs and controlled interaction mutations are not applicable. Mutation-tool paths were updated but mutation suites were not rerun. ZMK compilation was not repeated: generator bodies and exported geometry are unchanged, and all independent output goldens pass. Static origin checks follow named re-exports and imported symbols but do not prove arbitrary value alias/data-flow purity. Useful generated reports stay in ignored output directories; no dist, coverage or node_modules artifacts were added to versioned source.
