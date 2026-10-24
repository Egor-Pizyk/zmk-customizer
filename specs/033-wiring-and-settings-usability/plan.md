# Implementation Plan: Wiring and settings usability

**Branch**: `feature/033-wiring-and-settings-usability` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

## Summary

Replace geometry-only intermediate-pin membership with explicit durable contacts in Project schema v12. Keep the existing wire model, adding fixed contact anchors and orthogonal leads rather than introducing a second electrical graph. Derive selectable conductor sections from the same geometry used for analysis/rendering; deletion materializes surviving fragments. Add incremental completion beside explicit rebuilding, preserving actual existing nets. Consolidate Schematic editors into one responsive non-modal panel host and give Settings bounded native-dialog scrolling.

## Relevant context

- Startup/product rules: `AGENTS.md`, `docs/{product,principles,workflow,agent-rules}.md`, `.specify/memory/constitution.md`.
- Ownership and dependencies: `docs/{architecture,folder-structure,repository-map,tooling,domain-model}.md`, `tsconfig.json`.
- Delivery and evidence: `docs/guidelines/git-flow.md`, `docs/{testing,commands}.md`.
- Implementation: `docs/guidelines/code-quality/{typescript,control-flow,observability}.md`, `docs/guidelines/code-quality/naming/{functions,variables}.md`; `docs/guidelines/frontend/{react,accessibility,admin-ui,tailwind}.md`; `src/styles.css`.
- Contracts: `specs/002-project-foundation/contracts/project-file.md`, `specs/003-schematic-switches-wires/{spec.md,contracts/project-schema.md,contracts/ui.md}`, `specs/013-matrix-wiring-editor/contracts/wiring.md`, `specs/001-app-shell-ui/contracts/ui-regions.md`.
- Dependency 032: its spec/verification and `assign-auto-pins.ts`, `get-retained-wires.ts`, `get-output-position.ts` on `origin/feature/032-project-creation-and-auto-wiring`. These are absent from this main-based checkout until 032 is integrated. Re-read final merged contracts before code.
- UI guidance: project-local `docs/workflow.md` in the original workspace; accepted search results/limitations are recorded in spec.md. Reuse installed skill without adding its untracked files to 033. For future changes, follow the current UI/UX workflow in docs/workflow.md.
- No ZMK syntax/catalog changes are planned. If generator syntax changes become necessary, first load `docs/zmk/README.md` and the relevant pinned reference pages; amend tasks and independent output fixtures.

## Technical context

Existing TypeScript 7, React 19, Tailwind 4, Zod trust boundary, SVG canvas, Vitest/Playwright, Node 24/Docker. No runtime packages added. One immutable serializable Project; pure synchronous domain operations. Existing resource limits: 512 keys, 600 wires, 64 bends per wire, 3000 segments, 8192 insulation refs and 5 MiB files. Keep limits unless measured evidence and an explicit owning-policy change justify another bound. Migration cannot silently lose contacts to fit a limit.

## Scope and preserved contracts

Implement FR-001–FR-013 and US1–US4 only. Retain user-confirmed incremental completion and section multi-selection. Existing operation kind `auto` remains the full-rebuild implementation route; UI labels become Complete wiring/Rebuild wiring. Other wiring edits do not implicitly allocate GPIOs. Export remains based on domain-derived actual connectivity; generators do not learn a parallel mapping. Selection/panel state remains transient, outside history/project schema. App Settings remains modal. Tools remain a compact canvas control, not a second expanded editing panel.

### PR #15 test/CI maintenance (2026-10-21)

Preserve all product, schema, export, keyboard and history contracts. Consolidate the
duplicate maximal legacy-bus migration into the existing near-byte-budget round-trip
test, retaining its contact-pool assertions and existing 60-second stress-test limit.
Fix the moved rotation mutation test path and validate registered test files as well
as production anchors. Retain the complete Chromium layer-bar viewport/theme matrix;
use one representative Firefox/WebKit case for native overflow/focus/history rather
than repeating that full presentation matrix in each engine. Keep retries disabled.
Run CI once per PR to main and cancel obsolete revisions. Follow-up owner decision
on 2026-10-21 moves firmware compilation to local make zmk-build; CI and protected
required checks retain check/e2e/image/mutations. Push triggers remain disabled.
No product code or UI changes; UI design/review and firmware syntax changes are outside
this maintenance scope. T031 manual acceptance remains open and prevents merging 033.

## Constitution check

