# Test business risks

Test electrical correctness, edits across related entities, protected connections, history, persistence/migrations, import races, validation and actual generated/downloaded bytes. UI/tooling tests are useful when they protect those outcomes, critical keyboard access or a concrete regression.

Skip trivial getters/setters, pass-through wrappers, literal tables/order, exact copy, font sizes, CSS classes and arithmetic already exercised by a meaningful flow. A short function needs a separate test only for a specific invariant, boundary or regression. Reuse existing scenarios instead of testing the same rule at every layer.

## Fast local loop

1. Read the affected code and nearest meaningful tests. Implement directly; no spec, matrix, journal or mandatory test-first ritual.
2. Run the named file/case or related tests immediately. Use watch mode while iterating. No prior full-suite failure is required for a focused run.
3. Lint/format the edited files; typecheck after a coherent typed/module change. Run architecture checks when imports, public APIs or layer boundaries change.
4. For a native browser bug, run the relevant Playwright file/case in Chromium. Add Firefox/WebKit only for an engine-sensitive risk. A broad UI feature may need several journeys; a small fix does not need the complete browser suite.
5. Stop when the relevant behavior is verified. Broaden for shared setup/schema/import changes, actual failures or unresolved risk. Full units/coverage, browser matrices and mutation suites remain in CI and are available explicitly.

Documentation-only changes need link/instruction checks. No mandatory screenshots, before/after review, manual accessibility audit, behavioral mutation probe or firmware build for unrelated changes. When generator/ZMK syntax changes, verify against pinned independent golden fixtures and run the relevant firmware build when needed to establish correctness.

Commands: [commands.md](commands.md). Report the checks actually run and any material limit in the reply/PR; do not create evidence documents for routine work.

## Test boundaries

- Derive expected results independently from user requirements, domain invariants, historical files or verified pinned ZMK sources. Do not copy the implementation's answer or update goldens just to get green.
- Domain/storage/generator tests protect state, boundaries and output bytes. Keep old-file fixtures for migrations and independent golden output for ZMK syntax.
- Query rendered controls by accessible role/name. Assert visible effects, saved Project or actual downloaded bytes when relevant; avoid internal hook calls, class names and whole-page snapshots.
- Mock browser/OS boundaries and failure injection only; do not mock React state, domain or generators. jsdom shims model missing browser APIs.
- Native pointer/geometry/focus bugs need an isolated production-browser test using real gestures. No force clicks, synthetic handler calls, state edits through evaluate or arbitrary sleeps. Observe DOM/geometry through evaluate only.
- Keep representative viewport/theme/engine cases only for a concrete rendering or compatibility risk. A full combination matrix is not a default requirement.

## Coverage

`vite.config.ts` measures domain, generators, storage and catalog parsing/lookups. Aggregate floors: 75% lines/statements, 70% functions, 65% branches. No per-file/per-layer/UI quota. Coverage is a coarse alarm, not a reason to test every line; change scope/floors deliberately with a business rationale. CI keeps reports and final-revision status checks.

## Mutation and performance tools

Mutation runners temporarily edit production files: run alone, restore exact original bytes and refuse concurrent edits. They are deliberate regression-quality diagnostics, not a task gate. Performance checks may overlap independent work; isolate a rerun only when diagnosing contention. Existing metrics/thresholds remain.

## Limits

jsdom does not prove paint/layout, native modal focus trapping, screen-reader speech or firmware compilation. Browser tests do not prove physical keyboard firmware behavior. Passing counts/coverage alone do not establish absence of bugs.
