# Implementation Plan: Interactive onboarding

**Branch**: `feature/037-interactive-onboarding` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md)

## Summary

Deliver US1–US4 through a protected tutorial session, a versioned local display record, pure completion predicates and an accessible spotlight over existing editors. Keep one active Project and one normal editing/analysis/export path. Park the original project's complete in-memory history while teaching; route tutorial saves to a separate validated session record. Reload always opens the untouched normal project, with explicit tutorial resume available.

Design and tasks are complete; the user authorized analysis, implementation, verification and PR delivery without further approval pauses. Execution evidence belongs to verification.md.

## Relevant context

- Startup and gates: `AGENTS.md`, `docs/product.md`, `docs/principles.md`, `docs/workflow.md`, `docs/agent-rules.md`, `docs/guidelines/git-flow.md`, `.specify/memory/constitution.md`.
- Scope: `docs/roadmap.md` section 037, this feature's `spec.md` and `checklists/requirements.md`. The user's cancellation supersedes stale 038 dependencies; do not revive 038 or alter unrelated staged 035 documentation.
- Owners and dependencies: `docs/architecture.md`, `docs/folder-structure.md`, `docs/tooling.md`, `docs/domain-model.md`, `tsconfig.json`.
- Code conventions: `docs/guidelines/code-quality/{typescript,control-flow,observability}.md`, both `naming/{functions,variables}.md`; UI: `docs/guidelines/frontend/{react,accessibility,admin-ui,tailwind}.md` and `src/styles.css`.
- Compatibility: `src/storage/project/index.ts`, project parser/migrations; `src/ui/project/logic/{project-state,project-history,project-file-actions,import-session,use-project-state,project-context}.ts` and `src/ui/project/components/project-context.tsx`.
- Composition/targets: `src/main.tsx`, `src/ui/app/components/{app,workspace-view}.tsx`, `src/ui/shell/components/tab-bar.tsx`; Schematic layout `add-key-button.tsx`, `layout-controls.tsx`, parts `parts-keys-table.tsx`, wiring `controller-panel.tsx`, `wiring-controls.tsx`; Firmware and Bindings workspace public APIs.
- Export boundary: `src/ui/export/logic/{get-export-preview,use-export-actions}.ts` and `src/ui/export/components/{export-workspace,file-preview}.tsx`; downloads public API. Keep generator calls solely in get-export-preview.
- Pinned facts: `docs/zmk/README.md`, `docs/zmk/boards.md`, `src/catalog/controllers/controller-boards.ts`; read `docs/zmk/{kscan,matrix-transform,keymap,kconfig-options,shield-files}.md` before changing related copy or output assertions. No new syntax is planned.
- Verification: `docs/testing.md`, `docs/commands.md`; existing `tests/unit/ui/{project,integration}/`, `tests/e2e/` and independent export fixtures.

## Technical context

Use the established strict TypeScript/React 19/Vite/Tailwind v4 stack; zod for storage parsing, existing fflate ZIP builder, native DOM/SVG/ResizeObserver APIs. Node 24 and Docker for checks. No runtime dependency, backend, network, new context provider or Project schema field. Tutorial metadata has its own version; Project remains schema v13. Nine 1u keys, one base layer, unibody matrix and existing supported board are sufficient.

## Scope and preserved contracts

Implement FR-001–FR-022, including the future agent-rule change, without changing generators, weakening validation or adopting a preset as the exercise. Tutorial state never enters project JSON, generated files or project Undo/Redo. Normal project persistence remains backward compatible. A tutorial uses normal domain edit functions and shared project analysis. One gesture remains one commit. Normal New/Open commands are unavailable through the tour's dimmed background; exiting restores them. Advanced introductions point to existing controls without executing destructive commands.

## Constitution check

Before design: pass with no principle exception. Static/offline operation, pure domain rules, storage trust boundary, immutable history, accessibility and deterministic export remain required.

After design: pass subject to the explicit implementation updates below. Add the new onboarding shared UI contract to `docs/architecture.md` and the resolved architecture gate, aliases to `tsconfig.json`, and new responsibility ownership to `docs/folder-structure.md`. Update the effect inventory in `docs/guidelines/frontend/react.md` for actual new DOM synchronization hooks. These are named extensions of existing rules, not permission to bypass them. No additional context, package, new ZMK feature or project migration is justified. Re-evaluate if implementation changes these decisions.

## Design and ownership

### Pure completion rules

