# Contract: Schematic diagram adapter

## Inputs and exposed operations

Schematic composition supplies accepted/displayed Project references, provider commit/announce callbacks, cached analysis, typed domain geometry/section refs, existing tool/selection/read-only state and shared viewport and a side-effect-free getProjectRevision callback. Host exposes mount/sync/dispose/retry and normalized pointer/focus intent callbacks through project-facing types only. No public JointJS class/model type, Graph JSON, independent store/history, direct storage call or domain analysis pipeline.

All domain-changing callbacks use the existing provider updater. Projection-only Graph changes are ignored for application mutation purposes, even if emitted during sync. Stable IDs are explicitly namespaced; section refs contain their domain ID/base Project. Different IDs such as key k1 and encoder k1 cannot collide. No library-generated ID leaks into keyboard data.

## Projection invariants

1. Exact source geometry governs the display. Point paths preserve endpoints, orthogonal bends, anchored spines, intermediate leads and diode display-only terminals. No automatic anchor/router, pin snapping, jump-over connector or link-to-link adjustment creates a new circuit.
2. Displayed wire-section cells map to `getWireSections` output, not library polyline segments. Insulated crossing bridges correspond only to saved crossing pair/ordinal refs. Preserve deduplicated corner controls, crossing/section hit priority and native screen-space controls.
3. View-only transforms/preferences update the scene without changing Project. Accepted data and displayed layout/wiring proposals remain distinct. Invalid data is drawn as repairable data, never silently normalized to library defaults.
4. Stable cell updates preserve focused surviving key views. Root name/count, graphics-symbol semantics, roving tabindex, `data-key-focus-id`, accessible descriptions, selected/conflict non-color states and issue/onboarding targets remain equivalent to the existing editor. Internal decorative nodes and ports add no accidental tab stops.
5. One coordinate owner: shared PX_PER_U, pan/zoom and bounds. Paper mirrors the shared transform; no second camera, grid, pan listener or preference persistence. Bindings remains in the original SVG mode.

## Gesture dispatch and cancellation

| Intent | Existing owner / operation family | Completion |
| --- | --- | --- |
| Place key / encoder | existing placement eligibility + addKey / addEncoder | eligible click or keyboard action once |
| Move single/multiple keys | moveKey / moveKeys through current layout policy | captured pointer release once |
| Move/rotate encoder | replaceEncoder through current transform policy | captured release once |
| Rotate keys | existing layout/rotation operations and snap controller | captured release once |
| Wire click-click/free end | current wire draft reducer + addWire | valid explicit terminal/free-end completion |
| Corner drag | getBendDragBends + setWireBends, current resource checks | captured release once |
| Crossing/diode/GPIO controls | existing named domain operation behind native control | activation once |
| Mixed deletion | existing section resolution + atomic key/section cleanup | Delete or list action once |
| Selection/marquee/view | existing workspace/preference handlers | no project history |

Input record contains typed hit, world position, pointer ID, timestamp and modifier state plus explicit capture/release/focus callbacks. Do not fabricate React SyntheticEvent objects or cast library event payloads. Read only needed primitives from the supported event type; guard unknown attribute IDs through the current reference map.

Start captures Project reference, getProjectRevision() and current adapter generation. getProjectRevision reads the existing import-session revision via a new getRevision() getter; it must never call begin(), invalidate() or change import request IDs. Existing provider transition invalidation runs synchronously even when React batches Undo→Redo into one render. Compare captured revision before dispatch and inside the updater alongside Project identity. Test both transitions in one React batch before any adapter effect runs, and prove an in-flight import is not superseded by starting/cancelling a gesture. A synchronous consumed flag prevents duplicate completion; generation invalidation prevents ABA after Undo→Redo. Updater checks current identity again. Cancellation/lost capture/touchcancel invalidates before release cleanup, so a later pointerup/batch event cannot commit. At-most-once means one logical command/accepted transition, not a ban on React reevaluating a pure updater. Consume only before dispatch, never inside the updater. No-op/refusal preserves exact object/history/save behavior. Read-only preview blocks every mutation dispatch at input and completion, while retaining allowed inspection.

## Lifetime and recovery

React owns the host; Paper exclusively owns its descendants. Mount creates one scene; sync effects write only to external renderer state. Cleanup removes all Paper/native listeners, capture and scheduled work and invalidates generations before disposing. Test development mount-cleanup-remount and at least 25 workspace/project lifecycle cycles with one scene/listener set and no duplicate domain dispatch.

Recoverable third-party renderer-call failures (supported capability failure returned as a value, or a DOMException named InvalidStateError/NotSupportedError from the guarded external call) disable diagram input, show a readable diagram-unavailable message and Retry diagram, retaining accepted Project/history and existing save/table controls. Retry disposes/remounts from the latest accepted input without a commit. A second failure stays visibly failed; no automatic retry loop. The unavailable host declares a generic canvas-input-disabled marker so shared canvas shortcuts are blocked; table/Save/global history controls remain available. Successful explicit Retry restores canvas focus when focus remains within that surface. Other thrown errors, including TypeError and application/domain invariant errors, still reach the single root boundary; never wrap domain calls in renderer recovery. The owning observability guideline defines the exact permitted boundary.

## Compatibility and evidence

No schema/old-file format change. Display-only activity leaves serialized Project and generated baseline bytes identical. Real-library browser tests cover focus/native events and actual SVG paths; mocked Graph setters alone are insufficient. UI styling stays in existing semantic tokens; fixed-screen targets are at least 24px. Record checks under the single verification journal; tasks will link FRs to these assertions.