Before design: compatible with pure domain, static/offline, no new dependency, deterministic output, explicit errors, keyboard alternatives. Compatibility requires a v11→v12 migration and historical-file tests, not a current-schema reinterpretation. Tests precede domain/storage implementation.

After design: no layer exception/new context is required. UI reads shared `getProjectAnalysis`; new electrical engine code remains unavailable directly to UI. UI-safe section geometry/edit contracts are explicit public exports. New groups receive exact aliases/indexes only when populated. Existing 003 key-endpoint/orphan rules must be amended before changed code. 033's narrow panel acceptance extends the former desktop-only design boundary for these surfaces; update the owning frontend guideline with that narrow exception, retaining base/`lg:`/`xl:` conventions and existing tokens. No principle waiver.

## Design and ownership

### Durable contact geometry and storage

`src/domain/types.ts`: schemaVersion 12; Wire gains optional `contacts` array of `{ keyId, pin, at }`. `at` is a fixed point on the wire's spine, not a nearest-path suggestion. Endpoint pin references remain; contacts record only additional pin attachments. A contact's spine point stays fixed when its pin moves; its lead is orthogonal and follows that pin. Preserve all anchors in route order even when an original endpoint key moves. Never recompute pin membership from arbitrary overlap after migration.

`src/domain/wires/`: add `get-wire-conductors.ts` as the common spine/lead geometry query, and `get-wire-sections.ts` as a UI-safe section query. Extend `get-wire-path.ts` for fixed anchors; `get-key-pin-wires.ts` uses endpoints/contacts only. `wires/nets/get-nets.ts`, half resolution, crossings, current-flow, resource accounting and rendering must consume the same conductor representation; omit zero-length leads from hit geometry but retain their logical contact. Contacts on diode pins use existing pin identity/polarity, not a second diode model.

`src/domain/wires/editing/add-wire.ts` and wiring actions capture pass-through contacts while creating/editing wires, using the legacy 0.0001u point-on-path tolerance. Drawing retains connected-by-default wire crossings and existing insulation controls. Key transforms do not capture new contacts. Route/move proposals compare intended versus resulting pin/terminal partitions, retain valid insulation and refuse accidental shorts/detachment or resource overflow. All move/rotate/resize entry points, including previews and multi-key operations, use the same domain repair path; invalid geometry cannot commit through a field alternative.

`src/storage/project/` owns parsing and strict reference validation; `src/storage/migrations/migrate-v11-to-v12.ts` owns legacy shape parsing. Freeze the v11 shape under storage, validate before calling typed pure contact capture, retain every pre-migration logical pin/net relationship, add contacts deterministically in key/pin order, and migrate stepwise from v1. A future-version file still refuses before migration. Relax “every wire has a key-pin end” for stored conductor fragments; UI creation still requires attachment to the existing supported circuit/pin gesture. Orphan cleanup removes invalid references, not surviving electrically meaningful fragments. Free fragments can be stored and yield repairable validation issues.

Details and invariants: [data-model.md](data-model.md). Contact count is bounded by existing key/pin cardinality per wire and file size. Zero-length migrated leads do not expand the segment budget; moving/leads/splitting must preflight aggregate effective segments and wire counts. If an old valid file cannot fit the proposed new representation, implementation must revise the representation/budget design with measured fixtures before claiming migration success; refusing previously supported files is not an accepted shortcut.

### Incremental completion

`src/domain/wiring/editing/complete-wiring.ts` composes existing derived cells, physical-center candidates and 032 allocation. Preserve each known row/col independently (including partially known cells), existing rowPin/half/diode direction and manual conductors. Fill missing axes from candidate grouping; reject occupied/ambiguous candidates rather than shifting existing cells. Extend terminal arrays in stable existing order without renumbering known axes. In direct mode retain known input indices and allocate candidate input indices only when free.

Add `complete` to `WiringEdit`; keep `auto` for rebuilding. Completion cannot call replacement-oriented routeWiring over retained buses. Add `route-missing-connections.ts` to connect missing endpoints to compatible retained nets/terminals with deterministic attachment priority: existing matching terminal endpoint in project order, then compatible conductor attachment in wire/path order. Stable key/pin order processes missing connections. Preserve existing coordinates and IDs; allocate IDs losslessly with existing allocator. Insulate new unrelated crossings, reject collinear overlaps with unrelated nets, then verify actual partitions and board occupancy. No-op returns the original Project reference.

Reuse 032 free-pin/output helpers after its merge, but make pin reservation accept all completion-retained conductors; its rebuild-only retained-wire filter must not release occupied manual pins during completion. Missing output placement uses 032 outward geometry. A failed partial route returns a failure value without any partial Project. Preview summary derives retained/added/rerouted/removed sections and affected entities through a pure domain query; no electrical inference in JSX.

