# Findings and 036 research handoff

**Reviewed application**: `a965e93` (same runtime code as `4436ad1`). **Date**: 2026-10-21. Research only; no fixes implemented. Evidence environments and limits are in [coverage](coverage.md); commands/raw paths are in [journal](verification.md).

All priorities below describe user impact and investigation order, not permission to defer first-major requirements. Original roadmap report N maps permanently to **035-RNN**. New findings start at R22; none replaces the original 21. Source references are repository paths/line locations at the reviewed revision. Runtime artifact names refer to the journal’s local ignored evidence directory.

## Summary

23 entries: 21 original reports plus 2 additional observations. No confirmed blocking data-loss/unsafe-output finding was established. High-priority investigation/contract work: R01, R03, R07–R10, R18–R19. The exact original topology, scattering, movement and L-crossing failures remain open: passing a nearby scenario does not close them. Numeric rotation translation is reproduced and conflicts with the requested own-center outcome, while matching an existing common-origin contract. R22 is a rendered narrow-layout access problem; R23 is a discoverability proposal.

73 existing Chromium journeys passed; this establishes those scenarios only. Full manual accessibility/OS/zoom acceptance remains open. 036 is not implementation-ready until the affected material choices below are agreed and unresolved bug symptoms have failing reproductions. Research does not amend existing application contracts automatically.

## Single report → finding → acceptance/check register

### 035-R01 — Encoder placement and wiring

**Source**: roadmap 036 report 1. **Priority**: high. **Disposition**: Confirmed missing capability; new behavior. **Owner**: 019 / 003 / 012 / 013.

**Evidence / reproduction**: `src/domain/encoder-types.ts:3–12`, `src/ui/schematic/rendering/components/encoders-layer.tsx:5–20`, `src/ui/schematic/tools/components/tool-options.tsx:9–19`. Encoder markers are noninteractive circles; model has position/A/B assignments but no rotation or schematic contact identities.

**Proposed acceptance**: Given an explicitly supported encoder, when placing/rotating/wiring it by pointer or keyboard alternative, then real modeled contacts and visible geometry agree; per-layer actions survive history, save/reload and export.

**Decision / remaining investigation**: Agree contact geometry/common/ground and optional push-key association, pin assignment ownership and migration. Never infer the user’s actual pinout.

**Required verification in 036**: New capability regression journeys, schema/old-file tests if changed, contact/net and output contracts.

### 035-R02 — Slow magnetic rotation snap

**Source**: roadmap 036 report 2. **Priority**: medium. **Disposition**: Confirmed missing capability; new behavior. **Owner**: 012 / 019.

**Evidence / reproduction**: `src/domain/geometry/transforms/rotate-key-from-pointer.ts:5–10,32–50`: existing Shift snap is 15°; no timing/speed input. Existing pointer transform preserves visible center.

**Proposed acceptance**: Given slow approaches in either direction, when approaching 0°, 90°, 120° or 180°, then the agreed snap engages without center/size drift; fast passes, release and wraparound follow the agreed rules.

**Decision / remaining investigation**: Agree speed measurement/threshold, tolerance, hysteresis, equivalent negative angles and precedence with Shift.

**Required verification in 036**: Native pointer trajectory, angle/center/corner observations, Undo/Redo and saved values; encoder cases depend on R01.

### 035-R03 — Topology round trip

**Source**: roadmap 036 report 3. **Priority**: high. **Disposition**: Reported symptom not reproduced in bounded probe. **Owner**: 013 / 032 / 033.

**Evidence / reproduction**: Current probe: auto-wired 2×2 matrix, unibody→split→unibody within one unsaved preview returned exactly the original 24 rendered path strings without closing Wiring; saved topology remained unibody until Apply. `edit-wiring.ts:224–237` changes topology/cells. See `final-probes.json` topology-return.

**Proposed acceptance**: Given automatic wiring, when topology returns to unibody, then drawing/table/project agree immediately without hiding the panel; Apply and history preserve the intended arrangement.

