# Implementation Plan: JointJS Schematic editor

**Branch**: `feature/038-jointjs-schematic-editor` | **Date**: 2026-10-26 | **Spec**: [spec.md](spec.md)

## Summary

Adopt exactly `@joint/core@4.3.3` as a disposable Schematic Graph/Paper projection. Keep the authoritative Project/provider/history, domain geometry/electrical operations, tables, shared viewport and accessible controls. Convert normalized gestures to existing domain calls once; never commit Graph changes or serialize it. Initially disable library automatic movement, linking, routing and default edit tools. Reuse the established gesture policies and build custom diagram markup/hit views and native corner/rotation controls where stock tools differ. This migrates rendering and general diagram lifecycle/input infrastructure, not the electrical engine.

## Relevant context

- Governance: `docs/product.md`, `docs/principles.md`, `docs/workflow.md`, `docs/agent-rules.md`, `docs/guidelines/git-flow.md`, `.specify/memory/constitution.md`.
- Owners/placement: `docs/architecture.md`, `docs/folder-structure.md`, `docs/tooling.md`, `docs/domain-model.md`, `tsconfig.json` exact alias registry; ADRs 0003, 0008, 0009 and [0023](../../docs/decisions/0023-jointjs-schematic-projection.md).
- Conventions: `docs/guidelines/code-quality/{typescript,control-flow,observability}.md`, both `naming/*.md`; `docs/guidelines/frontend/{react,accessibility,admin-ui,tailwind}.md`; `src/styles.css` existing semantic tokens.
- Verification: `docs/testing.md`, `docs/commands.md`, `tests/fixtures/schematic/large.json` and `tests/unit/storage/project/large-schematic.test.ts`.
- Owning behaviors: `specs/003-schematic-switches-wires/spec.md`, `contracts/ui.md`, `contracts/project-schema.md`; `specs/008-schematic-diodes/spec.md`; `specs/012-layout-editor/spec.md`, `contracts/layout.md`; `specs/013-matrix-wiring-editor/spec.md`; `specs/019-encoders/spec.md`, `contracts.md`; `specs/032-project-creation-and-auto-wiring/spec.md`; `specs/033-wiring-and-settings-usability/{spec,data-model}.md`, `contracts/wiring-interactions.md`; `specs/036-ui-ux-remediation/spec.md`; `specs/037-interactive-onboarding/spec.md` and source targets. Later 036 amendments supersede historical shortcuts/Complete wiring language.
- Baseline composition (replaced scene components are removed during T047): `src/ui/schematic/components/{schematic-canvas,schematic-workspace}.tsx`, `logic/use-schematic-workspace.ts`, `interaction/{use-schematic-pointer,pointer-select,pointer-preview,pointer-types,read-canvas-hit,get-schematic-geometry}.ts`; rendering components `schematic-content`, `wires-layer`, `key-shape` and existing screen layers.
- Shared contracts: `src/ui/canvas/logic/{surface-content,viewport,use-surface-viewport}.ts`, components `work-surface`/`surface-svg`; `src/ui/project/logic/{project-state,project-history}.ts`. Domain APIs: `@domain/keys`, `@domain/encoders`, `@domain/wires`, `@domain/wires/editing`, `@domain/wires/geometry`, `@domain/crossings`; cached analysis only through `@ui/project/logic`.
- No ZMK syntax/catalog/generator change is planned; read relevant pinned `docs/zmk/` notes only if implementation unexpectedly changes that scope, amend spec first and add independent output/build evidence.

## Technical context

Inherit React 19, strict TypeScript 7, Vite, Tailwind v4, SVG, Vitest/Playwright, Node24/Docker and static offline distribution. Exact core version 4.3.3 is MPL-2.0 and has no declared runtime/peer dependencies. No @joint/react, Plus, WASM, CDN or remote license service. Keep library objects mutable only inside the adapter; application records use readonly discriminated unions, stable IDs, guarded indexed access and no casts/any/authored subclasses. Use core definition/factory APIs and typed descriptors.

Scale: 100 keys/300 wires baseline plus rotated/split/encoder/invalid fixtures. Shared `u` coordinates remain authoritative. Paper receives domain-computed points, zero arrowheads and explicit no-auto-routing/connection policies. Project schema remains v13; storage/generators unchanged. Core CSS, if required for structural Paper layout, is imported only by the adapter; override visual defaults with existing tokens and namespaced rules, never adopt demonstration colors/artwork.

## Scope and preserved contracts

All FR-001–016; Schematic only. Shared host/viewport plumbing may change to support it, with explicit unchanged Bindings behavior tests. No user group model, alternative history/store, electric-net replacement, new context or long-lived duplicate editor. Preserve current wire-section boundary, per-crossing insulation, diode display-only terminal offset, fixed bus/contact anchors, encoder/push key ownership and read-only proposal inspection. Keep original gesture/domain reducers where they embody these policies; remove only scene code actually superseded after parity.

