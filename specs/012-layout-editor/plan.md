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

## Follow-up architecture

Keep the current branch/spec number. Add pure resize-key-from-pointer and rotate-key-from-pointer operations, both using the immutable gesture base and setKeyGeometries (crossings pruned once). Resize inverse-rotates pointer deltas, clamps/snaps positive dimensions and adjusts local x/y at moving top/left edges; the old absolute origin remains fixed. Rotation uses atan2 delta around visible center and rebases geometry around that center without a visual jump; same-angle/no-motion returns original identity.

Add screen-space selection frames/handles above existing drawing, with per-key oriented frames and pixel-sized hit targets. DOM attributes describe resize/rotate intent; a separate pointer adapter intercepts these targets before the existing pointer handler, captures the SVG pointer, maintains transient base/position and commits only on release. Preview invalidates if saved project, selection or tool changes. Reuse existing Escape path and project analysis, no new effects/providers/dependencies. Numeric selected controls auto-preview; precise fields are collapsed behind native details. No schema/generator changes, output goldens remain unchanged.

Follow-up review resolution: resize/rotate previews may overlap but commit refuses final overlaps through the existing pure polygon query. Rotation output uses equivalent angles in −180°…180°, with optional 15° Shift snap. FR-004 is numeric/batch-only; pointer anchors are governed by FR-014.

## Standard-size follow-up plan (2026-10-21)

Relevant context: docs/{architecture,folder-structure,domain-model,tooling,testing,commands}.md; frontend React/accessibility/admin-ui/Tailwind and TypeScript/control-flow/naming rules; 004 contracts/ui.md; contracts/layout.md. Current owner modules: domain/keys, domain/geometry, catalog/keycaps (new focused module), bindings interaction/rendering/components. No storage schema, generator syntax or dependency changes.

UI/UX skill: searches `context menu keyboard focus` (ux), `selection controlled input` (React), `menu overflow focus` (html-tailwind). Apply visible/unobscured focus, labeled native controls, existing tokens and bounded scrolling. Reuse Dialog with explicit buttons and pressed/current state rather than invent ARIA menu navigation; this is a contextual size chooser. New-page design-system generation and native mobile guidance are inapplicable. Preserve repository desktop control density rather than adopting generic 44px mobile targets.

Catalog supplies finite rectangular options; pure setKeycapSize receives catalog choices as arguments and resolves the chosen ID, delegating geometry/crossing preservation to setKeyGeometries. Recenter x/y by half the size delta in unrotated coordinates, retaining angle/origin; the transformed center and switch pins then stay fixed. Imported custom dimensions are not validated against the catalog. Domain tests precede implementation. UI state captures base/targets/opener; use existing project commit and announcement. Native dialog owns focus trap/Escape; explicitly restore the canvas opener for pointer context invocation. Table and canvas share target semantics. Do not add handles/numeric paths to Bindings, which is currently selection-only.

Test domain centers/pins, immutable references, catalog rejection/no-op, multiple keys and legacy geometry. E2E real context click and Shift+F10/table, rotated screen corners, actual persistence/download/export, exact history, custom/cancel/overlap and theme/reflow; focused cross-browser coverage for SVG focus/native dialog. Run changed checks, controlled regression separately, rendered post-skill review; manual OS/screen-reader acceptance remains a draft-delivery gate. Traceability and results live in standard-keycap-verification.md.

## Switch sizing correction

FR-021: remove resize target rendering and width/height fields/columns from Schematic; retain existing domain geometry operations, schema, generators and Bindings chooser. No data coercion or migration. UI/UX pre-review: labeled remaining native fields and stable keys (local ux `conditional form controls` / React `conditional rendering controls` searches). Keep existing tokens, compact layout, focus order, themes and responsive wrapping. No new page, animation or mobile platform controls. Update obsolete Schematic resize journeys to assert rotation, preview/history and size editing through Bindings; domain resize tests stay. Consistency: this amendment explicitly supersedes the earlier UI contract; historical verification applies only to its original revision. Evidence: [switch sizing journal](switch-sizing-verification.md).

CI follow-up: the FR-015 cancellation/history browser journey holds Shift for exact 90° rotation assertions. Native free-pointer coordinates round differently by engine; no production behavior or tolerance changes. Verification remains in switch-sizing-verification.md.

## Numeric rotation amendment (036 item 19)

036 FR-034 supersedes implicit common-origin numeric angle editing. editLayout calculates each current visible center before changing its angle, preserving position/dimensions and applying only requested translation; explicit origin patches retain legacy absolute-origin semantics. Keys-table angle and encoder linked-key angle reuse this pure operation. setKeyGeometries remains a low-level absolute patch for pointer/import/origin consumers. Current evidence/tasks: [036 journal](../036-ui-ux-remediation/verification.md), B019.
