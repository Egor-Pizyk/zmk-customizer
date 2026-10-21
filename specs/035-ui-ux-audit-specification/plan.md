# Research Plan: UI/UX audit and remediation specification

**Branch**: `feature/035-ui-ux-audit-specification` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

## Summary

Execute an evidence-based audit and prepare a 036 handoff. The user explicitly restricts this stage to research: no application, test, generator, catalog, schema, dependency or infrastructure changes. Only 035 research documents and closely related status links may change.

## Relevant context

- `docs/product.md`, `docs/principles.md`, `docs/workflow.md`, `docs/agent-rules.md`, `docs/guidelines/git-flow.md`.
- `docs/repository-map.md`, `specs/README.md`, `docs/roadmap.md` (035/036 and all 21 reports).
- `docs/architecture.md`, `docs/folder-structure.md`, `docs/tooling.md`, `docs/testing.md`, `docs/commands.md`.
- `.agents/skills/ui-ux-pro-max/SKILL.md`, `docs/guidelines/frontend/accessibility.md`, `admin-ui.md`; source tokens in `src/styles.css`.
- Read the relevant owning spec/contracts for each finding; do not load all historical specifications. Canvas/shell owners 001/003, geometry 012, wiring 013/032/033, encoder 019, Bindings 004, package 034.
- `playwright.config.ts`, `tests/e2e/helpers.ts`, existing browser journeys and `infra/compose.e2e.yaml` define isolated browser execution.

## Technical context

Existing React/Tailwind static app, pure domain operations and storage trust boundary remain unchanged. Use Docker's existing browser-capable image and production build. Read-only source inspection locates ownership; native Playwright mouse/keyboard/file chooser interactions reproduce user outcomes. External temporary audit scripts and ignored screenshots/observations are investigation tools, not committed tests. No runtime dependency additions, mutations or production patches.

## Scope and preserved contracts

Audit all areas named by FR-002, with explicit results or gaps. Capture current rendered results where possible and preserve source/user-report distinctions elsewhere. The 21 reported items retain their IDs, including unconfirmed reports and requested new capabilities. No fix is authorized by a finding or proposed acceptance. Keep existing data, manual wiring, Undo/Redo, deterministic export and pinned ZMK target intact.

## Constitution check

Before and after research design: PASS. No application behavior, architectural dependency, project schema, ZMK syntax, runtime network or dependency change. Isolated contexts contain disposable projects only; imports use the actual application. Source/search evidence cannot establish rendered usability. Unavailable native OS/speech/zoom checks remain limitations. No ADR needed.

## Design and ownership

Research artifacts only: `research.md` records method/decisions, `coverage.md` accounts for review areas and environments, `findings.md` contains the single report → finding → owner → acceptance/check mapping, and `verification.md` remains the single command/evidence journal. `tasks.md` tracks execution. No application data model or new interface contract is introduced, so separate data-model/contracts documents would duplicate the finding format. A short quickstart describes rerunning existing journeys and reading evidence.

## Verification strategy

Use actual production rendering in an isolated Chromium context, predictable imported 2×2 projects, actual keyboard/mouse input and read-only storage/geometry observations. Compare unsaved previews with applied data. Review screenshots in supported themes and sizes. Run selected existing E2E journeys directly for research because changed-check selection for prose does not exercise the audited application; justify commands in the journal. No new regression tests or fixes in this stage. Existing test success is bounded to its scenarios.

Native 200% browser zoom, OS keyboard/clipboard and screen-reader speech are separate manual checks, not emulated by viewport changes. Run `npm run check:changed` for final documentation; inspect the diff and assert no code paths changed. Update the existing draft PR; no auto-merge or CI polling.

## Supporting artifacts

[Research](research.md), [quickstart](quickstart.md), [tasks](tasks.md), [coverage](coverage.md), [findings](findings.md), [journal](verification.md).

## Decisions and uncertainty

Research delegation is authorized by the planning skill's research phase; delegated agents perform read-only source/contract inspection. Runtime checks stay with the coordinating agent. No new visual direction is requested: use existing semantic tokens and density, not a generated design system. Actual source/runtime evidence may show that an issue is a requested contract change rather than a regression. Material behavior choices remain explicit in the handoff and block the affected 036 implementation until resolved. Unperformed checks prevent claiming complete manual audit acceptance.