## Constitution check

**Before research:** Pass with required ADR/design work: selected technology changes presentation/dependency decisions, not product principles. No firmware syntax change, untrusted input shortcut, schema change, backend or speculative domain abstraction.

**After design:** Pass. ADR0023 approves a UI-only library boundary; owning rules explicitly permit that boundary without loosening pure layers. Domain does not consume Graph/Paper/types. All writes still enter provider commit/storage. Exact projected paths preserve deterministic accepted data; one history owns Undo. Native/list alternatives, screen targets and onboarding remain required. Explicit narrowly recoverable external-renderer failures do not hide domain/application programmer errors or add a React error boundary. Baseline/visual/manual evidence remains required before adoption, not implied by source research.

## Design and ownership

### 1. Capture baseline and prove package integration first

Before replacing the scene, archive base `14d9d806a02853e6778d664e2eb9c04b14f16114` and measure current production build using the protocol in [quickstart.md](quickstart.md). Preserve baseline screenshots, exported JSON/files and metrics in ignored logs, recorded in the single journal. Pin package/lockfile; verify strict typecheck/Vite build, no remote resource calls, notice and bundle delta. A disposable isolated browser spike must demonstrate exact point paths, shared coordinates, focus, cancellation, section hits and StrictMode cleanup. Failure blocks broader migration; do not quietly add Plus or relax parity.

### 2. Add a bounded adapter module

Create only when code begins: `src/ui/schematic/diagram/logic/` for typed descriptors, projection sync, core constructors/lifecycle and event normalization; `.../components/` for the single React host. Exact aliases `@ui/schematic/diagram/logic` and `/components` expose named project-facing contracts; library types/instances stay private. Corresponding unit tests mirror these paths. `SchematicCanvas` composes the host with existing scene geometry/selection/analysis and screen controls; application/project provider behavior remains unchanged except the read-only revision getter on the existing import-session utility described below; no new state store/context/history/schema is introduced.

Only diagram/logic can runtime-import `@joint/core`; no deep `/src` imports. Test architecture denial from domain/storage/generators/Bindings/other UI and forbid a runtime re-export loophole. `scripts/check-architecture.mjs` and its tooling tests own the exact external-package exception; update registry/guideline docs with the first code change. No general UI dependency allowance.

### 3. Give the shared surface one explicit external host

Extend `SurfaceContent` with mutually exclusive SVG versus host modes, keeping current Bindings in SVG mode with unchanged render/renderScreen semantics. `WorkSurface` keeps shared controls, grid, surface bounds, middle pan/wheel, coordinate helpers and preferences. Host mode places one library-owned diagram container beside React-owned grid/screen SVG overlays in the same measured rectangle. Generalize element refs/input helpers only as needed to an Element with a bounding rect. Use one world↔screen conversion and `PX_PER_U`; no second Paper camera/grid/scroller.

The host component owns mount/dispose and input-sync effects because Graph/Paper are an external DOM system. Register exact effect files in the React guideline inventory when implemented. Synchronous Paper projection initially; freeze/batch only during one guarded sync, unfreeze before reveal. Stable IDs update existing cells rather than reset-all every drag. Preserve focus via existing `data-key-focus-id` and element identity; reveal only after the scene is ready. React never reconciles descendants of the Paper host.

### 4. Project geometry without inventing a circuit

Use shared cached analysis for crossings/issues; existing `getSchematicGeometry` for display-only diode offsets and paths; domain `getWireSections` for removable extents. Preserve current layer/hit priority: key art, conductors/bridges/ends, encoders, pins, then drafting/marquee and fixed-screen controls. Explicit domain refs connect projected section cells and controls to the starting Project. Library port/link anchors are presentation only; no inferred net/junction/selection group. Draw selective bridges from authoritative crossing refs with custom path projection, not global jumpover. Render all diode/encoder/control geometry from current helpers; do not recover domain positions from SVG bounds or Graph JSON.

The initial trusted React artwork conversion exceeded the paired performance gate. The adapter now constructs immutable core markup/attribute descriptors directly for keys, pins/diodes, electrical sections, endpoints, saved bridges and encoders. Geometry and descriptions retain the existing domain/formatting helpers and independent expected-coordinate tests. Native controls and transient overlays remain live React. The React DOM server conversion is replaced rather than relaxing acceptance limits; T047 removes replaced artwork paths after final parity. Final timing and bundle comparisons include the direct implementation.

### 5. Normalize gestures and commit once

Refactor only event plumbing in `interaction`: consume a small native input record (world position, pointer ID, modifiers, timestamp and typed hit) plus explicit capture/focus callbacks instead of fabricated React events or casts. Preserve existing placement/wire/selection/bend/rotation and keyboard policies. Paper/input views and native overlays forward to this one controller; disable default library model editing/magnet reconnection/tools. Stock tool batch stops never call commit.

