# Verification: Matrix Wiring Editor

## Implementation — 2026-10-13

Branch: `013-matrix-wiring-editor`. Specification, accepted single-wiring clarification, research, plan, data model, contracts and 36 ordered tasks were produced through Spec Kit. Quality checklist: 16/16. Initial spec-reviewer findings were resolved; repeat verdict was ready to implement. Required final ZMK reviewer approved after fixes for direct diodes, hidden incompatible terminals and split junction ownership. All T001–T036 tasks are complete. No constitution exceptions, runtime dependencies or extension hooks.

The editor changes actual schematic nets. Matrix/direct, diode direction, per-half assignments, stable GPIO axes, dimensions and automatic assignment use cancellable previews and one atomic history entry on Apply. Grid, table, canvas and Parts share terminal connectivity. Domain validation blocks conflicting/incomplete export; schema v7 migration leaves legacy wire geometry and bindings intact and initializes terminal identities lazily on first editing action.

## Spec Kit analysis result

24 requirement/outcome identifiers (FR-001–FR-018, SC-001–SC-006), 36 tasks. Coverage: 100%; no unmapped implementation tasks or remaining critical/high findings. No constitution exceptions. No new runtime dependencies. Tests-first order and final make check are explicit. Analysis performed read-only after task generation; corrections were applied outside the analysis phase before re-review.

| Requirements | Tasks |
|---|---|
| FR-001/FR-011/FR-012 split ownership/output | T025–T030, T035 |
| FR-002/FR-007 direct/matrix | T007–T011, T020–T024 |
| FR-003/FR-004/FR-005/FR-006 editor/pins/auto | T007–T015 |
| FR-008/FR-009 validation/repair | T016–T019 |
| FR-010 actual wiring | T005–T006, T008, T012–T015 |
| FR-013/FR-014 storage/identity/history | T003–T004, T007–T008, T012–T015 |
| FR-015 explanations/docs | T013, T033 |
| FR-016 buildable matching output | T010–T011, T022, T027–T028, T033–T035 |
| FR-017 real browsers | T015, T019, T024, T030–T034 |
| FR-018 every-preset equivalence | T007–T009 |
| SC-001/SC-002 visible/export validation | T007–T019, T020–T030 |
| SC-003/SC-004 persistence/legacy bytes | T003–T004, T010, T012–T015 |
| SC-005 real builds | T024, T030, T035 |
| SC-006 keyboard/repeat runs | T012–T015, T029, T031, T034 |

## Tests-first evidence

Failing contracts preceded domain/storage/generator changes. Logs under `/tmp/zmk013-*-red.log` record direct-diode and split-junction failures, hidden incompatible terminals, shared GPIO lookup, simultaneous assigned/dropped metadata, imported unsupported pins, resource budgets, no-op identity and dropped-pin provenance during resize. `/tmp/zmk013-half-red.log` reproduced a right-half namespace incorrectly affecting legacy/unibody geometric contacts; only explicit split topology now separates controllers. Intended assertion failures were observed before the fixes. Complete hand-authored golden expectations cover matrix and split matrix in both directions, direct and split direct; existing legacy goldens remain unchanged.

## Scenario coverage

| Scenario | Risk / existing coverage | New real-browser coverage | Visible assertion | Saved / exported assertion |
|---|---|---|---|---|
| Matrix cell and pin edits | Legacy schematic nets / export plumbing already covered | Preview, Cancel, Apply, conflict repair, exact Undo/Redo, JSON round-trip | Both conflicting occupants, repaired cells, enabled/disabled download | Actual shared key-pin net, unchanged preview storage, saved cells and ZIP RC map |
| Missing/unavailable/duplicate GPIO | Controller and domain validation | Missing GPIO → Export problem → collapsed control → repair; imported unavailable selector in real App | Correct field becomes visible and focused; local pin error | Blocked download, repaired ZIP GPIO; domain tests name all conflicting terminals |
| Automatic assignment / polarity | Preset and rotated-center domain contracts | Keyboard key chooser/grid, Auto, Escape/Apply and reload | Grid occupants and preview | Geometry/layers preserved, diode polarity saved, row2col pull-down flags in ZIP |
| Direct scan | Explicit ground and diode-removal domain contracts | Convert through native selector, assign six inputs, Apply/download | GND label and input controls | Saved ground net, no diodes, active-low/pull-up GPIO and RC(0,5) |
| BLE split | Per-half namespaces, unequal dimensions, direct offset domain/goldens | Configure independent halves; move key manually; expand axis; Apply/download/Undo | Half selector and destination cell | Actual moved key cell, unchanged preview storage, offsets 3 then 2, exact two build targets and common keymap |
| Native controls and SVG preview | Existing geometry/corner/paint journeys | Matrix, repair, split and keyboard/auto scenarios in Firefox/WebKit too | Native focus/selection and visible preview/grid | Same actual saved project and ZIP assertions as Chromium |

