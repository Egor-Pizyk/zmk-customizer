# Generation and UI contract

- `deriveShieldMatrix(project, target)` returns Result: success is ordered ShieldMatrix; failure is stable issue list. No I/O, input mutation, catalog imports or persistent state.
- `validateShieldProject(project, {bindingsCatalog,target})` composes existing project validation and generation constraints; derived electrical checks are evaluated once per call. Never produces files.
- `generateShieldFiles(project, matrix)` has validated-input precondition. Returns Kconfig.shield, Kconfig.defconfig, <name>.overlay, <name>.keymap, <name>.conf at boards/shields/<name>/ in that order. No validation, I/O or timestamps.
- Overlay selects chosen physical layout, whose transform and kscan point at defined nodes. gpio0 raw pins, explicit correct active-high/input-pulldown flags. RC and 100×100 physical attributes follow keys order; negative signed cells parenthesized.
- Keymap includes all layers and supported kinds; missing = &none. BT commands expand to two cells: no-profile macros are emitted bare, profile commands with their profile. Custom td/mm labels are unique, emitted once per rendered semantic definition. No stale layer-index storage.
- New adds one preset button within existing replacement confirmation. Empty New remains available; preset data remains schemaVersion 4 and serializable.
- Export shows fixed board/version and mapping explanation; zero files whenever any blocker exists. Issues are buttons using existing navigation/focus routing. Valid output uses labelled native details/summary and focusable pre regions; contents rendered as escaped React text, not HTML.
- Verification: golden comparisons for every file; electrical edge tests both directions/odd cycle/disconnected parts; binding coverage and layer reorder; UI checks invalid→valid and preview semantics; final make check.