Create `src/domain/onboarding/` with immutable tutorial step IDs/state transitions and one exported query per file (for example `get-onboarding-progress.ts`). Predicates accept Project plus domain-shaped matrix/issue summaries supplied by project-state's shared analysis, never UI types/catalog imports or fresh electrical analysis from a component. Catalog-derived allowed board IDs/pins are arguments. Separate conditions for accepted edits from informational acknowledgements. Count/layout checks are independent of key IDs; bindings map by stable ID in visible row-major order. See [state model](data-model.md).

Add `tests/unit/domain/onboarding/` first: frozen inputs, empty/partial/complete layouts, rejected/preview-only changes, undo invalidation and the nine expected digit bindings. Do not add tutorial business checks to JSX.

### Protected project session and persistence

Extend existing project state/provider, not nested providers. Keep active `{ past, present, future }`, a discriminated normal/tutorial mode, and the parked original ProjectState. Add explicit begin/resume/return/adopt actions to its public contract. Leave the generic ProjectHistory reducer concerned only with project history.

Replace the hardcoded `saveProject` call in project-state autosave with an explicit destination selected by mode. Every commit/undo/redo/replace uses that destination; tutorial mode must never call the normal writer. Before switching, verify the current original has been saved successfully and persist the initial tutorial envelope. If either fails, remain in normal mode. Preserve corrupt normal backups and refuse entry while normal autosave protection is blocked. Invalidate pending import tokens on all session switches; remount workspace-local drafts/selection using a session identity so stale previews cannot apply to another project.

Create `src/storage/onboarding/` for separate shown/session keys and zod schemas. Reuse supported project parsing/migrations for the nested tutorial Project. Parse unknown input only here; never cast stored payloads. Invalid/newer envelope or tutorial Project is retained for recovery, never silently overwritten. Normal `loadProject()` stays the startup source; explicit resume reads the tutorial record. The shown marker is written on first visible offer, idempotently under StrictMode, outside render. Ordinary project imports cannot reset it.

Persist accepted tutorial changes in event handlers, not unload handlers or autosave effects. For tutorial project edits, compute the candidate immutable history and envelope, save first and publish the candidate only on success. A later save failure refuses that edit, preserves the previous accepted tutorial and original, and shows a retry warning with an accessible exit. Normal-mode memory-first editing remains unchanged. This makes every accepted tutorial edit reload-safe; do not present stale session bytes as latest progress. Adoption writes the tutorial to the normal destination only after explicit confirmation; on failure retain both sessions and keep the tutorial active. Cleanup follows successful save; leftover records never auto-activate.

### UI orchestration and targets

Create shared `src/ui/onboarding/{logic,components}/` public APIs. Hooks own DOM target discovery/measurement/focus and presentation lifecycle; domain owns completion decisions, project state owns isolation, storage owns parsing. App composes the controller/overlay. Existing workspaces register typed stable `data-onboarding-target` anchors and readiness/presentation facts through a narrow shared contract; shared onboarding never imports app or workspace implementations. Use existing ProjectContext for session actions/state and props at app composition for navigation; add no context.

Add replay to TabBar's lower group with accessible name `Take the tour again`; narrow mode retains a labeled icon with focus tooltip. Keep welcome/exit/adoption confirmations in the existing native Dialog primitive. The actual teaching overlay is non-modal so the real target remains interactive. Geometry is a viewport SVG mask/shield with an open target area; use SVG geometry attributes rather than inline CSS styling. Use existing semantic colors plus a named scrim token in styles.css if required. Clamp the explanatory panel into available space using normal flex/grid layouts; on narrow views reserve a lower panel instead of covering the target.

Discover targets by typed IDs, reveal their panel/workspace, then measure after rendered readiness. Resize/scroll observers update geometry; cleanup removes all observers/listeners/inert changes. Apply inert only to disjoint unrelated branches, never an ancestor of the active target, tooltip, live region or nested active dialog. Keep tab order within available target/actions; intercept unrelated project shortcuts at the existing dispatcher while the tour is active. Escape precedence remains nested draft/dialog, then tour exit. Missing targets pause with Retry/Exit; no timer-driven success.

Advance from the accepted project action result and fresh condition evaluation in the session dispatcher, not a state-copying effect. Informational acknowledgements are explicit actions. Store stable step IDs; derive the visible number/count from the ordered definition. On Back, don't mutate Project or regenerate content. Recompute prerequisites after project changes before claiming completion. Export reports typed file-view and ZIP-success events, rather than parsing announcement text. An event carries the session and immutable project reference captured at click: discard it if the current project/session has changed during ZIP building.

### Exercise and introductions

