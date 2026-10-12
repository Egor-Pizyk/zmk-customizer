# Data model — 010

Project schema stays version 4; no new saved fields or migrations.

- GeneratedFile: readonly path and content strings; paths are unique relative repository paths, text retains LF/final newline.
- Export options: readonly includeWorkflow boolean; UI defaults true on mount. No autosave or undo.
- Repository target: readonly boardId, revision, workflow strings from catalog; release refs agree.
- ZIP output: owned Uint8Array of bytes; entry order sorted by code units; fixed DOS date 1980-01-01 00:00:00, os 0, attrs 0, level 6.
- UI action state: isBuildingZip boolean plus visible feedback string; lock ref prevents concurrent ZIP calls. Transition idle → pending → success/failure → idle. Validation disables initiation and hides file actions. Captured snapshot remains consistent if inputs later change.