Domain tests cover permutations, routing refusal/insulation, direct ground, cross-half contradictions, invalid dimensions and controller capacity, stable IDs/pin order and no-op identity. Real App/provider tests cover cancellation, exact Undo, stale-preview invalidation, issue navigation and unavailable imported GPIO; existing App tests cover controller switching and archive plumbing. Production browsers cover the wiring-specific direct/split and downloaded-data contracts.

## Verification commands and results

- Baseline `make check`: PASS, 968 tests. Pre-final `make check`: PASS, 174 files / 1015 tests; architecture, typecheck, lint, formatting and existing coverage floors retained (`/tmp/zmk013-check10.log`). Final `make check` after the standalone probes and provenance repair: **PASS, 174 files / 1016 tests**, all static and coverage gates (`/tmp/zmk013-check-final.log`). `git diff --check` also passed.
- `make test-e2e`: PASS, **84 tests**, complete Chromium plus focused Firefox/WebKit, no retries (`/tmp/zmk013-e2e-final.log`). The command builds the production app. A final complete run after the provenance repair and mutation restoration also passed **84/84** (2.4m; `/tmp/zmk013-e2e-restored.log`). Three sequential final focused runs of `docker compose -f compose.e2e.yaml run --rm e2e npx playwright test tests/e2e/wiring.spec.ts --retries=0` each passed **13/13** (46.0s, 50.8s, 37.8s; `/tmp/zmk013-wiring-repeat-{1,2,3}.log`).
- `make zmk-build`: PASS, **19 actual-export targets** and deliberate invalid-connector rejection (`/tmp/zmk013-build-final.log`). Nine new targets cover unibody matrix both directions, unibody direct, both halves of split matrix both directions and split direct, using actual domain edits and export generation. Pinned ZMK v0.3/Zephyr environment, frozen manifest, per-target `zephyr.dts`, `.config`, UF2/BIN and compiler logs are retained under ignored `.zmk-build/artifacts/` and `.zmk-build/logs/`.
- `make test-e2e-mutations`, run alone after the baseline: PASS, **9/9** expected behavioral failures and exact original production bytes restored (`/tmp/zmk013-mutations.log`, `.e2e-mutations/summary.json`). New seeds independently prove visible actual rewiring, preview storage isolation and downloaded split offset; existing six browser seeds still detect their regressions. Baseline passed 6/6. Per-seed JSON reports, runner logs and failure artifacts are retained in ignored `.e2e-mutations/`.

The Linux 200×200 paint reference changed because the new Wiring header reduces canvas height, moving the clipped background edge. Expected/actual/diff images were inspected: the key art and rotated selection frame geometry were unchanged. Only the Linux reference was updated intentionally; pixel tolerances and geometry assertions were retained. The complete browser run passed the reviewed snapshot and independent geometry cases. Darwin reference was not regenerated in Docker.

## Coverage limits

No physical keyboard, flashing, screen-reader speech or ordinary user browser was exercised. Split uses the selected BLE controller on both halves and the left central role, as specified. Charlieplex is outside this feature. Router refuses circuits it cannot safely route within its deterministic geometry/resource bounds instead of exporting an assignment-only approximation. Browser mutation evidence proves sensitivity to the seeded regressions, not exhaustive absence of bugs.
