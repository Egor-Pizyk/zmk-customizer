# Feature Specification: JointJS Schematic editor

**Feature Branch**: `feature/038-jointjs-schematic-editor`
**Created**: 2026-10-26
**Status**: Specified, planned and tasked; ready for cross-artifact analysis
**Input**: The owner requested the specification flow for adopting JointJS while preserving this boundary: Project remains the data source → the library displays an editable diagram → each completed gesture becomes an existing domain operation.

## Goal and scope

Replace bespoke Schematic diagram rendering and general diagram interactions with JointJS where it preserves the accepted editor behavior. Builders retain their wiring, geometry, saved files and project history without learning a second editor. Electrical meaning remains independent of diagram presentation.

**In scope**: Schematic diagram keys, diodes, encoders, contacts, conductors, crossings, controller markers, placement, selection, movement, rotation, wire creation and corner editing; synchronization with existing parts/layout/wiring editors, validation and onboarding; safe drafts and cancellation. Use open-source JointJS core for diagram rendering and applicable general interactions. Existing domain operations remain authoritative; extend them only when needed to express already specified behavior, preserving pure immutable contracts.

**Non-goals**: Migrating Bindings canvas; shell/panel/artwork/shortcut redesign; new user-created groups, collapse/expand, scan modes or component types; replacing net derivation, automatic matrix/GPIO selection, routing policy, storage, generators or history; JointJS+, paid examples, libavoid/WASM, backend, collaboration or runtime network services. Internal grouping may preserve existing composite parts and selection behavior without adding a saved grouping concept.

**Preserved contracts**: Specs 003, 008, 012, 013, 019, 032, 033, 036 and 037, including superseding amendments. In particular, 036 retains Rebuild wiring as the sole automatic UI action; Complete wiring is not restored. Preserve old and invalid/incomplete projects, stable identities, physical geometry, manual conductors, insulation, matrix/direct and unibody/split meaning, Undo/Redo, offline use, keyboard/table alternatives and deterministic ZMK v0.3.0 output.

**Owner-selected boundary**: JointJS is a replaceable presentation/interaction dependency. Project is the only committed keyboard state. Diagram changes are proposals until accepted by the domain and cannot directly update persistence, electrical analysis, export eligibility or project history. Library objects, events and internal history never become the project format or domain API. Exact APIs, adapters, version and placement belong to planning; this explicitly requested technology constraint is not a new product-side configuration option.

## User scenarios and acceptance

### US1 — Open and inspect the same keyboard (P1)

1. Given a saved project with rotated keys, diodes, controller ends, connected/insulated crossings and schematic encoders, when Schematic opens, then all parts, attachments, geometry and labels match the accepted project. Opening, selecting, panning, zooming and switching workspaces neither rewrite project data nor add history.
2. Given an old file or an invalid/incomplete circuit accepted by storage, then existing migration/validation rules apply, the same affected entities remain repairable, and the diagram does not normalize away manual routing, errors or disconnected surviving conductors.
3. Given changes through parts tables, numeric fields, New/Open, Undo/Redo or wiring proposals, then the diagram reflects the authoritative project or displayed proposal without duplicate/missing/stale entities. Bindings continues to show the same accepted physical layout and bindings.
4. Given an empty project, existing placement hints/tools remain available. Given an activated issue, its affected entity is selected/revealed with current text/shape feedback and an accessible description.

### US2 — Complete or cancel one coherent gesture (P1)

1. Given placement, drag, rotation, wire or bend editing, then the diagram previews the proposed result; completing the gesture accepts one domain edit and creates exactly one history step. One Undo restores the complete pre-gesture project and Redo restores the result. Selection, navigation and no-ops create none.
2. Given an active draft, when Escape or applicable pointer cancellation/lost capture occurs, then accepted project, autosave and history remain unchanged. Existing draft/dialog/tool precedence remains, including Key placement Escape returning to Select.
3. Given overlap, resource limits, invalid contacts or another domain refusal, then the entire edit is refused, the diagram restores accepted state and existing readable guidance identifies the cause. No failed partial edit survives only in the display.
4. Given project replacement, Undo/Redo, workspace exit or a newer edit during a gesture, then obsolete completion events cannot overwrite current data or resurrect removed parts. Drafts and selection references are cleared or reconstructed for the current project.
5. Numeric/keyboard alternatives and batch preview produce the same geometry, connectivity and atomic history as pointer editing. Own-center rotation, existing Shift snapping and slow magnetic snap from 036 remain unchanged.

### US3 — Draw and edit real conductors (P1)

