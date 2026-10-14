# Verification — 2026-10-14

## Result

All 16 mixed UI groups now expose separate logic/ and components/ APIs. Moved 164 implementation files (including the extracted project context/state contracts) and 23 directly mirrored unit test files. Pure groups retain their existing structure. Removed empty parent indexes and aliases. All exact aliases and mutation source/test paths resolve.

- Child API contract failed before migration because @ui/canvas/logic resolved to a private path rather than its public index.
- Folder-layout contract failed before the new architecture check existed. Positive and negative contracts now cover index exceptions, mixed extensions and misplaced logic/components files.
- `make check`: passed; 174 Vitest files, 1016 tests, unchanged coverage floors, 75 architecture/public API tooling contracts, guideline gate, typechecks, lint and formatting.
- Production build through infra/compose.yaml: passed. The existing large-bundle warning remains; splitting the bundle is outside this folder refactor.
- `make test-e2e`: passed, 84 tests without retries: full Chromium (44), focused Firefox (20) and WebKit (20).
- `git diff --check`: passed. Mandatory documentation imports resolve and include ADR 0017.

## Coverage and limits

| Scenario | Risk | Existing/new coverage | Observable assertion |
|---|---|---|---|
| Child APIs and folder policy | Wrong alias ownership or extension placement | New positive/negative tooling contracts and existing resolved architecture/cycle checks | Exact index resolution, private/self-import rejection and mixed-folder diagnostic |
| Project context extraction | Different context instance, stale updates or lost import/history state | Existing real-provider integration/storage tests and complete browser journeys | Visible edits, undo/redo, saved project and reload/import preservation |
| UI relocation | Broken controls, focus, previews, painting or exports | Existing full Chromium plus focused Firefox/WebKit suite | Visible layout and controls, actual JSON/ZIP contents and restored persisted state |
| Tooling relocation | Stale exception, effect registry or mutation file path | Architecture bridge fixtures, guideline gate, lint and path existence audit | Only export/logic/get-export-preview.ts can call generators; effect registry matches actual source files |

No new interaction or changed user journey, so no new E2E scenario or three-run verification of changed E2E tests is required. Mutation scripts retain their scenarios with updated paths; mutation suites were not run for this structural refactor. No domain/generator logic or exported geometry changed, so no additional ZMK build was required. Browser evidence remains under ignored playwright-report/ and test-results/.
