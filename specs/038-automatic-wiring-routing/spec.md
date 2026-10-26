# Feature Specification: Automatic wiring with grouped outputs

**Feature Branch**: `fix/pre-major-sweep` (user requested continued work here)
**Created**: 2026-10-25
**Status**: Implemented; manual acceptance pending
**Input**: Universal efficient automatic wiring connecting all keys, with all outputs collected into two groups: rows and columns.

## Goal and scope

Rebuild wiring produces an electrically valid, readable connected matrix for regular, staggered, rotated, irregular and split layouts. Each electrical line connects nearby keys instead of repeating a long lead from every key to its output. All row outputs form one aligned block; all column outputs form a second aligned block outside the keys, independently per split half.

**In scope**: matrix Rebuild and automatic mode/topology reconstruction, connected line trees, grouped outputs and failure/preview verification.
**Non-goals**: PCB manufacturing routing, global optimality, new scan modes, changing the selected matrix cell grouping/grid, automatic hardware detection, new controller facts, manual bend editor.
**Preserved**: GPIO retention/allocation, electrical matrix semantics, key geometry/layers, unrelated manual/encoder circuits, direct scan, versioned project compatibility, deterministic exports and one-step Undo/Redo.

## User scenarios and acceptance

### US1 — Connect a complete keyboard (P1)

1. Given an ordinary, staggered or rotated keyboard with sufficient GPIOs, Rebuild proposes both contacts of every key connected to exactly its intended row/column, including diodes. Regular matrices use local shared paths rather than repeated long output leads.
2. Given the same project and settings, repeated rebuilding proposes identical geometry, independent of runtime timing.
3. Given overlapping coincident contacts, missing references or capacity/resource limits, rebuilding refuses atomically with actionable feedback rather than proposing shorts.

### US2 — Find all outputs in two blocks (P1)

1. Every used matrix terminal has exactly one visible output. Rows form a horizontal block above the keys; columns form a vertical block beside the keys, ordered by electrical index. Both use a 1u gap from the nearest key bounds. Row output leads leave their key upward immediately, without a sideways escape. Adjacent labels remain separated.
2. On split keyboards each half has its own two blocks, column blocks face outward (left for unibody/left half, right for right half), and obstructing other-half geometry moves the whole block together. Unequal, rotated and vertically arranged halves remain supported.

### US3 — Review and apply safely (P1)

1. Rebuild preview exposes the actual new circuits and grouped GPIO labels; existing Apply/Cancel/Escape and keyboard navigation remain. Before Apply saved data/exports/history are unchanged; Apply adds one undo step; Undo/Redo/reload/JSON agree.
2. Existing labels explain local connections and two groups. No new controls, motion or theme colors. Supported desktop layouts and Schematic 390px remain usable with the existing canvas pan/zoom. Onboarding reflects the new result without changing the exercise.

## Requirements

- **FR-001** (US1): Every key contact belongs to exactly its intended matrix net; separate row/column/half nets never short. Preserve diode direction and unrelated retained circuits.
- **FR-002** (US1): Connect nearest compatible existing key contacts with orthogonal, deterministic paths; reject unintended pin contacts/collinear different-net overlaps, insulate different-net crossings. Aligned unobstructed contacts use a straight wire, including when insulated perpendicular crossings are necessary. Distinct wires never share a positive-length collinear section, even within one net; intentional joins occur at shared key contacts. Build local lines before output leads so outputs do not force bends into regular rows/columns. Bounded detours handle rotated/staggered contacts. Global minimum routing is not promised.
- **FR-003** (US2): Exactly one output per used terminal; each half has one aligned row block and one aligned column block, sorted by terminal index. Rows are above their half; columns are beside its exterior edge, both initially 1u from key bounds. All labels clear key bounds by existing 1u clearance and each other by at least 0.5u.
- **FR-004** (US1, US2): Regular 3×3 and 6×6 layouts have less total wire length than the former independent-to-output layout. Key geometry/bindings remain unchanged; matrix cells follow the existing selected grouping rules.
- **FR-005** (US3): Retain existing preview/commit/cancel, history, persistence, GPIO reuse and resource failure behavior; older files remain loadable without migration.
- **FR-006** (US3): Explain connected lines/two output blocks in Wiring and onboarding; maintain accessible controls and existing themes/responsiveness/reduced motion.

## Edge cases

Empty and single-key layouts; rows with one member; asymmetric halves; 90°/arbitrarily rotated keys; wide keycaps; coincident contacts; occupied GPIOs/encoders; manual circuits crossing proposed lines; wire/crossing budgets; stale preview. Universal means layout-independent routing within existing electrical/resource limits, with readable atomic refusal when infeasible.

## Key entities

Matrix net: intended terminal plus its key contacts. Route tree: orthogonal local connections and one output lead. Output block: ordered terminals on a common exterior line.

## Success criteria

- **SC-001**: All accepted fixtures have one intended net per contact, no unintended joined terminals and one output per terminal; independent domain analysis succeeds.
- **SC-002**: 3×3/6×6 measured total route length is below the legacy star baseline; repeated results are identical.
- **SC-003**: All output-block alignment/clearance tests pass for unibody and asymmetric split layouts.
- **SC-004**: Browser preview/Cancel/Apply/Undo/Redo/reload/downloaded JSON agree; all required checks pass with actual limits recorded.

## Assumptions and open questions

Matrix mode is the requested rows/columns scenario; direct scan retains its existing algorithm. Existing user-selected cell grouping is authoritative: geometric layout cannot identify actual hardware wiring. No external dependencies; two groups per half for split. No unresolved material questions.

Rendered refinement: column labels face outward; row labels extend vertically upward. Automatic routes avoid the reserved label areas. Output pitch is 1u so groups remain readable at ordinary zoom; user pan/zoom remains available.

Topology compatibility: automatic matrix reconstruction after mode/topology changes uses the same tree router as Rebuild, so applying split and returning to unibody restores the same deterministic route geometry. Direct and individual cell/dimension edits retain their existing routing contracts.