1. Wire drawing retains pin-to-pin, pin-to-free/controller and supported junction connections, intermediate clicks, snapping, orthogonal preview and current eligibility rules. Passing through a pin during a wiring action captures its durable contact; no endpoint is silently reassigned to another pin.
2. Given a wire from A through B to C, independently moving/rotating each part preserves intentional contacts. Shared junctions remain fixed under 033 rules and unrelated routes stay fixed wherever possible. Merely moving a pin across another wire creates no new contact.
3. Connected/insulated crossings, collinear overlaps, self-crossings and multiple crossings retain existing electrical meaning and identity/cleanup rules. Bridges reflect saved insulation; visual routing cannot itself join/separate nets. Insulation stays with the corresponding crossing while it exists.
4. Every visible right-angle corner, including derived corners, retains 036 FR-008 editing: adjacent straight portions move while endpoints/contact anchors stay fixed, coincident handles appear once and obsolete waypoints do not return. Completion is one undo step; cancellation restores the old route.
5. Diode polarity/attachment and A/COM/B/SW contacts retain project-derived display, ownership and validation. Composite encoder/push switches never acquire duplicate displayed parts or independent conflicting geometry.

### US4 — Select and delete exactly the intended entities (P1)

1. Clicking a wire selects the current continuous conductor between adjacent electrical connection points, not an arbitrary geometric segment. Bends and insulated crossings do not independently split a section; both sides of connected crossings remain selectable.
2. Shift-click, marquee and list checkboxes retain 033/036 single/multiple/mixed key/section behavior, hit priority and marquee intersection rules. Bend selection highlights its whole wire; section selection retains its smaller scope. Dense/overlapping candidates remain individually available through the labeled list.
3. Delete/Backspace and list actions invoke existing atomic domain cleanup, retain surviving branches/controller assignments and refresh validation. Native text editing retains precedence. Stale/missing references or resource refusal produce no partial deletion.
4. Undo/Redo, reload and file round trip restore the same surviving geometry, contacts and electrical result. Selection remains transient, outside saved project data.

### US5 — Review proposals and save with confidence (P1)

1. Rebuild wiring, scan settings and topology changes display the existing domain proposal with retained/added/rerouted/removed feedback. The library cannot invent a different matrix/GPIO mapping or silently reroute accepted manual circuits.
2. Read-only preview guards, inspection, persistent summary/Apply/Cancel and topology round trips retain 033/036 behavior. Apply commits once; Cancel restores accepted state; external edits invalidate stale proposals.
3. Autosave, JSON, tables, matrix, issues, generated preview and downloaded files describe the same accepted project. Draft/refused edits never alter saved files or export eligibility. Opening and exporting an unchanged valid project preserves generated bytes; invalid wiring continues to block export.
4. A supported recoverable diagram capability failure, or guarded renderer DOMException named InvalidStateError/NotSupportedError, preserves accepted data/history, shows readable Retry diagram feedback and rebuilds from the latest accepted data. Existing project save controls remain available; uncommitted geometry is never presented as saved. Other thrown errors, including TypeError and application/domain invariant errors, retain existing root crash handling (download stored project/reload); this recovery promise does not apply to programmer-error crashes.

### US6 — Keep accessible, responsive and offline editing (P1)

1. All existing actions remain available through keyboard and labeled field/table/list alternatives, including wire creation, selection/deletion, insulation and controller assignment. Focus indicators, connection descriptions and non-color feedback remain; repaint does not unnecessarily steal focus. Existing deletion/cancellation focus return remains.
2. At 1280×800, 1440×900, 768×1024 and 390×844, both themes and 200% equivalent reflow retain current panel/canvas budgets, persistent preview actions, screen-size hit targets, low-zoom alternatives and reduced-motion behavior. Existing visual hierarchy/artwork is preserved.
3. After assets load, all affected operations work with network disabled, without CDN, remote assets, license services or telemetry.
4. A 100-key/several-hundred-wire fixture remains responsive without persistent missing parts or duplicate commits/listeners after repeated workspace entry, project replacement and Undo/Redo. Planning sets reproducible timing/lifecycle limits from the current editor baseline; upstream demos are not acceptance evidence.
5. Onboarding targets the actual usable controls and diagram operations. Its protected 3×3 journey, exit/restore and final export remain valid; changed targets/instructions are updated in the same implementation change.

## Requirements

