# Implementation Plan: Shield generators

**Branch**: `009-shield-generators` | **Date**: 2026-10-12 | **Spec**: [spec.md](spec.md)

## Summary

Derive a validated matrix from schemaVersion 4 schematic nets, emit five pure deterministic shield files, and expose a read-only Export preview plus a bundled complete preset through New.

## Technical Context

**Language/Version**: strict TypeScript 7, Node 24 in Docker.
**Primary Dependencies**: existing React 19, zod, Vite, Tailwind v4; no additions.
**Storage**: existing JSON/localStorage; no persisted changes and no migration.
**Testing**: colocated Vitest unit tests, independent approved golden files, server-rendered UI checks and existing interaction harness.
**Target Platform**: static offline browser app; firmware syntax targets ZMK v0.3.0 / nice_nano_v2.
**Project Type**: static web application.
**Performance Goals**: derive on project changes, reuse existing connectivity; no connectivity calls per binding/file.
**Constraints**: no runtime network/I/O in domain/generators; preserve keys and layers order.
**Scale/Scope**: one unibody matrix, up to 12 exposed GPIOs, current 32-layer maximum; five preview files.

## Constitution Check

Pre-research and post-design gates PASS: domain rules are pure, catalog facts passed into domain; no runtime dependencies or schema edits; golden tests precede generators; no network; issues use existing paths/panel; native buttons/details/pre permit keyboard use; deterministic numeric ordering and first-use behavior definitions. All eight principles apply. Required final gate is make check; firmware compilation is explicitly not claimed.

## Project Structure

Documentation: spec.md, plan.md, research.md, data-model.md, contracts/generation.md, quickstart.md, tasks.md, checklists/requirements.md.

- `src/domain/derive-shield-matrix.ts`: Result of matrix derivation, bipolar graph coloring, diode agreement and electrical errors. Reuses getNets/findKeyCurrentFlow. Catalog target supplied as argument.
- `src/domain/validate-shield-project.ts`: existing project validation plus generation-specific string, physical-cell and matrix checks. Does not alter validateProject semantics for existing editor tests.
- `src/domain/create-preset-project.ts`: fresh Project from supplied bundled preset data.
- `src/catalog/shield-target.ts`: pinned nice_nano_v2 target, GPIO allowlist, version and v0.3 docs link.
- `src/catalog/unibody-preset.ts`: complete readonly project data, with static wiring in unibody-preset-wiring.ts; no catalog function imports.
- `src/generators/generate-{kconfig-shield,kconfig-defconfig,overlay,keymap,conf}.ts`: one exported generator each.
- `src/generators/generate-shield-files.ts`: fixed-order aggregate, receives project and already derived matrix; never validates.
- `src/generators/render-{binding,key-stroke,custom-behaviors}.ts`: small used rendering functions. Overlay node renderers remain private in generate-overlay.ts. Custom behaviors deduplicate from rendered semantic definitions in traversal order.
- `src/generators/escape-string.ts`: DT/Kconfig string handling verified against pinned Kconfig parser.
- `src/ui/project-state.ts`: global generation blockers shared with existing panel/badges.
- `src/ui/export/export-workspace.tsx`: consumes validated project/matrix, invokes aggregate and renders details/pre; issue links use existing issue navigation.
- `src/ui/project-file-actions.ts`, `src/ui/shell/project-dialogs.tsx`: New preset replaces through same history/autosave/confirmation flows as empty New.
- `tests/fixtures/generated/unibody/`: independently authored five expected files, a row2col overlay variant and DIFFERENCES.md.
- Colocated tests cover rules/golden files/preview; test-only schematic builders support edge graphs.

## Design Decisions and Sources

See [research.md](research.md). All ZMK syntax follows docs/zmk/shield-files.md, kscan.md, boards.md, matrix-transform.md, physical-layout.md, keymap.md and behaviors.md. Verbatim Reviung41 is the structural reference. No geometry beyond 1u zero rotation. Signed coordinates are parenthesized and never normalized. Custom labels use `custom_td_N` / `custom_mm_N`, avoiding built-ins; layer node names use existing toLayerNodeName with a 31-character cap. .conf contains one comment plus newline because no settings are represented.

Matrix graph vertices are used nets, edges ordered keys. Numeric smallest GPIO seeds each component as row, BFS alternates. Canonical row/col arrays are sorted by GPIO. All edge directions must match first key's direction; conflicting keys each get an issue. Existing schematic validator reports shorts/parallel cells and disconnected pins. Additional errors report missing/unsupported GPIO, unused wiring, non-bipartite graph, missing diode, empty project, name limits and geometry overflow.
