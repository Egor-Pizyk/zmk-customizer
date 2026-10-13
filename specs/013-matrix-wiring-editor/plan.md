# Implementation Plan: Matrix Wiring Editor

**Branch**: `013-matrix-wiring-editor` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification and accepted single-wiring clarification.

## Summary

Add a wiring editor in Schematic that edits actual connections, with grid/table views, stable ordered buses, matrix/direct scanning and BLE split halves. Connectivity remains derived from wires. Bus ordering and controller terminals give rows/columns stable identities without storing a second independent per-key cell map. Preview rewiring, validate its actual nets, then commit one Project change. Preserve byte-identical legacy exports during migration.

## Technical Context

**Language/Version**: TypeScript 7 strict; Node 24 in Docker.

**Primary Dependencies**: Existing React 19, zod, fflate; no new dependencies.

**Storage**: Serializable Project v7, localStorage and versioned JSON; v6→v7 migration.

**Testing**: Vitest domain/storage/real App and generator goldens; isolated Playwright production browser; pinned actual-export ZMK builds.

**Target Platform**: Static offline-capable web app, desktop keyboard and pointer controls.

**Project Type**: Existing browser application.

**Performance Goals**: Retain existing imported-project budgets (512 keys, 600 wires, 3000 segments, 8192 crossing references). No unbounded routing search. Test representative 100-key operation; measure rather than promise unsupported large-layout routing latency.

**Constraints**: ZMK v0.3 only; existing architecture/checks/coverage floors; no CUA or ordinary browser profile; two halves use same selected BLE-capable board and scan type.

**Scale/Scope**: Four user stories, one workspace/editor, migration, electrical operations and direct/split generators. No encoders, charlieplex, custom boards, firmware settings, mixed scanning or wired split.

## Constitution Check

Pre-research and post-design gates pass on the proposed design:

1. Correct output: independent goldens, unchanged upstream fixtures, DIFFERENCES notes and real direct/both-direction/split builds required.
2. Domain first: routing, auto-assignment, topology and pin validation in pure domain functions; UI only drafts/displays/dispatches.
3. Static only: no runtime networking or new service.
4. Untrusted data: bounded zod schema and incremental migration; invalid topology may load with issues, malformed references may not.
5. Options explain themselves: typed kscan/topology/direction catalog entries link to v0.3 anchors.
6. Minimal code: extend existing nets/contacts/generators; create only files needed by tasks. No router framework or configurable strategies.
7. Determinism: stable bus order and key identity; fixed rounding and deterministic paths/IDs. Migration preserves current valid output.
8. Accessible: native labeled controls and full table path, preview Apply/Cancel, linked problems, focus handling.

No constitution exceptions or dependency ADR are needed.

## Phase 0: Research

[research.md](research.md) records a read-only research-agent inspection of existing connectivity, inference and routing. The main risk is accidental electrical contact in generated paths. T005–T006 prove routing against the actual existing net engine before UI integration. User clarification chose actual rewiring over an export-only assignment model.

## Phase 1: Design

[data-model.md](data-model.md) defines Project v7 and stable terminal identity. [contracts/wiring.md](contracts/wiring.md) defines preview, topology, auto-assignment, export and interaction contracts. [quickstart.md](quickstart.md) defines executable validation.

### Electrical representation

An ordered terminal list per half stores row/column or input bus identities and GPIO assignments. Wire free ends may reference one terminal ID. A terminal denotes one electrical controller contact; all branches referencing it are connected. Legacy boardPin endpoints are converted to terminal references only when existing matrix derivation succeeds, preserving every wire path and inferred ordering. Incomplete legacy projects retain their current unassigned/boardPin endpoints and can initialize ordered buses through an explicit editor operation.

The derived cell of a key is the indices of the row and column terminals in its two actual nets. Missing, ambiguous, duplicate or cross-half membership is an issue. Terminals do not supply key membership independently of wires. GPIO edits change the controller terminal of the real net and cannot renumber an axis.

Direct mode has ground terminals per half and ordered input terminals. Ground is not a GPIO and is never included in GPIO uniqueness checks. Split connectivity is physically separate: geometric crossings between different-half wires do not join; explicit cross-half connections are reported. Parts pin editing and manual wire editing must use the same terminal model.

### Connection changes

