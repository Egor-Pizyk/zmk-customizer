# Verification: 012-layout-editor

Date: 2026-10-13. Branch: `012-layout-editor`. Base: completed 024-codebase-health-audit. Initially clean working tree; existing numbered specifications retained. No runtime dependencies, ADR exceptions, push or PR.

## Delivered behavior

Existing creation, dragging and deletion were extended. Keys support width/height in u, clockwise angle in degrees and absolute origin in u. Schema v6 retains sparse defaults (1u, 0° and origin 0/0); the v5→v6 migration preserves old geometry, diode data, bindings and wiring. Single/multi selection, exact numeric geometry and translation, preview/apply/cancel, grid snapping for pointer movement, keyboard nudge, duplicate without wires, deletion and center-based stable renumber are integrated. Schematic and Bindings share geometry. Bindings stay keyed by exact IDs; renumber changes array order only. User operations commit once; no-op identity and Redo remain intact.

Table controls provide all geometry without canvas, roving selection with ArrowUp/Down/Space/Shift extension and labeled action buttons. Canvas Mod+Space extends selection; navigation uses visible centers. Numeric fields retain native browser number-input behavior. Rotated switches/pins move together, endpoints follow pins, bends remain world-fixed, crossings revalidate against final geometry. Invalid size/range and overlaps remain repairable and block export.

## Tests-first evidence

Before domain/migration changes, geometry tests failed for missing accessors/APIs and legacy pin/collision/bounds behavior. Before operation implementation, duplicate/renumber/batch tests failed for missing APIs and key-count refusal. Focused green results followed those implementations. UI geometry/history/provider tests preceded their controls.

The independent seven-cell overlay golden was authored before generator modification; its first run failed because output still contained hardcoded 100/100/0/0/0 cells. Updated output passes the full golden and deterministic byte comparison. Existing default geometry goldens remain unchanged. Differences and pinned sources are recorded in `tests/fixtures/generated/layout/DIFFERENCES.md`.

Later failing contracts exposed intermediate insulation loss during compound move+rotate and sequential multi-key preview; batch final-geometry evaluation fixes both. Real App tests exposed and verify mixed-value batch editing, lost table Tab entry after deletion and canvas selection lost on asynchronous focus. Export validation now explicitly tests invalid geometry with a valid electrical matrix. Tests never mock React hooks/providers.

## Automated results

- `make check`: PASS, 159 files / 951 tests. Includes agent sync, resolved-import architecture gates, guideline gates, strict types, lint, format and coverage floors.
- Coverage: all files 90.04% statements / 83.40% branches / 91.33% functions / 90.07% lines; domain 98.86% / 95.07% / 99.11% / 98.88%; generators 96.22% / 94.28% / 100% / 95.83%.
- `docker compose run --rm app npm run build`: PASS. Static dist built; Vite reports the existing application-size warning (main chunk approximately 625kB), not a failure.
- `make zmk-build`: PASS. Eight actual exports cover all four controllers and both diode directions; two additional actual exports use 1.5u × 2u keys rotated −15° and +30° around 0.75u/1u. Fixture generation checks deterministic bytes, exact seven cells and valid electrical matrix before compilation. Both geometry targets compiled and produced firmware artifacts. Intentional invalid connector rejected with the expected diagnostic.
- Pinned build environment: ZMK `edf5c0814fd3ea202e43aad2d68fd32e882a518c` (v0.3), Zephyr `dacab4875df72109b96cc8977547a0dc04875bcd` (3.5), SDK 0.16.3, west 1.2.0. Local ignored artifacts/logs are under `.zmk-build/artifacts/` and `.zmk-build/logs/`; they are not committed.
- Spec reviewer: remediation completed before implementation; zero remaining critical/high findings. ZMK reviewer: approve, no findings.
- `make test-mutations`: PASS, 24/24 assertion-detected regressions, original files restored byte-for-byte. Run separately from checks and production edits; repeated after the final shared-grid UI adjustment. Includes four layout seeds (rotation sign, exported width, duplicated bindings and no-op/Redo) plus all 20 audit regressions.

