# Feature Specification: Project creation and automatic wiring

**Feature Branch**: `feature/032-project-creation-and-auto-wiring`
**Created**: 2026-10-20
**Status**: Complete; automated verification recorded, manual acceptance reported passed by user; PR #13 merged and v0.1.0 published
**Input**: Implement the next roadmap item, 032.

## Goal and scope

Make project creation clear and let builders review an automatic GPIO proposal with outputs outside the keyboard.

**In scope**: Creation actions, removal of the six-key starter, explicit automatic GPIO assignment, outward outputs and existing preview flow.
**Non-goals**: Hardware detection, new scan modes, intermediate-pin connectivity, wire deletion, panel redesign (033).
**Existing contracts to preserve**: Old saved projects, physical geometry/bindings, deterministic ZMK v0.3.0 output, atomic Undo/Redo and safe cancellation.

## User scenarios and acceptance

### US1 — Start a project (P1)

1. Given New, inspect the selected preset and QWERTY/empty choices; exactly three action buttons follow in order: Create project from preset, Start empty project, Cancel. They have equal width/height and Cancel is red. No six-key action or Save action appears.
2. Given current work, the warning explains replacement/history reset and saving through the project bar first. Cancel/Escape preserve project/history and return focus to New.
3. Given a preset choice, keyboard creation keeps its geometry/mode. Empty creation has no keys. Existing six-key files still import/edit/export normally.
4. At desktop and narrow/200% layouts, buttons remain readable and reachable with visible focus. The native modal scrolls without page overflow in both themes.

### US2 — Review automatic pin assignment (P1)

1. Given matrix or direct scanning, Auto assign proposes available distinct GPIOs in catalog order per controller, retaining valid existing assignments. Encoders and retained manual contacts occupy pins. Left/right may reuse pins.
2. Given invalid/conflicting existing GPIOs, Auto assign refuses with repair guidance; given insufficient free GPIOs, it reports required/available counts and suggests manual grouping/dimensions. Neither changes saved state.
3. Given a successful proposal, preview shows real circuits and GPIO labels, states that this is proposed wiring to review against hardware, and supports Apply/Cancel. Apply is one undo step; cancellation, Undo/Redo, reload, JSON and ZIP agree.

### US3 — Inspect outward outputs (P1)

1. Given unibody or split layouts, rows/direct inputs use the outer horizontal edge (unibody left; split left/right respectively). Columns/ground choose top or bottom by available clearance, ties top. Endpoints and labels remain outside all rotated key geometry and the other half.
2. Given irregular/overlapping halves, extend the chosen edge beyond obstructing geometry in deterministic steps; refuse atomically if resource/routing limits prevent safe connections. Space adjacent output labels at least 0.5u, leaving 1u clearance from key bounds.
3. Corne and Lily58 with a 1u grouping grid, and ordinary unibody proposals preserve physical keys/bindings and actual net membership. Automatic row grouping remains the existing quantized-center rule; capacity errors require explicit manual regrouping rather than silently changing hardware assumptions.

## Requirements

- **FR-001**: US1's three equally sized ordered actions, red Cancel, preview and mode choices MUST replace the old creation actions.
- **FR-002**: The shipped six-key template and creation operation MUST be removed; old saved six-key projects MUST remain compatible.
- **FR-003**: Native keyboard controls, Escape/focus return, warning, themes and responsive scrolling MUST satisfy US1.
- **FR-004**: Explicit Auto assign MUST allocate free catalog GPIOs per controller, preserve valid existing pins and exclude encoder/retained manual usage as in US2.
- **FR-005**: Invalid/conflicting assignments, capacity and routing failures MUST refuse atomically with actionable guidance.
- **FR-006**: Output side selection, 1u key clearance, 0.5u label spacing and deterministic obstruction fallback MUST satisfy US3.
- **FR-007**: Real connectivity, geometry/bindings, preview isolation, atomic history, save/reload and deterministic export MUST agree as in US2/US3.
- **FR-008**: Proposed GPIOs MUST be explained as a configuration for hardware review, never detected physical wiring.

## Edge cases

Empty layouts/halves; unequal/rotated halves; stale previews; dropped pins; occupied manual/encoder GPIOs; valid pins on axes removed by regrouping; both diode directions; direct ground is not a GPIO. Existing valid terminal identities retain pins by axis/index. Auto assign replaces every net touching a key pin or a managed terminal; disconnected manual circuits without key pins or managed terminals are retained exactly and reserve their GPIOs. Conflicts with retained circuits refuse atomically. Removed axes release their GPIOs. Fallback advances the chosen edge outward in 0.5u steps, checking all key and previously placed label boxes; stop after 4096 steps with an actionable error.

## Key entities

Project, preset, controller GPIO, per-half terminal, proposed circuit and output endpoint use their existing identities.

## Success criteria

- **SC-001**: All three creation actions pass pointer and keyboard acceptance checks; no selectable six-key starter remains.
- **SC-002**: Unibody/direct/Corne/Lily58 fixtures at a 1u grouping grid yield deterministic available GPIOs and endpoints/labels clear of every key; finer-grid fixtures exceeding capacity refuse with guidance and leave saved state byte-identical.
- **SC-003**: Preview/Apply/Cancel/Undo/Redo/reload and actual JSON/ZIP match accepted wiring. Changed browser journeys pass three consecutive runs without retries.

## Assumptions and open questions

User confirmed 2026-10-20: retain correct pins, refuse conflicts/invalid pins, outward horizontal rows, top/bottom columns by space, and report capacity errors for manual regrouping. No open material questions. Equal-width actions stack vertically, retaining equal heights when labels wrap. No hardware facts are inferred.

## Feature 033 interaction extension

Complete wiring is additive: retain each existing known axis, half, GPIO and deliberate conductor, filling only missing compatible connections with preview. Rebuild wiring is a separate explicit action with the former Auto assign replacement behavior and 032 output/allocation rules. Refused/cancelled proposals do not write saved state. Actual schematic connectivity remains authoritative.

## 038 matrix Rebuild refinement

038 FR-002/FR-003 supersede dispersed output placement for matrix Rebuild: local net trees, one output per terminal and a top row block and exterior side column block per half, both initially 1u from key bounds. Row leads start upward; groups move away independently around obstructions; geometry/GPIO allocation and selected cells remain. Automatic matrix mode/topology reconstruction uses the same router to preserve deterministic topology round trips. Direct scan and individual cell/dimension routing retain the previous placement contract. See [038 specification](../038-automatic-wiring-routing/spec.md).