**Decision / remaining investigation**: Define exact original route restoration versus electrically equivalent regrouping. Investigate Apply between transitions, direct scan and the original user project.

**Required verification in 036**: Record both preview and applied transitions, path geometry, serialized project, nets, Undo/Redo and ZIP.

### 035-R04 — Resizable editing panel

**Source**: roadmap 036 report 4. **Priority**: medium. **Disposition**: Confirmed missing capability; intended target needs confirmation. **Owner**: 001 / 033.

**Evidence / reproduction**: Desktop screenshot shows **Schematic editors on the right**, width 360px at 1440px; below canvas at narrower sizes. `src/styles.css:96–109` fixes 22.5rem/35% budget; no resize handle. User called it the left block.

**Proposed acceptance**: Given the agreed editing panel, when resized by pointer or keyboard, then controls reflow and remain reachable while the canvas retains the agreed budget in both themes.

**Decision / remaining investigation**: Confirm actual panel; agree default/min/max, narrow layout, preference persistence/reset. Reconcile 033’s ≤360px/35% contract.

**Required verification in 036**: Resize bounds, keyboard handle, overflow/focus, viewport and native zoom cases; no project/history mutation.

### 035-R05 — Remove editor-wide buttons

**Source**: roadmap 036 report 5. **Priority**: low. **Disposition**: Controls confirmed present; requested contract change. **Owner**: 001 / 033.

**Evidence / reproduction**: Rendered `rebuild-applied.png`; `src/ui/schematic/components/schematic-editor-panel.tsx:61–81` contains Collapse/Expand/Open and Close editors. Existing 033 requires collapse/close.

**Proposed acceptance**: Given Schematic editors, when navigating all sections and issue repair links, then Collapse editors/Close editors are absent and every required editor remains keyboard reachable.

**Decision / remaining investigation**: Agree remaining section/reopen behavior and reconcile 033 before deleting controls.

**Required verification in 036**: Pointer/keyboard access to sections, Problems repair focus, preview cancellation and unchanged project.

### 035-R06 — Duplicate diode documentation links

**Source**: roadmap 036 report 6. **Priority**: low. **Disposition**: Confirmed duplicate destinations from source; three rendered links observed. **Owner**: 013 / 033.

**Evidence / reproduction**: `wiring-options-controls.tsx:95–112`; `src/catalog/controllers/wiring-options.ts:7,35,41` give matrix scan and diode direction the same pinned matrix-driver target. Three icons are visible in `rebuild-preview.png`.

**Proposed acceptance**: Given matrix/direct and unibody/split options, when inspecting documentation links, then each retained link has a distinct relevant purpose/destination and intelligible accessible label.

**Decision / remaining investigation**: Deduplicate equivalent destinations without dropping distinct topology information. Link availability was not checked over the network.

**Required verification in 036**: Rendered link labels/targets for each mode/topology; relevant pinned references before changing catalog facts.

### 035-R07 — Rebuild visual corruption and selection

**Source**: roadmap 036 report 7. **Priority**: high. **Disposition**: Visual corruption not reproduced; preview selection lock confirmed by source. **Owner**: 003 / 013 / 033.

**Evidence / reproduction**: Probe showed coherent buses before/after Apply (24 sections; 8 saved wires). `src/ui/schematic/logic/use-schematic-workspace.ts:98–127` intentionally blocks edits in preview and cancels preview on tool change. Screenshot shows the existing visual feedback, not proof that all routes are correct.

**Proposed acceptance**: Given a wired fixture, when rebuilding, then preview and committed geometry are coherent; after Apply, Select works immediately; Cancel restores original. Pending read-only state is clear.

**Decision / remaining investigation**: Obtain original scattering fixture; separate cancellation from redraw. Do not remove the Apply/Cancel contract by inference.

**Required verification in 036**: Native selection before/after Apply, screenshot/path comparison, exact history and saved/exported agreement.

