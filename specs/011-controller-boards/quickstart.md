# Validation guide

Run tests with Docker: `docker compose run --rm app npm run test -- src/domain/change-controller.test.ts src/domain/validate-controller-pins.test.ts src/storage/migrate-v4-to-v5.test.ts src/catalog/controller-boards.test.ts src/generators/controller-boards.test.ts src/ui/schematic/controller-panel.test.tsx`.

1. Start a unibody preset; select SparkFun or KB2040. Geometry/bindings/pin positions persist; build.yaml changes and overlay uses pro_micro.
2. Select XIAO. Every assigned endpoint is unassigned, former board labels are shown and export disabled. Undo restores exact previous project, redo restores drops.
3. Assign XIAO D0–D4 to the five endpoint controls. Problems clear for each reassigned endpoint; valid export references xiao_d and seeeduino_xiao_ble.
4. Save/reload and project JSON round-trip restore board and drop information.
5. Import a v4 project containing every exposed nice!nano port-0 GPIO. Connector positions map to the same physical contacts. Unmapped P13 remains an actionable dropped assignment.
6. Native selects work with keyboard; issue buttons focus corresponding endpoint. Unknown board/invalid data leaves current state unchanged.

Final automated gates: `make check`, `docker compose run --rm app npm run build`, `git diff --check`. CUA and manual app control are not authorized; do not claim manual browser or screen-reader verification. Firmware compilation is not part of 011.
