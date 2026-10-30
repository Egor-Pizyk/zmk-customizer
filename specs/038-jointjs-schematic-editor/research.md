# Research: JointJS Schematic adoption

Date: 2026-10-26. Specification: [spec.md](spec.md). Research is source/API evidence, not rendered or performance acceptance.

## R1 — Dependency and package boundary

**Decision:** Pin `@joint/core` to **4.3.3**, the registry stable version checked on this date. Do not add `@joint/react`, Plus, a state library or libavoid. The published manifest declares MPL-2.0 and no runtime or peer dependencies. Preserve the package license/notice when distributing; do not edit upstream files. ADR [0023](../../docs/decisions/0023-jointjs-schematic-projection.md) scopes approval to the presentation adapter.

**Evidence:** Exact [published tarball](https://registry.npmjs.org/@joint/core/-/core-4.3.3.tgz), inspected manifest, types and source. Registry integrity: `sha512-cAOpWbeUZ1le9dIkWCIWNLkzJtCHbhkszJYklytMM1BnuLTVQW9ADuHRRVxT9HZHqye/NRgYtlYDmwgeSiNNFw==`. The unpacked 6,233,325-byte package size is not a production bundle measurement. Measure built/gzipped delta at implementation; retain npm integrity in lockfile.

**Alternatives:** `@joint/react@4.3.6` adds a separate state bridge, core dependency range and use-sync-external-store. It is unnecessary with existing React project ownership. React Flow/maxGraph require a different selected technology/model; libavoid solves routing rather than this migration.

## R2 — Controlled imperative projection

**Decision:** React owns a single host container and adjacent controls; one core Graph/Paper owns that container's diagram subtree. Graph is disposable. A one-way sync projects the displayed Project plus view/selection/analysis into stable cells. Do not subscribe graph change events to project commits. Disable default editing (`interactive: false` and non-magnetic attachment visuals); use normalized pointer events and existing gesture operations. Synchronous rendering initially avoids asynchronous focus/readiness races. Model updates during projection are tagged/guarded; they are never user edits.

**Evidence:** [React integration](https://docs.jointjs.com/learn/integration/react/), [Paper](https://docs.jointjs.com/api/dia/Paper/). Core supports Graph/Paper, custom markup, cell views, freezing/batch projection and pointer events. Use definition/factory APIs rather than authored subclass declarations to preserve the local no-classes convention. Third-party class instances stay in adapter-local refs and never enter Project/React context/public domain types.

**Tradeoff:** Reuse existing specific gesture reducers and accessible overlays rather than maximizing stock-tool use. The benefit is consolidated diagram rendering/hit views/lifecycle; adopting a library does not justify discarding verified electrical and editor policies. Remove replaced JSX scene rendering after parity, not the still-required geometry or interaction contracts. No permanent dual editor or feature switch.

## R3 — Stock tools are not parity

**Decision:** Use custom pointer-captured corner/rotation controls preserving current behavior, not unmodified stock Segments/Vertices tools. Normalize mouse/touch/pointer cancellation before gesture completion. Keep native keyboard/list alternatives and existing marquee selection.

**Evidence:** Published `src/linkTools/Segments.mjs` and `Vertices.mjs` mutate graph vertices during dragging. SegmentHandle maps touchcancel to pointer-up/batch completion. Handles lack the required keyboard/ARIA contract; default Segments controls have 20×8 dimensions, built-in colors and mid-segment placement. These do not satisfy 036 FR-008 square-corner semantics, deduplication or 24px target rules. [Link tools](https://docs.jointjs.com/api/linkTools/). [Selection](https://docs.jointjs.com/learn/features/selection/) explicitly belongs to JointJS+, so keep existing selection/marquee policies.

**Alternative:** Feeding raw stopBatch/change:vertices events to project history would make cancellation and one-step history unsafe. Custom core tools remain possible later only if normalized input preserves this contract and does not require local subclass/cast exceptions.

## R4 — Geometry and electrical sections

**Decision:** Display exact authoritative points, with no library auto-router, automatic junction detection or global jumpover connector. A projected wire section is a presentation cell with a reference to its base Project and domain section ID; multiple sections can refer to one wire. Preview spine/diode lead/bridge geometry comes from existing helpers; points are projected without re-solving electrical relationships. Library endpoint anchors are not stored contacts.

**Evidence:** Existing `getWireSections`, `getWirePath`, `getSchematicGeometry`, `getWireBendHandles` and shared `getProjectAnalysis` already describe the required geometry/meaning. [Link anchors](https://docs.jointjs.com/api/linkAnchors/) can place an endpoint by ratio/closest point on a line; that can slide when geometry changes and does not establish durable key-pin identity. Built-in [jumpover](https://docs.jointjs.com/api/connectors/) is a geometric connector, not selective per-crossing electrical insulation.

**Alternative:** Manhattan routing could alter a pass-through contact or overlap, so it is excluded from accepted-data projection. Point-based links/custom path markup and explicit vertices preserve actual paths. A projection correctness test must compare visible path geometry against independent expected points, not just cell counts or a mocked renderer.

## R5 — Shared surface and accessibility

**Decision:** Add an explicit external-host mode to the shared surface contract. Keep one viewport/preferences/zoom/pan/grid owner, with the existing SVG path retained for Bindings. JointJS owns only the Schematic scene, not the shared shell or preference state. Fixed-screen crossing buttons, rotation controls, draft/marquee layers and native controls remain React-owned siblings/overlays. No React reconciliation of the Graph/Paper subtree.

**Evidence:** Current `WorkSurface`, `SurfaceSvg`, `useSurfaceViewport` and `SurfaceContent` embed world and screen layers in one React SVG. Paper needs its own host/subtree; mounting an independent viewport would break coordinate conversion and shared canvas preferences. Existing keys use graphics-symbol roles, roving tabindex, `data-key-focus-id` and current formatting; preserve those semantics in projected key views and native event forwarding. Focus existing IDs after synchronous projection; do not focus detached views or the paper's incidental internal nodes.

## R6 — Failures and policy reconciliation

**Decision:** Recover only classified failures at the external renderer-call boundary by disposing the scene, retaining accepted Project/history and exposing Retry diagram plus existing save controls. Retry rebuilds only from current accepted input. Domain/application programmer errors still reach the single root error boundary. No generic swallowing catch, new React error boundary or fallback second editor.

**Rationale:** Spec US5.4/FR-013 requires saveable data and display reconstruction, while current observability rules permit catches only around I/O/browser calls. Scope a third-party renderer boundary in the owning guideline/ADR; do not reinterpret it as permission to catch domain errors. Register the adapter mount/projection effects in the React guideline and corresponding inventory when those files actually exist.

## R7 — Performance and baseline

**Decision:** Use `tests/fixtures/schematic/large.json` (100 keys/300 wires), ordinary 3×3 and rotated/split/encoder fixtures. Benchmark unchanged base and implementation with the same production build, isolated browser/container, viewport and deterministic gestures. Retain relative and absolute gates in [quickstart.md](quickstart.md); capture baseline before replacing the scene. Do not promise upstream or synthetic libavoid timings for this editor.

An isolated production baseline was subsequently captured on the exact base SHA; see the journal receipt. Warm navigation median is 701.39ms; five accepted keyboard nudges median 161.99ms. These include automation overhead and are not frame durations. Existing live containers mounted other checkouts and were deliberately excluded. Implementation must rerun a paired base measurement in its own fixed environment before comparison; missing/regressed measurements block adoption rather than being marked passed.

## Analysis remediation — 2026-10-26

I1: use a read-only getRevision() getter on the existing provider-lived import-session revision, not begin() or effect-only Project comparison; preserve import request ownership and test batched ABA. I2: recoverable failure classes are now explicit in the spec; programmer crashes retain root recovery. I3: final bundle cost is measured at T048 after scene integration/cleanup, separately from package installation. I4: quickstart defines native-event-to-second-frame sampling and full application long-task budgets, with no unsupported actual-paint or renderer-only attribution. These are design decisions, not executed migration checks.
