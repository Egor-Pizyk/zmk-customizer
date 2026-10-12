# Implementation Plan: Controller boards

**Branch**: `011-controller-boards` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

## Summary

Add a verified four-board catalog, schema v5 controller selection and connector-index assignments. Board switches preserve pins only within a connector family; other assignments retain a previous label and become actionable issues. Existing schematic controls and history handle editing. Export uses the selected board and connector. Migrate raw nice!nano v1–v4 input using the verified port-0 mapping.

## Technical Context

**Language/Version**: TypeScript 7, strict; Node 24 in Docker.
**Primary Dependencies**: Existing React 19, zod, fflate and Tailwind v4; no additions.
**Storage**: Existing localStorage/JSON trust boundary; schema v5.
**Testing**: Vitest, tests first for domain/generators; catalog verification and golden outputs for four boards; interaction tests.
**Target Platform**: Static browser application, offline after load.
**Project Type**: Web app, no backend.
**Performance Goals**: Synchronous four-board/18-pin selection; no async work or networking added.
**Constraints**: No CUA/browser control; terminal and automated tests only. ZMK v0.3. One controller, matrix kscan unchanged.
**Scale/Scope**: Four controllers, two connectors, existing project/history/exports.

## Constitution Check

Pre-research and post-design PASS: I golden files for changed generators; II pure changeController/validateControllerPins functions, catalog passed as arguments; III no runtime network; IV schema/migration in storage and malformed input tests; V descriptions/docs per controller; VI no dependencies/extra abstractions; VII stable output and sorted pins; VIII native labeled controls, existing table alternative and issue focus. No constitution amendment or violation.

## Project Structure

Documentation: spec.md, research.md, data-model.md, contracts/controller.md, quickstart.md, tasks.md, validation.md in specs/011-controller-boards.

Source changes:
- src/catalog/controller-boards.ts and controller-boards.test.ts: typed board entries/maps; get-controller-board.ts lookup for validated project id.
- src/domain/types.ts: ControllerBoard descriptor (id, family, connector, pins, labels, reserved contacts, docs); Project.controllerId, v5, droppedBoardPin on free endpoints.
- src/domain/change-controller.ts and test: family-aware assignment preservation/drop.
- src/domain/validate-controller-bindings.ts and test: reject bt/OUT_BLE on USB-only controllers without changing saved bindings.
- src/domain/validate-controller-pins.ts and test: endpoint-specific unavailable/drop issues; integrated in validateShieldProject.
- src/domain/set-wire-end-board-pin.ts: assignment/clear removes drop metadata.
- src/storage/migrate-v4-to-v5.ts and test: typed legacy trust-boundary conversion, catalog maps as source; schema update and migration chain.
- src/generators/generate-overlay.ts: connector label argument; generate-shield-files.ts passes connector; generate-repository-files.ts consumes board connector and id.
- src/ui/schematic/controller-panel.tsx and test: native board select, descriptions/docs/reserved contacts, history feedback.
- src/ui/schematic/board-pin-select.tsx: available board pins, MCU labels, field error text; canvas/Bindings labels use D indices.
- src/ui/project-state.ts and src/ui/export/get-export-preview.ts: derive selected target from catalog.
- Existing factory, preset, current-schema tests updated to v5; legacy fixtures remain unchanged.
- tests/fixtures/generated/controllers/<board>/ contains independently authored expected overlay/build.yaml; rest of repository inherits unchanged full repository golden fixture.

**Structure Decision**: Existing one-way dependency layers, domain types describe catalog shape, no domain imports from catalog. Schema validates id against catalog enum at trust boundary. Lookup of schema-validated ids is total; no fallback for invalid ids. Existing SHIELD_TARGET keeps pinned release/workflow metadata and default connector pins for legacy test consumers; production selects actual controller.

## Phases

0. Verify pinned maps and source evidence in research.md.
1. Define migration/data/controls/export contracts and quickstart.
2. Generate story-ordered tests-first tasks; analyze and run spec-reviewer before implementation.
3. Implement tasks; zmk-reviewer verifies maps/output, format, make check and production build.
