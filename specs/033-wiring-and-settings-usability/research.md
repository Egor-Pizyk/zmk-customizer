# Research decisions — 2026-10-20

Repository inspection and a read-only wiring research agent informed these decisions; no external library research or dependency change is needed.

## Durable contacts

**Decision:** Schema v12 adds fixed-anchor contacts to existing wires. Endpoint references remain; additional contacts connect pin identities to a fixed spine point through orthogonal leads. Remove geometric pin inference in current-version analysis.

**Rationale:** `getKeyPinWires` currently derives pass-through membership from coordinates. `moveKeys` and `setKeyGeometries` change keys then prune insulation, losing those relationships. Fixed anchors retain shared buses when an intermediate key moves.

**Alternatives:** Splitting only at moving key endpoints moves the shared junction; a full independent graph duplicates much of the current model. Eagerly splitting every legacy wire can exceed existing wire budgets.

## One conductor geometry

**Decision:** Spine, anchored contacts and leads feed rendering, net/contact analysis, section queries and resource accounting through common pure geometry contracts. UI consumes shared project analysis, not a new electrical pipeline.

**Rationale:** A visible lead missing from analysis or an invisible logical connection would violate FR-013. Existing junction anchors currently project to the nearest path; durable pin anchors must instead remain on the preserved spine.

**Alternatives:** Extra export-only pin maps or independently computed SVG leads are rejected. Keep crossing insulation by wire pair/ordinal, but remap ordinals after splits using old crossing geometry/provenance; blindly retaining an ordinal can insulate the wrong crossing.

## Section fragments and compatibility

**Decision:** Allow stored conductors without direct key-pin endpoints, retaining disconnected fragments as repairable data. Drawing gestures retain attachment checks; section deletion changes only selected spans and obsolete references.

**Rationale:** `canAddWire`, current storage schema and `removeOrphanWires` currently assume each wire has a key endpoint; this would discard valid surviving branches. The owning 003 rules must change together with the v12 contract.

**Alternatives:** Deleting the whole drawn wire or whole net contradicts the user's explicit section choice. Raising resource limits without measurement is rejected. Zero-length migrated leads have no added visible segments; nonzero leads and fragments are counted. Old-file near-budget acceptance is mandatory.

## Completion and rebuilding

**Decision:** Completion preserves known axes/cells and all manual wiring; routing missing connections is distinct from replacement-oriented `routeWiring`. Rebuilding reuses 032 after its final merge.

**Rationale:** `getWiringCells` derives assignments from actual nets; there is no independent stored cell table to preserve. The current `routeWiring` removes entire managed routes. Reusing it unchanged for completion would silently replace user conductors. 032's pin allocator filters retained wires for rebuilding, so completion must reserve a broader retained set.

**Alternatives:** Copying the pending 032 implementation into 033 or storing export-only cell assignments is rejected. No shortest-path optimization or inferred hardware mapping is promised.

## Compact panels

**Decision:** One local editor host with base stacked / xl docked layout; reuse content/components/tokens. Keep Settings native-modal with compact bounded sizing. Keep Tools small and separate.

**Rationale:** Current Schematic renders Controller, Layout, Wiring, Encoders and Parts sequentially around the canvas, so combined panels can consume most of the workspace. Shared FloatingPanel also serves Bindings; changing it globally would expand scope.

**Alternatives:** New layout libraries, contexts, system-wide design tokens and unrelated workspace redesign are rejected. Narrow viewport acceptance is a scoped extension of the old desktop guideline, not a redesign of the whole product.

## Dependency evidence

As observed during planning, origin/main = ae00fec, 032 PR #13 remains open, dependency branch head = bc5ddac. 033's isolated worktree is main-based. Planning finishes without claiming 032 accepted/merged. Recheck final upstream state before implementation; do not poll CI or bypass 032's manual gate.