### Section selection and deletion

A section is a continuous spine or lead portion between adjacent electrical points, not one SVG straight segment. Derived section refs include owning wire, spine/lead identity and bounded path interval; they are valid only against their immutable base Project. Resolve collinear overlap into a shared geometric section with all contributing wire spans, so deleting a highlighted shared conductor removes its contributors once. Distinct insulated conductors remain separate; list endpoint/owner names disambiguate them.

`src/domain/wires/editing/remove-wire-sections.ts` validates refs, splits each affected conductor once, preserves surviving branch endpoints/contacts/controller assignments, remaps junction and crossing refs, and frees only attachment ends whose selected conductor is gone. Allocate replacement IDs deterministically, retain original ID on the first surviving fragment, and refuse atomically if splitting exceeds resources. Repeated/overlapping selection is deduplicated. `remove-wire.ts` remains whole-wire editing where already explicitly exposed; section Delete never calls it as a substitute. Key deletion retains 003's intended surviving connectivity while using the new fragment-safe cleanup rules.

`src/ui/schematic/interaction/` extends SchematicSelection with a section-only multiple selection; preserve existing key multi-selection but make marquee select keys only, avoiding current mixed key/wire destructive behavior. Hit testing selects exact derived sections; Shift toggles, Escape clears, pin/insulation controls retain priority. Guard against stale refs after history/import/project replacement by matching base identity. Add `PartsWireSectionsTable` under `parts/components/` with roving checkbox selection and labeled endpoints; keep existing endpoint/pin repair controls. `rendering/components/` draws section extent/endpoint indicators with existing semantic tokens and usable hit targets. Shared shortcut help documents section commands; text fields keep native shortcuts. Focus after deletion goes to the next surviving row/section, otherwise canvas.

### Panels and Settings

`src/ui/schematic/components/schematic-workspace.tsx` owns one active editor identifier and collapsed/open state through workspace logic. A new local `schematic-editor-panel.tsx` composes existing Layout/Wiring/Controller/Encoder/Parts content without a new context. Editor content uses composition slots rather than >2 levels of prop forwarding. One tablist/launcher provides named controls; empty selection shows a compact hint. Explicit opening switches panels; a wiring preview keeps its own summary/actions reachable and requires Apply/Cancel before hiding that proposal (switching editors cancels the uncommitted proposal). Existing field drafts commit/cancel through their existing handlers.

Keep app shell landmarks/status bar unchanged. Base layout stacks canvas/panel; `xl:` docks the editor. CSS sizing uses named component sizing utilities defined in `src/styles.css` for min/max percentages and viewport margins when default utilities cannot express the specified budget; retain existing colors/type/control sizes. Do not add generic spacing tokens or inline visual styles. 1024px remains a required project viewport in addition to US4. At desktop 360px/35% cap and >=60% canvas, narrow <=45% panel and >=50% canvas are measured inside workspace content after shell chrome; toolbar/tabs fit the remaining budget. Parts tables scroll internally.

Reuse `Dialog` with a compact size variant scoped to Settings, retaining native showModal/Escape/focus return and other dialogs' existing sizes. Do not modify shared FloatingPanel/Bindings behavior just to dock the Schematic editor. Panel close/collapse/reopen focus is implemented in event handlers, avoiding new effects except where an external browser system actually requires synchronization; update the React effects inventory if needed.

## Verification strategy

Tests-first reproduces disappearing intermediate connections and overbroad deletion independently. Frozen input fixtures state expected pin-pair partitions/cells without computing expected values from new helpers. Add v11 intermediate/insulated/near-budget fixtures and all historic migrations; validate malformed contacts, dangling refs, future version refusal and failure preserving current project. Compare pre/post migration nets and independent exported GPIO/RC expectations.

Unit permutations cover matrix/direct, both diode directions, unibody/split, partial axes, retained manual/encoder occupancy, duplicate cells/pins, no-op, capacity/routing refusal, section bends/junctions/overlap/insulation, repeated selection, resource limits and every key transform. Golden output tests use existing independent expected files; no fixture regeneration from implementation.

