# Implementation Plan: KLE layout import

**Branch**: `018-kle-import` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

## Summary

Parse downloaded KLE JSON at the storage boundary, review conversion warnings in Schematic, then commit one pure project replacement with existing Undo/Redo.

## Relevant context

Startup: docs/product.md, principles.md, workflow.md, agent-rules.md. Ownership: docs/repository-map.md, roadmap.md, specs/README.md. Architecture: docs/architecture.md, folder-structure.md, tooling.md, domain-model.md. Conventions: docs/guidelines/code-quality/{typescript,control-flow,observability}.md, naming/{functions,variables}.md; frontend/{react,accessibility,admin-ui,tailwind}.md; src/styles.css. Verification: docs/testing.md, commands.md. Existing geometry: specs/012-layout-editor/{spec,plan}.md; src/domain/geometry/index.ts. Storage/history contracts: src/storage/project/{project-budget,project-schema}.ts; src/ui/project/logic/{project-context,project-history,import-session}.ts. KLE interchange source: research.md. No ZMK syntax or generator change.

## Technical context

Existing TypeScript/React/zod, Node 24 Docker. No dependency changes. At most 512 keys and 5 MiB. Project schema remains v10; no persisted import metadata.

## Scope and preserved contracts

Strict JSON only. Retain geometry/source order; no automatic wiring or bindings. Retain current name/controller, reset remaining project content using createProject defaults. Atomic commit preserves exact old project in history. Storage checks untrusted input; domain owns replacement; UI owns read/review state only.

## Constitution check

Before and after design: PASS. Pure immutable operation, no dependency or runtime network, typed storage parsing, deterministic key IDs, labeled keyboard controls, existing validation/export unchanged. No new generator output; existing golden tests remain regression protection. Manual accessibility checks remain explicit completion limits.

## Design and ownership

- src/storage/kle/: kle-schema.ts validates known properties with zod and passes through ignored properties for warning reporting; parse-kle-layout.ts converts bounded JSON to ordered KeyGeometry[] and warnings; supporting decode helpers split cursor/property handling. read-kle-file.ts checks bytes and catches file I/O. Public index and exact @storage/kle alias.
- src/domain/project/replace-project-layout.ts: takes Project and ordered geometry, returns createProject defaults with same name/controller and deterministic k0… IDs; rejects empty/oversized input as no-op. Tests freeze original and exercise history/round-trip.
- src/ui/schematic/layout/logic/use-kle-import.ts: provider-lived import-session revision tokens and base Project identity prevent stale async/review application, reusing the existing project-file race guard; existing commit functional updater rechecks identity. Local state only, no parsing or domain rules.
- src/ui/schematic/layout/components/kle-import.tsx: labeled JSON file input and compact review, warnings, explicit apply/cancel. Announcements use existing project context. Mounted within the existing layout-actions row in Schematic, so collapsed import adds no canvas height. A reversible replacement needs no second modal confirmation.
- tests/fixtures/kle/: independent starter geometry and cluster/unsupported fixtures. tests/unit/storage/kle/, tests/unit/domain/project/replace-project-layout.test.ts, tests/unit/ui/integration/app-kle-import.test.ts; tests/e2e/kle-import.spec.ts.

## Verification strategy

Write storage/domain contract tests first and observe failure before implementation. Independently specified fixtures include negative offsets, width reset, cluster reset, decal cursor advancement, unsupported shapes, invalid types, byte/key limits. Real App tests cover cancellation, stale reads/project edits, retry, single-step history and save/load. E2E covers visible canvas, actual saved/downloaded geometry, undo/redo and retry using native file input. Run make check, production build, full browser suite, new browser tests three sequential times and a controlled stale/geometry mutation separately. Record actual results and limits in verification.md. No firmware build required: no generators/exported geometry format changed.

## Supporting artifacts

[research.md](research.md) records KLE source semantics and dependency decision. [contracts/import.md](contracts/import.md) defines storage and replacement boundaries. Tasks carry the single requirement-to-check mapping.

## Decisions and uncertainty

Use existing primitives; no schema field for labels. Unsupported appearance is warned, secondary shapes approximate primary rectangles, decals skip physical keys. No unresolved material questions. Spec and roadmap align; update roadmap/index to point at this feature, without changing existing edits.
