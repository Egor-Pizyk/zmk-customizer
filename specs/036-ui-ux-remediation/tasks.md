# Tasks — item 1

- [x] E001 [FR-001–006] Specify approved button/contact model and pre-UI guidance in spec.md/plan.md.
- [x] E002 [FR-001–003] Tests first, pure placement/association/geometry/wire-net operations and validation in src/domain and tests/unit/domain.
- [x] E003 [P] [FR-004] Tests first, schema 13 migration and ownership/endpoint parser in src/storage and tests/unit/storage.
- [x] E004 [P] [FR-001, FR-005] Tests first, encoder tool/rendering/editor and pointer/keyboard alternatives in src/ui/schematic and tests/unit/ui.
- [x] E005 [FR-006] Wire-derived generator golden/no-encoder compatibility and actual exported build validation in tests/unit/generators and existing build fixtures.
- [x] E006 [FR-001–006] Real browser lifecycle/download/geometry/connection cases, sensitive behavioral regression and rendered pre/post skill review; record verification.md.
- [ ] E007 Verify changed checks, review diff, make one item-1 commit, deliver manual checklist and stop. No subsequent item until user approval.
- [ ] E008 User manual keyboard/speech/native zoom and physical wiring review; record supplied results only.
- [x] E009 [FR-008] Show and drag handles for every saved or derived right-angle wire corner; verify the rendered and persisted result, commit separately, and stop for manual acceptance.

Dependencies: E001→E002/E003/E004→E005→E006→E007. Storage and presentation groups may run as parallel agent work under the implementation skill; shared types and nets have one owner. E008 is manual, not inferred from automated tests. Traceability is this task mapping with exact checks in verification.md.

- [x] E010 [FR-008] Deduplicate coincident corner handles across saved/derived points and wires; reproduce rendering regression, fix and verify separately.

- [x] E011 [FR-008] Remove redundant collinear handles, retain one handle on a straight wire and preserve actual turns; red/green rendering tests and browser regression checks.
