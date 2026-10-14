# ZMK Customizer

Static browser application for custom keyboard design and ready-to-build ZMK v0.3 shields. No backend.

## Required startup context

Read every file explicitly imported below before starting work. These `@path` imports are expanded by Claude Code; agents without import expansion must open each listed file themselves. AGENTS.md and these documents form the mandatory project instructions. All guidelines and ADRs are mandatory startup context, even when their path-scoped implementation rules do not apply to the current task.

@docs/product.md
@docs/domain-model.md
@docs/architecture.md
@docs/tooling.md
@docs/commands.md
@docs/workflow.md
@docs/principles.md
@docs/agent-rules.md
@docs/repository-map.md
@docs/folder-structure.md
@docs/testing.md
@docs/guidelines/code-quality/control-flow.md
@docs/guidelines/code-quality/naming/functions.md
@docs/guidelines/code-quality/naming/variables.md
@docs/guidelines/code-quality/observability.md
@docs/guidelines/code-quality/typescript.md
@docs/guidelines/frontend/accessibility.md
@docs/guidelines/frontend/admin-ui.md
@docs/guidelines/frontend/react.md
@docs/guidelines/frontend/tailwind.md
@docs/decisions/README.md
@docs/decisions/0001-static-spa-no-backend.md
@docs/decisions/0002-react-19-vite.md
@docs/decisions/0003-single-project-state.md
@docs/decisions/0004-oxlint-oxfmt.md
@docs/decisions/0005-docker-makefile.md
@docs/decisions/0006-spec-kit.md
@docs/decisions/0007-golden-file-tests.md
@docs/decisions/0008-svg-layout-editor.md
@docs/decisions/0009-runtime-dependencies.md
@docs/decisions/0010-target-zmk-v0-3.md
@docs/decisions/0011-tailwind-design-system.md
@docs/decisions/0012-behavior-testing.md
@docs/decisions/0013-architecture-parser.md
@docs/decisions/0014-browser-behavior-testing.md
@docs/decisions/0015-module-public-apis.md
@docs/decisions/0016-nested-modules-and-agent-context.md
@docs/decisions/0017-ui-logic-and-components.md

## Feature context on demand

@specs/README.md

The feature index links each specification directory. Read relevant feature artifacts when needed. Do not import all specs, `.specify/` templates or Spec Kit skills at startup. Workflow rules live in the mandatory docs/workflow.md import above.
