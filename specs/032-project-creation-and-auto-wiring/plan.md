# Implementation Plan: Project creation and automatic wiring

**Branch**: `feature/032-project-creation-and-auto-wiring` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

## Summary

Reuse creation and wiring previews; allocate GPIOs in pure domain only for explicit Auto assign. Replace the global routing origin with per-half rotated bounds and outward endpoint placement. Move the obsolete six-key catalog data into independent test fixtures.

## Relevant context

`docs/{product,principles,workflow,agent-rules,architecture,folder-structure,tooling,domain-model,testing,commands}.md`; `docs/guidelines/git-flow.md`; `docs/guidelines/code-quality/{typescript,control-flow,observability,naming/functions,naming/variables}.md`; `docs/guidelines/frontend/{react,accessibility,admin-ui,tailwind}.md`; `docs/zmk/{README,boards,kscan}.md`; `specs/013-matrix-wiring-editor/contracts/wiring.md`; `specs/031-keyboard-presets/spec.md`; `docs/workflow.md`.

## Technical context

Existing strict TypeScript/React/Tailwind, Docker Node 24, Vitest and isolated Playwright. No dependency or schema changes. Project v11 and existing board catalogs remain authoritative; no new ZMK syntax.

## Scope and preserved contracts

032 only: creation actions, automatic pins, output positioning. No general router rewrite, persistent intermediate contacts, wire selection or compact panels. Retain manual edits and unrelated state, deterministic generation, existing imports and atomic previews/history.

## Constitution check

Before/after design: all eight principles satisfied. Domain owns allocation/geometry, catalog supplies pins, storage remains trust boundary, UI dispatches. Existing generator goldens and real ZMK builds protect output. No runtime networking, dependencies, migrations or exceptions.

## Design and ownership

- `src/ui/shell/components/{project-dialogs,preset-picker}.tsx`: keep picker state local, move three actions into one equal-width vertical grid; common height via grid auto rows; existing Button variants/tokens. Keep native modal and focus restoration. Remove only six-key file action from `src/ui/project/logic/project-file-actions.ts` and its context API.
- Remove `src/catalog/presets/unibody-preset*.ts`, move historical fixture to `tests/helpers/` and update test/build-fixture consumers. Remove `create-preset-project.ts`; tests use the ordinary fixture/project data. Existing historical JSON remains independent compatibility coverage.
- `src/domain/wiring/editing/assign-auto-pins.ts`: receives project, proposed terminals and board. Validate existing non-ground assignments against catalog, dropped-pin state and uniqueness. Reserve encoders per half and manual boardPin endpoints on retained wires. Validate occupied encoder/manual reservations and original terminals before allocating. Return Result; fill only missing pins in stable catalog order. Ground excluded; halves independent. Restrict automatic GPIO filling to `kind: auto`; other edits retain existing behavior.
- `src/domain/wiring/editing/get-output-position.ts`: rotated corners via `@domain/geometry`, per-half bounds, outward row/input sides (left for unibody), top/bottom col/ground by nearest other-half obstruction distance (unbounded sides tie top). Stable terminal index spaces row outputs at 0.5u vertically and column labels at 4.5u horizontally, with connection lanes offset to prevent accidental collinear contacts. Labels use a conservative 4u horizontal/0.5u vertical box; endpoint clearance starts at 1u. Extend outward beyond any intersecting key/label rectangle. Avoid placing outputs on other-half bounds. Advance outward in 0.5u steps, at most 4096 attempts; fail atomically if exhausted. Auto assign replaces nets touching any key pin or managed terminal and retains disconnected manual circuits exactly; the allocator reserves only retained endpoints. Bounded routing attempts retain electrical net proof.
- `route-wiring.ts`: use per-half output positions while retaining overlap/insulation/resource checks and final intended-net verification. Preserve retained manual routes and reserve their GPIOs consistently.
- Amend 013/031 owning contracts with explicit 032 supersession; prior behavior remains historical evidence.

## Verification strategy

Tests first for domain allocation and routing, invalid/duplicate pins, encoder/manual occupancy, direct ground, independent halves, capacity atomicity, rotated endpoint/label clearance and determinism. Use frozen geometry and exact pins as independent expectations. App/E2E creation proves button sizes/order, keyboard cancellation, focus and saved data. Browser auto tests prove preview isolation, Apply/history/reload and JSON/ZIP agreement. Full `make check`, production build, `make test-e2e`, three sequential changed journeys, isolated sensitivity regression, `make zmk-build`. Read-only actual rendered screenshots for UI review; manual screen-reader/OS checks remain explicit limits.

## Supporting artifacts

[research.md](research.md) records repository evidence and UI guidance. [tasks.md](tasks.md) is the sole requirement/task/check/evidence mapping. Existing domain types suffice; no separate data model or duplicate contract.

## Decisions and uncertainty

User accepted refusal of invalid/conflicting pins and manual regrouping on capacity failure. The general row heuristic can exceed board capacity on staggered presets; do not silently regroup. Test Corne/Lily58 automatic assignment at a 1u grouping grid, and separately test atomic capacity refusal for finer grouping. Users can change the grid or explicitly regroup manually. Equal-action layout stacks vertically at all widths. UX searches: keyboard focus modal (visible/unobscured focus), React dialog controlled state (existing local state), Tailwind responsive button group (consistent sizing). No new page/system-wide palette: existing tokens govern. Native 44pt touch sizing advice is inapplicable; retain the project Button default 32px height and use width placement only. Equal grid rows preserve action alignment. Native-only skill recommendations are inapplicable to this web app.

## KLE entry follow-up

FR-009/010 extend existing creation UI on the active fix/pre-major-sweep branch/PR #29; resolver selected 038, whose routing scope does not own this request. Amend 032 and 018 instead. Move KLE rendering to shell/components and its hook to project/logic; preserve storage/domain behavior. Close New after successful Apply, unmount transient state on close, update warning and onboarding target/copy. Remove the complete Layout controls group and its Tools opener while preserving existing shortcuts and Parts geometry fields. Update existing KLE app/browser journeys for native modal boundaries; record rendered review/checks in kle-entry-verification.md. Analysis: no schema/output/dependency change; 018 FR-005 history remains authoritative; 032's three preset action buttons remain unchanged.

User refinement: remove the entire Layout controls group, not only its heading. Delete its three private renderers and the Tools opener. Preserve unchanged shortcut handlers (Delete/Backspace, Copy/Paste, nudging), Parts per-key fields and pointer rotation. Retire browser/app scenarios specific to the removed batch-preview/buttons; preserve independent domain operation tests and table/pointer/clipboard/history journeys. KLE discovery highlights New itself through its existing kle target.