### 035-R08 — Auto-wiring an unwired project

**Source**: roadmap 036 report 8. **Priority**: high. **Disposition**: Unsaved cancellation reproduced; applied loss not reproduced. **Owner**: 013 / 032 / 033.

**Evidence / reproduction**: Unwired four-key probe: Complete→Key tool cancelled proposal, left saved project unchanged, removed Apply and rendered sections. Rebuild→Apply→Select retained 8 wires/24 sections. `use-wiring-preview.ts:28–39` and workspace tool-change cancellation explain the lifecycle.

**Proposed acceptance**: Given no wires, when Complete/Rebuild is applied, then routes remain visible/selectable across tool/selection changes; cancelling unsaved work leaves the exact original project/history.

**Decision / remaining investigation**: Agree whether tool/panel changes cancel or retain preview or require explicit resolution; make the chosen policy visible. Scattering remains unconfirmed.

**Required verification in 036**: Exercise both actions, pending versus applied states, selection/tool/panel changes, history, reload and downloaded JSON/ZIP.

### 035-R09 — Horizontal movement in wired 2×2

**Source**: roadmap 036 report 9. **Priority**: high. **Disposition**: Reported refusal not reproduced in bounded probe. **Owner**: 003 / 012 / 033.

**Evidence / reproduction**: Auto-generated 2×2 at (5,5),(7,5),(5,7),(7,7): native upper-right drags by +0.5u X, −0.5u X and +0.5u Y all changed saved geometry; each Undo restored the fixture. `pointer-select.ts:265–273` message only says moveKeys returned unchanged.

**Proposed acceptance**: Given the exact affected wired 2×2, when making an otherwise valid horizontal move, then position changes with intended net membership preserved; legitimate overlap/limits refuse atomically.

**Decision / remaining investigation**: Exact user project, spacing/route, snap and movement distance still needed for a failing reproduction; this fixture does not close the report.

**Required verification in 036**: Pointer/nudge/numeric failing regression first, independent pin-net partitions and wire geometry, Undo/Redo/reload/JSON/export.

### 035-R10 — L-shaped wire crossing sections

**Source**: roadmap 036 report 10. **Priority**: high. **Disposition**: Reported one-sided hit failure unverified. **Owner**: 003 / 033.

**Evidence / reproduction**: Source computes crossing section boundaries (`src/domain/wires/get-wire-sections.ts:41–50,72–105,245–265`) and renders per-section 12px hit strokes (`wire-shape.tsx:30–45`). Existing intermediate-connection journey passed but is not the exact L-crossing reproduction.

**Proposed acceptance**: Given an L-shaped conductor and connected crossing, when selecting each side away from the junction, then the intended section highlights; list selection agrees and each deletion/Undo preserves the other branches.

**Decision / remaining investigation**: Exact orientation/project and click positions remain to reproduce. Insulated crossings must not be split as connected junctions.

**Required verification in 036**: Native click coordinates and hit-target identity at multiple zooms, both sides, Shift selection, list alternative and exact restoration.

### 035-R11 — Wire marquee selection

**Source**: roadmap 036 report 11. **Priority**: medium. **Disposition**: Confirmed missing capability from source. **Owner**: 003 / 033.

**Evidence / reproduction**: `src/ui/schematic/interaction/pointer-select.ts:163–164` collects keys and explicitly sets wireIds to an empty list.

**Proposed acceptance**: Given keys and wires, when drawing a selection rectangle, then the agreed key/wire-section set highlights and deletion/history affects exactly that set; keyboard alternative reaches the same result.

**Decision / remaining investigation**: Agree section versus entire wire, intersection versus containment, additive modifier and mixed-selection rules.

**Required verification in 036**: Native marquee plus list/keyboard parity, deletion, Undo/Redo, connection cleanup and saved state.

### 035-R12 — Remove button right of Center keyboard

