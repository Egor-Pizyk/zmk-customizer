# Item 1 journal

2026-10-22. Base origin/main `4436ad1`; clean start. User explicitly authorized one original item per commit and manual approval between items, then approved the optional button model. A second active branch is necessary to keep the research-only 035 PR separate; explicitly within the user's new implementation request. Branch 036 starts from main, no PR stack. No merge authorization.

Spec/plan/tasks reviewed: all six requirements map to E002–E006; no constitutional conflict. Shared types/wire geometry owned by root; storage/presentation use fixed contracts. No extension hooks. UI/UX skill invoked before coding; queries and applicable/inapplicable guidance are in plan. Manual gates remain open. Check evidence follows actual execution.

## Item 1 evidence

- Domain red/green coverage proves linked push-key geometry, own-center rotation, atomic cleanup, encoder-contact net union, distinct A/B GPIOs, grounded COM, same-half ownership, short detection and legacy behavior. The targeted domain run finished with 12 passing tests after the new GPIO-to-ground short case first failed against the old validator.
- Storage coverage validates the v12→v13 migration, strict encoder-contact endpoints, dangling and duplicate push ownership rejection, and older-file preservation. Existing storage suites were updated only where they construct the current schema version; historical fixtures remain historical.
- Independent generator assertions first failed when a schematic encoder's stale legacy pins 2/3 were emitted. The implementation now derives pins 20/21 from real wires, matches the hand-authored golden, preserves legacy output and leaves zero-encoder kscan bytes unchanged.
- A downloaded browser export was compiled with the pinned ZMK v0.3 build container as `schematic-push`. Its expected `CONFIG_EC11` settings passed and the build produced a UF2 (178220 bytes; RAM 42312 bytes). Evidence and the downloaded export are retained under `.check-logs/036-encoder/`; generated build caches and artifacts are ignored.
- The lifecycle browser scenario places, cancels, moves and rotates an encoder, edits numeric geometry, round-trips JSON, connects A/B/COM, binds the ordinary push key, downloads the ZIP, deletes atomically and restores exact state with Undo/reload. Chromium, Firefox and WebKit passed the pointer scenario; Chromium passed the full export scenario. The regression was sensitive: native text drag cancellation and oversized transparent SVG strokes initially prevented authored rotation, then passed after preventing the native gesture and restoring 24 px hit targets.
- Rendered post-review covers light/dark at 1440, 1024 and 390 px. Controls stay reachable without horizontal document overflow. At 390 px the existing expanded Tools panel still covers useful canvas area; that pre-existing panel problem belongs to later remediation scope and is not marked fixed here. Contact labels were enlarged and separated after review. Native 200% zoom, screen-reader speech and physical encoder direction remain manual E008 checks.
- Manual review follow-up removed the misleading second keycap rendering. Schematic and Bindings now show one encoder with A/COM/B rotary contacts and optional SW1/SW2 push contacts at the actual wire endpoints, using the ordinary pin connected/unconnected marks. Selected keys and encoders expose four visible corner rotation controls. UI copy records that only the matrix-wired push switch may need a diode and that ZMK sensor rotation invokes arbitrary existing actions as immediate press/release events, so a modifier is tapped rather than held.

Direct focused runs were diagnostic because this item changed domain, storage, generator and pointer behavior. The authoritative delivery check is `npm run check:changed` against the staged snapshot; its receipt is retained with the other evidence before commit.

## Wire corner handles — 2026-10-23

FR-008 / E009: square handles now follow every actual right-angle corner, including automatically routed corners, and remain visible without selection. Derived-corner dragging uses temporary bends and persists once on release; no schema change. Rendering regression checks exact handle counts and coordinates; Chromium exercises dragging an unsaved corner and the existing collapse/double-click journey. Focused diagnostic tests, lint and typecheck passed. Final staged snapshot checks are recorded in `.check-logs/` by `npm run check:changed`. Manual acceptance: inspect an unselected L-shaped wire, drag each square, check Undo/Redo and cancellation; user acceptance remains pending. User instruction excludes ui-ux-pro-max for this follow-up.

