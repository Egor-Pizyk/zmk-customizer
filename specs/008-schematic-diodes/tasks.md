# Tasks: Schematic diodes

## Setup
- [x] T001 Write spec and plan in specs/008-schematic-diodes and update docs/roadmap.md.
## User Story 1
- [x] T002 [US1] Write failing invariant and immutability tests in src/domain/toggle-key-diode.test.ts.
- [x] T003 [US1] Implement diode state and operations in src/domain/types.ts, toggle-key-diode.ts, get-key-diode-state.ts.
- [x] T004 [US1] Add pin toggles and symbol in src/ui/schematic/diode-buttons.tsx and diode-symbol.tsx.
## User Story 2
- [x] T005 [US2] Test reversal/current flow in src/domain/find-key-current-flow.test.ts (reversal, move and deletion).
- [x] T006 [US2] Implement reversal and flow queries in src/domain/reverse-key-diode.ts and find-key-current-flow.ts.
- [x] T007 [US2] Add keyboard/table controls in src/ui/schematic/diode-controls.tsx and key-pin-cell.tsx.
## User Story 3
- [x] T008 [US3] Test old-file migration, malformed diode input and round trips in src/storage/diodes.test.ts.
- [x] T009 [US3] Implement v4 schema/migration in src/storage/project-schema.ts and migrate-v3-to-v4.ts.
## Polish
- [x] T010 Add render/interaction coverage in src/ui/schematic/diode-controls.test.tsx (toggle, reversal, undo/redo, disabled state and symbol position).
- [x] T011 Run make check; record outcomes in specs/008-schematic-diodes/tasks.md.

Dependencies: tests precede implementation; US1 before US2; storage before final UI checks. Independent tests: spec stories and quickstart.md. Domain and storage test preparation can run independently. Deliver complete feature, no standalone generator.

## Validation log — 2026-10-12

- Initial tests failed: missing domain operations and unsupported diode schema.
- Spec review: ready to implement; suggested move/delete/undo coverage added.
- make check: passed, 113 files / 713 tests; zero lint warnings/errors; typecheck and formatting passed.
- Browser visual check attempted: in-app browser unavailable; native Chrome reports Computer Use permissions are not granted. No manual visual/VoiceOver pass is claimed.
- [ ] T012 Manual browser inspection of both themes, 200% zoom and dense layouts per specs/008-schematic-diodes/quickstart.md when browser access is available.

## Follow-up correction — 2026-10-12

- [x] D001 Write failing diode lead/polarity and connected-end validation/render regressions.
- [x] D002 Correct symbol lead alignment, geometric free-end validation and end-cap styling without schema or wire routing changes.
- [x] D003 Run focused regressions and make check; record actual evidence.

Follow-up evidence: diode alignment, neutral connected end-cap and free-end-at-key-pin regressions were observed failing before fixes. Focused checks: 17 passed. Final `make check`: 121 files / 748 tests passed, typecheck/lint/format/agent-sync passed; `git diff --check` clean. Existing wire paths and generator golden output remain unchanged. Browser verification remains unavailable due to CUA permissions.

## Corrected series attachment

- [x] D004 Write and observe failing geometry and external-terminal pointer tests before implementation.
- [x] D005 Anchor switch-side lead at physical pin, orient toward the outgoing wire run, share the external terminal across attached wires, and use display coordinates for hover with original coordinates for persisted junctions.
- [x] D006 Add short-elbow regression (observed red before fix), both-polarity/four-direction/multiple-wire/removal tests; run final make check.

Final correction evidence: `make check` passed, 122 files / 757 tests; typecheck, lint, formatter and agent mirrors passed. `git diff --check` clean. Tests verify unchanged persisted project and electrical paths. Automatic elbows shorter than the diode are skipped when choosing its direction, avoiding a wire running back under the body. Manual browser verification remains unavailable due to CUA permissions.

- [x] D007 Regression: external-terminal hit area must have neither fill nor stroke. Observed failing render test before explicitly disabling inherited group stroke on the transparent circle.

D007 verification: `make check` passed, 122 files / 758 tests; `git diff --check` clean. The hit circle explicitly uses fill-none and stroke-none, retaining pointer-events=all.