**Source**: roadmap 036 report 12. **Priority**: low. **Disposition**: Identity confirmed in source and rendered interface: Reset view. **Owner**: 001 / canvas.

**Evidence / reproduction**: `src/ui/canvas/components/surface-controls.tsx:45–50`; actual screenshot and accessible control list place Reset view immediately right of Center keyboard. Shortcut `0` is specified in 001 shortcuts.

**Proposed acceptance**: Given either canvas/help/shortcuts, when looking for or invoking Reset view, then the button and associated action entry points are absent while centering and pan/zoom remain.

**Decision / remaining investigation**: Confirm Reset view is the intended removal; it is now identified rather than guessed from position. Reconcile 001 shortcut contract.

**Required verification in 036**: No button/help/0 invocation; Center keyboard and retained pan/zoom work by keyboard and pointer.

### 035-R13 — Settings gear icon

**Source**: roadmap 036 report 13. **Priority**: low. **Disposition**: Sun graphic confirmed; requested polish. **Owner**: 001.

**Evidence / reproduction**: Rendered sidebar; `src/ui/components/icons/settings-icon.tsx:14–15` draws circle/rays. Settings accessible name remains in tab-bar.tsx:51.

**Proposed acceptance**: Given either theme, when viewing/focusing/activating Settings, then a recognizable gear retains the Settings name and unchanged dialog/focus behavior.

**Decision / remaining investigation**: No material design choice beyond existing icon conventions.

**Required verification in 036**: Light/dark visual review and keyboard open/Escape/focus return.

### 035-R14 — Redundant Wiring action

**Source**: roadmap 036 report 14. **Priority**: medium. **Disposition**: Blocked product choice: exact pair and retained action not established. **Owner**: 013 / 033.

**Evidence / reproduction**: Rendered Wiring has **Complete wiring** and **Rebuild wiring** plus conditional **Apply wiring/Cancel wiring**; `wiring-options-controls.tsx:136,147`, `wiring-controls.tsx:113–119`. Their different outcomes are real.

**Proposed acceptance**: Given the agreed action simplification, when entering Wiring, then only necessary actions remain and users can still complete missing wiring, intentionally rebuild where supported, and clearly apply/cancel proposals.

**Decision / remaining investigation**: Identify the intended pair and retained outcome. Do not silently delete Complete or Rebuild, or conflate them with Apply/Cancel.

**Required verification in 036**: Coverage for each retained outcome and preservation of manual conductors, preview/history and safe cancellation.

### 035-R15 — Escape activates Select

**Source**: roadmap 036 report 15. **Priority**: medium. **Disposition**: Canvas-focus case passed; broader reported context unresolved. **Owner**: 003 / shortcuts.

**Evidence / reproduction**: Probe Key tool→canvas Escape ended with Select checked. `schematic-shortcut-handlers.ts:99–107` cancels a draft first; `use-schematic-shortcuts.ts:57–60` scopes handling to canvas focus.

**Proposed acceptance**: Given Key tool and canvas focus without higher-priority draft/dialog, when Escape, then Select activates without adding a key/history entry. Draft/dialog/input cases follow explicit cancellation precedence.

**Decision / remaining investigation**: Check original focus location (tool button, field, panel or canvas). If global Escape is intended, amend scope rather than mislabeling current scoped behavior.

**Required verification in 036**: Canvas, active draft, tool focus, panel, text input and modal cases using native keys.

### 035-R16 — Canvas tooltips

**Source**: roadmap 036 report 16. **Priority**: medium. **Disposition**: Most hints absent by source; labels exist. **Owner**: 001 / canvas.

**Evidence / reproduction**: `surface-controls.tsx:37–50` supplies accessible labels but only CenterKeysButton supplies a hint. `icon-button.tsx:12–15` and `button.tsx:70` make tooltip conditional. Do not classify this as missing accessible names.

**Proposed acceptance**: Given each retained canvas control, when hovering or keyboard focusing, then a readable action/state hint appears and can dismiss; snapping meaning and pressed state are understandable.

