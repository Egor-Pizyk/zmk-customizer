# ZMK Customizer

Static browser application for custom keyboard design and ready-to-build ZMK v0.3 shields. No backend.

## Required startup context

Read these imports once per session unless already supplied in full by the client. Follow-up messages do not restart startup reading. Reuse unchanged rules still available in context; reopen changed documents or recover missing applicable sections after compaction. Claude Code expands `@path`; other agents open the same files manually. Linked documents follow the routing below.

@docs/product.md
@docs/principles.md
@docs/workflow.md
@docs/agent-rules.md

## Critical implementation constraints

- Target pinned ZMK v0.3.0; never offer or emit main-only features. Read relevant verified `docs/zmk/` notes before changing ZMK syntax; do not generate it from memory.
- One serializable `Project`; domain operations are pure and immutable. Schema changes require migrations and old-file tests.
- Business rules belong in domain, ZMK facts in catalog, untrusted parsing in storage. UI renders and dispatches. Generators are pure and deterministic.
- Preserve keyboard access, undo/redo and existing user data. New runtime dependencies require an ADR.

These are reminders; the routed documents own the detailed rules.

## Load context for the task

Before editing, identify the change type using `docs/workflow.md`, inspect the working tree, and resolve the intended feature from the user request and Spec Kit feature resolver. Check the resolved directory against the task; do not assume a remembered feature or branch is current.

Read all matching rows before working in that area. Conditional reading is mandatory when its trigger applies; expand the set if the task crosses boundaries.

| Task / area | Required context |
|---|---|
| Start/resume work, create a feature/branch; finish work, commit, push, open/merge PRs or release | `docs/guidelines/git-flow.md` (review at startup and delivery; reuse unchanged context) |
| Find files or feature ownership | `docs/repository-map.md`, `specs/README.md`; relevant roadmap entry for scope |
| Plan or change production code | `docs/architecture.md`, `docs/folder-structure.md`, `docs/tooling.md` |
| Implement existing feature work | Relevant `spec.md`, `plan.md`, `tasks.md` and contracts; other artifacts only when cited or needed |
| Domain / TypeScript code | `docs/domain-model.md`, `docs/guidelines/code-quality/typescript.md`, `control-flow.md`, and both `naming/*.md` in that directory |
| Errors, validation, storage / migrations | Above code-quality rules, `docs/guidelines/code-quality/observability.md`, relevant storage and compatibility contracts |
| Frontend / interface design, implementation or review | Before/after UI workflow in `docs/workflow.md` and review evidence in `docs/testing.md` |
| React / UI behavior | Code-quality rules, `docs/guidelines/frontend/react.md`, `accessibility.md`, `admin-ui.md` |
| Styles / design tokens | `docs/guidelines/frontend/tailwind.md`, `accessibility.md`, existing `src/styles.css` tokens |
| ZMK output / catalog facts | `docs/zmk/README.md`, relevant reference pages, generator/catalog contracts and independent fixtures |
| Tests or code verification | `docs/testing.md`, `docs/commands.md` |
| Dependencies / infrastructure / tooling | `docs/tooling.md`, `docs/commands.md`, relevant ADRs |
| Change a project decision | `docs/decisions/README.md` and affected ADRs |

Do not recursively load all specs, ADRs, guidelines, templates or skills. Load a Spec Kit skill only for its stage. `.claude/rules` provides path-scoped adapters to the same guidelines; agents without this mechanism follow the table explicitly.

## Rule ownership

`docs/principles.md` owns principles; `docs/workflow.md` owns SDD and completion gates; `docs/architecture.md` owns dependency rules; `docs/folder-structure.md` owns placement; guidelines own implementation conventions. ADRs explain decisions and their history; current normative rules live in the owning documents. `tsconfig.json` owns the exact module alias registry.

Feature specs define behavior; plans define its implementation; tasks track execution; verification records evidence. When sources disagree, do not silently choose whichever permits the change: preserve the user's explicit scope, resolve the conflict in the owning documents, and update affected derived artifacts. `.specify/memory/constitution.md` is a compact Spec Kit projection of project principles, not a separate policy source.
