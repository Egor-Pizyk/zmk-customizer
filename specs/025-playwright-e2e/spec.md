# Feature Specification: Real browser behavioral coverage

**Feature Branch**: `025-playwright-e2e`
**Created**: 2026-10-13
**Status**: Implemented
**Input**: User request for verified real-browser layout and critical product coverage.

## User Scenarios & Testing

### User Story 1 — Manipulate physical layout (Priority: P1, delivery P0)

Builders create/select keys and directly resize every edge/corner, including rotated keys, rotate outside every corner, pan/zoom, snap and nudge. They see continuous previews, save only on release, cancel safely and recover complete data with Undo/Redo.

**Why this priority**: Event interception, paint and native hit testing cannot be established in jsdom.
**Independent Test**: Manipulate a known wired layout; compare rendered corners, persisted geometry and downloaded physical cells.
**Acceptance Scenarios**:
1. Real mouse gestures on displayed handles change the expected dimensions and preserve opposite anchors at multiple zooms and after pan.
2. Rotation keeps the visual center fixed without unintended move or marquee; Shift rounds to 15°.
3. A preview visibly changes the layout without writing storage; release commits exactly once; Escape/cancellation/stale project/selection discards it. A stationary click preserves Redo.
4. Overlapping release restores the previous display, leaves storage unchanged and explains refusal.
5. Numeric typing remains a local draft; precise Enter/blur visibly previews, Apply saves, Cancel/Escape discards. Table Enter/blur saves directly. Cancel then edit another property never resurrects old values.
6. Duplicate/delete/renumber preserve prescribed identity, layer bindings, wiring and diode semantics; Schematic/Bindings match, reload retains saved geometry and export emits seven cells in key order.

### User Story 2 — Complete and recover a project (Priority: P1)

Builders start new projects, place and wire keys, assign bindings/layers, fix blocking problems, download firmware inputs and round-trip project JSON.

**Why this priority**: Cross-workspace correctness and recovery protect user work.
**Independent Test**: New → layout → wiring → binding → valid download; corrupt import leaves the project intact.
**Acceptance Scenarios**:
1. A new project can become a valid wired, bound shield entirely through visible controls.
2. Wiring errors disable export and navigate to a repairable entity; repair restores downloadable output.
3. Binding/layer changes survive workspace switches and reload; downloaded JSON imports without loss.
4. Invalid import shows a readable error and changes neither current layout nor saved project.

### User Story 3 — Operate by keyboard and diagnose failures (Priority: P2)

Users edit through the table/properties and dialogs with keyboard, focus returns correctly, and maintainers can inspect captured failures.

**Independent Test**: Keyboard-only table edit and native modal open/close; deliberately broken gestures fail on visible/data assertions.
**Acceptance Scenarios**:
1. Keyboard navigation, native number input stepping, selection and actions complete without mouse.
2. Native dialogs contain focus, Escape closes and restores focus; major actions have accessible names.
3. Controlled resize, preview, hit-area, persistence, history and cancelled-draft regressions each trigger a behavioral failure.

### Edge Cases

Rotated geometry, foreignObject hit areas, capture loss, stale previews, no-op history, overlapping release, malformed/newer JSON and native blur/Enter behavior. No user browser profile is used.

## Requirements

- **FR-001**: Verify all 17 requested layout scenarios with visible outcomes plus saved/downloaded assertions; cover all eight resize directions and four rotation corners.
- **FR-002**: Verify critical complete-project, validation navigation, bindings/layers, JSON recovery and keyboard/dialog flows.
- **FR-003**: Use real isolated browser sessions and app services, real intermediate mouse movements, no forced clicks or operation injection; wait on observable state.
- **FR-004**: Check rotated corners independently and include reviewed focused visual references; justify tolerances and preserve failure evidence.
- **FR-005**: Provide scenario/risk/existing/new/visible/persisted-export coverage matrix and repeatable documented CI execution.
- **FR-006**: Prove sensitivity to six requested controlled regressions and restore exact production bytes after each.

### Key Entities

Project, saved project, downloaded JSON/ZIP, rendered key polygon, gesture preview, history entry, failure artifact. No product schema changes.

## Success Criteria

- **SC-001**: All specified journeys pass three consecutive runs in the mandatory browser.
- **SC-002**: Each of six deliberately introduced regressions fails on a user-facing or saved-data assertion.
- **SC-003**: Visible geometry agrees with persisted geometry and seven downloaded physical cells after mouse operations.
- **SC-004**: Failed runs retain actionable traces/screenshots; supported alternate browser checks and limitations are recorded.

## Assumptions and clarification scan

Existing 012 contracts define behavior; no new product feature or runtime dependency is needed. Existing spec numbers remain immutable. Numeric preview is unsaved until Apply; table editing commits on Enter/blur. Native screen-reader speech and physical hardware are outside automation. All functional/data/interaction/reliability/privacy/edge-case/completion categories are clear from user instructions and 012; no critical ambiguity requires a question. Browser selection and tolerances are implementation decisions documented in research.