Browser journeys in `tests/e2e/wiring-usability.spec.ts` use real drawing/moves, section pointer and list keyboard deletion, preview/Apply/Cancel/history/reload/import, validation and actual JSON/ZIP downloads. Add `tests/e2e/schematic-panels.spec.ts` for viewport budgets, both themes, collapse/close/scroll/preview reachability and 200% effective layout. Target Firefox/WebKit for SVG hit selection, transform and native dialog focus. Full Chromium is required; changed cases run three sequential times without retries. Isolated controlled sensitivity seeds must fail saved-net/section deletion/canvas-budget assertions, then restore exact bytes.

Completion: `make check`, Docker production build, `make test-e2e`, changed scenarios three times; `make zmk-build` because exported geometry/connectivity paths are affected. Manual keyboard/VoiceOver Safari, OS theme/reduced-motion and actual zoom evidence remain mandatory and distinct from automation. Review rendered results against the specification and current project UI/accessibility guidelines. Record actual commands/results/limits in verification.md; only tasks.md owns requirement coverage.

## Supporting artifacts

[research.md](research.md), [data-model.md](data-model.md), [contracts/wiring-interactions.md](contracts/wiring-interactions.md), [quickstart.md](quickstart.md). Dependency-ordered work and the single requirement mapping live in [tasks.md](tasks.md).

## Decisions and uncertainty

Chosen contact anchors over a new node/edge graph or split-at-key endpoints: preserve shared routing positions with less model churn. New schema v12 is intentional compatible upgrade. Section fragments are allowed without direct key endpoints; validation must keep disconnected circuits repairable. No arbitrary graph editor/shortest-path router is introduced.

Feature 032 merged as 21c5867; v0.1.0 is published and user manual acceptance is recorded. T001 integrated that baseline. Re-run feature resolution against this integrated checkout before implementation.

Representation refinement before implementation: omitted contacts means no intermediate attachments, equivalent to an empty array; v12 never infers missing contacts from geometry. This avoids adding empty arrays to every wire/fixture while retaining strict contact validation and v11 migration capture.

Fixed-spine representation refinement: wires with captured contacts additionally persist optional anchors `{start: WirePoint, end: WirePoint}` containing the original spine endpoints. These two points plus existing bends preserve the original conductor without duplicating all bends or expanding migrated wires. Endpoint pins can move through orthogonal leads to those fixed points. Every contact must lie on that anchored spine; contacts require anchors. Deletion fragments retain fixed anchors, even when they carry no intermediate contacts, to avoid moving a surviving junction when its key moves. Anchors are finite points, created on wiring capture/migration or section materialization, and removed with their wire.

Section deletion requires an immutable base Project argument equal to the edited Project; stale bases refuse before resolving IDs. Shared coincident sections carry all contributor spans, and their selection removes those contributors together.

Panel implementation refinement: retain existing disclosures and use native named details (`schematic-editor`) for one expanded editor rather than adding parallel tabs/state or duplicating forms. Workspace composes one bounded host; open/collapse state is transient in that host. Controller selection and layout actions remain compact within it. A reveal-issue listener reopens it for repair navigation; the React effect inventory records that external document subscription. No new context or dependency.

Implementation ownership refinement: small geometry queries live in `wires/geometry` so resource budgeting never imports editing through `wires`. Existing routing is extended with `retainAllWires` rather than duplicating a route-missing implementation. Raw manual GPIO nets are resolved to the unique intended terminal before reserving pins; ambiguous nets refuse. Diode flow supplies a missing row pin, and incompatible retained diodes refuse. Contact-preserving bend edits refuse when anchors would leave the spine. Section queries normalize collinear bends and describe key/pin and GPIO endpoints. Migrated wires preserve every attachment via the shared coordinate pool and per-wire contactIds documented in data-model.md.

## Main integration — 2026-10-21

T034 reconciles this feature with merged maintenance/dependency PRs without product edits. Preserve main’s parallel browser matrix, trusted coverage-comment workflow, selective staged-check hook and updated dependency lockfile; remove only CI firmware compilation and push triggers per the earlier owner instruction. Keep the four protected status names and check aggregation over every remaining suite. Use the normal staged-snapshot check (includes all Chromium journeys/full units for this global merge) and focused YAML invariants. The current explicit ready/auto-merge instruction supersedes this PR’s prior draft-only stop; T031 stays open with manual limits disclosed.

Integration inspection found two browser mutation registrations incompatible with 033: the cancelled-value anchor became ambiguous and the saved-preview anchor disappeared. Retarget these two probes to current code while preserving the existing toHaveValue/toEqual assertions; validate every browser seed has a unique source anchor. Run the two affected real-browser baselines and isolated seeds separately, with exact byte restoration, since a newly retained CI job now requires these registrations. No product source change is needed.
