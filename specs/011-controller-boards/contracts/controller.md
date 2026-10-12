# Controller contract

Schematic exposes a Controller section with labeled native select, one-line selected description, v0.3 DocsLink, reserved-contact text. Board change commits domain operation with announcement. Pin selectors show board-specific Dn/analog aliases plus MCU label and current usage; unavailable current indices remain visible as unavailable until corrected. Dropped labels/error text are associated with the selector. Issue path wires.N.start/end.boardPin activates the exact existing endpoint selector.

Domain changeController(Project, {boardId, boards}) → Project. Unsupported ids are no-ops (import rejects them); available catalog data is injected, no imports from catalog in domain.

validateControllerPins(Project, board) → ValidationIssue[]; every dropped endpoint yields board-pin-dropped, every unavailable assigned position yields shield-pin-unsupported.

Generator generateShieldFiles(Project, matrix, {connector}) and generateRepositoryFiles selected target expose exact connector label and board id; all output has fixed indentation/newlines. Full golden repository files plus per-board overlay/build.yaml prove contents for four controllers. No raw gpio0 generated.

Storage strict schema accepts only known controller ids and exact optional drop field, serializes schema order with required controllerId. Legacy extra fields/malformed assignments remain errors. No networking on edit/export.