- **FR-001**: Schematic MUST use open-source JointJS core for rendering and applicable general interactions with US1 parity; no paid extension or libavoid dependency is introduced.
- **FR-002**: Project MUST remain the sole committed state under the owner-selected boundary. Domain, storage and generators MUST remain independent of diagram-library models/runtime APIs (US1/US5).
- **FR-003**: Completed gestures MUST invoke authoritative domain operations; drafts, refusal, no-ops, cancellation and history MUST satisfy US2 without duplicate commits or saves.
- **FR-004**: Authoritative changes and lifecycle events MUST refresh the diagram and invalidate obsolete drafts/references under US1.3/US2.4.
- **FR-005**: Placement, movement, rotation, snap, overlap/refusal and keyboard/batch alternatives MUST preserve US2.5 and owning geometry contracts.
- **FR-006**: Drawing, junctions, durable intermediate contacts and connected-part movement MUST satisfy US3.1–2 independently of library geometry.
- **FR-007**: Crossings, insulation, overlap and crossing identity/cleanup MUST satisfy US3.3; visual bridge rendering cannot govern electrical meaning.
- **FR-008**: Corner editing, diode/encoder attachment and composite parts MUST satisfy US3.4–5 with stable identities and atomic history.
- **FR-009**: Selection, marquee, labeled alternatives and exact atomic deletion MUST satisfy US4, retaining surviving conductors and native text editing.
- **FR-010**: Rebuild and configuration previews MUST display authoritative proposals with US5.1–2 mutation guards/history. Library routers MUST NOT replace electrical or automatic-wiring policy.
- **FR-011**: Old files, invalid-project repair, persistence and deterministic export MUST satisfy US1.2/US5.3. Display events MUST NOT rewrite geometry. No schema change is expected merely for library adoption; demonstrated necessity requires an amended contract, migration and old-file tests before implementation.
- **FR-012**: Keyboard/focus, labeled alternatives, viewport budgets, themes, target sizes, low zoom and reduced motion MUST satisfy US6.1–2, including library-supplied handles.
- **FR-013**: Offline use, lifecycle cleanup, responsive editing and failure recovery MUST satisfy US5.4/US6.3–4 without data loss.
- **FR-014**: Onboarding MUST retain US6.5, updating affected targets, instructions and verification in the same implementation change.
- **FR-015**: Planning MUST record a pinned open-source version/license, needed core capabilities and paid-feature exclusions, baseline comparison and a new dependency/presentation ADR. Owning architecture/tooling rules change only for the accepted presentation boundary; domain purity and project history remain.
- **FR-016**: Implementation MUST provide requirement-linked browser/rendered and data/output evidence for US1–US6. Source inspection/library demos cannot establish acceptance. Record actual manual accessibility limits; unresolved parity failures block completion.

## Edge cases

Empty/invalid/legacy projects; dangling surviving sections; same-pin refusal and same-key short reporting; multiple wires on a pin; multiple crossings of one pair; overlap versus insulated crossing; moving a pin over an unrelated conductor; coincident handles; rotated key/encoder/linked push key; low-zoom hit priority; mixed marquee; Delete in fields; resource refusal; duplicate completion events; lost pointer capture; Undo/import during drag; unmount/remount; stale wiring preview; diagram failure during a draft; split/direct/GND and topology round trips; clipped lower panels; 200% reflow/reduced motion; offline bundled assets; onboarding spotlight/focus after repaint.

## Key entities

- **Authoritative project**: Existing serializable state, sole source for history, persistence, analysis and export.
- **Diagram projection**: Replaceable display of a project or isolated proposal; no second authoritative circuit or persisted library state.
- **Gesture proposal**: Transient edit tied to its starting project, accepted once by the domain or discarded completely.
- **Electrical section/contact/crossing**: Existing domain concepts, distinct from arbitrary library segmentation.
- **Selection/view state**: Transient selection and existing app view preferences, distinct from keyboard data.

## Success criteria

- **SC-001**: Ordinary, rotated, split, direct, diode and encoder fixtures retain identities, stored content, connectivity and unchanged generated bytes when opened/navigated without edits (US1/US5).
- **SC-002**: Each mutating gesture family demonstrates one accepted history step, exact Undo/Redo, zero writes on cancellation/refusal/no-op and rejection of stale completion after replacement (US2–US4).
- **SC-003**: Independent A–B–C movement, insulated crossings, both sides of connected crossings, mixed deletion and corner editing retain the expected electrical result after reload/file round trip.
- **SC-004**: Chromium and targeted Firefox/WebKit checks pass for migrated pointer/keyboard/focus interactions; rendered review covers every US6 viewport, both themes and reflow without unresolved acceptance failures.
- **SC-005**: Network-disabled editing and the actual onboarding 3×3-to-ZIP journey pass without remote/license services.
- **SC-006**: The 100-key/several-hundred-wire fixture and repeated workspace/project/history cycles meet the reproducible limits established in planning, with environment, input and measured comparison recorded.
- **SC-007**: Requirement → task → check → evidence mapping covers every FR; automated evidence and actual manual checks remain distinct and no adoption is declared complete while required parity remains unresolved.

## Assumptions and open questions

**Confirmed**: The owner selected JointJS and the Project → editable diagram → domain-operation boundary on 2026-10-26.

**Scope defaults**: Migrate Schematic as one coherent diagram surface, retaining existing tables/panels and Bindings. No new grouping UX, electrical-engine replacement, schema change, ZMK target change or visual redesign is intended.

**Planning decisions**: Exact core version/API/license coverage; custom interactions required for parity; projection/event/lifecycle ownership; routing integration and measured performance budgets. An ADR is required before production imports; this spec does not silently approve amendments to the current dependency registry/domain rules. No paid-feature fallback is authorized.

**Ordering**: The owner explicitly requested this additional feature while PRs #29 and #30 are open; use a separate branch from current main without absorbing their changes or creating a stack. Reconcile subsequently merged overlapping behavior before implementation. This is a new 038 directory, not reinstatement of the cancelled proposed stage; no earlier 038 directory exists. Release allocation is unspecified and does not rewrite the historical first-major schedule or mechanical/keycap roadmaps.

**Ownership**: This spec owns migration parity and the state boundary. Existing specs retain behavior ownership; changing their behavior requires amending those contracts rather than hiding changes in an adapter. No material product clarification remains; implementation design belongs to planning.
