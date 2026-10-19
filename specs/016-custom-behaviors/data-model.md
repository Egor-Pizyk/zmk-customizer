# Data model: 016

Project schema v9 adds required `behaviors: readonly CustomBehavior[]`; migration inserts `[]`. Each definition has `id` (b + digits), name (≤160 characters) and kind. Maximum 128 definitions. All referenced objects retain stable IDs, including deleted targets.

Hold-tap: hold/tap target labels; flavor; tappingTermMs; quickTapMs and requirePriorIdleMs; retroTap, holdWhileUndecided, holdWhileUndecidedLinger, holdTriggerOnRelease booleans; triggerKeyIds. Tap-dance: ordered {id, binding} actions and tappingTermMs. Mod-morph: normal/morphed Binding plus ordered mods and keepMods subset. Sticky key/layer: releaseAfterMs, quickRelease, lazy, ignoreModifiers.

Reference binding: kind custom, behaviorId and parameters (at most two). Parameter union: key (KeyStroke), layer (layerId), dummy (no value). Arity and parameter kinds follow the current definition; invalid assignments stay visible until repaired. Definition actions reference IDs rather than containing definitions, so storage nesting is bounded and domain checks cycles.

Every edit returns a new project; missing edits/removals return the original. ID allocation considers dangling references and clipboard reservations to avoid resurrecting a deleted definition accidentally. Names are sanitized for output with prefix and ID suffix. Empty sanitized names are validation errors. Timing must be integral 0–5000 ms; -1 only quickTapMs/requirePriorIdleMs. Position IDs remain dangling after deletion and validate as errors.
