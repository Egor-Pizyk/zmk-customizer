# Wiring interaction contracts

Product acceptance remains in [spec.md](../spec.md); implementation representation is in [data-model.md](../data-model.md).

## Domain/UI boundary

`editWiring` accepts existing edits plus `complete`; `auto` retains full rebuild semantics. Supply the selected ControllerBoard from catalog as a typed argument. Both automatic actions return a total Result; invalid user proposals are values, not exceptions. Completion returns the same Project for no-op.

`getWireConductors` and `getWireSections` expose deterministic visible geometry only through the wires module public index. Combined contacts/nets/cells/issues remain owned by shared project analysis. `removeWireSections` takes resolved section refs against the base Project and returns success or atomic refusal. Components never infer net compatibility or allocate pins.

## Interaction and feedback

- Main automatic action: Complete wiring. Separate Rebuild wiring explains replacement before preview.
- Summary labels: retained, added, rerouted, removed; affected keys/terminals and counts. Refusal names the entity and repair action; no partial Apply.
- Section selection: Select tool, plain click replace, Shift-click toggle, blank/Escape clear. Section list has labeled checkboxes with the same state and roving keyboard behavior; native field arrows/delete stay native.
- Selected conductor has a visible extent and endpoint markers. Connected/insulated crossing controls keep their own action and target priority.
- Delete selected sections / scoped Delete/Backspace removes only selected sections, announces count and Undo, then focuses next surviving section/row or canvas.
- Under 036 FR-024–026, intersecting marquee selects keys and sections; Shift unions sets and mixed deletion resolves sections against the immutable base before key cleanup in one undoable edit. Existing whole-wire endpoint repair remains explicitly named in Parts; no hidden fallback from section deletion to whole-net deletion.

## Layout and focus

Workspace dimensions mean content area after shared navigation/header/heading/status chrome. Desktop sizing follows 036 FR-014–016: preferred 448px, 320–640px capped at 45% workspace; canvas >=55% width. Narrow lower panel <=45% height and canvas >=50% height; 1024px is also tested. One expanded editor; Tools remains compact. Internal scroll containers keep actions/fields reachable. Editors remain available through individual summaries under 036 FR-017, preserving project/history and sensible focus. Editor switching cancels uncommitted wiring preview; no background Apply.

Settings remains native modal with <=480px desktop width, viewport margins and internal scrolling. Other dialogs and Bindings panel sizing stay unchanged. Existing token density/minimum 24px target rule governs; no new raw color/inline styling. Base/lg/xl layout conventions remain; narrow acceptance is scoped to these panels.

## Owning contract amendments before code

Update 003 FR-009/FR-012 and project-schema/UI contracts: stored conductor fragments need not end at a key; creating a wire still follows attachment rules; deleting sections preserves independent branches. Update 003 FR-010 and movement/edge cases: capture pass-through pins when wiring is created, preserve explicit identities through transforms; geometric coincidence during moves never connects a new pin. Pin/junction/insulation state and visible conductor geometry must agree.

Update 013 wiring contract and final 032 contract/UI names: Complete wiring is additive, Rebuild wiring retains former explicit Auto assign behavior, partial axes remain retained. Neither changes mode/topology implicitly. Update 001 UI regions for the editor host and the Parts list slot while preserving accessible names/landmarks. Update frontend Tailwind/admin guidance to document this feature's narrow-layout exception and docked editor. Scope historical schema sections by version rather than rewriting old-file formats.

## 036 proposal inspection amendment

FR-019–021 permit non-mutating key/encoder/section/wire selection during wiring preview. A read-only reuse of the wire-section list inside Wiring provides the keyboard alternative; Delete and pointer drags cannot change the proposal or saved data. Select/tool attempts no longer silently cancel. Apply saves once; Cancel/Escape or explicit editor dismissal restores and announces saved state. Preview connection feedback and persistent Preview marker describe the displayed circuit; saved-project Problems/export remain isolated. Actual routing/allocation and no-op/refusal behavior are unchanged.


036 FR-029 supersedes the Complete wiring UI requirement: on explicit user selection (2026-10-23), remove its button and retain Rebuild wiring as the sole automatic action with replacement explanation and unchanged preview/Apply/Cancel/history contracts. Additive domain operations/tests remain historical supported contracts, without a UI entry point.
