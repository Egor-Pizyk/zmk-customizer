# Research: Layout editor

## Existing implementation audit

Creation and blank/preset: add-key/create-project/UNIBODY_PRESET. Move: move-key/move-keys, pointer-select, pointer-preview with one pointer-up commit. Delete: remove-key frees referenced pins, drops orphan wires and prunes layer bindings. Selection: workspace state, marquee and separate Bindings selection. History: generic ProjectProvider preserving no-op identity, analysis cached by immutable Project. Missing: width/height/rotation/origin, rotated overlap and bounds, duplication, renumber, table selection, batch nudge. Generators hardcode 1u and zero rotation. Schema v5, budgets in storage/project-budget.ts.

## Decisions

- Geometry uses optional widthU, heightU, rotationDeg, rotationOriginXU, rotationOriginYU. Absence means 1,1,0,0,0. Rationale: compact legacy/default project data and unchanged existing geometry; a domain accessor resolves defaults for every consumer. Alternative required fields would cause unrelated fixture/literal churn. Migration v5→v6 advances version and forbids new geometry in historical v5 keys, avoiding interpretation of future data as old data.
- Pure clockwise rotation in downward Y coordinates; transform keycap corners and MX pin positions about absolute origin. Switch center is resized keycap center, pin offsets remain in physical MX units. SVG transform applies same angle/origin. Wires stay attached by keyId/pin, bends remain in world coordinates. Alternative rotating bends would silently move unrelated electrical connections. Existing orthogonal rerouting and crossing pruning reused, conflicts remain visible.
- Convex rectangle overlap uses separating axes, edge contact excluded with 1e-8 tolerance. Reuse for marquee intersection (no parallel UI collision rules). Alternatives axis-aligned boxes give false positives for thumb clusters.
- Renumber uses rotated center rounded at 0.0001u (existing roundU precision), then Y/X and old index tie. No row tolerance or cluster metadata needed. ID records and wire references untouched.
- Duplicate copies optional geometry, diode and bindings, no wires; translates entire cluster so its leftmost visible extent is 1u beyond existing right bound. Origin moves by same delta. Exact allocator reused. Budget refusal returns original identity and UI announces it.
- Existing accessibility shortcut contract resolves arrows; Shift+arrows nudge complete selected cluster. Mod+Space toggles key selection. Numeric fields retain native input behavior. Table selection roving arrows/Space and Shift extension; actions use buttons, no unnecessary global shortcuts.
- Finite invalid geometry stays editable and appears as physical-layout-out-of-range at key path; rounded cells must be int16, width/height rounded >0. Reference: docs/zmk/physical-layout.md (ZMK v0.3 edf5c08). No main-only syntax.

## Verification boundaries

Terminal React/jsdom checks establish roles, state, SVG geometry, persistence and bytes, not paint or screen-reader output. Production build and actual ZMK export build required. Read-only project-specific spec review and ZMK review precede completion. No extension hooks file is present.

## Direct-manipulation follow-up

The numeric feedback issue came from staging selected properties until a separate Preview action. Enter/blur now starts the existing transient preview immediately; precise fields remain available in collapsed details, with Apply/Cancel visible outside it. Canvas frames are rendered in screen coordinates so their outline and targets retain their size at different zoom levels. Pure pointer operations inverse-rotate resize deltas and preserve the opposite anchor exactly, without rounding unaffected coordinates. Rotation rebases arbitrary imported origins to the visible center without a visual jump; zero-radius input returns the original project. A domain facade permits overlap preview but refuses an overlapping release. The pointer adapter cancels on changed project/selection/tool, Escape or capture loss. No schema, generator bytes or runtime dependencies change.
