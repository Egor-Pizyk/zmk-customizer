# Feature Specification: UI/UX audit and remediation specification

## Delivery reconciliation — 2026-10-25

The user requested merging the remaining PRs after accepting 036. This delivers the bounded historical research/handoff, not a claim that every broad audit check passed. All R01–R23 were implemented or regression-verified in [036](../036-ui-ux-remediation/verification.md), merged as PR #24 and released as v0.5.0. Material behavior decisions were resolved in that feature. Historical observations below retain their original revision and limits. The proposed [038 review scope](../../docs/research/038-residual-ui-ux-scope.md) was subsequently cancelled by the user; 037 onboarding is next. Historical coverage limits remain disclosed; accepted 036 manual checks are not reopened. T005 remains an explicit unperformed broad-audit limitation; it does not represent an unresolved reproduced defect or block delivery of this research record.


**Feature Branch**: `feature/035-ui-ux-audit-specification`
**Created**: 2026-10-21
**Status**: Historical research handoff delivered; 036 remediation accepted and released; broader audit limits retained
**Input**: Start documentation for roadmap 035 after 031–034 and the 012/004 standard-keycap-size follow-up. Audit the delivered application and specify actionable work for 036 before final onboarding 037.

## Goal and scope

Give maintainers an evidence-based account of where users cannot reliably discover, understand or complete keyboard creation and editing, and a testable remediation backlog. Review the delivered product rather than treating existing code, historical passing tests or skill recommendations as proof of usability.

**In scope**: All four workspaces, shared shell/settings/help/Problems, project lifecycle and cross-workspace flows delivered by 001–019 and 031–034, including standard keycap sizes and fixed-size Schematic switches. Inspect information hierarchy, labels, control consistency, feedback, accessibility, responsive layout and actual editing behavior. Reconcile the 21 explicit reports in roadmap 036 with audit evidence without dropping any report.

**Non-goals**: Fixing application code; introducing a new visual identity or design system; implementing 036 or onboarding 037; root README/repository-description closeout; deferred 020–022 or 2.0.0 mechanical features; firmware compilation or hardware certification. This specification defines the audit deliverables. The current research pass is recorded in coverage/findings; complete manual audit acceptance is still pending.

**Existing contracts to preserve**: Existing project imports and legacy custom geometry, immutable project edits, Undo/Redo, manual wiring and insulated crossings, deterministic export, offline/static operation, pinned ZMK v0.3.0, keyboard access and table/field alternatives. Any proposed change to an existing contract must be explicit and reconciled with its owning feature before implementation.

## User scenarios and acceptance

### US1 — Understand actual workflow failures (P1)

A maintainer can identify the exact step, environment and visible consequence of a problem.

1. Given a clean application at a recorded revision, when the reviewer creates a small keyboard from empty through layout, wiring, bindings, firmware, validation and ZIP download, then every step has a recorded outcome and any failure has reproducible steps and evidence.
2. Given preset, split and existing custom-size projects, when the reviewer edits them, uses Undo/Redo, saves and reloads, then the report distinguishes observed behavior from expected preservation of geometry, bindings and electrical data.
3. Given an untested or inaccessible environment, when results are recorded, then the case is marked unperformed or blocked with a reason, never passed by inference.

### US2 — Review accessible and usable presentation (P1)

A maintainer can assess whether users can reach and understand the same actions using different input and presentation settings.

1. Given each workspace and its relevant dialogs/panels, when reviewed by pointer and keyboard, then controls, focus order/visibility/restoration, cancellation, labels, shortcuts and non-drag alternatives are recorded against their owning requirements.
2. Given light/dark/System themes, narrower viewports, 200% zoom and reduced motion, when representative workflows are reviewed, then clipping, obscured focus, canvas visibility, scrolling and feedback are documented with actual evidence and environment details.
3. Given a screen-reader smoke test, when navigating workspaces, keys, errors and status messages, then actual speech observations are recorded separately from automated role/name checks; unavailable manual checks remain explicit.

### US3 — Turn findings into an accountable remediation scope (P1)

A maintainer can plan 036 without rediscovering each issue or losing the user's backlog.

1. Given the 21 numbered reports in roadmap 036, when the audit is reconciled, then each report maps to a finding or coverage entry and retains its original number, requested outcome and disposition, including reports not reproduced.
2. Given a confirmed finding, when its proposed outcome is specified, then it includes the owning feature/requirement, priority rationale, acceptance scenarios, preserved contracts and required verification.
3. Given duplicate symptoms or a proposed new capability, when triaged, then duplicates retain links to their source reports and new behavior is clearly distinguished from regressions. Unresolved product choices are identified before implementation planning.

## Requirements

