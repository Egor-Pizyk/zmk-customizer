# Feature Specification: Agent-assisted configuration

**Feature Branch**: `feature/034-agent-assisted-configuration`
**Created**: 2026-10-21
**Status**: Initial creation implemented and automated checks passed; manual acceptance pending
**Input**: Roadmap 034. User selected downloadable agent package + Project JSON on 2026-10-21.

## Goal and scope

Let a user describe a keyboard to their own AI agent and obtain a complete project they can inspect, repair and export in Customizer. The app supplies its supported capabilities and current format without executing AI or making network requests.

**In scope**: Initial creation from scratch; downloadable instructions, current project schema, supported catalogs and complete examples; safe use of the existing Open, Problems and Export workflows.
**Non-goals**: Editing an existing project with an agent, MCP/server integration, AI providers/accounts/API keys, automatic application of agent output, firmware compilation/flashing, new hardware support.
**Existing contracts to preserve**: One serializable Project, current/legacy imports, replacement confirmation/history reset on Open, Undo/Redo for subsequent edits, pure deterministic ZMK v0.3.0 exports, existing three-action New dialog, keyboard access and offline operation.

## User scenarios and acceptance

### US1 — Give an agent current product knowledge (P1)

1. Given any project, including an invalid or empty one, when the user opens Create with agent from the project bar and downloads the package, then it contains a ready prompt, schema, catalogs, semantic guidance and complete examples for this application version without user project data or browser preferences.
2. Given the dialog, when the user navigates by keyboard, downloads or closes with Escape, then all controls have visible focus and closing returns focus to the opener. Content wraps and scrolls at 1024px and 200% desktop zoom in both themes, with no required motion.
3. Given packaging/download failure, when download is attempted, then a readable error and retry remain available, the current project/history is unchanged, and repeated activation while building cannot duplicate the download.

### US2 — Create and review a complete keyboard (P1)

1. Given the package and a description, the prompt directs the agent to clarify missing hardware facts or seek explicit agreement on proposed choices before generating layout, controller, wiring/pins/diodes, bindings/layers and requested supported firmware/advanced features. It does not silently choose actual hardware wiring.
2. Given a generated Project JSON, when the user saves current work and opens it with the normal replacement confirmation, then the app validates it through the ordinary import path. Rejected JSON leaves current project/history intact and names repairable fields; semantically invalid imported projects show Problems and cannot export until repaired.
3. Given the bundled complete unibody and split examples, when opened, then each is accepted and exports through the normal flow without validation errors. Subsequent edits support Undo/Redo and save/reload.

## Requirements

- **FR-001**: Offer a labeled Create with agent action and a dialog explaining download → agent → Project JSON → Open → review Problems → Export. Do not replace New or add creation choices inside its dialog. (US1)
- **FR-002**: Download a self-contained, deterministic package with instructions/prompt, format metadata, current Project JSON schema, supported controller/pin, binding/keycode, firmware, behavior/advanced-action and encoder facts, semantic rules and at least one complete unibody and one split example. Identify package format, project schema and pinned ZMK versions. No current project or browser data is included. (US1)
- **FR-003**: Derive machine-readable schema/catalogs from application sources and test for drift. Explain semantic constraints that a structural schema cannot establish, and treat app validation as authoritative. Remain usable offline after load. (US1, US2)
- **FR-004**: The prompt requests complete creation with only supported capabilities; asks for missing hardware facts or approval of proposals; uses catalog identifiers, not invented ones; separates optional advanced features from defaults. Output is an importable Project JSON, with assumptions and review instructions outside that file. (US2)
- **FR-005**: Explain safe backup/replacement, field-error repair, Problems/export gating and later Undo/Redo. Never silently import output or send data to an agent. Do not claim validation proves firmware compilation or physical operation. (US2)
- **FR-006**: Preserve project, persistence and history during package operations, including failure/cancel; show building/disabled, success and actionable retry feedback, with one download at a time. (US1)
- **FR-007**: Reuse native modal semantics, visible labels/focus, Escape and opener focus return; support both themes, wrapping/scrolling at supported widths and 200% zoom, reduced motion and the shell status announcement. (US1)

## Edge cases

Empty/invalid current projects still allow download. Unknown board/keycode or too-new schema is repaired rather than guessed. Duplicate identities, dangling references, over-budget files, conflicting GPIOs, split-half namespaces, diode polarity, durable wire contacts and advanced reference cycles require semantic checks. A structurally valid document can still be electrically invalid. Packages from older app versions must be regenerated for the current app when output is rejected. Interrupted or blocked downloads can be retried without editing the project. Closing a dialog during packaging must not make a stale completion affect a later dialog session.

## Key entities

Agent package: versioned instructions and product knowledge, independent of a user's Project. Generated project: the existing versioned Project file, not a new interchange model. Hardware agreement: facts supplied or explicitly approved by the user, stated outside Project JSON.

## Success criteria

- **SC-001**: Both bundled examples import, have zero export-blocking issues, and generate nonempty shield/keymap exports through existing production APIs.
- **SC-002**: Schema and all supported identifier sets in each downloaded package agree with current application sources in automated tests.
- **SC-003**: Keyboard download/cancel, failure/retry and example import/export journeys pass automated checks without changing unrelated project data; manual screen-reader/OS limits are recorded separately.
- **SC-004**: Package bytes are identical across repeated downloads and contain no current-project or browser metadata.

## Assumptions and open questions

Clarification 2026-10-21: user selected downloadable package + Project JSON; MCP excluded initially. Initial creation only follows the previously confirmed roadmap order. Existing-project editing remains future scope. No material product questions remain. Example pins describe proposed configurations for illustration, never detected hardware facts.