## Coincident corner handles — 2026-10-23

FR-008 / E010: the new rendering regression first failed with two squares at one shared corner, then passed with one square after coordinate-based deduplication. Covers repeated saved bends and two wires sharing an automatic corner. Existing corner, section re-selection and double-click handle tests remain passing. The change affects handle presentation and preserves persisted wires and electrical connections. Staged checks use the receipt under `.check-logs/`; manual acceptance remains pending for dragging overlapping handles.

## Straight-line handles — 2026-10-23

FR-008 / E011: horizontal and vertical wires with three collinear saved points first failed the single-handle assertion, and an orthogonal two-turn path first failed by exposing three extra intermediary handles. All three regressions pass after deriving handles from real turns and retaining only one saved handle on a wholly straight wire. Existing rendering tests and focused Chromium bend dragging/collapse/double-click scenarios pass. Persisted geometry and electrical state are unchanged; final staged snapshot checks are retained by check:changed under `.check-logs/`. Manual acceptance: multiple points on one straight wire show one square; real turns remain movable.

## Corner expansion — 2026-10-23

FR-008 / E012: new pointer regressions first failed because dragging an upward-to-right corner retained obsolete intermediate/neighbor positions. A pure geometry query now moves adjacent sections and simplifies the route while preserving fixed ends and contact anchors. Domain tests cover mirrored expansion, both turn orientations and anchors; browser tests assert the full resulting orthogonal path and exact Undo. Existing collapse and double-click behavior remains covered. The prior automatic-corner browser test now asserts actual path geometry rather than the former one-bend storage encoding, because preserving turn orientation can require two explicit bends. Final staged checks are retained in `.check-logs/`; user manual acceptance is pending for the reported corner gesture.

## Encoder shortcut — 2026-10-23

FR-009 / E013. Base `0de08dc5611e84a002ab2f06a42c9aa2f2d43b8d`, clean tree; resolved feature 036 matches the request and existing draft PR #24. Scope is E selection and Encoder (E) hint/help; contact labels in Bindings and selected-wire highlight remain queued. No domain, persistence, history or export format changes.

Pre/post ui-ux-pro-max queries: `keyboard shortcuts discoverability` / `keyboard shortcuts` (ux), `keyboard event cleanup` (react); applied keyboard access, focus and stable accessible names using existing listener/tooltip. No new layout/tokens/motion; mobile native checklist does not apply to this desktop web control.

Diagnostic red: shortcut unit cases for e/E failed (2 failed, 56 passed). First browser diagnostic omitted navigation; corrected test setup. Changed snapshot `7522eeb9d105d7b6c12d0adee86d09e11750416f` passed static/unit checks but exposed UX-E01: visible tooltip text polluted the radio accessible name, affecting both new and previous encoder journeys. Fix: explicit option label on native radio, tooltip remains its description. Focused browser regression and final changed-check results recorded below. Logs are under `.check-logs/`; diagnostic logs `/tmp/encoder-shortcut-*.log`.

Manual limits: no OS/screen-reader speech or native zoom review; existing E008 remains open.

UX-E01 fixed: both focused Chromium encoder scenarios passed (2/2): existing pointer move/rotate and new shortcut/hint/Enter/typing/modifier/help flow. Inspected `test-results/encoder-schematic-Encoder--c1f20-ree-with-keyboard-placement-chromium/encoder-shortcut.png`: Encoder (E) is readable next to the icon without clipping. Final snapshot verification uses check:changed receipt under `.check-logs/` (includes this journal).

Final production snapshot `50e68c815f5a5a6f9e03222ba49401c50b472a52` passed `npm run check:changed`: typecheck, browser types, architecture/guidelines, lint/format, 224 related unit tests and 76 Chromium scenarios. Receipt: `.check-logs/50e68c815f5a-0de08dc5611e/passed.json`. Follow-up documentation closes E013; user manual acceptance remains E008.