Recommend existing nice!nano v2 (`nice_nano_v2`); selecting another supported board is allowed if domain conditions pass. Explain its catalog label/description and connector indices. For a predictable automated journey use six distinct valid connector indices from the verified catalog, e.g. 0/1/2 and 3/4/5; never introduce a hardcoded MCU map into tutorial code. Use normal diode/pin previews and Apply. Existing Add key + position fields provide the keyboard placement route; no separate tutorial editor is added.

Split the US2 layout stage into repeatable placement/position guidance for the nine keys if needed, while keeping stable step IDs and a derived total. A 3×3 layout means nine equal 1u keys at unit pitch, zero rotation, up to a common translation; explicitly document this exercise target in the specification before tasks. Controller/pin states already satisfying a condition require acknowledgement. Show Problems with an empty-state explanation when valid. Firmware defaults need acknowledgement only. File inspection records explicit opening/focusing of keymap, .conf and shield preview groups; their initially expanded DOM is not evidence the user inspected them.

Place the FR-015 discovery cards before final ZIP download so export remains the final practical result. Group into presets/agent creation, KLE import, layers/behaviors/combos/macros/conditional layers, hardware and app settings; highlight real entry points without applying them. Finish with a result screen explaining external build/flash and return/adopt choices.

### Documentation and checks

During implementation add the exact maintenance requirement FR-022 to docs/agent-rules.md. Reconcile stale 038 roadmap dependencies and add 037 to specs/README.md in the owning documentation change within 037's explicit scope, preserving the original checkout's unrelated 035 edits; do not absorb unrelated staged changes. Keep requirement → task → check → evidence mapping only in tasks.md; verification.md becomes the one execution journal linked from that mapping. No mapping claims implementation at this stage.

## Verification strategy

Tests-first for pure conditions and all new persistence/failure paths. Add real-provider integration checks for normal/tutorial writer separation, exact original history restoration, stale import cancellation, StrictMode first show, corrupt/newer data, quota failures and adoption ordering. Independent assertions read original bytes and parsed tutorial bytes; do not compute expectations through the evaluator under test.

Playwright E2E must cover fresh display once, skip/exit, reload during practice, replay/resume, existing-project preservation and the complete nine-key path to a real downloaded ZIP. Unzip and compare paths/content to displayed preview and independent nine-digit/matrix expectations; success with stale files must fail. Add keyboard-only path, target loss/recovery, Back and Undo prerequisite repair, nested Escape, async ZIP failure/retry. Existing browser-boundary failure injection is allowed; do not mock core services or mutate app state through evaluate.

Rendered review: 1280/1024 desktop and 390px Schematic/settings, light/dark, text 200%, reduced motion, scroll/reflow, target/panel visibility and focus. Other workspace teaching panels must remain reachable at narrow widths without redesigning all workspace content. Focus/geometry cases need representative Firefox/WebKit coverage; complete Chromium suite belongs to CI. Prove sensitivity with one controlled spotlight/focus or completion regression, run alone and restore bytes. Actual VoiceOver/Safari or NVDA/Firefox plus manual keyboard smoke remain separate evidence.

Use `npm run check:changed` on the exact staged implementation snapshot; use docs/commands.md for additional required checks. If emitted output changes, stop to amend scope and add golden/build evidence; this plan does not authorize generator changes. At planning, run documentation checks only; never report planned tests as passed.

## Supporting artifacts

- [research.md](research.md): decisions and rejected alternatives.
- [data-model.md](data-model.md): state, trust boundaries and transitions.
- [contracts/onboarding.md](contracts/onboarding.md): user-visible lifecycle, typed integration signals and target contracts.
- [quickstart.md](quickstart.md): future validation procedure.
- [tasks.md](tasks.md): dependency-ordered execution checklist and the single FR → task → check → evidence mapping.

## Decisions and uncertainty

No unresolved technical blocker remains. The precise number of teaching substeps is derived from reviewed content, not persisted numeric indexes. No external research is needed: this extends existing local APIs and pinned catalog facts. The spec's geometry definition was refined in this planning change before tasks. Skill-requested research delegation inspected autosave isolation read-only; no parallel code edits occurred.

Implementation refinement: KLE and Settings have dedicated real target steps. Name targets only its fields; New/Open/AI commands are disabled throughout practice. Layout highlights the workspace as a composite canvas/table target and reveals Add key after responsive reflow. Explicit file inspection uses tutorial-only Inspect file buttons. Progress is 17 stable steps; canonical digit names/aliases come from the binding catalog. No new dependency or context was added.
