# Feature Specification: Wiring and settings usability

**Feature Branch**: `feature/033-wiring-and-settings-usability`
**Created**: 2026-10-20
**Status**: Specified; ready for planning; implementation depends on feature 032
**Input**: User approved the next roadmap step: specify and clarify 033. On 2026-10-20 the user selected incremental wiring with a separate rebuild action, and deletion of sections between connections with multiple selection.

## Goal and scope

Let builders complete wiring without destroying deliberate connections, move connected keys without losing electrical relationships, delete precisely selected wire sections, and edit settings while keeping the keyboard visible.

**In scope**: Incremental automatic wiring and explicit full rebuilding; durable intermediate-pin connections; wire-section selection/deletion; compact Schematic editing panels and shared app Settings window. Review automatic connection choices rather than treating existing implementation as the target contract.

**Non-goals**: New scan modes or controller support, hardware detection, automatic inference of actual physical wiring, arbitrary wire-bend editing, redesigning Bindings/Firmware/Export, global visual redesign, onboarding, firmware compilation or flashing. Free-GPIO allocation and outward output placement belong to 032 and are reused.

**Existing contracts to preserve**: Old project imports; manual wiring and crossing insulation; key geometry/bindings/layers/settings; atomic Undo/Redo; project autosave/file round trips; actual schematic connectivity as the source of deterministic ZMK v0.3.0 export; offline use; keyboard and field alternatives. Existing projects with incomplete wiring remain editable and report validation problems. Specifying 033 does not waive 032's manual acceptance/delivery gate.

## User scenarios and acceptance

### US1 — Complete wiring without replacing deliberate work (P1)

1. Given a partially wired project with valid cells, pins and manual connections, when the user chooses **Complete wiring**, the preview retains those assignments/connections and proposes only missing ones. Geometry, bindings and unrelated circuits remain unchanged.
2. Given an unassigned key, completion uses the existing per-half grid and physical-center grouping as a candidate. Occupied manual cells are never renumbered or displaced. If the candidate is occupied or incompatible with retained wiring, the preview names the key and conflict and asks for manual grouping/cell repair; it cannot silently choose another hardware mapping.
3. Given missing conductors on a compatible net, completion reuses that net rather than adding duplicate conductors. It adds only connections required for the missing key pins/terminals. It never joins distinct row/column nets or controller GPIOs, or crosses halves electrically.
4. Given invalid/conflicting existing cells, pins or connectivity, or insufficient capacity, completion refuses the entire proposal with specific repair guidance. Saved data/history are unchanged. A fully complete project produces an explicit “No wiring changes needed” result and no history entry.
5. Given a project whose wiring the user wants replaced, **Rebuild wiring** explains before preview that managed key wiring and cell assignments will be replaced. It uses the 032 regrouping, pin retention/allocation and outward-output rules; disconnected unrelated manual circuits are retained. It is a separate action from completion.
6. Given either valid proposal, the preview distinguishes retained, added, rerouted and removed sections and lists affected keys/pins and counts. Apply commits once; Cancel/Escape discard it. External project changes invalidate the proposal. Invalid proposals cannot Apply or affect saved-project export eligibility.
7. Given identical input, either operation proposes identical connections and routing. Conductors remain orthogonal, follow existing intentional connections, and use insulated crossings when new paths cross unrelated nets; no visual crossing silently shorts separate nets. Route length is secondary to electrical correctness and legibility; automatic shortest-path optimization is not promised.

### US2 — Keep intermediate pin connections when keys move (P1)

1. Given a wire drawn from key A through key B's pin to key C, the pin on B visibly joins the net. Moving A leaves B and C connected; moving B leaves A and C connected and reroutes B's attached branch to its new pin position. Moving C has the equivalent result. Non-moved keys and unrelated routing stay fixed wherever possible.
2. Given a key with several attached sections, moving or rotating it keeps every pre-existing pin relationship. Existing shared junctions stay at their previous positions; connected pin endpoints follow their key and orthogonal leads adapt. A move preview exposes any unavoidable routing refusal; a refused move changes nothing.
3. Given an insulated crossing, moving a nearby key never turns it into an electrical connection. Existing crossing insulation follows the 003 pair-of-wires crossing rule. Merely moving a key pin across an unrelated wire does not create a new electrical relationship; creating a new connection requires a wiring action.
4. Given a saved/reloaded or file-imported project, intermediate-pin relationships survive subsequent moves and Undo/Redo. Existing legacy geometric pin connections are preserved on import; insulated crossings remain insulated. Ambiguous/invalid legacy circuits remain repairable and cannot be silently “fixed” into a new electrical mapping.
5. Given keyboard-only editing, numeric position/rotation fields and existing nudge controls produce the same connection-preserving result as dragging.

### US3 — Select and delete wire sections precisely (P1)

