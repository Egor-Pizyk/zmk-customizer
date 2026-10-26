# Implementation Plan: Rotary encoders

**Branch**: `019-encoders` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

## Summary

Extend Project to v11 with EC11 hardware and optional layer-owned encoder binding maps. Reuse existing action editors and validation. Generate hardware nodes, sensor rotation behaviors and local driver defaults. No runtime dependency changes.

## Relevant context

Startup docs plus `docs/architecture.md`, `docs/folder-structure.md`, `docs/tooling.md`, `docs/domain-model.md`; TypeScript/control-flow/observability and naming guidelines; frontend React/accessibility/admin-ui/Tailwind guidelines; `docs/testing.md`, `docs/commands.md`. ZMK: `docs/zmk/encoders.md`, `keymap.md` §5, `behaviors.md` §3.9, `boards.md`, `shield-files.md`, `kconfig-options.md` §8. Owning APIs: domain/project, domain/bindings, domain/advanced-keymap; generators/shield and keymap; storage/project and migrations; UI schematic and bindings. Contracts below are normative for this feature.

## Technical context

Existing strict TypeScript, React, zod and SVG; static app. Up to 16 encoders, 32 valid ZMK layers. No new packages or architecture exceptions. Existing dirty work for 014–018 is retained.

## Scope and preserved contracts

All FR-001–008; the original 019 delivery used no new drag tool, sensor types or push-button model. Feature 036 item 1 supersedes the passive-marker UI with placement/rotation and links an optional ordinary key while preserving the original encoder identity/actions. Zero-encoder generator bytes stay unchanged. Every edit uses generic commit/history, schema parsing remains the trust boundary.

## Constitution check

Pre-design and post-design: pass. Domain is pure and catalog injected; ZMK facts have pinned sources and independent fixture contracts; migration and old-file tests included; keyboard controls and problem focus included; no runtime network or dependencies.

## Design and ownership

- `src/domain/encoder-types.ts`: Encoder `{id,xU,yU,half,aPin?,bPin?,steps,triggersPerRotation}` and EncoderBinding `{clockwise:Binding,counterclockwise:Binding}`. Required `Project.encoders`, optional `Layer.encoderBindings` keyed by encoder ID. Absence = both none. IDs are `e` plus digits. Bounds: 16 hardware entries; electrical steps 1–360 and triggers restricted to positive divisors of 360, using injected catalog limits; finite positions inside existing layout bounds. Imported semantic conflicts remain repairable.
- `src/domain/encoders/`: add/replace/remove encoder, set rotation binding, entry queries and validation. Remove cleans all layer encoder maps. Controller changes retain compatible same-family pins and clear others. Validation sees terminal and free wire assignments with their halves, excludes ground, detects conflicts with other encoder channels and unsupported/right-half hardware. Rotation actions reuse `validateAdvancedBinding`; all binding collection includes encoder entries so custom declarations, header needs and controller checks remain complete.
- `src/storage/project/encoder-schema.ts` and v10→v11 migration: strict encoder nodes, bounded maps and unique existing hardware references. Historical fixtures prove earlier files retain content. Only v10 lacks the collection. `createProject`, preset and test builders move to v11; historical fixture bytes remain untouched.
- `src/catalog/encoders/`: hardware/rotation option descriptions, defaults and docs URLs. `src/generators/shield/` emits ordered EC11 nodes and sensors children, half-local enables and guarded EC11 trigger defaults. `src/generators/keymap/` emits rotation behaviors per layer/encoder, using normal binding rendering (including custom and macro references); one sensor binding per encoder.
- `src/ui/schematic/encoders/components/`: collapsible bounded editor, shared draft inputs, pin/half selects and inline issues; passive marker in schematic rendering. `src/ui/bindings/encoders/components/`: collapsible rotation editor scoped to active layer, reuses BehaviorAction. Repair targets use existing data-issue-path conventions and details reveal.
- Exact aliases added to tsconfig only for populated groups; docs registry updated. No effects added.

## Verification strategy

Tests first for immutable edits, cleanup, references, conflict detection, controller changes, migration/schema and independent generator goldens. Upstream Sofle files copied verbatim from pinned commit with provenance and differences; generated fixtures use equivalent encoder wiring on the existing small presets. E2E exercises keyboard editing, split/layer actions, repair navigation, reload, Undo/Redo and actual downloaded JSON/ZIP. Chromium complete suite plus three sequential focused runs and Firefox/WebKit input/focus checks. A controlled encoder persistence regression proves browser sensitivity, restoring exact bytes afterward. Run make check, production build, make test-e2e and make zmk-build; record unavailable gates rather than claiming success. Manual accessibility checklist remains explicit until actually performed.

## Supporting artifacts

[contracts.md](contracts.md) defines import, output and UI boundaries; pinned research is recorded once in `docs/zmk/encoders.md`. Task traceability lives only in tasks.md. Verification records commands and limits.

## Decisions and uncertainty

No material blockers. Missing rotation actions mean none, with no inheritance. Driver enablement belongs to guarded hardware defaults rather than duplicating user .conf settings (preserves split config scoping). Labels use positional indices, bounded and independent of arbitrary imported IDs; bindings resolve stable encoder IDs first.

Implementation refinement: regression tests exposed layer-ID reuse when only an encoder retained a deleted layer reference. `src/domain/layers/add-layer.ts` now reserves direct and typed custom layer references collected across all project actions. Fresh encoder markers are placed to the right of keys and existing encoders so they do not initially overlap. Rotation repair fieldsets describe their inline error text.

Runtime review refinement: v0.3 EC11 reports fractional angles through a legacy-tick branch above 360 electrical steps, and sensor-rotate divides by integer `360 / triggers`. Catalog/validation therefore cap electrical steps at 360 and accept only positive divisors of 360 as triggers. This follows pinned C source, beyond the permissive DT YAML. Counts remain structurally parseable for repair; invalid values block export.

Memory refinement: the pinned driver allocates a sensor×layer state array per sensor-rotate instance. Intern identical rendered CW/CCW pairs in deterministic traversal, emit each unique pair once, and return per-layer ordered label rows for bindings. Max-grid unit regression: 16 sensors×32 layers share one empty definition with 512 references. Valid split stress builds use 12 encoders and 32 layers; they verify the repair under real controller RAM limits. This avoids predictable duplication but does not guarantee every large combination of distinct actions fits every board.

## Parts organization follow-up

FR-009–011 extend the existing feature on active fix/pre-major-sweep / PR #29. Resolver selects 038 (routing), so amend owning 019 instead. Move EncoderPanel composition into PartsList; use native details without the outer schematic-editor group name, h3 headings, no nested encoder scroll cap, and Add encoder after hardware entries. Wrap Keys in an independent native disclosure initially open. Keep controls mounted when folded so existing issue-target reveal can open all ancestors; keep domain/catalog/storage/generator behavior unchanged. Update 036's superseded peer-heading clause and onboarding location text. App and E2E prove independent folding, data preservation, add/edit/delete/history and nested repair; rendered light/dark narrow/desktop review and mandatory staged changed checks recorded in parts-verification.md. Analysis: existing catalog controls and pure operations reused, no dependency/schema/migration/output change; outer Parts remains a single peer editor, nested disclosure state is transient and independent.
