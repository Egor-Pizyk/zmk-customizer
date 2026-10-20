# Data model — schema v12

## Persisted Project / Wire

Project remains one plain immutable JSON value. Change `schemaVersion` from 11 to 12. Existing keys/wiring/terminals/layers/encoders remain their owning features' contracts.

Wire retains `id`, `start`, `end`, `bends` and gains required `contacts`: a readonly array of `{ keyId: string, pin: 1 | 2, at: WirePoint }`.

- `keyId` references an existing key; `pin` is exactly 1 or 2.
- `at.xU` / `at.yU` are finite coordinates under existing point bounds. The anchor is a required point of the spine and stays fixed during key transforms.
- One contact per key/pin per wire; endpoint pins are not duplicated in contacts. Contacts may share one geometric anchor, but must remain distinct pin identities.
- At most two contacts per project key on a wire; file-size/aggregate processing budgets also apply. No extra free-form contact ID or global mutable counter.
- Explicit endpoint pins and contacts define pin membership; arbitrary pin/path coincidence does not add membership after migration.
- Leads connect each anchor to its current pin with orthogonal geometry. Zero-length leads remain logical attachments but are omitted from drawable sections/segment cost. Every nonzero lead counts toward effective geometry budgets.
- A wire may have free/junction endpoints without a direct key endpoint. Unknown/dangling key/wire/terminal references are rejected with a precise storage issue path; disconnected electrically invalid fragments load and produce domain issues.
- Junction/crossing representation is retained. Splitting/removal remaps target wires and geometric crossing provenance before deriving new ordinals. No removed-wire references survive.

## Migration

Validate frozen v11 input in storage, then capture every legacy geometric key-pin membership using existing 0.0001u tolerance and stable key/pin order. Preserve explicit endpoint refs; store remaining contacts at their old pin positions. Keep wire IDs, geometry, settings and all intentionally connected/insulated net relationships. No eager wire expansion. Older files follow their existing v1→…→v11 steps then v12; newer versions refuse unchanged. Serialization remains schema-ordered JSON plus newline. Migration never overwrites a failed import/current project.

The resulting current schema uses strict nested objects and existing resource limits. Test both valid and electrically invalid legacy circuits and near-budget files. If a representation causes a formerly valid file to exceed limits, revise the design with evidence; do not silently truncate contacts or waive compatibility.

## Derived conductor sections

Sections are not stored in Project. A section ref consists of base-project identity (held by UI), wire ID, conductor kind (spine or a named contact lead), and ordered start/end path offsets. Domain resolves them to geometry and endpoint descriptions. Invalid/stale refs refuse or clear selection rather than targeting a different current section.

Section boundaries: key pins, contact anchors, connected junctions/crossings and free/controller endpoints. Bends/insulated crossings are not boundaries. Collinear shared spans carry all contributing wire intervals so a selected shared conductor is removed once across contributors. Split repeated/overlapping refs before materializing surviving spans; preserve branch connections and controller endpoint assignments.

## Proposal and UI state

Completion/rebuild produce Result<Project, readable failure>; no-op retains the original Project reference. A pure comparison query supplies retained/added/rerouted/removed section counts and affected key/terminal names. Preview holds immutable base/candidate; Apply requires base identity; Cancel/refusal writes nothing.

Selection is a discriminated UI union: existing key/key-multi/endpoint modes plus section-only multi-selection. Key and section selections are mutually exclusive. One editor ID plus collapsed/open flags belong to workspace state, not Project/preferences schema. Settings continues using existing preferences; no new contexts are introduced.

## State transitions

- Draw accepted → capture explicit contacts → verify references/resources → one commit.
- Move/rotate/resize preview → preserve anchors and pin partitions → verify insulation/resources → Apply or atomic refusal.
- Complete/Rebuild → deterministic candidate + summary → Apply once or Cancel; external edit invalidates.
- Select sections → delete spans/remap surviving references → validate → one commit; Undo/Redo restores whole Projects.
- Panel switch during wiring preview → cancel uncommitted preview, retain saved data; close/collapse → restore focus, no history entry.
