# Tasks: Keymap editor acceptance

**Input**: spec.md and plan.md. Requirement coverage is maintained in verification.md.

## Preimplementation gate

- [x] T007 Reconcile specs/014-keymap-editor/{spec,plan,tasks}.md, docs/roadmap.md and specs/README.md; record independent spec-reviewer verdict and analysis before implementation.

## US1 — Preserve presets through the editor

- [x] T001 [US1] [FR-001,FR-002,FR-006] Add tests/e2e/keymap.spec.ts no-edit catalog preset journey: each layer/key inspection and cancellation, exact saved JSON, reopen/reload, actual ZIP keymap copies equal approved independent golden.

- [x] T009 [US1] [FR-002] Reproduce table inspection Escape focus regression in tests/unit/ui/integration/app-bindings.test.ts, then fix src/ui/bindings/interaction/use-bindings-interaction.ts to keep the inspected key active.

## US2 — Discover actions and preserve layer targets

- [x] T002 [US2] [FR-003] Add failing category keyboard-search regression in tests/unit/ui/integration/app-bindings.test.ts; prove no-match before changing production.
- [x] T003 [US2] [FR-003] Implement category matching through src/ui/bindings/picker/logic/filter-picker-groups.ts and src/ui/bindings/picker/components/slot-picker.tsx, preserving prefix/name/alias semantics; add focused logic tests in tests/unit/ui/bindings/picker/logic/filter-picker-groups.test.ts.
- [x] T004 [US2] [FR-003] Add tests/e2e/keymap.spec.ts keyboard name/alias/category discovery, exact chosen saved binding and visible action, Escape and undo recovery across browser engines.
- [x] T005 [US2] [FR-004,FR-005] Verify existing catalog docs and layer domain/validation contracts; extend tests/e2e/keymap.spec.ts reorder → generated indices, delete → every missing-target problem/export blocking, undo → exact project/golden recovery.

## Verification and completion

- [x] T006 Run make check, Docker production build, full make test-e2e and changed browser scenarios three sequential times without retries; record results and limits in specs/014-keymap-editor/verification.md.
- [ ] T008 Complete the applicable manual accessibility pass; record checklist outcomes and unavailable checks (keyboard/focus, screen reader and 200% zoom) in specs/014-keymap-editor/verification.md; do not claim automated checks constitute the manual pass.

## Dependencies

Analysis and independent spec review precede implementation. T002 fails before T003. T001 is independent of T002–T004. T005 follows the shared browser journey setup. Run mutations/checks alone. Parallel examples: read-only reviewer can audit artifacts while existing catalog and layer coverage is inspected; no concurrent production edits are needed. Deliver both US1 and US2 before completion.