- **FR-001 (US1)**: Record the reviewed application revision, date, project fixtures, browser/OS, viewport, theme and input method with every evidence set. Distinguish current observations, user reports and historical verification.
- **FR-002 (US1)**: Maintain one coverage register covering shared shell/project lifecycle, Schematic layout/diodes/wiring/controllers/encoders/KLE, Bindings keycap sizes/layers/actions/behaviors/combos/macros/conditional layers/encoder actions, Firmware options, Export preview/download, presets, auto-wiring and agent-package creation/import. Every area must have a result or an explicit unperformed reason.
- **FR-003 (US1)**: Include end-to-end empty-project creation, preset editing, split editing, existing-file/custom-size compatibility, agent-created project import, invalid import recovery and blocked-export repair. Check actual saved/downloaded data where a finding concerns data preservation, history or output.
- **FR-004 (US2)**: For each distinct interaction family, cover relevant empty, selected, mixed/multi-selected, invalid, disabled, preview, cancelled and successful states; explain inapplicable states. Review hierarchy, discoverability, concise explanatory copy, units, current values, feedback and control consistency.
- **FR-005 (US2)**: Review keyboard-only completion, pointer gestures and non-drag alternatives, field shortcut precedence, accessible names/states, focus visibility/order/restoration, dialog dismissal, Problems navigation and status announcements against the project's accessibility baseline. Record manual speech checks separately; do not claim accessibility conformance from automation alone.
- **FR-006 (US2)**: Review representative flows at 1440×900 and 1024×800 in light/dark, System theme resolution, native 200% zoom at 1280px and reduced motion. Include 390×844 for Schematic panels and Settings under 033. Smaller-screen observations elsewhere must distinguish existing scope from proposed expansion. Two-dimensional canvas/table scrolling is not automatically a defect.
- **FR-007 (US1, US3)**: Give findings stable IDs, source report links, affected workflow/entity, reproducible setup/steps, expected versus observed result, evidence, severity with user-impact rationale, ownership and status. Distinguish confirmed, reported-unreproduced, duplicate, proposed improvement and blocked investigation. Do not assign a technical cause without evidence.
- **FR-008 (US3)**: Account explicitly for all 21 roadmap 036 reports. A report not reproduced remains traceable with tested conditions and further checks; it is not silently closed. Additional audit findings supplement this backlog.
- **FR-009 (US3)**: For each proposed remediation, define a user-visible outcome and testable Given/When/Then acceptance, affected owning requirements/contracts, compatibility/history/export implications and checks needed to demonstrate the outcome. Record material unresolved choices as blockers to that item's implementation, rather than inventing hardware facts or behavior.
- **FR-010 (US3)**: Prioritize findings as blocking (data loss, unsafe output or core flow impossible), high (major workflow/access barrier), medium (recoverable friction) or low (polish), with rationale. Preserve every first-major requirement from 036; priority does not authorize deferral beyond the milestone.
- **FR-011 (US1–US3)**: Use local UI/UX skill guidance as review input and record accepted/rejected recommendations with reasons. Existing semantic tokens, product scope and accessibility rules take precedence. Source inspection and search output cannot substitute for rendered-interface evidence.
- **FR-012 (US3)**: Produce a summary of coverage, confirmed findings by priority, unresolved choices and manual limitations, plus the handoff to 036. Keep one finding-to-requirement-to-check mapping and link evidence rather than duplicating transcripts. Audit completion and remediation completion must have separate statuses.

## Edge cases

- Empty projects, no controller, missing pins/bindings, export-blocking validation and malformed/newer-version imports must remain inspectable without destroying current work.
- Long project/layer/behavior names, dense layouts, rotated keys, legacy nonstandard dimensions, multi-selection, split halves and overlapping panels may expose different failures.
- Native text selection/clipboard/Undo must be distinguished from canvas shortcuts, including macOS Cmd+C/Cmd+V reports.
- Preview/Apply/Cancel, workspace changes, Escape precedence and selection deletion may expose stale focus or unintended commits; inspect saved data and history where relevant.
- Passing historical tests do not close a newly reported defect. Failed reproduction is scoped to the recorded conditions.
- One root cause may explain several reports; preserve individual acceptance outcomes. Contradictory requirements must be resolved in their owning artifacts before a fix.

## Key entities

- **Coverage entry**: A workflow/state/environment and its observed outcome or explicit verification gap.
- **Finding**: Stable identity for a problem or improvement, linked to evidence, original reports, ownership, priority and disposition.
- **Remediation requirement**: A proposed user outcome with acceptance and preservation criteria for 036; it is not an implemented fix.

## Success criteria

- **SC-001**: Every area in FR-002 and journey in FR-003 has an explicit coverage outcome; none is silently omitted.
- **SC-002**: All 21 original 036 reports are traceable to evidence or an explicitly unresolved investigation entry.
- **SC-003**: Every confirmed finding has reproducible steps, expected/observed behavior, priority rationale and ownership; every proposed fix has testable acceptance and verification needs.
- **SC-004**: Every required presentation/input condition has recorded evidence or an explicit limitation. No unperformed check is labeled passed.
- **SC-005**: The 036 handoff identifies all blocking product decisions and preserved contracts, allowing each resolved item to be planned without repeating initial triage.

## Assumptions and open questions

- 035 is the audit/specification stage; implementation belongs to 036. No new page or product-wide visual redesign is requested, so generating a replacement design system is unnecessary.
- The user confirmed completion of the preceding 012 manual checks in this session on 2026-10-21. This is user-reported acceptance, not a new agent-observed manual run or proof that all workflows pass.
- Browser automation uses isolated test contexts. Ordinary browser profiles/native application control require explicit user authorization under project rules.
- The viewport matrix above is the proposed audit baseline, using the existing 033 small-screen scope. It does not promise full mobile support for all workspaces.
- No material question prevents planning the audit. Choices discovered by the audit, including the open behavior questions in 036, must remain visible until resolved; this spec does not resolve them pre-emptively.
