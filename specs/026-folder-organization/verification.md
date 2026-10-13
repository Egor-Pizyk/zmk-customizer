# Verification — folder organization

Verified on 2026-10-13 in Docker. Existing work in progress on branch 013-matrix-wiring-editor was retained; this structural refactor was applied in the current working copy without commits or branch switching.

## Results

- `make check`: passed, including 40 architecture fixtures, 6 guideline tests, typechecks, lint, formatting and all 174 Vitest files / 1016 tests.
- Coverage: statements 90.82%, branches 83.90%, functions 91.73%, lines 90.78%. All original global and per-layer floors remain unchanged and pass.
- `docker compose run --rm app npm run build`: passed. Vite retains its existing large-chunk advisory; no code-splitting work was added to this refactor.
- `make test-e2e`: passed, 84 browser cases across complete Chromium and targeted Firefox/WebKit suites, with no retries or snapshot updates.
- `git diff --check`: passed.
- All 446 source/test file moves were checked for existing destinations and absent old paths. An additional two Node tooling test files moved to tests/tooling. No test/spec files remain in src. The largest production group has 24 files.

## Risk and coverage

| Scenario | Risk | Existing coverage and assertions | Added coverage |
|---|---|---|---|
| Nested modules | Broken imports or weakened layer ownership | Compiler, resolved architecture checks, lint and production build | Same-workspace nested imports, cross-workspace re-exports and catalog bindings folder fixtures |
| Test relocation | Tests stop being discovered or checked | Explicit tests/unit discovery and compiler/linter inputs; all 174 files execute | Tests-first rejection of test files under src; failing fixture observed before enforcement was implemented |
| Golden fixtures | Wrong fixture URLs, missing bytes or leading output slashes | Independent golden comparisons for every generated file and complete repository paths | None; only fixture paths and prefixes updated |
| Browser application | CSS discovery, composition, SVG paint, focus or persistence changes after relocation | Existing product, layout, paint and wiring journeys; visible geometry/state, saved JSON and actual downloaded JSON/ZIP assertions | None; product interaction and E2E assertions are unchanged |

No new user journeys were introduced. Three repeated new-journey runs and controlled interaction mutations are not applicable; no new interaction contract was added. Mutation-tool paths were updated but the mutation suites were not run. ZMK compilation was not repeated because generator bodies and exported geometry were not changed; all independent output golden contracts passed. Existing browser coverage does not prove every possible project permutation or replace manual accessibility checks. Useful runtime reports remain in ignored coverage, playwright-report and test-results directories; no generated build or coverage artifacts were added to versioned source.
