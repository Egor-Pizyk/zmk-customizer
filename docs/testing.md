# Behavioral regression testing

This is maintenance of features 001–011. Layout editor 012 remains deferred.

## Contracts and test boundaries

Tests assert what the product must do, independently of its implementation. Inputs
come from requirement examples, historical project fixtures and pinned upstream
ZMK output. Expectations must not be computed by the function being tested.

| Contract | Protection |
|---|---|
| Every edit preserves unrelated keys, layers and wiring | Pure domain tests, frozen-input edit sequences, exact undo/redo and JSON round trips |
| Key identity survives deletion, multi-selection and layer reorder | Multi-key/multi-layer lifecycle tests and rendered app flows |
| Electrical connections survive matrix derivation | 12 matrix dimensions; reconstruct pin pairs from output; unique cells, polarity reversal and wire-order invariance |
| Old or malformed user data cannot corrupt a current project | v1–v5 fixture migration tests, schema rejection, import/storage tests and rendered upload/retry |
| Controller families retain or drop the correct contacts | Four-controller catalog/golden checks, rendered selection, endpoint repair and exact undo |
| Binding editors change the intended layer and keys | Real Action panel search, modifiers, multi-paste, dangling copied targets, tap-dance and mod-morph tests |
| Project edits appear and persist | Real App + providers + StrictMode, labeled controls, screen results and independently loaded saved JSON |
| Canvas gestures are undoable and keyboard alternatives work | Drag preview/commit/cancel, snap/overlap, multi-drag/delete, focus/nudge, selection and pan/zoom |
| Invalid projects cannot export | Rendered validation, disabled action, hidden stale preview, linked problem navigation and recovery |
| Exported bytes match preview and upstream contract | Independent golden fixtures; real ZIP click → unzip → path/content comparison; copy/download bytes and URL cleanup |
| Async failures can be retried safely | Real-hook ZIP lock/failure/retry, clipboard rejection and malformed-file retry |
| App settings do not change project data | Theme/grid validation/reset and physical-key shortcut precedence tests |

Query controls by role and accessible name; use visible button text where jsdom
cannot account for CSS-hidden tooltip text. Avoid class names, internal React
elements, hook call counts and whole-page snapshots. SVG geometry assertions are
limited to externally visible placement/polarity contracts. Golden text assertions
remain intentional: emitted Devicetree/Kconfig bytes are a product output.

Mock OS/browser boundaries only: file reads, downloads, clipboard denial and ZIP
failure injection. React, its hooks, providers, domain functions and generators run
normally. jsdom shims model missing native APIs, not business behavior.

## Cleanup performed

- Removed the schema/Project `expectTypeOf` test; the compiler owns type checking.
- Replaced mocked `Field`/`Button` callback capture and static Export HTML checks
  with rendered application actions and persisted/exported outcomes.
- Replaced React `useState`/`useRef` mocks in picker/export hook tests with real hooks.
- Replaced the mocked copied-layer test with the complete copy/delete/add/paste UI flow.
- Removed exact Tailwind class checks for endpoint markers and diode hit circles.
- Kept data validation tests, catalog documentation/version/pin constraints and
  deterministic/golden exports: these are runtime/product requirements, not lint.

## Commands and regression floors

`make check` runs typecheck, lint, formatting and the full suite **with V8 coverage**,
just like CI. `docker compose run --rm app npm run test -- <file>` runs focused tests.
`coverage/index.html` is the generated local report; it is not committed.

Coverage includes executable domain, generators, storage, UI and catalog lookup/
key-header parsing. Static catalog tables, the composition root and type declarations
are not useful coverage targets; their runtime contracts are tested through consumers.
`vite.config.ts` defines both global and layer-specific floors. Do not lower floors
or exclude executable files merely to make checks pass. Missing branches guide new
behavioral scenarios; a percentage alone is not evidence of assertion quality.

`make test-mutations` runs ten seeded business regressions and requires a failing
behavioral test for each. Run it **alone**: it temporarily changes production files,
restores their exact original bytes including uncommitted work, and refuses to
overwrite a concurrently changed file. It detects changes in controller retention,
key deletion, undo/redo, layer indices in generated keymaps, export validation,
controller/diode UI handlers and explicit shield naming. Update mutation anchors
after a refactor; they are test-quality probes, not product contracts.

## Verified result

The final `make check` passed: 138 files, 859 tests, including coverage floors.
Production build passed. The seeded mutation run detected 10/10 regressions.

| Coverage | Result |
|---|---:|
| Lines | 88.42% |
| Statements | 88.40% |
| Functions | 89.82% |
| Branches | 81.43% |

## Limits

These tests verify semantic DOM, displayed text/state, event wiring, SVG geometry,
persistence and output bytes. jsdom has no layout/paint engine: tests do not prove
pixel appearance, responsive clipping, contrast, native modal focus trapping or
screen-reader behavior. They do not compile firmware. Ten seeded mutations are
not an exhaustive mutation score, and no finite suite guarantees detecting every bug.
Remaining untested branches stay visible in the coverage report.

## References

- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/)
- [user-event interaction model](https://testing-library.com/docs/user-event/intro/)
- [Vitest coverage and thresholds](https://vitest.dev/config/coverage)
- [ADR 0012](decisions/0012-behavior-testing.md)
