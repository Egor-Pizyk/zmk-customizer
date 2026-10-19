# Implementation Plan: Keymap editor acceptance

**Branch**: `014-keymap-editor` | **Date**: 2026-10-17 | **Spec**: [spec.md](spec.md)

## Summary

Complete roadmap acceptance through real browser editor/save/import/ZIP flows. Existing layers, built-ins and physical layout rendering are retained. Repair the discovered category-search gap in the existing picker filtering owner.

## Relevant context

Read AGENTS.md and docs/{product,principles,workflow,agent-rules,repository-map,architecture,folder-structure,tooling,domain-model,testing,commands}.md; specs/README.md; roadmap 014; code-quality TypeScript, control-flow, naming and observability guidelines; frontend React/accessibility/admin-ui guidelines; docs/zmk/{README,keymap,behaviors}.md. Owners: src/catalog/presets (UNIBODY_PRESET); @ui/bindings/picker/logic and /components; @storage/project; @generators/keymap. Golden: tests/fixtures/generated/unibody/unibody_six.keymap and its DIFFERENCES.md. Existing layers acceptance: tests/unit/domain/layers/move-layer.test.ts, tests/unit/domain/validation/validate-bindings.test.ts and tests/unit/ui/integration/app-bindings.test.ts. Browser conventions: tests/e2e/helpers.ts.

## Technical context

Use existing TypeScript/React/Vitest/Playwright stack, offline static architecture and approved dependencies. One current catalog preset; future preset additions must extend acceptance cases. No dependency or schema changes.

## Scope and preserved contracts

Picker category matching and Escape recovery after table inspection change user behavior. No generator/ZMK syntax, storage schema or domain policy changes. Preserve word-prefix search, aliases, no-match, cancellation, immutable project edits and undo/redo. Group name queries retain entire matching groups; other queries retain current item filtering.

## Constitution check

Before and after design: no violations. Business rules stay in domain; picker filtering is presentation logic. Catalog remains pinned. Tests use independent existing golden bytes, real providers/storage/export, isolated browser and actual downloads. No new dependencies or speculative abstraction.

## Design and ownership

Move the existing filterGroups function from slot-picker.tsx into an exported filter-picker-groups.ts in picker/logic; delegate to existing filterPickerItems and include group label in matching through the same word-prefix policy. Unit tests mirror that owner. Fix use-bindings-interaction.ts table onChooseAction to update activeKeyId as well as selection, so Escape returns to the inspected key; a failing browser regression demonstrated focus returning to key 0 after inspecting key 1. Regression integration and E2E tests prove category/name/alias selection and saved project. Add E2E no-edit preset round trip visiting each layer/key, cancellation and saved JSON, reload/import and ZIP comparison. Add browser layer-reference recovery checks if existing coverage lacks complete exported assertions. Existing catalog tests prove docs for every entry.

## Verification strategy

Tests first: reproduce category search failure before production edits. Focused Vitest, make check, Docker production build, full make test-e2e, and new scenarios in three sequential runs without retries. Target cross-browser keyboard/focus flows using @cross-browser convention. Prove category test sensitivity with the baseline failure; no substantial gesture contract is added. No generator/exported-geometry change means make zmk-build is not required. Record requirement → task → check → evidence only in verification.md.

## Supporting artifacts

Existing model, storage contracts and golden differences carry the needed contracts. No new data-model, research or duplicated quickstart is useful for this bounded acceptance feature. Resolved research: one catalog preset is available, upstream Corne/Reviung references are not offered presets; current filterGroups omits group label.

## Decisions and uncertainty

Category search reuses existing search input and group labels, preserving grouped UI and keyboard pattern. No material questions remain. Feature directory is explicitly 014 despite later numbered infrastructure specs.