## Limits and remaining work

No feature-scope implementation remains after automated verification. Manual browser paint, tiny-key visual readability and screen-reader announcements have not been checked because the task explicitly limits verification to terminal and automated tests. jsdom verifies accessible roles/names, focus, SVG geometry, saved data and export bytes; it cannot verify native spinbutton stepping or rendered paint. These manual checks are not claimed complete. KLE, split, new wiring, behaviors and firmware settings remain outside this feature.

## Acceptance evidence

| Contract | Verified tests/artifacts |
|---|---|
| Geometry, rotated pins/collision/centering | domain geometry, pin-position, overlap, center and validation tests |
| Migration and file round-trip | migrate-v5-to-v6 and existing v1–v4 import suites |
| Atomic editing, identity, Redo | set-key-geometries, edit-layout, layout-noops and real App layout tests |
| Duplication, deletion, renumber | duplicate-keys, remove-keys, renumber-keys and real App history/data tests |
| Keyboard, table and shared rendering | app-layout, existing app-canvas, marquee and nearest-key tests |
| Validated export and matching order | layout-export golden/deletion tests and get-export-preview valid-matrix/invalid-geometry regression |
| Buildable nonstandard layout | layout-negative-rotation and layout-positive-rotation actual-export firmware artifacts |

Code review checked pure domain boundaries, effective-default equality, exact IDs, stable ordering, finite trust-boundary fields, readonly references, no dependency additions and local-only drafts. The final table geometry steps use the current shared grid; angular stepping remains 1°.

## Completion

Final `make check` passed again after the standalone mutation run: 159 files / 951 tests, all gates and coverage floors. T001–T021 are complete; manual limits above remain explicitly unverified. Commits: `5e16358` (feature artifacts and roadmap) and `a4e3294` (implementation, migration, tests, goldens and actual-build fixtures), followed by the documentation completion commit. No push or PR was performed.

## Direct-manipulation follow-up (2026-10-13)

Fixed the reported missing numeric feedback: Enter/blur previews precise-property changes automatically. The precise editor starts collapsed; redundant Preview action was removed, while Apply/Cancel, accessible table and batch actions remain. Selected keys have thin frames with eight side/corner resize handles and four exterior corner rotation targets. Resizing honors the shared grid and fixed opposite anchors even for rotated keys; rotation uses the visible center, with Shift snapping to 15°. Preview remains unsaved until release, overlapping release is refused, Escape/capture loss/stale selection cancels, and no-motion gestures preserve Redo. Multi-selection retains group movement; each selected key has its own resize/rotation frame. No schema, migration, generator output or dependencies changed.

Tests-first evidence: missing domain APIs and missing UI handles/live preview failed before implementation; additional failing contracts caught precision loss in fixed coordinates, zero-radius rotation, and cancelled numeric drafts returning during another property edit. All were repaired. Real App/provider tests cover visible SVG preview, saved geometry, one-step Undo/Redo, no-motion Redo, selection invalidation, cancellation, overlaps, and valid exported seven-cell geometry while retaining wires, diode and layer bindings.

- Final `make check`: PASS, 163 files / 968 tests; architecture, guidelines, types, lint, format and coverage floors pass. Coverage: 90.11% statements, 83.69% branches, 91.45% functions, 90.14% lines.
- Production build after cancellation repair: PASS, 465 modules, approximately 631kB main bundle.
- `make zmk-build`: PASS, all ten actual-export targets, including nonstandard positive/negative rotations; intentional connector rejection also passed. Same pinned ZMK v0.3 build environment as above.
- Standalone `make test-mutations` after all production edits/checks: PASS, 29/29 assertion-detected seeds, original files restored. Adds fixed resize anchor, center pivot, overlap release, live numeric preview and cancelled-draft resurrection regressions.
- Final required read-only review: approve, no material findings after cancellation remediation.

T022–T027 complete. No follow-up scope remains unimplemented. Browser paint, native interaction feel and screen-reader output remain unverified under the terminal-only constraint; automated evidence is not a claim of visual/manual review. No push or PR.
