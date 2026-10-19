# Data model: 017

Schema v10 adds required arrays `combos`, `macros`, `conditionalLayers`; migration from v9 preserves all previous fields and inserts empty arrays. Maximum 128 per collection. Names ≤160 characters; generated prefix/name segment/stable ID suffix keeps namespaces separate. All values readonly plain JSON.

Combo: id cN, name, keyIds (2–20 distinct existing IDs), binding, timeoutMs (whole 1–5000), layerIds (empty = all; otherwise distinct existing IDs). Deleted targets remain stored and invalid until repaired.

Macro: id mN, name, waitMs and tapMs (whole 0–5000), steps (1–64). Each step has id sN and kind tap/press/release with Binding, or wait with durationMs (whole 0–5000). Step identity is independent of position. Referenced macro binding: kind macro, macroId; zero parameters. Allocators include dangling references and clipboard reservations.

Conditional rule: id qN, ifLayerIds (≥2 distinct existing IDs, ≤32), thenLayerId (existing, above every input). Targets have a single controlling rule. Reject self-dependency and cycles; chains allowed. Rules reference identities after layer reorder and may become invalid ordering until repaired.

Collection/step edits are pure; no-op/missing edits preserve original references. Cross-definition graph includes custom behavior actions and macro steps. Invalid inputs are semantic issues when repairable; malformed shapes and resource overflow fail storage parsing and leave current project intact.