1. Given Select mode, clicking a visible wire section selects the continuous conductor between adjacent electrical connection points: key pins, connected junctions or free/controller ends. Bends do not split a section; insulated crossings do not create connection boundaries. Highlighting shows the exact removable extent and its endpoints.
2. Given a section selection, Shift-click toggles additional sections; plain click replaces it; Escape or clicking blank canvas clears it. Plain entity clicks replace selection. Under 036 FR-024–026, marquee/Shift and list checkboxes allow mixed keys/sections with atomic deletion. A labeled wire-section list provides equivalent single/multiple selection with checkboxes and endpoint descriptions.
3. Given overlapping candidates or a dense crossing, the section list lets the user choose the intended section unambiguously; insulation controls and pin controls keep their own actions. Selecting a section does not move a key or begin wire drawing.
4. Given selected sections and focus on the canvas or wire-selection control, Delete/Backspace or **Delete selected sections** removes exactly the selection in one undo step. Keys and surviving branches remain. A text input retains native editing keys. Deletion is immediate and undoable; status reports the number deleted and an Undo action.
5. Given deletion that leaves disconnected pins or free ends, validation and export availability update to match actual surviving circuitry. Remove obsolete references/crossing insulation for deleted sections, retain controller assignments on surviving endpoints, and preserve independent branches. Do not delete surviving sections just because they no longer have a key at an original drawn-wire endpoint.
6. Given Undo/Redo, autosave/reload or file round trip after deletion, the same electrical result and geometry are restored. Selection itself is an editing state and need not be saved in the project file.

### US4 — Edit settings while keeping the canvas usable (P2)

1. At 1280×800 and 1440×900, Schematic uses at most one expanded editing panel, resizable under 036 FR-014–016: default 448px, 320–640px, capped at 45% of the editing area; at least 55% remains for the canvas. Selecting a different editing panel replaces the previous one without losing committed values.
2. At 768×1024 and 390×844, panels use a collapsible lower area no taller than 45% of workspace height. The canvas retains at least 50% of workspace height. Panel content scrolls inside its own area; controls and action buttons remain reachable without page-level horizontal scrolling.
3. The Editors region remains available with a heading and individual section summaries under 036 FR-017; editor-wide Collapse/Close and reopen controls are removed. Section changes and resizing change no project data or history. Editing panels are non-modal and do not trap focus.
4. Opening app Settings retains its existing modal semantics, Escape and focus return; at desktop it is no wider than 480 CSS px, and at every viewport it fits within viewport margins with its own vertical scrolling. Its contents use compact labeled groups. The current project remains visible behind it where space permits; dismissal restores full canvas access. This feature does not turn modal project-replacement dialogs into panels.
5. At 1280px with 200% zoom, responsive behavior follows the effective viewport. No focused control is hidden by an author-created panel; the panel scrolls a focused field into view. Controls preserve existing density and minimum 24×24px targets, readable labels and focus indicators in both themes. Selection/validation feedback uses text or shape as well as color, and reduced-motion users receive immediate state changes without decorative animation.
6. Empty selection shows a short selection hint without opening a large blank inspector. Wiring preview keeps its summary and Apply/Cancel reachable; errors identify what needs repair and cannot hide the active edit behind an unrelated panel.

## Requirements

- **FR-001**: Complete wiring MUST preserve valid existing assignments/manual circuits and add only missing connections according to US1.1–4.
- **FR-002**: Rebuild wiring MUST be a separate explicit action with replacement explanation and the 032 allocation/output contracts (US1.5).
- **FR-003**: Both actions MUST provide isolated, deterministic preview, named atomic refusal, no-op handling and one-step Apply/Undo (US1.4–7).
- **FR-004**: New routing MUST preserve intentional net boundaries, per-half scope and orthogonal conductors; unrelated crossings MUST be insulated (US1.3, US1.7).
- **FR-005**: Pin connections encountered while drawing MUST become durable electrical relationships surviving movement of every connected key (US2.1–2).
- **FR-006**: Key movement MUST preserve insulation and MUST NOT create new connections by geometric coincidence (US2.3).
- **FR-007**: Existing project imports, file/autosave round trips and Undo/Redo MUST preserve intermediate connections and remain repairable for invalid data (US2.4–5).
- **FR-008**: Select mode and an equivalent labeled list MUST support section-level single/multiple selection with exact extent feedback and mixed key/section selection under 036 FR-024–026 (US3.1–3).
- **FR-009**: Pointer/keyboard deletion MUST remove only selected sections atomically, retain keys/surviving branches, clean obsolete references and update validation (US3.4–6).
- **FR-010**: Schematic panels MUST satisfy US4's desktop/narrow canvas budgets, persistent access and independent scrolling rules.
- **FR-011**: App Settings MUST satisfy US4.4's size, modal keyboard/focus and scrolling rules.
- **FR-012**: Selection, panels, preview and feedback MUST satisfy US4.5–6's keyboard, focus, theme, zoom, reduced-motion and error requirements.
- **FR-013**: Accepted wiring, rendered schematic, saved files and deterministic ZMK v0.3.0 export MUST describe the same electrical result. Invalid wiring MUST remain visibly invalid and block export as before.

