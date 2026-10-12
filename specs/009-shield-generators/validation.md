# Validation record — 009

Date: 2026-10-12. Branch: 009-shield-generators. Existing uncommitted 008 work preserved; no commits or publication.

## SDD gates

Completed specify → clarify → plan/research/data-model/contracts/quickstart → tasks → analyze before feature code. Two product questions were confirmed by the user: nice_nano_v2 with raw gpio0 numbers and exposed safe pin allowlist; require saved diodes on every key and block empty projects. Analyze found complete functional-requirement coverage and no unresolved critical inconsistency. Spec-reviewer approved after clarifying private overlay renderers and no-profile BT macro arity.

## Tests first

Domain matrix/validation tests initially failed because implementation modules were absent; generator golden tests likewise failed before generators existed. Golden expectations were authored independently from pinned verbatim Reviung41 structure before feature generators, with deviations in tests/fixtures/generated/unibody/DIFFERENCES.md. Preset and Export tests failed before their implementation. The additional missing-diode/wiring-blocker regression was observed failing before correcting early-return issue aggregation.

## Implemented checks

- Matrix tests: both diode attachment pins and polarities, reversed switch terminals, deterministic disconnected components, odd cycles, mixed directions, shorts, parallel keys, GPIO conflicts/missing/unsupported pins and unused nets.
- Validation tests: empty/missing diodes, names/escaping restrictions, layer display/node limits and physical signed-cell bounds.
- Generator tests: all five exact golden files plus independently authored row2col overlay, deterministic LF/final newline, all current binding kinds, reordered layers/keys, missing bindings, custom behavior deduplication, negative coordinates and DT/Kconfig escaping.
- Preset tests: zero issues, independent project equality, immutable clones, schema-v4 JSON roundtrip, autosave/history reset and undo/redo after edits.
- Export tests: five labelled readonly previews, target explanation, zero files on errors, issue links and recovery after undo. Existing shared issues/history tests updated for the new empty-project blocker.
- ZMK-reviewer final verdict: **approve**. Corrected direction error to reference the actual first diode-bearing key. No new findings after lint refactoring.
- Production application build passed (`docker compose run --rm app npm run build`); Vite reports the existing large-bundle warning (>500 kB). No new dependencies.

Final required `make check` **passed**: agent mirrors synchronized, TypeScript typecheck, lint (zero errors/warnings), format check and **120 test files / 744 tests**. `git diff --check` also passed.

## Limits of evidence

Browser verification was attempted through CUA: chrome/iab browser connectors unavailable and native Chrome reports “Computer Use permissions are not granted”. Manual visual, focus, and reload checks therefore remain unverified; automated UI/history/storage checks pass.

No real firmware build was executed. Golden comparisons, pinned-source review and TypeScript app build do not establish firmware compilation. ZIP/download, board selection, split/direct scanning, extended geometry, settings, combos/macros and build verification remain outside 009. Project schema remains version 4.
