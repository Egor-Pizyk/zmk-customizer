# Validation record — 011 controller boards

Date: 2026-10-12. Branch: `011-controller-boards`. Existing uncommitted 008–010 work preserved. No commit, deployment, publishing or firmware compilation.

## Spec Kit flow

Completed specify → clarify → plan/research/data model/contracts/quickstart → tasks → analyze → implement. Existing constitution 1.1.1 remains unchanged. All six skill instructions read; Spec Kit feature pointer updated, setup-plan/setup-tasks/check-prerequisites scripts executed. No extensions.yml exists, so no hooks applied. Quality checklist 16/16 passes; tasks 14/14 complete.

One user clarification asked/answered: clear every assignment between Pro Micro and XIAO; preserve compatible connector positions within a family. Other scope decisions follow roadmap: four verified initial controllers, one unibody board, split selection deferred to 013. Clarification scan: functional/data/interaction/reliability/import/edge/constraints/terminology/completion categories covered; no unresolved critical decisions.

Analysis: 11 functional requirements, 14 tasks, 100% coverage, no critical/high/medium consistency issues after review corrections. Coverage: FR001/002 T001/T003–006; FR003 T004/T006/T009; FR004–006 T007–009/T012; FR007/009 T003–004/T009; FR008 T010–012; FR010 T005–006/T009/T012–014; FR011 T007–008/T012. No unmapped tasks or constitution violations. Initial read-only analysis reported 10 requirements; FR011 was added from upstream review evidence, then rechecked.

Spec-reviewer initially requested board-specific analog labels, old-version coverage and removing development details from product spec. All corrected; final verdict ready to implement, no material findings. ZMK-reviewer identified Bluetooth build incompatibility on USB-only RP2040 and incorrect AVR analog labels on RP2040. Added catalog BLE capability, domain binding validation and manufacturer silk labels, independent USB keymap goldens. Final ZMK-review verdict approve, no blockers. Sources in research.md/docs/zmk/boards.md.

## Tests first

Catalog/migration tests failed on missing modules before implementation. Board change and pin validation tests failed on missing modules; then passed preservation, cross-family clearing, persistent drops, explicit clear/reassignment and unavailable pin paths. Selector tests failed on missing controller panel and old generic 32-pin choices before UI implementation. Four complete repository golden comparisons and selected-XIAO export regression failed on gpio0/fixed nice_nano output before generator changes. Bluetooth compatibility test failed with no issue before validation was added.

Golden overlay/build.yaml variants independently authored from approved upstream-derived unibody/repository expectations before generator changes. RP2040 variants replace Bluetooth clear with none and omit bt.h; differences documented. Existing upstream fixtures are unchanged. ZIP clock/order/extraction regressions remain passing.

Migration tests cover every supported legacy nice!nano port-0 mapping, valid unmapped raw pin, malformed raw values, old injected new fields, unknown current controller, malformed/exclusive dropped metadata and v1–v3 migration chain. Existing v1/v2/v3 fixtures also remain covered by parsing tests. Controller selection, dropped metadata, undo/redo and autosave are checked through exact parsed project equality.

## Final automated checks

- make check PASS: synchronized agent mirrors, strict TypeScript, zero lint errors/warnings, format check, **135 test files / 813 tests**.
- Docker npm run build PASS: 424 modules; JS 608.48 kB / gzip 178.00 kB. Existing Vite bundle-size warning remains; no unrelated bundling change.
- git diff --check PASS.

## Accessibility and limits

Native labeled controller/pin selects, selected descriptions, external link names, Field error associations, visible unavailable/dropped labels and existing issue focus paths verified by static markup tests/source review. Controller change handler and exact history restoration tested. Existing focus-ring primitives reused; no new colors/tokens. Dropped issues map to Schematic, incompatible Bluetooth actions to Bindings. No runtime network API added.

AGENTS.md prohibits browser/native app control without an explicit request; none was used. Manual keyboard traversal, visual reflow/theme and screen-reader checks were not executed and are not claimed. No firmware compilation; golden tests prove deterministic text and approved paths, not successful firmware builds. Full browser offline operation was not manually exercised. Compile verification remains roadmap 023.