## Edge cases

Empty project; fully completed no-op; matrix/direct and unibody/split; unequal/rotated halves; intermediate diode-side pins; multiple keys on one conductor; several branches at one junction; collinear overlap; insulated versus connected crossings; duplicate GPIO/cell and capacity exhaustion; legacy geometric connections; key movement through an unrelated wire; move creating/removing insulated crossings; selection at low zoom; deletion adjacent to a controller endpoint; disconnected surviving sections; stale preview; imported/replaced project while a panel/selection is open; long labels/errors; virtual keyboard reducing viewport; 200% zoom. Multiple selected sections are deduplicated. Collapsed panels retain committed values and uncommitted field handling follows existing field commit/cancel semantics.

## Key entities

- **Electrical connection**: Intentional relationship among named key pins, controller endpoints and conductor junctions, independent of a key's coordinates.
- **Wire section**: Removable continuous conductor between adjacent electrical connection points, potentially containing multiple orthogonal bends.
- **Wiring proposal**: Reviewable retained/added/rerouted/removed connections with errors and Apply/Cancel state.
- **Panel state and wire selection**: Transient editing preferences/selections distinct from the serializable keyboard project.

## Success criteria

- **SC-001**: Partially wired matrix/direct and split fixtures retain every valid existing assignment and intentional connection after completion; invalid cases and Cancel preserve the saved project exactly.
- **SC-002**: A three-key intermediate-pin fixture retains expected net membership after independently moving each key, Undo/Redo, reload and file import; an insulated-crossing counterpart never joins nets.
- **SC-003**: Single/multiple section deletion through pointer and keyboard removes exactly the highlighted conductors, retains every key and independent branch, and produces matching validation/saved/exported results.
- **SC-004**: All US4 viewport budgets and keyboard/focus/theme/zoom checks pass on the specified viewport matrix. No accepted control becomes unreachable or produces page-level horizontal overflow.
- **SC-005**: Requirement-linked evidence distinguishes automated checks, rendered UI review and actual manual accessibility checks; unperformed mandatory acceptance is recorded and prevents claiming feature completion.

## Assumptions and open questions

**Confirmed by user, 2026-10-20**: Default automatic action completes missing wiring, with rebuilding separate; selection/deletion targets sections between connections and supports multiple selection.

**Proposed defaults**: A moving intermediate key keeps the old shared junction stationary and carries an attached lead. Completion retains physical-center/grid candidate grouping and refuses conflicts rather than inventing hardware mappings. Desktop and narrow panel budgets are specified in US4; full redesign of other workspaces is excluded. These defaults are ready for implementation planning; no material clarification remains.

**Compatibility reconciliation required during planning**: 003 FR-009/FR-012 and its key-endpoint cleanup rule cannot simply discard surviving conductor branches after section deletion; amend owning contracts before code. 003 FR-010's automatic pass-through connection applies when wiring is created, while FR-005/FR-006 above make that relationship durable through moves. 013/032's explicit full Auto assign behavior becomes Rebuild wiring; Complete wiring is the new additive operation. The old operation remains covered by its existing electrical/output requirements. Any schema change requires migrations and old-file tests; representation is a planning decision.

**UI/UX guidance applied**: Local UI/UX guidance searches on 2026-10-20 found guidance for dragging alternatives, unobscured focus, responsive layout and compact overflow. US2–US4 use fields/list alternatives, explicit focus restoration and bounded scrolling. Generic suggestions for 44px controls/new typography do not override the existing project density/tokens. React searches returned no verified match after one retry; React-specific guidance will come from project conventions during planning. No product-wide design-system replacement or animation dependency is introduced. Search guidance is not rendered UI acceptance evidence.

## Delivery authorization — 2026-10-21

The owner requested fixing PR #15 conflicts and enabling automatic merge after CI. This supersedes the earlier draft-only delivery boundary for this PR. T031 manual checks remain unperformed and must not be reported as passed; SC-005 evidence and full manual acceptance remain open. This is a delivery exception for PR #15, not a change to keyboard/accessibility behavior or general acceptance policy.


036 FR-029 supersedes the Complete wiring UI requirement: on explicit user selection (2026-10-23), remove its button and retain Rebuild wiring as the sole automatic action with replacement explanation and unchanged preview/Apply/Cancel/history contracts. Additive domain operations/tests remain historical supported contracts, without a UI entry point.

040 compact Wiring amendment (user2026-10-28) supersedes the Rebuild button name/duplicate entry: Generate wiring is the single replacement action, beside the distinct geometry-only Prettify. Matrix generation follows040 retained logical assignment contracts; historical direct retains the supported legacy full generator until its040 replacement is complete. Manual assignments remain available under a disclosure; GPIO stays visible. Preview/Cancel/Apply/history/protection contracts remain unchanged.
