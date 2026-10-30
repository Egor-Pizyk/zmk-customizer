# ZMK Customizer

Static browser application for custom keyboard design and ready-to-build ZMK v0.3 shields. No backend.

## Lazy context loading

This file is the complete startup context. Do not automatically import or read other
documents at session start. Inspect the request and working tree first; load only the
sections needed for the next decision or edit. The routing table below is a lookup,
not a batch reading checklist. Applicable rules still apply when their area is touched.

Reuse unchanged context across follow-ups. After compaction, recover only missing
applicable sections. Follow a link only when it resolves a concrete question; do not
recursively load related documents, every guideline, ADR or feature artifact.

## Critical implementation constraints

- Target pinned ZMK v0.3.0; never offer or emit main-only features. Read relevant verified `docs/zmk/` notes before changing ZMK syntax; do not generate it from memory.
- One serializable `Project`; domain operations are pure and immutable. Schema changes require migrations and old-file tests.
- Business rules belong in domain, ZMK facts in catalog, untrusted parsing in storage. UI renders and dispatches. Generators are pure and deterministic.
- Preserve keyboard access, undo/redo and existing user data. New runtime dependencies require an ADR.

These are reminders; the routed documents own the detailed rules.

## Context lookup

For documentation/analysis, edit or report directly and check links/instruction
consistency; no feature resolution or product test run is needed unless feature
ownership or product behavior is in question. For feature work, resolve the intended
feature with the installed Spec Kit resolver and compare it with the request before
editing feature artifacts or code. Do not trust remembered branches or persisted
selection alone.

| Question / next action | Load the relevant section when needed |
|---|---|
| Product purpose or principle is unclear | `docs/product.md`, `docs/principles.md` |
| Choose change route or completion gate | `docs/workflow.md` |
| Agent execution, resumption or evidence handling | `docs/agent-rules.md` |
| Create/switch branch, inspect feature dependencies, commit/push/PR/release | `docs/guidelines/git-flow.md` |
| Locate files or establish feature ownership | `docs/repository-map.md`, `specs/README.md`; affected roadmap entry |
| Change existing feature behavior | Affected requirements/contracts and task in its feature; relevant plan section before implementation |
| Decide module boundary or file placement | `docs/architecture.md`, `docs/folder-structure.md` |
| Change domain / TypeScript | Relevant `docs/domain-model.md` section and applicable TypeScript/control-flow/naming rules under `docs/guidelines/code-quality/` |
| Change errors, validation, storage or schema | Applicable code-quality/observability rules; affected storage/migration contracts |
| Change React behavior or controls | Applicable `docs/guidelines/frontend/react.md`, `accessibility.md`, `admin-ui.md` sections |
| Change styles or tokens | `docs/guidelines/frontend/tailwind.md`; relevant existing `src/styles.css` tokens |
| Change ZMK output/catalog facts | Relevant verified `docs/zmk/` page, affected generator/catalog contract and independent fixture; use its README to locate the page if needed |
| Choose/run checks | `docs/testing.md`, `docs/commands.md`: behavior matrix first; static `check` after a complete module/import flow; all units at task completion; focus only after a full-unit failure; full E2E only at feature/final completion. Pre-commit/check:changed are static-only |
| Change dependencies, infrastructure or tooling | Relevant `docs/tooling.md`, `docs/commands.md` sections and affected decision |
| Change an accepted project decision | `docs/decisions/README.md` and affected ADR |

Load a Spec Kit skill only for its current stage. Path-scoped client adapters, when
present, use this same lazy lookup; they must not trigger broad document imports.

## Rule ownership

`docs/principles.md` owns principles; `docs/workflow.md` owns SDD and completion gates; `docs/architecture.md` owns dependency rules; `docs/folder-structure.md` owns placement; guidelines own implementation conventions. ADRs explain decisions and their history; current normative rules live in the owning documents. `tsconfig.json` owns the exact module alias registry.

Feature specs define behavior; plans define its implementation; tasks track execution; verification records evidence. When sources disagree, do not silently choose whichever permits the change: preserve the user's explicit scope, resolve the conflict in the owning documents, and update affected derived artifacts. `.specify/memory/constitution.md` is a compact Spec Kit projection of project principles, not a separate policy source.