Pure operations construct a preview Project. Reroute affected nets and dependent junction branches, preserve unaffected wires/insulation, use explicit terminal endpoints and junctions, avoid cross-bus collinear overlaps, and insulate generated cross-bus interior crossings. Verify exact intended key-pin membership with getNets before offering Apply. A route that exceeds resource limits or cannot preserve independent buses produces an actionable failure without changing the current project. Changes in project/selection invalidate a stale preview; no-op operations preserve Redo.

Changing direction preserves row/column ordering and reverses affected matrix diodes only in the displayed preview. Switching scan type previews replaced affected circuitry: direct uses pin 1 as input, pin 2 as ground and removes series diodes; matrix uses pin 1 as row and pin 2 as column for newly generated wiring and adds correctly oriented diodes. Existing legacy orientation is retained until rewiring. Returning from direct to matrix derives fresh cells without restoring stale hidden assignments.

### Automatic assignment

Use visible key centers after rotation. Half boundary is the midpoint between minimum/maximum centers on x; ties go left. Within each half, sort by center y then x then original key order; group rows by existing shared grid step supplied as an operation argument, quantizing centers to that step. Within each row sort x and assign contiguous columns. Explain this starting-point heuristic in the editor; it is manually editable. Keep imported legacy cells unchanged unless auto-assignment is explicitly requested. For each available preset, prove exact cells or a documented consistent row/column permutation preserving electrical key-to-pin pairs. If general geometry ranking cannot reproduce a preset by that permutation, retain its known assignments for the preset rather than claiming false equivalence.

### Export

Build a validated scan contract in domain, consumed by generators. Retain existing legacy unibody matrix text. Direct produces input GPIOs with active-low/pull-up flags and RC(0,i). Split shared dtsi contains complete physical layout/transform; per-half overlays supply local row/column/input lists, with right col-offset equal to left column/input count. Global rows = maximum half row count; columns = sum half column/input counts; limits are checked before generation. Shared keymap follows project.keys, irrespective of half. Generate central-only name/role and shared split defaults; repository build.yaml has exactly two corresponding targets. User conf stays config/<name>.conf, not an unapplied shared shield-folder conf.

ZMK sources: docs/zmk/kscan.md (drivers, GPIO flags), matrix-transform.md (addressing/offset/limits), shield-files.md (Kconfig/overlays/keymap/conf resolution), physical-layout.md (chosen/key order), boards.md (v0.3 IDs/connector pins). Upstream corne is a structure reference, never edited.

## Project Structure

### Documentation

specs/013-matrix-wiring-editor contains spec.md, plan.md, research.md, data-model.md, contracts/wiring.md, quickstart.md, tasks.md, checklists/requirements.md and verification.md (evidence populated during implementation).

### Source Code

- src/domain/types.ts, get-nets.ts, find-wire-contacts.ts and validation/edit operations: terminal/half connectivity and stable scan derivation.
- src/domain/derive-wiring.ts, route-wiring.ts, edit-wiring.ts, auto-assign-cells.ts: one exported operation/concept per file, tests adjacent.
- src/storage/project-schema.ts, migrate-v6-to-v7.ts and migration chain: parse bounded v7, preserve old projects.
- src/catalog/wiring-options.ts: user-facing ZMK choices and exact docs links.
- src/ui/schematic/wiring-controls.tsx, wiring-grid.tsx, wiring-table.tsx, use-wiring-preview.ts: shared preview and native edits composed into existing workspace.
- src/ui/export/get-export-preview.ts: sole UI generator-call boundary.
- src/generators existing overlay/Kconfig/repository generators plus direct/split rendering files only as needed.
- tests/fixtures/wiring/: manually specified project/golden fixtures and DIFFERENCES.md, without editing upstream/.
- tests/e2e/wiring.spec.ts (including tagged cross-browser cases): actual visible/saved/downloaded behavior.
- scripts/generate-build-fixtures.mjs and scripts/check-e2e-mutations.py: actual-export targets and controlled browser regressions.

**Structure Decision**: Keep existing layers/import rules; no new feature framework, dependencies or backend.

## Implementation Phases

1. Lock legacy compatibility and v7 terminal trust-boundary contracts.
2. Prove actual-net routing, stable axes and matrix editing; wire grid/table/preview/export.
3. Cover conflict repair and direct scanning.
4. Add BLE split ownership, routing and output.
5. Run independent review, all gates, complete Chromium suite, targeted Firefox/WebKit, three sequential new-test runs, standalone sensitivity probes and actual-export firmware builds. Record evidence and remaining limits.

## Complexity Tracking

No exceptions. Stable bus identity and explicit ground/half ownership are required by real electrical editing and cannot be inferred from GPIO ordering alone.
