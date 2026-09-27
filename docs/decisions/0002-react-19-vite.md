# 0002. React 19 + Vite

Status: Accepted
Date: 2026-09-27

## Context
The UI is several interactive editors (layout canvas, matrix grid, keymap, settings, preview) over one state object. Business rules live outside the UI (0003), so the UI library only renders and dispatches.

## Decision
React 19 with function components only; Vite for dev server and production build, output in `dist/`. TypeScript strict.

## Consequences
- No router, state library or component kit is approved; each needs its own ADR (0009).
- Vite's config and plugins are tooling, not runtime dependencies.
- UI tests only where interaction logic is non-trivial; the domain carries the test weight.