**Decision / remaining investigation**: Agree snap on/off wording; respect existing tooltip conventions and reduced motion.

**Required verification in 036**: Hover/focus/Escape, clipping at narrow/desktop sizes and meaningful accessible names/states.

### 035-R17 — Create with agent prominence

**Source**: roadmap 036 report 17. **Priority**: low. **Disposition**: Current order/emphasis confirmed; requested improvement. **Owner**: 001 / 034.

**Evidence / reproduction**: Rendered project bar places Create with agent before Undo/Redo; `project-bar.tsx:120–123` uses ordinary Button without AI badge.

**Proposed acceptance**: Given supported widths/themes, when inspecting project bar, then Create with agent is far right with restrained outline and AI badge, coherent wrapping/tab order and clear name.

**Decision / remaining investigation**: Do not imply AI runs inside this static app. Preserve package scope/explanation.

**Required verification in 036**: Responsive/light/dark screenshots, keyboard order, dialog and actual package download.

### 035-R18 — macOS key copy/paste

**Source**: roadmap 036 report 18. **Priority**: high. **Disposition**: Key clipboard capability absent in registry; OS symptom not tested. **Owner**: 003 / 004 / 012 / shortcuts.

**Evidence / reproduction**: `src/ui/shortcuts/shortcuts.ts:146–148` provides Bindings action copy/paste only; no Schematic geometry clipboard. Existing session action clipboard deliberately preserves text editing.

**Proposed acceptance**: Given selected keys and macOS canvas focus, when Cmd+C/Cmd+V, then the agreed data is inserted once with fresh IDs and one-step history; native text and existing Bindings action clipboard remain intact.

**Decision / remaining investigation**: Agree workspace, geometry/layers/diodes/wires/cells copy scope, paste anchor/offset, repeated pastes and cross-project handling. Requires explicit capability specification.

**Required verification in 036**: Actual macOS clipboard/native keys, field precedence, referential integrity, Undo/Redo, reload and export; Linux automation is insufficient.

### 035-R19 — Numeric rotation about own center

**Source**: roadmap 036 report 19. **Priority**: high. **Disposition**: Visible translation reproduced; existing common-origin contract conflicts with request. **Owner**: 012 / 019.

**Evidence / reproduction**: Select upper-right off-origin key; Precise properties→Selected rotation 90°, default origin 0,0. Before box x653.17/y423.67; preview x29.17/y519.67, same 45.66px dimensions: center shifts −624/+96px. Unwired Apply saves rotationDeg=90 at xU=7,yU=5. `layout-fields.tsx:9–11,30`; 012 FR-004 explicitly uses common absolute origin; FR-015 pointer rotation preserves center.

**Proposed acceptance**: Given one or multiple off-origin keys, when entering numeric angle, then each visible center and dimensions remain fixed, contacts rotate consistently and saved/exported geometry matches; Undo restores exactly.

**Decision / remaining investigation**: Reconcile FR-004/common-origin fields with new per-key center semantics and encoder model; preserve optional explicit-pivot use only if intentionally retained.

**Required verification in 036**: Independent before/after centers/corners, off-origin rotated/nonstandard/multi-selected keys, pointer parity, contacts, preview/cancel/history/reload/export.

### 035-R20 — Remove Bindings snap toggle

**Source**: roadmap 036 report 20. **Priority**: low. **Disposition**: Shared snap entry point confirmed. **Owner**: 001 / 004.

**Evidence / reproduction**: Actual Bindings screenshots/control list show Snap to grid. `surface-controls.tsx:19–20,37–41` mutates shared preference and is rendered for both workspaces.

**Proposed acceptance**: Given Bindings, when inspecting canvas controls, then snap button is absent; Schematic retains its control and existing project data is unchanged.

**Decision / remaining investigation**: Decide whether removal affects only the entry point or also shortcut/settings behavior in Bindings. Preserve shared preference intentionally.

