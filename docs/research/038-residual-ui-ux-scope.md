# Archived proposal — residual audit scope after 036

**Cancelled (2026-10-25).** The user removed 038 from the roadmap and selected 037 onboarding next. This document preserves the historical investigation proposal and its evidence only; it creates no active backlog or prerequisite for 037. The earlier ordering and delivery instructions below are superseded. No 038 feature directory was created.

**Historical decision: 2026-10-25.** The user confirmed that all requested manual testing passed and selected **036 delivery → 038 residual fixes → 037 onboarding**, keeping those feature numbers. This is a documentation reconciliation, not a new rendered audit or authorization to invent defects. No 038 feature spec/plan/tasks exist yet; use the normal workflow when starting it after 036 delivery.

## Evidence and closed findings

The [035 research PR #23](https://github.com/Egor-Pizyk/zmk-customizer/pull/23) reviews runtime `4436ad1` / research `a965e93`, before 036. Its finding/coverage documents remain historical evidence on that branch. The accepted implementation is [036 PR #24](https://github.com/Egor-Pizyk/zmk-customizer/pull/24), reviewed at `464f098d64c446a810376b5499a13a2a0a6f2ee0`; see the [036 journal](../../specs/036-ui-ux-remediation/verification.md). User acceptance is reported, not independently observed; no OS/browser/assistive-technology details or hardware certification were supplied.

Every original 035 finding is accounted for below. Closed items are excluded from the 038 fix backlog unless a new regression is actually reproduced on the post-036 baseline.

| 035 finding | Outcome in 036 | Requirement |
|---|---|---|
| R01 Encoder placement/wiring | Implemented, including linked push key, compatibility and contact output | FR-001–011 |
| R02 Magnetic rotation | Implemented with approved thresholds | FR-012 |
| R03 Topology round trip | Preview checkpoint/pin restoration repaired | FR-013 |
| R04 Resizable editor | Left panel sizing and preference implemented | FR-014–016 |
| R05 Global editor buttons | Removed; individual access retained | FR-017 |
| R06 Duplicate docs | Deduplicated | FR-018 |
| R07 Rebuild corruption/selection | Proposal selection, marks and mutation guards repaired | FR-019–020 |
| R08 Unwired rebuild | Fresh matrix/direct lifecycle verified | FR-021 |
| R09 Connected horizontal move | Crossing continuity repaired | FR-022 |
| R10 L-crossing sections | Regression-verified; no production repair required | FR-023 |
| R11 Wire marquee | Mixed intersection selection and atomic deletion implemented | FR-024–026 |
| R12 Reset control | UI/shortcut/implementation removed | FR-027 |
| R13 Settings icon | Gear implemented | FR-028 |
| R14 Competing wiring actions | Complete removed, Rebuild retained | FR-029 |
| R15 Escape to Select | Regression-verified; no production repair required | FR-030 |
| R16 Canvas hints | Hover/focus/state hints implemented | FR-031 |
| R17 Agent action prominence | Reordered, outline and AI badge implemented | FR-032 |
| R18 Key clipboard | Ordinary-key snapshot and native field precedence implemented | FR-033 |
| R19 Numeric rotation | Own-center geometry repaired, explicit origin preserved | FR-034 |
| R20 Bindings Snap | Entry point removed, shared preference retained | FR-035 |
| R21 Problems emphasis | Danger for nonzero, neutral zero implemented | FR-036 |
| R22 Tools overlap | Separate toolbar and preserved drawing budget implemented | FR-037 |
| R23 Preview visibility | Persistent wiring/layout status and Apply/Cancel implemented | FR-038 |

## Remaining review backlog — no confirmed residual defect yet

These come from the explicit limits in 035 coverage, rather than treating old symptoms as still broken. Reuse 036 scenarios and the user's accepted manual results; do not relabel accepted checks as unfinished.

| ID | Remaining coverage | Required result before calling it a fix |
|---|---|---|
| 038-G01 | Detailed advanced Bindings editor states: custom behaviors, combos, macros, conditional layers; mixed/error/disabled/cancelled states beyond overview captures | Current rendered observations, exact affected workflow and owning requirement; existing tests first, new regression only for an actual gap/defect |
| 038-G02 | Long project/layer/behavior names, long labels and text-spacing overrides across forms/dialogs/panels | Reproduce clipping, obscured controls/focus or page overflow within the supported viewport scope; distinguish intentional 2D table/canvas scrolling |
| 038-G03 | Measured text/control/focus contrast on used token/surface/state combinations | Actual measurements in both themes; screenshots alone do not establish contrast failure or conformance |
| 038-G04 | Remaining workspace × state × theme combinations outside 035's representative overviews, including Firmware/Export and dialog/repair feedback | A bounded coverage register with pass/finding/inapplicable/limited outcomes; do not infer a defect solely from missing evidence |

Each confirmed new issue needs a stable ID, baseline revision, fixture, environment, native interaction steps, expected/observed result, impact, owner and acceptance. A recurrence of R01–R23 links to the original ID plus new evidence; its historical resolution remains intact. Specify contract changes before production edits; regressions are tests-first, with rendered review and saved/history/export checks when affected. An empty fix list after completing this review is acceptable.

## Boundaries and delivery

- CI failures observed at the scope-reconciliation revision belong to **036 delivery**, before merge/038; they are not residual UI defects to defer. Static/unit, Firefox/WebKit, mutations/browser-mutations and aggregate checks failed while Chromium/image passed. Subsequent repairs and local verification are recorded in the 036 CI delivery journal; protected final CI, merge and release remain separate states.
- Do not reopen the accepted 036 manual checklist or duplicate its encoder, wiring, clipboard, rotation, toolbar and preview work.
- No broad mobile support for Bindings/Firmware/Export, visual redesign, deferred 020–022, mechanical module or tutorial implementation is authorized by this residual scope.
- Finish current 036 delivery first. Specify/review/fix and verify the genuine 038 residue next. Only then implement **037**, whose steps must describe the final controls and flows. README/repository-description closeout follows onboarding.

Change evidence and checks for this documentation update live in the [036 journal](../../specs/036-ui-ux-remediation/verification.md#manual-acceptance-and-next-scope--2026-10-25).
