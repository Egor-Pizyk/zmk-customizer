# Implementation Plan: Layout editor

**Branch**: `012-layout-editor` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

## Summary

Extend existing Schematic operations with optional geometry fields, a shared pure geometry model, batch operations, accessible table/tool controls and physical-layout export. Existing creation, selection, drag preview/cancel, wiring, analysis and history stay the integration points.

## Technical Context

**Language/Version**: TypeScript 7 strict, React 19, Node 24 in Docker.
**Primary Dependencies**: Existing React/react-dom, zod, fflate; no additions.
**Storage**: Project schema v6, localStorage and JSON; v5→v6 migration and existing chain.
**Testing**: Vitest behavioral domain/storage/golden/UI tests with real providers; coverage gates; separate mutations; actual ZMK compilation.
**Target Platform**: Offline static desktop browser; no CUA or browser automation.
**Project Type**: Static web app.
**Performance Goals**: Remain within existing 512-key/600-wire budgets; geometry O(n²) overlap as before, bounded convex polygons, no new analysis pipeline.
**Constraints**: Exact IDs, no-op identity, one commit per operation, drafts not persisted, imports session-protected, deterministic output.
**Scale/Scope**: Layout only; no split/KLE/new wiring or firmware features.

## Constitution Check

Pre-research and post-design: PASS. Domain geometry and operations pure, golden precedes output change, migration keeps old geometry, no dependency additions, offline runtime, all controls labeled and keyboard reachable. No violations or complexity exceptions. Verification gates: architecture/guidelines/type/lint/format/coverage via make check, production build, ZMK v0.3 actual exports, mutations run alone. Manual paint/screen-reader checks cannot be performed under the user's terminal-only constraint and must be documented as unverified.

## Project Structure

Feature artifacts: spec.md, research.md, data-model.md, contracts/layout.md, quickstart.md, tasks.md, analysis.md, verification.md.

- `src/domain/get-key-geometry.ts`, `rotate-point.ts`, `get-key-corners.ts`, `get-key-center.ts`, `do-polygons-overlap.ts`: one pure concept per file, reused by collision, layout centering, navigation, marquee and rendering.
- `src/domain/set-key-geometries.ts`: batch patch with effective-value equality/no-op, crossing pruning once; `move-keys.ts` translates origin consistently.
- `src/domain/duplicate-keys.ts`, `renumber-keys.ts`, `remove-keys.ts`: deterministic ID-safe operations; creation/duplication cap passed as argument from PROJECT_BUDGET.
- `src/domain/validate-key-geometry.ts`: domain validation of all seven cells integrated into single analysis; `validate-shield-project.ts` uses it instead of x/y-only validation.
- `src/storage/migrate-v5-to-v6.ts`, schema/version changes: optional new geometry fields with explicit default semantics, strict finite fields; negative/zero/out-of-range finite geometry loads and is reported by domain validation for repair.
- `src/ui/schematic/`: extend Keys table, selected-layout controls and existing focus/shortcuts/drag geometry; keep draft state local; selected IDs derive from workspace selection. Batch controls offer preview/apply/cancel; table fields commit individually on Enter/blur.
- `src/ui/canvas/`: shared SVG transform formatting and polygon marquee/navigation; workspace rendering shares domain geometry without cross-feature imports.
- `src/ui/bindings/keycap-shape.tsx`: width/height and rotation, readable centered legends and existing click target.
- `src/generators/generate-overlay.ts`: seven geometry cells, Math.round(value*100), negative parentheses, key array order. Source: docs/zmk/physical-layout.md; no new DT nodes/settings.
- `tests/fixtures/generated/layout/`: independently specified golden output and DIFFERENCES.md.
- `scripts/generate-build-fixtures.mjs`: retain eight board/direction builds plus exported nonstandard geometry case.

## Implementation Strategy

Test migration and geometry contracts first, observe red, implement pure geometry. Test batch mutation and identity contracts before operations. UI tests drive accessible controls and history/persistence, extend existing pointer work without replacing it. Independently write physical-layout golden before modifying generator. Review spec before implementation, ZMK output before commit. Finish gates and record exact results.
