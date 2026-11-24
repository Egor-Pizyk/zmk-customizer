# Architecture decisions

Keep short rationale for durable architecture/dependency choices. New runtime dependencies need a brief decision; ordinary fixes and features do not need planning artifacts or approval stages. AGENTS.md and the current owning docs define implementation policy. Old workflow decisions have been retired.

| # | Decision | Status |
|---|---|---|
| [0001](0001-static-spa-no-backend.md) | 0001. Static single-page app, no backend | Accepted |
| [0002](0002-react-19-vite.md) | 0002. React 19 + Vite | Accepted |
| [0003](0003-single-project-state.md) | 0003. Single serializable Project state, pure operations, versioned migrations | Accepted |
| [0004](0004-oxlint-oxfmt.md) | 0004. oxlint + oxfmt instead of ESLint/Prettier | Accepted |
| [0005](0005-docker-makefile.md) | 0005. Docker for dev and prod, Makefile for non-Node commands | Accepted |
| [0007](0007-golden-file-tests.md) | 0007. Golden-file tests of generators against upstream ZMK shields | Accepted |
| [0008](0008-svg-layout-editor.md) | 0008. SVG layout editor with keyboard-accessible table | Partially superseded by 0023 (Schematic scene ownership only; SVG and accessible alternatives retained) |
| [0009](0009-runtime-dependencies.md) | 0009. Runtime dependencies limited to react, zod, fflate | Partially superseded by 0023 (@joint/core 4.3.3 in the Schematic adapter only) |
| [0010](0010-target-zmk-v0-3.md) | 0010. Generated output targets ZMK v0.3 | Accepted |
| [0011](0011-tailwind-design-system.md) | 0011. Tailwind CSS v4 as the design system | Accepted |
| [0012](0012-behavior-testing.md) | 0012. Test observable behavior with real React and DOM | Partially superseded by 0026 (test selection and coverage floors) |
| [0013](0013-architecture-parser.md) | 0013: Parser for repository architecture gates | accepted. Date: 2026-10-12. |
| [0014](0014-browser-behavior-testing.md) | 0014: Real browser behavioral testing | Accepted |
| [0015](0015-module-public-apis.md) | 0015: Module public APIs and exact import aliases | Superseded by 0016. Date: 2026-10-13. |
| [0016](0016-nested-modules-and-agent-context.md) | 0016: Nested module APIs, infrastructure and agent context | Partially superseded by 0027 (agent context only); module APIs and infrastructure remain accepted |
| [0017](0017-ui-logic-and-components.md) | 0017: Separate UI logic and React components | Accepted |
| [0022](0022-mechanical-technology-evaluation.md) | 0022. Evidence-based mechanical technology selection | Accepted |
| [0023](0023-jointjs-schematic-projection.md) | 0023. JointJS as a disposable Schematic projection | Accepted |
| [0026](0026-business-risk-testing.md) | 0026. Business-risk test selection and aggregate coverage | Accepted |
| [0027](0027-direct-development.md) | 0027. Direct implementation with focused feedback | Accepted |
| [0028](0028-github-publishing.md) | 0028. Optional GitHub publishing | Accepted |
