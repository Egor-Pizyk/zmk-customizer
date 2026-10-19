# Implementation Plan: Custom behaviors

**Branch**: `016-custom-behaviors` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

## Summary

Add typed named definitions and reference bindings to the existing Project, immutable library operations, semantic validation and deterministic rendering. Keep inline tap-dance/mod-morph output unchanged.

## Relevant context

`docs/{architecture,folder-structure,tooling,domain-model,testing,commands}.md`; `docs/guidelines/code-quality/{typescript,control-flow,observability,naming/functions,naming/variables}.md`; `docs/guidelines/frontend/{react,accessibility,admin-ui,tailwind}.md`; `docs/zmk/{README,behaviors,keymap}.md`. Owners: `@domain`, `@domain/bindings`, `@domain/bindings/editing`, `@domain/validation`, `@generators/keymap`, `@storage/project`, `@storage/migrations`, `@ui/bindings/picker/logic`, `@ui/bindings/panel/components`.

## Technical context

Existing strict TypeScript/React/Zod/static stack; no dependencies. Up to 128 definitions, 32 taps per definition, two typed parameters per reference, 256 trigger positions; timing 0–5000 ms (-1 only disabled options). Definitions store Binding references, not recursively nested definition objects.

## Scope and preserved contracts

Roadmap 016 only; 017 follows separately. Preserve legacy inline bindings, old-file migration chain, deterministic preset golden bytes, selection, history, autosave and export blocking. Named definitions have stable IDs independent of display names.

## Constitution check

Before and after design: pure domain operations, no runtime I/O, catalog facts with pinned docs links, strict storage parsing, migration plus old-file tests, independent golden tests and keyboard controls. No principle or architecture exceptions; no ADR needed.

## Design and ownership

Extend `src/domain/types.ts` with `CustomBehavior` (five variants), `BehaviorParameter` and `custom` Binding. `Project.behaviors` required in schema v9; v8→v9 inserts an empty collection. Domain library group owns allocation, defaults, replacement, removal, reference argument construction and validation. Hold/tap targets are a bounded catalog of zero/one-cell built-ins; references carry typed key/layer/dummy arguments. Tap-dance/mod-morph children use existing Binding values including references, with graph cycle detection and no inline definition nesting. Sanitize names to a prefixed label with stable ID suffix, keeping labels distinct from built-ins and legacy `custom_td_*`/`custom_mm_*`.

Storage extracts shared binding schema into its own file, adds strict bounded definition schemas; semantic missing references remain importable. Analysis composes library validation. Existing binding switches handle new reference kind explicitly.

`src/catalog/bindings/` owns option descriptions/defaults and docs. `src/generators/keymap/` renders definitions and typed assignment parameters; collects inline behaviors from definition actions too and includes action-specific headers.

`src/ui/bindings/behaviors/{components,logic}/` owns a compact labeled library editor; existing picker lists custom definitions and shows parameter editing; UI calls immutable operations and commits once per gesture. Existing issue routing maps definitions to Bindings and focuses their editor.

## Verification strategy

Tests first: immutable create/edit/remove, shared references, invalid timing/args/modifiers/missing targets/cycles, key/layer identity; strict schema bounds, v8 migration and old-file compatibility; independent golden files per five types. App integration and `tests/e2e/behaviors.spec.ts` cover keyboard creation/assignment, timing edit, save/reload, deletion error/Undo and generated preview. Run focused tests, `make check`, production build, complete browser suite, three changed-journey runs, controlled behavioral regression and `make zmk-build`. Record actual evidence and limits in verification.md; never mark unchecked gates complete.

## Supporting artifacts

[Data model](data-model.md), [output contract](contracts/keymap.md), [research](research.md), [quickstart](quickstart.md). Requirement/task/check/evidence mapping belongs only in tasks.md.

## Decisions and uncertainty

No open product blockers. Explicit parameters preserve ZMK hold-tap/sticky arity. Macro wrappers for two-cell hold-tap children are deferred; zero-parameter macros can be added to bounded hold-tap target choices in a later extension. Feature 017 initially adds macro references to keys, combos, macro steps and named tap-dance/mod-morph actions. Existing dirty 014/015 files are retained.
