# Onboarding interaction and integration contract

Normative user outcomes are [spec.md](../spec.md); storage/transition details are [data-model.md](../data-model.md).

## UI surface

Welcome starts automatically only on first display; it explains isolated practice before any project edit. Lower navigation contains `Take the tour again` in every workspace. Tour panel shows heading, step X of Y, what/why/action, unmet condition, Back, applicable Next/Confirm, Skip tour and Exit tour. Disabled actions have a visible reason. Skip exits the remaining tour; it never certifies completion.

Use existing English UI vocabulary for rendered copy. Russian specification text is not a request to introduce localization. All pointer-only instructions include the existing keyboard/field route. The 3×3 exercise accepts a common translation but requires nine unrotated equal 1u keys at unit pitch and digit assignments in geometric row-major order.

## Targets

Each target anchor has one typed stable ID, one workspace and one owning component. The required target groups are project name; Schematic add/positions; controller; diodes; wiring including visible Apply/Cancel; pin assignments; Bindings base-layer actions; Problems and issue repair; Firmware fields; generated file groups; ZIP action; discovery entry points. Implementation defines exact IDs in one shared typed table and adds anchors at the real owners listed in plan.md. Tests use accessible roles/names; IDs locate the spotlight, not replace semantic assertions.

A target may be composite to keep all controls needed for a gesture available. Canvas/parts-table alternatives form one teaching task without requiring a mouse. Reveal a closed panel through normal UI state; don't invoke edit handlers through DOM injection. No target means paused UI with Retry and Exit, never success. Keep the active control, its focus ring and required Apply/Cancel outside dimming/occlusion.

## Signals and dependency boundary

- Project provider exposes begin/resume/return/adopt and active mode through its existing public context. It owns save destination and session-switch token invalidation.
- Pure progress query accepts Project and supplied domain analysis facts; returns satisfied/unmet prerequisites, without I/O, DOM or catalog imports.
- Workspace presentation reports typed readiness and file-inspection events. No component calls an onboarding electrical engine.
- Export reports `zip-download-started` only after successful downloadBlob, with captured session/project identity. Pending, blocked and failed ZIPs produce no success receipt. Changing Project while async export builds invalidates that receipt.
- No shared UI module imports a workspace/app. The app composes controller, overlay and workspace adapters through explicit public APIs. No new context/provider or arbitrary global event bus.

## Focus and announcements

Non-modal teaching panel and active target are keyboard reachable; unrelated branches are inert, without marking a target ancestor inert/aria-hidden. One shell status region announces step/status changes once. Focus moves on actual step changes; editing keystrokes do not reset it. Workspace heading focus and step focus are coordinated so they do not race. Nested popovers/dialogs/drafts own Escape first; otherwise Escape takes the safe exit path. Return restores source workspace and a live focus target; replay button is the fallback.

Observers follow scroll/resize/layout, stop when hidden/exited, and never smooth-scroll under reduced motion. A bottom panel on constrained screens must reserve usable target space; text/controls reflow at 200%. Modal safety choices use existing Dialog and named destructive buttons; cancellation preserves data.

## Export and compatibility

Normal parser, validation, preview and ZIP writer remain authoritative. No tutorial fields appear in project JSON or generated files. The downloaded ZIP must represent the same accepted Project inspected by the user. Completion proves browser handoff only. Build/flash instructions explain external work without claiming hardware validation.
