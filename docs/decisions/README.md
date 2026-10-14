# Architecture decisions

One file per decision: `NNNN-short-title.md`, ≤30 lines, never rewritten after acceptance. To change a decision, add a new ADR that supersedes the old one and set the old one's status to `Superseded by NNNN`.

A new runtime dependency always needs an ADR (docs/tooling.md). Undecided questions live in `docs/roadmap.md` → "Open decisions" until an ADR settles them.

## Template

```
# NNNN. Title

Status: Accepted | Superseded by NNNN
Date: YYYY-MM-DD

## Context
What forces the decision. Facts, constraints, links.

## Decision
What we do. One paragraph or a short list.

## Consequences
What becomes easier, what becomes harder, what we must now keep true.
```

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-static-spa-no-backend.md) | Static single-page app, no backend | Accepted |
| [0002](0002-react-19-vite.md) | React 19 + Vite | Accepted |
| [0003](0003-single-project-state.md) | Single serializable Project state, pure operations, versioned migrations | Accepted |
| [0004](0004-oxlint-oxfmt.md) | oxlint + oxfmt instead of ESLint/Prettier | Accepted |
| [0005](0005-docker-makefile.md) | Docker for dev and prod, Makefile for non-Node commands | Accepted |
| [0006](0006-spec-kit.md) | Spec-Driven Development with GitHub Spec Kit | Accepted |
| [0007](0007-golden-file-tests.md) | Golden-file tests of generators against upstream ZMK shields | Accepted |
| [0008](0008-svg-layout-editor.md) | SVG layout editor with keyboard-accessible table | Accepted |
| [0009](0009-runtime-dependencies.md) | Runtime dependencies limited to react, zod, fflate | Accepted |
| [0010](0010-target-zmk-v0-3.md) | Generated output targets ZMK v0.3 | Accepted |
| [0011](0011-tailwind-design-system.md) | Tailwind CSS v4 as the design system | Accepted |
| [0012](0012-behavior-testing.md) | Real React/DOM behavior tests and regression coverage floors | Accepted |

- [0013 — Development architecture parser](0013-architecture-parser.md)

- [0014 — Real browser behavioral testing](0014-browser-behavior-testing.md)

- [0015 — Module public APIs and exact import aliases](0015-module-public-apis.md)

- [0016 — Nested module APIs, infrastructure and agent context](0016-nested-modules-and-agent-context.md)

- [0017 — Separate UI logic and React components](0017-ui-logic-and-components.md)