**Required verification in 036**: Both workspaces, Settings/shortcut behavior, theme/layout and no project/history side effects.

### 035-R21 — Problems danger emphasis

**Source**: roadmap 036 report 21. **Priority**: medium. **Disposition**: Neutral presentation confirmed; requested hierarchy change. **Owner**: 001 / issues.

**Evidence / reproduction**: Actual screenshots show neutral Problems (20)/(0); `src/ui/shell/components/issues-toggle.tsx:15–23` uses default Button.

**Proposed acceptance**: Given a nonzero problem count, when viewing/focusing Problems, then semantic danger styling retains text/count/name, readable contrast and unchanged issue navigation.

**Decision / remaining investigation**: Agree zero-count neutral versus danger, and warnings-only presentation. Do not use color as the only signal.

**Required verification in 036**: Both themes/count states, keyboard toggle and issue repair focus; token contrast for chosen pair.

### 035-R22 — Narrow canvas overlays obscure controls

**Source**: additional 035 observation. **Priority**: medium. **Disposition**: Additional rendered finding; hit-test confirmation in final probe. **Owner**: 001 / canvas / 033.

**Evidence / reproduction**: At 390×844 with Tools expanded, its panel x≈76–251 overlaps the top-right controls. Snap button x201–233/y326–358 lies under Tools; Zoom in is partly covered. Screenshot `narrow-controls.png` and read-only hit-target observations distinguish overlap from document overflow (scrollWidth still equals 390).

**Proposed acceptance**: Given the supported 390px Schematic view, when Tools is expanded, then every retained canvas control remains visible/reachable by pointer and keyboard without one overlay obscuring another or focus.

**Decision / remaining investigation**: Choose wrapping, relocation or compact presentation using existing tokens; preserve canvas/panel budgets. This is within 033 support, not a promise of mobile support elsewhere.

**Required verification in 036**: Actual element hit testing plus screenshots and keyboard focus at 390px, both themes, long labels/native zoom; repeat after R12/R20 change toolbar contents.

### 035-R23 — Preview status/actions can be out of view

**Source**: additional 035 observation. **Priority**: medium. **Disposition**: Additional observed discoverability concern; proposed improvement. **Owner**: 013 / 033.

**Evidence / reproduction**: After Rebuild in 360px editor, the scrolled panel screenshot shows neither top Wiring preview label nor bottom Apply/Cancel; canvas is read-only, while global save status still describes committed data. Label/actions exist in DOM; current screenshot does not establish a missing control or data-loss defect.

**Proposed acceptance**: Given a wiring preview while the panel is scrolled, when viewing/interacting with canvas, then unsaved/read-only status and the way to apply/cancel remain discoverable without guessing why selection stopped.

**Decision / remaining investigation**: Agree persistent preview indication/action placement. Do not replace the committed save status with a false autosave claim. Coordinate with R07/R08/R14.

**Required verification in 036**: Scroll to top/middle/bottom, keyboard focus and narrow/desktop review; preview, apply, cancel and tool changes agree with saved project/history.

## Decision gates for 036

- Hardware/model: R01 encoder contacts, optional push relationship and schema; R02 magnetic snap thresholds/hysteresis.
- Interaction scope: R04 exact panel and sizing; R05 replacement panel access; R11 marquee semantics; R12 confirmed action removal; R14 retained wiring action; R15 Escape focus scope; R18 clipboard data/placement; R19 pivot semantics; R20 shared snap behavior; R21 zero/warning count styling.
- Reproduction: original fixtures/conditions for R03, R07–R10 and broader R15. Do not choose a technical repair based only on a symptom or source hypothesis.
- Review: actual macOS clipboard, native 200% zoom, OS keyboard and screen-reader speech. Current manual gaps remain open in tasks.

Before implementation, amend each affected owning requirement/contract and link 036 tasks/regressions back to these stable IDs. Priority does not silently remove or postpone any of the 21 first-major reports. No 036 source/test task was executed in this research.
