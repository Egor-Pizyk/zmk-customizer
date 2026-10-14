# Principles

1. **Correct output over features.** A generated file that does not build is worse than a missing feature. Every generator change comes with a golden-file test.
2. **Domain first.** Rules live in `src/domain/` as pure functions with tests. UI only displays and dispatches.
3. **Static only.** No backend, no runtime network calls. The app works offline after load.
4. **User data is untrusted.** Imported JSON and `localStorage` are parsed with a schema; failure shows a readable error and never corrupts the current project.
5. **Every ZMK option explains itself.** Short description + link to the ZMK docs section.
6. **Minimal code.** No abstractions for a single use, no config for values that never change, no speculative folders or helpers. Delete before adding.
7. **Deterministic.** No `Math.random`, `Date.now` or iteration over unordered data in generators.
8. **Accessible.** Every control is keyboard reachable and labeled; the canvas has a non-canvas alternative (table/list) for key properties.
