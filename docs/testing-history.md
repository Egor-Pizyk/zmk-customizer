# Historical testing evidence

Archived from docs/testing.md on 2026-10-15. These results describe earlier work, not the current tree. Current policy is in [testing.md](testing.md).

## Cleanup performed

- Removed the schema/Project `expectTypeOf` test; the compiler owns type checking.
- Replaced mocked `Field`/`Button` callback capture and static Export HTML checks
  with rendered application actions and persisted/exported outcomes.
- Replaced React `useState`/`useRef` mocks in picker/export hook tests with real hooks.
- Replaced the mocked copied-layer test with the complete copy/delete/add/paste UI flow.
- Removed exact Tailwind class checks for endpoint markers and diode hit circles.
- Kept data validation tests, catalog documentation/version/pin constraints and
  deterministic/golden exports: these are runtime/product requirements, not lint.


## Verified result

The final `make check` passed: 138 files, 859 tests, including coverage floors.
Production build passed. The seeded mutation run detected 10/10 regressions.

| Coverage | Result |
|---|---:|
| Lines | 88.42% |
| Statements | 88.40% |
| Functions | 89.82% |
| Branches | 81.43% |


## Mutation runner migration

Migration parity was demonstrated with Node first, then unchanged Python originals: all 29 Vitest and nine browser seeds matched failed-test identities, counts, process results and browser summary. Source SHA-256 manifests matched before/after all four runs. See [migration verification](../specs/030-node-mutation-runners/verification.md). Tooling contracts for restoration, concurrent edits, missing/duplicate anchors, timeout and report acceptance run through npm run check:mutation-runners in make check.
