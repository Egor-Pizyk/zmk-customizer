# Data model: disposable Schematic projection

## Persisted state

No Project schema change or migration. Keys, encoders, wires, contacts/anchors, wiring terminals, crossing references and bindings retain current schema v13 and stable identities. Existing storage owns all untrusted parsing. No Graph JSON, library IDs, port class instances, timestamps or interaction tokens are saved/exported. Preferences retain the current shared viewport and panel/tool preferences; no second camera or library preferences store.

## Adapter input and ownership

- **Accepted input:** Current Project reference, current project session identity, shared cached analysis, existing selection/tool/read-only state and viewport; supplied by Schematic composition.
- **Displayed input:** Accepted Project or the existing layout/wiring/gesture proposal plus that proposal's corresponding geometry/analysis. Displayed proposal issues must not replace accepted-project export eligibility or saved Problems state.
- **Projection descriptors:** Readonly UI-only records for key/encoder art, contacts/diodes, domain wire sections, markers and overlays. Geometry in u, rotation in degrees. Stable namespaced IDs prevent collisions between a key, encoder, section and decoration. Domain entity/section references are separate typed fields, never inferred by parsing a library-generated ID.
- **Library scene:** Mutable Graph/Paper/cell instances held privately by adapter lifecycle, created from descriptors. They own only presentation. No library type in shared surface/domain/storage/generator APIs.
- **Selection:** Existing `SchematicSelection`; section selection preserves its exact base Project. Native projected references map back to this type, never a competing graph-selection store.

## Gesture session (transient)

Capture the starting accepted Project reference, editor/session generation, pointer ID, source entity/section reference, relevant initial geometry and current normalized input. Also capture getProjectRevision() from the provider-lived import-session revision counter. Its new side-effect-free getRevision() getter only reads the existing revision; it never calls begin()/invalidate() or changes import request ownership. The existing useProjectState transition invalidation supplies synchronous revisions, including batched Undo→Redo. Use an adapter-local monotonic generation for disposal/tool/preview cancellation, not as the sole provider-transition signal; no time/random IDs or new saved fields. Duplicate/late completion after settling the generation is ignored.

State transitions: idle → draft → completed, cancelled or refused → idle. Project/session change or unmount invalidates the active generation even if Undo later restores the same Project reference (ABA protection). The token is consumed synchronously before dispatch. Dispatch at most one logical command/accepted transition per gesture through a pure commit updater guarded against both captured base identity and captured provider revision; either mismatch returns current unchanged. Recheck revision before dispatch too. Two transitions back to the same Project cannot restore an old revision. React may reevaluate that pure calculation, so execution-count assertions or mutable consumed flags inside the updater are forbidden. Consume only in the event session before dispatch. Read-only proposal blocks mutation at both input and completion boundaries.

Preview applies the existing pure operation to the captured base where appropriate, or renders the existing wire placement draft. Completion reuses the same intent/operation, not reconstructed Graph JSON. Refusal/no-op restores accepted geometry without persistence/history writes. Accepted commit changes Project through the ordinary provider only. Selection after accepted edits is resolved against the returned current Project.

## Projection lifecycle

Mount creates one Paper/Graph and listeners. Input sync updates existing stable cells and removes obsolete cells under a projection guard; preserve a focused surviving key and reuse its view where possible. View-only changes update transforms/ARIA/highlights without Project changes. Dispose invalidates gestures first, releases capture, cancels frames, removes listeners/Paper and clears references. React development mount-cleanup-remount must leave one live scene. Retry creates a new generation from latest accepted input, never stale graph data.
