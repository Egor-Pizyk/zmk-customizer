# Implementation Plan: Agent-assisted configuration

**Branch**: `feature/034-agent-assisted-configuration` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

## Summary

Download a deterministic ZIP with prompt, current JSON Schema/catalogs, semantic guidance and complete projects from existing preset + wiring domain operations. A native Create with agent dialog exposes the flow; Open/Problems/Export remain authoritative.

## Relevant context

Startup docs; docs/roadmap.md §034; docs/architecture.md; docs/folder-structure.md; docs/tooling.md; docs/domain-model.md; code-quality typescript/control-flow/naming/observability; frontend react/accessibility/admin-ui/tailwind; docs/testing.md; docs/commands.md; specs/002-project-foundation/contracts/project-file.md; specs/033-wiring-and-settings-usability/data-model.md; docs/zmk/README.md, boards.md, kscan.md, keymap.md. Existing storage/project, storage/export, catalog controllers/bindings/firmware/encoders/presets, domain/project and wiring/editing own the facts. No ZMK syntax or generators change.

## Technical context

Existing React 19, TypeScript 7, zod 4 JSON Schema support and fflate only. Static/offline; no new dependencies. Package format version is independent from Project schema version. Machine-readable schema is structural; refinements/references/electrical validation remain authoritative in parseProjectFile and analysis.

## Scope and preserved contracts

Initial creation only, no current-project attachment, AI calls or MCP. No schema migration, new Project fields, generator change, New dialog change or import bypass. Package operations do not dispatch project changes.

## Constitution check

Pre/post design: pure existing domain operations; existing storage trust boundary; deterministic files and ZIP timestamps; source-derived catalog facts; no new dependencies or runtime network; semantic tokens/native dialog and keyboard controls. No exception required.

## Design and ownership

- storage/project exposes getProjectJsonSchema beside its authoritative projectSchema; it does not parse AI text separately.
- New storage/agent module builds files using source catalogs, stored prompt/guide strings and existing domain-generated examples. Exact @storage/agent alias added to tsconfig; no cross-module deep imports.
- Reuse buildExportZip and downloadBlob for packaging/browser I/O. Package metadata names format/schema/ZMK versions; no time, environment or user state. Include catalog identifiers/options/limits, not functions/Maps/Sets.
- CreateWithAgentDialog in ui/shell/components uses existing Dialog/Button. ProjectBar action opens the shared dialog id; conditional content unmounts on close so pending session state cannot affect a reopened dialog. A ref guards concurrent clicks and an unmounted/closed session must not trigger a late download. Use existing shared importSession invalidation semantics or a dialog-local download session token invalidated by the close handler; no new effect needed.
- UI outcome from ui-ux-pro-max searches: clear three-step ordered flow, concise backup/review note, single primary Download agent package action, visible building/error/success copy and retry; existing focus ring and native modal Escape/opener restoration. Default dialog wraps/scrolls; no animation or new tokens. No empty-state block because empty/invalid projects can download.
- Guidance searches: keyboard focus modal (ux); async event handler (react); dialog overflow responsive (html-tailwind). Accept focus/error reporting. Reject React Actions suggestion under owning project React rules; generic truncation/images not relevant to instructional text. No new page/design-system generation needed.

## Verification strategy

Tests first for schema/package: source identifier parity; complete examples independently parsed/analyzed/exported; deterministic file/ZIP bytes and no user input API. Integration tests use real App/providers and browser-boundary download/failure mocks only. Playwright real download → unzip → ordinary Open → Problems/Export verifies end-to-end output, keyboard Escape/focus (representative Firefox/WebKit native-dialog case tagged @cross-browser) and supported layout/themes. Production changes run whole Chromium via check:changed; direct focused tests are justified for red/green diagnosis and rendered-review screenshots. No firmware build needed: no generator/output syntax changes. Manual screen-reader/OS acceptance remains separate; draft PR if outstanding.

## Supporting artifacts

[research.md](research.md), [contracts/agent-package.md](contracts/agent-package.md), [quickstart.md](quickstart.md). Existing Project owns the data model; package contract describes new metadata without duplicating it. Task/evidence mapping only in tasks.md; one journal in verification.md.

## Decisions and uncertainty

User chose downloadable package + Project JSON on 2026-10-21. MCP deferred: it would require transport/hosting beyond a portable static artifact; no implementation or external feasibility claim is needed for this delivery. Public docs alone lose offline self-containment. No material questions remain. Test whether installed zod structural conversion accepts refinements; document limitations rather than weakening runtime validation.
