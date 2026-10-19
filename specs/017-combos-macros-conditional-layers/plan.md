# Implementation Plan: Combos, macros and conditional layers

**Branch**: `017-combos-macros-conditional-layers` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

## Summary

Extend the single Project with stable combo/macro/rule identities and reference bindings. Reuse 016's typed action editor; keep pure edits/validation in domain, strict parsing in storage and ZMK syntax in generators.

## Relevant context

`docs/{architecture,folder-structure,tooling,domain-model,testing,commands}.md`; code-quality TypeScript/control-flow/observability/naming rules and frontend React/accessibility/admin-ui/Tailwind rules; `docs/zmk/{README,behaviors,keymap,combos-macros-layers}.md`; `specs/016-custom-behaviors/{spec,plan,data-model}.md`. Owners: `@domain`, `@domain/bindings`, `@domain/behaviors`, `@domain/validation`, `@generators/keymap`, `@storage/project`, `@storage/migrations`, `@ui/bindings/behaviors/components`, `@ui/bindings/picker/logic`.

## Technical context

Existing strict TypeScript, React, Zod and Docker stack. No new runtime dependencies. Bounds: 128 combos/macros/rules, 20 keys per combo, 64 macro steps, 32 layer references, 256 expanded macro DT bindings and 64 queue entries (pinned default; no queue Kconfig editor in this scope).

## Scope and preserved contracts

Roadmap 017 after 016 implementation. Preserve original output when collections empty, schema v1–v9 imports, named/inline behaviors, immutable history, clipboard identities and invalid export blocking. Parameterized macros and raw output excluded.

## Constitution check

Before/after design: pure deterministic domain/generators, static/offline, catalog docs links, strict bounded parsing and migration, independent goldens and real browser tests; no architecture exception or dependency ADR.

## Design and ownership

`src/domain/advanced-keymap/` owns combo/macro/conditional CRUD, step edits/reorder, stable ID allocation, name/position/layer/timing validation and cross-definition cycle/budget checks. Register exact alias. Project v10 adds required `combos`, `macros`, `conditionalLayers`; v9→v10 inserts empty arrays. Supported macro locations: key bindings, combo actions, macro steps and tap-dance/mod-morph actions in named definitions. Hold-tap targets retain 016's explicit built-in-only contract; zero-cell macro targets are a later extension, not silently included here. Macro Binding is `{kind: 'macro', macroId}` and has zero cells. IDs use distinct c/m/q prefixes; reserve dangling and copied macro IDs. Actions and steps retain IDs across reorder.

Use stored key/layer IDs, resolving indices only in generators. Validate 2–20 unique combo keys, existing references, timeout, layer filter and nested Binding actions. Conditional rules enforce unique targets, ≥2 unique inputs and higher target index; reject self/cycles with owning rule paths. Macro validation checks timing, nonempty bounded steps, nested references/cycles, expanded DT count and conservative queue cost against 64. Never silently remove broken references on key/layer deletion.

`src/catalog/bindings/` adds descriptions/docs and macro/advanced option facts. `src/storage/project/` adds strict schemas and duplicate identity checks. `src/domain/analysis/` composes validation. Existing validation/controller and binding queries include actions held by combos/macros; graph checks span custom behavior and macro references without creating a module dependency cycle.

`src/generators/keymap/` emits sorted sections, unique prefixed sanitized labels and all action-specific headers/inline nodes. Every action step emits its explicit macro mode. A pause emits `macro_wait_time N`, `macro_press`, `none`, then `macro_wait_time <configured interval>`: one harmless queue event waits N after press; subsequent actions set their own mode and retain configured tap duration. Verified against pinned C queue logic (research.md).

`src/ui/bindings/advanced/{components,logic}/` provides compact expandable editors. Combo key choices use labeled checkboxes with current positions and a button to select its keys on the existing layout; a button captures current layout selection. Macro steps have labeled mode/action/pause fields and Move up/down/Remove buttons. Reuse 016 BehaviorAction for complete typed actions and parameter edits. Rules use labeled layer choices. Problem targets stay rendered under closed details so existing issue focus opens owners. Picker adds named macros; copied macro references reserve IDs.

## Verification strategy

Tests first in `tests/unit/domain/advanced-keymap/`, `tests/unit/storage/project/advanced-keymap.test.ts`, `tests/unit/generators/keymap/advanced-keymap.test.ts` and independent fixtures in `tests/fixtures/expected/advanced-keymap/`. Golden coverage includes each section, pause encoding, key/layer reorder and nested named/inline actions. Storage has unchanged v9 fixture, round trips, malformed/oversized data. UI integration exercises every editor; `tests/e2e/advanced-keymap.spec.ts` checks actual JSON/ZIP, preview, reorder/deletion/error/Undo and keyboard alternatives. Run `make check`, production build, complete Chromium plus cross-browser native input/focus tests; three sequential changed-journey runs; controlled mutation separately; `make zmk-build` with advanced export target.

## Supporting artifacts

[Research](research.md), [data model](data-model.md), [output contract](contracts/keymap.md), [quickstart](quickstart.md). Traceability lives only in tasks.md.

## Decisions and uncertainty

Pause expansion is pinned-source verified; queue limits remain conservative to avoid dropped firmware events. Rule target ordering uses an error instead of silent layer reorder. No material open questions.
