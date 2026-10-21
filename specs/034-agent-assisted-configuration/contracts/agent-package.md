# Agent package contract

Download name: `zmk-customizer-agent-v1.zip`. UTF-8 files, LF and trailing newline; stable paths/order and fixed ZIP timestamps.

- `README.md`: human workflow, limits, versions and file index.
- `PROMPT.md`: ready agent instruction; user appends description; ask about missing hardware/approval; output Project JSON plus separate assumptions/checklist.
- `project.schema.json`: current source-derived structural schema, with `$schema`; runtime importer/refinements/analysis are authoritative.
- `catalogs.json`: boards/pin maps, keycodes/modifiers/actions/commands, firmware, advanced/custom behavior and encoder options/limits. JSON-safe records/arrays only.
- `manifest.json`: `packageVersion: 1`, `schemaVersion` from migrations, `zmkVersion` from pinned target, and example filenames. No timestamp/user/environment fields.
- `GUIDE.md`: coordinates/identity, wires vs cells, diode direction, terminal IDs and half-local GPIOs, contact/reference rules, firmware override semantics, semantic validation, repair and safe import/export.
- `examples/macropad-9.json`, `examples/corne-42.json`: complete supported examples from current catalogs/domain operations. Illustrative proposed pins, not user hardware facts. Each must pass importer, full analysis and deterministic repository export.

Builder takes no Project/preferences argument and never reads storage/network. Package generation failure leaves project/history untouched. Browser adapter locks one build; close invalidates pending delivery, retry starts a fresh build. Download success means the browser accepted a download request, not confirmed disk persistence.

Generated response contract: plain UTF-8 `.json` Project file with current schemaVersion and supported IDs, no markdown fences/comments/prose inside JSON. Separate text lists assumptions, approved pin wiring and review instructions. Existing Open confirmation resets history; subsequent edits remain undoable. Current work should be saved first. Never silently apply output.
