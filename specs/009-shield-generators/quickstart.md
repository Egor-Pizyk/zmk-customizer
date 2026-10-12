# Quickstart validation

Prerequisites: Docker running, existing dependencies installed (`make install` when needed).

1. `make up`; open http://localhost:5173.
2. New → choose six-key unibody preset. Existing replacement warning applies. Open Export: target nice_nano_v2 / ZMK v0.3.0, five readonly file sections and zero problems.
3. Expand each file using keyboard; focus text region and inspect complete source. No download or ZIP control.
4. Remove one diode in Schematic: Export shows a named issue and no file sections. Activate the issue to open Schematic. Undo restores preview.
5. Reverse all six diodes: output becomes row2col, GPIO input pulls change to columns. Reverse only one: conflicting direction issue blocks output.
6. Reorder Base/Fn in Bindings: layer actions resolve current indices, key order remains unchanged.
7. Save JSON, reopen, reload: preset and edited state restore with schemaVersion 4. New replacement resets history; subsequent edits use existing undo/redo semantics.
8. `docker compose run --rm app npm run test -- src/domain/derive-shield-matrix.test.ts src/domain/validate-shield-project.test.ts src/generators/generate-shield-files.test.ts`.
9. `make check` must pass. Golden tests are syntax/contract evidence, not a firmware compilation. Firmware build and archive packaging remain outside 009.