A session captures accepted Project reference, the provider-lived project revision and adapter generation. Add side-effect-free getRevision() to src/ui/project/logic/import-session.ts, exposing its existing revision counter without begin(), request changes or invalidation. useProjectState already invalidates that counter synchronously on each accepted Project/session transition before setState; Undo→Redo increments it twice even if React batches rendering back to the same Project. Schematic composition supplies only a getProjectRevision callback to the adapter. Capture its value at gesture start and recheck it both on completion and inside the commit updater alongside Project identity. Keep local generation invalidation for workspace disposal and tool/read-only proposal changes; no effect watching Project identity is used as the sole ABA guard. Consume the session before completion dispatch; guard again inside provider updater. Dispatch one logical domain command or return current unchanged; pure updater reevaluation is permitted, without mutable session flags inside it. Drafts use the same pure geometry/domain operation without saving. Store selection in existing workspace state, not Graph. Detailed invariants and control dispatch are in [contracts/diagram-adapter.md](contracts/diagram-adapter.md).

### 6. Recovery, accessibility and cleanup

Core views preserve graphics-symbol key roles, roving tabindex, formatted labels/data refs and non-color states; delegate keyboard events to existing handlers so arrows do not double-pan. Keep native React crossing/rotation/corner controls and list alternatives with fixed-screen 24px targets. Disable incidental library focus stops; theme via existing semantic tokens. Retain current shortcut scopes/help and native text editing.

At the narrowly scoped external renderer boundary, convert known recoverable mount/update failures into diagram-unavailable feedback, detach listeners/capture and leave all accepted data/history/panels/save controls intact. Provide Retry diagram, rebuilding from latest accepted input. Unexpected domain/application errors remain outside that catch and reach the root error boundary. No background retry loop, empty catch or silently stale interactive scene. Disposal invalidates tokens, releases capture, cancels scheduled work and removes Paper/listeners; cleanup is idempotent.

Update affected onboarding targets in `src/ui/onboarding/logic/` and current journey tests during migration. If a target remains stable, record that checked evidence instead of adding duplicate targets.

## Verification strategy

Tasks will hold the single FR → task → assertion → journal evidence mapping. Tests first for newly extracted session semantics, any required domain extension and regression fixes. Reuse actual pure operations/provider; no tests that only assert Graph setter calls or duplicate implementation calculations.

- Adapter/session unit + real-provider integration: base/generation guards (including ABA), duplicate completion, pointercancel/lost capture, no-op/refusal, one save/history, selection/mixed cleanup, read-only preview, diagram failure/retry and mount cleanup.
- Projection assertions: independent known paths/artwork for rotations, fixed spines, diode terminals, encoder/push contacts, crossings/insulation and both halves; unchanged serialized Project and byte-identical generated baseline files.
- Production Playwright: actual host and native event paths for wire drawing, A–B–C movement, both sides of L crossing, corner editing, marquee/mixed deletion, GPIO, Rebuild/Apply/Cancel/topology, Undo/Redo/New/Open during a draft, focus and onboarding→actual ZIP. Include targeted Firefox/WebKit, both themes/viewports/reflow and network-disabled interaction. Preserve a Bindings regression for shared viewport/host changes.
- Performance/lifecycle: same-fixture same-environment paired baseline protocol, relative/absolute budgets and repeated mount/history cycles from quickstart. Measure final JS/CSS raw and per-file gzip byte deltas after cleanup at T048, against T002 baseline using the same Vite build/configuration; no claimed FPS or actual-paint measurement from wall-clock/animation-frame callback timings.
- Local implementation gate: explicit stage paths then `npm run check:changed`; full CI retains all suites. No product tests are required for these prose-only planning artifacts. No firmware build unless output changes; never claim manual screen-reader/OS acceptance from automated checks.

## Supporting artifacts

[Research](research.md) records package/source findings and rejected defaults; [data model](data-model.md) defines transient state; [adapter/UI contract](contracts/diagram-adapter.md) defines the boundary; [quickstart](quickstart.md) defines validation protocol. [Verification journal](verification.md) owns actual receipts. [tasks.md](tasks.md) was generated in the subsequent task stage and owns the requirement-to-evidence mapping; cross-artifact analysis precedes implementation.

## Decisions and uncertainty

Exact package and projection architecture resolved. Scope is whole Schematic scene with custom interaction policies retained; this is not a claim that stock JointJS tools replace all custom code. No schema/generator changes and no performance optimization speculative abstractions. ADR0023 partially supersedes dependency/presentation decisions only. Strict API integration and measurable rendered parity remain execution gates, not permission to expand scope. Later merges from PR29/30 require rebase/reconciliation before implementation. No remaining product clarification or architecture gate violation; the stage ends with design, without production installation or edits.
